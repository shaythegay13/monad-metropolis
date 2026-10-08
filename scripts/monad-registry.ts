import { readFile, writeFile, access } from "node:fs/promises";
import { keccak256, getAddress } from "ethers";
import { alchemyRpc, alchemyUrl, assertTestnet, hex, PublicationError } from "../packages/publication/src/rpc.js";
import { deployer, sendTestnetTransaction, assertControlledAgent, demoRegistration } from "../packages/publication/src/writer.js";
import { IDENTITY_REGISTRY, identityAbi, registryAbi } from "../packages/publication/src/abi.js";
import { compileRegistry } from "../packages/publication/src/compile.js";
import { verifyPublishedPassport, type RegistryTrust } from "../packages/publication/src/verify.js";
import { preparePublication } from "../packages/publication/src/publish.js";
import { identityConfig } from "../packages/identity/src/config.js";
import { resolveAgent, createRpc } from "../packages/identity/src/resolver.js";
import { createEnvioProvider, retrieveAgentActivity } from "../packages/activity/src/index.js";
import { generateAgentPassport } from "../packages/passport/src/generate.js";
import { canonicalJsonStringify } from "../packages/verification/src/canonical.js";

// All primary live operations use Alchemy. Public RPC exists only in explicit cross-check mode.
const secrets=[process.env.ENVIO_API_TOKEN,process.env.ALCHEMY_MONAD_TESTNET_RPC_URL,process.env.DEPLOYER_PRIVATE_KEY].filter(Boolean) as string[];
function serialize(value:unknown){const text=JSON.stringify(value,(_,v)=>typeof v==="bigint"?v.toString():v,2)+"\n";
  if(secrets.some(s=>text.includes(s)))throw new PublicationError("refusing_secret_in_artifact");return text;}
async function save(path:string,value:unknown){await writeFile(path,serialize(value),{flag:"wx"});}
async function load(path:string){return JSON.parse(await readFile(path,"utf8"));}
async function absent(path:string){try{await access(path);}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return;throw e;}throw new PublicationError("output_exists_no_write_attempted");}

