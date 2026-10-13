import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { keccak256, ZeroAddress, ZeroHash, Wallet, hashMessage } from "ethers";
import { CHAIN_ID, REGISTRY } from "../packages/web/src/config.js";
import { challengeMessage, verifyChallenge, NonceCache, prepareUserPublication, confirmUserPublication, generateNextPassport,
  parseAgentId, publicationState } from "../packages/web/src/self-service.js";
import { WebFlowError } from "../packages/web/src/publication.js";
import { identityAbi, registryAbi, IDENTITY_REGISTRY } from "../packages/publication/src/abi.js";
import type { RegistryTrust } from "../packages/publication/src/verify.js";
import type { Rpc } from "../packages/identity/src/resolver.js";
import type { HyperSyncProvider } from "../packages/activity/src/envio.js";

const published2072 = JSON.parse(readFileSync("apps/web/public/passports/agent-2072-v2-published.json", "utf8"));
const unpublished2 = JSON.parse(readFileSync("apps/web/public/passports/agent-2-v1-unpublished.json", "utf8"));
const code = "0x60006000";
const trust: RegistryTrust = { address: REGISTRY, runtimeCodeHash: keccak256(code), identityRegistry: IDENTITY_REGISTRY, chainId: 10143 };
const blockHash = `0x${"34".repeat(32)}`, txHash = `0x${"56".repeat(32)}`;
const origin = "https://signal-passport-monad.vercel.app";
const rejects = (p: Promise<unknown>, code: string) => assert.rejects(p, (e: unknown) => e instanceof WebFlowError && e.code === code);
const throwsCode = (f: () => unknown, code: string) => assert.throws(f, (e: unknown) => e instanceof WebFlowError && e.code === code);

/** Synthetic chain for one agent. Never signs or broadcasts. */
function chain(o: { agentId: string; wallet: string; latest: number; latestHash?: string; chain?: string; balance?: string; gas?: string;
  receipt?: "ok" | "reverted" | "pending"; input?: string; publishedHash?: string; owner?: string; uri?: string; unregistered?: boolean }): Rpc {
  return async (method, params) => {
    assert.ok(!method.startsWith("eth_send") && !method.includes("sign"), "Server must never sign or broadcast");
    if (method === "eth_chainId") return o.chain ?? "0x279f";
    if (method === "eth_getBlockByNumber") return { number: "0x5000", hash: blockHash };
    if (method === "eth_getCode") return code;
    if (method === "eth_estimateGas") return o.gas ?? "0x186a0";
    if (method === "eth_gasPrice") return "0x3b9aca00";
    if (method === "eth_getBalance") return o.balance ?? "0xde0b6b3a7640000";
    if (method === "eth_getTransactionReceipt") return o.receipt === "pending" ? null : { transactionHash: txHash, to: REGISTRY, from: o.wallet,
      blockHash, blockNumber: "0x64", status: o.receipt === "reverted" ? "0x0" : "0x1" };
    if (method === "eth_getTransactionByHash") return { hash: txHash, from: o.wallet, to: REGISTRY, blockHash, blockNumber: "0x64", value: "0x0", chainId: "0x279f", input: o.input ?? "0x" };
    if (method === "eth_call") {
      const tx = params[0] as { to: string; data: string };
      if (tx.to === IDENTITY_REGISTRY) {
        const call = identityAbi.parseTransaction({ data: tx.data })!;
        if (o.unregistered) throw Object.assign(new Error("reverted"), { code: 3 });
        if (call.name === "getAgentWallet") return identityAbi.encodeFunctionResult(call.name, [o.wallet]);
        if (call.name === "ownerOf") return identityAbi.encodeFunctionResult(call.name, [o.owner ?? o.wallet]);
        if (call.name === "tokenURI") return identityAbi.encodeFunctionResult(call.name, [o.uri ?? "data:application/json;base64,e30="]);
      }
      const call = registryAbi.parseTransaction({ data: tx.data })!;
      if (call.name === "identityRegistry") return registryAbi.encodeFunctionResult(call.name, [IDENTITY_REGISTRY]);
      if (call.name === "latestVersion") return registryAbi.encodeFunctionResult(call.name, [o.latest]);
      if (call.name === "getPassportVersion") {
        const v = Number(call.args[1]); const isLatest = v === o.latest && o.latest > 0; const isPublished = v <= o.latest && v > 0;
        const hash = o.publishedHash && v === o.latest ? o.publishedHash : isLatest ? (o.latestHash ?? `0x${"aa".repeat(32)}`) : isPublished ? `0x${"bb".repeat(32)}` : ZeroHash;
        return registryAbi.encodeFunctionResult(call.name, [[hash, "", isPublished ? o.wallet : ZeroAddress, 123, isPublished ? 100 : 0]]);
      }
    }
    throw Error(`Unexpected mock call ${method}`);
  };
}

