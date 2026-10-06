import test from "node:test";
import assert from "node:assert/strict";
import { identityConfig } from "../packages/identity/src/config.js";
import { resolveAgent, callData, createRpc, RpcCallError, IdentityResolutionError, type Rpc } from "../packages/identity/src/resolver.js";
import { retrieveRegistration, isPublicIpv4, MAX_REGISTRATION_BYTES, RegistrationError } from "../packages/identity/src/registration.js";
import { agentIdentitySchema, UINT256_MAX } from "../packages/schema/src/identity.js";

// Entirely synthetic deterministic fixtures; never presented as real agent history.
const owner = "0x" + "1".repeat(40), wallet = "0x" + "2".repeat(40);
const word = (n: bigint) => n.toString(16).padStart(64, "0");
const abiAddress = (s: string) => "0x" + "0".repeat(24) + s.slice(2);
const abiString = (s: string) => { const hex = Buffer.from(s).toString("hex"); return "0x" + word(32n) + word(BigInt(Buffer.byteLength(s))) + hex.padEnd(Math.ceil(hex.length / 64) * 64, "0"); };
const document = { type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1", name: "Synthetic agent", services: [{ name: "wallet", endpoint: "eip155:10143:" + owner }] };
const dataUri = "data:application/json;base64," + Buffer.from(JSON.stringify(document)).toString("base64");
function mock(options: { uri?: string; wallet?: string; owner?: string; fail?: string; error?: unknown; chain?: string; code?: string; reorg?: boolean } = {}) {
  const calls: Array<{ method: string; params: unknown[] }> = [];
  let blocks = 0;
  const rpc: Rpc = async (method, params) => {
    calls.push({ method, params });
    if (method === options.fail) throw options.error ?? new Error("Synthetic outage");
    if (method === "eth_chainId") return options.chain ?? "0x279f";
    if (method === "eth_getBlockByNumber") return { number: "0x10", hash: "0x" + ((options.reorg && blocks++ > 0) ? "b" : "a").repeat(64) };
    if (method === "eth_getCode") return options.code ?? "0x60016000";
    if (method === "eth_call") {
      const data = (params[0] as { data: string }).data;
      if (data.slice(0, 10) === callData("ownerOf(uint256)", "1").slice(0, 10)) return abiAddress(options.owner ?? owner);
      if (data.slice(0, 10) === callData("tokenURI(uint256)", "1").slice(0, 10)) return abiString(options.uri ?? dataUri);
      if (data.slice(0, 10) === callData("getAgentWallet(uint256)", "1").slice(0, 10)) return abiAddress(options.wallet ?? wallet);
    }
    throw new Error("Unexpected synthetic RPC call");
  };
  return { rpc, calls };
}
const config = identityConfig();
const hasCode = (code: string) => (e: unknown) => e instanceof IdentityResolutionError && e.code === code;

test("identity: explicit network registry pairs and config validation", () => {
  assert.equal(config.chainId, 10143); assert.equal(identityConfig("monad-mainnet").chainId, 143);
  assert.notEqual(config.registryAddress, identityConfig("monad-mainnet").registryAddress);
  for (const network of ["ethereum", "constructor", "__proto__"]) assert.throws(() => identityConfig(network));
  for (const url of ["http://example.com", "https://user:pass@example.com", "bad"]) assert.throws(() => identityConfig("monad-testnet", url));
});
test("identity: valid agent separates owner, registry wallet and card advertisements", async () => {
  const { rpc, calls } = mock(); const result = await resolveAgent("1", config, { rpc });
  assert.equal(result.ownerAddress, owner); assert.equal(result.agentWallet, wallet);
  assert.equal(result.agentWalletStatus, "set"); assert.equal(result.registration.status, "retrieved");
  assert.equal(result.registration.document?.name, "Synthetic agent");
  assert.equal(result.agentRegistry, `eip155:10143:${config.registryAddress}`);
  assert.equal(result.resolution.blockNumber, "16");
  assert.equal("walletAddresses" in result, false);
  assert.ok(calls.filter(c => ["eth_call", "eth_getCode"].includes(c.method)).every(c => c.params[1] === "0x10"));
  assert.ok(calls.every(c => !c.method.includes("send")));
});
test("identity: rejects malformed/out-of-range IDs before RPC", async () => {
  const { rpc, calls } = mock();
  for (const id of ["", "01", "-1", "1.5", "0x1", " 1", "1e3", (UINT256_MAX + 1n).toString(), "1".repeat(10000), 1 as unknown as string])
    await assert.rejects(resolveAgent(id, config, { rpc }), hasCode("invalid_agent_id"));
  assert.equal(calls.length, 0);
});
test("identity: accepts zero token ID and uint256 maximum without rounding", async () => {
  for (const id of ["0", UINT256_MAX.toString()]) assert.equal((await resolveAgent(id, config, mock())).agentId, id);
});
test("identity: wrong chain, config mismatch and empty bytecode remain distinct", async () => {
  await assert.rejects(resolveAgent("1", config, mock({ chain: "0x8f" })), hasCode("wrong_chain"));
  await assert.rejects(resolveAgent("1", { ...config, chainId: 143 }, mock()), hasCode("invalid_config"));
  await assert.rejects(resolveAgent("1", config, mock({ code: "0x" })), hasCode("registry_unavailable"));
});
test("identity: exact ERC721NonexistentToken maps to not found", async () => {
  await assert.rejects(resolveAgent("1", config, mock({ fail: "eth_call", error: new RpcCallError(3, callData("ERC721NonexistentToken(uint256)", "1")) })), hasCode("agent_not_found"));
});
test("identity: outage, generic revert, wrong-token revert are not not-found", async () => {
  for (const error of [new Error("offline"), new RpcCallError(-32000, "0x"), new RpcCallError(3, callData("ERC721NonexistentToken(uint256)", "2"))])
    await assert.rejects(resolveAgent("1", config, mock({ fail: "eth_call", error })), hasCode("rpc_error"));
});
test("identity: zero wallet is unset, never owner fallback; empty URI allowed", async () => {
  const result = await resolveAgent("1", config, mock({ wallet: "0x" + "0".repeat(40), uri: "" }));
  assert.equal(result.ownerAddress, owner); assert.equal(result.agentWallet, undefined);
  assert.equal(result.agentWalletStatus, "unset"); assert.equal(result.agentUri, "");
  assert.equal(result.registration.status, "missing_uri");
});
test("identity: metadata failures preserve onchain identity", async () => {
  for (const [uri, expected] of [["ftp://example.com/card", "unsupported_uri"], ["https://127.0.0.1/card", "blocked_uri"], ["bad URI", "malformed"], ["data:application/json;base64,eA==", "malformed"]]) {
    const result = await resolveAgent("1", config, mock({ uri }));
    assert.equal(result.ownerAddress, owner); assert.equal(result.registration.status, expected);
  }
  const result = await resolveAgent("1", config, { ...mock({ uri: "https://example.com/card" }), registrationReader: async () => { throw new Error("offline"); } });
  assert.equal(result.registration.status, "unreachable"); assert.equal(result.agentWallet, wallet);
});
test("identity: malformed ABI is an operational response error", async () => {
  const m = mock();
  for (const bad of ["0x", "0xzz", "0x" + "f".repeat(64)]) {
    const rpc: Rpc = (method, params) => method === "eth_call" ? Promise.resolve(bad) : m.rpc(method, params);
    await assert.rejects(resolveAgent("1", config, { rpc }), hasCode("invalid_rpc_response"));
  }
});
test("identity: URI ABI bounds and invalid UTF8 rejected", async () => {
  for (const bad of ["0x" + word(64n) + word(0n), "0x" + word(32n) + word(999999999999n), "0x" + word(32n) + word(1n) + "ff".padEnd(64, "0")]) {
    const m = mock();
    const rpc: Rpc = (method, params) => method === "eth_call" && (params[0] as {data:string}).data.startsWith(callData("tokenURI(uint256)", "1").slice(0,10)) ? Promise.resolve(bad) : m.rpc(method, params);
    await assert.rejects(resolveAgent("1", config, { rpc }), hasCode("invalid_rpc_response"));
  }
});
test("identity: registry wallet read failure cannot become unset or not-found", async () => {
  const m = mock();
  const rpc: Rpc = (method, params) => {
    if (method === "eth_call" && (params[0] as {data:string}).data.startsWith(callData("getAgentWallet(uint256)", "1").slice(0,10))) throw new RpcCallError(3, callData("ERC721NonexistentToken(uint256)", "1"));
    return m.rpc(method, params);
  };
  await assert.rejects(resolveAgent("1", config, { rpc }), hasCode("rpc_error"));
});
test("identity: mixed-case onchain address normalizes and equal owner/wallet retain separate fields", async () => {
  const address = "0x" + "Ab".repeat(20);
  const result = await resolveAgent("1", config, mock({ owner: address, wallet: address }));
  assert.equal(result.ownerAddress, address.toLowerCase()); assert.equal(result.agentWallet, address.toLowerCase());
});
test("identity: reorg during registry reads rejects inconsistent snapshot", async () => {
  await assert.rejects(resolveAgent("1", config, mock({ reorg: true })), hasCode("snapshot_changed"));
});
test("identity: standalone schema rejects inconsistent registry/wallet states", async () => {
  const result = await resolveAgent("1", config, mock());
  assert.equal(agentIdentitySchema.safeParse({ ...result, agentRegistry: "eip155:143:wrong" }).success, false);
  assert.equal(agentIdentitySchema.safeParse({ ...result, agentWalletStatus: "unset" }).success, false);
});
test("registration: HTTPS preserves raw advertisements; never fetches services", async () => {
  let count = 0;
  const result = await retrieveRegistration("https://example.com/card", async (url) => {
    count++; assert.equal(url.href, "https://example.com/card"); return Buffer.from(JSON.stringify({ ...document, capability: "trading" }));
  });
  assert.equal(count, 1); assert.equal(result.status, "retrieved"); assert.equal(result.document?.capability, "trading");
  assert.ok(result.warnings.some(w => w.includes("advertisements")));
});
test("registration: IPFS mapped to explicit gateway and warns CID unverified", async () => {
  const result = await retrieveRegistration("ipfs://QmSynthetic/card.json", async (url) => {
    assert.equal(url.href, "https://ipfs.io/ipfs/QmSynthetic/card.json"); return Buffer.from(JSON.stringify(document));
  });
  assert.equal(result.source, "ipfs_gateway"); assert.equal(result.status, "retrieved");
  assert.ok(result.warnings.some(w => w.includes("CID")));
  assert.equal((await retrieveRegistration("ipfs://QmSynthetic/../x")).status, "malformed");
});
test("registration: percent encoded and base64 JSON supported", async () => {
  for (const uri of [dataUri, "data:application/json," + encodeURIComponent(JSON.stringify(document))])
    assert.equal((await retrieveRegistration(uri)).document?.name, "Synthetic agent");
});
test("registration: invalid JSON, base64, UTF8, schema and missing fields handled", async () => {
  for (const uri of ["data:application/json;base64,@@@", "data:application/json,%ZZ", "data:application/json,[]", "data:application/json,{}", "data:application/json;base64,/w=="])
    assert.equal((await retrieveRegistration(uri)).status, "malformed");
  const minimal = await retrieveRegistration("data:application/json," + encodeURIComponent(JSON.stringify({ type: document.type })));
  assert.equal(minimal.status, "retrieved"); assert.equal(minimal.document?.name, undefined); assert.ok(minimal.warnings.length > 1);
});
test("registration: unsupported schemes and non-JSON data are explicit", async () => {
  for (const uri of ["http://example.com", "file:///secret", "javascript:alert(1)", "data:text/html,hi"])
    assert.equal((await retrieveRegistration(uri)).status, "unsupported_uri");
});
test("registration: SSRF destinations blocked before retrieval", async () => {
  let count = 0;
  for (const uri of ["https://localhost/card", "https://127.1/card", "https://2130706433/card", "https://10.0.0.1/card", "https://[::1]/card", "https://user:pass@example.com/card", "https://example.com:8080/card", "https://service.internal/card"])
    assert.equal((await retrieveRegistration(uri, async () => { count++; return Buffer.from("{}"); })).status, "blocked_uri");
  assert.equal(count, 0);
  for (const ip of ["127.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "::1", "224.0.0.1", "198.18.0.1"]) assert.equal(isPublicIpv4(ip), false);
  assert.equal(isPublicIpv4("8.8.8.8"), true);
});
test("registration: byte limits and typed retrieval errors remain explicit", async () => {
  assert.equal((await retrieveRegistration("https://example.com/card", async () => Buffer.alloc(MAX_REGISTRATION_BYTES + 1))).status, "too_large");
  assert.equal((await retrieveRegistration("data:application/json," + " ".repeat(MAX_REGISTRATION_BYTES + 1))).status, "too_large");
  for (const status of ["blocked_uri", "unreachable", "too_large"] as const)
    assert.equal((await retrieveRegistration("https://example.com/card", async () => { throw new RegistrationError(status, "Synthetic failure"); })).status, status);
});
test("identity: mismatched advertised registration warns without changing registry facts", async () => {
  const uri = "data:application/json," + encodeURIComponent(JSON.stringify({ ...document, registrations: [{ agentId: 2, agentRegistry: "eip155:143:other" }] }));
  const result = await resolveAgent("1", config, mock({ uri }));
  assert.equal(result.agentId, "1"); assert.ok(result.registration.warnings.some(w => w.includes("do not match")));
});
test("RPC: request envelope and exact error data preserved", async () => {
  const rpc = createRpc("https://example.com", (async (_url, options) => {
    const body = JSON.parse(options?.body as string); assert.equal(body.method, "eth_chainId");
    assert.equal(options?.redirect, "error");
    return Response.json({ jsonrpc: "2.0", id: body.id, result: "0x279f" });
  }) as typeof fetch);
  assert.equal(await rpc("eth_chainId", []), "0x279f");
});
test("RPC: HTTP failure, invalid JSON, wrong ID and error envelopes never mean absence", async () => {
  const responses = [new Response("outage", { status: 503 }), new Response("bad JSON"), Response.json({ jsonrpc: "2.0", id: 99, result: "0x" }), Response.json({ jsonrpc: "2.0", id: 1, error: { code: -32000, message: "offline" } })];
  for (const response of responses) await assert.rejects(createRpc("https://example.com", (async () => response) as typeof fetch)("eth_call", []), (e: unknown) => e instanceof IdentityResolutionError && e.code !== "agent_not_found");
});
