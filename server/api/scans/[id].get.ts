import { database } from '../../../lib/database.mjs'
export default defineEventHandler(async event => {
  requireOwner(event)
  const { rows } = await (await database()).query('SELECT id,project_id,status,error,report FROM scans WHERE id=$1', [uuid(getRouterParam(event,'id'))])
  if (!rows[0]) throw createError({ statusCode:404,statusMessage:'Scan not found.' })
  return rows[0]
})