test("self-service: agent IDs must be canonical decimal strings", () => {
  for (const ok of ["0", "2", "2072"]) assert.equal(parseAgentId(ok), ok);
  for (const bad of ["", "02", "-1", "1.5", "0x10", " 2", 2, "1".repeat(32)]) throwsCode(() => parseAgentId(bad), "invalid_agent_id");
});

test("self-service: a fresh wallet signature from the claimed wallet is required to generate", async () => {
  const signer = Wallet.createRandom(); const nonces = new NonceCache(); const now = Date.parse("2026-10-13T18:00:00.000Z");
  const fields = { agentId: "77", address: signer.address, origin, issuedAt: new Date(now).toISOString(), nonce: "ab".repeat(16) };
  const message = challengeMessage(fields); const signature = await signer.signMessage(message);
  assert.deepEqual(verifyChallenge({ message, signature }, origin, nonces, now), { agentId: "77", address: signer.address.toLowerCase() });
  throwsCode(() => verifyChallenge({ message, signature }, origin, nonces, now), "challenge_replayed");
  const fresh = (over: Partial<typeof fields>) => challengeMessage({ ...fields, nonce: Math.random().toString(16).slice(2).padEnd(32, "0").slice(0, 32), ...over });
  const m2 = fresh({}); throwsCode(() => verifyChallenge({ message: m2, signature: await_(signer, m2) }, "https://evil.example", new NonceCache(), now), "invalid_challenge");
  const old = fresh({ issuedAt: new Date(now - 6 * 60_000).toISOString() });
  throwsCode(() => verifyChallenge({ message: old, signature: await_(signer, old) }, origin, new NonceCache(), now), "challenge_expired");
  const future = fresh({ issuedAt: new Date(now + 5 * 60_000).toISOString() });
  throwsCode(() => verifyChallenge({ message: future, signature: await_(signer, future) }, origin, new NonceCache(), now), "challenge_expired");
  // Someone else's signature over a message naming the victim wallet is rejected.
  const victim = Wallet.createRandom(); const claim = fresh({ address: victim.address });
  throwsCode(() => verifyChallenge({ message: claim, signature: await_(signer, claim) }, origin, new NonceCache(), now), "invalid_challenge");
  throwsCode(() => verifyChallenge({ message: message.replace("Agent ID: 77", "Agent ID: 78"), signature }, origin, new NonceCache(), now), "invalid_challenge");
  throwsCode(() => verifyChallenge({ message: message + "\nExtra: x", signature }, origin, new NonceCache(), now), "invalid_challenge");
  throwsCode(() => verifyChallenge({ message, signature: "0x1234" }, origin, new NonceCache(), now), "invalid_challenge");
});
/** Synchronous EIP-191 signature for compact assertions. */
function await_(signer: { signingKey: Wallet["signingKey"] }, message: string) { return signer.signingKey.sign(hashMessage(message)).serialized; }

