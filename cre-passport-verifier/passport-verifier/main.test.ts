import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { canonicalJsonStringify } from './canonical'
import { initWorkflow } from './main'
import { validatePassport, type Config } from './passport'
import config from './config.staging.json'

const settings = config as Config
const accepted = JSON.parse(readFileSync(new URL('../../apps/web/public/passports/agent-2072-v2-published.json', import.meta.url), 'utf8'))

describe('Signal Passport CRE verifier', () => {
  test('recomputes the real published v2 payload digest', () => {
    expect(validatePassport(accepted, settings).digest).toBe('0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6')
  })

  test('rejects changed evidence even when the envelope digest is retained', () => {
    const changed = structuredClone(accepted)
    changed.payload.limitations.push('changed after publication')
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
})
