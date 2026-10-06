import type { PassportBundle } from "../../schema/src/index.js";

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
  bundle?: PassportBundle;
  errorSummary?: string;
  integrityLabel: string;
  integrityExplanation: string;
  publicationLabel: string;
  publicationExplanation: string;
};
