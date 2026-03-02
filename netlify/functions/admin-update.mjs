import { ensureSchema, sql, VALID_SECTIONS } from './_db.mjs'
import { verifyAdmin } from './_auth.mjs'
import crypto from 'node:crypto'

function sanitizeColumns(cols) {
  return (Array.isArray(cols) ? cols : [])
    .map(c => String(c ?? '').trim())
    .filter(Boolean)
    .filter(c => !/^unnamed\b/i.test(c))
}

function json(res, statusCode, bodyObj) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) }
}

export const handler = async (event) => {
  try {
    verifyAdmin(event)
    await ensureSchema()

    if (event.httpMethod !== 'POST') {
      return json(null, 405, { error: 'Method not allowed' })
    }

    const body = JSON.parse(event.body || '{}')
    const section = VALID_SECTIONS.includes(body.section) ? body.section : 'clinic'
    const columns = Array.isArray(body.columns) ? sanitizeColumns(body.columns) : null
    const rows = Array.isArray(body.rows) ? body.rows : null

    if (!columns || columns.length === 0) return json(null, 400, { error: 'columns is required' })
    if (!rows) return json(null, 400, { error: 'rows is required' })

    const rawCols = Array.isArray(body.columns) ? body.columns.map(c => String(c ?? '').trim()) : []
    const hasInvalid = rawCols.some(c => !c) || rawCols.some(c => /^unnamed\b/i.test(c))
    if (hasInvalid) {
      return json(null, 400, { error: 'Some column names are empty or invalid (e.g., "Unnamed"). Please ensure all columns are named.' })
    }
    const lower = new Set()
    for (const c of columns) {
      const lc = c.toLowerCase()
      if (lower.has(lc)) return json(null, 400, { error: `Duplicate column name: "${c}"` })
      lower.add(lc)
    }

    // Upsert meta for this section
    const existing = await sql`SELECT section FROM table_meta WHERE section = ${section} LIMIT 1`
    if (existing.length > 0) {
      await sql`
        UPDATE table_meta
        SET columns = ${JSON.stringify(columns)}::jsonb, updated_at = NOW()
        WHERE section = ${section}
      `
    } else {
      await sql`
        INSERT INTO table_meta (id, columns, section, updated_at)
        VALUES (${Math.floor(Math.random() * 2000000000)}, ${JSON.stringify(columns)}::jsonb, ${section}, NOW())
      `
    }

    // Replace rows for this section only
    await sql`DELETE FROM table_rows WHERE section = ${section}`

    for (const r of rows) {
      const id = String(r.id || crypto.randomUUID())
      const data = r.data && typeof r.data === 'object' ? r.data : {}
      // keep only known columns to avoid accidental junk
      const clean = {}
      for (const c of columns) clean[c] = data[c] ?? ''
      await sql`
        INSERT INTO table_rows (id, data, section, created_at, updated_at)
        VALUES (${id}, ${JSON.stringify(clean)}::jsonb, ${section}, NOW(), NOW())
      `
    }

    return json(null, 200, { ok: true })
  } catch (err) {
    const statusCode = err?.statusCode || 500
    return json(null, statusCode, { error: String(err?.message || err) })
  }
}