test("self-service: generic publication prepares the next version only for the current agentWallet", async () => {
  const p = unpublished2.payload, wallet = p.subject.agentWallet;
  const tx = await prepareUserPublication(unpublished2, wallet, CHAIN_ID, trust, chain({ agentId: "2", wallet, latest: 0 }));
  assert.equal(tx.version, 1); assert.equal(tx.agentId, "2"); assert.equal(tx.to, REGISTRY); assert.equal(tx.chainId, CHAIN_ID); assert.equal(tx.contentUri, "");
  assert.equal(tx.data, registryAbi.encodeFunctionData("publishPassport", ["2", `0x${unpublished2.integrity.digest}`, "", 1]));
  await rejects(prepareUserPublication(unpublished2, `0x${"12".repeat(20)}`, CHAIN_ID, trust, chain({ agentId: "2", wallet, latest: 0 })), "wrong_wallet");
  await rejects(prepareUserPublication(unpublished2, wallet, 1, trust, chain({ agentId: "2", wallet, latest: 0 })), "wrong_network");
  await rejects(prepareUserPublication(unpublished2, wallet, CHAIN_ID, trust, chain({ agentId: "2", wallet, latest: 1 })), "stale_or_already_published");
  await rejects(prepareUserPublication(unpublished2, wallet, CHAIN_ID, trust, chain({ agentId: "2", wallet, latest: 0, chain: "0x1" })), "provider_unavailable");
  await rejects(prepareUserPublication(unpublished2, wallet, CHAIN_ID, trust, chain({ agentId: "2", wallet, latest: 0, gas: "0xffffffffffff" })), "fee_cap");
  await rejects(prepareUserPublication(unpublished2, wallet, CHAIN_ID, trust, chain({ agentId: "2", wallet, latest: 0, balance: "0x1" })), "insufficient_MON");
  const tampered = structuredClone(unpublished2); tampered.payload.metrics[0].value = 999;
  await rejects(prepareUserPublication(tampered, wallet, CHAIN_ID, trust, chain({ agentId: "2", wallet, latest: 0 })), "invalid_passport");
  // A later version must link to the latest published digest.
  const w2072 = published2072.payload.subject.agentWallet;
  await rejects(prepareUserPublication(published2072, w2072, CHAIN_ID, trust, chain({ agentId: "2072", wallet: w2072, latest: 1, latestHash: `0x${"cc".repeat(32)}` })), "invalid_version_link");
  const linked = await prepareUserPublication(published2072, w2072, CHAIN_ID, trust,
    chain({ agentId: "2072", wallet: w2072, latest: 1, latestHash: `0x${published2072.payload.generation.previousVersionHash}` }));
  assert.equal(linked.version, 2);
  const wrongRegistry = { ...trust, runtimeCodeHash: keccak256("0x01") };
  await rejects(prepareUserPublication(unpublished2, wallet, CHAIN_ID, wrongRegistry, chain({ agentId: "2", wallet, latest: 0 })), "wrong_registry");
});

test("self-service: confirmation requires the exact reviewed transaction and an independent Registry read-back", async () => {
  const p = unpublished2.payload, wallet = p.subject.agentWallet, digest = `0x${unpublished2.integrity.digest}`;
  const input = registryAbi.encodeFunctionData("publishPassport", ["2", digest, "", 1]);
  const ok = await confirmUserPublication(unpublished2, txHash, trust, chain({ agentId: "2", wallet, latest: 1, publishedHash: digest, input, receipt: "ok" }));
  assert.equal(ok.state, "confirmed");
  assert.equal((await confirmUserPublication(unpublished2, txHash, trust, chain({ agentId: "2", wallet, latest: 0, receipt: "pending" }))).state, "pending");
  assert.equal((await confirmUserPublication(unpublished2, txHash, trust, chain({ agentId: "2", wallet, latest: 0, receipt: "reverted" }))).state, "reverted");
  await rejects(confirmUserPublication(unpublished2, txHash, trust, chain({ agentId: "2", wallet, latest: 1, publishedHash: digest, input: "0x", receipt: "ok" })), "unexpected_receipt");
  const mismatch = await confirmUserPublication(unpublished2, txHash, trust, chain({ agentId: "2", wallet, latest: 1, publishedHash: `0x${"ff".repeat(32)}`, input, receipt: "ok" }));
  assert.equal(mismatch.state, "unverified");
  await rejects(confirmUserPublication(unpublished2, "0x12", trust, chain({ agentId: "2", wallet, latest: 0 })), "invalid_transaction_hash");
});

