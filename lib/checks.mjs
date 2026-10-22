export const checkCatalog = [
  ['page-status', 'Page availability', 'The page responds successfully.'],
  ['language', 'Document language', 'The HTML language matches the expected locale.'],
  ['direction', 'Reading direction', 'Arabic reads right to left; English reads left to right.'],
  ['title', 'Page title', 'The document has a useful, non-empty title.'],
  ['canonical', 'Canonical URL', 'The canonical points to the inspected language page.'],
  ['hreflang', 'Language alternates', 'Both language alternates point to the paired pages.'],
  ['images', 'Visible images', 'Visible images have loaded successfully.'],
  ['overflow', 'Mobile overflow', 'Content fits the selected viewport.'],
].map(([id, name, description]) => ({ id, name, description }))

export function normalizedUrl(value) {
  try {
    const u = new URL(value)
    u.hash = ''
    return u.href
  } catch {
    return ''
  }
}

export function evaluatePage(page, pair) {
  const expected = pair[page.locale]
  const failures = []
  const add = (check, severity, title, evidence, fix) =>
    failures.push({
      key: `${pair.id}:${page.locale}:${page.viewport}:${check}`,
      check,
      severity,
      title,
      evidence,
      fix,
      locale: page.locale,
      viewport: page.viewport,
      pairId: pair.id,
      url: expected,
    })
  if (page.status < 200 || page.status >= 400)
    add(
      'page-status',
      'critical',
      'Page is unavailable',
      `HTTP ${page.status}`,
      'Restore this route and verify that it returns a successful response.',
    )
  if (page.lang.toLowerCase().split('-')[0] !== page.locale)
    add(
      'language',
      'warning',
      'Document language does not match',
      `Expected ${page.locale}; received ${page.lang || 'no lang attribute'}.`,
      `Set the HTML lang attribute to ${page.locale}.`,
    )
  if (page.direction !== (page.locale === 'ar' ? 'rtl' : 'ltr'))
    add(
      'direction',
      'critical',
      'Reading direction is incorrect',
      `Computed direction: ${page.direction}.`,
      `Set dir="${page.locale === 'ar' ? 'rtl' : 'ltr'}" on the document root.`,
    )
  if (!page.title.trim())
    add(
      'title',
      'warning',
      'Page title is missing',
      'The document title is empty.',
      'Add a descriptive title in the page language.',
    )
  if (!page.canonical || normalizedUrl(page.canonical) !== normalizedUrl(expected))
    add(
      'canonical',
      'warning',
      'Canonical points to the wrong page',
      `Expected ${expected}; received ${page.canonical || 'no canonical'}.`,
      'Use a self-referencing canonical for this language page.',
    )
  for (const locale of ['en', 'ar']) {
    if (
      !page.alternates.some(
        (a) =>
          a.lang.toLowerCase().split('-')[0] === locale &&
          normalizedUrl(a.url) === normalizedUrl(pair[locale]),
      )
    ) {
      add(
        'hreflang',
        'warning',
        'Language alternates are incomplete',
        `Missing or incorrect ${locale} alternate.`,
        'Add reciprocal English and Arabic hreflang links on both pages.',
      )
      break
    }
  }
  if (page.brokenImages.length)
    add(
      'images',
      'critical',
      'Images are missing',
      page.brokenImages.join('\n'),
      'Check the image URL, response status, and locale-specific asset path.',
    )
  if (page.scrollWidth > page.viewportWidth + 2)
    add(
      'overflow',
      'critical',
      'Content extends beyond the screen',
      `${page.scrollWidth}px content in a ${page.viewportWidth}px viewport.`,
      'Inspect fixed widths and long text. Use logical CSS properties and responsive sizing.',
    )
  return failures
}

export function compareFindings(current, previous) {
  const oldKeys = new Set(previous.map((f) => f.key)),
    newKeys = new Set(current.map((f) => f.key))
  return {
    current: current.map((f) => ({ ...f, change: oldKeys.has(f.key) ? 'existing' : 'new' })),
    resolved: previous
      .filter((f) => !newKeys.has(f.key))
      .map((f) => ({ ...f, change: 'resolved' })),
  }
}
