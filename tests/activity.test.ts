import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { AgentIdentity } from "../packages/schema/src/identity.js";
import { activityEvidenceSchema } from "../packages/schema/src/activity.js";
import { retrieveAgentActivity, subjectWallet, ActivityError } from "../packages/activity/src/index.js";
import { createEnvioProvider, decodeJsonPage, decodeNativePage, nativeQuery, jsonQuery,
  type HyperSyncProvider } from "../packages/activity/src/envio.js";
import { normalizePage, unsigned, type ProviderPage } from "../packages/activity/src/normalize.js";

// All generated addresses, hashes, rows and identities in this file are SYNTHETIC.
const wallet = "0x" + "a".repeat(40), owner = "0x" + "b".repeat(40);
const hash = "0x" + "c".repeat(64), blockHash = "0x" + "d".repeat(64);
const identity: AgentIdentity = {
  ...JSON.parse(readFileSync("docs/verification/MONAD-M0.5-agent-1.json", "utf8")),
  agentId: "77", ownerAddress: owner, agentWallet: wallet
};
const row = () => ({ hash, blockNumber: 10, blockHash, from: wallet, to: owner, value: "0x20000000000001", status: 1 });
const page = (nextBlock: number | undefined = 20): ProviderPage => ({
  blocks: [{ number: 10, hash: blockHash, timestamp: "0x65000000" }], transactions: [row()], nextBlock, archiveHeight: 30
});
function provider(pages: (ProviderPage | Error)[]): HyperSyncProvider {
  let i = 0;
  return { transport: "json", getHeight: async () => 30,
    get: async () => { const p = pages[i++]; if (p instanceof Error) throw p; return { page: p, raw: p }; } };
}
const retrieve = (pages: (ProviderPage | Error)[], opts = {}) =>
  retrieveAgentActivity(identity, provider(pages), { fromBlock: 10, toBlock: 20, ...opts });
const errorCode = (code: string) => (e: unknown) => e instanceof ActivityError && e.code === code;

