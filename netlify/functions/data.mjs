import { ensureSchema, sql, DEFAULT_COLUMNS } from './_db.mjs'

function sanitizeColumns(cols) {
  return (Array.isArray(cols) ? cols : [])
    .map(c => String(c ?? '').trim())
    .filter(Boolean)
    .filter(c => !/^unnamed\b/i.test(c))
}

export const handler = async () => {
  try {
    await ensureSchema()

    const metaRows = await sql`SELECT columns FROM table_meta WHERE id = 1`
    const rawCols = metaRows?.[0]?.columns
    const columns = sanitizeColumns(rawCols)
    const finalCols = columns.length ? columns : DEFAULT_COLUMNS

    // If DB contains junk/unnamed columns from an old import, clean it up automatically.
    if (rawCols && JSON.stringify(rawCols) !== JSON.stringify(finalCols)) {
      await sql`
        UPDATE table_meta
        SET columns = ${JSON.stringify(finalCols)}::jsonb, updated_at = NOW()
        WHERE id = 1
      `
    }

    const dbRows = await sql`SELECT id, data FROM table_rows ORDER BY created_at ASC`
    const rows = (dbRows || []).map(r => ({ id: r.id, data: r.data }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columns: finalCols, rows }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err?.message || err) }),
    }
  }
}
