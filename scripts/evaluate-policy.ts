import { readFileSync } from "node:fs";
import { verifyCandidate, evaluatePolicy, compareCandidates, consumerPolicySchema } from "../packages/policy/src/index.js";
import { alchemyRpc } from "../packages/publication/src/rpc.js";
import type { RegistryTrust } from "../packages/publication/src/verify.js";

// Read-only developer entrypoint: no generator, Envio, signer or publication action.
async function main() {
  const [requestPath, trustPath] = process.argv.slice(2);
  if (!requestPath) throw Error();
  const request = JSON.parse(readFileSync(requestPath, "utf8"));
  const policy = consumerPolicySchema.parse(request.policy);
  if (!Array.isArray(request.candidates) || request.candidates.length < 1 || request.candidates.length > 10) throw Error();
  const chain = trustPath ? { trust: JSON.parse(readFileSync(trustPath, "utf8")).trust as RegistryTrust, rpc: alchemyRpc() } : undefined;
  const results = [];
  for (const candidate of request.candidates) results.push(evaluatePolicy(await verifyCandidate(candidate.candidateId, candidate.passport, chain), policy));
  console.log(JSON.stringify(results.length === 1 ? results[0] : compareCandidates(results), null, 2));
}
main().catch(() => { console.error("Policy evaluation failed. Check the request schema and trusted deployment/RPC configuration; no transaction was sent."); process.exitCode = 1; });
