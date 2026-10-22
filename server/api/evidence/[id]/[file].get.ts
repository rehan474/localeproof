import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
export default defineEventHandler(async (event) => {
  requireOwner(event)
  const id = uuid(getRouterParam(event, 'id')),
    file = getRouterParam(event, 'file') || ''
  if (!/^page-[1-5]-(en|ar)-(desktop|mobile)\.png$/.test(file))
    throw createError({ statusCode: 400, statusMessage: 'Invalid evidence filename.' })
  try {
    const image = await readFile(resolve(process.env.EVIDENCE_DIR || './data/evidence', id, file))
    setHeader(event, 'Content-Type', 'image/png')
    return image
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Evidence not found.' })
  }
})
