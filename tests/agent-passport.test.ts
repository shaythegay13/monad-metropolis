import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { generateAgentPassport, PassportGenerationError } from "../packages/passport/src/generate.js";
import { validateAgentBundle } from "../packages/consumer/src/validate-agent-bundle.js";
import { validateImportedBundle } from "../packages/consumer/src/validate-bundle.js";
import { computePayloadDigest, canonicalJsonStringify } from "../packages/verification/src/index.js";
import { SCOPE_LIMITATIONS, METRIC_LABELS, type AgentPassportBundleV2 } from "../packages/schema/src/agent-passport.js";

const fixturePath = "fixtures/real/monad-m2/agent-2.json";
const sourceBytes = readFileSync(fixturePath);
const fixture = () => JSON.parse(sourceBytes.toString("utf8"));
const metadata = { generatedAt: "2026-10-07T12:00:00.000Z", passportVersion: 1 };
const generate = (f = fixture(), m = metadata) => generateAgentPassport(f.identity, f, m);
const values = (b: AgentPassportBundleV2) => Object.fromEntries(b.payload.metrics.map(m => [m.metricId, m.value]));
const rehash = (b: AgentPassportBundleV2) => { b.integrity.digest = computePayloadDigest(b.payload); return b; };

// Derived expected values were hand-checked against the two immutable real records.
const expected = {
  observed_transaction_count: 2, active_utc_days: 1, unique_recipient_addresses: 1,
  first_observed_activity_at: "2026-02-05T13:17:09.000Z", last_observed_activity_at: "2026-02-05T13:19:29.000Z",
  successful_execution_count: 2, failed_execution_count: 0, unknown_execution_status_count: 0
};
for (const [metric, value] of Object.entries(expected)) test(`M3 real fixture: ${metric}`, () => {
  assert.equal(values(generate())[metric], value);
});
test("M3: all observations match literal metric labels, values and dataset citations", () => {
  const b = generate(); assert.equal(b.payload.observations.length, 8);
  for (const o of b.payload.observations) {
    const m = b.payload.metrics.find(m => m.metricId === o.metricIds[0])!;
    assert.equal(o.value, m.value); assert.equal(o.label, METRIC_LABELS[m.metricId]);
    assert.equal(o.evidenceCount, 2); assert.deepEqual(o.evidenceIds, m.evidenceIds);
    assert.equal(o.coverageStatus, "complete_for_query");
  }
});
test("M3: valid complete empty dataset has six zero counts and no temporal inventions", () => {
  const f = JSON.parse(readFileSync("fixtures/real/monad-m2/agent-2-empty.json", "utf8"));
  const b = generate(f); assert.equal(b.payload.metrics.length, 6);
  assert.ok(b.payload.metrics.every(m => m.value === 0 && m.evidenceIds.length === 0));
  assert.ok(b.payload.observations.every(o => o.evidenceCount === 0));
  assert.equal(validateAgentBundle(b).isValid, true);
});
test("M3 synthetic: partial coverage propagates to every observation", () => {
  const f = fixture(); Object.assign(f.provenance, { coverageStatus: "partial", stopReason: "limit", nextBlock: 10840000 });
  f.provenance.batches[0].nextBlock = 10840000;
  const b = generate(f); assert.deepEqual(values(b), expected);
  assert.ok(b.payload.observations.every(o => o.coverageStatus === "partial")); assert.ok(validateAgentBundle(b).isValid);
});
test("M3 synthetic: unknown completeness stays unknown with observed values", () => {
  const f = fixture(); Object.assign(f.provenance, { coverageStatus: "unknown", stopReason: "unknown", nextBlock: f.provenance.fromBlock });
  f.provenance.batches[0].nextBlock = null;
  const b = generate(f); assert.deepEqual(values(b), expected);
  assert.ok(b.payload.observations.every(o => o.coverageStatus === "unknown")); assert.ok(validateAgentBundle(b).isValid);
});
test("M3 synthetic: UTC midnight counts two dates, independent of machine timezone", () => {
  const f = fixture(); f.evidence[0].timestamp = "2026-02-05T23:59:59.000Z"; f.evidence[1].timestamp = "2026-02-06T00:00:01.000Z";
  assert.equal(values(generate(f)).active_utc_days, 2);
});
test("M3 synthetic: address case variants count once and canonicalize", () => {
  const f = fixture(); f.evidence[1].recipient = "0x" + f.evidence[0].recipient.slice(2).toUpperCase();
  const b = generate(f); assert.equal(values(b).unique_recipient_addresses, 1);
  assert.equal(b.payload.evidence[0].recipient, b.payload.evidence[1].recipient);
});
test("M3 synthetic: null recipients never become a fake address", () => {
  const f = fixture(); f.evidence.forEach((e: { recipient: null }) => { e.recipient = null; });
  assert.equal(values(generate(f)).unique_recipient_addresses, 0);
  f.evidence[1].recipient = fixture().evidence[1].recipient;
  assert.equal(values(generate(f)).unique_recipient_addresses, 1);
});
test("M3 synthetic: literal success/failed/unknown status counts", () => {
  const f = fixture(); f.evidence[0].status = "failed"; f.evidence[1].status = "unknown";
  const v = values(generate(f)); assert.equal(v.successful_execution_count, 0);
  assert.equal(v.failed_execution_count, 1); assert.equal(v.unknown_execution_status_count, 1);
});
test("M3: evidence input order and object key order do not change generated bytes or digest", () => {
  const f = fixture(); f.evidence.reverse();
  f.identity = Object.fromEntries(Object.entries(f.identity).reverse());
  assert.equal(canonicalJsonStringify(generate()), canonicalJsonStringify(generate(f)));
});
test("M3 synthetic: identical duplicate deduplicates; conflicting duplicate rejects", () => {
  const f = fixture(); f.evidence.push(structuredClone(f.evidence[0]));
  f.provenance.rawRowsRetrieved = 3; f.provenance.batches[0].rawRows = 3;
  assert.deepEqual(values(generate(f)), expected);
  f.evidence[2].status = "failed"; assert.throws(() => generate(f), PassportGenerationError);
});
test("M3: generator does not mutate accepted input or fixture bytes", () => {
  const f = fixture(), before = JSON.stringify(f); generate(f);
  assert.equal(JSON.stringify(f), before); assert.deepEqual(readFileSync(fixturePath), sourceBytes);
});
test("M3: explicit generation metadata controls digest, no hidden wall clock", () => {
  const first = generate(), second = generate(); assert.deepEqual(first, second);
  assert.notEqual(first.integrity.digest, generate(fixture(), { ...metadata, generatedAt: "2026-10-07T12:00:01.000Z" }).integrity.digest);
});
test("M3: cross-process offline CLI generation is byte-identical", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "signal-passport-m3-"));
  const outputs = [path.join(directory, "one.json"), path.join(directory, "two.json")];
  try {
    for (const output of outputs) execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/generate-agent-passport.ts", fixturePath, output, metadata.generatedAt]);
    assert.deepEqual(readFileSync(outputs[0]), readFileSync(outputs[1]));
    assert.equal(readFileSync(outputs[0], "utf8"), canonicalJsonStringify(generate()) + "\n");
  } finally { for (const file of outputs) { try { unlinkSync(file); } catch {} } rmdirSync(directory); }
});
test("M3: independent consumer verifies v2 with fetch forbidden", () => {
  const b = generate(), saved = globalThis.fetch;
  globalThis.fetch = async () => { throw Error("Network forbidden"); };
  try {
    const result = validateImportedBundle(b); assert.ok(result.isValid);
    assert.equal(result.integrityLabel, "Passport integrity verified");
    assert.ok(result.integrityExplanation.includes("does NOT establish"));
  } finally { globalThis.fetch = saved; }
});
test("M3: v1 verification preserved and v1 envelope cannot masquerade as v2", () => {
  const b = JSON.parse(readFileSync("fixtures/real/passport-bundle.json", "utf8"));
  assert.ok(validateImportedBundle(b).isValid);
  b.schema_version = "2.0.0"; assert.equal(validateImportedBundle(b).isValid, false);
  b.schemaVersion = "2.0.0"; assert.equal(validateImportedBundle(b).isValid, false);
});
test("M3: unknown and ambiguous schema versions rejected", () => {
  const b = generate(); assert.equal(validateImportedBundle({ ...b, schemaVersion: "3.0.0" }).isValid, false);
  assert.equal(validateImportedBundle({ ...b, schema_version: "1.0.0" }).isValid, false);
});
const changes: [string, (b: AgentPassportBundleV2) => void][] = [
  ["metric", b => { b.payload.metrics[0].value = 500; }],
  ["observation", b => { b.payload.observations[0].value = 500; }],
  ["evidence", b => { b.payload.evidence[0].value = "1"; }],
  ["subject", b => { b.payload.subject.ownerAddress = "0x" + "a".repeat(40); }],
  ["scope", b => { b.payload.observationScope.fromBlock = "0"; }],
  ["coverage", b => { b.payload.coverage.rawRowsRetrieved++; }],
  ["limitation", b => { b.payload.limitations[0].description += " Changed"; }],
  ["provenance", b => { b.payload.provenance.transport = "native"; }],
  ["generation", b => { b.payload.generation.generatedAt = "2026-10-07T12:01:00.000Z"; }],
  ["observation order", b => { b.payload.observationOrder.reverse(); }]
];
for (const [name, change] of changes) test(`M3 tamper: ${name} mutation rejects without rehash`, () => {
  const b = generate(); change(b);
  assert.notEqual(computePayloadDigest(b.payload), b.integrity.digest);
  assert.equal(validateAgentBundle(b).isValid, false);
});
test("M3 tamper: nested fields stripped by inherited schema remain within digest scope", () => {
  const b = generate(); Object.assign(b.payload.subject.resolution, { extra: "tampered" });
  const r = validateAgentBundle(b); assert.equal(r.digestMatches, false); assert.equal(r.isValid, false);
});
for (const [name, change] of [
  ["metric evidence", (b: AgentPassportBundleV2) => { b.payload.metrics[0].evidenceIds[0] = "dangling"; }],
  ["observation evidence", (b: AgentPassportBundleV2) => { b.payload.observations[0].evidenceIds[0] = "dangling"; }],
  ["metric reference", (b: AgentPassportBundleV2) => { b.payload.observations[0].metricIds[0] = "observed_transaction_count"; }],
  ["observation reference", (b: AgentPassportBundleV2) => { b.payload.observationOrder[0] = "observation:missing"; }],
  ["duplicate evidence", (b: AgentPassportBundleV2) => { b.payload.evidence.push(b.payload.evidence[0]); }]
] as const) test(`M3 references: ${name} rejects even with recomputed digest`, () => {
  const b = generate(); change(b); assert.equal(validateAgentBundle(rehash(b)).isValid, false);
});
test("M3: machine-readable limitations and current-association wording mandatory", () => {
  const b = generate(); assert.deepEqual(b.payload.limitations, SCOPE_LIMITATIONS);
  assert.equal(b.payload.observationScope.walletAssociationBasis, "current_erc8004_registry_designation");
  assert.ok(b.payload.observationScope.description.includes("wallet currently designated"));
  b.payload.limitations.pop(); assert.equal(validateAgentBundle(rehash(b)).isValid, false);
});
test("M3: no economic-history, concentration or judgmental metric/observation labels", () => {
  const b = generate();
  const labels = b.payload.observations.map(o => o.label).join(" ");
  assert.doesNotMatch(labels, /trust|safe|reliable|experienced|counterpart|customer|provider|payment|commerce|economic history/i);
  assert.ok(!b.payload.metrics.some(m => /economic_history|concentration|score/.test(m.metricId)));
});
test("M3: provider errors rejected including errors with retained partial evidence", () => {
  for (const evidence of [[], fixture().evidence]) {
    const f = fixture(); f.state = "error"; f.error = { code: "provider_error" }; f.evidence = evidence;
    assert.throws(() => generate(f), PassportGenerationError);
  }
  const f = fixture(); f.error = { code: "provider_error" }; assert.throws(() => generate(f), PassportGenerationError);
});
test("M3: invalid subject/scope/evidence/provenance fail before creating a Passport", () => {
  const mutations = [
    (f: ReturnType<typeof fixture>) => { f.identity.agentWalletStatus = "unset"; delete f.identity.agentWallet; },
    (f: ReturnType<typeof fixture>) => { f.provenance.subjectWallet = "0x" + "a".repeat(40); },
    (f: ReturnType<typeof fixture>) => { f.provenance.identityResolution.blockNumber = "0"; },
    (f: ReturnType<typeof fixture>) => { f.provenance.universe = "all agent commerce"; },
    (f: ReturnType<typeof fixture>) => { f.evidence[0].sender = "0x" + "a".repeat(40); },
    (f: ReturnType<typeof fixture>) => { f.evidence[0].blockNumber = String(f.provenance.toBlock); },
    (f: ReturnType<typeof fixture>) => { f.evidence[0].timestamp = "bad"; },
    (f: ReturnType<typeof fixture>) => { f.evidence[0].value = Number.MAX_SAFE_INTEGER + 1; },
    (f: ReturnType<typeof fixture>) => { f.provenance.stopReason = "limit"; },
    (f: ReturnType<typeof fixture>) => { f.provenance.batches[0].nextBlock--; },
    (f: ReturnType<typeof fixture>) => { f.provenance.normalizedEvidenceCount = 999; }
  ];
  for (const mutation of mutations) { const f = fixture(); mutation(f); assert.throws(() => generate(f), PassportGenerationError); }
});
test("M3: metadata requires explicit valid timestamp and valid version linkage", () => {
  for (const m of [{ ...metadata, generatedAt: "bad" }, { ...metadata, generatedAt: "2020-01-01T00:00:00.000Z" },
    { ...metadata, passportVersion: 0 }, { ...metadata, passportVersion: 2 }])
    assert.throws(() => generate(fixture(), m), PassportGenerationError);
  const b = generateAgentPassport(fixture().identity, fixture(), { ...metadata, passportVersion: 2, previousVersionHash: generate().integrity.digest });
  assert.ok(validateAgentBundle(b).isValid);
});
test("M3: digest is not authenticity or independent metric recalculation", () => {
  const b = generate(); const id = "successful_execution_count";
  b.payload.metrics.find(m => m.metricId === id)!.value = 123;
  b.payload.observations.find(o => o.metricIds[0] === id)!.value = 123;
  assert.equal(validateAgentBundle(rehash(b)).isValid, true);
  // A coherent attacker-authored rewrite plus new digest is not authentication.
});
test("M3: consumer transitive source graph excludes generation, providers and network", () => {
  const seen = new Set<string>();
  function inspect(file: string) {
    if (seen.has(file)) return; seen.add(file);
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)) {
      const specifier = m[2];
      assert.ok(!/hypersync|node:(http|https|net|tls|dns)/.test(specifier));
      if (specifier.startsWith(".")) {
        const target = path.resolve(path.dirname(file), specifier).replace(/\.js$/, ".ts");
        assert.ok(!/packages[\\/](passport|activity|identity)[\\/]/.test(target), target);
        inspect(target);
      }
    }
  }
  inspect(path.resolve("packages/consumer/src/validate-bundle.ts"));
});
test("M3 synthetic: partial and unknown empty evidence retain explicit coverage", () => {
  for (const coverageStatus of ["partial", "unknown"]) {
    const f = JSON.parse(readFileSync("fixtures/real/monad-m2/agent-2-empty.json", "utf8"));
    const next = coverageStatus === "partial" ? f.provenance.fromBlock + 1 : f.provenance.fromBlock;
    Object.assign(f.provenance, { coverageStatus, stopReason: coverageStatus === "partial" ? "limit" : "unknown", nextBlock: next });
    f.provenance.batches[0].nextBlock = coverageStatus === "partial" ? next : null;
    const b = generate(f); assert.ok(validateAgentBundle(b).isValid);
    assert.equal(b.payload.metrics.length, 6);
    assert.ok(b.payload.observations.every(o => o.value === 0 && o.coverageStatus === coverageStatus));
  }
});
test("M3: truly dangling metric ID rejects even after rehash", () => {
  const b = generate(); (b.payload.observations[0].metricIds as string[])[0] = "missing_metric";
  assert.equal(validateAgentBundle(rehash(b)).isValid, false);
});
test("M3: conflicting headers and mismatched evidence provenance rejected", () => {
  const f = fixture(); f.evidence[1].blockNumber = f.evidence[0].blockNumber;
  assert.throws(() => generate(f), PassportGenerationError);
  const g = fixture(); g.evidence[0].sourceReference = "https://example.com/query";
  assert.throws(() => generate(g), PassportGenerationError);
});
test("M3: retained real v2 fixture reproduces exactly from unchanged M2 evidence", () => {
  const meta = JSON.parse(readFileSync("fixtures/real/monad-m3/metadata.json", "utf8"));
  const b = generate(fixture(), meta.generation);
  const stored = readFileSync("fixtures/real/monad-m3/agent-2-passport-v2.json", "utf8");
  assert.equal(canonicalJsonStringify(b) + "\n", stored);
  assert.equal(b.integrity.digest, meta.payloadDigest);
  assert.ok(validateImportedBundle(JSON.parse(stored)).isValid);
});
test("M3: exact uint256 maximum retained and overflow rejected", () => {
  const f = fixture(); f.evidence[0].value = ((1n << 256n) - 1n).toString();
  assert.equal(generate(f).payload.evidence[0].value, f.evidence[0].value);
  f.evidence[0].value = (1n << 256n).toString(); assert.throws(() => generate(f), PassportGenerationError);
});
