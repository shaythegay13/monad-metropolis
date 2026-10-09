import { z } from "zod";
const threshold = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const consumerPolicySchema = z.object({
  policyVersion: z.literal("1.0.0"),
  minimumObservedTransactions: threshold.optional(),
  minimumActiveUtcDays: threshold.optional(),
  minimumUniqueRecipientAddresses: threshold.optional(),
  requireCompleteCoverage: z.boolean().optional(),
  requireLocalIntegrity: z.boolean().optional(),
  requireMonadPublication: z.boolean().optional()
}).strict();
export type ConsumerPolicy = z.infer<typeof consumerPolicySchema>;
export const metricCriteria = {
  minimumObservedTransactions: "observed_transaction_count",
  minimumActiveUtcDays: "active_utc_days",
  minimumUniqueRecipientAddresses: "unique_recipient_addresses"
} as const;
