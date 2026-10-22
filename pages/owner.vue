<script setup lang="ts">
const { data: config } = await useFetch('/api/config')
const { token, history, active, busy, message, inspect, create, rerun, connect, clearSession } =
  useOwnerScans()
const name = ref(''),
  pairs = ref([{ name: 'Homepage', en: '', ar: '' }])
useHead({
  title: 'Owner workspace — LocaleProof',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})
</script>
<template>
  <div>
    <a class="skip-link" href="#owner">Skip to workspace</a><SiteHeader />
    <main id="owner" class="workspace wrap">
      <div class="workspace-top">
        <div>
          <p class="eyebrow">YOUR RELEASES</p>
          <h1>Owner workspace</h1>
          <p>Scan approved websites and keep a history of the evidence.</p>
        </div>
        <NuxtLink to="/inspect" class="text-link">Explore the demo ↗</NuxtLink>
      </div>
      <div v-if="!config?.liveEnabled" class="setup-state">
        <h2>Live scanning needs a server connection.</h2>
        <p>
          The demo works without credentials. To enable live scans, configure PostgreSQL, an owner
          token, approved hosts, and the scan worker.
        </p>
        <a class="button primary" href="https://github.com/rehan474/localeproof#live-scans"
          >Open setup instructions ↗</a
        >
      </div>
      <template v-else>
        <form class="owner-auth" @submit.prevent="connect">
          <label for="owner-token"
            >Owner token<input
              id="owner-token"
              v-model="token"
              type="password"
              autocomplete="off"
              required
              minlength="32"
              maxlength="256"
              placeholder="Your private access token" /></label
          ><button class="button primary" :disabled="busy">Connect</button
          ><button class="button secondary" type="button" @click="clearSession">
            Clear session</button
          ><small>Held in memory only. Reloading clears your token.</small>
        </form>
        <p v-if="message" class="error-state" role="alert">{{ message }}</p>
        <div class="owner-grid">
          <form class="scan-form" @submit.prevent="create(name, pairs)">
            <h2>New project</h2>
            <label for="project-name"
              >Project name<input
                id="project-name"
                v-model="name"
                required
                maxlength="80"
                placeholder="Your website"
            /></label>
            <fieldset v-for="(pair, index) in pairs" :key="index">
              <legend>Page pair {{ index + 1 }}</legend>
              <label :for="`pair-name-${index}`"
                >Page name<input
                  :id="`pair-name-${index}`"
                  v-model="pair.name"
                  required
                  maxlength="80" /></label
              ><label :for="`en-${index}`"
                >English URL<input
                  :id="`en-${index}`"
                  v-model="pair.en"
                  type="url"
                  required
                  maxlength="2048"
                  placeholder="https://example.com/en" /></label
              ><label :for="`ar-${index}`"
                >Arabic URL<input
                  :id="`ar-${index}`"
                  v-model="pair.ar"
                  type="url"
                  required
                  maxlength="2048"
                  placeholder="https://example.com/ar" /></label
              ><button
                v-if="pairs.length > 1"
                type="button"
                class="text-link"
                @click="pairs.splice(index, 1)"
              >
                Remove pair
              </button>
            </fieldset>
            <div class="actions">
              <button
                v-if="pairs.length < 5"
                type="button"
                class="button secondary"
                @click="pairs.push({ name: `Page ${pairs.length + 1}`, en: '', ar: '' })"
              >
                Add page pair</button
              ><button class="button primary" :disabled="busy || !token">
                {{ busy ? 'Submitting…' : 'Queue scan ↗' }}
              </button>
            </div>
          </form>
          <section class="scan-history">
            <h2>Recent scans</h2>
            <p v-if="!history.length">Connect to see your scan history.</p>
            <button
              v-for="scan in history"
              :key="scan.id"
              @click="inspect(scan.id)"
              :aria-pressed="active?.id === scan.id"
            >
              <span
                ><strong>{{ scan.name }}</strong
                ><small>{{ new Date(scan.created_at).toLocaleString() }}</small></span
              ><span class="badge">{{ scan.status }}</span>
            </button>
          </section>
        </div>
        <section v-if="active" class="active-scan">
          <div class="report-section-heading">
            <h2>Selected scan</h2>
            <button
              class="button secondary"
              @click="rerun"
              :disabled="busy || ['queued', 'running'].includes(active.status)"
            >
              Run again ↗
            </button>
          </div>
          <p role="status">
            Status: {{ active.status }}.
            {{
              ['queued', 'running'].includes(active.status)
                ? 'This view updates automatically.'
                : ''
            }}
          </p>
          <p v-if="active.error" role="alert">{{ active.error }}</p>
          <template v-if="active.report"
            ><ReportMetrics :report="active.report" />
            <h3>Open findings</h3>
            <FindingExplorer :issues="active.report.current" :fixed="false" filter="all" />
            <details v-if="active.report.resolved.length">
              <summary>Resolved findings ({{ active.report.resolved.length }})</summary>
              <FindingExplorer :issues="active.report.resolved" :fixed="true" filter="resolved" />
            </details>
            <LiveEvidence :report="active.report" :token="token" />
            <p>{{ active.report.note }}</p>
            <p
              v-if="active.report.pages.some((page) => page.blockedRequests?.length)"
              class="demo-notice"
            >
              Some resources were blocked by the scan policy. Review the allowlist before
              interpreting image failures.
            </p></template
          >
        </section>
      </template>
    </main>
  </div>
</template>
