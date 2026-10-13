import { lookupAgent } from "../../../../../../packages/web/src/self-service";
import { boundedRpc, errorResponse, gate, ok, trust } from "../../../../lib/self-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const limit = gate(30, 4);
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  let release: (() => void) | undefined;
  try { release = limit(); const { id } = await context.params; return ok(await lookupAgent(id, boundedRpc("read", 60), trust)); }
  catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
