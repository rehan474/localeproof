import type { ScanDetail, ScanSummary } from '~/types/report'
export function useOwnerScans() {
  // Token stays in this page's memory. It is never stored in localStorage or a URL.
  const token = ref(''), history = ref<ScanSummary[]>([]), active = ref<ScanDetail | null>(null)
  const busy = ref(false), message = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  const headers = () => ({ Authorization: `Bearer ${token.value}` })
  function errorMessage(error: unknown) {
    const e = error as { data?: { statusMessage?: string } }
    return e.data?.statusMessage || 'The request failed. Check your connection and server configuration.'
  }
  async function loadHistory() { history.value = await $fetch<ScanSummary[]>('/api/scans',{ headers: headers() }) }
  async function inspect(id: string) {
    clearTimeout(timer)
    try {
      active.value = await $fetch<ScanDetail>(`/api/scans/${id}`, { headers: headers() })
      if (!disposed && ['queued','running'].includes(active.value.status)) timer = setTimeout(() => inspect(id), 2500)
      else if (!disposed) await loadHistory()
    } catch (error) { message.value = errorMessage(error) }
  }
  async function run(action: () => Promise<void>) {
    busy.value = true; message.value = ''
    try { await action() } catch (error) { message.value = errorMessage(error) }
    finally { busy.value = false }
  }
  async function create(name: string, pairs: { name: string; en: string; ar: string }[]) {
    await run(async () => { const scan = await $fetch<{ id: string }>('/api/scans', { method: 'POST', headers: headers(), body: { name,pairs } }); await inspect(scan.id) })
  }
  async function rerun() {
    if (!active.value) return
    await run(async () => { const scan = await $fetch<{ id: string }>(`/api/projects/${active.value!.project_id}/scan`, { method: 'POST',headers:headers() }); await inspect(scan.id) })
  }
  function clearSession() { clearTimeout(timer); token.value = ''; history.value = []; active.value = null; message.value = '' }
  onBeforeUnmount(() => { disposed = true; clearSession() })
  return { token, history, active, busy, message, headers, inspect, create, rerun, connect: () => run(loadHistory), clearSession }
}
