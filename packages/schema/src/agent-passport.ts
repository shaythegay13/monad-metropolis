import { z } from "zod";
import { agentIdentitySchema, UINT256_MAX } from "./identity.js";
import { activityEvidenceSchema } from "./activity.js";
import { coverageStatusSchema } from "./coverage.js";

export const CALCULATION_VERSION = "wallet-observations/1.0.0" as const;
export const WALLET_ACTIVITY_DESCRIPTION = "Observed activity for the wallet currently designated as this agent's ERC-8004 agentWallet.";
export const ACTIVITY_UNIVERSE = "Direct EVM transactions whose sender equals the current registry-designated agentWallet; all observed statuses";
export const METRIC_LABELS = {
  observed_transaction_count: "Observed transactions",
  active_utc_days: "Active UTC days within this dataset",
  unique_recipient_addresses: "Unique recipient addresses",
  first_observed_activity_at: "First observed transaction within this dataset",
  last_observed_activity_at: "Last observed transaction within this dataset",
  successful_execution_count: "Successful EVM executions observed",
  failed_execution_count: "Failed EVM executions observed",
  unknown_execution_status_count: "Unknown EVM execution statuses observed"
} as const;
export type MetricId = keyof typeof METRIC_LABELS;
export const METRIC_IDS = Object.keys(METRIC_LABELS) as MetricId[];
export const SCOPE_LIMITATIONS = [
  { code: "current_association_only", description: "Current ERC-8004 wallet association does not prove historical association at the time of every observed transaction." },
  { code: "transaction_semantics_only", description: "Direct transactions and successful EVM executions do not establish payments, commerce, service delivery, trading, or business relationships." },
  { code: "address_semantics_only", description: "Recipient addresses are not automatically independent counterparties." },
  { code: "query_scope_only", description: "Coverage applies only to the declared query scope; observations describe the included dataset, not lifetime totals." }
] as const;

const decimal = z.string().regex(/^(0|[1-9][0-9]*)$/);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const address = z.string().regex(/^0x[0-9a-f]{40}$/);
const hash = z.string().regex(/^[0-9a-f]{64}$/);
const metricId = z.enum(METRIC_IDS as [MetricId, ...MetricId[]]);
const value = z.union([count, z.string().datetime()]);
export const passportMetricSchema = z.object({
  metricId, value, evidenceIds: z.array(z.string()), calculationVersion: z.literal(CALCULATION_VERSION)
}).strict().superRefine((m, ctx) => {
  const temporal = m.metricId === "first_observed_activity_at" || m.metricId === "last_observed_activity_at";
  if (temporal !== (typeof m.value === "string")) ctx.addIssue({ code: "custom", message: "Metric value type does not match its definition" });
});
export const passportObservationSchema = z.object({
  observationId: z.string().min(1), metricIds: z.array(metricId).length(1),
  label: z.string(), value, evidenceIds: z.array(z.string()), evidenceCount: count,
  coverageStatus: coverageStatusSchema,
  interpretation: z.literal("Observed dataset within the declared query scope")
}).strict();
export const generationMetadataSchema = z.object({
  generatedAt: z.string().datetime(), passportVersion: count.min(1), previousVersionHash: hash.optional()
}).strict().superRefine((m, ctx) => {
  if ((m.passportVersion === 1) === Boolean(m.previousVersionHash))
    ctx.addIssue({ code: "custom", message: "Version 1 has no previous hash; later versions require one" });
});

export const agentPassportPayloadV2Schema = z.object({
  schemaVersion: z.literal("2.0.0"), passportId: z.string().min(1),
  subject: agentIdentitySchema,
  observationScope: z.object({
    chainId: z.literal(10143), subjectWallet: address,
    walletAssociationBasis: z.literal("current_erc8004_registry_designation"),
    walletAssociationAsOf: z.string().datetime(), description: z.literal(WALLET_ACTIVITY_DESCRIPTION),
    activityScope: z.literal("direct_outgoing_transactions_all_statuses"),
    fromBlock: decimal, toBlockExclusive: decimal
  }).strict(),
  metrics: z.array(passportMetricSchema), observations: z.array(passportObservationSchema),
  // A consumer presentation order referencing observation IDs, not array positions.
  observationOrder: z.array(z.string()),
  evidence: z.array(activityEvidenceSchema.strict()),
  coverage: z.object({ coverageStatus: coverageStatusSchema,
    stopReason: z.enum(["exhausted", "limit", "unknown"]), nextBlock: decimal,
    rawRowsRetrieved: count, normalizedEvidenceCount: count, pageCount: count.min(1) }).strict(),
  provenance: z.object({ provider: z.literal("envio"), product: z.literal("hypersync"),
    network: z.literal("monad-testnet"), endpoint: z.literal("https://monad-testnet.hypersync.xyz"),
    transport: z.enum(["native", "json"]), startedAt: z.string().datetime(), retrievedAt: z.string().datetime() }).strict(),
  limitations: z.array(z.object({ code: z.string(), description: z.string() }).strict()),
  generation: generationMetadataSchema
}).strict();
export const agentPassportBundleV2Schema = z.object({ schemaVersion: z.literal("2.0.0"),
  payload: agentPassportPayloadV2Schema,
  integrity: z.object({ algorithm: z.literal("sha256"), digest: hash }).strict()
}).strict();
export type PassportMetric = z.infer<typeof passportMetricSchema>;
export type PassportObservation = z.infer<typeof passportObservationSchema>;
export type GenerationMetadata = z.infer<typeof generationMetadataSchema>;
export type AgentPassportPayloadV2 = z.infer<typeof agentPassportPayloadV2Schema>;
export type AgentPassportBundleV2 = z.infer<typeof agentPassportBundleV2Schema>;

