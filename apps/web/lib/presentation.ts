// Pure display adapters. No policy calculation or verification assertions.
export const outcomeLabels = { SATISFIED: "Meets your requirements", NOT_SATISFIED: "Requirements not met", INDETERMINATE: "More evidence needed" } as const;
export const publicationLabels = { verified: "Publication verified", not_found: "No matching publication", hash_mismatch: "Published hash mismatch",
  provider_error: "Publication unknown · RPC unavailable", invalid_registry: "Registry verification unavailable", invalid_local: "Invalid Passport integrity", not_checked: "Publication not checked" } as const;
export function dateLabel(value: string | null | undefined) {
  if (!value) return "Unavailable";
  const time = Date.parse(value); return Number.isNaN(time) ? "Unavailable" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(time);
}
export function versionLabel(version: number, latest?: string, loading = false) {
  if (loading) return `Version ${version} · checking latest publication`;
  if (!latest || !/^\d+$/.test(latest)) return `Version ${version} · latest status unavailable`;
  const current = BigInt(latest);
  return BigInt(version) === current ? `Version ${version} · latest published`
    : BigInt(version) < current ? `Version ${version} · historical` : `Version ${version} · publication not established`;
}
export function publicationTone(status?: string): "positive" | "negative" | "caution" | "neutral" {
  if (status === "verified") return "positive";
  if (status === "invalid_local" || status === "hash_mismatch") return "negative";
  if (status === "provider_error" || status === "invalid_registry") return "caution";
  return "neutral";
}
export const navigation = ["/", "/passport", "/compare", "/developers", "/wallet"] as const;
