import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dateLabel, versionLabel, publicationLabels, publicationTone, outcomeLabels, navigation } from "../apps/web/lib/presentation.js";
const read = (file: string) => readFileSync(file, "utf8");
test("M7 every primary destination has a real Next page", () => {
  for (const route of navigation) assert.ok(existsSync(`apps/web/app${route === "/" ? "" : route}/page.tsx`), route);
});
test("M7 latest and historical labels follow the live version, not schema version", () => {
  assert.equal(versionLabel(2, "2"), "Version 2 · latest published");
  assert.equal(versionLabel(1, "2"), "Version 1 · historical");
  assert.equal(versionLabel(2, "3"), "Version 2 · historical");
});
test("M7 an unknown or absent publication never becomes latest or historical", () => {
  for (const latest of [undefined, "", "garbage"]) assert.match(versionLabel(2, latest), /status unavailable/);
  for (const latest of ["0", "1"]) assert.match(versionLabel(2, latest), /publication not established/);
});
test("M7 a pending live read is labeled as loading rather than unavailable", () => {
  assert.equal(versionLabel(2, undefined, true), "Version 2 · checking latest publication");
  assert.equal(versionLabel(2, undefined, false), "Version 2 · latest status unavailable");
  assert.equal(versionLabel(2, "2", false), "Version 2 · latest published");
});
test("M7 provider failures remain distinct from confirmed absent publication", () => {
  assert.match(publicationLabels.provider_error, /unknown/);
  assert.match(publicationLabels.not_found, /No matching publication/);
  assert.equal(publicationTone("provider_error"), "caution");
  assert.equal(publicationTone("not_found"), "neutral");
  assert.equal(publicationTone("not_checked"), "neutral");
  assert.equal(publicationTone(undefined), "neutral");
});
test("M7 invalid integrity and mismatched digests have explicit failure presentation", () => {
  assert.equal(publicationTone("invalid_local"), "negative");
  assert.equal(publicationTone("hash_mismatch"), "negative");
  assert.equal(publicationTone("verified"), "positive");
  assert.equal(new Set(Object.values(publicationLabels)).size, 7);
});
test("M7 policy presentation retains all three outcomes without general agent judgment", () => {
  assert.deepEqual(Object.keys(outcomeLabels), ["SATISFIED", "NOT_SATISFIED", "INDETERMINATE"]);
  assert.match(outcomeLabels.INDETERMINATE, /evidence/);
  assert.doesNotMatch(Object.values(outcomeLabels).join(" "), /safe|trusted|malicious|score/i);
});
test("M7 activity dates use UTC and missing timestamps stay unavailable", () => {
  assert.equal(dateLabel("2026-10-08T00:05:00Z"), "Oct 8, 2026");
  for (const date of [undefined, null, "", "not a date"]) assert.equal(dateLabel(date), "Unavailable");
});
test("M7 real featured and historical artifacts are unchanged from accepted M6", () => {
  for (const file of ["fixtures/real/monad-m5/agent-2072-passport-v2.json", "fixtures/real/monad-m4/agent-2072-activity.json.passport.json", "fixtures/real/monad-m3/agent-2-passport-v2.json"]) {
    assert.equal(read(file), execFileSync("git", ["show", `91ca524:${file}`], { encoding: "utf8" }));
  }
});
test("M7 inspection and comparison cannot initiate publication or require a wallet", () => {
  for (const file of ["apps/web/app/passport/passport-view.tsx", "apps/web/app/compare/compare-app.tsx"]) {
    assert.doesNotMatch(read(file), /sendTransaction|signTransaction|signMessage|useDynamicContext|action:\s*["'](?:prepare|preflight|confirm)/);
  }
});
test("M7 wallet signing handlers remain byte-for-byte identical to the accepted M6 implementation", () => {
  const file = "apps/web/app/passport-app.tsx";
  const baseline = execFileSync("git", ["show", `91ca524:${file}`], { encoding: "utf8" });
  const handlers = (text: string) => text.slice(text.indexOf("function Workspace()"), text.indexOf("return <main"));
  assert.ok(handlers(baseline).includes("sendTransaction"));
  assert.equal(handlers(read(file)).replaceAll("\r\n", "\n"), handlers(baseline).replaceAll("\r\n", "\n"));
});
test("M7 controls clear stale policy results and preserve explicit evaluation", () => {
  const source = read("apps/web/app/compare/compare-app.tsx");
  assert.match(source, /function update\(next: ConsumerPolicy\) \{ setPolicy\(next\); setResults\(undefined\)/);
  assert.match(source, /fieldset disabled=\{busy\}/);
  assert.match(source, /disabled=\{busy \|\| candidates.length !== 2\}/);
  assert.match(source, /onClick=\{\(\) => void run\(\)\}/);
});
test("M7 supports keyboard focus, reduced motion, labeled controls and live feedback", () => {
  assert.match(read("apps/web/app/layout.tsx"), /className="skip-link" href="#main"/);
  assert.match(read("apps/web/components/site.tsx"), /main id="main"/);
  assert.match(read("apps/web/app/redesign.css"), /prefers-reduced-motion:reduce/);
  assert.match(read("apps/web/app/redesign.css"), /focus-visible/);
  assert.match(read("apps/web/app/compare/compare-app.tsx"), /legend className="sr-only"/);
  assert.match(read("apps/web/components/copy-value.tsx"), /aria-label=\{`Copy/);
  assert.match(read("apps/web/components/copy-value.tsx"), /role="status"/);
});
