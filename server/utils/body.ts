import type { H3Event } from 'h3'
export async function smallJsonBody(event: H3Event): Promise<unknown> {
  if (!getHeader(event, 'content-type')?.startsWith('application/json'))
    throw createError({ statusCode: 415, statusMessage: 'Use application/json.' })
  if (Number(getHeader(event, 'content-length')) > 16000)
    throw createError({ statusCode: 413, statusMessage: 'Request exceeds 16 KB.' })
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of event.node.req) {
    const buffer = Buffer.from(chunk)
    size += buffer.length
    if (size > 16000)
      throw createError({ statusCode: 413, statusMessage: 'Request exceeds 16 KB.' })
    chunks.push(buffer)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body.' })
  }
}
