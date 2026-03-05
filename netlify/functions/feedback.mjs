import { ensureSchema, sql } from './_db.mjs'
import { verifyAdmin } from './_auth.mjs'

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export const handler = async (event) => {
  try {
    await ensureSchema()

    // POST - submit feedback (public)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const message = String(body.message || '').trim()
      if (!message) return json(400, { error: 'Message is required' })
      if (message.length > 2000) return json(400, { error: 'Message too long (max 2000 chars)' })

      await sql`INSERT INTO feedback (message) VALUES (${message})`
      return json(200, { ok: true })
    }

    // GET - list feedback (admin only)
    if (event.httpMethod === 'GET') {
      verifyAdmin(event)
      const rows = await sql`SELECT id, message, created_at FROM feedback ORDER BY created_at DESC LIMIT 100`
      return json(200, { feedback: rows })
    }

    // DELETE - delete single feedback (admin only)
    if (event.httpMethod === 'DELETE') {
      verifyAdmin(event)
      const body = JSON.parse(event.body || '{}')
      const id = body.id
      if (!id) return json(400, { error: 'id is required' })
      await sql`DELETE FROM feedback WHERE id = ${id}`
      return json(200, { ok: true })
    }

    return json(405, { error: 'Method not allowed' })
  } catch (err) {
    const statusCode = err?.statusCode || 500
    return json(statusCode, { error: String(err?.message || err) })
  }
}
