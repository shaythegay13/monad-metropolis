import { exampleCandidates, runEvaluation } from "../../../lib/policy-server";
import { createEvaluationGate, readEvaluationRequest, RequestError } from "../../../../../packages/policy/src/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const enter = createEvaluationGate();
export function GET() { return Response.json({ candidates: exampleCandidates }, { headers }); }
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    release = enter();
    const body = await readEvaluationRequest(request);
    return Response.json(await runEvaluation(body), { headers });
  } catch (error) {
    return Response.json({ error: error instanceof RequestError ? error.message : "Evaluation could not complete. Check distinct agent identities and retry." },
      { status: error instanceof RequestError ? error.status : 422, headers });
  } finally { release?.(); }
}
