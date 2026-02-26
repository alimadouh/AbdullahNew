export function normalizeKey(s) {
  return String(s || '').trim()
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
