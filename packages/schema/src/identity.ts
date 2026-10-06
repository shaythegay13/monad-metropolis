import { z } from "zod";

export const UINT256_MAX = (1n << 256n) - 1n;
export const agentIdSchema = z.string().regex(/^(0|[1-9][0-9]{0,77})$/)
  .refine((id) => /^(0|[1-9][0-9]{0,77})$/.test(id) && BigInt(id) <= UINT256_MAX, "Agent ID exceeds uint256");
export const identityAddressSchema = z.string().regex(/^0x[0-9a-f]{40}$/);

// Advertisements only: neither service availability nor capabilities are verified.
export const registrationFileSchema = z.object({
  type: z.literal("https://eips.ethereum.org/EIPS/eip-8004#registration-v1"),
  name: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  services: z.array(z.object({ name: z.string(), endpoint: z.string() }).passthrough()).optional(),
  registrations: z.array(z.object({
    agentId: z.union([agentIdSchema, z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)]),
    agentRegistry: z.string()
  }).passthrough()).optional(),
  supportedTrust: z.array(z.string()).optional()
}).passthrough();

export const registrationResultSchema = z.object({
  status: z.enum(["retrieved", "missing_uri", "unsupported_uri", "blocked_uri", "unreachable", "malformed", "too_large"]),
  sourceUri: z.string(),
  retrievalUrl: z.string().optional(),
  source: z.enum(["https", "ipfs_gateway", "data"]).optional(),
  document: registrationFileSchema.optional(),
  warnings: z.array(z.string())
});

// Separate domain object. This does NOT change the v1 Passport payload or digest.
export const agentIdentitySchema = z.object({
  subjectType: z.literal("erc8004_agent"),
  agentId: agentIdSchema,
  agentRegistry: z.string(),
  network: z.enum(["monad-testnet", "monad-mainnet"]),
  chainId: z.number().int().positive(),
  registryAddress: identityAddressSchema,
  ownerAddress: identityAddressSchema,
  agentWallet: identityAddressSchema.optional(),
  agentWalletStatus: z.enum(["set", "unset"]),
  agentUri: z.string(),
  registration: registrationResultSchema,
  resolution: z.object({
    blockNumber: z.string().regex(/^[0-9]+$/),
    blockHash: z.string().regex(/^0x[0-9a-f]{64}$/),
    registryCodeHash: z.string().regex(/^0x[0-9a-f]{64}$/),
    resolvedAt: z.string().datetime()
  })
}).superRefine((value, ctx) => {
  if (value.agentRegistry !== `eip155:${value.chainId}:${value.registryAddress}`)
    ctx.addIssue({ code: "custom", message: "agentRegistry does not match chain/address" });
  if ((value.agentWalletStatus === "set") !== Boolean(value.agentWallet))
    ctx.addIssue({ code: "custom", message: "Wallet status and value disagree" });
  if (value.agentWallet === "0x" + "0".repeat(40) || value.ownerAddress === "0x" + "0".repeat(40))
    ctx.addIssue({ code: "custom", message: "Zero address cannot be an owner or set wallet" });
});

export type AgentIdentity = z.infer<typeof agentIdentitySchema>;
export type RegistrationResult = z.infer<typeof registrationResultSchema>;
