import { lookup } from 'node:dns/promises'
import https from 'node:https'
import ipaddr from 'ipaddr.js'
export function isPublicAddress(address) {
  try { return ipaddr.process(address).range() === 'unicast' } catch { return false }
}
export async function approvedAddress(rawUrl, allowedHosts, resolve = lookup) {
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowedHosts.includes(url.hostname)) throw new Error('Destination is not an approved HTTPS host.')
  const records = await resolve(url.hostname, { all: true, verbatim: true })
  if (!records.length || records.some(r => !isPublicAddress(r.address))) throw new Error('Non-public network destination blocked.')
  return { url, record: records[0] }
}
export async function fetchApproved(rawUrl, hosts) {
  const { url, record } = await approvedAddress(rawUrl, hosts)
  // Pin the validated IP for this connection; the browser never resolves this destination again.
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: 'GET', agent: false, headers: { 'User-Agent': 'LocaleProof/0.1 (+website-quality-check)', 'Accept-Encoding': 'identity' },
      lookup: (_hostname, options, callback) => options.all ? callback(null, [record]) : callback(null, record.address, record.family)
    }, response => {
      const chunks = []; let size = 0
      response.on('data', chunk => { size += chunk.length; if (size > 5 * 1024 * 1024) request.destroy(new Error('Response exceeded 5 MB.')); else chunks.push(chunk) })
      response.on('error', reject)
      response.on('end', () => {
        const headers = Object.fromEntries(Object.entries(response.headers).filter(([key,value]) => value && !['set-cookie','connection','transfer-encoding','content-length'].includes(key)).map(([key,value]) => [key,Array.isArray(value) ? value.join(', ') : value]))
        resolve({ status: response.statusCode || 502, headers, body: Buffer.concat(chunks) })
      })
    })
    const deadline = setTimeout(() => request.destroy(new Error('Request exceeded 10 seconds.')), 10000)
    request.on('close', () => clearTimeout(deadline)); request.on('error', reject); request.end()
  })
}
