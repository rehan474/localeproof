import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
export function requireOwner(event: H3Event) {
  const expected = process.env.OWNER_TOKEN || ''
  if (expected.length < 32) throw createError({ statusCode: 503, statusMessage: 'Live scans are not configured.' })
  const supplied = getHeader(event,'authorization')?.replace(/^Bearer /,'') || ''
  if (Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied),Buffer.from(expected))) throw createError({ statusCode: 401, statusMessage: 'An owner token is required.' })
}
export function uuid(value: string | undefined) {
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw createError({ statusCode: 400, statusMessage: 'Invalid identifier.' })
  return value
}
