import { findColumnName } from './columns.js'

function safeLower(v) {
  return String(v ?? '').trim().toLowerCase()
}

export function groupRows({ columns, rows, categoryFilter, searchQuery }) {
  const categoryCol = findColumnName(columns, ['category'])
  const routeCol = findColumnName(columns, ['route'])
  const q = safeLower(searchQuery)

  // filter by category + search
  const filtered = rows.filter(r => {
    const values = r.data || {}
    if (categoryFilter && categoryFilter !== '__ALL__' && categoryCol) {
      const catVal = String(values[categoryCol] ?? '').trim()
      if (catVal !== categoryFilter) return false
    }
    if (q) {
      const hay = columns.map(c => String(values[c] ?? '')).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  // group category -> route
  const catMap = new Map()
  for (const r of filtered) {
    const values = r.data || {}
    const cat = categoryCol ? String(values[categoryCol] ?? 'Uncategorized').trim() : 'All'
    if (!catMap.has(cat)) catMap.set(cat, [])
    catMap.get(cat).push(r)
  }

  const cats = Array.from(catMap.keys()).sort((a, b) => a.localeCompare(b))

  const output = []
  for (const cat of cats) {
    const rowsInCat = catMap.get(cat)
    const routeMap = new Map()
    for (const r of rowsInCat) {
      const values = r.data || {}
      const route = routeCol ? String(values[routeCol] ?? 'Other').trim() : 'All'
      if (!routeMap.has(route)) routeMap.set(route, [])
      routeMap.get(route).push(r)
    }
    const routes = Array.from(routeMap.keys()).sort((a, b) => a.localeCompare(b))
    const routeGroups = routes.map(route => {
      const groupRows = routeMap.get(route)
      // stable sort inside group by "Generic Name" if present, otherwise leave as-is
      const genericCol = findColumnName(columns, ['generic name', 'generic'])
      const sortedRows = [...groupRows].sort((a, b) => {
        if (!genericCol) return 0
        const av = String((a.data || {})[genericCol] ?? '')
        const bv = String((b.data || {})[genericCol] ?? '')
        return av.localeCompare(bv)
      })
      return { route, rows: sortedRows }
    })
    output.push({ category: cat, routes: routeGroups })
  }

  return { categoryCol, routeCol, groups: output, filteredCount: filtered.length }
}
