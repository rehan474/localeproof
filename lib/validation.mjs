export function validateScan(input, allowedHosts) {
  if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 80)
    throw new Error('Use a project name between 1 and 80 characters.')
  if (!Array.isArray(input.pairs) || !input.pairs.length || input.pairs.length > 5)
    throw new Error('Provide between one and five page pairs.')
  if (Object.keys(input).some((key) => !['name', 'pairs'].includes(key)))
    throw new Error('Unknown project field.')
  const seen = new Set()
  const pairs = input.pairs.map((p, i) => {
    if (!p || typeof p !== 'object') throw new Error('Each pair needs English and Arabic URLs.')
    if (Object.keys(p).some((key) => !['name', 'en', 'ar'].includes(key)))
      throw new Error('Unknown page field.')
    const pair = {
      id: `page-${i + 1}`,
      name: typeof p.name === 'string' ? p.name.slice(0, 80) : `Page ${i + 1}`,
    }
    for (const locale of ['en', 'ar']) {
      if (typeof p[locale] !== 'string' || p[locale].length > 2048)
        throw new Error('Enter a valid HTTPS URL.')
      let u
      try {
        u = new URL(p[locale])
      } catch {
        throw new Error('Enter a valid HTTPS URL.')
      }
      if (
        u.protocol !== 'https:' ||
        u.username ||
        u.password ||
        u.port ||
        u.hash ||
        !allowedHosts.includes(u.hostname)
      )
        throw new Error(
          'Use an approved HTTPS host without credentials, a custom port, or a fragment.',
        )
      if (seen.has(u.href)) throw new Error('Each page URL must be unique.')
      seen.add(u.href)
      pair[locale] = u.href
    }
    return pair
  })
  return { name: input.name.trim(), pairs }
}
