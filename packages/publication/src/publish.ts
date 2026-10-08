import { validateAgentBundle } from "../../consumer/src/validate-agent-bundle.js";
import type { Rpc } from "../../identity/src/resolver.js";
import { registryAbi, identityAbi, IDENTITY_REGISTRY } from "./abi.js";
import { PublicationError } from "./rpc.js";
import { verifyPublishedPassport, type RegistryTrust } from "./verify.js";
export async function preparePublication(raw:unknown, trust:RegistryTrust, rpc:Rpc, publisher:string, contentUri="") {
  const local=validateAgentBundle(raw);
  if(!local.isValid||!local.bundle)throw new PublicationError("invalid_local_passport");
  const p=local.bundle.payload;
  const prior=await verifyPublishedPassport(raw,trust,rpc);
  if(prior.status!=="not_found"||!prior.registryVerified)throw new PublicationError("registry_unavailable_or_version_already_published");
  const wallet=identityAbi.decodeFunctionResult("getAgentWallet",String(await rpc("eth_call",[{to:IDENTITY_REGISTRY,
    data:identityAbi.encodeFunctionData("getAgentWallet",[p.subject.agentId])},"latest"])))[0];
  if(String(wallet).toLowerCase()!==publisher.toLowerCase()||p.subject.agentWallet!==publisher.toLowerCase())
    throw new PublicationError("publisher_is_not_passport_current_agentWallet");
  const latest=registryAbi.decodeFunctionResult("latestVersion",String(await rpc("eth_call",[{to:trust.address,
    data:registryAbi.encodeFunctionData("latestVersion",[p.subject.agentId])},"latest"])))[0] as bigint;
  if(BigInt(p.generation.passportVersion)!==latest+1n)throw new PublicationError("invalid_sequential_version");
  if(latest>0n) {
    const previous=registryAbi.decodeFunctionResult("getPassportVersion",String(await rpc("eth_call",[{to:trust.address,
      data:registryAbi.encodeFunctionData("getPassportVersion",[p.subject.agentId,latest])},"latest"])))[0];
    if(`0x${p.generation.previousVersionHash}`!==previous.profileHash.toLowerCase())throw new PublicationError("previous_version_hash_mismatch");
  }
  return {agentId:p.subject.agentId,version:p.generation.passportVersion,profileHash:`0x${local.bundle.integrity.digest}`,
    data:registryAbi.encodeFunctionData("publishPassport",[p.subject.agentId,`0x${local.bundle.integrity.digest}`,contentUri,p.generation.passportVersion])};
}
