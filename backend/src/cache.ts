const cacheLifetimeMs = 3000

const entries = new Map<string, { expiresAt: number; json: string }>()
const loading = new Map<string, Promise<string>>()
let generation = 0

export function cachedJson(key: string, load: () => Promise<unknown>): Promise<string> {
  const entry = entries.get(key)
  if (entry && Date.now() <= entry.expiresAt) {
    return Promise.resolve(entry.json)
  }
  const running = loading.get(key)
  if (running) {
    return running
  }
  const startedGeneration = generation
  const promise = load()
    .then((value) => {
      const json = JSON.stringify(value)
      if (startedGeneration === generation) {
        if (entries.size > 1000) {
          entries.clear()
        }
        entries.set(key, { expiresAt: Date.now() + cacheLifetimeMs, json })
      }
      return json
    })
    .finally(() => {
      if (loading.get(key) === promise) {
        loading.delete(key)
      }
    })
  loading.set(key, promise)
  return promise
}

export function clearCache() {
  generation += 1
  entries.clear()
  loading.clear()
}
