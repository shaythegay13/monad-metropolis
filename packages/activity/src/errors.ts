export type ActivityErrorCode = "missing_api_token" | "unsupported_platform" | "invalid_config" |
  "agent_wallet_unset" | "invalid_subject" | "provider_authentication" | "provider_error" |
  "malformed_response" | "subject_mismatch" | "conflicting_evidence";
export class ActivityError extends Error {
  constructor(public readonly code: ActivityErrorCode, message: string) { super(message); }
}
export function malformed(): never {
  throw new ActivityError("malformed_response", "HyperSync returned invalid fields, bounds or continuation metadata");
}
