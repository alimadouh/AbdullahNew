export function normalizeKey(s) {
  return String(s || '').trim()
}

/** Parse an age-based category string into months for sorting. Pregnant first, then birth, then months/years ascending. */
export function parseAgeMonths(category) {
  const s = String(category).trim().toLowerCase()
  if (s.includes('pregnant')) return -2
  if (s.includes('birth') || s.includes('24 hour')) return -1
  const numMatch = s.match(/([\d.]+)/)
  if (!numMatch) return 99998
  const num = parseFloat(numMatch[1])
  if (s.includes('year')) return num * 12
  if (s.includes('month')) return num
  return 99998
}

export function findColumnName(columns, candidates) {
  const lowerMap = new Map(columns.map(c => [String(c).toLowerCase(), c]))
  for (const cand of candidates) {
    const key = String(cand).toLowerCase()
    if (lowerMap.has(key)) return lowerMap.get(key)
  }
  // fuzzy contains
  for (const c of columns) {
    const lc = String(c).toLowerCase()
    for (const cand of candidates) {
      const lcan = String(cand).toLowerCase()
      if (lc.includes(lcan)) return c
    }
  }
  return null
}
