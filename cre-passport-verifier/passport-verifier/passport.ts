import { sha256, stringToBytes } from 'viem'
import { z } from 'zod'
import { canonicalJsonStringify } from './canonical'

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid address')
export const configSchema = z.object({
  schedule: z.string().regex(/^(\S+\s+){5}\S+$/, 'CRE cron needs six fields'),
  passportUrl: z.string().regex(/^https:\/\/[A-Za-z0-9.-]+(?:\/[^\s#]*)?$/),
  rpcUrl: z.string().regex(/^https:\/\/[A-Za-z0-9.-]+(?:\/[^\s#]*)?$/),
  chainSelectorName: z.literal('monad-testnet'),
  chainId: z.literal(10143),
  registryAddress: address,
  registryCodeHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  identityRegistryAddress: address,
  agentId: z.string().regex(/^[1-9]\d*$/),
  passportVersion: z.number().int().positive(),
}).strict()
export type Config = z.infer<typeof configSchema>

const bundleSchema = z.object({
  schemaVersion: z.literal('2.0.0'),
  payload: z.object({
    subject: z.object({
      subjectType: z.literal('erc8004_agent'),
      agentId: z.string(), agentRegistry: z.string(), network: z.literal('monad-testnet'),
      chainId: z.literal(10143), registryAddress: address,
      ownerAddress: address, agentWallet: address, agentUri: z.string(),
    }).passthrough(),
    generation: z.object({ passportVersion: z.number().int().positive() }).passthrough(),
  }).passthrough(),
  integrity: z.object({ algorithm: z.literal('sha256'), digest: z.string().regex(/^[0-9a-f]{64}$/) }),
}).passthrough()

const insist = (condition: boolean, reason: string): void => {
  if (!condition) throw new Error(reason)
}

export function validatePassport(raw: unknown, config: Config) {
  const bundle = bundleSchema.parse(raw)
  const { subject, generation } = bundle.payload
  insist(subject.agentId === config.agentId, 'Passport agent ID differs from configured subject')
  insist(generation.passportVersion === config.passportVersion, 'Passport version differs from configured version')
  insist(subject.chainId === config.chainId && subject.network === config.chainSelectorName, 'Passport network differs')
  insist(subject.registryAddress.toLowerCase() === config.identityRegistryAddress.toLowerCase(), 'Passport ERC-8004 registry differs')
  insist(subject.agentRegistry.toLowerCase() === `eip155:${config.chainId}:${config.identityRegistryAddress.toLowerCase()}`,
    'Passport ERC-8004 association differs')
  const actualDigest = sha256(stringToBytes(canonicalJsonStringify(bundle.payload))).slice(2)
  insist(actualDigest === bundle.integrity.digest, 'Passport payload SHA-256 digest mismatch')
  return { bundle, digest: `0x${actualDigest}` as `0x${string}` }
}