test("activity: preserves canonical evidence IDs, fields, provenance and exact large values", async () => {
  const r = await retrieve([page()]);
  assert.equal(r.state, "retrieved"); assert.equal(r.provenance.coverageStatus, "complete_for_query");
  assert.equal(r.evidence[0].evidenceId, `10143:${hash}`);
  assert.equal(r.evidence[0].value, "9007199254740993");
  assert.equal(r.evidence[0].timestamp, new Date(0x65000000 * 1000).toISOString());
  assert.equal(r.provenance.subjectWallet, wallet); assert.notEqual(wallet, owner);
  assert.equal(r.provenance.fromBlock, 10); assert.equal(r.provenance.toBlock, 20);
  assert.equal(r.provenance.rawRowsRetrieved, 1); assert.equal(r.provenance.normalizedEvidenceCount, 1);
  assert.ok(activityEvidenceSchema.safeParse(r.evidence[0]).success);
});
test("activity: unset wallet never falls back to owner or advertisements", async () => {
  const unset = { ...identity, agentWallet: undefined, agentWalletStatus: "unset" as const };
  assert.throws(() => subjectWallet(unset), errorCode("agent_wallet_unset"));
});
test("activity: wrong network, registry and inconsistent identity rejected", () => {
  for (const patch of [{ chainId: 143 }, { agentRegistry: "wrong" }, { agentWalletStatus: "unset" }])
    assert.throws(() => subjectWallet({ ...identity, ...patch } as AgentIdentity), errorCode("invalid_subject"));
});
test("activity: safe explicit half-open bounds and bounded page count required", async () => {
  for (const opts of [{ fromBlock: -1 }, { fromBlock: 20 }, { toBlock: 10.5 }, { toBlock: Number.MAX_SAFE_INTEGER + 1 }, { maxPages: 0 }])
    await assert.rejects(retrieve([], opts), errorCode("invalid_config"));
});
test("activity: sender mismatch fails and cannot enter evidence", async () => {
  const p = page(); p.transactions = [{ ...row(), from: owner }];
  const r = await retrieve([p]); assert.equal(r.error?.code, "subject_mismatch"); assert.equal(r.evidence.length, 0);
  assert.equal(r.provenance.coverageStatus, "unknown");
});
test("activity: mixed-case hashes/addresses normalize; missing recipient is nullable", () => {
  const p = page(); p.transactions = [{ ...row(), hash: "0x" + "C".repeat(64), from: "0x" + "A".repeat(40), to: undefined }];
  const r = normalizePage(p, wallet, 10, 20)[0];
  assert.equal(r.transactionHash, hash); assert.equal(r.sender, wallet); assert.equal(r.recipient, null);
});
test("activity: contract creation recipient null remains null; absent value is absent", () => {
  const p = page(); p.transactions = [{ ...row(), to: null, value: undefined }];
  const r = normalizePage(p, wallet, 10, 20)[0]; assert.equal(r.recipient, null); assert.equal(r.value, undefined);
});
test("activity: success, failure and unavailable status preserved", () => {
  for (const [status, expected] of [[1, "success"], [0, "failed"], [null, "unknown"], [undefined, "unknown"]]) {
    const p = page(); p.transactions = [{ ...row(), status }];
    assert.equal(normalizePage(p, wallet, 10, 20)[0].status, expected);
  }
});
test("activity: exact uint256 maximum and zero; unsafe numbers/negative/overflows rejected", () => {
  for (const value of [0n, (1n << 256n) - 1n]) {
    const p = page(); p.transactions = [{ ...row(), value }];
    assert.equal(normalizePage(p, wallet, 10, 20)[0].value, value.toString());
  }
  for (const value of [Number.MAX_SAFE_INTEGER + 1, -1, 1.5, "oops", 1n << 256n]) {
    const p = page(); p.transactions = [{ ...row(), value }];
    assert.throws(() => normalizePage(p, wallet, 10, 20), errorCode("malformed_response"));
  }
  assert.throws(() => unsigned(NaN), errorCode("malformed_response"));
});
test("activity: malformed hash/address/status/block/timestamp fail explicitly", () => {
  for (const patch of [{ hash: "bad" }, { from: "bad" }, { to: "" }, { status: 2 }, { blockNumber: 11 }, { blockHash: hash }]) {
    const p = page(); p.transactions = [{ ...row(), ...patch }];
    assert.throws(() => normalizePage(p, wallet, 10, 20), errorCode("malformed_response"));
  }
  const p = page(); p.blocks = [{ number: 10, hash: blockHash, timestamp: "99999999999999999999" }];
  assert.throws(() => normalizePage(p, wallet, 10, 20), errorCode("malformed_response"));
});
test("activity: start included; exclusive end and earlier blocks rejected", () => {
  assert.equal(normalizePage(page(), wallet, 10, 11).length, 1);
  assert.throws(() => normalizePage(page(), wallet, 0, 10), errorCode("malformed_response"));
  assert.throws(() => normalizePage(page(), wallet, 11, 20), errorCode("malformed_response"));
});
test("activity: pagination follows nextBlock and deduplicates across/in batches", async () => {
  const first = page(15); first.transactions.push(row()); const second = page(20);
  const seen: number[] = []; const p = provider([first, second]); const get = p.get;
  p.get = async q => { seen.push(q.fromBlock); return get(q); };
  const r = await retrieveAgentActivity(identity, p, { fromBlock: 10, toBlock: 20 });
  assert.deepEqual(seen, [10, 15]); assert.equal(r.evidence.length, 1); assert.equal(r.provenance.rawRowsRetrieved, 3);
  assert.equal(r.provenance.coverageStatus, "complete_for_query");
});
test("activity: conflicting duplicate rejected atomically", async () => {
  const p = page(); p.transactions.push({ ...row(), value: "9" });
  const r = await retrieve([p]); assert.equal(r.error?.code, "conflicting_evidence"); assert.equal(r.evidence.length, 0);
});
test("activity: valid zero activity requires full continuation exhaustion", async () => {
  const r = await retrieve([{ blocks: [], transactions: [], nextBlock: 20 }]);
  assert.equal(r.state, "retrieved"); assert.equal(r.evidence.length, 0);
  assert.equal(r.provenance.coverageStatus, "complete_for_query");
});
test("activity: empty intermediate pages do not imply exhaustion", async () => {
  const r = await retrieve([{ blocks: [], transactions: [], nextBlock: 12 }, { blocks: [], transactions: [], nextBlock: 20 }]);
  assert.equal(r.provenance.batches.length, 2); assert.equal(r.provenance.coverageStatus, "complete_for_query");
});
test("activity: maxPages stops with partial coverage", async () => {
  const r = await retrieve([page(15)], { maxPages: 1 });
  assert.equal(r.provenance.coverageStatus, "partial"); assert.equal(r.provenance.nextBlock, 15);
});
test("activity: missing continuation makes completeness unknown", async () => {
  const p = page(); delete p.nextBlock;
  const r = await retrieve([p]); assert.equal(r.provenance.coverageStatus, "unknown"); assert.equal(r.evidence.length, 1);
});
test("activity: stalled, backward and overshooting continuations are errors", async () => {
  for (const next of [10, 9, 21, 11.5]) {
    const r = await retrieve([page(next)]); assert.equal(r.error?.code, "malformed_response");
    assert.notEqual(r.provenance.coverageStatus, "complete_for_query");
  }
});
test("activity: provider failure never becomes valid empty activity", async () => {
  const r = await retrieve([new Error("synthetic private provider details")]);
  assert.equal(r.state, "error"); assert.equal(r.error?.code, "provider_error");
  assert.equal(r.provenance.coverageStatus, "unknown"); assert.ok(!JSON.stringify(r).includes("private provider"));
});
test("activity: mid-retrieval failure preserves prior evidence with error and partial coverage", async () => {
  const r = await retrieve([page(15), new Error("network")]);
  assert.equal(r.state, "error"); assert.equal(r.evidence.length, 1); assert.equal(r.provenance.coverageStatus, "partial");
});
test("activity: repeated retrieval yields identical evidence IDs/data", async () => {
  assert.deepEqual((await retrieve([page()])).evidence, (await retrieve([page()])).evidence);
});
test("Envio: missing token is actionable before transport or network", async () => {
  for (const token of [undefined, "", "   "])
    await assert.rejects(createEnvioProvider(token, "json"), errorCode("missing_api_token"));
});
test("Envio: 401/403 map to authentication errors and response/token are not echoed", async () => {
  for (const status of [401, 403]) {
    const p = await createEnvioProvider("synthetic-unit-token", "json", async () => new Response("sensitive response", { status }));
    await assert.rejects(p.getHeight(), e => errorCode("provider_authentication")(e) && !String(e).includes("sensitive"));
  }
});
test("Envio: transport rejection, HTTP 429 and HTTP 503 are operational errors", async () => {
  for (const fn of [async () => { throw Error("secret"); }, async () => new Response("secret", { status: 429 }), async () => new Response("secret", { status: 503 })]) {
    const p = await createEnvioProvider("synthetic-unit-token", "json", fn);
    await assert.rejects(p.getHeight(), e => errorCode("provider_error")(e) && !String(e).includes("secret"));
  }
});
test("Envio: malformed JSON and malformed table response fail parsing", async () => {
  const p = await createEnvioProvider("synthetic-unit-token", "json", async () => new Response("not json"));
  await assert.rejects(p.getHeight(), errorCode("malformed_response"));
  for (const raw of [{}, { data: {} }, { data: [{}] }]) assert.throws(() => decodeJsonPage(raw), errorCode("malformed_response"));
});
test("Envio: JSON request has only sender selection and fixed exclusive bounds", async () => {
  let request: Record<string, unknown> = {};
  const p = await createEnvioProvider("synthetic-unit-token", "json", async (url, init) => {
    assert.equal(url, "https://monad-testnet.hypersync.xyz/query");
    assert.equal(init?.redirect, "error"); request = JSON.parse(String(init?.body));
    return Response.json({ data: [], next_block: 20 });
  });
  await p.get({ fromBlock: 10, toBlock: 20, subjectWallet: wallet });
  assert.deepEqual(request.transactions, [{ from: [wallet] }]); assert.equal(request.to_block, 20);
  const q = { fromBlock: 10, toBlock: 20, subjectWallet: wallet };
  assert.deepEqual(nativeQuery(q).transactions, jsonQuery(q).transactions);
});
test("Envio: native and JSON table formats normalize to identical product evidence", () => {
  const p = page(); const tx = row();
  const json = decodeJsonPage({ data: [{ blocks: p.blocks, transactions: [{ ...tx, block_number: 10, block_hash: blockHash }] }], next_block: 20 });
  const native = decodeNativePage({ data: { blocks: p.blocks, transactions: p.transactions, logs: [], traces: [] }, nextBlock: 20, totalExecutionTime: 1 } as never);
  assert.deepEqual(normalizePage(json, wallet, 10, 20), normalizePage(native, wallet, 10, 20));
});

