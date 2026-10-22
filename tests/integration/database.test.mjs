import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { database, queueProject, queueAgain, claimScan, saveReport } from '../../lib/database.mjs'
import { demoReport } from '../../lib/demo.mjs'
if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to a disposable PostgreSQL database.')
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
const db = await database()
test('PostgreSQL persists reports, serializes claims, and rolls back invalid writes', async () => {
  await db.query(await readFile(new URL('../../db/001_initial.sql', import.meta.url), 'utf8'))
  const created = []
  try {
    const scan = await queueProject({
      name: 'Integration test',
      pairs: [
        { id: 'page-1', name: 'Home', en: 'https://example.com/en', ar: 'https://example.com/ar' },
      ],
    })
    created.push(scan.projectId)
    await assert.rejects(queueAgain(scan.projectId))
    const claims = await Promise.all([claimScan(), claimScan()])
    assert.equal(claims.filter(Boolean).length, 1)
    assert.equal(claims.find(Boolean).id, scan.id)
    const report = demoReport()
    report.id = scan.id
    await saveReport({ id: scan.id }, report)
    const { rows } = await db.query('SELECT status,report FROM scans WHERE id=$1', [scan.id])
    assert.equal(rows[0].status, 'completed')
    assert.equal(rows[0].report.current.length, 5)
    assert.equal(
      (await db.query('SELECT count(*)::int AS n FROM findings WHERE scan_id=$1', [scan.id]))
        .rows[0].n,
      5,
    )
    await assert.rejects(saveReport({ id: scan.id }, report))
    assert.notEqual((await queueAgain(scan.projectId)).id, scan.id)
    const before = (await db.query('SELECT count(*)::int AS n FROM projects')).rows[0].n
    await assert.rejects(
      queueProject({
        name: 'Invalid duplicate pair',
        pairs: [
          { id: 'a', name: 'A', en: 'https://example.com/en', ar: 'https://example.com/ar' },
          { id: 'a', name: 'B', en: 'https://example.com/a', ar: 'https://example.com/b' },
        ],
      }),
    )
    assert.equal((await db.query('SELECT count(*)::int AS n FROM projects')).rows[0].n, before)
  } finally {
    for (const id of created) await db.query('DELETE FROM projects WHERE id=$1', [id])
    await db.end()
  }
})
