import { validateAgentBundle } from "../../consumer/src/validate-agent-bundle.js";
import { verifyPublishedPassport, type RegistryTrust, type PublicationVerification } from "../../publication/src/verify.js";
import type { Rpc } from "../../identity/src/resolver.js";
import type { AgentPassportPayloadV2 } from "../../schema/src/agent-passport.js";
import { consumerPolicySchema, metricCriteria, type ConsumerPolicy } from "./schema.js";

export type Decision = "PASS" | "FAIL" | "INSUFFICIENT_EVIDENCE";
export interface PolicyCheck { criterion: string; outcome: Decision; reason: string; metricId?: string;
  actual?: number; required?: number; evidenceIds: string[] }
export interface Evaluation {
  candidateId: string; agentId: string | null; passportVersion: number | null; digest: string | null;
  policy: ConsumerPolicy; outcome: "SATISFIED" | "NOT_SATISFIED" | "INDETERMINATE";
  integrity: "valid" | "invalid"; publication: PublicationVerification | { status: "not_checked" };
  coverage: AgentPassportPayloadV2["coverage"] | null;
  scope: AgentPassportPayloadV2["observationScope"] | null;
  limitations: AgentPassportPayloadV2["limitations"];
  generatedAt: string | null; retrievedAt: string | null;
  observedActivity: { first: string | null; last: string | null };
  checks: PolicyCheck[];
}
// Runtime provenance prevents callers from passing a JSON object claiming verification.
const contexts = new WeakSet<object>();
const evaluations = new WeakSet<object>();
export interface VerifiedCandidate { readonly candidateId: string }
type Internal = VerifiedCandidate & { payload?: AgentPassportPayloadV2; digest?: string;
  publication: Evaluation["publication"] };
function freeze<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export async function verifyCandidate(candidateId: string, raw: unknown,
  chain?: { trust: RegistryTrust; rpc: Rpc }): Promise<VerifiedCandidate> {
  if (!/^[a-zA-Z0-9:_-]{1,160}$/.test(candidateId)) throw Error("Invalid candidate identifier");
  // Snapshot before asynchronous reads so mutation cannot change the evaluated artifact.
  const snapshot: unknown = structuredClone(raw);
  const local = validateAgentBundle(snapshot);
  const publication: Evaluation["publication"] = chain && local.isValid
    ? await verifyPublishedPassport(snapshot, chain.trust, chain.rpc) : { status: "not_checked" };
  const context: Internal = { candidateId, publication,
    ...(local.isValid && local.bundle ? { payload: local.bundle.payload, digest: local.bundle.integrity.digest } : {}) };
  contexts.add(context); return freeze(context);
}
export function evaluatePolicy(candidate: VerifiedCandidate, rawPolicy: unknown): Evaluation {
  if (!contexts.has(candidate)) throw Error("Use verifyCandidate before evaluation");
  const policy = consumerPolicySchema.parse(rawPolicy);
  const { payload: p, publication, digest, candidateId } = candidate as Internal;
  const checks: PolicyCheck[] = [];
  const add = (criterion: string, outcome: Decision, reason: string) => checks.push({ criterion, outcome, reason, evidenceIds: [] });
  // Mandatory safety precondition, even when the optional setting is false or omitted.
  add("local_integrity", p ? "PASS" : "FAIL", p ? "Schema, references and canonical digest verified; this does not prove source-data truth."
    : "Invalid schema, references or digest. Unverified observations cannot qualify.");
  for (const [key, metricId] of Object.entries(metricCriteria)) {
    const required = policy[key as keyof typeof metricCriteria];
    if (required === undefined) continue;
    const metric = p?.metrics.find(m => m.metricId === metricId);
    const complete = p?.coverage.coverageStatus === "complete_for_query";
    const usable = metric && typeof metric.value === "number" && Number.isSafeInteger(metric.value);
    const outcome: Decision = !usable || !complete ? "INSUFFICIENT_EVIDENCE" : (metric.value as number) >= required ? "PASS" : "FAIL";
    checks.push({ criterion: key, metricId, required, ...(usable ? { actual: metric.value as number } : {}), outcome,
      evidenceIds: metric ? [...metric.evidenceIds].sort() : [],
      reason: !usable ? "No independently validated metric is available." : !complete
        ? "Partial or unknown coverage cannot establish this scoped threshold; policy v1 requires complete query coverage for numeric checks."
        : `Observed ${metric.value} within this dataset; consumer requires at least ${required}.` });
  }
  if (policy.requireCompleteCoverage) add("complete_coverage", !p || p.coverage.coverageStatus === "unknown"
    ? "INSUFFICIENT_EVIDENCE" : p.coverage.coverageStatus === "complete_for_query" ? "PASS" : "FAIL",
    p ? `Query coverage is ${p.coverage.coverageStatus}; it is not lifetime coverage.` : "Validated coverage unavailable.");
  if (policy.requireMonadPublication) {
    const status = publication.status;
    const passed = status === "verified" && publication.registryVerified && publication.publicationProvenanceVerified && publication.publishedHashMatches;
    add("monad_publication", passed ? "PASS" : status === "not_found" || status === "hash_mismatch" ? "FAIL" : "INSUFFICIENT_EVIDENCE",
      passed ? "Independent Monad record matches this exact version and digest." : status === "not_found"
        ? "Confirmed absent for this agent/version at the checked Registry block." : status === "hash_mismatch"
        ? "The published digest differs from this artifact." : "Publication could not be established; this is not proof of absence.");
  }
  const result: Evaluation = { candidateId, agentId: p?.subject.agentId ?? null, passportVersion: p?.generation.passportVersion ?? null,
    digest: digest ?? null, policy, integrity: p ? "valid" : "invalid", publication,
    coverage: p?.coverage ?? null, scope: p?.observationScope ?? null, limitations: p?.limitations ?? [],
    generatedAt: p?.generation.generatedAt ?? null, retrievedAt: p?.provenance.retrievedAt ?? null,
    observedActivity: { first: p?.metrics.find(m => m.metricId === "first_observed_activity_at")?.value as string ?? null,
      last: p?.metrics.find(m => m.metricId === "last_observed_activity_at")?.value as string ?? null }, checks,
    outcome: checks.some(c => c.outcome === "FAIL") ? "NOT_SATISFIED" : checks.some(c => c.outcome === "INSUFFICIENT_EVIDENCE") ? "INDETERMINATE" : "SATISFIED" };
  evaluations.add(result); return freeze(result);
}
export function isEvaluation(value: Evaluation) { return evaluations.has(value); }
