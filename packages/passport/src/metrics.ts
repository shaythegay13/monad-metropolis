import type { ActivityEvidence } from "../../schema/src/activity.js";
import { CALCULATION_VERSION, type PassportMetric, type MetricId } from "../../schema/src/agent-passport.js";

// Pure reduction over validated, deduplicated evidence; no clock, I/O or provider.
export function calculateMetrics(evidence: readonly ActivityEvidence[]): PassportMetric[] {
  const evidenceIds = evidence.map(e => e.evidenceId).sort();
  const metric = (metricId: MetricId, value: number | string): PassportMetric =>
    ({ metricId, value, evidenceIds: [...evidenceIds], calculationVersion: CALCULATION_VERSION });
  const times = evidence.map(e => new Date(e.timestamp).toISOString()).sort();
  const metrics = [
    metric("observed_transaction_count", evidence.length),
    metric("active_utc_days", new Set(times.map(t => t.slice(0, 10))).size),
    metric("unique_recipient_addresses", new Set(evidence.flatMap(e => e.recipient === null ? [] : [e.recipient.toLowerCase()])).size),
    metric("successful_execution_count", evidence.filter(e => e.status === "success").length),
    metric("failed_execution_count", evidence.filter(e => e.status === "failed").length),
    metric("unknown_execution_status_count", evidence.filter(e => e.status === "unknown").length)
  ];
  if (times.length) metrics.push(metric("first_observed_activity_at", times[0]), metric("last_observed_activity_at", times[times.length - 1]));
  return metrics.sort((a, b) => a.metricId < b.metricId ? -1 : a.metricId > b.metricId ? 1 : 0);
}
