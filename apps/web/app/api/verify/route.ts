import { z } from "zod";
import { consumerPolicySchema } from "../../../../../packages/policy/src/index";
import { RequestError } from "../../../../../packages/policy/src/http";
import { verifySubmitted, MAX_PASSPORT_BYTES } from "../../../../../packages/web/src/self-service";
import { boundedRpc, errorResponse, gate, ok, readJson, trust } from "../../../lib/self-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const limit = gate(20, 3);
const body = z.object({ policy: consumerPolicySchema,
  candidates: z.array(z.object({ candidateId: z.string().regex(/^[a-zA-Z0-9:_-]{1,80}$/), passport: z.unknown() }).strict()).min(1).max(2)
}).strict();
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    release = limit();
    const parsed = body.safeParse(await readJson(request, 2 * MAX_PASSPORT_BYTES + 16_384));
    if (!parsed.success) throw new RequestError(422, "Send a supported policy and one or two Passport files.");
    if (new Set(parsed.data.candidates.map(c => c.candidateId)).size !== parsed.data.candidates.length) throw new RequestError(422, "Duplicate candidate identifiers.");
    return ok({ results: await verifySubmitted(parsed.data.candidates, parsed.data.policy, trust, boundedRpc("read", 150)) });
  } catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
