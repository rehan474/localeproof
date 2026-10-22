import { validateScan } from '../../../lib/validation.mjs'
import { queueProject } from '../../../lib/database.mjs'
export default defineEventHandler(async (event) => {
  requireOwner(event)
  const body = await smallJsonBody(event)
  let input
  try {
    input = validateScan(
      body,
      (process.env.ALLOWED_SCAN_HOSTS || '').split(',').map((s) => s.trim()),
    )
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Provide a project name and 1–5 unique page pairs on approved HTTPS hosts.',
    })
  }
  try {
    const scan = await queueProject(input)
    setResponseStatus(event, 202)
    return scan
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Cannot queue scan. Check database configuration or try again later.',
    })
  }
})
