<script setup lang="ts">
import type { ScanReport } from '~/types/report'
const props = defineProps<{ report: ScanReport }>()
const passed = computed(() => props.report.checksRun - props.report.current.length)
</script>
<template>
<div class="metrics" aria-label="Report summary"><div><span>CHECKS PASSED</span><strong>{{ passed }}<small> / {{ report.checksRun }}</small></strong><div class="meter"><span :style="{ width: `${passed / report.checksRun * 100}%` }" /></div></div><div><span>CRITICAL FINDINGS</span><strong :class="{ danger: report.current.some(f => f.severity === 'critical') }">{{ report.current.filter(f => f.severity === 'critical').length }}</strong><p>Across both viewports</p></div><div><span>WARNINGS</span><strong>{{ report.current.filter(f => f.severity === 'warning').length }}</strong><p>Metadata needs attention</p></div><div><span>RESOLVED</span><strong class="success-text">{{ report.resolved.length }}</strong><p>Compared with the baseline</p></div></div>
</template>
