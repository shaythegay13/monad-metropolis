// Server-side orchestration, deliberately independent of the private-key writer.
import { validateAgentBundle } from "../../consumer/src/validate-agent-bundle.js";
import type { Rpc } from "../../identity/src/resolver.js";
import { identityAbi, IDENTITY_REGISTRY, registryAbi } from "../../publication/src/abi.js";
import { assertTestnet, hex } from "../../publication/src/rpc.js";
import { preparePublication } from "../../publication/src/publish.js";
import { verifyPublishedPassport, type RegistryTrust } from "../../publication/src/verify.js";
import { AGENT_ID, CHAIN_ID, REGISTRY, V1_HASH } from "./config.js";
import { walletAuthorization } from "./wallet.js";

export class WebFlowError extends Error {
  constructor(public code: string) { super(code); }
}
export function requireVersionTwo(raw: unknown) {
  const result = validateAgentBundle(raw);
  if (!result.isValid || !result.bundle) throw new WebFlowError("invalid_passport");
  const p = result.bundle.payload;
  if (p.subject.agentId !== AGENT_ID || p.generation.passportVersion !== 2 ||
      `0x${p.generation.previousVersionHash}` !== V1_HASH) throw new WebFlowError("invalid_version_link");
  return result.bundle;
}
export async function currentAgentWallet(rpc: Rpc) {
  return String(identityAbi.decodeFunctionResult("getAgentWallet", String(await rpc("eth_call", [{
    to: IDENTITY_REGISTRY, data: identityAbi.encodeFunctionData("getAgentWallet", [AGENT_ID])
  }, "latest"])))[0]).toLowerCase();
}
export async function latestVersion(rpc: Rpc) {
  return String(registryAbi.decodeFunctionResult("latestVersion", String(await rpc("eth_call", [{
    to: REGISTRY, data: registryAbi.encodeFunctionData("latestVersion", [AGENT_ID])
  }, "latest"])))[0]);
}
export async function unsignedPublication(raw: unknown, address: string, chain: number, trust: RegistryTrust, rpc: Rpc) {
  if (trust.address.toLowerCase() !== REGISTRY || trust.chainId !== CHAIN_ID) throw new WebFlowError("wrong_registry");
  if (!/^0x[0-9a-f]{40}$/i.test(address)) throw new WebFlowError("wrong_wallet");
  if (chain !== CHAIN_ID) throw new WebFlowError("wrong_network");
  const bundle = requireVersionTwo(raw);
  await assertTestnet(rpc);
  const current = await currentAgentWallet(rpc);
  if (walletAuthorization(address, true, chain, current) !== "authorized") throw new WebFlowError("wrong_wallet");
  if (await latestVersion(rpc) !== "1") throw new WebFlowError("stale_or_already_published");
  const prepared = await preparePublication(bundle, trust, rpc, address, "");
  const tx = { from: address.toLowerCase(), to: REGISTRY, data: prepared.data, value: "0x0" };
  const gas = BigInt(hex(await rpc("eth_estimateGas", [tx]))) * 125n / 100n;
  const gasPrice = BigInt(hex(await rpc("eth_gasPrice", []))) * 120n / 100n;
  const maxFee = gas * gasPrice;
  if (gas <= 0n || gasPrice <= 0n || maxFee > 200_000_000_000_000_000n) throw new WebFlowError("fee_cap");
  if (BigInt(hex(await rpc("eth_getBalance", [address, "pending"]))) < maxFee) throw new WebFlowError("insufficient_MON");
  return { ...tx, chainId: CHAIN_ID, gas: gas.toString(), gasPrice: gasPrice.toString(),
    maxFeeWei: maxFee.toString(), profileHash: prepared.profileHash, version: 2, contentUri: "" };
}
export type UnsignedPublication = Awaited<ReturnType<typeof unsignedPublication>>;

export async function confirmPublication(raw: unknown, hash: string, trust: RegistryTrust, rpc: Rpc) {
  const bundle = requireVersionTwo(raw);
  if (!/^0x[0-9a-f]{64}$/i.test(hash)) throw new WebFlowError("invalid_transaction_hash");
  await assertTestnet(rpc);
  const receipt = await rpc("eth_getTransactionReceipt", [hash]) as Record<string, string> | null;
  if (!receipt) return { state: "pending" as const };
  if (receipt.transactionHash?.toLowerCase() !== hash.toLowerCase() || receipt.to?.toLowerCase() !== REGISTRY ||
      receipt.from?.toLowerCase() !== bundle.payload.subject.agentWallet) throw new WebFlowError("unexpected_receipt");
  if (receipt.status === "0x0") return { state: "reverted" as const, receipt };
  if (receipt.status !== "0x1") throw new WebFlowError("unexpected_receipt");
  const transaction = await rpc("eth_getTransactionByHash", [hash]) as Record<string, string> | null;
  const expectedData = registryAbi.encodeFunctionData("publishPassport", [AGENT_ID, `0x${bundle.integrity.digest}`, "", 2]);
  if (!transaction || transaction.hash?.toLowerCase() !== hash.toLowerCase() || transaction.input?.toLowerCase() !== expectedData.toLowerCase() ||
      transaction.from?.toLowerCase() !== receipt.from.toLowerCase() || transaction.to?.toLowerCase() !== REGISTRY ||
      transaction.blockHash !== receipt.blockHash || transaction.blockNumber !== receipt.blockNumber ||
      BigInt(transaction.value) !== 0n || BigInt(transaction.chainId) !== BigInt(CHAIN_ID)) throw new WebFlowError("unexpected_receipt");
  const verification = await verifyPublishedPassport(bundle, trust, rpc);
  if (verification.status !== "verified" || !verification.publicationProvenanceVerified ||
      verification.publicationBlock !== BigInt(receipt.blockNumber).toString() ||
      verification.publisher?.toLowerCase() !== receipt.from.toLowerCase()) return { state: "unverified" as const, receipt, verification };
  const block = await rpc("eth_getBlockByNumber", [receipt.blockNumber, false]) as {hash?: string};
  if (block?.hash !== receipt.blockHash) return { state: "unverified" as const, receipt, verification };
  return { state: "confirmed" as const, receipt, verification };
}
