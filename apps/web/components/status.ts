import { createElement, type ReactNode } from "react";
// Plain .ts (no JSX) so browser import-graph checks can traverse it like other modules.
export type Tone = "positive" | "neutral" | "caution" | "negative" | "brand" | "pending";
const glyphs: Record<Tone, string> = { positive: "✓", neutral: "–", caution: "?", negative: "✕", brand: "■", pending: "…" };
/** Status label: tone is carried by glyph shape and text, never by color alone. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return createElement("span", { className: `badge ${tone}` }, createElement("span", { className: "badge-glyph", "aria-hidden": "true" }, glyphs[tone]), children);
}
