import { database } from '../../../lib/database.mjs'
export default defineEventHandler(async event => {
  requireOwner(event)
  const { rows } = await (await database()).query('SELECT s.id,s.project_id,s.status,s.created_at,p.name FROM scans s JOIN projects p ON p.id=s.project_id ORDER BY s.created_at DESC LIMIT 50')
  return rows
})
