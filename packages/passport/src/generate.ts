import { z } from "zod";
import type { retrieveAgentActivity } from "../../activity/src/index.js";
import { agentIdentitySchema, type AgentIdentity } from "../../schema/src/identity.js";
import { activityEvidenceSchema, type ActivityEvidence } from "../../schema/src/activity.js";
import { agentPassportPayloadV2Schema, generationMetadataSchema, validateAgentPassportReferences,
  METRIC_IDS, METRIC_LABELS, SCOPE_LIMITATIONS, WALLET_ACTIVITY_DESCRIPTION, ACTIVITY_UNIVERSE,
  type GenerationMetadata, type AgentPassportBundleV2 } from "../../schema/src/agent-passport.js";
import { canonicalJsonStringify, computePayloadDigest } from "../../verification/src/index.js";
import { calculateMetrics } from "./metrics.js";

export type ActivityRetrievalResult = Awaited<ReturnType<typeof retrieveAgentActivity>>;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const retrievalSchema = z.object({
  state: z.literal("retrieved"), error: z.never().optional(), evidence: z.array(z.unknown()),
  provenance: z.object({
    provider: z.literal("envio"), product: z.literal("hypersync"), network: z.literal("monad-testnet"), chainId: z.literal(10143),
    endpoint: z.literal("https://monad-testnet.hypersync.xyz"), transport: z.enum(["native", "json"]),
    subjectWallet: z.string(), subjectSource: z.literal("ERC-8004 registry-designated agentWallet"),
    agentId: z.string(), agentRegistry: z.string(), identityResolution: agentIdentitySchema.shape.resolution,
    fromBlock: count, toBlock: count, rangeSemantics: z.literal("[fromBlock,toBlock)"), universe: z.literal(ACTIVITY_UNIVERSE),
    startedAt: z.string().datetime(), retrievedAt: z.string().datetime(),
    rawRowsRetrieved: count, normalizedEvidenceCount: count,
    coverageStatus: z.enum(["complete_for_query", "partial", "unknown"]),
    stopReason: z.enum(["exhausted", "limit", "unknown"]), nextBlock: count,
    batches: z.array(z.object({ fromBlock: count, nextBlock: count.nullable(), rawRows: count })).min(1)
  })
});
export class PassportGenerationError extends Error {
  constructor() { super("Invalid identity, evidence, retrieval scope/coverage or generation metadata; no Passport generated"); }
}

export function generateAgentPassport(identity: AgentIdentity, activity: ActivityRetrievalResult,
  generation: GenerationMetadata): AgentPassportBundleV2 {
  try {
    const subject = agentIdentitySchema.parse(identity), input = retrievalSchema.parse(activity);
    const metadata = generationMetadataSchema.parse(generation), p = input.provenance;
    if (subject.agentWalletStatus !== "set" || subject.agentWallet !== p.subjectWallet || subject.agentId !== p.agentId ||
      subject.agentRegistry !== p.agentRegistry || canonicalJsonStringify(subject.resolution) !== canonicalJsonStringify(p.identityResolution)) throw Error();
    const rows = new Map<string, ActivityEvidence>();
    for (const raw of input.evidence) {
      // Allow address case at this boundary, then revalidate the canonical M2 shape.
      if (!raw || typeof raw !== "object") throw Error();
      const r = raw as Record<string, unknown>;
      const e = activityEvidenceSchema.strict().parse({ ...r,
        sender: typeof r.sender === "string" ? r.sender.toLowerCase() : r.sender,
        recipient: typeof r.recipient === "string" ? r.recipient.toLowerCase() : r.recipient });
      const previous = rows.get(e.evidenceId);
      if (previous && canonicalJsonStringify(previous) !== canonicalJsonStringify(e)) throw Error();
      rows.set(e.evidenceId, e);
    }
    const evidence = [...rows.values()].sort((a, b) => a.evidenceId < b.evidenceId ? -1 : a.evidenceId > b.evidenceId ? 1 : 0);
    if (p.normalizedEvidenceCount !== evidence.length || p.rawRowsRetrieved < input.evidence.length) throw Error();
    let cursor = p.fromBlock, rawRows = 0;
    for (const [index, b] of p.batches.entries()) {
      if (b.fromBlock !== cursor || (b.nextBlock === null && (index !== p.batches.length - 1 || p.stopReason !== "unknown"))) throw Error();
      if (b.nextBlock !== null) {
        if (b.nextBlock <= cursor || b.nextBlock > p.toBlock) throw Error(); cursor = b.nextBlock;
      }
      rawRows += b.rawRows;
    }
    if (!Number.isSafeInteger(rawRows) || rawRows !== p.rawRowsRetrieved || cursor !== p.nextBlock ||
      (p.stopReason === "unknown" && p.batches.at(-1)?.nextBlock !== null)) throw Error();
    const metrics = calculateMetrics(evidence);
    const observations = metrics.map(m => ({ observationId: `observation:${m.metricId}`, metricIds: [m.metricId],
      label: METRIC_LABELS[m.metricId], value: m.value, evidenceIds: [...m.evidenceIds], evidenceCount: m.evidenceIds.length,
      coverageStatus: p.coverageStatus, interpretation: "Observed dataset within the declared query scope" as const }));
    const payload = agentPassportPayloadV2Schema.parse({
      schemaVersion: "2.0.0", passportId: `agent:${subject.agentRegistry}:${subject.agentId}`, subject,
      observationScope: { chainId: p.chainId, subjectWallet: p.subjectWallet,
        walletAssociationBasis: "current_erc8004_registry_designation", walletAssociationAsOf: subject.resolution.resolvedAt,
        description: WALLET_ACTIVITY_DESCRIPTION, activityScope: "direct_outgoing_transactions_all_statuses",
        fromBlock: String(p.fromBlock), toBlockExclusive: String(p.toBlock) },
      metrics, observations, observationOrder: METRIC_IDS.filter(id => metrics.some(m => m.metricId === id)).map(id => `observation:${id}`), evidence,
      coverage: { coverageStatus: p.coverageStatus, stopReason: p.stopReason, nextBlock: String(p.nextBlock),
        rawRowsRetrieved: p.rawRowsRetrieved, normalizedEvidenceCount: evidence.length, pageCount: p.batches.length },
      provenance: { provider: p.provider, product: p.product, network: p.network, endpoint: p.endpoint,
        transport: p.transport, startedAt: p.startedAt, retrievedAt: p.retrievedAt },
      limitations: SCOPE_LIMITATIONS.map(l => ({ ...l })), generation: metadata
    });
    if (validateAgentPassportReferences(payload).length) throw Error();
    return { schemaVersion: "2.0.0", payload, integrity: { algorithm: "sha256", digest: computePayloadDigest(payload) } };
  } catch { throw new PassportGenerationError(); }
}
