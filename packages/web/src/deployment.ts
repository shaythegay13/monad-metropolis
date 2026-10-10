// Vercel deployments are public, read-only demonstrations. A local operator may
// also opt into this mode; no environment switch can enable writes on Vercel.
export function isPublicReadOnly(env: Record<string, string | undefined> = process.env) {
  return env.VERCEL === "1" || env.SIGNAL_PASSPORT_PUBLIC_READ_ONLY === "1";
}
