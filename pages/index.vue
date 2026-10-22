<script setup lang="ts">
import { checkCatalog } from '../lib/checks.mjs'
const walkthrough = ref<HTMLElement | null>(null)
const stage = ref(0)
const stages = [
  { title: 'Find the difference that matters.', body: 'A translated page can still lose an image, overflow a phone screen, or point search engines to the wrong language.', label: 'Inspect the issue', fixed: false },
  { title: 'Give every finding some proof.', body: 'Inspect the affected language, viewport, observed value, and a concrete repair suggestion in the same workspace.', label: 'Review the evidence', fixed: false },
  { title: 'Make the next release better.', body: 'Compare scan history to distinguish new problems, recurring issues, and verified fixes.', label: 'Verify the fix', fixed: true }
]
let cleanup: (() => void) | undefined
onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)
  const media = gsap.matchMedia()
  media.add('(min-width: 1024px)', () => {
    gsap.to('.hero-preview', { scale: 1, opacity: 1, scrollTrigger: { trigger: '.hero-preview', start: 'top 95%', end: 'top 35%', scrub: true } })
    ScrollTrigger.create({ trigger: walkthrough.value, start: 'top 120px', end: 'bottom 75%', pin: '.walkthrough-title', pinSpacing: false })
  })
  cleanup = () => media.revert()
})
onBeforeUnmount(() => cleanup?.())
</script>
<template>
  <div><a class="skip-link" href="#main">Skip to content</a><SiteHeader />
    <main id="main" class="landing">
      <LandingHero />
      <div class="check-strip" aria-label="Check categories"><div class="strip-track"><span v-for="(item,index) in [...checkCatalog, ...checkCatalog]" :key="index">{{ item.name }} <b aria-hidden="true">✳</b></span></div></div>
      <section id="how-it-works" class="wrap section-space">
        <div class="section-heading"><p class="eyebrow">LOOK CLOSER. SHIP WITH CONFIDENCE.</p><h2>Translation is only<br />half the experience.</h2><p>Eight focused checks. Two languages. Desktop and mobile.<br />A report that tells you exactly where to look.</p></div>
        <div class="feature-grid">
          <details open><summary><span class="feature-symbol" aria-hidden="true">Aa / ع</span><h3>Language integrity</h3></summary><p>Check language attributes, reading direction, and the links between your English and Arabic pages.</p><span class="feature-note">Document language · Direction · Hreflang</span></details>
          <details open><summary><span class="feature-symbol" aria-hidden="true">[ ↔ ]</span><h3>Visual confidence</h3></summary><p>Find missing visible images and content that spills beyond a mobile screen. Keep the screenshot with the finding.</p><span class="feature-note">Visible images · Viewport overflow</span></details>
          <details open><summary><span class="feature-symbol" aria-hidden="true">&lt; / &gt;</span><h3>Search foundations</h3></summary><p>Check page availability, titles, and canonical URLs without hiding the actual evidence behind a vague score.</p><span class="feature-note">Status · Title · Canonical</span></details>
        </div>
      </section>
      <section ref="walkthrough" class="walkthrough section-space wrap">
        <div class="walkthrough-title"><p class="eyebrow">FROM ISSUE TO EVIDENCE</p><h2>See it.<br />Fix it.<br /><span>Prove it.</span></h2><NuxtLink class="text-link" to="/inspect">Open the workspace ↗</NuxtLink></div>
        <div class="evidence-carousel"><div class="carousel-controls" aria-label="Walkthrough steps"><button v-for="(item,index) in stages" :key="item.label" :aria-pressed="stage === index" @click="stage = index">{{ item.label }}</button></div><PagePreview locale="ar" :fixed="stages[stage].fixed" /><div class="carousel-copy" aria-live="polite"><span class="eyebrow">{{ stage + 1 }} / 3</span><h3>{{ stages[stage].title }}</h3><p>{{ stages[stage].body }}</p></div></div>
      </section>
      <section class="closing"><div class="wrap"><p class="eyebrow">BUILT FOR THE SPACE BETWEEN LANGUAGES</p><h2>Good in English.<br /><span lang="ar" dir="rtl">ممتاز بالعربية.</span></h2><NuxtLink class="button light" to="/inspect">Try LocaleProof <span aria-hidden="true">↗</span></NuxtLink><p>Open source. Evidence first. Built by Mohammad Rehan.</p></div></section>
    </main><footer class="wrap footer"><span>LocaleProof / English–Arabic release checks</span><a href="https://github.com/rehan474/localeproof">Source code ↗</a><span>MIT License</span></footer>
  </div>
</template>
