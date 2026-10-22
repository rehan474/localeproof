import { setTimeout } from 'node:timers/promises'
import { database, claimScan, saveReport } from '../lib/database.mjs'
import { scanProject } from '../lib/scanner.mjs'
const hosts = (process.env.ALLOWED_SCAN_HOSTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
if (!hosts.length) throw new Error('Set ALLOWED_SCAN_HOSTS before starting the worker.')
let stopping = false
process.on('SIGTERM', () => {
  stopping = true
})
process.on('SIGINT', () => {
  stopping = true
})
const db = await database()
console.log('LocaleProof worker ready.')
try {
  while (!stopping) {
    const scan = await claimScan()
    if (!scan) {
      await setTimeout(2000)
      continue
    }
    try {
      const { rows: projects } = await db.query('SELECT name FROM projects WHERE id=$1', [
        scan.project_id,
      ])
      const { rows: pairs } = await db.query(
        'SELECT pair_key AS id,name,en_url AS en,ar_url AS ar FROM page_pairs WHERE project_id=$1 ORDER BY pair_key',
        [scan.project_id],
      )
      const { rows: history } = await db.query(
        "SELECT report FROM scans WHERE project_id=$1 AND status='completed' ORDER BY created_at DESC LIMIT 1",
        [scan.project_id],
      )
      const report = await scanProject(
        {
          id: scan.id,
          project: projects[0].name,
          pairs,
          previous: history[0]?.report?.current || [],
        },
        hosts,
      )
      await saveReport(scan, report)
      console.log(`Completed scan ${scan.id}.`)
    } catch (error) {
      console.error(
        `Scan ${scan.id} failed. Review browser, database, and approved-host configuration.`,
      )
      await db.query(
        "UPDATE scans SET status='failed',finished_at=now(),error='Scan could not finish. Check worker logs, approved hosts, and browser installation.' WHERE id=$1 AND status='running'",
        [scan.id],
      )
    }
  }
} finally {
  await db.end()
}
