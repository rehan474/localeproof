import { test } from 'node:test'
import assert from 'node:assert/strict'
import { demoReport, demoPair } from '../lib/demo.mjs'
import { evaluatePage, compareFindings, normalizedUrl } from '../lib/checks.mjs'
import { validateScan } from '../lib/validation.mjs'
import { isPublicAddress, approvedAddress } from '../lib/network.mjs'
import { validToken } from '../lib/auth.mjs'
import { createRateLimiter } from '../lib/rate-limit.mjs'
test('the demo detects five failures and records all five as resolved after repair', () => {
  const before = demoReport(),
    after = demoReport(true)
  assert.equal(before.checksRun, 32)
  assert.equal(before.current.length, 5)
  assert.equal(before.current.filter((f) => f.severity === 'critical').length, 3)
  assert.equal(after.current.length, 0)
  assert.equal(after.resolved.length, 5)
})
test('all eight checks detect invalid evidence', () => {
  const page = {
    ...demoReport(true).pages[2],
    status: 404,
    lang: 'en',
    direction: 'ltr',
    title: ' ',
    canonical: '',
    alternates: [],
    brokenImages: ['missing'],
    scrollWidth: 3000,
  }
  assert.equal(new Set(evaluatePage(page, demoPair).map((f) => f.check)).size, 8)
})
test('finding identity survives evidence changes and separates viewports', () => {
  const previous = demoReport().current
  assert.ok(
    compareFindings(
      previous.map((f) => ({ ...f, evidence: 'different' })),
      previous,
    ).current.every((f) => f.change === 'existing'),
  )
  assert.equal(new Set(previous.map((f) => f.key)).size, 5)
  assert.notEqual(normalizedUrl('https://example.com/ar'), normalizedUrl('https://example.com/ar/'))
})
test('validation rejects unsafe destinations, duplicates, unknown fields, and excessive pairs', () => {
  const good = {
    name: 'Site',
    pairs: [{ name: 'Home', en: 'https://example.com/en', ar: 'https://example.com/ar' }],
  }
  assert.equal(validateScan(good, ['example.com']).pairs.length, 1)
  for (const url of [
    'http://example.com/ar',
    'https://user:pass@example.com/ar',
    'https://example.com:8443/ar',
    'https://evil.example/ar',
    'https://example.com/en',
    'https://example.com/ar#x',
  ])
    assert.throws(() =>
      validateScan({ ...good, pairs: [{ ...good.pairs[0], ar: url }] }, ['example.com']),
    )
  assert.throws(() => validateScan({ ...good, admin: true }, ['example.com']))
  assert.throws(() =>
    validateScan({ ...good, pairs: Array(6).fill(good.pairs[0]) }, ['example.com']),
  )
})
test('SSRF protection rejects private and mixed DNS answers including IPv4-mapped IPv6', async () => {
  for (const ip of [
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    'fc00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
  ])
    assert.equal(isPublicAddress(ip), false, ip)
  assert.equal(isPublicAddress('8.8.8.8'), true)
  await assert.rejects(
    approvedAddress('https://example.com', ['example.com'], async () => [
      { address: '8.8.8.8', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]),
  )
  await assert.rejects(approvedAddress('https://evil.example', ['example.com']))
  const result = await approvedAddress('https://example.com', ['example.com'], async () => [
    { address: '8.8.8.8', family: 4 },
  ])
  assert.equal(result.record.address, '8.8.8.8')
})
test('owner authentication fails closed and compares Unicode bytes safely', () => {
  assert.equal(validToken('', ''), false)
  assert.equal(validToken('short', 'short'), false)
  const t = 'a'.repeat(64)
  assert.equal(validToken(t, t), true)
  assert.equal(validToken('b'.repeat(64), t), false)
  assert.equal(validToken('é'.repeat(32), t), false)
})
test('rate limiting expires old buckets and bounds memory', () => {
  const permit = createRateLimiter(2, 1000, 2)
  assert.ok(permit('a', 0))
  assert.ok(permit('a', 1))
  assert.equal(permit('a', 2), false)
  assert.ok(permit('b', 2))
  assert.equal(permit('c', 3), false)
  assert.ok(permit('c', 1001))
})
