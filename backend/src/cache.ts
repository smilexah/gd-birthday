const cacheLifetimeMs = 3000

const entries = new Map<string, { expiresAt: number; value: unknown }>()

export function getCached<T>(key: string): T | undefined {
  const entry = entries.get(key)
  if (!entry) {
    return undefined
  }
  if (Date.now() > entry.expiresAt) {
    entries.delete(key)
    return undefined
  }
  return entry.value as T
}

export function setCached(key: string, value: unknown) {
  if (entries.size > 1000) {
    entries.clear()
  }
  entries.set(key, { expiresAt: Date.now() + cacheLifetimeMs, value })
}

export function clearCache() {
  entries.clear()
}
