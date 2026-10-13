// Generic self-service flows for any Monad Testnet ERC-8004 agent.
// Server-side only. Never signs, never broadcasts, never holds a user key.
import { verifyMessage, id as topicOf, zeroPadValue, toBeHex, keccak256, ZeroHash } from "ethers";
import { validateAgentBundle } from "../../consumer/src/validate-agent-bundle.js";
import { resolveAgent, type Rpc } from "../../identity/src/resolver.js";
import { identityConfig } from "../../identity/src/config.js";
import { identityAbi, IDENTITY_REGISTRY, registryAbi } from "../../publication/src/abi.js";
import { assertTestnet, hex, PublicationError } from "../../publication/src/rpc.js";
import { preparePublication } from "../../publication/src/publish.js";
import { verifyPublishedPassport, type RegistryTrust } from "../../publication/src/verify.js";
import { retrieveAgentActivity } from "../../activity/src/index.js";
import { HYPERSYNC_ENDPOINT, type HyperSyncProvider } from "../../activity/src/envio.js";
import { generateAgentPassport } from "../../passport/src/generate.js";
import { verifyCandidate, evaluatePolicy, type Evaluation } from "../../policy/src/index.js";
import type { ConsumerPolicy } from "../../policy/src/schema.js";
import { CHAIN_ID, REGISTRY } from "./config.js";
import { WebFlowError } from "./publication.js";

export const MAX_PASSPORT_BYTES = 512 * 1024;
export const CHALLENGE_TTL_MS = 5 * 60_000;
export const MAX_GENERATION_PAGES = 5;
export const FALLBACK_WINDOW_BLOCKS = 2_000_000;
export const FEE_CAP_WEI = 200_000_000_000_000_000n; // 0.2 MON
const MAX_LISTED_VERSIONS = 10;

export function parseAgentId(value: unknown): string {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,30})$/.test(value)) throw new WebFlowError("invalid_agent_id");
  return value;
}
const address = (value: unknown) => {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(value)) throw new WebFlowError("wrong_wallet");
  return value.toLowerCase();
};
async function call(rpc: Rpc, to: string, abi: typeof registryAbi, method: string, args: unknown[], block: string = "latest") {
  return abi.decodeFunctionResult(method, String(await rpc("eth_call", [{ to, data: abi.encodeFunctionData(method, args) }, block])));
}
async function assertRegistry(rpc: Rpc, trust: RegistryTrust) {
  if (trust.address.toLowerCase() !== REGISTRY || trust.chainId !== CHAIN_ID) throw new WebFlowError("wrong_registry");
  const code = String(await rpc("eth_getCode", [REGISTRY, "latest"]));
  if (code === "0x" || keccak256(code).toLowerCase() !== trust.runtimeCodeHash.toLowerCase()) throw new WebFlowError("wrong_registry");
}
/** Server RPC must be Monad Testnet; any other answer is a provider failure, never a transaction. */
async function testnet(rpc: Rpc) { try { await assertTestnet(rpc); } catch { throw new WebFlowError("provider_unavailable"); } }
function identityError(error: unknown): never {
  const code = (error as { code?: string })?.code;
  if (code === "agent_not_found") throw new WebFlowError("agent_not_found");
  if (code === "invalid_agent_id") throw new WebFlowError("invalid_agent_id");
  throw new WebFlowError("provider_unavailable");
}

/** Publication state for any agent: latest version and its digest (the next version must link to it). */
export async function publicationState(agentId: string, rpc: Rpc, trust: RegistryTrust) {
  await assertRegistry(rpc, trust);
  const latest = BigInt((await call(rpc, REGISTRY, registryAbi, "latestVersion", [agentId]))[0]);
  let previousHash: string | undefined;
  if (latest > 0n) previousHash = String((await call(rpc, REGISTRY, registryAbi, "getPassportVersion", [agentId, latest]))[0].profileHash).toLowerCase();
  return { latest, previousHash };
}

