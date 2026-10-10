import "server-only";
import published from "../../../fixtures/real/monad-m5/agent-2072-passport-v2.json";
import historical from "../../../fixtures/real/monad-m3/agent-2-passport-v2.json";
import deployment from "../../../fixtures/real/monad-m4/deployment.json";
import { alchemyRpc } from "../../../packages/publication/src/rpc";
import type { RegistryTrust } from "../../../packages/publication/src/verify";
import { verifyCandidate, evaluatePolicy, compareCandidates } from "../../../packages/policy/src/index";
import type { VerifiedCandidate } from "../../../packages/policy/src/index";
import { evaluationRequestSchema, RequestError } from "../../../packages/policy/src/http";
import { canonicalJsonStringify } from "../../../packages/verification/src/canonical";
export const exampleCandidates = [
  { candidateId: "agent-2072", passport: published },
  { candidateId: "agent-2", passport: historical }
];
const demoArtifacts = new Map(exampleCandidates.map(c => [c.candidateId, canonicalJsonStringify(c.passport)]));
let demoCache: { expires: number; contexts: Map<string, VerifiedCandidate> } | undefined;
let demoPending: Promise<Map<string, VerifiedCandidate>> | undefined;
function boundedRpc() {
  // Fixed operator trust, never request-supplied URLs or assertions. Only these reads are allowed.
  const base = (() => { try { return alchemyRpc(); } catch { return async () => { throw Error("RPC unavailable"); }; } })();
  const deadline = Date.now() + 20_000;
  let calls = 0;
  const rpc: typeof base = async (method, params) => {
    if (!["eth_chainId", "eth_getBlockByNumber", "eth_getCode", "eth_call"].includes(method)) throw Error("Read-only verifier");
    if (++calls > 80 || Date.now() >= deadline) throw Error("Verification budget exhausted");
    return base(method, params);
  };
  return rpc;
}
async function fixedDemoContexts() {
  if (demoCache && demoCache.expires > Date.now()) return demoCache.contexts;
  if (!demoPending) demoPending = (async () => {
    const rpc = boundedRpc(); const contexts = new Map<string, VerifiedCandidate>();
    for (const c of exampleCandidates) contexts.set(c.candidateId, await verifyCandidate(c.candidateId, c.passport,
      { trust: deployment.trust as RegistryTrust, rpc }));
    demoCache = { contexts, expires: Date.now() + 60_000 };
    return contexts;
  })().finally(() => { demoPending = undefined; });
  return demoPending;
}
export async function runPublicDemoEvaluation(input: unknown) {
  const body = evaluationRequestSchema.parse(input);
  if (body.candidates.length > 2 || body.candidates.some(c => demoArtifacts.get(c.candidateId) !== canonicalJsonStringify(c.passport)))
    throw new RequestError(422, "Public comparison accepts only the two displayed, unchanged demo Passports. Use the local consumer library for other agents.");
  const contexts = await fixedDemoContexts();
  const results = body.candidates.map(c => evaluatePolicy(contexts.get(c.candidateId)!, body.policy));
  return results.length === 1 ? { policy: body.policy, candidates: results, eligibleCandidateIds: results.filter(r => r.outcome === "SATISFIED").map(r => r.candidateId) }
    : compareCandidates(results);
}
export async function runEvaluation(input: unknown) {
  const body = evaluationRequestSchema.parse(input);
  const rpc = boundedRpc();
  const results = [];
  for (const c of body.candidates) results.push(evaluatePolicy(await verifyCandidate(c.candidateId, c.passport,
    { trust: deployment.trust as RegistryTrust, rpc }), body.policy));
  return results.length === 1 ? { policy: body.policy, candidates: results, eligibleCandidateIds: results.filter(r => r.outcome === "SATISFIED").map(r => r.candidateId) }
    : compareCandidates(results);
}
