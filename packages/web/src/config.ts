// Public, pinned deployment configuration. Never include credential-bearing RPCs here.
export const CHAIN_ID = 10143;
export const AGENT_ID = "2072";
export const REGISTRY = "0x7d9cc86196241485cf1efaf8a96c7819ea95b194" as const;
export const V1_HASH = "0x6fdcb7be70fc8717cdb75937606f26ce6b02268ea4f3fd3ebaf0392c006c874a";
export const V1_TRANSACTION = "0x77d5fb75278c92ff6f5a0900e06ea9f297099dddae6dd9bfad926490720a5f38";
export const EXPLORER = "https://testnet.monadscan.com";
export const PUBLIC_RPC = "https://testnet-rpc.monad.xyz";
export const dynamicNetwork = {
  chainId: CHAIN_ID, networkId: CHAIN_ID, name: "Monad Testnet", vanityName: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: [PUBLIC_RPC], blockExplorerUrls: [EXPLORER], iconUrls: [] as string[]
};
export const monadChain = {
  id: CHAIN_ID, name: "Monad Testnet", nativeCurrency: dynamicNetwork.nativeCurrency,
  rpcUrls: { default: { http: [PUBLIC_RPC] } },
  blockExplorers: { default: { name: "Monadscan", url: EXPLORER } }, testnet: true
} as const;
