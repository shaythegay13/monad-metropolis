// Use the same Zod instance as the reused application schema, avoiding mixing
// distinct Zod type versions when constructing its narrowly adapted fields.
import { z } from '../../node_modules/zod/index.js'
import { activityEvidenceSchema } from '../../packages/schema/src/activity'
import { agentPassportBundleV2Schema, agentPassportPayloadV2Schema } from '../../packages/schema/src/agent-passport'

// QuickJS has no WHATWG URL constructor for Zod's .url() check. The accepted
// reference validator already requires this exact provider URL. Narrowing that
// one field to its required literal is stricter than .url(), preserves every
// other full-schema/refinement check, and does not change the application schema.
const evidence = activityEvidenceSchema.safeExtend({
  sourceReference: z.literal('https://monad-testnet.hypersync.xyz/query'),
}).strict()
const payload = agentPassportPayloadV2Schema.safeExtend({ evidence: z.array(evidence) })
export const crePassportBundleSchema = agentPassportBundleV2Schema.safeExtend({ payload })
