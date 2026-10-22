// ponytail: process-local limiter; use a shared edge limiter before scaling beyond one app process.
export function createRateLimiter(limit = 120, windowMs = 60000, maxKeys = 1000) {
  const buckets = new Map()
  return (key, now = Date.now()) => {
    for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id)
    let bucket = buckets.get(key)
    if (!bucket) {
      if (buckets.size >= maxKeys) return false
      bucket = { count: 0, expires: now + windowMs }
      buckets.set(key, bucket)
    }
    return ++bucket.count <= limit
  }
}
