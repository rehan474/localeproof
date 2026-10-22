import { queueAgain } from '../../../../lib/database.mjs'
export default defineEventHandler(async event => {
  requireOwner(event)
  try { setResponseStatus(event,202); return await queueAgain(uuid(getRouterParam(event,'id'))) }
  catch { throw createError({ statusCode:409,statusMessage:'The project is missing, already has an active scan, or the queue is full.' }) }
})
