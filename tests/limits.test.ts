import test from "node:test";
import assert from "node:assert/strict";
import { guardAgent, guardGeneration, guardPrepare, LIMITS, memoryBackend, upstashStore } from "../packages/web/src/limits.js";
import { CHALLENGE_TTL_MS } from "../packages/web/src/self-service.js";
import { WebFlowError } from "../packages/web/src/publication.js";

const rejects = (p: Promise<unknown>, code: string) => assert.rejects(p, (e: unknown) => e instanceof WebFlowError && e.code === code);
const wallet = (n: number) => `0x${n.toString(16).padStart(40, "0")}`;
const nonce = (n: number) => n.toString(16).padStart(32, "0");

test("limits: a challenge is single-use across independent instances", async () => {
  const backend = memoryBackend(); const a = backend.client(), b = backend.client();
  await guardGeneration(a, { nonce: nonce(1), address: wallet(1) });
  await rejects(guardGeneration(b, { nonce: nonce(1), address: wallet(1) }), "challenge_replayed");
  await rejects(guardGeneration(a, { nonce: nonce(1), address: wallet(2) }), "challenge_replayed");
});

test("limits: concurrent identical requests across instances admit exactly one", async () => {
  const backend = memoryBackend(); const clients = Array.from({ length: 4 }, () => backend.client());
  const outcomes = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => guardGeneration(clients[i % 4], { nonce: nonce(7), address: wallet(7) })));
  assert.equal(outcomes.filter(o => o.status === "fulfilled").length, 1);
  assert.ok(outcomes.filter(o => o.status === "rejected").every(o => (o as PromiseRejectedResult).reason.code === "challenge_replayed"));
});

test("limits: wallet and agent cooldowns are global and expire", async () => {
  let now = 1_000_000; const backend = memoryBackend(() => now); const a = backend.client(), b = backend.client();
  await guardGeneration(a, { nonce: nonce(10), address: wallet(10) }, now);
  await rejects(guardGeneration(b, { nonce: nonce(11), address: wallet(10) }, now), "cooldown");
  await guardAgent(a, "77"); await rejects(guardAgent(b, "77"), "cooldown");
  now += (LIMITS.walletCooldown + 1) * 1000;
  await guardGeneration(b, { nonce: nonce(12), address: wallet(10) }, now);
  await guardAgent(b, "77");
});

test("limits: global generation and per-wallet preparation budgets", async () => {
  const backend = memoryBackend(); const now = 5_000_000;
  for (let i = 0; i < LIMITS.generationsPerMinute; i++) await guardGeneration(backend.client(), { nonce: nonce(100 + i), address: wallet(100 + i) }, now);
  await rejects(guardGeneration(backend.client(), { nonce: nonce(999), address: wallet(999) }, now), "busy");
  for (let i = 0; i < LIMITS.preparesPerWalletPerMinute; i++) await guardPrepare(backend.client(), wallet(5), now);
  await rejects(guardPrepare(backend.client(), wallet(5), now), "busy");
  await guardPrepare(backend.client(), wallet(6), now);
});

test("limits: replay memory outlives every valid challenge", () => {
  assert.ok(LIMITS.nonceTtl * 1000 >= CHALLENGE_TTL_MS + 60_000, "nonce TTL must cover the 5-minute validity plus clock skew");
});

test("limits: Upstash client uses single atomic commands and keeps the token out of errors", async () => {
  const calls: { url: string; auth: string | null; body: unknown[] }[] = [];
  const reply = (result: unknown) => new Response(JSON.stringify({ result }), { status: 200 });
  let next: () => Response = () => reply("OK");
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({ url, auth: new Headers(init.headers).get("authorization"), body: JSON.parse(String(init.body)) }); return next();
  }) as unknown as typeof fetch;
  const store = upstashStore("https://example-12345.upstash.io", "secret-token-value", { fetchFn });
  assert.equal(await store.claim("sp:nonce:x", 360), true);
  assert.deepEqual(calls[0].body, ["SET", "sp:nonce:x", "1", "NX", "EX", 360]);
  assert.equal(calls[0].auth, "Bearer secret-token-value");
  next = () => reply(null); assert.equal(await store.claim("sp:nonce:x", 360), false);
  next = () => reply(3); assert.equal(await store.count("sp:gen:1", 120), 3);
  assert.equal((calls[2].body as unknown[])[0], "EVAL"); assert.match(String((calls[2].body as unknown[])[1]), /INCR[\s\S]*EXPIRE/);
  for (const failure of [() => { throw Error("network down secret-token-value"); }, () => new Response("oops", { status: 500 }),
    () => new Response(JSON.stringify({ error: "WRONGPASS secret-token-value" }), { status: 200 }), () => new Response("not json", { status: 200 })]) {
    next = failure as () => Response;
    await assert.rejects(store.claim("k", 1), (e: unknown) => e instanceof WebFlowError && e.code === "protection_unavailable" && !String((e as Error).message).includes("secret-token"));
  }
  next = () => reply("garbage"); await rejects(store.count("k", 1), "protection_unavailable");
});

test("limits: misconfigured or missing Redis fails closed", () => {
  const bad = (url: string | undefined, token: string | undefined, allowLocal = false) =>
    assert.throws(() => upstashStore(url, token, { allowLocal }), (e: unknown) => e instanceof WebFlowError && e.code === "protection_unavailable");
  bad(undefined, undefined); bad("https://example.upstash.io", undefined); bad("not a url", "t");
  bad("http://example.upstash.io", "t"); bad("https://evil.example.com", "t"); bad("https://user:pw@x.upstash.io", "t");
  bad("http://127.0.0.1:3999", "t"); // local test server only when explicitly allowed
  assert.ok(upstashStore("http://127.0.0.1:3999", "t", { allowLocal: true }));
});
