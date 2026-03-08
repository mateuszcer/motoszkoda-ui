const STORAGE_KEY = 'autoceny_preferences'

interface Preferences {
  interested: Record<string, string[]> // requestId → shopId[]
  ignored: Record<string, string[]> // requestId → shopId[]
}

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { interested: {}, ignored: {} }
    return JSON.parse(raw) as Preferences
  } catch {
    return { interested: {}, ignored: {} }
  }
}

function save(prefs: Preferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function isInterested(requestId: string, shopId: string): boolean {
  const prefs = load()
  return prefs.interested[requestId]?.includes(shopId) ?? false
}

export function isIgnored(requestId: string, shopId: string): boolean {
  const prefs = load()
  return prefs.ignored[requestId]?.includes(shopId) ?? false
}

export function markInterested(requestId: string, shopId: string): void {
  const prefs = load()
  // Add to interested
  if (!prefs.interested[requestId]) prefs.interested[requestId] = []
  if (!prefs.interested[requestId].includes(shopId)) {
    prefs.interested[requestId].push(shopId)
  }
  // Remove from ignored
  if (prefs.ignored[requestId]) {
    prefs.ignored[requestId] = prefs.ignored[requestId].filter((id) => id !== shopId)
  }
  save(prefs)
}

export function ignoreShop(requestId: string, shopId: string): void {
  const prefs = load()
  // Add to ignored
  if (!prefs.ignored[requestId]) prefs.ignored[requestId] = []
  if (!prefs.ignored[requestId].includes(shopId)) {
    prefs.ignored[requestId].push(shopId)
  }
  // Remove from interested
  if (prefs.interested[requestId]) {
    prefs.interested[requestId] = prefs.interested[requestId].filter((id) => id !== shopId)
  }
  save(prefs)
}
