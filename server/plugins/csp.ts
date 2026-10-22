import { createHash } from 'node:crypto'
export default defineNitroPlugin((app) => {
  app.hooks.hook('render:response', (response, { event }) => {
    if (import.meta.dev || typeof response.body !== 'string') return
    const hashes = [...response.body.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .filter((match) => match[1]?.trim())
      .map((match) => `'sha256-${createHash('sha256').update(match[1]!).digest('base64')}'`)
    setHeader(
      event,
      'Content-Security-Policy',
      `default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'`,
    )
  })
})
