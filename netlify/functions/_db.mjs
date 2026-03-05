import { neon } from '@netlify/neon'

export const sql = neon() // uses env NETLIFY_DATABASE_URL automatically

export const VALID_SECTIONS = ['clinic', 'vaccination', 'er-medication', 'er-guidelines']

export const DEFAULT_COLUMNS = [
  "Category",
  "Generic Name",
  "Dose",
  "Route",
  "Indications",
  "Contraindications"
]

export async function ensureSchema() {
  // Meta table: stores the current column order/names per section
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

  // Add section column to both tables (safe to run multiple times)
  await sql`ALTER TABLE table_meta ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'clinic'`
  await sql`ALTER TABLE table_rows ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'clinic'`

  // Feedback table
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Seed default meta for clinic section if missing
  const meta = await sql`SELECT id FROM table_meta WHERE section = 'clinic' LIMIT 1`
  if (meta.length === 0) {
    // Migrate existing id=1 row to have section='clinic', or insert fresh
    const old = await sql`SELECT id FROM table_meta WHERE id = 1`
    if (old.length > 0) {
      await sql`UPDATE table_meta SET section = 'clinic' WHERE id = 1`
    } else {
      await sql`
        INSERT INTO table_meta (id, columns, section)
        VALUES (1, ${JSON.stringify(DEFAULT_COLUMNS)}::jsonb, 'clinic')
      `
    }
  }
}
