import { Wallet, Transaction, keccak256, getCreateAddress, getAddress } from "ethers";
import type { Rpc } from "../../identity/src/resolver.js";
import { assertTestnet, hex, PublicationError } from "./rpc.js";
import { IDENTITY_REGISTRY, identityAbi } from "./abi.js";
export function deployer(env: NodeJS.ProcessEnv = process.env): Wallet {
  try { const value = env.DEPLOYER_PRIVATE_KEY?.trim();
    if (!value || !/^(0x)?[0-9a-fA-F]{64}$/.test(value)) throw Error();
    return new Wallet(value.startsWith("0x") ? value : `0x${value}`);
  } catch { throw new PublicationError("invalid_testnet_deployer_key"); }
}
export interface Submission { transactionHash: string; sender: string; nonce: number; chainId: 10143;
  to: string | null; expectedContractAddress?: string; maxFeeWei: string }
export async function sendTestnetTransaction(rpc: Rpc, wallet: Pick<Wallet,"address"|"signTransaction">, data: string, to: string | undefined,
  recordSubmission: (submission: Submission) => Promise<void>) {
  try {
    await assertTestnet(rpc);
    const address = wallet.address;
    const tx = { from: address, data, value: "0x0", ...(to ? { to: getAddress(to) } : {}) };
    const gasLimit = BigInt(hex(await rpc("eth_estimateGas", [tx]))) * 125n / 100n;
    const gasPrice = BigInt(hex(await rpc("eth_gasPrice", []))) * 120n / 100n;
    const maxFee = gasLimit * gasPrice;
    if (maxFee > 200_000_000_000_000_000n) throw new PublicationError("transaction_fee_exceeds_0_2_MON_cap");
    if (BigInt(hex(await rpc("eth_getBalance", [address, "pending"]))) < maxFee)
      throw new PublicationError("insufficient_testnet_MON");
    const nonce = Number(BigInt(hex(await rpc("eth_getTransactionCount", [address, "pending"]))));
    if (!Number.isSafeInteger(nonce)) throw new PublicationError("invalid_nonce");
    const signed = await wallet.signTransaction({ chainId: 10143, type: 0, nonce, gasLimit, gasPrice, data, value: 0, ...(to ? {to} : {}) });
    const transactionHash = keccak256(signed);
    if (Transaction.from(signed).from !== address) throw Error();
    const submission: Submission = {transactionHash, sender:address, nonce, chainId:10143, to:to ?? null,
      ...(to ? {} : {expectedContractAddress:getCreateAddress({from:address,nonce})}), maxFeeWei:maxFee.toString()};
    // Persist only public recovery data BEFORE sending. Existing submission files prevent blind retries.
    await recordSubmission(submission);
    await assertTestnet(rpc);
    const sent = await rpc("eth_sendRawTransaction", [signed]);
    if (sent !== transactionHash) throw new PublicationError("unexpected_transaction_hash_inspect_submission");
    for (let i=0;i<90;i++) {
      const receipt = await rpc("eth_getTransactionReceipt", [transactionHash]) as Record<string,unknown> | null;
      if (receipt) {
        if (receipt.transactionHash !== transactionHash || receipt.status !== "0x1") throw new PublicationError("transaction_reverted_inspect_submission");
        return {submission, receipt};
      }
      await new Promise(resolve => setTimeout(resolve,1000));
    }
    throw new PublicationError("receipt_timeout_inspect_submission_before_retry");
  } catch(e) { if(e instanceof PublicationError)throw e; throw new PublicationError("testnet_transaction_failed_inspect_submission"); }
}
export async function assertControlledAgent(rpc: Rpc, agentId: string, address: string) {
  const expected = address.toLowerCase();
  for(const method of ["ownerOf","getAgentWallet"]) {
    const result = await rpc("eth_call",[{to:IDENTITY_REGISTRY,data:identityAbi.encodeFunctionData(method,[agentId])},"latest"]);
    if(identityAbi.decodeFunctionResult(method,String(result))[0].toLowerCase()!==expected)
      throw new PublicationError("demo_agent_not_controlled_by_deployer");
  }
}
export function demoRegistration(agentId: string) {
  if(!/^(0|[1-9][0-9]*)$/.test(agentId)||BigInt(agentId)>BigInt(Number.MAX_SAFE_INTEGER))throw new PublicationError("invalid_demo_agent_id");
  const registration = {type:"https://eips.ethereum.org/EIPS/eip-8004#registration-v1",name:"Signal Passport Demo Agent",
    description:"Testnet agent used to demonstrate portable, evidence-backed economic history with Signal Passport. Current demo activity consists of identity management; no autonomous service endpoints are advertised.",
    services:[],active:false,x402Support:false,registrations:[{agentId:Number(agentId),agentRegistry:`eip155:10143:${IDENTITY_REGISTRY}`}],supportedTrust:[]};
  return {registration,agentUri:`data:application/json;base64,${Buffer.from(JSON.stringify(registration)).toString("base64")}`};
}
