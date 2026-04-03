// Simple in-memory rate limiter
// Keyed by identifier (e.g., phone number), tracks timestamps of recent requests

const store = new Map<string, number[]>()

const CLEANUP_INTERVAL = 60_000 // Clean up every 60s
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const cutoff = now - windowMs
  for (const [key, timestamps] of store) {
    const filtered = timestamps.filter((t) => t > cutoff)
    if (filtered.length === 0) store.delete(key)
    else store.set(key, filtered)
  }
}

export function rateLimit({
  key,
  maxRequests = 20,
  windowMs = 60_000,
}: {
  key: string
  maxRequests?: number
  windowMs?: number
}): { allowed: boolean; remaining: number } {
  cleanup(windowMs)

  const now = Date.now()
  const cutoff = now - windowMs
  const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff)

  if (timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return { allowed: true, remaining: maxRequests - timestamps.length }
}
