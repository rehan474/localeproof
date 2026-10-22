import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fetchApproved } from './network.mjs'
import { evaluatePage, compareFindings, checkCatalog } from './checks.mjs'
export async function scanProject({ id, project, pairs, previous = [] }, hosts) {
  const browser = await chromium.launch({
    headless: true,
    chromiumSandbox: true,
    args: ['--force-webrtc-ip-handling-policy=disable_non_proxied_udp'],
    ...(process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
      : {}),
  })
  const pages = [],
    findings = []
  const directory = resolve(process.env.EVIDENCE_DIR || './data/evidence', id)
  await mkdir(directory, { recursive: true })
  try {
    for (const pair of pairs)
      for (const locale of ['en', 'ar'])
        for (const viewport of ['desktop', 'mobile']) {
          const context = await browser.newContext({
            viewport: { width: viewport === 'desktop' ? 1440 : 390, height: 900 },
            serviceWorkers: 'block',
            acceptDownloads: false,
            reducedMotion: 'reduce',
          })
          const deadline = setTimeout(() => {
            void context.close()
          }, 40000)
          const blocked = []
          let requests = 0,
            concurrent = 0,
            bytes = 0
          await context.routeWebSocket('**/*', (route) => route.close())
          await context.route('**/*', async (route) => {
            let admitted = false
            try {
              if (concurrent >= 8 || bytes > 25 * 1024 * 1024)
                throw new Error('Resource budget exceeded.')
              if (++requests > 150 || route.request().method() !== 'GET')
                throw new Error('Request budget or method blocked.')
              concurrent++
              admitted = true
              const response = await fetchApproved(route.request().url(), hosts)
              bytes += response.body.length
              if (bytes > 25 * 1024 * 1024) throw new Error('Resource budget exceeded.')
              await route.fulfill(response)
            } catch {
              const url = new URL(route.request().url())
              blocked.push(url.origin + url.pathname)
              await route.abort().catch(() => {})
            } finally {
              if (admitted) concurrent--
            }
          })
          try {
            const page = await context.newPage()
            context.on('page', (popup) => {
              if (popup !== page) void popup.close()
            })
            const response = await page.goto(pair[locale], { waitUntil: 'load', timeout: 25000 })
            await page.evaluate(async () => {
              const images = [...document.images].filter(
                (image) => image.getBoundingClientRect().top < innerHeight,
              )
              await Promise.all(images.map((image) => image.decode().catch(() => {})))
            })
            const evidence = await page.evaluate(() => ({
              lang: document.documentElement.lang,
              direction: getComputedStyle(document.documentElement).direction,
              title: document.title,
              canonical: document.querySelector('link[rel="canonical"]')?.href || '',
              alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(
                (el) => ({ lang: el.hreflang, url: el.href }),
              ),
              brokenImages: [...document.images]
                .filter((image) => {
                  const r = image.getBoundingClientRect()
                  return (
                    r.width > 0 &&
                    r.height > 0 &&
                    r.top < innerHeight &&
                    r.bottom > 0 &&
                    (!image.complete || !image.naturalWidth)
                  )
                })
                .map((image) => image.currentSrc || image.src),
              scrollWidth: document.documentElement.scrollWidth,
              viewportWidth: innerWidth,
            }))
            const screenshot = `${pair.id}-${locale}-${viewport}.png`
            await page.screenshot({
              path: resolve(directory, screenshot),
              animations: 'disabled',
              timeout: 10000,
            })
            const result = {
              ...evidence,
              locale,
              viewport,
              pairId: pair.id,
              status: response?.status() || 0,
              screenshot,
              blockedRequests: [...new Set(blocked)].slice(0, 20),
            }
            pages.push(result)
            findings.push(...evaluatePage(result, pair))
          } finally {
            clearTimeout(deadline)
            await context.close()
          }
        }
    return {
      id,
      project,
      source: 'live',
      status: 'completed',
      createdAt: new Date().toISOString(),
      pairs,
      pages,
      checksRun: pages.length * checkCatalog.length,
      ...compareFindings(findings, previous),
      note: 'Checks cover the initial viewport. Blocked resources can affect results; review the evidence before changing your site.',
    }
  } finally {
    await browser.close()
  }
}
