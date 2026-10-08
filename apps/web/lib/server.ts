import "server-only";
import accepted from "../../../fixtures/real/monad-m4/agent-2072-activity.json.passport.json";
import deployment from "../../../fixtures/real/monad-m4/deployment.json";
import { alchemyRpc, alchemyUrl, assertTestnet, PublicationError } from "../../../packages/publication/src/rpc";
import { verifyPublishedPassport, type RegistryTrust } from "../../../packages/publication/src/verify";
import { resolveAgent } from "../../../packages/identity/src/resolver";
import { identityConfig } from "../../../packages/identity/src/config";
import { createEnvioProvider, retrieveAgentActivity } from "../../../packages/activity/src/index";
import { generateAgentPassport } from "../../../packages/passport/src/generate";
import { currentAgentWallet, latestVersion, unsignedPublication, confirmPublication, WebFlowError } from "../../../packages/web/src/publication";
import { AGENT_ID, V1_HASH } from "../../../packages/web/src/config";

export const trust = deployment.trust as RegistryTrust;
export const v1 = accepted;
export async function readState() {
  const rpc = alchemyRpc();
  const verification = await verifyPublishedPassport(v1, trust, rpc);
  let agentWallet: string | undefined, latest: string | undefined, network = "available";
  try { await assertTestnet(rpc); agentWallet = await currentAgentWallet(rpc); latest = await latestVersion(rpc); }
  catch (error) { network = error instanceof PublicationError && error.code === "wrong_chain_no_transaction_sent" ? "wrong_chain" : "unavailable"; }
  return { bundle: v1, verification, agentWallet, latest, network };
}
export async function prepare(address: string, chain: number) {
  const rpc = alchemyRpc();
  await assertTestnet(rpc);
  if (chain !== 10143) throw new WebFlowError("wrong_network");
  if ((await currentAgentWallet(rpc)) !== address.toLowerCase()) throw new WebFlowError("wrong_wallet");
  if (await latestVersion(rpc) !== "1") throw new WebFlowError("stale_or_already_published");
  const previous = await verifyPublishedPassport(v1, trust, rpc);
  if (previous.status !== "verified" || previous.profileHash?.toLowerCase() !== V1_HASH) throw new WebFlowError("previous_version_unverified");
  const identity = await resolveAgent(AGENT_ID, identityConfig("monad-testnet", alchemyUrl()));
  const provider = await createEnvioProvider(process.env.ENVIO_API_TOKEN, "json");
  // Freeze an exclusive upper bound behind both the resolved chain head and indexed archive.
  const toBlock = Math.min(await provider.getHeight(), Number(identity.resolution.blockNumber) - 10);
  if (!Number.isSafeInteger(toBlock) || toBlock <= 69126790) throw new WebFlowError("evidence_unavailable");
  const activity = await retrieveAgentActivity(identity, provider, { fromBlock: 69126790, toBlock, maxPages: 10 });
  if (activity.state !== "retrieved") throw new WebFlowError("evidence_unavailable");
  const bundle = generateAgentPassport(identity, activity, { passportVersion: 2,
    previousVersionHash: previous.profileHash.slice(2), generatedAt: new Date().toISOString() });
  const transaction = await unsignedPublication(bundle, address, chain, trust, rpc);
  return { bundle, transaction };
}
export async function preflight(bundle: unknown, address: string, chain: number) {
  return unsignedPublication(bundle, address, chain, trust, alchemyRpc());
}
export async function confirm(bundle: unknown, hash: string) {
  return confirmPublication(bundle, hash, trust, alchemyRpc());
}
const messages: Record<string, string> = {
  wrong_network: "Connect to Monad Testnet (10143).", wrong_wallet: "Only the current registry-designated agentWallet may publish.",
  stale_or_already_published: "Version 2 is already published or the latest version changed. Refresh; do not send again.",
  previous_version_unverified: "The previous onchain version could not be verified.", invalid_passport: "Passport integrity is invalid.",
  invalid_version_link: "A valid version 2 linked to the accepted version 1 is required.",
  evidence_unavailable: "Envio evidence is unavailable. No Passport was generated; this is not zero activity.",
  fee_cap: "Estimated fee exceeds the 0.2 MON safety cap or is invalid.", insufficient_MON: "Insufficient MON for the anticipated fee.",
  unexpected_receipt: "Transaction receipt does not match the reviewed publication.", invalid_transaction_hash: "Invalid transaction hash."
};
export function safeError(error: unknown) {
  // Never serialize provider errors, stacks, URLs or request bodies.
  const code = error instanceof WebFlowError && messages[error.code] ? error.code : "provider_unavailable";
  return { code, error: messages[code] ?? "Server verification or provider request failed. Publication is not confirmed. Retry the read-only check." };
}
