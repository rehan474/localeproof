<script setup lang="ts">
defineProps<{ locale: string; fixed: boolean; mobile?: boolean }>()
</script>
<template>
  <div class="preview-shell" :class="{ compact: mobile }">
    <div class="browser-bar">
      <span class="browser-dots" aria-hidden="true">● ● ●</span
      ><span>nakhla.example / {{ locale }}</span
      ><span class="locale-label">{{ locale.toUpperCase() }}</span>
    </div>
    <iframe
      :src="`/fixtures/${locale}${fixed ? '-fixed' : ''}.html`"
      :title="`${locale === 'ar' ? 'Arabic' : 'English'} sample page — illustrative preview`"
      sandbox=""
      loading="lazy"
    />
  </div>
</template>