/** The agent's current ERC-8004 agentWallet (lowercase), or null when unset. Cheap pre-check before expensive work. */
export async function designatedWallet(agentId: string, rpc: Rpc) {
  await testnet(rpc);
  let wallet: string;
  try { wallet = String((await call(rpc, IDENTITY_REGISTRY, identityAbi, "getAgentWallet", [parseAgentId(agentId)]))[0]).toLowerCase(); }
  catch (e) { if (e instanceof WebFlowError) throw e; throw new WebFlowError("agent_not_found"); }
  return /^0x0{40}$/.test(wallet) ? null : wallet;
}

/** Read-only lookup of an arbitrary agent: ERC-8004 identity plus Signal Passport publication history. */
export async function lookupAgent(agentIdInput: unknown, rpc: Rpc, trust: RegistryTrust) {
  const agentId = parseAgentId(agentIdInput);
  await testnet(rpc);
  const identity = await resolveAgent(agentId, identityConfig("monad-testnet"), { rpc }).catch(identityError);
  const { latest } = await publicationState(agentId, rpc, trust);
  const versions = [];
  for (let v = latest; v >= 1n && versions.length < MAX_LISTED_VERSIONS; v--) {
    const r = (await call(rpc, REGISTRY, registryAbi, "getPassportVersion", [agentId, v]))[0];
    versions.push({ version: v.toString(), profileHash: String(r.profileHash).toLowerCase(), contentUri: String(r.contentUri),
      publisher: String(r.publisher).toLowerCase(), publishedAt: r.publishedAt.toString(), blockNumber: r.blockNumber.toString(),
      publisherIsCurrentWallet: identity.agentWallet === String(r.publisher).toLowerCase() });
  }
  const doc = identity.registration.document;
  return {
    agentId, chainId: CHAIN_ID, identityRegistry: IDENTITY_REGISTRY, passportRegistry: REGISTRY,
    owner: identity.ownerAddress, agentWallet: identity.agentWallet ?? null, agentWalletStatus: identity.agentWalletStatus,
    agentUriKind: identity.agentUri.startsWith("data:") ? "data" : identity.agentUri.startsWith("ipfs://") ? "ipfs" : identity.agentUri ? "https" : "none",
    registration: { status: identity.registration.status, name: doc?.name ?? null, description: doc?.description ?? null,
      warnings: identity.registration.warnings },
    resolvedAtBlock: identity.resolution.blockNumber,
    publication: { latestVersion: latest.toString(), nextVersion: (latest + 1n).toString(), versions,
      listedVersionsTruncated: latest > BigInt(MAX_LISTED_VERSIONS) }
  };
}

/** Current identity association, kept separate from historical publication. */
export async function identityAssociation(subject: { agentId: string; ownerAddress: string; agentWallet?: string; agentUri: string }, rpc: Rpc) {
  try {
    const owner = String((await call(rpc, IDENTITY_REGISTRY, identityAbi, "ownerOf", [subject.agentId]))[0]).toLowerCase();
    const wallet = String((await call(rpc, IDENTITY_REGISTRY, identityAbi, "getAgentWallet", [subject.agentId]))[0]).toLowerCase();
    const uri = String((await call(rpc, IDENTITY_REGISTRY, identityAbi, "tokenURI", [subject.agentId]))[0]);
    return { status: "checked" as const, currentOwner: owner, currentWallet: wallet,
      ownerMatchesArtifact: owner === subject.ownerAddress, walletMatchesArtifact: wallet === (subject.agentWallet ?? ""),
      uriMatchesArtifact: uri === subject.agentUri };
  } catch { return { status: "unavailable" as const }; }
}