async function main(){
  const [mode,output,...args]=process.argv.slice(2);
  if(!output||!["preflight","register","set-uri","deploy","capture","publish","verify","cross-check"].includes(mode))
    throw new PublicationError("usage_monad_registry_mode_new_output_then_arguments");
  await absent(output);
  const rpc=alchemyRpc();await assertTestnet(rpc);
  if(mode==="preflight"){
    const wallet=deployer(),block=hex(await rpc("eth_blockNumber",[]));
    const code=String(await rpc("eth_getCode",[IDENTITY_REGISTRY,block]));if(code==="0x")throw new PublicationError("identity_registry_missing");
    const balance=BigInt(hex(await rpc("eth_getBalance",[wallet.address,block])));
    if(balance===0n)throw new PublicationError("insufficient_testnet_MON");
    const envio=await createEnvioProvider(process.env.ENVIO_API_TOKEN,"json");const height=await envio.getHeight();
    await envio.get({fromBlock:height-1,toBlock:height,subjectWallet:wallet.address.toLowerCase()});
    const proof={checkedAt:new Date().toISOString(),chainId:10143,provider:"Alchemy",deployer:wallet.address,balanceWei:balance.toString(),block:BigInt(block).toString(),
      identityRegistry:IDENTITY_REGISTRY,identityRuntimeCodeHash:keccak256(code),envioAuthenticatedQuery:true};
    await save(output,proof);console.log(serialize(proof));return;
  }
  if(mode==="verify"||mode==="cross-check"){
    const [passportFile,deploymentFile]=args;if(!passportFile||!deploymentFile)throw Error();
    const bundle=await load(passportFile),deployment=await load(deploymentFile),trust=deployment.trust as RegistryTrust;
    const readRpc=mode==="verify"?rpc:createRpc("https://testnet-rpc.monad.xyz");
    const verification=await verifyPublishedPassport(bundle,trust,readRpc);
    let crossCheck:unknown;
    if(mode==="cross-check"){
      const publication=await load(args[2]);
      const receipts=[];
      for(const hash of [deployment.submission.transactionHash,publication.submission.transactionHash]){
        const tx=await readRpc("eth_getTransactionByHash",[hash]) as Record<string,unknown>;
        const receipt=await readRpc("eth_getTransactionReceipt",[hash]) as Record<string,unknown>;
        if(!tx||tx.hash!==hash||receipt?.status!=="0x1")throw Error();
        receipts.push({transactionHash:hash,from:tx.from,to:tx.to,blockNumber:BigInt(String(receipt.blockNumber)).toString(),blockHash:receipt.blockHash,status:receipt.status});
      }
      const identity=await resolveAgent(bundle.payload.subject.agentId,identityConfig("monad-testnet"));
      if(identity.agentWallet!==bundle.payload.subject.agentWallet||identity.ownerAddress!==bundle.payload.subject.ownerAddress)throw Error();
      crossCheck={provider:"Independent public Monad RPC",receipts,identity};
    }
    await save(output,{verification,...(crossCheck?{crossCheck}:{})});console.log(serialize(verification));
    if(verification.status!=="verified")process.exitCode=1;return;
  }
  if(mode==="capture"){
    const [agentId,start,end,generatedAt]=args;
    if(!agentId||!/^\d+$/.test(start??"")||!/^\d+$/.test(end??""))throw Error();
    await absent(`${output}.passport.json`);
    const identity=await resolveAgent(agentId,identityConfig("monad-testnet",alchemyUrl()));
    await assertControlledAgent(rpc,agentId,deployer().address);
    const provider=await createEnvioProvider(process.env.ENVIO_API_TOKEN,"json");
    const activity=await retrieveAgentActivity(identity,provider,{fromBlock:Number(start),toBlock:Number(end)});
    if(activity.state!=="retrieved"||activity.provenance.coverageStatus!=="complete_for_query")throw new PublicationError("capture_incomplete_no_passport_written");
    // Capture orchestrator supplies explicit metadata after retrieval; pure M3 generator is unchanged.
    const bundle=generateAgentPassport(identity,activity,{generatedAt:generatedAt??new Date().toISOString(),passportVersion:1});
    await save(output,{fixtureKind:"real controlled-agent captured provider fixture",identity,...activity});
    const canonical=canonicalJsonStringify(bundle)+"\n";if(secrets.some(s=>canonical.includes(s)))throw Error();
    await writeFile(`${output}.passport.json`,canonical,{flag:"wx"});
    console.log(serialize({agentId,evidenceCount:activity.evidence.length,coverage:activity.provenance.coverageStatus,digest:bundle.integrity.digest}));return;
  }
  await absent(`${output}.submitted.json`);
  const wallet=deployer();
  const send=async(data:string,to?:string)=>sendTestnetTransaction(rpc,wallet,data,to,s=>save(`${output}.submitted.json`,s));
  if(mode==="register"){
    const result=await send(identityAbi.encodeFunctionData("register()",[]),IDENTITY_REGISTRY);
    const events=(result.receipt.logs as {address:string;topics:string[];data:string}[])
      .filter(l=>l.address.toLowerCase()===IDENTITY_REGISTRY).map(l=>{try{return identityAbi.parseLog(l);}catch{return null;}});
    const registered=events.find(e=>e?.name==="Registered");if(!registered||registered.args.owner.toLowerCase()!==wallet.address.toLowerCase())throw Error();
    const agentId=registered.args.agentId.toString();await assertControlledAgent(rpc,agentId,wallet.address);
    await save(output,{...result,agentId,identityRegistry:IDENTITY_REGISTRY});console.log(serialize({agentId,transactionHash:result.submission.transactionHash}));return;
  }
  if(mode==="set-uri"){
    const [agentId]=args;if(!agentId)throw Error();await assertControlledAgent(rpc,agentId,wallet.address);
    const metadata=demoRegistration(agentId);
    const result=await send(identityAbi.encodeFunctionData("setAgentURI",[agentId,metadata.agentUri]),IDENTITY_REGISTRY);
    const identity=await resolveAgent(agentId,identityConfig("monad-testnet",alchemyUrl()));
    if(identity.agentWallet!==wallet.address.toLowerCase()||identity.ownerAddress!==wallet.address.toLowerCase()||
      identity.agentUri!==metadata.agentUri||identity.registration.status!=="retrieved")throw new PublicationError("controlled_identity_resolution_failed");
    await save(output,{...result,...metadata,identity});console.log(serialize({agentId,transactionHash:result.submission.transactionHash,registration:"retrieved"}));return;
  }
  if(mode==="deploy"){
    const build=compileRegistry();const result=await send(build.bytecode+registryAbi.encodeDeploy([IDENTITY_REGISTRY]).slice(2));
    const address=String(result.receipt.contractAddress);
    if(getAddress(address)!==result.submission.expectedContractAddress)throw Error();
    const code=String(await rpc("eth_getCode",[address,String(result.receipt.blockNumber)]));
    let expected=build.deployedBytecode.slice(2);
    for(const slots of Object.values(build.immutableReferences))for(const slot of slots){const value=IDENTITY_REGISTRY.slice(2).padStart(slot.length*2,"0");expected=expected.slice(0,slot.start*2)+value+expected.slice((slot.start+slot.length)*2);}
    if(code.toLowerCase()!==`0x${expected}`.toLowerCase())throw new PublicationError("deployed_runtime_differs_from_compiled_source");
    const trust:RegistryTrust={chainId:10143,address,identityRegistry:IDENTITY_REGISTRY,runtimeCodeHash:keccak256(code)};
    await save(output,{...result,trust,build:{compilerVersion:build.compilerVersion,evmVersion:build.evmVersion,optimizerRuns:build.optimizerRuns,sourceSha256:build.sourceSha256}});
    console.log(serialize({address,transactionHash:result.submission.transactionHash,runtimeCodeHash:trust.runtimeCodeHash}));return;
  }
  if(mode==="publish"){
    const [passportFile,deploymentFile]=args;if(!passportFile||!deploymentFile)throw Error();
    const bundle=await load(passportFile),deployment=await load(deploymentFile);
    const prepared=await preparePublication(bundle,deployment.trust,rpc,wallet.address,"");
    const result=await send(prepared.data,deployment.trust.address);
    const verification=await verifyPublishedPassport(bundle,deployment.trust,rpc);
    await save(output,{...result,agentId:prepared.agentId,version:prepared.version,profileHash:prepared.profileHash,contentUri:"",verification});
    console.log(serialize({transactionHash:result.submission.transactionHash,verification}));if(verification.status!=="verified")process.exitCode=1;
  }
}
main().catch(e=>{console.error(JSON.stringify({code:e instanceof PublicationError?e.code:"m4_operation_failed_no_secret_details",message:"Inspect any public submission record before retrying a write."}));process.exitCode=1;});
