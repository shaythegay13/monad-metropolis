import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { keccak256, ZeroAddress, ZeroHash } from "ethers";
import { consumerPolicySchema, verifyCandidate, evaluatePolicy, compareCandidates } from "../packages/policy/src/index.js";
import { createEvaluationGate, readEvaluationRequest, RequestError } from "../packages/policy/src/http.js";
import { registryAbi, identityAbi, IDENTITY_REGISTRY } from "../packages/publication/src/abi.js";
import { computePayloadDigest } from "../packages/verification/src/digest.js";
import type { Rpc } from "../packages/identity/src/resolver.js";
import type { RegistryTrust } from "../packages/publication/src/verify.js";
const real = JSON.parse(readFileSync("fixtures/real/monad-m5/agent-2072-passport-v2.json", "utf8"));
const other = JSON.parse(readFileSync("fixtures/real/monad-m3/agent-2-passport-v2.json", "utf8"));
const policy = { policyVersion: "1.0.0", minimumObservedTransactions: 2, requireMonadPublication: true };
const code = "0x60006000", blockHash = `0x${"12".repeat(32)}`;
const trust: RegistryTrust = { address: "0x7d9cc86196241485cf1efaf8a96c7819ea95b194", runtimeCodeHash: keccak256(code), identityRegistry: IDENTITY_REGISTRY, chainId: 10143 };
// Synthetic chain transport; real publication evidence is separately checked live.
function rpc(bundle = real, mode: "present" | "absent" | "outage" | "mismatch" = "present"): Rpc {
  return async (method, params) => {
    assert.ok(["eth_chainId", "eth_getBlockByNumber", "eth_getCode", "eth_call"].includes(method));
    if (mode === "outage") throw Error("synthetic private provider detail");
    if (method === "eth_chainId") return "0x279f";
    if (method === "eth_getBlockByNumber") return { number: "0x100", hash: blockHash };
    if (method === "eth_getCode") return code;
    const tx = params[0] as { to: string; data: string };
    if (tx.to === IDENTITY_REGISTRY) return identityAbi.encodeFunctionResult("getAgentWallet", [bundle.payload.subject.agentWallet]);
    const call = registryAbi.parseTransaction({ data: tx.data })!;
    if (call.name === "identityRegistry") return registryAbi.encodeFunctionResult(call.name, [IDENTITY_REGISTRY]);
    if (call.name === "getPassportVersion") return registryAbi.encodeFunctionResult(call.name, [[mode === "absent" ? ZeroHash : mode === "mismatch" ? `0x${"ff".repeat(32)}` : `0x${bundle.integrity.digest}`, "", mode === "absent" ? ZeroAddress : bundle.payload.subject.agentWallet, 123, 100]]);
    throw Error("Unexpected RPC");
  };
}
async function evaluate(bundle = real, p: unknown = policy, mode: Parameters<typeof rpc>[1] = "present", id = "candidate") {
  return evaluatePolicy(await verifyCandidate(id, bundle, { trust, rpc: rpc(bundle, mode) }), p);
}
function syntheticCoverage(status: "partial" | "unknown") {
  const b = structuredClone(real); b.payload.coverage.coverageStatus = status;
  b.payload.coverage.stopReason = status === "partial" ? "limit" : "unknown";
  b.payload.coverage.nextBlock = String(BigInt(b.payload.observationScope.toBlockExclusive) - 1n);
  for (const o of b.payload.observations) o.coverageStatus = status;
  b.integrity.digest = computePayloadDigest(b.payload); return b;
}
for (const invalid of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "2", null])
  test(`M6 rejects invalid threshold ${String(invalid)}`, () => assert.equal(consumerPolicySchema.safeParse({ ...policy, minimumObservedTransactions: invalid }).success, false));
test("M6 schema rejects unsupported criteria/version and nonboolean requirements", () => {
  for (const p of [{ ...policy, trustScore: 80 }, { ...policy, policyVersion: "2" }, { ...policy, requireMonadPublication: "true" }]) assert.equal(consumerPolicySchema.safeParse(p).success, false);
});
for (const [minimum, expected] of [[0, "SATISFIED"], [4, "SATISFIED"], [5, "NOT_SATISFIED"]] as const)
  test(`M6 complete real threshold boundary ${minimum}`, async () => assert.equal((await evaluate(real, { ...policy, minimumObservedTransactions: minimum })).outcome, expected));
