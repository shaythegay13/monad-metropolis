import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { keccak256, ZeroAddress, ZeroHash } from "ethers";
import { AGENT_ID, CHAIN_ID, REGISTRY, V1_HASH, dynamicNetwork } from "../packages/web/src/config.js";
import { walletAuthorization, walletError } from "../packages/web/src/wallet.js";
import { requireVersionTwo, unsignedPublication, confirmPublication } from "../packages/web/src/publication.js";
import { generateAgentPassport } from "../packages/passport/src/generate.js";
import { validateAgentBundle } from "../packages/consumer/src/validate-agent-bundle.js";
import { computePayloadDigest } from "../packages/verification/src/digest.js";
import { identityAbi, registryAbi, IDENTITY_REGISTRY } from "../packages/publication/src/abi.js";
import type { RegistryTrust } from "../packages/publication/src/verify.js";
import type { Rpc } from "../packages/identity/src/resolver.js";
const v1 = JSON.parse(readFileSync("fixtures/real/monad-m4/agent-2072-activity.json.passport.json", "utf8"));
const capture = JSON.parse(readFileSync("fixtures/real/monad-m4/agent-2072-activity.json", "utf8"));
// Synthetic test version: uses the genuine frozen M4 evidence, never represented as a live M5 capture.
const v2 = generateAgentPassport(capture.identity, capture, { passportVersion: 2, previousVersionHash: V1_HASH.slice(2), generatedAt: "2026-10-08T02:00:00.000Z" });
const wallet = v2.payload.subject.agentWallet!;
const other = `0x${"12".repeat(20)}`, blockHash = `0x${"34".repeat(32)}`, txHash = `0x${"56".repeat(32)}`;
const code = "0x60006000";
const trust: RegistryTrust = { address: REGISTRY, runtimeCodeHash: keccak256(code), identityRegistry: IDENTITY_REGISTRY, chainId: 10143 };
function mock(options: { chain?: string; wallet?: string; latest?: number; balance?: string; gas?: string;
  published?: boolean; mismatch?: boolean; pending?: boolean; reverted?: boolean; badInput?: boolean; reorg?: boolean; outage?: boolean } = {}): Rpc {
  return async (method, params) => {
    assert.ok(!method.startsWith("eth_send") && !method.includes("sign"), "Server must never sign or broadcast");
    if (options.outage) throw Error("synthetic private RPC details");
    if (method === "eth_chainId") return options.chain ?? "0x279f";
    if (method === "eth_getBlockByNumber") return { number: "0x123", hash: options.reorg && params[0] === "0x64" ? ZeroHash : blockHash };
    if (method === "eth_getCode") return code;
    if (method === "eth_estimateGas") return options.gas ?? "0x186a0";
    if (method === "eth_gasPrice") return "0x3b9aca00";
    if (method === "eth_getBalance") return options.balance ?? "0xde0b6b3a7640000";
    if (method === "eth_getTransactionReceipt") return options.pending ? null : {
      transactionHash: txHash, to: REGISTRY, from: wallet, blockHash, blockNumber: "0x64", status: options.reverted ? "0x0" : "0x1"
    };
    if (method === "eth_getTransactionByHash") return { hash: txHash, from: wallet, to: REGISTRY, blockHash, blockNumber: "0x64", value: "0x0", chainId: "0x279f",
      input: options.badInput ? "0x" : registryAbi.encodeFunctionData("publishPassport", [AGENT_ID, `0x${v2.integrity.digest}`, "", 2]) };
    if (method === "eth_call") {
      const tx = params[0] as { to: string; data: string };
      if (tx.to === IDENTITY_REGISTRY) return identityAbi.encodeFunctionResult("getAgentWallet", [options.wallet ?? wallet]);
      const call = registryAbi.parseTransaction({ data: tx.data })!;
      if (call.name === "identityRegistry") return registryAbi.encodeFunctionResult(call.name, [IDENTITY_REGISTRY]);
      if (call.name === "latestVersion") return registryAbi.encodeFunctionResult(call.name, [options.latest ?? 1]);
      if (call.name === "getPassportVersion") {
        const isV1 = call.args[1] === 1n; const published = isV1 || options.published;
        const hash = isV1 ? V1_HASH : options.mismatch ? `0x${"ff".repeat(32)}` : `0x${v2.integrity.digest}`;
        return registryAbi.encodeFunctionResult(call.name, [[published ? hash : ZeroHash, "", published ? wallet : ZeroAddress, 123, 100]]);
      }
    }
    throw Error(`Unexpected mock call ${method}`);
  };
}
test("M5 Dynamic network is only Monad Testnet with public RPC and MON 18 decimals", () => {
  assert.equal(dynamicNetwork.chainId, CHAIN_ID); assert.equal(dynamicNetwork.networkId, 10143);
  assert.deepEqual(dynamicNetwork.nativeCurrency, { name: "MON", symbol: "MON", decimals: 18 });
  assert.deepEqual(dynamicNetwork.rpcUrls, ["https://testnet-rpc.monad.xyz"]);
  assert.deepEqual(dynamicNetwork.blockExplorerUrls, ["https://testnet.monadscan.com"]);
});
for (const [name, address, evm, chain, current, expected] of [
  ["disconnected", undefined, false, undefined, wallet, "disconnected"],
  ["non-EVM", wallet, false, 10143, wallet, "not_evm"],
  ["wrong chain", wallet, true, 1, wallet, "wrong_network"],
  ["unknown chain", wallet, true, undefined, wallet, "wrong_network"],
  ["no registry wallet", wallet, true, 10143, undefined, "identity_unavailable"],
  ["unset registry wallet", wallet, true, 10143, ZeroAddress, "identity_unavailable"],
  ["wrong wallet", other, true, 10143, wallet, "wrong_wallet"],
  ["case insensitive match", wallet.toUpperCase(), true, 10143, wallet, "authorized"]
] as const) test(`M5 authorization: ${name}`, () => assert.equal(walletAuthorization(address, evm, chain, current), expected));
test("M5 original M4 fixture integrity and immutable v1 link survive", () => {
  assert.equal(validateAgentBundle(v1).isValid, true); assert.equal(`0x${v1.integrity.digest}`, V1_HASH);
  assert.equal(requireVersionTwo(v2).payload.generation.passportVersion, 2);
  assert.equal(v2.payload.generation.previousVersionHash, v1.integrity.digest);
  assert.deepEqual(v2.payload.limitations, v1.payload.limitations);
  assert.deepEqual(v2.payload.metrics, v1.payload.metrics);
  assert.notEqual(v2.integrity.digest, v1.integrity.digest);
});
test("M5 version/hash mismatch rejects before RPC", async () => {
  const noRpc: Rpc = async () => assert.fail("RPC called");
  const tampered = structuredClone(v2); tampered.integrity.digest = "00".repeat(32);
  const wrongLink = structuredClone(v2); wrongLink.payload.generation.previousVersionHash = "ff".repeat(32); wrongLink.integrity.digest = computePayloadDigest(wrongLink.payload);
  for (const input of [v1, tampered, wrongLink]) await assert.rejects(unsignedPublication(input, wallet, 10143, trust, noRpc));
});
test("M5 prepares unsigned ABI transaction with zero value and bounded gas; never signs", async () => {
  const tx = await unsignedPublication(v2, wallet, 10143, trust, mock());
  assert.equal(tx.chainId, 10143); assert.equal(tx.to, REGISTRY); assert.equal(tx.value, "0x0");
  assert.equal(tx.gas, "125000"); assert.equal(tx.gasPrice, "1200000000");
  assert.equal(tx.maxFeeWei, "150000000000000");
  const decoded = registryAbi.parseTransaction({ data: tx.data })!;
  assert.equal(decoded.name, "publishPassport"); assert.equal(decoded.args[0], 2072n);
  assert.equal(decoded.args[1], `0x${v2.integrity.digest}`); assert.equal(decoded.args[2], ""); assert.equal(decoded.args[3], 2n);
});
test("M5 wrong wallet, wrong chain, RPC wrong chain and wrong registry reject", async () => {
  await assert.rejects(unsignedPublication(v2, other, 10143, trust, mock()), /wrong_wallet/);
  await assert.rejects(unsignedPublication(v2, wallet, 1, trust, mock()), /wrong_network/);
  await assert.rejects(unsignedPublication(v2, wallet, 10143, trust, mock({ chain: "0x1" })));
  await assert.rejects(unsignedPublication(v2, wallet, 10143, { ...trust, address: other }, mock()), /wrong_registry/);
});
test("M5 stale/already-published version, insufficient MON, excessive fee reject", async () => {
  await assert.rejects(unsignedPublication(v2, wallet, 10143, trust, mock({ latest: 2 })), /stale_or_already_published/);
  await assert.rejects(unsignedPublication(v2, wallet, 10143, trust, mock({ published: true })));
  await assert.rejects(unsignedPublication(v2, wallet, 10143, trust, mock({ balance: "0x0" })), /insufficient_MON/);
  await assert.rejects(unsignedPublication(v2, wallet, 10143, trust, mock({ gas: "0xffffffffffff" })), /fee_cap/);
});
test("M5 wallet rejection, insufficient funds and disconnect yield safe messages", () => {
  assert.match(walletError({ code: 4001, message: "synthetic secret" }), /rejected/);
  assert.match(walletError({ cause: { code: 4001 } }), /rejected/);
  assert.match(walletError({ message: "insufficient funds synthetic secret" }), /Insufficient MON/);
  assert.match(walletError({ code: 4900 }), /disconnected/);
  assert.ok(!walletError({ message: "synthetic secret" }).includes("synthetic secret"));
});
test("M5 receipt pending and reverted are never success", async () => {
  assert.equal((await confirmPublication(v2, txHash, trust, mock({ pending: true }))).state, "pending");
  assert.equal((await confirmPublication(v2, txHash, trust, mock({ reverted: true }))).state, "reverted");
});
test("M5 receipt plus independent publication read-back confirms version 2", async () => {
  const result = await confirmPublication(v2, txHash, trust, mock({ published: true }));
  assert.equal(result.state, "confirmed"); assert.equal(result.verification?.version, "2");
  assert.equal(result.verification?.profileHash, `0x${v2.integrity.digest}`);
});
test("M5 successful receipt with missing/mismatching onchain record is not success", async () => {
  assert.equal((await confirmPublication(v2, txHash, trust, mock())).state, "unverified");
  assert.equal((await confirmPublication(v2, txHash, trust, mock({ published: true, mismatch: true }))).state, "unverified");
  assert.equal((await confirmPublication(v2, txHash, trust, mock({ published: true, reorg: true }))).state, "unverified");
});
test("M5 unrelated transaction, malformed hash and unavailable RPC cannot confirm", async () => {
  await assert.rejects(confirmPublication(v2, txHash, trust, mock({ published: true, badInput: true })), /unexpected_receipt/);
  await assert.rejects(confirmPublication(v2, "invalid", trust, mock()), /invalid_transaction_hash/);
  await assert.rejects(confirmPublication(v2, txHash, trust, mock({ outage: true })));
});
test("M5 browser import graph excludes server providers, signing modules and secrets", () => {
  const seen = new Set<string>();
  function visit(file: string) {
    if (seen.has(file)) return; seen.add(file);
    const code = readFileSync(file, "utf8").replace(/import type[\s\S]*?;/g, "");
    assert.doesNotMatch(code, /DEPLOYER_PRIVATE_KEY|ENVIO_API_TOKEN|ALCHEMY_MONAD_TESTNET_RPC_URL|alchemy\.com\/v2/);
    for (const match of code.matchAll(/from\s+["']([^"']+)["']/g)) {
      const name = match[1]; if (!name.startsWith(".")) continue;
      const target = path.resolve(path.dirname(file), name.replace(/\.js$/, "") + ".ts");
      assert.doesNotMatch(target, /packages[\\/](activity|passport|publication)[\\/]|lib[\\/]server/); visit(target);
    }
  }
  visit(path.resolve("apps/web/app/passport-app.tsx"));
  const adapter = readFileSync("apps/web/lib/server.ts", "utf8");
  assert.match(adapter, /import "server-only"/); assert.doesNotMatch(adapter, /writer|DEPLOYER_PRIVATE_KEY/);
  const launcher = readFileSync("scripts/web.mjs", "utf8"); assert.match(launcher, /delete env\.DEPLOYER_PRIVATE_KEY/);
});
