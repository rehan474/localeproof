import { randomUUID } from 'node:crypto'
let pool
export async function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.')
  if (!pool) {
    const { default: pg } = await import('pg')
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000, statement_timeout: 10000 })
    pool.on('error', error => console.error('Database connection failed:', error.code))
  }
  return pool
}
export async function transaction(work) {
  const client = await (await database()).connect()
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result }
  catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release() }
}
export async function queueProject({ name, pairs }) {
  return transaction(async client => {
    // ponytail: single-owner deployment; serialize queue admission until a multi-user quota is needed.
    await client.query('SELECT pg_advisory_xact_lock(817392)')
    const { rows } = await client.query("SELECT count(*)::int AS count FROM scans WHERE status IN ('queued','running')")
    if (rows[0].count >= 10) throw new Error('The scan queue is full. Try again after a scan finishes.')
    const projectId = randomUUID(), scanId = randomUUID()
    await client.query('INSERT INTO projects(id,name) VALUES($1,$2)', [projectId, name])
    for (const p of pairs) await client.query('INSERT INTO page_pairs(id,project_id,pair_key,name,en_url,ar_url) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(),projectId,p.id,p.name,p.en,p.ar])
    await client.query('INSERT INTO scans(id,project_id) VALUES($1,$2)', [scanId,projectId])
    return { id: scanId, projectId, status: 'queued' }
  })
}
export async function queueAgain(projectId) {
  return transaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(817392)')
    const { rows } = await client.query("SELECT count(*)::int AS count FROM scans WHERE status IN ('queued','running')")
    if (rows[0].count >= 10) throw new Error('The scan queue is full.')
    const id = randomUUID()
    await client.query('INSERT INTO scans(id,project_id) VALUES($1,$2)', [id,projectId])
    return { id, projectId, status: 'queued' }
  })
}
export async function claimScan() {
  const db = await database()
  // Failed worker leases become explicit failures, never silently successful scans.
  await db.query("UPDATE scans SET status='failed',error='Worker interrupted. Please rerun.',finished_at=now() WHERE status='running' AND started_at < now()-interval '20 minutes'")
  const { rows } = await db.query("UPDATE scans SET status='running',started_at=now() WHERE id=(SELECT id FROM scans WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *")
  return rows[0]
}
export async function saveReport(scan, report) {
  await transaction(async client => {
    const { rows } = await client.query("SELECT id FROM scans WHERE id=$1 AND status='running' FOR UPDATE", [scan.id])
    if (!rows.length) throw new Error('Scan lease has expired.')
    for (const p of report.pages) await client.query('INSERT INTO page_results(id,scan_id,pair_key,locale,viewport,evidence) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(),scan.id,p.pairId,p.locale,p.viewport,JSON.stringify(p)])
    for (const f of report.current) await client.query('INSERT INTO findings(id,scan_id,fingerprint,severity,check_id,details) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(),scan.id,f.key,f.severity,f.check,JSON.stringify(f)])
    await client.query("UPDATE scans SET status='completed',finished_at=now(),report=$2 WHERE id=$1", [scan.id,JSON.stringify(report)])
  })
}
