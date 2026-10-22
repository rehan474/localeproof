import { validateScan } from '../../../lib/validation.mjs'
import { queueProject } from '../../../lib/database.mjs'
export default defineEventHandler(async event => {
  requireOwner(event)
  const raw = await readRawBody(event)
  if (!raw || Buffer.byteLength(raw) > 16000) throw createError({ statusCode: 413, statusMessage: 'Request must be smaller than 16 KB.' })
  let input
  try { input = validateScan(JSON.parse(raw), (process.env.ALLOWED_SCAN_HOSTS || '').split(',').map(s => s.trim())) }
  catch (error: any) { throw createError({ statusCode: 400, statusMessage: error.message }) }
  try { setResponseStatus(event,202); return await queueProject(input) }
  catch { throw createError({ statusCode: 503, statusMessage: 'Cannot queue the scan. Check database configuration or try again later.' }) }
})
