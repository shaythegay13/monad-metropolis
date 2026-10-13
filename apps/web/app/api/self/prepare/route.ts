import { prepareUserPublication, MAX_PASSPORT_BYTES } from "../../../../../../packages/web/src/self-service";
import { boundedRpc, errorResponse, gate, ok, readJson, trust } from "../../../../lib/self-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
// Builds an unsigned transaction for the user's own wallet. The server never signs or broadcasts.
const limit = gate(20, 3);
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    release = limit();
    const input = await readJson(request, MAX_PASSPORT_BYTES + 4096);
    return ok(await prepareUserPublication(input.passport, input.address, input.chain, trust, boundedRpc("publication", 40)));
  } catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