/** Structural/reference coherence only. No metric calculation or provider access. */
export function validateAgentPassportReferences(p: AgentPassportPayloadV2): string[] {
  const errors: string[] = [];
  const fail = (message: string) => { errors.push(message); };
  const s = p.observationScope, c = p.coverage;
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  const equalIds = (a: string[], b: string[]) => {
    const available = new Set(b);
    return unique(a) && available.size === b.length && a.length === b.length && a.every(id => available.has(id));
  };
  if (p.subject.chainId !== s.chainId || p.subject.network !== "monad-testnet" ||
    p.subject.registryAddress !== "0x8004a818bfb912233c491871b3d84c89a494bd9e" ||
    p.subject.agentWalletStatus !== "set" || p.subject.agentWallet !== s.subjectWallet ||
    p.subject.resolution.resolvedAt !== s.walletAssociationAsOf) fail("Subject and observation scope disagree");
  if (p.passportId !== `agent:${p.subject.agentRegistry}:${p.subject.agentId}`) fail("Passport ID does not match the subject");
  const from = BigInt(s.fromBlock), to = BigInt(s.toBlockExclusive), next = BigInt(c.nextBlock);
  if (from >= to || next < from || next > to) fail("Invalid query bounds/continuation");
  if ((c.coverageStatus === "complete_for_query" && (c.stopReason !== "exhausted" || next !== to)) ||
    (c.coverageStatus === "partial" && (c.stopReason !== "limit" || next >= to)) ||
    (c.coverageStatus === "unknown" && c.stopReason !== "unknown")) fail("Coverage and stopping condition disagree");
  if (c.normalizedEvidenceCount !== p.evidence.length || c.rawRowsRetrieved < p.evidence.length)
    fail("Coverage counts do not match included evidence");
  if (Date.parse(p.provenance.startedAt) > Date.parse(p.provenance.retrievedAt) ||
    Date.parse(p.provenance.retrievedAt) > Date.parse(p.generation.generatedAt)) fail("Generation/retrieval chronology is invalid");
  const evidenceIds = p.evidence.map(e => e.evidenceId), metricIds = p.metrics.map(m => m.metricId);
  const observationIds = p.observations.map(o => o.observationId);
  if (!unique(evidenceIds) || !unique(metricIds) || !unique(observationIds)) fail("Duplicate record identifiers");
  const blockHeaders = new Map<string, string>();
  for (const e of p.evidence) {
    if (e.sender !== s.subjectWallet || e.chainId !== s.chainId || BigInt(e.blockNumber) < from || BigInt(e.blockNumber) >= to ||
      (c.coverageStatus !== "unknown" && BigInt(e.blockNumber) >= next)) fail("Evidence lies outside the declared subject/scope");
    if (e.sourceReference !== `${p.provenance.endpoint}/query`) fail("Evidence source does not match retrieval provenance");
    if (e.value !== undefined && BigInt(e.value) > UINT256_MAX) fail("Native value exceeds uint256");
    const header = `${e.blockHash}:${e.timestamp}`;
    if (blockHeaders.has(e.blockNumber) && blockHeaders.get(e.blockNumber) !== header) fail("Conflicting block headers in evidence");
    blockHeaders.set(e.blockNumber, header);
  }
  const required = METRIC_IDS.filter(id => p.evidence.length || !id.endsWith("_activity_at"));
  if (!equalIds(metricIds, required)) fail("Required metric set is missing or unexpected");
  for (const m of p.metrics) {
    if (!equalIds(m.evidenceIds, evidenceIds)) fail("Metric evidence references must resolve to the complete observed dataset");
  }
  if (!equalIds(observationIds, metricIds.map(id => `observation:${id}`))) fail("Observation IDs do not correspond to metric IDs");
  for (const o of p.observations) {
    const m = p.metrics.find(m => m.metricId === o.metricIds[0]);
    if (!m || o.observationId !== `observation:${m.metricId}` || o.value !== m.value ||
      o.label !== METRIC_LABELS[m.metricId] || !equalIds(o.evidenceIds, m.evidenceIds) ||
      o.evidenceCount !== o.evidenceIds.length || o.coverageStatus !== c.coverageStatus)
      fail("Observation metric/evidence/value/wording/coverage references disagree");
  }
  if (!equalIds(p.observationOrder, observationIds)) fail("Dangling, duplicate or missing observation reference in observationOrder");
  if (p.limitations.length !== SCOPE_LIMITATIONS.length || !unique(p.limitations.map(l => l.code)) ||
    SCOPE_LIMITATIONS.some(l => !p.limitations.some(actual => actual.code === l.code && actual.description === l.description)))
    fail("Required scope limitations are missing or changed");
  return errors;
}
