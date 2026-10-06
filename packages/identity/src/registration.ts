import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";
import { registrationFileSchema, type RegistrationResult } from "../../schema/src/identity.js";

export const MAX_REGISTRATION_BYTES = 256 * 1024;
const TIMEOUT_MS = 10_000;
export class RegistrationError extends Error {
  constructor(public status: "blocked_uri" | "unreachable" | "too_large", message: string) { super(message); }
}
// Conservative IPv4-only public transport. IPv6-only hosts are deliberately deferred.
export function isPublicIpv4(address: string): boolean {
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) ||
    (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0));
}
export function validateRegistrationUrl(url: URL): void {
  if (url.protocol !== "https:" || url.username || url.password ||
    (url.port && url.port !== "443") || url.hash ||
    url.hostname === "localhost" || url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".local") || url.hostname.endsWith(".internal") ||
    url.hostname.includes(":") || (isIP(url.hostname) && !isPublicIpv4(url.hostname))) {
    throw new RegistrationError("blocked_uri", "Registration URL is not permitted");
  }
}

export type RegistrationReader = (url: URL) => Promise<Buffer>;
// DNS is checked and the chosen address pinned to the actual socket lookup. No redirects,
// credentials, cookies, secondary service fetches or compressed responses are accepted.
export const readPublicRegistration: RegistrationReader = async (url) => {
  validateRegistrationUrl(url);
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true, family: 4 }),
    new Promise<never>((_, reject) => signal.addEventListener("abort", () =>
      reject(new RegistrationError("unreachable", "Registration retrieval timed out")), { once: true }))
  ]);
  if (!addresses.length || addresses.some((a) => !isPublicIpv4(a.address)))
    throw new RegistrationError("blocked_uri", "Registration host does not resolve to permitted public addresses");
  return new Promise<Buffer>((resolve, reject) => {
    const req = request(url, {
      signal, agent: false, family: 4,
      lookup: (_host, _options, callback) => callback(null, addresses[0].address, 4),
      headers: { Accept: "application/json", "Accept-Encoding": "identity" }
    }, (res) => {
      if (res.statusCode !== 200 || (res.headers["content-encoding"] && res.headers["content-encoding"] !== "identity")) {
        res.destroy(); reject(new RegistrationError("unreachable", `Registration HTTP ${res.statusCode}; redirects/compression not followed`)); return;
      }
      let size = 0; const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_REGISTRATION_BYTES) {
          res.destroy(); reject(new RegistrationError("too_large", "Registration exceeds byte limit"));
        } else chunks.push(chunk);
      });
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", () => reject(new RegistrationError("unreachable", "Registration response interrupted")));
    });
    req.on("error", () => reject(new RegistrationError("unreachable", "Registration transport failed or timed out")));
    req.end();
  });
};

export async function retrieveRegistration(uri: string, reader: RegistrationReader = readPublicRegistration): Promise<RegistrationResult> {
  const result: RegistrationResult = { sourceUri: uri, status: "missing_uri", warnings: [] };
  if (!uri) return result;
  try {
    let bytes: Buffer;
    if (uri.startsWith("data:")) {
      result.source = "data";
      if (uri.length > MAX_REGISTRATION_BYTES * 4) throw new RegistrationError("too_large", "Data URI exceeds limit");
      const match = /^data:application\/json(?:;charset=utf-8)?(;base64)?,(.*)$/is.exec(uri);
      if (!match) { result.status = "unsupported_uri"; return result; }
      if (match[1]) {
        if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(match[2])) throw new Error("Invalid base64");
        bytes = Buffer.from(match[2], "base64");
      } else bytes = Buffer.from(decodeURIComponent(match[2]), "utf8");
    } else {
      let url: URL;
      if (uri.startsWith("ipfs://")) {
        const path = uri.slice(7);
        if (!/^[A-Za-z0-9]+(?:\/[A-Za-z0-9._~-]+)*$/.test(path) || path.split("/").some((p) => p === "." || p === ".."))
          throw new Error("Malformed IPFS URI");
        url = new URL(`https://ipfs.io/ipfs/${path}`); result.source = "ipfs_gateway";
      } else {
        url = new URL(uri);
        if (url.protocol !== "https:") { result.status = "unsupported_uri"; return result; }
        result.source = "https";
      }
      validateRegistrationUrl(url);
      result.retrievalUrl = url.href;
      try { bytes = await reader(url); }
      catch (e) { throw e instanceof RegistrationError ? e : new RegistrationError("unreachable", "Registration retrieval failed"); }
    }
    if (bytes.length > MAX_REGISTRATION_BYTES) throw new RegistrationError("too_large", "Registration exceeds byte limit");
    const raw: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    const parsed = registrationFileSchema.safeParse(raw);
    if (!parsed.success) throw new Error("Invalid registration structure");
    result.status = "retrieved"; result.document = parsed.data;
    result.warnings.push("Registration fields and services are advertisements, not verified capabilities or wallet associations.");
    for (const key of ["name", "description", "image"] as const)
      if (!parsed.data[key]) result.warnings.push(`Registration ${key} is missing.`);
    if (!parsed.data.registrations?.length) result.warnings.push("Registration has no self-registration entries.");
    if (result.source === "ipfs_gateway") result.warnings.push("IPFS gateway content was retrieved; CID content verification is not implemented.");
  } catch (e) {
    result.status = e instanceof RegistrationError ? e.status : "malformed";
    result.warnings.push(e instanceof RegistrationError ? e.message : "Registration URI or JSON is malformed.");
  }
  return result;
}
