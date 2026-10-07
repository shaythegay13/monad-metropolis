import { z } from "zod";
import { buildEvidenceId } from "../../schema/src/evidence.js";
import { activityEvidenceSchema, type ActivityEvidence } from "../../schema/src/activity.js";
import { ActivityError, malformed } from "./errors.js";

const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/).transform(v => v.toLowerCase());
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/).transform(v => v.toLowerCase());
export function unsigned(value: unknown): bigint {
  if (typeof value === "bigint" && value >= 0n) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === "string" && /^(?:0|[1-9][0-9]*|0x[0-9a-fA-F]+)$/.test(value)) return BigInt(value);
  return malformed();
}
export function safeBlock(value: unknown): number {
  const n = unsigned(value);
  if (n > BigInt(Number.MAX_SAFE_INTEGER)) return malformed();
  return Number(n);
}
export interface ProviderPage {
  blocks: unknown[]; transactions: unknown[]; nextBlock?: unknown;
  archiveHeight?: unknown; rollbackGuard?: unknown;
}
export interface RollbackObservation {
  blockNumber: number; timestamp: string; hash: string; firstBlockNumber: number; firstParentHash: string;
}
export function rollbackObservation(value: unknown): RollbackObservation | null {
  if (value == null) return null;
  try {
    if (typeof value !== "object" || Array.isArray(value)) return malformed();
    const v = value as Record<string, unknown>;
    const observation = { blockNumber: safeBlock(v.blockNumber ?? v.block_number),
      timestamp: unsigned(v.timestamp).toString(), hash: hash.parse(v.hash),
      firstBlockNumber: safeBlock(v.firstBlockNumber ?? v.first_block_number),
      firstParentHash: hash.parse(v.firstParentHash ?? v.first_parent_hash) };
    if (observation.firstBlockNumber > observation.blockNumber) return malformed();
    return observation;
  } catch (e) { if (e instanceof ActivityError) throw e; return malformed(); }
}
const blockSchema = z.object({ number: z.unknown(), timestamp: z.unknown(), hash });
const transactionSchema = z.object({
  hash, blockNumber: z.unknown(), blockHash: hash, from: address,
  to: address.nullish(), value: z.unknown().optional(), status: z.union([z.literal(0), z.literal(1)]).nullish()
});

export function normalizePage(page: ProviderPage, subjectWallet: string, fromBlock: number, toBlock: number): ActivityEvidence[] {
  try {
    const blocks = new Map<string, { timestamp: string; hash: string }>();
    for (const raw of page.blocks) {
      const b = blockSchema.parse(raw); const number = unsigned(b.number);
      if (number < BigInt(fromBlock) || number >= BigInt(toBlock)) return malformed();
      const milliseconds = unsigned(b.timestamp) * 1000n;
      if (milliseconds > 8640000000000000n) return malformed();
      const block = { timestamp: new Date(Number(milliseconds)).toISOString(), hash: b.hash };
      const previous = blocks.get(number.toString());
      if (previous && JSON.stringify(previous) !== JSON.stringify(block))
        throw new ActivityError("conflicting_evidence", "Conflicting block data");
      blocks.set(number.toString(), block);
    }
    return page.transactions.map(raw => {
      const tx = transactionSchema.parse(raw); const blockNumber = unsigned(tx.blockNumber).toString();
      if (tx.from !== subjectWallet.toLowerCase())
        throw new ActivityError("subject_mismatch", "Transaction sender does not match the registry-designated agentWallet");
      const block = blocks.get(blockNumber);
      if (!block || block.hash !== tx.blockHash) return malformed();
      const value = tx.value == null ? undefined : unsigned(tx.value);
      if (value !== undefined && value >= 1n << 256n) return malformed();
      return activityEvidenceSchema.parse({
        evidenceId: buildEvidenceId(10143, tx.hash), chainId: 10143,
        transactionHash: tx.hash, blockNumber, blockHash: tx.blockHash,
        timestamp: block.timestamp, sender: tx.from, recipient: tx.to ?? null,
        status: tx.status === 1 ? "success" : tx.status === 0 ? "failed" : "unknown",
        ...(value === undefined ? {} : { value: value.toString() }),
        provider: "envio", sourceReference: "https://monad-testnet.hypersync.xyz/query",
        source: { product: "hypersync", network: "monad-testnet" }
      });
    });
  } catch (e) { if (e instanceof ActivityError) throw e; return malformed(); }
}

export function mergeEvidence(target: Map<string, ActivityEvidence>, records: ActivityEvidence[]): void {
  for (const record of records) {
    const previous = target.get(record.evidenceId);
    if (previous && JSON.stringify(previous) !== JSON.stringify(record))
      throw new ActivityError("conflicting_evidence", "Duplicate transaction contains conflicting fields");
    target.set(record.evidenceId, record);
  }
}
