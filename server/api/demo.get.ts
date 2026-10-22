import { demoReport } from '../../lib/demo.mjs'
export default defineEventHandler((event) => demoReport(getQuery(event).fixed === 'true'))
