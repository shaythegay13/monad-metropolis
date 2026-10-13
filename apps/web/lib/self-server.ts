import "server-only";
import { NextResponse } from "next/server";
import deployment from "../../../fixtures/real/monad-m4/deployment.json";
import { alchemyUrl } from "../../../packages/publication/src/rpc";
import { createRpc, RpcCallError } from "../../../packages/identity/src/resolver";
import type { RegistryTrust } from "../../../packages/publication/src/verify";
import { createEnvioProvider } from "../../../packages/activity/src/index";
import { WebFlowError } from "../../../packages/web/src/publication";
import { findRegistrationBlock } from "../../../packages/web/src/self-service";
import { upstashStore } from "../../../packages/web/src/limits";
import { RequestError } from "../../../packages/policy/src/http";

export const trust = deployment.trust as RegistryTrust;
/** Shared Redis (Upstash) for cross-instance single use, cooldowns and budgets. Missing or broken config fails closed. */
export function sharedStore() {
  return upstashStore(process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL, process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN,
    { allowLocal: process.env.SIGNAL_PASSPORT_ALLOW_LOCAL_REDIS === "1" && process.env.VERCEL !== "1" });
}
const headers = { "Cache-Control": "no-store" };
const READS = ["eth_chainId", "eth_getBlockByNumber", "eth_getCode", "eth_call"];
const PUBLICATION_READS = [...READS, "eth_estimateGas", "eth_gasPrice", "eth_getBalance", "eth_getTransactionReceipt", "eth_getTransactionByHash"];

/** Operator-configured Alchemy RPC with a method allowlist and call/time budget. Never a public RPC proxy. */
export function boundedRpc(kind: "read" | "publication" = "read", maxCalls = 120, ms = 25_000) {
  const base = createRpc(alchemyUrl()); const allowed = kind === "read" ? READS : PUBLICATION_READS;
  const deadline = Date.now() + ms; let calls = 0;
  return async (method: string, params: unknown[]) => {
    if (!allowed.includes(method)) throw Error("Method not allowed");
    if (++calls > maxCalls || Date.now() >= deadline) throw Error("RPC budget exhausted");
    // Keep only structured JSON-RPC errors (code + revert data, no URL), e.g. proof an agent ID is unregistered.
    try { return await base(method, params); } catch (e) { if (e instanceof RpcCallError) throw e; throw Error("RPC unavailable"); }
  };
}

/** Same-origin JSON only, bounded body. An Origin header is not authentication; wallet proof is checked separately. */
export async function readJson(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  let sameOrigin = false;
  try { const origin = new URL(request.headers.get("origin") ?? "");
    sameOrigin = ["http:", "https:"].includes(origin.protocol) && origin.host === request.headers.get("host"); } catch {}
  if (!sameOrigin) throw new RequestError(403, "Same-origin requests required.");
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new RequestError(415, "JSON required.");
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestError(413, "Request body is too large.");
  const reader = request.body?.getReader(); if (!reader) throw new RequestError(400, "JSON body required.");
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length;
      if (size > maxBytes) { await reader.cancel(); throw new RequestError(413, "Request body is too large."); } chunks.push(part.value); }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError(400, "JSON object required.");
    return value as Record<string, unknown>;
  } catch (e) { if (e instanceof RequestError) throw e; throw new RequestError(400, "Invalid or incomplete JSON."); }
  finally { reader.releaseLock(); }
}
export function originOf(request: Request) { return new URL(request.headers.get("origin") ?? "http://invalid").origin; }

/** Per-instance limits. Not a distributed rate limiter; Vercel Firewall remains the outer layer. */
export function gate(perMinute: number, concurrent: number) {
  let start = Date.now(), count = 0, active = 0;
  return () => {
    if (Date.now() - start >= 60_000) { start = Date.now(); count = 0; }
    if (count >= perMinute || active >= concurrent) throw new RequestError(429, "Too many requests. Try again in a minute.");
    count++; active++; let done = false;
    return () => { if (!done) { active--; done = true; } };
  };
}
export async function envio() {
  const token = process.env.ENVIO_API_TOKEN?.trim();
  if (!token) throw new WebFlowError("generation_unavailable");
  return { provider: await createEnvioProvider(token, "json"), registrationBlock: (agentId: string) => findRegistrationBlock(agentId, token) };
}

const messages: Record<string, [number, string]> = {
  invalid_agent_id: [422, "Enter a whole-number ERC-8004 agent ID."],
  agent_not_found: [404, "No agent with this ID is registered in the Monad Testnet ERC-8004 Identity Registry."],
  wrong_registry: [503, "The Signal Passport Registry could not be verified. Nothing was checked."],
  wrong_wallet: [403, "This wallet is not the agent's current registry-designated agentWallet. Only that wallet can generate or publish for this agent."],
  wrong_network: [422, "Switch your wallet to Monad Testnet (chain 10143)."],
  invalid_passport: [422, "The Passport file failed integrity checks (schema, evidence references or digest)."],
  invalid_version_link: [422, "This Passport does not link to the agent's latest published version. Generate a fresh one."],
  stale_or_already_published: [409, "This version is already published or the agent's latest version changed. Generate a fresh Passport; do not send."],
  evidence_unavailable: [503, "Envio evidence could not be retrieved, so no Passport was generated. This is not a finding of zero activity."],
  generation_failed: [422, "The retrieved evidence could not be turned into a valid Passport, so nothing was generated. Try again later."],
  generation_unavailable: [503, "Passport generation is not configured on this server (Envio access is missing). Verification still works."],
  invalid_challenge: [401, "The wallet signature could not be verified. Sign the new request in your wallet and try again."],
  challenge_expired: [401, "The signed request expired. Sign a new one."],
  challenge_replayed: [401, "This signed request was already used. Sign a new one."],
  fee_cap: [422, "The estimated fee is invalid or above the 0.2 MON safety cap."],
  insufficient_MON: [422, "Your wallet does not have enough testnet MON for the estimated fee."],
  estimate_failed: [422, "The transaction failed simulation. Nothing was sent; check the version and wallet, then try again."],
  unexpected_receipt: [422, "That transaction does not match this reviewed publication."],
  invalid_transaction_hash: [422, "Invalid transaction hash."],
  busy: [429, "Too many requests right now. Try again in a minute."],
  cooldown: [429, "Please wait a minute before generating again for this wallet or agent."],
  protection_unavailable: [503, "Abuse protection is temporarily unavailable, so generation and publication preparation are paused. Verification still works."]
};
export function errorResponse(error: unknown) {
  // Never serialize provider errors, stacks, URLs or request bodies.
  if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
  const code = error instanceof WebFlowError && messages[error.code] ? error.code : "provider_unavailable";
  const [status, message] = messages[code] ?? [503, "A provider request failed. Nothing was confirmed; retry shortly."];
  return NextResponse.json({ code, error: message }, { status, headers });
}
export function ok(body: unknown) { return NextResponse.json(body, { headers }); }
