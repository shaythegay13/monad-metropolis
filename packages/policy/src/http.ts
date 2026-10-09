import { z } from "zod";
import { consumerPolicySchema } from "./schema.js";
export const evaluationRequestSchema = z.object({
  policy: consumerPolicySchema,
  candidates: z.array(z.object({ candidateId: z.string().regex(/^[a-zA-Z0-9:_-]{1,160}$/), passport: z.unknown() }).strict()).min(1).max(10)
}).strict().superRefine((v, ctx) => {
  if (new Set(v.candidates.map(c => c.candidateId)).size !== v.candidates.length)
    ctx.addIssue({ code: "custom", message: "Duplicate candidate identifiers" });
});
export class RequestError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function readEvaluationRequest(request: Request) {
  let sameOrigin = false;
  try { const origin = new URL(request.headers.get("origin") ?? "");
    sameOrigin = ["http:", "https:"].includes(origin.protocol) && origin.host === request.headers.get("host"); } catch {}
  if (!sameOrigin) throw new RequestError(403, "Same-origin requests required. External consumers can use the library locally.");
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new RequestError(415, "JSON required.");
  if (Number(request.headers.get("content-length")) > 2_000_000) throw new RequestError(413, "Body exceeds 2 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "JSON body required.");
  let size = 0; const chunks: Uint8Array[] = [];
  const deadline = setTimeout(() => { void reader.cancel().catch(() => {}); }, 5000);
  try {
    while (true) { const item = await reader.read(); if (item.done) break;
      size += item.value.length;
      if (size > 2_000_000) { await reader.cancel(); throw new RequestError(413, "Body exceeds 2 MB."); }
      chunks.push(item.value);
    }
    const result = evaluationRequestSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!result.success) throw new RequestError(422, "Invalid policy or candidates; use supported criteria and 1 to 10 unique identifiers.");
    return result.data;
  } catch (error) { if (error instanceof RequestError) throw error; throw new RequestError(400, "Invalid or incomplete JSON."); }
  finally { clearTimeout(deadline); reader.releaseLock(); }
}
// Bounded per-process protection, not a distributed deployment rate limiter.
export function createEvaluationGate(now = Date.now) {
  let start = now(), requests = 0, active = 0;
  return () => {
    if (now() - start >= 60_000) { start = now(); requests = 0; }
    if (requests >= 20 || active >= 2) throw new RequestError(429, "Evaluation limit reached. Try again shortly.");
    requests++; active++; let released = false;
    return () => { if (!released) { active--; released = true; } };
  };
}
