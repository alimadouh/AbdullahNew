import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

function localDataPlugin() {
  return {
    name: 'local-data',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')

        // Local PHQ-9 session relay
        if (url.pathname === '/.netlify/functions/phq9' && req.method === 'POST') {
          try {
            const sql = neon(process.env.NETLIFY_DATABASE_URL)
            await sql`CREATE TABLE IF NOT EXISTS phq9_sessions (
              id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'pending',
              response JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`
            await sql`DELETE FROM phq9_sessions WHERE created_at < NOW() - INTERVAL '1 hour'`

            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const body = JSON.parse(Buffer.concat(chunks).toString())
            const { action, sessionId, response } = body

            let result
            if (action === 'create') {
              const id = crypto.randomUUID()
              await sql`INSERT INTO phq9_sessions (id) VALUES (${id})`
              result = { sessionId: id }
            } else if (action === 'scan') {
              await sql`UPDATE phq9_sessions SET status = 'scanned' WHERE id = ${sessionId} AND status = 'pending'`
              result = { ok: true }
            } else if (action === 'submit') {
              await sql`UPDATE phq9_sessions SET status = 'submitted', response = ${JSON.stringify(response)} WHERE id = ${sessionId}`
              result = { ok: true }
            } else if (action === 'poll') {
              const rows = await sql`SELECT status, response FROM phq9_sessions WHERE id = ${sessionId}`
              if (rows.length === 0) { result = { status: 'expired' } }
              else {
                const s = rows[0]
                if (s.status === 'submitted') await sql`DELETE FROM phq9_sessions WHERE id = ${sessionId}`
                result = { status: s.status, response: s.response }
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
            return
          } catch (e) {
            console.error('PHQ-9 error:', e.message)
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
            return
          }
        }

        if (url.pathname === '/.netlify/functions/data') {
          const section = url.searchParams.get('section')
          // Serve sections that aren't deployed to live site yet directly from DB
          const localSections = ['pediatrics']
          if (localSections.includes(section)) {
            try {
              const sql = neon(process.env.NETLIFY_DATABASE_URL)
              const meta = await sql`SELECT columns FROM table_meta WHERE section = ${section} LIMIT 1`
              const rows = await sql`SELECT id, data FROM table_rows WHERE section = ${section}`
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                columns: meta.length > 0 ? meta[0].columns : [],
                rows: rows.map(r => ({ id: r.id, data: r.data })),
              }))
              return
            } catch (e) {
              console.error('Local DB error:', e.message)
            }
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [localDataPlugin(), tailwindcss(), react()],
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'https://pcis-kw.com',
        changeOrigin: true,
        secure: true,
        bypass(req) {
          // Let the local middleware handle pediatrics section
          if (req.url?.includes('section=pediatrics')) return req.url
          // Let the local middleware handle phq9 sessions
          if (req.url?.includes('/phq9')) return req.url
        },
      },
    },
  },
})
