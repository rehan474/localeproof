export default defineEventHandler(() => ({ liveEnabled: Boolean(process.env.DATABASE_URL && (process.env.OWNER_TOKEN?.length || 0) >= 32 && process.env.ALLOWED_SCAN_HOSTS) }))
