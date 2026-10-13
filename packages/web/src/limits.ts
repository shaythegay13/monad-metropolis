// Shared, cross-instance protections for the self-service endpoints.
// Every check is a single atomic Redis operation; any store failure fails closed.
import { WebFlowError } from "./publication.js";

export interface SharedStore {
  /** Atomic SET key NX EX ttl. True only for the first caller. */
  claim(key: string, ttlSeconds: number): Promise<boolean>;
  /** Atomic INCR with expiry on first increment; returns the new count. */
  count(key: string, windowSeconds: number): Promise<number>;
}

const INCR_WITH_EXPIRY = "local c = redis.call('INCR', KEYS[1]) if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end return c";

/** Upstash Redis REST client. Credentials stay in this closure; errors never include them. */
export function upstashStore(url: string | undefined, token: string | undefined, options: { fetchFn?: typeof fetch; allowLocal?: boolean } = {}): SharedStore {
  let base: URL;
  try { base = new URL(url ?? ""); } catch { throw new WebFlowError("protection_unavailable"); }
  const local = options.allowLocal && base.protocol === "http:" && base.hostname === "127.0.0.1";
  if (!token || (!local && (base.protocol !== "https:" || !base.hostname.endsWith(".upstash.io") || base.username || base.password)))
    throw new WebFlowError("protection_unavailable");
  const fetchFn = options.fetchFn ?? fetch;
  async function command(args: (string | number)[]): Promise<unknown> {
    let body: { result?: unknown; error?: unknown } | null = null;
    try {
      const response = await fetchFn(base.href, { method: "POST", redirect: "error", signal: AbortSignal.timeout(3000),
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
      if (response.ok) body = await response.json();
    } catch { /* network, timeout or malformed body */ }
    if (!body || "error" in body && body.error !== undefined && body.error !== null) throw new WebFlowError("protection_unavailable");
    return body.result;
  }
  return {
    async claim(key, ttlSeconds) { return (await command(["SET", key, "1", "NX", "EX", ttlSeconds])) === "OK"; },
    async count(key, windowSeconds) {
      const value = Number(await command(["EVAL", INCR_WITH_EXPIRY, 1, key, windowSeconds]));
      if (!Number.isSafeInteger(value) || value < 1) throw new WebFlowError("protection_unavailable");
      return value;
    }
  };
}

/** One shared backend for tests: many store clients, one keyspace, like several instances on one Redis. */
export function memoryBackend(now = () => Date.now()) {
  const data = new Map<string, { value: number; expires: number }>();
  const live = (k: string) => { const e = data.get(k); if (e && e.expires <= now()) { data.delete(k); return undefined; } return e; };
  return { client(): SharedStore {
    return {
      async claim(key, ttl) { await Promise.resolve(); if (live(key)) return false; data.set(key, { value: 1, expires: now() + ttl * 1000 }); return true; },
      async count(key, ttl) { await Promise.resolve(); const e = live(key); if (e) { e.value++; return e.value; } data.set(key, { value: 1, expires: now() + ttl * 1000 }); return 1; }
    };
  } };
}

export const LIMITS = { nonceTtl: 360, walletCooldown: 60, agentCooldown: 60, generationsPerMinute: 20, preparesPerWalletPerMinute: 10 } as const;
const minute = (now: number) => Math.floor(now / 60_000);

/** After signature verification: single-use nonce, per-wallet cooldown and a global generation budget. */
export async function guardGeneration(store: SharedStore, c: { nonce: string; address: string }, now = Date.now()) {
  if (!/^[0-9a-f]{32}$/.test(c.nonce)) throw new WebFlowError("invalid_challenge");
  if (!await store.claim(`sp:nonce:${c.nonce}`, LIMITS.nonceTtl)) throw new WebFlowError("challenge_replayed");
  if (!await store.claim(`sp:cool:wallet:${c.address}`, LIMITS.walletCooldown)) throw new WebFlowError("cooldown");
  if (await store.count(`sp:gen:${minute(now)}`, 120) > LIMITS.generationsPerMinute) throw new WebFlowError("busy");
}
/** After agentWallet authorization: per-agent cooldown, so another wallet can never lock an agent it does not control. */
export async function guardAgent(store: SharedStore, agentId: string) {
  if (!await store.claim(`sp:cool:agent:${agentId}`, LIMITS.agentCooldown)) throw new WebFlowError("cooldown");
}
/** Before building an unsigned transaction: per-wallet budget. */
export async function guardPrepare(store: SharedStore, address: string, now = Date.now()) {
  if (await store.count(`sp:prep:${address.toLowerCase()}:${minute(now)}`, 120) > LIMITS.preparesPerWalletPerMinute) throw new WebFlowError("busy");
}
