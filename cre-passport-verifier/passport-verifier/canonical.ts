// Signal Passport canonical payload serialization: recursively sorted object keys,
// original array order, compact JSON, and no ambiguous or unsafe numeric values.
export function canonicalJsonStringify(value: unknown): string {
  const seen = new WeakSet<object>()
  const serialize = (item: unknown): string => {
    if (item === null) return 'null'
    if (typeof item === 'string' || typeof item === 'boolean') return JSON.stringify(item)
    if (typeof item === 'bigint') return JSON.stringify(item.toString(10))
    if (typeof item === 'number') {
      if (!Number.isFinite(item) || Object.is(item, -0) || (Number.isInteger(item) && !Number.isSafeInteger(item)))
        throw new TypeError('Non-canonical numeric value')
      return JSON.stringify(item)
    }
    if (typeof item !== 'object') throw new TypeError('Unsupported canonical JSON value')
    if (seen.has(item)) throw new TypeError('Circular canonical JSON value')
    seen.add(item)
    try {
      if (Array.isArray(item)) return `[${item.map((entry) => entry === undefined ? 'null' : serialize(entry)).join(',')}]`
      const record = item as Record<string, unknown>
      const entries = Object.keys(record).filter((key) => record[key] !== undefined).sort()
        .map((key) => `${JSON.stringify(key)}:${serialize(record[key])}`)
      return `{${entries.join(',')}}`
    } finally { seen.delete(item) }
  }
  if (value === undefined) throw new TypeError('Undefined top-level canonical JSON value')
  return serialize(value)
}