test("M6 active days and recipient boundaries use actual production metrics", async () => {
  const result = await evaluate(real, { ...policy, minimumActiveUtcDays: 1, minimumUniqueRecipientAddresses: 2 });
  assert.equal(result.outcome, "SATISFIED"); assert.equal(result.checks.find(c => c.metricId === "unique_recipient_addresses")?.actual, 2);
  assert.equal((await evaluate(real, { ...policy, minimumActiveUtcDays: 2 })).outcome, "NOT_SATISFIED");
});
for (const status of ["partial", "unknown"] as const) test(`M6 ${status} numeric coverage remains indeterminate above and below threshold`, async () => {
  const b = syntheticCoverage(status);
  for (const minimum of [0, 2, 10]) {
    const result = await evaluate(b, { policyVersion: "1.0.0", minimumObservedTransactions: minimum });
    assert.equal(result.integrity, "valid"); assert.equal(result.outcome, "INDETERMINATE"); assert.equal(result.coverage?.coverageStatus, status);
  }
});
test("M6 explicit complete coverage distinguishes known partial from unknown", async () => {
  const p = { policyVersion: "1.0.0", requireCompleteCoverage: true };
  assert.equal((await evaluate(syntheticCoverage("partial"), p)).outcome, "NOT_SATISFIED");
  assert.equal((await evaluate(syntheticCoverage("unknown"), p)).outcome, "INDETERMINATE");
});
test("M6 confirmed absence fails while RPC failure is insufficient evidence", async () => {
  assert.equal((await evaluate(other, policy, "absent")).outcome, "NOT_SATISFIED");
  const uncertain = await evaluate(other, policy, "outage"); assert.equal(uncertain.outcome, "INDETERMINATE");
  assert.equal(uncertain.publication.status, "provider_error"); assert.doesNotMatch(JSON.stringify(uncertain), /private provider/);
});
test("M6 digest mismatch is a failure; known failure takes precedence over RPC uncertainty", async () => {
  assert.equal((await evaluate(real, policy, "mismatch")).outcome, "NOT_SATISFIED");
  const r = await evaluate(real, { ...policy, minimumObservedTransactions: 10 }, "outage");
  assert.equal(r.outcome, "NOT_SATISFIED"); assert.ok(r.checks.some(c => c.outcome === "INSUFFICIENT_EVIDENCE"));
});
for (const kind of ["tampered", "missing", "wrong_type", "claimed_verified"])
  test(`M6 ${kind} observations never qualify`, async () => {
    const b = structuredClone(real);
    if (kind === "missing") b.payload.metrics.pop();
    else if (kind === "claimed_verified") b.verified = true;
    else b.payload.metrics[0].value = kind === "wrong_type" ? "bad" : 999;
    if (kind !== "tampered") b.integrity.digest = computePayloadDigest(b.payload);
    const result = await evaluate(b, { ...policy, requireLocalIntegrity: false });
    assert.equal(result.outcome, "NOT_SATISFIED"); assert.equal(result.integrity, "invalid"); assert.equal(result.scope, null);
  });
