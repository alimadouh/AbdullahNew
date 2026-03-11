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
        },
      },
    },
  },
})
