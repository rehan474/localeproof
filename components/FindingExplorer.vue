<script setup lang="ts">
import type { Finding } from '~/types/report'
const props = defineProps<{ issues: Finding[]; fixed: boolean; filter: string }>()
const selectedKey = ref('')
const selected = computed(() => props.issues.find(f => f.key === selectedKey.value) || props.issues[0])
</script>
<template>
<div class="finding-workspace" v-if="issues.length"><div class="finding-list"><button v-for="finding in issues" :key="finding.key" @click="selectedKey = finding.key" :aria-pressed="selected?.key === finding.key"><span class="finding-icon" :class="finding.severity" aria-hidden="true">{{ finding.change === 'resolved' ? '✓' : '!' }}</span><span><strong>{{ finding.title }}</strong><small>{{ finding.locale.toUpperCase() }} · {{ finding.viewport }} · {{ finding.check }}</small></span><span class="change-tag">{{ finding.change }}</span></button></div><article class="evidence-panel" v-if="selected"><div><span class="badge" :class="selected.change === 'resolved' ? 'pass' : selected.severity">{{ selected.change === 'resolved' ? 'Resolved' : selected.severity }}</span><span class="muted">{{ selected.locale.toUpperCase() }} / {{ selected.viewport }}</span></div><h3>{{ selected.title }}</h3><p class="eyebrow">OBSERVED EVIDENCE</p><pre>{{ selected.evidence }}</pre><p class="eyebrow">SUGGESTED REPAIR</p><p>{{ selected.fix }}</p><p class="evidence-url">{{ selected.url }}</p></article></div>
        <div v-else class="empty-state" role="status"><span aria-hidden="true">✓</span><h3>{{ fixed && filter !== 'resolved' ? 'A cleaner release.' : 'No findings in this view.' }}</h3><p>{{ fixed && filter !== 'resolved' ? 'All eight checks pass for both languages and viewports in this fixture. Open Resolved to review the changes.' : 'Try another filter or viewport to explore the report.' }}</p></div>
</template>
