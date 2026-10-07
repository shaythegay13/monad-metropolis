import { agentPassportBundleV2Schema, validateAgentPassportReferences, type AgentPassportBundleV2 } from "../../schema/src/agent-passport.js";
import { computePayloadDigest } from "../../verification/src/digest.js";

export interface AgentBundleValidationResult {
  schemaVersion: "2.0.0"; isValid: boolean;
  schemaValid: boolean; referencesValid: boolean; digestMatches: boolean;
  integrityLabel: string; errors: string[]; bundle?: AgentPassportBundleV2;
}
export function validateAgentBundle(raw: unknown): AgentBundleValidationResult {
  const result: AgentBundleValidationResult = { schemaVersion: "2.0.0", isValid: false,
    schemaValid: false, referencesValid: false, digestMatches: false, integrityLabel: "Passport integrity not verified", errors: [] };
  try {
    const parsed = agentPassportBundleV2Schema.safeParse(raw);
    if (!parsed.success) { result.errors.push("Invalid v2 schema"); return result; }
    result.schemaValid = true;
    result.errors = validateAgentPassportReferences(parsed.data.payload);
    result.referencesValid = result.errors.length === 0;
    // Hash the entire supplied payload, never a Zod projection that could strip fields.
    const original = raw as AgentPassportBundleV2;
    result.digestMatches = computePayloadDigest(original.payload) === original.integrity.digest;
    if (!result.digestMatches) result.errors.push("Payload digest mismatch");
    result.isValid = result.referencesValid && result.digestMatches;
    if (result.isValid) { result.bundle = original; result.integrityLabel = "Passport integrity verified"; }
    return result;
  } catch { result.errors.push("Payload cannot be canonically verified"); return result; }
}
