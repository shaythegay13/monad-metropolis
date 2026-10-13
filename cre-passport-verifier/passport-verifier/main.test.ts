import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { canonicalJsonStringify } from './canonical'
import { fetchPassport, initWorkflow } from './main'
import { applyFailure, applyIdentity, applyPublication, configSchema, newResult, resultSchema, validatePassport, type Config } from './passport'
import { sha256, stringToBytes, zeroAddress, zeroHash } from 'viem'
import type { HTTPSendRequester } from '@chainlink/cre-sdk'
import config from './config.staging.json'
import negativeConfig from './config.agent-2.json'

const settings = config as Config
const accepted = JSON.parse(readFileSync(new URL('../../apps/web/public/passports/agent-2072-v2-published.json', import.meta.url), 'utf8'))

describe('Signal Passport CRE verifier', () => {
  test('recomputes the real published v2 payload digest', () => {
    expect(validatePassport(accepted, settings).digest).toBe('0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6')
  })

  test('rejects changed evidence even when the envelope digest is retained', () => {
    const changed = structuredClone(accepted)
    changed.payload.subject.registration.warnings.push('changed after publication')
    expect(() => validatePassport(changed, settings)).toThrow('digest mismatch')
  })

  test('rejects a different configured agent', () => {
    expect(() => validatePassport(accepted, { ...settings, agentId: '2' })).toThrow('agent ID differs')
  })

  test('canonical serialization sorts object keys and preserves array order', () => {
    expect(canonicalJsonStringify({ z: [2, 1], a: { y: true, x: null } })).toBe('{"a":{"x":null,"y":true},"z":[2,1]}')
    expect(() => canonicalJsonStringify({ n: Number.MAX_SAFE_INTEGER + 1 })).toThrow()
  })

  test('registers the selected six-field cron trigger', () => {
    const handlers = initWorkflow(settings)
    expect(handlers).toHaveLength(1)
    expect(handlers[0].trigger.config.schedule).toBe('0 0 * * * *')
  })

  test('validates the full real Agent 2 artifact without requiring publication', () => {
    const artifact = JSON.parse(readFileSync(new URL('../../apps/web/public/passports/agent-2-v1-unpublished.json', import.meta.url), 'utf8'))
    const result = newResult(negativeConfig as Config, '2026-10-12T17:00:00.000Z')
    validatePassport(artifact, negativeConfig as Config, result)
    expect(result.localIntegrityValid).toBe(true)
    expect(result.criteria.evidence_references.status).toBe('PASS')
  })

  test('rejects a malformed field outside the prototype schema subset', () => {
    const changed = structuredClone(accepted)
    changed.payload.coverage.rawRowsRetrieved = -1
    expect(() => validatePassport(changed, settings)).toThrow('schema')
  })

  test('QuickJS schema adapter rejects malformed or non-provenance source URLs', () => {
    for (const source of ['not a URL', 'https://example.com/query', 'https://monad-testnet.hypersync.xyz/query?other=1']) {
      const changed = structuredClone(accepted)
      changed.payload.evidence[0].sourceReference = source
      expect(() => validatePassport(changed, settings)).toThrow('schema')
    }
  })

  test('rejects dangling evidence references even after coherent rehashing', () => {
    const changed = structuredClone(accepted)
    changed.payload.metrics[0].evidenceIds.push('missing-evidence')
    changed.integrity.digest = sha256(stringToBytes(canonicalJsonStringify(changed.payload))).slice(2)
    expect(() => validatePassport(changed, settings)).toThrow('evidence references')
  })

  test('rejects wrong configured version and identity registry', () => {
    expect(() => validatePassport(accepted, { ...settings, passportVersion: 1 })).toThrow('version differs')
    expect(() => validatePassport(accepted, { ...settings, identityRegistryAddress: '0x' + '1'.repeat(40) })).toThrow('registry differs')
  })

  test('configuration rejects unsafe numbers, uint256 overflow, wrong chain and unknown write fields', () => {
    for (const patch of [{ passportVersion: Number.MAX_SAFE_INTEGER + 1 }, { agentId: (1n << 256n).toString() },
      { chainId: 1 }, { receiver: '0x' + '1'.repeat(40) }, { schedule: '0 * * * *' }]) {
      expect(configSchema.safeParse({ ...settings, ...patch }).success).toBe(false)
    }
  })

  // These synthetic chain records exercise domain failure semantics; native CLI runs use real capabilities.
  const makeResult = () => {
    const result = newResult(settings, '2026-10-12T17:00:00.000Z')
    result.snapshot = { blockNumber: '70000000', blockHash: '0x' + '1'.repeat(64), finality: 'finalized', consistent: true }
    return result
  }
  const realDigest = validatePassport(accepted, settings).digest
  const syntheticPublication = { profileHash: realDigest, publisher: accepted.payload.subject.agentWallet,
    contentUri: '', publishedAt: 1791457045n, blockNumber: 69236935n }

  test('verified historical publication remains valid after a current wallet rotation', () => {
    const result = makeResult()
    const { bundle } = validatePassport(accepted, settings, result)
    applyPublication(result, realDigest, 3n, syntheticPublication)
    applyIdentity(result, bundle, bundle.payload.subject.ownerAddress, '0x' + '1'.repeat(40), bundle.payload.subject.agentUri)
    expect(result.publication.status).toBe('verified')
    expect(result.publication.isLatest).toBe(false)
    expect(result.identityAssociation.publisherMatchesCurrentWallet).toBe(false)
    expect(result.overallOutcome).toBe('verified_publication_identity_changed')
    expect(resultSchema.safeParse(result).success).toBe(true)
  })

  test('confirmed zero Registry record is not_found and preserves valid local integrity', () => {
    const result = makeResult()
    validatePassport(accepted, settings, result)
    applyPublication(result, realDigest, 0n, { profileHash: zeroHash, publisher: zeroAddress, contentUri: '', publishedAt: 0n, blockNumber: 0n })
    expect(result.publication.status).toBe('not_found')
    expect(result.localIntegrityValid).toBe(true)
    expect(result.overallOutcome).toBe('unpublished')
    expect(result.criteria.published_hash.status).toBe('UNKNOWN')
  })

  test('inconsistent absent record or future publication is invalid_registry', () => {
    expect(() => applyPublication(makeResult(), realDigest, 2n, { profileHash: zeroHash, publisher: zeroAddress, contentUri: '', publishedAt: 0n, blockNumber: 0n })).toThrow('contradicts')
    expect(() => applyPublication(makeResult(), realDigest, 2n, { ...syntheticPublication, blockNumber: 70000001n })).toThrow('snapshot')
  })

  test('coherently rehashed but changed artifact is locally valid and mismatches publication', () => {
    const changed = structuredClone(accepted)
    changed.payload.subject.registration.warnings.push('coherently rehashed')
    changed.integrity.digest = sha256(stringToBytes(canonicalJsonStringify(changed.payload))).slice(2)
    const result = makeResult()
    const validated = validatePassport(changed, settings, result)
    try { applyPublication(result, validated.digest, 2n, syntheticPublication) }
    catch (error) { applyFailure(result, error, 'publication') }
    expect(result.localIntegrityValid).toBe(true)
    expect(result.publication.status).toBe('hash_mismatch')
    expect(result.overallOutcome).toBe('invalid')
  })

  test('provider/snapshot failure is unavailable, never confirmed absence or success', () => {
    const result = makeResult()
    applyPublication(result, realDigest, 2n, syntheticPublication)
    applyFailure(result, new Error('private provider error body must not appear'), 'finalized_snapshot')
    expect(result.publication.status).toBe('provider_error')
    expect(result.publication.found).toBe(null)
    expect(result.snapshot?.consistent).toBe(false)
    expect(result.criteria.published_hash.status).toBe('UNKNOWN')
    expect(result.overallOutcome).toBe('unavailable')
    expect(JSON.stringify(result)).not.toContain('private provider error')
  })

  const httpStub = (body: Uint8Array, statusCode = 200) => ({
    sendRequest: () => ({ result: () => ({ statusCode, body }) }),
  }) as unknown as HTTPSendRequester

  test('raw hash covers exact UTF-8 bytes, separately from canonical payload', () => {
    const bytes = new TextEncoder().encode(' {"label":"é"} \n')
    const downloaded = JSON.parse(fetchPassport(httpStub(bytes), settings.passportUrl))
    expect(downloaded.rawHash).toBe(sha256(bytes))
    expect(downloaded.byteLength).toBe(bytes.length)
    expect(downloaded.byteLength).toBeGreaterThan(downloaded.body.length)
  })

  test('download bound uses bytes and rejects HTTP failures', () => {
    const bytes = new TextEncoder().encode('é'.repeat(50001))
    expect(() => fetchPassport(httpStub(bytes), settings.passportUrl)).toThrow('byte limit')
    expect(() => fetchPassport(httpStub(new Uint8Array(), 503), settings.passportUrl)).toThrow('HTTP failure')
  })
})
