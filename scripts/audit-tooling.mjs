import { spawnSync } from 'node:child_process'
import { readFileSync, appendFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Temporary, visible exceptions for build-only dependencies with no upstream fix.
// Production dependencies are audited independently without these exceptions.
const accepted = new Set([
  'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
  'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
])
const expiry = Date.parse('2026-11-21T00:00:00Z')
const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8' })
if (result.error || ![0, 1].includes(result.status))
  throw new Error('Dependency audit failed to run.')
const report = JSON.parse(result.stdout)
if (report.error || !report.vulnerabilities)
  throw new Error('Dependency audit returned no usable report.')
const advisories = Object.values(report.vulnerabilities).flatMap((item) =>
  item.via.filter((via) => typeof via !== 'string'),
)
const unexpected = advisories.filter(
  (item) => !accepted.has(item.url) || item.severity === 'critical',
)
if (unexpected.length)
  throw new Error(
    `Unreviewed dependency advisories: ${unexpected.map((item) => item.url).join(', ')}`,
  )
if (advisories.length && Date.now() >= expiry)
  throw new Error('Build-tool advisory review has expired. Reassess upstream fixes.')

// Fail if either excepted package enters the built deployment, including bundled code.
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) inspect(path)
    else if (entry.isFile() && /\.(?:json|m?js)$/.test(entry.name)) {
      const contents = readFileSync(path, 'utf8')
      if (/\bnode-forge\b|node_modules\/braces\b|"name"\s*:\s*"braces"/.test(contents))
        throw new Error(`Excepted build dependency found in deployment: ${path}`)
    }
  }
}
inspect('.output/server')
const summary = advisories.length
  ? `Build tooling has ${new Set(advisories.map((item) => item.url)).size} known advisories, reviewed until 2026-11-21. See SECURITY.md. Production audits have no exceptions.`
  : 'No build tooling advisories reported.'
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `\n### Build tooling security review\n${summary}\n`,
  )
if (advisories.length && process.env.GITHUB_ACTIONS) console.log(`::warning::${summary}`)
