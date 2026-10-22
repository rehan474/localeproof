export type Locale = 'en' | 'ar'
export type Viewport = 'desktop' | 'mobile'
export type Severity = 'critical' | 'warning'
export interface Finding {
  key: string
  check: string
  severity: Severity
  title: string
  evidence: string
  fix: string
  locale: Locale
  viewport: Viewport
  pairId: string
  url: string
  change: 'new' | 'existing' | 'resolved'
}
export interface PagePair {
  id: string
  name: string
  en: string
  ar: string
}
export interface PageEvidence {
  locale: Locale
  viewport: Viewport
  pairId: string
  status: number
  screenshot: string | null
  blockedRequests?: string[]
}
export interface ScanReport {
  id: string
  project: string
  source: 'fixture' | 'live'
  status: 'completed'
  createdAt: string | null
  pairs: PagePair[]
  pages: PageEvidence[]
  checksRun: number
  current: Finding[]
  resolved: Finding[]
  note: string
}
export interface ScanSummary {
  id: string
  project_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  created_at: string
  name: string
}
export interface ScanDetail {
  id: string
  project_id: string
  status: ScanSummary['status']
  error: string | null
  report: ScanReport | null
}
