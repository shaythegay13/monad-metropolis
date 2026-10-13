import { prepareUserPublication, MAX_PASSPORT_BYTES } from "../../../../../../packages/web/src/self-service";
import { guardPrepare } from "../../../../../../packages/web/src/limits";
import { boundedRpc, errorResponse, gate, ok, readJson, sharedStore, trust } from "../../../../lib/self-server";
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
    // Fails closed if the shared store is unavailable; the per-wallet budget is enforced across instances.
    if (typeof input.address === "string") await guardPrepare(sharedStore(), input.address);
    return ok(await prepareUserPublication(input.passport, input.address, input.chain, trust, boundedRpc("publication", 40)));
  } catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
