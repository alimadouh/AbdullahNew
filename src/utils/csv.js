import Papa from 'papaparse'

export function exportToCsv({ columns, rows }) {
  const data = rows.map(r => {
    const obj = {}
    for (const c of columns) obj[c] = (r.data || {})[c] ?? ''
    return obj
  })
  const csv = Papa.unparse(data, { columns })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'medications.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function importFromCsvFile(file) {
  const text = await file.text()
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
  if (parsed.errors?.length) {
    const e = parsed.errors[0]
    throw new Error(`CSV parse error: ${e.message} (row ${e.row})`)
  }
  const columns = (parsed.meta.fields || [])
    .map(f => String(f ?? '').trim())
    .filter(Boolean)
    // Common when exporting from Excel: blank headers or "Unnamed: X"
    .filter(c => !/^unnamed\b/i.test(c))

  if (columns.some(c => !c.trim())) {
    throw new Error('CSV has empty column names. Please name all columns before importing.')
  }
  const rows = (parsed.data || []).map(obj => {
    const data = {}
    for (const c of columns) data[c] = obj[c] ?? ''
    return { data }
  })
  return { columns, rows }
}
