import { CHAIN_ID } from "./config.js";
export type Authorization = "disconnected" | "not_evm" | "wrong_network" | "identity_unavailable" | "wrong_wallet" | "authorized";
export function walletAuthorization(address: string | undefined, isEvm: boolean, chain: number | undefined,
  agentWallet: string | undefined): Authorization {
  if (!address) return "disconnected";
  if (!isEvm) return "not_evm";
  if (chain !== CHAIN_ID) return "wrong_network";
  if (!agentWallet || !/^0x[0-9a-f]{40}$/i.test(agentWallet) || /^0x0{40}$/i.test(agentWallet)) return "identity_unavailable";
  if (address.toLowerCase() !== agentWallet.toLowerCase()) return "wrong_wallet";
  return "authorized";
}
export const authorizationText: Record<Authorization, string> = {
  disconnected: "Connect MetaMask through Dynamic to prepare a publication.",
  not_evm: "An EVM wallet is required.",
  wrong_network: "Switch your connected wallet to Monad Testnet (10143).",
  identity_unavailable: "Current registry-designated wallet is unavailable. Publication is disabled.",
  wrong_wallet: "This account is not the current ERC-8004 agentWallet. Publication is disabled; ownership is not a fallback.",
  authorized: "Connected account matches the current registry-designated agentWallet."
};
export function walletError(error: unknown): string {
  const e = error as { code?: unknown; message?: unknown; cause?: unknown } | null;
  if (e?.code === 4001 || e?.code === "ACTION_REJECTED" || /reject|denied/i.test(String(e?.message))) return "Wallet request rejected. Nothing was confirmed.";
  if (/insufficient/i.test(String(e?.message))) return "Insufficient MON to cover the transaction fee.";
  if (/disconnect/i.test(String(e?.message)) || e?.code === 4900) return "Wallet disconnected. Reconnect before signing; check any existing transaction first.";
  if (e?.cause && e.cause !== error) return walletError(e.cause);
  return "Wallet request failed. Check the wallet and network; no publication is confirmed.";
}
