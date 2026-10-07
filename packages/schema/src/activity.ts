import { z } from "zod";
import { evidenceRecordSchema, buildEvidenceId } from "./evidence.js";

// Additive ingestion contract: does not change PassportBundle v1 or its digest.
export const activityEvidenceSchema = evidenceRecordSchema.extend({
  chainId: z.literal(10143),
  transactionHash: z.string().regex(/^0x[0-9a-f]{64}$/),
  sender: z.string().regex(/^0x[0-9a-f]{40}$/),
  recipient: z.string().regex(/^0x[0-9a-f]{40}$/).nullable(),
  blockNumber: z.string().regex(/^(0|[1-9][0-9]*)$/),
  blockHash: z.string().regex(/^0x[0-9a-f]{64}$/),
  value: z.string().regex(/^(0|[1-9][0-9]*)$/).optional(),
  status: z.enum(["success", "failed", "unknown"]),
  provider: z.literal("envio"),
  source: z.object({ product: z.literal("hypersync"), network: z.literal("monad-testnet") })
}).refine(r => r.evidenceId === buildEvidenceId(r.chainId, r.transactionHash) && r.logIndex == null,
  "Activity requires the existing transaction-level evidence ID");
export type ActivityEvidence = z.infer<typeof activityEvidenceSchema>;
