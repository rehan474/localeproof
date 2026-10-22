import { readFile } from 'node:fs/promises'
import { database } from '../lib/database.mjs'
const db = await database()
try {
  await db.query(await readFile(new URL('../db/001_initial.sql', import.meta.url), 'utf8'))
  console.log('Database schema is ready.')
} finally {
  await db.end()
}
