import { keccak256 } from "js-sha3";
import { agentIdSchema, agentIdentitySchema, type AgentIdentity } from "../../schema/src/identity.js";
import { identityConfig, type IdentityConfig } from "./config.js";
import { retrieveRegistration, type RegistrationReader } from "./registration.js";

export type IdentityErrorCode = "invalid_agent_id" | "invalid_config" | "rpc_error" | "invalid_rpc_response" |
  "wrong_chain" | "registry_unavailable" | "agent_not_found" | "snapshot_changed";
export class IdentityResolutionError extends Error {
  constructor(public code: IdentityErrorCode, message: string) { super(message); }
}
export class RpcCallError extends IdentityResolutionError {
  constructor(public rpcCode: number, public data: unknown) { super("rpc_error", `RPC returned error ${rpcCode}`); }
}
export type Rpc = (method: string, params: unknown[]) => Promise<unknown>;
export function createRpc(url: string, fetchFn: typeof fetch = fetch): Rpc {
  let id = 0;
  return async (method, params) => {
    const requestId = ++id;
    try {
      const response = await fetchFn(url, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(15_000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params })
      });
      if (!response.ok) throw new IdentityResolutionError("rpc_error", `RPC HTTP ${response.status}`);
      if (!response.body) throw new Error("Empty RPC response");
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
      try {
        while (true) {
          const next = await reader.read(); if (next.done) break;
          size += next.value.length;
          if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new Error("RPC response too large"); }
          chunks.push(next.value);
        }
      } finally { reader.releaseLock(); }
      const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!data || data.jsonrpc !== "2.0" || data.id !== requestId ||
        (Object.hasOwn(data, "error") === Object.hasOwn(data, "result")))
        throw new IdentityResolutionError("invalid_rpc_response", "Invalid JSON-RPC envelope");
      if (data.error) {
        if (!Number.isInteger(data.error.code)) throw new Error("Malformed RPC error");
        throw new RpcCallError(data.error.code, data.error.data);
      }
      return data.result;
    } catch (e) {
      if (e instanceof IdentityResolutionError) throw e;
      // Never echo an RPC URL, provider body or credential in user-facing failures.
      throw new IdentityResolutionError("rpc_error", "RPC transport failed, timed out or returned malformed data");
    }
  };
}

export function callData(signature: string, agentId: string): string {
  return `0x${keccak256(signature).slice(0, 8)}${BigInt(agentId).toString(16).padStart(64, "0")}`;
}
function invalidResponse(): never { throw new IdentityResolutionError("invalid_rpc_response", "Registry returned malformed ABI data"); }
function hexBytes(value: unknown): string {
  if (typeof value !== "string" || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) return invalidResponse();
  return value.slice(2).toLowerCase();
}
function addressResult(value: unknown): string {
  const hex = hexBytes(value);
  if (hex.length !== 64 || !/^0{24}/.test(hex)) return invalidResponse();
  return `0x${hex.slice(24)}`;
}
function uriResult(value: unknown): string {
  const hex = hexBytes(value);
  if (hex.length < 128 || BigInt(`0x${hex.slice(0, 64)}`) !== 32n) return invalidResponse();
  const n = BigInt(`0x${hex.slice(64, 128)}`);
  if (n > 1024n * 1024n || hex.length !== 128 + Math.ceil(Number(n) / 32) * 64) return invalidResponse();
  if (!/^0*$/.test(hex.slice(128 + Number(n) * 2))) return invalidResponse();
  try { return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(hex.slice(128, 128 + Number(n) * 2), "hex")); }
  catch { return invalidResponse(); }
}
function blockResult(value: unknown): { number: string; hash: string } {
  if (!value || typeof value !== "object") return invalidResponse();
  const b = value as Record<string, unknown>;
  if (typeof b.number !== "string" || !/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(b.number) ||
    typeof b.hash !== "string" || !/^0x[0-9a-f]{64}$/i.test(b.hash)) return invalidResponse();
  return { number: b.number, hash: b.hash.toLowerCase() };
}

