import { agentIdentitySchema, type AgentIdentity } from "../../schema/src/identity.js";
import type { ActivityEvidence } from "../../schema/src/activity.js";
import { ActivityError, malformed } from "./errors.js";
import { normalizePage, mergeEvidence, safeBlock, rollbackObservation, type RollbackObservation } from "./normalize.js";
import { coverageFor } from "./coverage.js";
import { HYPERSYNC_ENDPOINT, type HyperSyncProvider } from "./envio.js";
export { ActivityError } from "./errors.js";
export { createEnvioProvider } from "./envio.js";

export function subjectWallet(identity: AgentIdentity): string {
  const parsed = agentIdentitySchema.safeParse(identity);
  if (!parsed.success || identity.chainId !== 10143 || identity.network !== "monad-testnet" ||
    identity.registryAddress !== "0x8004a818bfb912233c491871b3d84c89a494bd9e")
    throw new ActivityError("invalid_subject", "A valid Monad Testnet ERC-8004 identity is required");
  if (identity.agentWalletStatus === "unset" || !identity.agentWallet)
    throw new ActivityError("agent_wallet_unset", "Registry-designated agentWallet is unset; owner fallback is forbidden");
  return identity.agentWallet;
}
export async function retrieveAgentActivity(identity: AgentIdentity, provider: HyperSyncProvider, options: {
  fromBlock: number; toBlock: number; maxPages?: number; now?: () => Date;
}) {
  const wallet = subjectWallet(identity);
  const { fromBlock, toBlock } = options; const maxPages = options.maxPages ?? 100;
  if (!Number.isSafeInteger(fromBlock) || !Number.isSafeInteger(toBlock) || fromBlock < 0 || toBlock <= fromBlock ||
    !Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > 1000)
    throw new ActivityError("invalid_config", "Use safe integer blocks with 0 <= fromBlock < toBlock (exclusive), and 1..1000 pages");
  const evidence = new Map<string, ActivityEvidence>();
  const batches: { fromBlock: number; nextBlock: number | null; archiveHeight: number | null;
    rawRows: number; rollbackGuard: unknown }[] = [];
  const captures: { query: { fromBlock: number; toBlock: number; subjectWallet: string }; raw: unknown }[] = [];
  let cursor = fromBlock; let rawRowsRetrieved = 0; let stop: "exhausted" | "limit" | "error" | "unknown" = "limit";
  let error: { code: string; message: string } | undefined;
  let previousGuard: RollbackObservation | null = null;
  const startedAt = (options.now?.() ?? new Date()).toISOString();
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    try {
      const query = { fromBlock: cursor, toBlock, subjectWallet: wallet };
      const { page, raw } = await provider.get(query);
      if (!page || !Array.isArray(page.transactions) || !Array.isArray(page.blocks)) return malformed();
      rawRowsRetrieved += page.transactions.length;
      captures.push({ query, raw });
      const next = page.nextBlock == null ? null : safeBlock(page.nextBlock);
      if (next !== null && (next <= cursor || next > toBlock)) return malformed();
      const archiveHeight = page.archiveHeight == null ? null : safeBlock(page.archiveHeight);
      if (next !== null && archiveHeight !== null && BigInt(next) > BigInt(archiveHeight) + 1n) return malformed();
      const guard = rollbackObservation(page.rollbackGuard);
      if (guard && (guard.blockNumber >= toBlock || (next !== null && guard.blockNumber !== next - 1))) return malformed();
      if (guard && previousGuard && guard.firstBlockNumber === previousGuard.blockNumber + 1 &&
        guard.firstParentHash !== previousGuard.hash)
        throw new ActivityError("conflicting_evidence", "HyperSync rollback guards indicate a changed chain segment");
      const records = normalizePage(page, wallet, fromBlock, toBlock);
      const candidate = new Map(evidence);
      for (const r of records) {
        const n = Number(r.blockNumber);
        if ((n < cursor && !evidence.has(r.evidenceId)) || (next !== null && n >= next)) return malformed();
      }
      mergeEvidence(candidate, records); // Page is accepted atomically, including duplicate conflicts.
      const blockHashes = new Map<string, string>();
      for (const r of candidate.values()) {
        if (blockHashes.has(r.blockNumber) && blockHashes.get(r.blockNumber) !== r.blockHash)
          throw new ActivityError("conflicting_evidence", "Transactions disagree on block hash across batches");
        blockHashes.set(r.blockNumber, r.blockHash);
      }
      if (candidate.size > 100000) throw new ActivityError("provider_error", "Evidence exceeded the 100000-record limit");
      evidence.clear(); for (const [key, value] of candidate) evidence.set(key, value);
      batches.push({ fromBlock: cursor, nextBlock: next, archiveHeight, rawRows: page.transactions.length,
        rollbackGuard: page.rollbackGuard ?? null });
      previousGuard = guard;
      if (next === null) { stop = "unknown"; break; }
      cursor = next;
      if (cursor === toBlock) { stop = "exhausted"; break; }
    } catch (e) {
      const safe = e instanceof ActivityError ? e : new ActivityError("provider_error", "Envio request failed");
      error = { code: safe.code, message: safe.message }; stop = "error"; break;
    }
  }
  return {
    state: error ? "error" as const : "retrieved" as const,
    ...(error ? { error } : {}),
    evidence: [...evidence.values()].sort((a, b) => {
      const diff = BigInt(a.blockNumber) - BigInt(b.blockNumber);
      return diff < 0n ? -1 : diff > 0n ? 1 : a.transactionHash.localeCompare(b.transactionHash);
    }),
    provenance: { provider: "envio", product: "hypersync", network: "monad-testnet", chainId: 10143,
      endpoint: HYPERSYNC_ENDPOINT, transport: provider.transport, subjectWallet: wallet,
      subjectSource: "ERC-8004 registry-designated agentWallet", agentId: identity.agentId,
      agentRegistry: identity.agentRegistry, identityResolution: identity.resolution,
      fromBlock, toBlock, rangeSemantics: "[fromBlock,toBlock)",
      universe: "Direct EVM transactions whose sender equals the current registry-designated agentWallet; all observed statuses",
      startedAt, retrievedAt: (options.now?.() ?? new Date()).toISOString(),
      rawRowsRetrieved, normalizedEvidenceCount: evidence.size, coverageStatus: coverageFor(stop, batches.length),
      stopReason: stop, nextBlock: cursor, maxPages, batches },
    captures
  };
}
