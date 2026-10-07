import { writeFile } from "node:fs/promises";
import { resolveAgent, IdentityResolutionError } from "../packages/identity/src/resolver.js";
import { identityConfig } from "../packages/identity/src/config.js";
import { ActivityError, createEnvioProvider, retrieveAgentActivity, subjectWallet } from "../packages/activity/src/index.js";
import { requireToken } from "../packages/activity/src/envio.js";

async function main() {
  const [network, agentId, start, end, transport, output] = process.argv.slice(2);
  if (network !== "monad-testnet" || !agentId || !/^\d+$/.test(start ?? "") || !/^\d+$/.test(end ?? "") ||
    (transport !== "native" && transport !== "json"))
    throw new ActivityError("invalid_config", "Usage: verify-envio-agent-activity monad-testnet <agentId> <fromBlock> <toBlock-exclusive> <native|json> [new-output.json]");
  const token = requireToken(process.env.ENVIO_API_TOKEN);
  const identity = await resolveAgent(agentId, identityConfig(network, process.env.MONAD_IDENTITY_RPC_URL));
  subjectWallet(identity); // Reject unset before instantiating the provider; never substitute owner.
  const provider = await createEnvioProvider(token, transport);
  const result = await retrieveAgentActivity(identity, provider, { fromBlock: Number(start), toBlock: Number(end) });
  const artifact = { fixtureKind: "real captured provider fixture", identity, ...result };
  const serialized = JSON.stringify(artifact, (_, v) => typeof v === "bigint" ? v.toString() : v, 2) + "\n";
  if (serialized.includes(token)) throw new ActivityError("provider_error", "Refusing artifact containing credential material");
  if (output) await writeFile(output, serialized, { encoding: "utf8", flag: "wx" });
  console.log(JSON.stringify({ state: result.state, error: result.error, provenance: result.provenance,
    sample: result.evidence.slice(0, 5) }, null, 2));
  if (result.state === "error" || result.provenance.coverageStatus !== "complete_for_query") process.exitCode = 1;
}
main().catch(e => {
  // No arbitrary exception, response body, environment value or configured URL is printed.
  console.error(JSON.stringify(e instanceof ActivityError || e instanceof IdentityResolutionError ?
    { code: e.code, message: e.message } : { code: "verification_failed", message: "Verification or artifact write failed" }));
  process.exitCode = 1;
});