/** Verify user-supplied Passports and evaluate a consumer policy. Never trusts assertions inside the file. */
export async function verifySubmitted(candidates: { candidateId: string; passport: unknown }[], policy: ConsumerPolicy,
  trust: RegistryTrust, rpc: Rpc) {
  const results: { candidateId: string; local: { schemaValid: boolean; referencesValid: boolean; digestMatches: boolean; errors: string[] };
    subject: { agentId: string; version: number; digest: string } | null; evaluation: Evaluation;
    association: Awaited<ReturnType<typeof identityAssociation>> | null }[] = [];
  for (const c of candidates) {
    const local = validateAgentBundle(c.passport);
    const evaluation = evaluatePolicy(await verifyCandidate(c.candidateId, c.passport, { trust, rpc }), policy);
    const p = local.bundle?.payload;
    results.push({ candidateId: c.candidateId,
      local: { schemaValid: local.schemaValid, referencesValid: local.referencesValid, digestMatches: local.digestMatches, errors: local.errors.slice(0, 5) },
      subject: p ? { agentId: p.subject.agentId, version: p.generation.passportVersion, digest: `0x${local.bundle!.integrity.digest}` } : null,
      evaluation, association: p ? await identityAssociation(p.subject, rpc) : null });
  }
  return results;
}

/* ---------- Wallet-control challenge (EIP-191 personal_sign, no transaction) ---------- */
export { challengeMessage } from "./challenge.js";
/** Stateless checks only (format, origin, freshness, signer). Single use is enforced atomically in the shared store. */
export function verifyChallenge(input: { message: unknown; signature: unknown }, expectedOrigin: string, now = Date.now()) {
  if (typeof input.message !== "string" || input.message.length > 600 || typeof input.signature !== "string" ||
    !/^0x[0-9a-fA-F]{130}$/.test(input.signature)) throw new WebFlowError("invalid_challenge");
  const m = /^Signal Passport wants to generate a Passport for an agent you control\.\nThis signature proves wallet control\. It sends no transaction and costs no gas\.\nAgent ID: (0|[1-9][0-9]{0,30})\nWallet: (0x[0-9a-f]{40})\nChain ID: 10143\nOrigin: (\S+)\nIssued at: (\S+)\nNonce: ([0-9a-f]{32})$/.exec(input.message);
  if (!m) throw new WebFlowError("invalid_challenge");
  const [, agentId, wallet, origin, issuedAt, nonce] = m;
  if (origin !== expectedOrigin) throw new WebFlowError("invalid_challenge");
  const issued = Date.parse(issuedAt);
  if (!Number.isFinite(issued) || new Date(issued).toISOString() !== issuedAt || issued > now + 60_000 || now - issued > CHALLENGE_TTL_MS)
    throw new WebFlowError("challenge_expired");
  let signer: string;
  try { signer = verifyMessage(input.message, input.signature).toLowerCase(); } catch { throw new WebFlowError("invalid_challenge"); }
  if (signer !== wallet) throw new WebFlowError("invalid_challenge");
  return { agentId, address: wallet, nonce };
}

/* ---------- Bounded evidence retrieval and generation ---------- */
/** First block of the agent's ERC-8004 Registered event, via a bounded HyperSync log query. Null when not found. */
export async function findRegistrationBlock(agentId: string, token: string, fetchFn: typeof fetch = fetch, maxPages = 25): Promise<number | null> {
  const topic0 = topicOf("Registered(uint256,string,address)"), topic1 = zeroPadValue(toBeHex(BigInt(agentId)), 32);
  let from = 0;
  for (let page = 0; page < maxPages; page++) {
    const response = await fetchFn(`${HYPERSYNC_ENDPOINT}/query`, { method: "POST", redirect: "error", signal: AbortSignal.timeout(20_000),
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from_block: from, logs: [{ address: [IDENTITY_REGISTRY], topics: [[topic0], [topic1]] }],
        field_selection: { log: ["block_number"] } }) }).catch(() => null);
    if (!response?.ok) return null;
    const body = await response.json().catch(() => null) as { data?: { logs?: { block_number?: number }[] }[]; next_block?: number; archive_height?: number } | null;
    if (!body || !Array.isArray(body.data)) return null;
    for (const group of body.data) for (const log of group.logs ?? []) if (Number.isSafeInteger(log.block_number)) return log.block_number!;
    if (!Number.isSafeInteger(body.next_block) || body.next_block! <= from) return null;
    if (Number.isSafeInteger(body.archive_height) && body.next_block! >= body.archive_height!) return null;
    from = body.next_block!;
  }
  return null;
}

