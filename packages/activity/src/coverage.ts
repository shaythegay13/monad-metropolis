import type { CoverageStatus } from "../../schema/src/coverage.js";

export function coverageFor(stop: "exhausted" | "limit" | "error" | "unknown", completedPages: number): CoverageStatus {
  if (stop === "exhausted") return "complete_for_query";
  if (stop === "unknown") return "unknown";
  return completedPages > 0 || stop === "limit" ? "partial" : "unknown";
}
