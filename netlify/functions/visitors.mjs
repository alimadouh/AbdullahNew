import { ensureSchema, sql } from './_db.mjs'
import { verifyAdmin } from './_auth.mjs'

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

// Kuwait governorates by ISO 3166-2 code (KW-xx) and by name as Netlify may spell it
const GOV_BY_CODE = { KU: 'Capital', HA: 'Hawalli', FA: 'Farwaniya', AH: 'Ahmadi', JA: 'Jahra', MU: 'Mubarak Al-Kabeer' }
const GOV_BY_NAME = [[/asimah|capital|kuwait city/i, 'Capital'], [/hawall?i/i, 'Hawalli'], [/farwan/i, 'Farwaniya'],
  [/ahmadi/i, 'Ahmadi'], [/jahra/i, 'Jahra'], [/mubarak/i, 'Mubarak Al-Kabeer']]

// Netlify adds the visitor's approximate location as the x-nf-geo header (base64 JSON)
function geoOf(event) {
  const h = event.headers || {}
  let g = null
  const raw = h['x-nf-geo']
  if (raw) {
    try { g = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) } catch { try { g = JSON.parse(raw) } catch { g = null } }
  }
  const country = String(g?.country?.code || h['x-country'] || '').toUpperCase().slice(0, 2) || null
  let region = null
  if (country === 'KW' && g?.subdivision) {
    const code = String(g.subdivision.code || '').toUpperCase().replace(/^KW-/, '')
    region = GOV_BY_CODE[code] || (GOV_BY_NAME.find(([re]) => re.test(String(g.subdivision.name || ''))) || [])[1] || null
  }
  return { country, region }
}

export const handler = async (event) => {
  try {
    await ensureSchema()

    // POST - record a visit (public)
    if (event.httpMethod === 'POST') {
      const { country, region } = geoOf(event)
      await sql`INSERT INTO visitors (country, region) VALUES (${country}, ${region})`
      return json(200, { ok: true })
    }

    // GET - visitor stats for the admin dashboard
    if (event.httpMethod === 'GET') {
      verifyAdmin(event)
      const [total] = await sql`SELECT COUNT(*)::int AS count FROM visitors`
      const [today] = await sql`SELECT COUNT(*)::int AS count FROM visitors WHERE (visited_at AT TIME ZONE 'Asia/Kuwait')::date = (NOW() AT TIME ZONE 'Asia/Kuwait')::date`
      const [week] = await sql`SELECT COUNT(*)::int AS count FROM visitors WHERE visited_at >= NOW() - INTERVAL '7 days'`
      const [month] = await sql`SELECT COUNT(*)::int AS count FROM visitors WHERE visited_at >= NOW() - INTERVAL '30 days'`
      // Visits per Kuwait day for the growth chart (the client groups them into weeks / months)
      const daily = await sql`
        SELECT to_char((visited_at AT TIME ZONE 'Asia/Kuwait')::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
        FROM visitors GROUP BY 1 ORDER BY 1`
      // Where visits came from, all time and last 30 days
      const places = await sql`
        SELECT country, region, COUNT(*)::int AS count,
               COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '30 days')::int AS recent
        FROM visitors GROUP BY country, region`
      const [first] = await sql`SELECT MIN(visited_at) AS since FROM visitors WHERE country IS NOT NULL`
      return json(200, {
        total: total.count, today: today.count, week: week.count, month: month.count,
        daily, places, locationSince: first?.since || null,
      })
    }

    return json(405, { error: 'Method not allowed' })
  } catch (err) {
    const statusCode = err?.statusCode || 500
    return json(statusCode, { error: String(err?.message || err) })
  }
}
