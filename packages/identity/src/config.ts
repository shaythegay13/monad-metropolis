export const NETWORKS = {
  "monad-testnet": {
    chainId: 10143, rpcUrl: "https://testnet-rpc.monad.xyz",
    registryAddress: "0x8004a818bfb912233c491871b3d84c89a494bd9e"
  },
  "monad-mainnet": {
    chainId: 143, rpcUrl: "https://rpc.monad.xyz",
    registryAddress: "0x8004a169fb4a3325136eb29fa0ceb6d2e539a432"
  }
} as const;
// Source/revision and live bytecode proof: docs/verification/MONAD-M1.md.
export type NetworkName = keyof typeof NETWORKS;
export type IdentityConfig = {
  network: NetworkName; chainId: number; registryAddress: string; rpcUrl: string;
};
export function identityConfig(network: string = "monad-testnet", rpcUrl?: string): IdentityConfig {
  if (!Object.hasOwn(NETWORKS, network)) throw new Error("Unsupported Monad network");
  const selected = NETWORKS[network as NetworkName];
  const url = new URL(rpcUrl ?? selected.rpcUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.hash)
    throw new Error("RPC configuration requires HTTPS without userinfo or fragment");
  return { network: network as NetworkName, ...selected, rpcUrl: url.href };
}
