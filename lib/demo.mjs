import { evaluatePage, compareFindings, checkCatalog } from './checks.mjs'
export const demoPair = {
  id: 'home',
  name: 'Homepage',
  en: 'https://nakhla.example/en',
  ar: 'https://nakhla.example/ar',
}
function page(locale, viewport, fixed) {
  const width = viewport === 'mobile' ? 390 : 1440
  return {
    locale,
    viewport,
    status: 200,
    lang: locale,
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    title: locale === 'ar' ? 'نخلة — مساحات للحياة' : 'Nakhla — spaces for living',
    canonical: locale === 'ar' && !fixed ? demoPair.en : demoPair[locale],
    alternates: ['en', 'ar'].map((lang) => ({ lang, url: demoPair[lang] })),
    brokenImages: locale === 'ar' && !fixed ? ['/assets/ar/studio.webp'] : [],
    scrollWidth: locale === 'ar' && viewport === 'mobile' && !fixed ? 468 : width,
    viewportWidth: width,
    screenshot: null,
    pairId: 'home',
  }
}
export function demoReport(fixed = false) {
  const pages = ['en', 'ar'].flatMap((locale) =>
    ['desktop', 'mobile'].map((viewport) => page(locale, viewport, fixed)),
  )
  const previous = ['en', 'ar'].flatMap((locale) =>
    ['desktop', 'mobile'].flatMap((viewport) =>
      evaluatePage(page(locale, viewport, false), demoPair),
    ),
  )
  const findings = pages.flatMap((p) => evaluatePage(p, demoPair))
  return {
    id: fixed ? 'demo-fixed' : 'demo',
    project: 'Nakhla Studio',
    source: 'fixture',
    status: 'completed',
    createdAt: null,
    pairs: [demoPair],
    pages,
    checksRun: pages.length * checkCatalog.length,
    ...compareFindings(findings, fixed ? previous : []),
    note: 'Bundled demonstration data. These results are not a live website scan.',
  }
}
