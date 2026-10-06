import { identityConfig } from "../packages/identity/src/config.js";
import { resolveAgent, IdentityResolutionError } from "../packages/identity/src/resolver.js";

// Read-only developer tool. No .env loading, wallet/signing or transaction methods.
const [network = "monad-testnet", agentId = "1"] = process.argv.slice(2);
try {
  const result = await resolveAgent(agentId, identityConfig(network, process.env.MONAD_IDENTITY_RPC_URL));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    code: error instanceof IdentityResolutionError ? error.code : "configuration_error",
    message: error instanceof IdentityResolutionError ? error.message : "Check network/RPC configuration"
  }));
  process.exitCode = 1;
}
