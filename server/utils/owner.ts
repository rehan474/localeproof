import type { H3Event } from 'h3'
import { validToken } from '../../lib/auth.mjs'
import { createRateLimiter } from '../../lib/rate-limit.mjs'
const permit = createRateLimiter()
export function requireOwner(event: H3Event) {
  if (!permit(event.node.req.socket.remoteAddress || 'unknown'))
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Try again in a minute.',
    })
  const expected = process.env.OWNER_TOKEN || ''
  if (expected.length < 32 || expected.length > 256)
    throw createError({ statusCode: 503, statusMessage: 'Live scans are not configured.' })
  const header = getHeader(event, 'authorization') || ''
  if (!header.startsWith('Bearer ') || !validToken(header.slice(7), expected))
    throw createError({ statusCode: 401, statusMessage: 'A valid owner token is required.' })
}
export function uuid(value: string | undefined) {
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
    throw createError({ statusCode: 400, statusMessage: 'Invalid identifier.' })
  return value
}
