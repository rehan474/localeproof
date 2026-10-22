<script setup lang="ts">
import type { ScanReport } from '~/types/report'
import { checkCatalog } from '../lib/checks.mjs'
const fixed = ref(false),
  viewport = ref('desktop'),
  filter = ref('all')
const {
  data: report,
  pending,
  error,
  refresh,
} = await useFetch<ScanReport>('/api/demo', { query: { fixed } })
const issues = computed(
  () =>
    (filter.value === 'resolved' ? report.value?.resolved : report.value?.current)?.filter(
      (f) =>
        f.viewport === viewport.value &&
        (filter.value === 'all' || filter.value === 'resolved' || f.severity === filter.value),
    ) || [],
)
const checksOpen = ref(false)
function downloadReport() {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report.value, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `localeproof-${fixed.value ? 'after' : 'before'}.json`
  a.click()
  URL.revokeObjectURL(url)
}
useHead({ title: 'Demo workspace — LocaleProof' })
</script>
<template>
  <div>
    <a class="skip-link" href="#workspace">Skip to report</a><SiteHeader />
    <main id="workspace" class="workspace wrap">
      <div class="workspace-top">
        <div>
          <p class="eyebrow">RELEASE INSPECTION</p>
          <h1>Nakhla Studio<span class="sample-label">Demo project</span></h1>
          <p>Two languages. One consistent experience.</p>
        </div>
        <div class="actions">
          <NuxtLink class="button secondary" to="/owner">Scan your site ↗</NuxtLink
          ><button class="button primary" @click="downloadReport" :disabled="!report">
            Export JSON ↓
          </button>
        </div>
      </div>
      <div class="demo-notice">
        <span class="notice-icon" aria-hidden="true">i</span>
        <p>
          <strong>Explore a real workflow with sample data.</strong> These are bundled fixtures, not
          a live website scan. Previews are illustrative; live scans capture screenshots.
        </p>
      </div>
      <div class="report-toolbar">
        <div class="segmented" aria-label="Demo release">
          <button :aria-pressed="!fixed" @click="fixed = false">Before fixes</button
          ><button :aria-pressed="fixed" @click="fixed = true">After fixes</button>
        </div>
        <span class="toolbar-hint">{{
          fixed
            ? 'Compare the corrected release with its baseline.'
            : 'Select a finding to inspect its evidence.'
        }}</span>
        <div class="segmented" aria-label="Viewport">
          <button :aria-pressed="viewport === 'desktop'" @click="viewport = 'desktop'">
            Desktop</button
          ><button :aria-pressed="viewport === 'mobile'" @click="viewport = 'mobile'">
            Mobile
          </button>
        </div>
      </div>
      <div v-if="error" class="error-state" role="alert">
        The demo report could not load. <button @click="refresh()">Try again</button>
      </div>
      <div v-else-if="pending && !report" class="loading-state" role="status">
        Loading the inspection report…
      </div>
      <template v-else-if="report">
        <ReportMetrics :report="report" />
        <div class="report-section-heading">
          <h2>Side by side</h2>
          <span
            >Homepage
            <span class="muted"
              >/ {{ viewport === 'mobile' ? '390' : '1440' }}px inspection</span
            ></span
          >
        </div>
        <div class="comparison" :class="{ 'mobile-comparison': viewport === 'mobile' }">
          <div>
            <div class="language-heading">
              <span>English <small>en / left to right</small></span
              ><span class="badge pass">Passed</span>
            </div>
            <PagePreview locale="en" :fixed="fixed" :mobile="viewport === 'mobile'" />
          </div>
          <div>
            <div class="language-heading">
              <span>Arabic <small>ar / right to left</small></span
              ><span class="badge" :class="fixed ? 'pass' : 'critical'">{{
                fixed ? 'Passed' : 'Needs attention'
              }}</span>
            </div>
            <PagePreview locale="ar" :fixed="fixed" :mobile="viewport === 'mobile'" />
          </div>
        </div>
        <div class="report-section-heading">
          <h2>
            Findings <small>{{ issues.length }}</small>
          </h2>
          <button class="text-link" @click="checksOpen = !checksOpen" :aria-expanded="checksOpen">
            {{ checksOpen ? 'Hide' : 'View' }} all checks
          </button>
        </div>
        <div v-if="checksOpen" class="checks-list">
          <div v-for="check in checkCatalog" :key="check.id">
            <strong>{{ check.name }}</strong>
            <p>{{ check.description }}</p>
          </div>
        </div>
        <div class="filter-row" aria-label="Filter findings">
          <button
            v-for="value in ['all', 'critical', 'warning', 'resolved']"
            :key="value"
            :aria-pressed="filter === value"
            @click="filter = value"
          >
            {{
              value === 'all'
                ? 'All open'
                : value === 'warning'
                  ? 'Warnings'
                  : value.charAt(0).toUpperCase() + value.slice(1)
            }}
          </button>
        </div>
        <FindingExplorer :issues="issues" :fixed="fixed" :filter="filter" />
      </template>
      <p class="report-footnote">
        One check result per language and viewport. Passing these checks does not establish full
        accessibility, translation quality, or search ranking.
      </p>
    </main>
    <footer class="wrap footer">
      <NuxtLink to="/">← Back to LocaleProof</NuxtLink
      ><a href="https://github.com/rehan474/localeproof">Explore the implementation ↗</a>
    </footer>
  </div>
</template>
