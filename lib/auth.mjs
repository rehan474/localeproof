import { timingSafeEqual } from 'node:crypto'
export function validToken(supplied, expected) {
  return (
    expected.length >= 32 &&
    expected.length <= 256 &&
    Buffer.byteLength(supplied) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
}
