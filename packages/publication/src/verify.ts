import { keccak256, getAddress, ZeroHash, ZeroAddress } from "ethers";
import { validateAgentBundle } from "../../consumer/src/validate-agent-bundle.js";
import type { Rpc } from "../../identity/src/resolver.js";
import { assertTestnet } from "./rpc.js";
import { IDENTITY_REGISTRY, registryAbi, identityAbi } from "./abi.js";
export interface RegistryTrust {address:string; runtimeCodeHash:string; identityRegistry:string; chainId:10143}
export interface PublicationVerification {
  localIntegrityValid:boolean; publicationFound:boolean|null; publishedHashMatches:boolean|null;
  registryVerified:boolean; publicationProvenanceVerified:boolean; status:"invalid_local"|"verified"|"not_found"|"hash_mismatch"|"provider_error"|"invalid_registry";
  publisher?:string; version?:string; profileHash?:string; contentUri?:string; publishedAt?:string; publicationBlock?:string;
  checkedBlock?:string; checkedBlockHash?:string; publisherMatchesCurrentAgentWallet?:boolean;
}
// Trust config is supplied independently, never accepted from the imported Passport.
// No generator, evidence provider, private key or metric calculator dependency.
export async function verifyPublishedPassport(raw: unknown, trust: RegistryTrust, rpc: Rpc): Promise<PublicationVerification> {
  const local = validateAgentBundle(raw);
  const result:PublicationVerification={localIntegrityValid:local.isValid,publicationFound:null,publishedHashMatches:null,
    registryVerified:false,publicationProvenanceVerified:false,status:"invalid_local"};
  if(!local.isValid || !local.bundle)return result;
  try {
    if(trust.chainId!==10143 || trust.identityRegistry.toLowerCase()!==IDENTITY_REGISTRY ||
      !/^0x[0-9a-f]{64}$/i.test(trust.runtimeCodeHash)) {result.status="invalid_registry";return result;}
    const address=getAddress(trust.address);
    await assertTestnet(rpc);
    const block = await rpc("eth_getBlockByNumber",["latest",false]) as {number:string;hash:string};
    if(!block || !/^0x[0-9a-f]+$/i.test(block.number)||!/^0x[0-9a-f]{64}$/i.test(block.hash))throw Error();
    result.checkedBlock=BigInt(block.number).toString();result.checkedBlockHash=block.hash;
    const code = String(await rpc("eth_getCode",[address,block.number]));
    if(code==="0x"||keccak256(code).toLowerCase()!==trust.runtimeCodeHash.toLowerCase()) {result.status="invalid_registry";return result;}
    async function read(method:string,args:unknown[]) {
      return registryAbi.decodeFunctionResult(method,String(await rpc("eth_call",[{to:address,data:registryAbi.encodeFunctionData(method,args)},block.number])));
    }
    if(String((await read("identityRegistry",[]))[0]).toLowerCase()!==IDENTITY_REGISTRY) {result.status="invalid_registry";return result;}
    const p=local.bundle.payload, version=p.generation.passportVersion;
    if(p.subject.registryAddress!==IDENTITY_REGISTRY){result.status="invalid_registry";return result;}
    const record=(await read("getPassportVersion",[p.subject.agentId,version]))[0];
    const current=identityAbi.decodeFunctionResult("getAgentWallet",String(await rpc("eth_call",[{to:IDENTITY_REGISTRY,
      data:identityAbi.encodeFunctionData("getAgentWallet",[p.subject.agentId])},block.number])))[0];
    const again=await rpc("eth_getBlockByNumber",[block.number,false]) as {hash:string};
    if(again?.hash!==block.hash)throw Error();
    result.registryVerified=true;result.version=String(version);
    result.publicationFound=record.profileHash!==ZeroHash;
    if(!result.publicationFound){result.publishedHashMatches=false;result.status="not_found";return result;}
    if(record.publisher===ZeroAddress||record.blockNumber>BigInt(block.number))throw Error();
    result.profileHash=record.profileHash;result.publisher=record.publisher;result.contentUri=record.contentUri;
    result.publishedAt=record.publishedAt.toString();result.publicationBlock=record.blockNumber.toString();
    result.publisherMatchesCurrentAgentWallet=String(current).toLowerCase()===String(record.publisher).toLowerCase();
    result.publishedHashMatches=record.profileHash.toLowerCase()===`0x${local.bundle.integrity.digest}`;
    result.publicationProvenanceVerified=result.publishedHashMatches;
    result.status=result.publishedHashMatches?"verified":"hash_mismatch";
    return result;
  } catch {return {...result,registryVerified:false,publicationFound:null,publishedHashMatches:null,publicationProvenanceVerified:false,status:"provider_error"};}
}