test("M6 forged contexts, mutable contexts and serialized results cannot bypass verification", async () => {
  assert.throws(() => evaluatePolicy({ candidateId: "fake", verified: true } as never, policy));
  const c = await verifyCandidate("a", real); assert.ok(Object.isFrozen(c));
  const a = evaluatePolicy(c, { policyVersion: "1.0.0" });
  assert.throws(() => compareCandidates([JSON.parse(JSON.stringify(a)), a]));
});
test("M6 real distinct agents compare deterministically without ranking", async () => {
  const a = await evaluate(real, policy, "present", "agent-2072"), b = await evaluate(other, policy, "absent", "agent-2");
  const result = compareCandidates([a, b]); assert.deepEqual(result, compareCandidates([b, a]));
  assert.deepEqual(result.eligibleCandidateIds, ["agent-2072"]);
  assert.equal(b.passportVersion, 1); assert.equal(a.passportVersion, 2);
  assert.deepEqual(a.scope, real.payload.observationScope); assert.deepEqual(a.limitations, real.payload.limitations);
  assert.ok(!("score" in result) && !("ranking" in result));
  assert.deepEqual(await evaluate(real), await evaluate(real));
});
test("M6 two eligible real agents stay tied under a local-only example", async () => {
  const p = { policyVersion: "1.0.0", minimumObservedTransactions: 2 };
  const a = await evaluate(real, p, "present", "a"), b = await evaluate(other, p, "absent", "b");
  assert.deepEqual(compareCandidates([a, b]).eligibleCandidateIds, ["a", "b"]);
});
test("M6 duplicates, same agent versions and different policies reject", async () => {
  const a = await evaluate(real, policy, "present", "a");
  assert.throws(() => compareCandidates([a, a]), /Duplicate/);
  assert.throws(() => compareCandidates([a, { ...a, candidateId: "b" }]), /independently/);
  const same = await evaluate(real, policy, "present", "different-label"); assert.throws(() => compareCandidates([a, same]), /distinct agents/);
  const b = await evaluate(other, { ...policy, minimumObservedTransactions: 3 }, "absent", "b"); assert.throws(() => compareCandidates([a, b]), /same policy/);
});
function request(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3050/api/policy", { method: "POST", headers: { host: "localhost:3050", origin: "http://localhost:3050", "content-type": "application/json", ...headers }, body });
}
test("M6 API validates body, origin, policy and candidate limits", async () => {
  const good = { policy, candidates: [{ candidateId: "a", passport: real }] };
  assert.deepEqual(await readEvaluationRequest(request(JSON.stringify(good))), good);
  for (const [body, headers, status] of [
    [JSON.stringify(good), { origin: "https://foreign.example" }, 403],
    [JSON.stringify(good), { "content-type": "text/plain" }, 415],
    ["{", {}, 400], [JSON.stringify({ ...good, assertedVerification: true }), {}, 422],
    [JSON.stringify({ ...good, candidates: Array(11).fill(good.candidates[0]) }), {}, 422],
    [JSON.stringify({ ...good, candidates: [good.candidates[0], good.candidates[0]] }), {}, 422],
    ["x".repeat(2_000_001), {}, 413], ["{}", { "content-length": "2000001" }, 413]
  ] as const) await assert.rejects(readEvaluationRequest(request(body, headers)), (e: unknown) => e instanceof RequestError && e.status === status);
});
test("M6 API concurrency and rate limits are bounded and recover", () => {
  let time = 0; const enter = createEvaluationGate(() => time); const a = enter(), b = enter();
  assert.throws(enter, /limit/); a(); a(); b();
  for (let i = 0; i < 18; i++) enter()(); assert.throws(enter, /limit/);
  time = 60_000; enter()();
});
test("M6 consumer runtime has no evidence generation/provider or signing imports", () => {
  for (const file of ["packages/policy/src/evaluate.ts", "packages/policy/src/compare.ts", "apps/web/lib/policy-server.ts"])
    assert.doesNotMatch(readFileSync(file, "utf8"), /from.*(?:activity\/|passport\/src\/generate|writer|compile)/);
  const ui = readFileSync("apps/web/app/compare/compare-app.tsx", "utf8");
  assert.doesNotMatch(ui, /sendTransaction|signMessage|ENVIO_API_TOKEN|ALCHEMY_MONAD_TESTNET_RPC_URL|DEPLOYER_PRIVATE_KEY/);
  assert.match(ui, /setResults\(undefined\)/); assert.match(ui, /disabled=\{busy\}/);
});
test("M6 acceptance policy fixtures reproduce expected real outcomes", async () => {
  const fixtures = JSON.parse(readFileSync("fixtures/policy/examples.json", "utf8"));
  for (const [name, p] of Object.entries(fixtures.policies)) {
    const a = await evaluate(real, p, "present", "a"), b = await evaluate(other, p, "absent", "b");
    assert.deepEqual(compareCandidates([a, b]).eligibleCandidateIds, name === "modest" ? ["a"] : name === "local" ? ["a", "b"] : []);
  }
});
test("M6 valid complete zero is different from unavailable data", async () => {
  // Synthetic zero dataset with required count metrics retained and temporal observations omitted.
  const b = structuredClone(real); b.payload.evidence = [];
  b.payload.coverage.normalizedEvidenceCount = 0; b.payload.coverage.rawRowsRetrieved = 0;
  b.payload.metrics = b.payload.metrics.filter((m: {metricId:string}) => !m.metricId.endsWith("_activity_at"));
  b.payload.observations = b.payload.observations.filter((o: {observationId:string}) => !o.observationId.endsWith("_activity_at"));
  for (const m of b.payload.metrics) { m.value = 0; m.evidenceIds = []; }
  for (const o of b.payload.observations) { o.value = 0; o.evidenceIds = []; o.evidenceCount = 0; }
  b.payload.observationOrder = b.payload.observations.map((o: {observationId:string}) => o.observationId);
  b.integrity.digest = computePayloadDigest(b.payload);
  assert.equal((await evaluate(b, {policyVersion:"1.0.0",minimumObservedTransactions:0})).outcome, "SATISFIED");
  assert.equal((await evaluate(b, {policyVersion:"1.0.0",minimumObservedTransactions:1})).outcome, "NOT_SATISFIED");
});
test("M6 offline publication is not falsely reported absent and input mutation cannot alter context", async () => {
  const b = structuredClone(real); const context = await verifyCandidate("a", b); b.payload.metrics[0].value = 999;
  const result = evaluatePolicy(context, policy); assert.equal(result.publication.status, "not_checked");
  assert.equal(result.outcome, "INDETERMINATE"); assert.equal(result.digest, real.integrity.digest);
});
