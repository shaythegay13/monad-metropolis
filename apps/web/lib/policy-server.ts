import "server-only";
import published from "../../../fixtures/real/monad-m5/agent-2072-passport-v2.json";
import historical from "../../../fixtures/real/monad-m3/agent-2-passport-v2.json";
import deployment from "../../../fixtures/real/monad-m4/deployment.json";
import { alchemyRpc } from "../../../packages/publication/src/rpc";
import type { RegistryTrust } from "../../../packages/publication/src/verify";
import { verifyCandidate, evaluatePolicy, compareCandidates } from "../../../packages/policy/src/index";
import { evaluationRequestSchema } from "../../../packages/policy/src/http";
export const exampleCandidates = [
  { candidateId: "agent-2072", passport: published },
  { candidateId: "agent-2", passport: historical }
];
export async function runEvaluation(input: unknown) {
  const body = evaluationRequestSchema.parse(input);
  // Fixed operator trust, never request-supplied URLs or assertions. Only these reads are allowed.
  const base = (() => { try { return alchemyRpc(); } catch { return async () => { throw Error("RPC unavailable"); }; } })();
  const deadline = Date.now() + 20_000;
  let calls = 0;
  const rpc: typeof base = async (method, params) => {
    if (!["eth_chainId", "eth_getBlockByNumber", "eth_getCode", "eth_call"].includes(method)) throw Error("Read-only verifier");
    if (++calls > 80 || Date.now() >= deadline) throw Error("Verification budget exhausted");
    return base(method, params);
  };
  const results = [];
  for (const c of body.candidates) results.push(evaluatePolicy(await verifyCandidate(c.candidateId, c.passport,
    { trust: deployment.trust as RegistryTrust, rpc }), body.policy));
  return results.length === 1 ? { policy: body.policy, candidates: results, eligibleCandidateIds: results.filter(r => r.outcome === "SATISFIED").map(r => r.candidateId) }
    : compareCandidates(results);
}
