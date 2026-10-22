export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2026-10-21',
  devtools: { enabled: false },
  css: ['~/assets/main.css'],
  app: {
    head: {
      title: 'LocaleProof — confidence in every language',
      htmlAttrs: { lang: 'en' },
      meta: [
        {
          name: 'description',
          content:
            'Inspect English and Arabic website releases. Compare evidence, catch localization regressions, and verify fixes.',
        },
      ],
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    },
  },
  nitro: { preset: process.env.VERCEL ? 'vercel' : 'node-server', externals: { external: ['pg'] } },
  routeRules: {
    '/api/**': { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
  },
})
