import { sha256, stringToBytes, zeroAddress, zeroHash } from 'viem'
import { z } from 'zod'
import {
  validateAgentPassportReferences,
  type AgentPassportBundleV2,
} from '../../packages/schema/src/agent-passport'
import { agentIdSchema } from '../../packages/schema/src/identity'
import { canonicalJsonStringify } from './canonical'
import { crePassportBundleSchema } from './schema'

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/).refine(v => v !== zeroAddress)
const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/)
const httpsUrl = z.string().regex(/^https:\/\/[A-Za-z0-9.-]+(?:\/[^\s#]*)?$/)
export const configSchema = z.object({
  schedule: z.string().regex(/^(\S+\s+){5}\S+$/, 'CRE cron needs six fields'),
  passportUrl: httpsUrl, rpcUrl: httpsUrl,
  chainSelectorName: z.literal('monad-testnet'), chainId: z.literal(10143),
  registryAddress: address, registryCodeHash: hash,
  identityRegistryAddress: address, agentId: agentIdSchema,
  passportVersion: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  expectedRawSha256: hash.optional(),
}).strict()
export type Config = z.infer<typeof configSchema>
export const MAX_ARTIFACT_BYTES = 100_000
export const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const decimal = z.string().regex(/^(0|[1-9]\d*)$/)
const criterionSchema = z.object({ status: z.enum(['PASS', 'FAIL', 'UNKNOWN']), detail: z.string() }).strict()
export const publicationStatuses = ['verified', 'not_found', 'hash_mismatch', 'invalid_local', 'invalid_registry', 'provider_error'] as const
export const resultSchema = z.object({
  schemaVersion: z.literal('signal-passport-cre-verification/1.0.0'),
  executionTime: z.string().datetime(), outputType: z.literal('unsigned-workflow-result'),
  chainId: z.literal(10143), agentId: agentIdSchema, passportVersion: decimal,
  sourceArtifactUrl: httpsUrl, rawFileSha256: hash.nullable(), canonicalDigest: hash.nullable(),
  downloadedBytes: z.number().int().nonnegative().nullable(), localIntegrityValid: z.boolean(),
  registryAddress: address,
  snapshot: z.object({ blockNumber: decimal, blockHash: hash, finality: z.literal('finalized'), consistent: z.boolean() }).strict().nullable(),
  publication: z.object({
    status: z.enum(publicationStatuses), found: z.boolean().nullable(), latestVersion: decimal.nullable(), isLatest: z.boolean().nullable(),
    record: z.object({ profileHash: hash, contentUri: z.string(), publisher: address, publishedAt: decimal, blockNumber: decimal }).strict().nullable(),
  }).strict(),
  identityAssociation: z.object({
    registryAddress: address, ownerAddress: z.string().nullable(), agentWallet: z.string().nullable(), agentUri: z.string().nullable(),
    walletMatchesArtifact: z.boolean().nullable(), ownerMatchesArtifact: z.boolean().nullable(), uriMatchesArtifact: z.boolean().nullable(),
    publisherMatchesCurrentWallet: z.boolean().nullable(),
  }).strict(),
  criteria: z.record(z.string(), criterionSchema), limitations: z.array(z.string()),
  overallOutcome: z.enum(['verified', 'verified_publication_identity_changed', 'unpublished', 'invalid', 'unavailable']),
  failureStage: z.string().nullable(),
}).strict()
export type VerificationResult = z.infer<typeof resultSchema>
export type PublicationStatus = typeof publicationStatuses[number]
export class VerificationFailure extends Error {
  constructor(public status: PublicationStatus, public criterion: string, message: string) { super(message) }
}
export function check(result: VerificationResult, name: string, condition: boolean, detail: string,
  failureStatus?: PublicationStatus): void {
  result.criteria[name] = { status: condition ? 'PASS' : 'FAIL', detail }
  if (!condition && failureStatus) throw new VerificationFailure(failureStatus, name, detail)
}
export function newResult(config: Config, executionTime: string): VerificationResult {
  const criteria: VerificationResult['criteria'] = {}
  for (const name of ['download', 'raw_file_hash', 'schema', 'evidence_references', 'canonical_digest', 'chain',
    'finalized_snapshot', 'registry_bytecode', 'identity_registry', 'publication', 'published_hash',
    'publication_provenance', 'current_wallet', 'current_owner', 'current_uri']) {
    criteria[name] = { status: 'UNKNOWN', detail: 'Not checked' }
  }
  return {
    schemaVersion: 'signal-passport-cre-verification/1.0.0', executionTime, outputType: 'unsigned-workflow-result',
    chainId: config.chainId, agentId: config.agentId, passportVersion: String(config.passportVersion),
    sourceArtifactUrl: config.passportUrl, rawFileSha256: null, canonicalDigest: null, downloadedBytes: null,
    localIntegrityValid: false, registryAddress: config.registryAddress, snapshot: null,
    publication: { status: 'provider_error', found: null, latestVersion: null, isLatest: null, record: null },
    identityAssociation: { registryAddress: config.identityRegistryAddress, ownerAddress: null, agentWallet: null, agentUri: null,
      walletMatchesArtifact: null, ownerMatchesArtifact: null, uriMatchesArtifact: null, publisherMatchesCurrentWallet: null },
    criteria, overallOutcome: 'unavailable', failureStage: null,
    limitations: [
      'Unsigned read-only CRE workflow output; native simulation is not a decentralized production attestation or signed DON report.',
      'Integrity and authorized publication do not prove underlying economic evidence, service delivery or universal trustworthiness.',
      'Current ERC-8004 association is checked at the snapshot; it does not prove wallet association at every historical transaction.',
      'Registry address, runtime code hash and identity dependency are independently configured trust roots; RPC/chain assumptions remain.',
    ],
  }
}

export function validatePassport(raw: unknown, config: Config, result?: VerificationResult) {
  const parsed = crePassportBundleSchema.safeParse(raw)
  if (result) check(result, 'schema', parsed.success, 'Complete Passport v2 schema validation')
  if (!parsed.success) throw new VerificationFailure('invalid_local', 'schema',
    `Invalid complete Passport schema: ${parsed.error.issues.slice(0, 3).map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`)
  const bundle = parsed.data
  const references = validateAgentPassportReferences(bundle.payload)
  if (result) check(result, 'evidence_references', references.length === 0, 'Subject, scope and complete evidence/metric/observation reference graph', 'invalid_local')
  if (references.length) throw new VerificationFailure('invalid_local', 'evidence_references', 'Invalid Passport evidence references')
  const { subject, generation } = bundle.payload
  const require = (condition: boolean, message: string) => {
    if (!condition) throw new VerificationFailure('invalid_local', 'schema', message)
  }
  require(subject.agentId === config.agentId, 'Passport agent ID differs from configured subject')
  require(generation.passportVersion === config.passportVersion, 'Passport version differs from configured version')
  require(subject.chainId === config.chainId && subject.network === config.chainSelectorName, 'Passport network differs')
  require(sameAddress(subject.registryAddress, config.identityRegistryAddress), 'Passport ERC-8004 registry differs')
  // Hash original supplied payload, not a schema projection that may strip nested fields.
  const digest = sha256(stringToBytes(canonicalJsonStringify((raw as { payload: unknown }).payload)))
  if (result) {
    result.canonicalDigest = digest
    check(result, 'canonical_digest', digest.slice(2) === bundle.integrity.digest, 'Canonical payload SHA-256 matches embedded digest', 'invalid_local')
    result.localIntegrityValid = true
  }
  if (digest.slice(2) !== bundle.integrity.digest) throw new VerificationFailure('invalid_local', 'canonical_digest', 'Passport payload SHA-256 digest mismatch')
  return { bundle, digest }
}

export type Publication = { profileHash: `0x${string}`; contentUri: string; publisher: string; publishedAt: bigint; blockNumber: bigint }
export function applyPublication(result: VerificationResult, digest: string, latest: bigint, publication: Publication): void {
  result.publication.latestVersion = latest.toString()
  result.publication.isLatest = latest === BigInt(result.passportVersion)
  const absent = publication.profileHash === zeroHash && publication.publisher === zeroAddress &&
    publication.publishedAt === 0n && publication.blockNumber === 0n && publication.contentUri === ''
  result.publication.found = !absent
  if (absent) {
    check(result, 'publication', false, 'Exact agent/version record is absent in the pinned Registry; this is not evidence of fraud or invalid local evidence')
    if (latest >= BigInt(result.passportVersion)) throw new VerificationFailure('invalid_registry', 'publication', 'Latest version contradicts absent publication')
    result.publication.status = 'not_found'
    result.overallOutcome = 'unpublished'
    return
  }
  check(result, 'publication', true, 'Exact agent/version Registry record found')
  check(result, 'publication_provenance', latest >= BigInt(result.passportVersion) && publication.profileHash !== zeroHash &&
    publication.publisher !== zeroAddress && publication.publishedAt > 0n && publication.blockNumber > 0n &&
    result.snapshot !== null && publication.blockNumber <= BigInt(result.snapshot.blockNumber),
    'Nonzero publication record under pinned authorization-enforcing Registry at/before snapshot', 'invalid_registry')
  result.publication.record = { ...publication, publishedAt: publication.publishedAt.toString(), blockNumber: publication.blockNumber.toString() }
  check(result, 'published_hash', publication.profileHash.toLowerCase() === digest.toLowerCase(), 'Registry profile hash matches canonical Passport digest', 'hash_mismatch')
  result.publication.status = 'verified'
  result.overallOutcome = 'verified'
}
export function applyIdentity(result: VerificationResult, bundle: AgentPassportBundleV2,
  owner: string, wallet: string, uri: string): void {
  const identity = result.identityAssociation
  identity.ownerAddress = owner; identity.agentWallet = wallet; identity.agentUri = uri
  identity.walletMatchesArtifact = sameAddress(wallet, bundle.payload.subject.agentWallet!)
  identity.ownerMatchesArtifact = sameAddress(owner, bundle.payload.subject.ownerAddress)
  identity.uriMatchesArtifact = uri === bundle.payload.subject.agentUri
  identity.publisherMatchesCurrentWallet = result.publication.record ? sameAddress(wallet, result.publication.record.publisher) : null
  check(result, 'current_wallet', identity.walletMatchesArtifact, 'Current ERC-8004 designated wallet versus artifact snapshot')
  check(result, 'current_owner', identity.ownerMatchesArtifact, 'Current ERC-8004 owner versus artifact snapshot')
  check(result, 'current_uri', identity.uriMatchesArtifact, 'Current ERC-8004 metadata URI versus artifact snapshot')
  if (result.publication.status === 'verified' &&
    (!identity.walletMatchesArtifact || !identity.ownerMatchesArtifact || !identity.uriMatchesArtifact || !identity.publisherMatchesCurrentWallet)) {
    result.overallOutcome = 'verified_publication_identity_changed'
  }
}
export function applyFailure(result: VerificationResult, error: unknown, stage: string): void {
  result.failureStage = stage
  result.publication.status = error instanceof VerificationFailure ? error.status : 'provider_error'
  result.overallOutcome = result.publication.status === 'provider_error' ? 'unavailable' : 'invalid'
  if (error instanceof VerificationFailure) result.criteria[error.criterion] = { status: 'FAIL', detail: error.message }
  // Never return provider response bodies, endpoint credentials or arbitrary exception text.
  else result.criteria[stage] = { status: 'UNKNOWN', detail: 'Capability/provider failure; no verified conclusion or confirmed absence' }
  if (result.snapshot) result.snapshot.consistent = false
  if (result.publication.status === 'provider_error') {
    result.publication.found = null
    for (const name of ['publication', 'published_hash', 'publication_provenance', 'current_wallet', 'current_owner', 'current_uri']) {
      result.criteria[name] = { status: 'UNKNOWN', detail: 'Verification unavailable due to capability/snapshot failure' }
    }
  }
}
