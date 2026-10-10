// Read-only consumer example. Run after `npm run build`; no Envio or deployer key.
import { createHash } from "node:crypto";
import { verifyCandidate, evaluatePolicy, compareCandidates } from "../../dist/packages/policy/src/index.js";

const site = new URL(process.argv[2] ?? "http://127.0.0.1:3051/");
const rpcUrl = process.argv[3] ?? "https://testnet-rpc.monad.xyz";
// Pin this independently from the Passport. Confirm it against the accepted
// deployment record before using a different deployment or production system.
const trust = {
  chainId: 10143,
  address: "0x7d9cc86196241485cf1efaf8a96c7819ea95b194",
  identityRegistry: "0x8004a818bfb912233c491871b3d84c89a494bd9e",
  runtimeCodeHash: "0x7a3b3ea5b702aa55c5bfae2cd57cac3598877192945f0d5558792024ca7baa43"
};
const artifacts = [
  ["agent-2072", "passports/agent-2072-v2-published.json", "eca35f6a109fe98c6974eb410f0d07f74b8ac4165dd8eb3be29eb2f1b8669e6c"],
  ["agent-2", "passports/agent-2-v1-unpublished.json", "d1d8fcc35100d80c34a977b1670432fea9a3fe1706f345f438b868447787629d"]
];
let rpcId = 0;
async function rpc(method, params) {
  const response = await fetch(rpcUrl, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }), signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw Error(`RPC HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw Error(`RPC ${data.error.code}: ${data.error.message}`);
  return data.result;
}
const policy = { policyVersion: "1.0.0", minimumObservedTransactions: 2,
  minimumActiveUtcDays: 1, requireCompleteCoverage: true, requireMonadPublication: true };
const results = [];
for (const [id, path, expectedFileSha256] of artifacts) {
  const url = new URL(path, site);
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw Error(`${url} returned HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const fileSha256 = createHash("sha256").update(bytes).digest("hex");
  if (fileSha256 !== expectedFileSha256) throw Error(`${id}: hosted file bytes differ from the accepted artifact`);
  const verified = await verifyCandidate(id, JSON.parse(bytes.toString("utf8")), { trust, rpc });
  const result = evaluatePolicy(verified, policy);
  results.push(result);
  console.log(JSON.stringify({ id, url: url.href, fileSha256, integrity: result.integrity,
    chainId: trust.chainId, version: result.passportVersion, publication: result.publication.status,
    outcome: result.outcome, checks: result.checks.map(c => ({ criterion: c.criterion, outcome: c.outcome })) }));
}
const comparison = compareCandidates(results);
console.log(JSON.stringify({ eligibleCandidateIds: comparison.eligibleCandidateIds,
  methodology: comparison.methodology }));