test("activity: malformed metadata and impossible archive height are rejected", async () => {
  for (const patch of [{ archiveHeight: 1 }, { archiveHeight: -1 }, { rollbackGuard: { hash } }]) {
    const r = await retrieve([{ ...page(), ...patch }]);
    assert.equal(r.error?.code, "malformed_response"); assert.equal(r.evidence.length, 0);
  }
});
test("activity: adjacent rollback guard mismatch preserves partial error state", async () => {
  const first = page(15); first.rollbackGuard = { blockNumber: 14, timestamp: 1, hash,
    firstBlockNumber: 10, firstParentHash: blockHash };
  const second = page(); second.rollbackGuard = { block_number: 19, timestamp: 2, hash,
    first_block_number: 15, first_parent_hash: blockHash };
  const r = await retrieve([first, second]);
  assert.equal(r.error?.code, "conflicting_evidence"); assert.equal(r.provenance.coverageStatus, "partial");
});
test("activity: cross-batch block hash disagreement is rejected", async () => {
  const second = page(); second.transactions = [{ ...row(), hash: blockHash, blockHash: hash }];
  second.blocks = [{ number: 10, hash, timestamp: "0x65000000" }];
  const r = await retrieve([page(15), second]);
  assert.equal(r.error?.code, "malformed_response"); // A new transaction cannot appear behind the continuation.
  assert.equal(r.provenance.coverageStatus, "partial");
});
test("activity: matching rollback guards and provider batch metadata are retained", async () => {
  const first = page(15); first.rollbackGuard = { blockNumber: 14, timestamp: 1, hash,
    firstBlockNumber: 10, firstParentHash: blockHash };
  const second = page(); second.rollbackGuard = { blockNumber: 19, timestamp: 2, hash: blockHash,
    firstBlockNumber: 15, firstParentHash: hash };
  const r = await retrieve([first, second]);
  assert.equal(r.state, "retrieved"); assert.deepEqual(r.provenance.batches[1].rollbackGuard, second.rollbackGuard);
});
test("activity: real captured Envio fixtures replay without network or fixture alteration", async () => {
  for (const file of ["agent-1.json", "agent-2.json", "agent-2-empty.json"]) {
    const fixture = JSON.parse(readFileSync(`fixtures/real/monad-m2/${file}`, "utf8"));
    let index = 0;
    const source: HyperSyncProvider = { transport: "json", getHeight: async () => { throw Error("No network"); },
      get: async query => {
        const capture = fixture.captures[index++]; assert.deepEqual(query, capture.query);
        return { raw: capture.raw, page: decodeJsonPage(capture.raw) };
      } };
    const r = await retrieveAgentActivity(fixture.identity, source, fixture.provenance);
    assert.deepEqual(r.evidence, fixture.evidence);
    assert.equal(r.provenance.coverageStatus, fixture.provenance.coverageStatus);
    assert.equal(r.provenance.rawRowsRetrieved, fixture.provenance.rawRowsRetrieved);
  }
});