export async function generateNextPassport(o: { agentId: string; address: string; rpc: Rpc; provider: HyperSyncProvider; trust: RegistryTrust;
  registrationBlock: (agentId: string) => Promise<number | null>; now?: () => Date; maxPages?: number }) {
  const agentId = parseAgentId(o.agentId), wallet = address(o.address);
  await testnet(o.rpc);
  const identity = await resolveAgent(agentId, identityConfig("monad-testnet"), { rpc: o.rpc, now: o.now }).catch(identityError);
  if (identity.agentWalletStatus !== "set" || identity.agentWallet !== wallet) throw new WebFlowError("wrong_wallet");
  const { latest, previousHash } = await publicationState(agentId, o.rpc, o.trust);
  let indexed: number;
  try { indexed = await o.provider.getHeight(); } catch { throw new WebFlowError("evidence_unavailable"); }
  const toBlock = Math.min(indexed, Number(identity.resolution.blockNumber) - 10);
  let fromBlock = await o.registrationBlock(agentId).catch(() => null), basis: "since_registration" | "recent_window" = "since_registration";
  if (fromBlock === null || !Number.isSafeInteger(fromBlock)) { fromBlock = Math.max(0, toBlock - FALLBACK_WINDOW_BLOCKS); basis = "recent_window"; }
  if (!Number.isSafeInteger(toBlock) || toBlock <= fromBlock) throw new WebFlowError("evidence_unavailable");
  let activity: Awaited<ReturnType<typeof retrieveAgentActivity>>;
  try { activity = await retrieveAgentActivity(identity, o.provider, { fromBlock, toBlock, maxPages: Math.min(o.maxPages ?? MAX_GENERATION_PAGES, MAX_GENERATION_PAGES), now: o.now }); }
  catch { throw new WebFlowError("evidence_unavailable"); }
  // Provider failures never become zero activity or a fabricated Passport.
  if (activity.state !== "retrieved") throw new WebFlowError("evidence_unavailable");
  const version = Number(latest) + 1;
  let bundle: ReturnType<typeof generateAgentPassport>;
  try { bundle = generateAgentPassport(identity, activity, { passportVersion: version,
    ...(previousHash ? { previousVersionHash: previousHash.slice(2) } : {}), generatedAt: (o.now?.() ?? new Date()).toISOString() }); }
  catch { throw new WebFlowError("generation_failed"); }
  return { bundle, version, scope: { fromBlock, toBlockExclusive: toBlock, basis } };
}

