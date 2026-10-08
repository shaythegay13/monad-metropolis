import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Wallet, keccak256, ZeroAddress, ZeroHash, Transaction } from "ethers";
import { verifyPublishedPassport, type RegistryTrust } from "../packages/publication/src/verify.js";
import { alchemyUrl, assertTestnet } from "../packages/publication/src/rpc.js";
import { deployer, sendTestnetTransaction, demoRegistration } from "../packages/publication/src/writer.js";
import { preparePublication } from "../packages/publication/src/publish.js";
import { IDENTITY_REGISTRY, identityAbi, registryAbi } from "../packages/publication/src/abi.js";
import { computePayloadDigest } from "../packages/verification/src/digest.js";
import type { Rpc } from "../packages/identity/src/resolver.js";
const original=JSON.parse(readFileSync('fixtures/real/monad-m3/agent-2-passport-v2.json','utf8'));
const address=`0x${"33".repeat(20)}`,blockHash=`0x${"44".repeat(32)}`,code="0x60006000";
const trust:RegistryTrust={address,runtimeCodeHash:keccak256(code),identityRegistry:IDENTITY_REGISTRY,chainId:10143};
function mock(options:{missing?:boolean;hash?:string;wallet?:string;identity?:string;code?:string;reorg?:boolean}={}):Rpc {
 return async(method,params)=>{
  if(method==='eth_chainId')return '0x279f';
  if(method==='eth_getBlockByNumber')return {number:'0x123',hash:options.reorg&&params[0]!=='latest'?`0x${'55'.repeat(32)}`:blockHash};
  if(method==='eth_getCode')return options.code??code;
  if(method==='eth_call'){
    const tx=params[0] as {to:string;data:string};
    if(tx.to===IDENTITY_REGISTRY)return identityAbi.encodeFunctionResult('getAgentWallet',[options.wallet??original.payload.subject.agentWallet]);
    const call=registryAbi.parseTransaction({data:tx.data})!;
    if(call.name==='identityRegistry')return registryAbi.encodeFunctionResult(call.name,[options.identity??IDENTITY_REGISTRY]);
    if(call.name==='latestVersion')return registryAbi.encodeFunctionResult(call.name,[0]);
    if(call.name==='getPassportVersion')return registryAbi.encodeFunctionResult(call.name,[[options.missing?ZeroHash:options.hash??`0x${original.integrity.digest}`,'',options.missing?ZeroAddress:original.payload.subject.agentWallet,123,100]]);
  }
  throw Error('Unexpected request');
 };
}
test('M4 verifier: independently matches published SHA-256 without generation',async()=>{
 const r=await verifyPublishedPassport(original,trust,mock());assert.equal(r.status,'verified');assert.equal(r.localIntegrityValid,true);assert.equal(r.publicationFound,true);assert.equal(r.publishedHashMatches,true);assert.equal(r.publisherMatchesCurrentAgentWallet,true);assert.equal(r.version,'1');
});
test('M4 verifier: tampered local bundle never requests network',async()=>{
 const b=structuredClone(original);b.payload.metrics[0].value=99;
 const r=await verifyPublishedPassport(b,trust,async()=>{assert.fail('network called');});assert.equal(r.status,'invalid_local');
});
test('M4 verifier: coherent edit and rehash passes local but fails published digest',async()=>{
 const b=structuredClone(original);b.payload.metrics[0].value=99;b.payload.observations.find((o:{metricIds:string[]})=>o.metricIds[0]===b.payload.metrics[0].metricId).value=99;b.integrity.digest=computePayloadDigest(b.payload);
 const r=await verifyPublishedPassport(b,trust,mock());assert.equal(r.localIntegrityValid,true);assert.equal(r.publicationFound,true);assert.equal(r.publishedHashMatches,false);assert.equal(r.status,'hash_mismatch');
});
test('M4 verifier: missing publication differs from provider failure',async()=>{
 const absent=await verifyPublishedPassport(original,trust,mock({missing:true}));assert.equal(absent.status,'not_found');assert.equal(absent.publicationFound,false);
 const failed=await verifyPublishedPassport(original,trust,async()=>{throw Error('sensitive provider details');});assert.equal(failed.status,'provider_error');assert.equal(failed.publicationFound,null);assert.ok(!JSON.stringify(failed).includes('sensitive'));
});
for(const [name,options] of [['empty code',{code:'0x'}],['wrong runtime code',{code:'0x6001'}],['wrong identity dependency',{identity:address}]] as const)
test(`M4 verifier: rejects ${name}`,async()=>{assert.equal((await verifyPublishedPassport(original,trust,mock(options))).status,'invalid_registry');});
test('M4 verifier: rejects wrong chain and changed snapshot',async()=>{
 assert.equal((await verifyPublishedPassport(original,trust,async()=> '0x1')).status,'provider_error');
 assert.equal((await verifyPublishedPassport(original,trust,mock({reorg:true}))).status,'provider_error');
});
test('M4 verifier: wallet rotation preserves historical publication, separates current wallet',async()=>{
 const r=await verifyPublishedPassport(original,trust,mock({wallet:address}));assert.equal(r.status,'verified');assert.equal(r.publisherMatchesCurrentAgentWallet,false);
});
test('M4 config: exact Alchemy testnet host and secret-free errors',()=>{
 assert.equal(alchemyUrl({ALCHEMY_MONAD_TESTNET_RPC_URL:'https://monad-testnet.g.alchemy.com/v2/synthetic'}),'https://monad-testnet.g.alchemy.com/v2/synthetic');
 for(const value of [undefined,'https://eth-mainnet.g.alchemy.com/v2/synthetic','http://monad-testnet.g.alchemy.com/v2/synthetic','https://evil.test/v2/synthetic','https://monad-testnet.g.alchemy.com/v2/synthetic?key=secret'])assert.throws(()=>alchemyUrl({ALCHEMY_MONAD_TESTNET_RPC_URL:value}),e=>e instanceof Error&&!e.message.includes('synthetic'));
 assert.throws(()=>deployer({DEPLOYER_PRIVATE_KEY:'invalid-secret'}),e=>e instanceof Error&&!e.message.includes('invalid-secret'));
});
test('M4 registration: honest metadata binds numeric ID and registry, no service claims',()=>{
 const r=demoRegistration('55');assert.deepEqual(r.registration.services,[]);assert.equal(r.registration.active,false);assert.equal(r.registration.registrations[0].agentId,55);
 assert.deepEqual(JSON.parse(Buffer.from(r.agentUri.split(',')[1],'base64').toString()),r.registration);
});
test('M4 writer: wrong chain fails before signing/broadcasting',async()=>{
 let calls=0;await assert.rejects(sendTestnetTransaction(async method=>{calls++;assert.equal(method,'eth_chainId');return '0x1';},Wallet.createRandom(),'0x',address,async()=>assert.fail('journal')));assert.equal(calls,1);
});
test('M4 writer: signed chain 10143, bounded fee, public journal before broadcast',async()=>{
 const wallet=Wallet.createRandom();let journal=false,txHash='';
 const rpc:Rpc=async(method,params)=>{
  if(method==='eth_chainId')return '0x279f';if(method==='eth_estimateGas')return '0x5208';if(method==='eth_gasPrice')return '0x3b9aca00';if(method==='eth_getBalance')return '0xde0b6b3a7640000';if(method==='eth_getTransactionCount')return '0x0';
  if(method==='eth_sendRawTransaction'){assert.equal(journal,true);const tx=Transaction.from(String(params[0]));assert.equal(tx.chainId,10143n);assert.equal(tx.from,wallet.address);txHash=keccak256(String(params[0]));return txHash;}
  if(method==='eth_getTransactionReceipt')return {transactionHash:txHash,status:'0x1'};throw Error();
 };
 const r=await sendTestnetTransaction(rpc,wallet,'0x',address,async s=>{assert.ok(!JSON.stringify(s).includes(wallet.privateKey));journal=true;});assert.equal(r.submission.transactionHash,txHash);
});
for(const kind of ['fee','balance','journal'] as const)test(`M4 writer: ${kind} failure prevents broadcast`,async()=>{
 const rpc:Rpc=async method=>{if(method==='eth_chainId')return '0x279f';if(method==='eth_estimateGas')return kind==='fee'?'0xffffffffffff':'0x5208';if(method==='eth_gasPrice')return '0x3b9aca00';if(method==='eth_getBalance')return kind==='balance'?'0x0':'0xde0b6b3a7640000';if(method==='eth_getTransactionCount')return '0x0';assert.fail('broadcast attempted');};
 await assert.rejects(sendTestnetTransaction(rpc,Wallet.createRandom(),'0x',address,async()=>{throw Error('disk failure');}));
});
test('M4 publisher: no Agent 2 impersonation, correct digest uses bytes32 without rehash',async()=>{
 await assert.rejects(preparePublication(original,trust,mock({missing:true}),address));
 const p=await preparePublication(original,trust,mock({missing:true}),original.payload.subject.agentWallet);
 assert.equal(p.profileHash,`0x${original.integrity.digest}`);assert.equal(registryAbi.parseTransaction({data:p.data})!.args.profileHash,p.profileHash);
});
test('M4 consumer CLI: transitive imports exclude generator, activity, compiler and signing',()=>{
 const seen=new Set<string>();
 function visit(file:string){if(seen.has(file))return;seen.add(file);const code=readFileSync(file,'utf8').replace(/import type[^;]+;/g,'');
  for(const m of code.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)){
   const name=m[2];assert.ok(!/solc|hypersync/.test(name));
   if(name.startsWith('.')){const target=path.resolve(path.dirname(file),name).replace(/\.js$/,'.ts');
    assert.ok(!/packages[\\/](passport|activity)[\\/]|publication[\\/]src[\\/](writer|compile|publish)\.ts/.test(target));visit(target);}
  }
 }
 visit(path.resolve('scripts/verify-published-passport.ts'));
});
test('M4 real fixture: controlled evidence reproduces identical M3 Passport; Agent 2 unchanged',async()=>{
 const {generateAgentPassport}=await import('../packages/passport/src/generate.js');
 const {canonicalJsonStringify}=await import('../packages/verification/src/canonical.js');
 const capture=JSON.parse(readFileSync('fixtures/real/monad-m4/agent-2072-activity.json','utf8'));
 const passport=readFileSync('fixtures/real/monad-m4/agent-2072-activity.json.passport.json','utf8');
 const p=JSON.parse(passport);assert.equal(capture.identity.agentId,'2072');assert.equal(capture.evidence.length,2);
 assert.equal(canonicalJsonStringify(generateAgentPassport(capture.identity,capture,p.payload.generation))+'\n',passport);
 assert.equal(original.integrity.digest,'9963102ba6b529b0c66c6a5a9cb655e3970f825ead27c0e07683492154cda760');
});
test('M4 verifier: URI is only a pointer and is never fetched',async()=>{
 const base=mock();const rpc:Rpc=async(method,params)=>{
  const data=(params[0] as {data?:string})?.data;
  if(method==='eth_call'&&data?.startsWith(registryAbi.getFunction('getPassportVersion')!.selector))return registryAbi.encodeFunctionResult('getPassportVersion',[[`0x${original.integrity.digest}`,'https://untrusted.invalid/passport',original.payload.subject.agentWallet,123,100]]);
  return base(method,params);
 };
 const prior=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Unexpected URI retrieval');};
 try{const r=await verifyPublishedPassport(original,trust,rpc);assert.equal(r.status,'verified');assert.equal(r.contentUri,'https://untrusted.invalid/passport');}finally{globalThis.fetch=prior;}
});
