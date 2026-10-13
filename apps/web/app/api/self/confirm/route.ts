import { confirmUserPublication, MAX_PASSPORT_BYTES } from "../../../../../../packages/web/src/self-service";
import { boundedRpc, errorResponse, gate, ok, readJson, trust } from "../../../../lib/self-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const limit = gate(40, 4);
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    release = limit();
    const input = await readJson(request, MAX_PASSPORT_BYTES + 4096);
    return ok(await confirmUserPublication(input.passport, input.hash, trust, boundedRpc("publication", 40)));
  } catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
