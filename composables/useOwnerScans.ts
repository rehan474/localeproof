import type { ScanDetail, ScanSummary } from '~/types/report'
export function useOwnerScans() {
  // Token stays in this page's memory. It is never stored in localStorage or a URL.
  const token = ref(''),
    history = ref<ScanSummary[]>([]),
    active = ref<ScanDetail | null>(null)
  const busy = ref(false),
    message = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0
  let selection = 0
  const headers = () => ({ Authorization: `Bearer ${token.value}` })
  function errorMessage(error: unknown) {
    const e = error as { data?: { statusMessage?: string } }
    return (
      e.data?.statusMessage || 'The request failed. Check your connection and server configuration.'
    )
  }
  async function loadHistory() {
    const session = generation
    const result = await $fetch<ScanSummary[]>('/api/scans', { headers: headers() })
    if (session === generation) history.value = result
  }
  async function inspect(id: string) {
    clearTimeout(timer)
    const session = generation,
      request = ++selection
    try {
      const result = await $fetch<ScanDetail>(`/api/scans/${id}`, { headers: headers() })
      if (session !== generation || request !== selection) return
      active.value = result
      if (session === generation && ['queued', 'running'].includes(active.value.status))
        timer = setTimeout(() => inspect(id), 2500)
      else if (session === generation) await loadHistory()
    } catch (error) {
      if (session === generation && request === selection) message.value = errorMessage(error)
    }
  }
  async function run(action: (session: number) => Promise<void>) {
    const session = generation
    busy.value = true
    message.value = ''
    try {
      await action(session)
    } catch (error) {
      if (session === generation) message.value = errorMessage(error)
    } finally {
      if (session === generation) busy.value = false
    }
  }
  async function create(name: string, pairs: { name: string; en: string; ar: string }[]) {
    await run(async (session) => {
      const scan = await $fetch<{ id: string }>('/api/scans', {
        method: 'POST',
        headers: headers(),
        body: { name, pairs },
      })
      if (session === generation) await inspect(scan.id)
    })
  }
  async function rerun() {
    if (!active.value) return
    await run(async (session) => {
      const scan = await $fetch<{ id: string }>(`/api/projects/${active.value!.project_id}/scan`, {
        method: 'POST',
        headers: headers(),
      })
      if (session === generation) await inspect(scan.id)
    })
  }
  function clearSession() {
    generation++
    selection++
    busy.value = false
    clearTimeout(timer)
    token.value = ''
    history.value = []
    active.value = null
    message.value = ''
  }
  onBeforeUnmount(() => {
    clearSession()
  })
  return {
    token,
    history,
    active,
    busy,
    message,
    headers,
    inspect,
    create,
    rerun,
    connect: () => run(loadHistory),
    clearSession,
  }
}
