import { canonicalJsonStringify as canonicalize } from "../../verification/src/canonical.js";
import { isEvaluation, type Evaluation } from "./evaluate.js";
export function compareCandidates(input: readonly Evaluation[]) {
  if (input.length < 2 || input.length > 10) throw Error("Compare 2 to 10 candidates");
  if (input.some(c => !isEvaluation(c))) throw Error("Only independently evaluated candidates are accepted");
  if (new Set(input.map(c => c.candidateId)).size !== input.length) throw Error("Duplicate candidate identifiers");
  const subjects = input.filter(c => c.scope && c.agentId).map(c => `${c.scope!.chainId}:${c.agentId}`);
  if (new Set(subjects).size !== subjects.length) throw Error("Different versions of one agent are not distinct agents");
  if (input.some(c => canonicalize(c.policy) !== canonicalize(input[0].policy))) throw Error("Candidates must use the same policy");
  const candidates = [...input].sort((a, b) => a.candidateId < b.candidateId ? -1 : a.candidateId > b.candidateId ? 1 : 0);
  return { policy: candidates[0].policy, candidates,
    eligibleCandidateIds: candidates.filter(c => c.outcome === "SATISFIED").map(c => c.candidateId),
    methodology: "Eligibility only. All satisfying candidates are equally eligible; identifier ordering is not a ranking. Scopes and evidence dates can differ." };
}
