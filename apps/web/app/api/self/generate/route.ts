import { designatedWallet, generateNextPassport, verifyChallenge } from "../../../../../../packages/web/src/self-service";
import { WebFlowError } from "../../../../../../packages/web/src/publication";
import { guardAgent, guardGeneration } from "../../../../../../packages/web/src/limits";
import { boundedRpc, envio, errorResponse, gate, ok, originOf, readJson, sharedStore, trust } from "../../../../lib/self-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
// Expensive: Envio queries plus identity/Registry reads. Requires a fresh wallet-control signature.
const limit = gate(6, 1);
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    release = limit();
    const input = await readJson(request, 4096);
    const store = sharedStore();
    const challenge = verifyChallenge({ message: input.message, signature: input.signature }, originOf(request));
    const { agentId, address } = challenge;
    // Atomic, cross-instance: single-use nonce, per-wallet cooldown, global generation budget.
    await guardGeneration(store, challenge);
    // Authorize before reserving the agent, so another wallet cannot lock an agent it does not control.
    if (await designatedWallet(agentId, boundedRpc("read", 4)) !== address) throw new WebFlowError("wrong_wallet");
    await guardAgent(store, agentId);
    const { provider, registrationBlock } = await envio();
    const result = await generateNextPassport({ agentId, address, rpc: boundedRpc("read", 80), provider, trust, registrationBlock });
    return ok(result);
  } catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
