import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createHash } from 'node:crypto'

test('production server renders, hashes inline scripts, and protects owner routes', async () => {
  const port = 3187
  const child = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      DATABASE_URL: '',
      OWNER_TOKEN: '',
    },
    stdio: 'pipe',
  })
  let logs = ''
  child.stdout.on('data', (chunk) => {
    logs += chunk
  })
  child.stderr.on('data', (chunk) => {
    logs += chunk
  })
  const base = `http://127.0.0.1:${port}`
  try {
    let ready = false
    for (let attempt = 0; attempt < 50; attempt++) {
      if (child.exitCode !== null) throw new Error(`Server exited: ${logs}`)
      try {
        ready = (await fetch(base)).ok
      } catch {}
      if (ready) break
      await delay(100)
    }
    assert.ok(ready, logs)
    for (const path of ['/', '/inspect', '/owner']) {
      const response = await fetch(base + path)
      assert.equal(response.status, 200)
      const html = await response.text()
      const csp = response.headers.get('content-security-policy')
      assert.ok(csp?.includes("object-src 'none'"))
      for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
        if (!match[1].trim()) continue
        const hash = createHash('sha256').update(match[1]).digest('base64')
        assert.ok(csp.includes(`'sha256-${hash}'`), `Missing inline script hash at ${path}`)
      }
    }
    assert.deepEqual(await (await fetch(base + '/api/config')).json(), { liveEnabled: false })
    const demo = await (await fetch(base + '/api/demo')).json()
    assert.equal(demo.checksRun, 32)
    assert.equal(demo.current.length, 5)
    for (const path of ['/api/scans', '/api/scans/00000000-0000-4000-8000-000000000001']) {
      const response = await fetch(base + path)
      assert.equal(response.status, 503)
      assert.equal(response.headers.get('cache-control'), 'no-store')
    }
  } finally {
    child.kill('SIGTERM')
  }
})