/* ---------- Publication by the user's own wallet ---------- */
const publicationErrors: Record<string, string> = {
  invalid_local_passport: "invalid_passport", registry_unavailable_or_version_already_published: "stale_or_already_published",
  publisher_is_not_passport_current_agentWallet: "wrong_wallet", invalid_sequential_version: "stale_or_already_published",
  previous_version_hash_mismatch: "invalid_version_link"
};
export async function prepareUserPublication(raw: unknown, from: unknown, chain: unknown, trust: RegistryTrust, rpc: Rpc) {
  const wallet = address(from);
  if (chain !== CHAIN_ID) throw new WebFlowError("wrong_network");
  const local = validateAgentBundle(raw);
  if (!local.isValid || !local.bundle) throw new WebFlowError("invalid_passport");
  await testnet(rpc); await assertRegistry(rpc, trust);
  let prepared: Awaited<ReturnType<typeof preparePublication>>;
  try { prepared = await preparePublication(local.bundle, trust, rpc, wallet, ""); }
  catch (e) { throw new WebFlowError(e instanceof PublicationError ? publicationErrors[e.code] ?? "provider_unavailable" : "provider_unavailable"); }
  const tx = { from: wallet, to: REGISTRY, data: prepared.data, value: "0x0" };
  let gas: bigint, gasPrice: bigint, balance: bigint;
  try {
    gas = BigInt(hex(await rpc("eth_estimateGas", [tx]))) * 125n / 100n;
    gasPrice = BigInt(hex(await rpc("eth_gasPrice", []))) * 120n / 100n;
    balance = BigInt(hex(await rpc("eth_getBalance", [wallet, "pending"])));
  } catch { throw new WebFlowError("estimate_failed"); }
  const maxFee = gas * gasPrice;
  if (gas <= 0n || gasPrice <= 0n || maxFee > FEE_CAP_WEI) throw new WebFlowError("fee_cap");
  if (balance < maxFee) throw new WebFlowError("insufficient_MON");
  return { ...tx, chainId: CHAIN_ID, gas: gas.toString(), gasPrice: gasPrice.toString(), maxFeeWei: maxFee.toString(),
    agentId: String(prepared.agentId), version: prepared.version, profileHash: prepared.profileHash, contentUri: "" };
}
export type UserPublication = Awaited<ReturnType<typeof prepareUserPublication>>;

export async function confirmUserPublication(raw: unknown, hash: unknown, trust: RegistryTrust, rpc: Rpc) {
  const local = validateAgentBundle(raw);
  if (!local.isValid || !local.bundle) throw new WebFlowError("invalid_passport");
  if (typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new WebFlowError("invalid_transaction_hash");
  const bundle = local.bundle, p = bundle.payload;
  await testnet(rpc);
  const receipt = await rpc("eth_getTransactionReceipt", [hash]) as Record<string, string> | null;
  if (!receipt) return { state: "pending" as const };
  if (receipt.transactionHash?.toLowerCase() !== hash.toLowerCase() || receipt.to?.toLowerCase() !== REGISTRY ||
    receipt.from?.toLowerCase() !== p.subject.agentWallet) throw new WebFlowError("unexpected_receipt");
  if (receipt.status === "0x0") return { state: "reverted" as const, receipt: { blockNumber: receipt.blockNumber, transactionHash: receipt.transactionHash } };
  if (receipt.status !== "0x1") throw new WebFlowError("unexpected_receipt");
  const transaction = await rpc("eth_getTransactionByHash", [hash]) as Record<string, string> | null;
  const expected = registryAbi.encodeFunctionData("publishPassport", [p.subject.agentId, `0x${bundle.integrity.digest}`, "", p.generation.passportVersion]);
  if (!transaction || transaction.input?.toLowerCase() !== expected.toLowerCase() || transaction.from?.toLowerCase() !== receipt.from.toLowerCase() ||
    transaction.to?.toLowerCase() !== REGISTRY || transaction.blockHash !== receipt.blockHash || BigInt(transaction.value) !== 0n ||
    BigInt(transaction.chainId) !== BigInt(CHAIN_ID)) throw new WebFlowError("unexpected_receipt");
  const verification = await verifyPublishedPassport(bundle, trust, rpc);
  const summary = { blockNumber: BigInt(receipt.blockNumber).toString(), transactionHash: receipt.transactionHash };
  if (verification.status !== "verified" || !verification.publicationProvenanceVerified || verification.publicationBlock !== summary.blockNumber ||
    verification.publisher?.toLowerCase() !== receipt.from.toLowerCase() || verification.profileHash === ZeroHash)
    return { state: "unverified" as const, receipt: summary, verification };
  return { state: "confirmed" as const, receipt: summary, verification };
}
