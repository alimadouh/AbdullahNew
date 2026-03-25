import { neon } from '@netlify/neon'

const sql = neon()

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS phq9_sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      response JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  // Auto-clean sessions older than 1 hour
  await sql`DELETE FROM phq9_sessions WHERE created_at < NOW() - INTERVAL '1 hour'`
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    await ensureTable()
    const body = await req.json()
    const { action, sessionId, response } = body

    if (action === 'create') {
      const id = crypto.randomUUID()
      await sql`INSERT INTO phq9_sessions (id) VALUES (${id})`
      return new Response(JSON.stringify({ sessionId: id }), { headers: { 'Content-Type': 'application/json' } })
    }

    if (action === 'scan') {
      await sql`UPDATE phq9_sessions SET status = 'scanned' WHERE id = ${sessionId} AND status = 'pending'`
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    if (action === 'submit') {
      await sql`UPDATE phq9_sessions SET status = 'submitted', response = ${JSON.stringify(response)} WHERE id = ${sessionId}`
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    if (action === 'poll') {
      const rows = await sql`SELECT status, response FROM phq9_sessions WHERE id = ${sessionId}`
      if (rows.length === 0) return new Response(JSON.stringify({ status: 'expired' }), { headers: { 'Content-Type': 'application/json' } })
      const session = rows[0]
      // Delete session after doctor reads the submitted response
      if (session.status === 'submitted') {
        await sql`DELETE FROM phq9_sessions WHERE id = ${sessionId}`
      }
      return new Response(JSON.stringify({ status: session.status, response: session.response }), { headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
