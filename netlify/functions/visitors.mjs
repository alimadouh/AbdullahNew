import { ensureSchema, sql } from './_db.mjs'
import { verifyAdmin } from './_auth.mjs'

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export const handler = async (event) => {
  try {
    await ensureSchema()

    // POST - record a visit (public)
    if (event.httpMethod === 'POST') {
      await sql`INSERT INTO visitors DEFAULT VALUES`
      return json(200, { ok: true })
    }

    // GET - get visitor stats (admin only)
    if (event.httpMethod === 'GET') {
      verifyAdmin(event)
      const [total] = await sql`SELECT COUNT(*)::int AS count FROM visitors`
      const [today] = await sql`SELECT COUNT(*)::int AS count FROM visitors WHERE visited_at >= CURRENT_DATE`
      const [week] = await sql`SELECT COUNT(*)::int AS count FROM visitors WHERE visited_at >= CURRENT_DATE - INTERVAL '7 days'`
      const [month] = await sql`SELECT COUNT(*)::int AS count FROM visitors WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'`
      return json(200, {
        total: total.count,
        today: today.count,
        week: week.count,
        month: month.count,
      })
    }

    return json(405, { error: 'Method not allowed' })
  } catch (err) {
    const statusCode = err?.statusCode || 500
    return json(statusCode, { error: String(err?.message || err) })
  }
}
