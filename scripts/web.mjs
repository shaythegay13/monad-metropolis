import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
let local = {};
try { local = parseEnv(readFileSync(new URL("../.env.local", import.meta.url), "utf8")); } catch {}
const env = { ...process.env };
// The web process needs no private signing key, even on the server.
delete env.DEPLOYER_PRIVATE_KEY;
for (const key of ["NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID", "ENVIO_API_TOKEN", "ALCHEMY_MONAD_TESTNET_RPC_URL"])
  if (!env[key] && local[key]) env[key] = local[key];
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "")) {
  console.error("NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is missing or invalid."); process.exit(1);
}
const [command = "dev", ...args] = process.argv.slice(2);
if (!["dev", "build", "start"].includes(command)) process.exit(1);
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", command, "apps/web",
  ...(["dev", "build"].includes(command) ? ["--webpack"] : []), ...args], { cwd: root, env, stdio: "inherit", windowsHide: true });
child.on("exit", code => process.exit(code ?? 1));
