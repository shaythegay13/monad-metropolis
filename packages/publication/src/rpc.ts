import { createRpc, type Rpc } from "../../identity/src/resolver.js";
export class PublicationError extends Error {
  constructor(public code: string) { super(code); }
}
export function alchemyUrl(env: NodeJS.ProcessEnv = process.env): string {
  try {
    const value = env.ALCHEMY_MONAD_TESTNET_RPC_URL?.trim();
    if (!value) throw Error();
    const u = new URL(value);
    if (u.protocol !== "https:" || u.hostname !== "monad-testnet.g.alchemy.com" ||
      u.port || u.username || u.password || u.search || u.hash || !/^\/v2\/[A-Za-z0-9_-]+$/.test(u.pathname)) throw Error();
    return value;
  } catch { throw new PublicationError("invalid_alchemy_monad_testnet_configuration"); }
}
export function alchemyRpc(env: NodeJS.ProcessEnv = process.env): Rpc {
  const rpc = createRpc(alchemyUrl(env));
  return async (method, params) => { try { return await rpc(method, params); }
    catch { throw new PublicationError("alchemy_rpc_request_failed"); } };
}
export function hex(value: unknown): string {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) throw new PublicationError("invalid_rpc_hex");
  return value;
}
export async function assertTestnet(rpc: Rpc): Promise<void> {
  if (BigInt(hex(await rpc("eth_chainId", []))) !== 10143n) throw new PublicationError("wrong_chain_no_transaction_sent");
}
