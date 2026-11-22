function readJson(key: string): unknown {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export function loadTokens(): Record<string, string> {
  const value = readJson('gd-tokens')
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string>
  }
  return {}
}

export function saveTokens(tokens: Record<string, string>) {
  writeJson('gd-tokens', tokens)
}

export function loadReported(): number[] {
  const value = readJson('gd-reported')
  return Array.isArray(value) ? value : []
}

export function saveReported(ids: number[]) {
  writeJson('gd-reported', ids)
}

export function saveLang(lang: string) {
  try {
    localStorage.setItem('gd-lang', lang)
  } catch {
    return
  }
}
