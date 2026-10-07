import type { Query, QueryResponse } from "@envio-dev/hypersync-client";
import { ActivityError, malformed } from "./errors.js";
import { safeBlock, type ProviderPage } from "./normalize.js";

export const HYPERSYNC_ENDPOINT = "https://monad-testnet.hypersync.xyz";
export type Transport = "native" | "json";
export interface ActivityQuery { fromBlock: number; toBlock: number; subjectWallet: string }
export interface HyperSyncProvider {
  transport: Transport;
  getHeight(): Promise<number>;
  get(query: ActivityQuery): Promise<{ page: ProviderPage; raw: unknown }>;
}
export function requireToken(token: string | undefined): string {
  if (!token?.trim()) throw new ActivityError("missing_api_token", "Set ENVIO_API_TOKEN in the process environment or load .env.local explicitly");
  return token.trim();
}
export function nativeQuery(q: ActivityQuery): Query {
  return { fromBlock: q.fromBlock, toBlock: q.toBlock, transactions: [{ from: [q.subjectWallet] }],
    fieldSelection: { block: ["Number", "Timestamp", "Hash"],
      transaction: ["Hash", "BlockNumber", "BlockHash", "From", "To", "Value", "Status"] },
    maxNumTransactions: 1000 };
}
export function jsonQuery(q: ActivityQuery) {
  return { from_block: q.fromBlock, to_block: q.toBlock, transactions: [{ from: [q.subjectWallet] }],
    field_selection: { block: ["number", "timestamp", "hash"],
      transaction: ["hash", "block_number", "block_hash", "from", "to", "value", "status"] },
    max_num_transactions: 1000 };
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return malformed();
  return value as Record<string, unknown>;
}
// HTTP JSON returns an array of data batches; the native client returns merged camelCase tables.
export function decodeJsonPage(raw: unknown): ProviderPage {
  const r = object(raw);
  if (!Array.isArray(r.data)) return malformed();
  const blocks: unknown[] = []; const transactions: unknown[] = [];
  for (const group of r.data) {
    const g = object(group);
    if (!Array.isArray(g.blocks) || !Array.isArray(g.transactions)) return malformed();
    blocks.push(...g.blocks);
    transactions.push(...g.transactions.map(value => {
      const t = object(value);
      return { hash: t.hash, blockNumber: t.block_number, blockHash: t.block_hash,
        from: t.from, to: t.to, value: t.value, status: t.status };
    }));
  }
  return { blocks, transactions, nextBlock: r.next_block, archiveHeight: r.archive_height, rollbackGuard: r.rollback_guard };
}
export function decodeNativePage(raw: QueryResponse): ProviderPage {
  if (!raw?.data || !Array.isArray(raw.data.blocks) || !Array.isArray(raw.data.transactions)) return malformed();
  return { blocks: raw.data.blocks, transactions: raw.data.transactions,
    nextBlock: raw.nextBlock, archiveHeight: raw.archiveHeight, rollbackGuard: raw.rollbackGuard };
}
function providerError(e: unknown): ActivityError {
  if (e instanceof ActivityError) return e;
  // Inspect only for classification; never retain/log native errors, URLs, bodies or tokens.
  const auth = e instanceof Error && /\b(401|403|unauthorized|forbidden)\b/i.test(e.message);
  return new ActivityError(auth ? "provider_authentication" : "provider_error",
    auth ? "Envio rejected authentication; check ENVIO_API_TOKEN" : "Envio request failed or timed out");
}
export async function createEnvioProvider(tokenInput: string | undefined, transport: Transport = "native",
  fetchFn: typeof fetch = fetch): Promise<HyperSyncProvider> {
  const token = requireToken(tokenInput);
  if (transport === "native") {
    let module: typeof import("@envio-dev/hypersync-client");
    try { module = await import("@envio-dev/hypersync-client"); }
    catch { throw new ActivityError("unsupported_platform", "Official HyperSync native client unavailable; use a supported OS or explicitly select json transport"); }
    let client: InstanceType<typeof module.HypersyncClient>;
    try { client = new module.HypersyncClient({ url: HYPERSYNC_ENDPOINT, apiToken: token,
      httpReqTimeoutMillis: 30000, maxNumRetries: 0 }); }
    catch (e) { throw providerError(e); }
    return { transport, async getHeight() { try { return safeBlock(await client.getHeight()); } catch (e) { throw providerError(e); } },
      async get(query) { try { const raw = await client.get(nativeQuery(query)); return { raw, page: decodeNativePage(raw) }; }
        catch (e) { throw providerError(e); } } };
  }
  if (transport !== "json") throw new ActivityError("invalid_config", "Transport must be native or json");
  async function request(path: string, body?: unknown): Promise<unknown> {
    try {
      const response = await fetchFn(`${HYPERSYNC_ENDPOINT}${path}`, {
        method: body === undefined ? "GET" : "POST", redirect: "error", signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      if (response.status === 401 || response.status === 403)
        throw new ActivityError("provider_authentication", "Envio rejected authentication; check ENVIO_API_TOKEN");
      if (!response.ok) throw new ActivityError("provider_error", `Envio HTTP ${response.status}`);
      if (!response.body) return malformed();
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
      try { while (true) {
        const part = await reader.read(); if (part.done) break;
        size += part.value.length;
        if (size > 16 * 1024 * 1024) { await reader.cancel(); throw new ActivityError("provider_error", "Envio response exceeded the 16 MiB limit"); }
        chunks.push(part.value);
      } } finally { reader.releaseLock(); }
      try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))); }
      catch { return malformed(); }
    } catch (e) { throw providerError(e); }
  }
  return { transport, async getHeight() { return safeBlock(object(await request("/height")).height); },
    async get(query) { const raw = await request("/query", jsonQuery(query)); return { raw, page: decodeJsonPage(raw) }; } };
}
