import { neon } from '@netlify/neon'

export const sql = neon() // uses env NETLIFY_DATABASE_URL automatically

export const DEFAULT_COLUMNS = [
  "Category",
  "Generic Name",
  "Dose",
  "Route",
  "Indications",
  "Contraindications"
]

export async function ensureSchema() {
  // Meta table: stores the current column order/names
  await sql`
    CREATE TABLE IF NOT EXISTS table_meta (
      id INTEGER PRIMARY KEY,
      columns JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  // Row table: flexible JSON data per row
  await sql`
    CREATE TABLE IF NOT EXISTS table_rows (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  const meta = await sql`SELECT id FROM table_meta WHERE id = 1`
  if (meta.length === 0) {
    await sql`
      INSERT INTO table_meta (id, columns)
      VALUES (1, ${JSON.stringify(DEFAULT_COLUMNS)}::jsonb)
    `
  }
}
