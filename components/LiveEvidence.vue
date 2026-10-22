<script setup lang="ts">
import type { ScanReport } from '~/types/report'
const props = defineProps<{ report: ScanReport; token: string }>()
const images = ref<{ label: string; url: string }[]>([]), error = ref('')
let generation = 0
function clearImages() { images.value.forEach(image => URL.revokeObjectURL(image.url)); images.value = [] }
watch(() => props.report.id, async () => {
  const current = ++generation; clearImages(); error.value = ''
  for (const page of props.report.pages) {
    if (!page.screenshot) continue
    try {
      const blob = await $fetch<Blob>(`/api/evidence/${props.report.id}/${page.screenshot}`, { headers: { Authorization: `Bearer ${props.token}` }, responseType:'blob' })
      if (current !== generation) return
      images.value.push({ label: `${page.pairId} / ${page.locale.toUpperCase()} / ${page.viewport}`,url: URL.createObjectURL(blob) })
    } catch { if (current === generation) error.value = 'Some screenshots could not be loaded.' }
  }
}, { immediate:true })
onBeforeUnmount(() => { generation++; clearImages() })
</script>
<template><section><h2>Captured screenshots</h2><p v-if="error" role="alert">{{ error }}</p><div class="live-evidence-grid"><figure v-for="image in images" :key="image.url"><a :href="image.url" target="_blank" rel="noopener"><img :src="image.url" :alt="image.label" /></a><figcaption>{{ image.label }}</figcaption></figure></div></section></template>