test("self-service: generation never fabricates evidence and only serves the designated wallet", async () => {
  const wallet = `0x${"ab".repeat(20)}`;
  const uri = `data:application/json;base64,${Buffer.from(JSON.stringify({ type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1", name: "Test agent" })).toString("base64")}`;
  const rpc = chain({ agentId: "77", wallet, latest: 0, uri });
  const failing: HyperSyncProvider = { transport: "json", getHeight: async () => { throw Error("down"); }, get: async () => { throw Error("down"); } };
  const halfway: HyperSyncProvider = { transport: "json", getHeight: async () => 20000, get: async () => { throw Error("Envio HTTP 500"); } };
  const base = { agentId: "77", rpc, trust, registrationBlock: async () => 100, now: () => new Date("2026-10-13T18:00:00Z") };
  await rejects(generateNextPassport({ ...base, address: wallet, provider: failing }), "evidence_unavailable");
  await rejects(generateNextPassport({ ...base, address: wallet, provider: halfway }), "evidence_unavailable");
  await rejects(generateNextPassport({ ...base, address: `0x${"cd".repeat(20)}`, provider: failing }), "wrong_wallet");
  const empty: HyperSyncProvider = { transport: "json", getHeight: async () => 20000, get: async q => ({ raw: {}, page: { blocks: [], transactions: [], nextBlock: q.toBlock, archiveHeight: 20000 } }) };
  try {
    const g = await generateNextPassport({ ...base, address: wallet, provider: empty });
    assert.equal(g.version, 1); assert.equal(g.bundle.payload.generation.passportVersion, 1);
    assert.equal(g.bundle.payload.generation.previousVersionHash, undefined); assert.equal(g.scope.basis, "since_registration");
  } catch (e) { assert.ok(e instanceof WebFlowError && e.code === "evidence_unavailable", "Only an explicit unavailable-evidence error is acceptable"); }
  const state = await publicationState("77", chain({ agentId: "77", wallet, latest: 3, latestHash: `0x${"dd".repeat(32)}` }), trust);
  assert.equal(state.latest, 3n); assert.equal(state.previousHash, `0x${"dd".repeat(32)}`);
});

test("self-service: browser code imports no server providers, writer, signer or secrets", () => {
  const seen = new Set<string>();
  function resolve(from: string, spec: string) {
    const base = path.resolve(path.dirname(from), spec.replace(/\.js$/, ""));
    for (const candidate of [base + ".ts", base + ".tsx", path.join(base, "index.ts")]) if (existsSync(candidate)) return candidate;
    throw Error(`Unresolved ${spec} from ${from}`);
  }
  function visit(file: string) {
    if (seen.has(file)) return; seen.add(file);
    const source = readFileSync(file, "utf8").replace(/import type[\s\S]*?;/g, "");
    assert.doesNotMatch(source, /DEPLOYER_PRIVATE_KEY|ENVIO_API_TOKEN|ALCHEMY_MONAD_TESTNET_RPC_URL|alchemy\.com\/v2/);
    for (const m of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      if (!m[1].startsWith(".")) continue; const target = resolve(file, m[1]);
      assert.doesNotMatch(target, /packages[\\/](activity|passport|publication|identity)[\\/]|lib[\\/](server|self-server|policy-server)|self-service\.ts$/, `${file} imports ${target}`);
      visit(target);
    }
  }
  for (const entry of ["apps/web/app/self-service-app.tsx", "apps/web/app/verify/verify-app.tsx", "apps/web/app/wallet-app.tsx"]) visit(path.resolve(entry));
  for (const route of ["agents/[id]", "verify", "self/generate", "self/prepare", "self/confirm"]) {
    const source = readFileSync(`apps/web/app/api/${route}/route.ts`, "utf8");
    assert.doesNotMatch(source, /writer|DEPLOYER_PRIVATE_KEY|sendTransaction|eth_sendRawTransaction/);
  }
  assert.doesNotMatch(readFileSync("apps/web/lib/self-server.ts", "utf8"), /eth_send|DEPLOYER_PRIVATE_KEY|writer/);
});
