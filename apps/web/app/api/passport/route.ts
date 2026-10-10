import { NextRequest, NextResponse } from "next/server";
import { readState, v1, prepare, preflight, confirm, safeError } from "../../../lib/server";
import { isPublicReadOnly } from "../../../../../packages/web/src/deployment";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.has("download")) return NextResponse.json(v1, { headers: {
    ...headers, "Content-Disposition": 'attachment; filename="agent-2072-passport-v1.json"' } });
  try { return NextResponse.json(await readState(), { headers }); }
  catch (error) { return NextResponse.json({ ...safeError(error), bundle: v1, publicReadOnly: isPublicReadOnly() }, { status: 503, headers }); }
}
export async function POST(request: NextRequest) {
  if (isPublicReadOnly()) return NextResponse.json({ error: "Public deployment is read-only. Publication controls are unavailable." }, { status: 403, headers });
  // No generic RPC proxy, signer or arbitrary agent/contract target is exposed.
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    // Next's internal URL may use localhost for a request to 127.0.0.1.
    // Browsers cannot override Host; compare the actual incoming host instead.
    sameOrigin = ["http:", "https:"].includes(origin.protocol) && origin.host === request.headers.get("host");
  } catch { /* Missing or malformed origins fail closed. */ }
  if (!sameOrigin || !request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json({ error: "Same-origin JSON requests are required." }, { status: 403, headers });
  try {
    const reader = request.body?.getReader();
    if (!reader) throw Error();
    const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const next = await reader.read(); if (next.done) break;
      size += next.value.length; if (size > 2_000_000) { await reader.cancel(); throw Error(); } chunks.push(next.value);
    } } finally { reader.releaseLock(); }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (body.action === "confirm" && typeof body.hash === "string")
      return NextResponse.json(await confirm(body.bundle, body.hash), { headers });
    if (typeof body.address !== "string" || !/^0x[0-9a-f]{40}$/i.test(body.address) || !Number.isInteger(body.chain)) throw Error();
    if (body.action === "prepare") return NextResponse.json(await prepare(body.address, body.chain), { headers });
    if (body.action === "preflight") return NextResponse.json(await preflight(body.bundle, body.address, body.chain), { headers });
    throw Error();
  } catch (error) { return NextResponse.json(safeError(error), { status: 422, headers }); }
}
