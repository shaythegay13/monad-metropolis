import type { PassportBundle } from "../../schema/src/index.js";
import type { AgentPassportBundleV2 } from "../../schema/src/agent-passport.js";

export type ValidationStepResult = {
  step: "schema" | "address" | "evidence" | "integrity";
  name: string;
  passed: boolean;
  message: string;
  detail?: string;
};

export type BundleValidationResult = {
  isValid: boolean;
  steps: ValidationStepResult[];
  bundle?: PassportBundle | AgentPassportBundleV2;
  errorSummary?: string;
  integrityLabel: string;
  integrityExplanation: string;
  publicationLabel: string;
  publicationExplanation: string;
};
