export default defineEventHandler(event => {
  setHeader(event,'X-Content-Type-Options','nosniff')
  setHeader(event,'Referrer-Policy','no-referrer')
  setHeader(event,'Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()')
  setHeader(event,'X-Frame-Options','SAMEORIGIN')
  if (!import.meta.dev) {
    setHeader(event,'Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'")
  }
})