export async function resolveAgent(agentId: string, config: IdentityConfig = identityConfig(), options: {
  rpc?: Rpc; registrationReader?: RegistrationReader; now?: () => Date;
} = {}): Promise<AgentIdentity> {
  if (!agentIdSchema.safeParse(agentId).success)
    throw new IdentityResolutionError("invalid_agent_id", "Agent ID must be a canonical decimal uint256 string");
  try {
    const expected = identityConfig(config.network, config.rpcUrl);
    if (expected.chainId !== config.chainId || expected.registryAddress !== config.registryAddress.toLowerCase()) throw new Error();
  } catch { throw new IdentityResolutionError("invalid_config", "Network and registry configuration do not agree"); }
  const transport = options.rpc ?? createRpc(config.rpcUrl);
  const rpc: Rpc = async (method, params) => {
    try { return await transport(method, params); }
    catch (e) { if (e instanceof IdentityResolutionError) throw e;
      throw new IdentityResolutionError("rpc_error", "RPC provider unavailable"); }
  };
  const chain = await rpc("eth_chainId", []);
  if (typeof chain !== "string" || !/^0x[0-9a-f]+$/i.test(chain)) return invalidResponse();
  if (BigInt(chain) !== BigInt(config.chainId)) throw new IdentityResolutionError("wrong_chain", "RPC chain does not match selected network");
  const block = blockResult(await rpc("eth_getBlockByNumber", ["latest", false]));
  const registryAddress = config.registryAddress.toLowerCase();
  const code = hexBytes(await rpc("eth_getCode", [registryAddress, block.number]));
  if (!code.length || /^0+$/.test(code)) throw new IdentityResolutionError("registry_unavailable", "Identity registry has no deployed bytecode");
  const call = (signature: string) => rpc("eth_call", [{ to: registryAddress, data: callData(signature, agentId) }, block.number]);
  let ownerAddress: string;
  try { ownerAddress = addressResult(await call("ownerOf(uint256)")); }
  catch (e) {
    // Only the exact, token-specific ERC-6093 custom error is proof of absence.
    // Generic reverts, missing error data and provider failures are NOT not-found.
    const absent = callData("ERC721NonexistentToken(uint256)", agentId);
    if (e instanceof RpcCallError && typeof e.data === "string" && e.data.toLowerCase() === absent)
      throw new IdentityResolutionError("agent_not_found", "Agent is not registered at the selected registry/block");
    throw e;
  }
  const zero = `0x${"0".repeat(40)}`;
  if (ownerAddress === zero) return invalidResponse();
  const agentUri = uriResult(await call("tokenURI(uint256)"));
  const wallet = addressResult(await call("getAgentWallet(uint256)"));
  const confirm = blockResult(await rpc("eth_getBlockByNumber", [block.number, false]));
  if (confirm.hash !== block.hash || confirm.number !== block.number)
    throw new IdentityResolutionError("snapshot_changed", "Resolution block changed; retry resolution");
  const registration = await retrieveRegistration(agentUri, options.registrationReader);
  const agentRegistry = `eip155:${config.chainId}:${registryAddress}`;
  if (registration.document?.registrations?.length && !registration.document.registrations.some((entry) =>
    String(entry.agentId) === agentId && entry.agentRegistry.toLowerCase() === agentRegistry))
    registration.warnings.push("Advertised registrations do not match this onchain identity.");
  return agentIdentitySchema.parse({
    subjectType: "erc8004_agent", agentId, agentRegistry, network: config.network,
    chainId: config.chainId, registryAddress, ownerAddress,
    ...(wallet !== zero ? { agentWallet: wallet } : {}), agentWalletStatus: wallet === zero ? "unset" : "set",
    agentUri, registration,
    resolution: { blockNumber: BigInt(block.number).toString(), blockHash: block.hash,
      registryCodeHash: `0x${keccak256(Buffer.from(code, "hex"))}`,
      resolvedAt: (options.now?.() ?? new Date()).toISOString() }
  });
}
