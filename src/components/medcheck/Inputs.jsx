import { useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

const normq = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const fieldCls = 'h-9 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

// ---------- medicine search ----------
export function MedicinePicker({ kb, selection, setSelection }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const inputRef = useRef(null)
  const index = useMemo(() => kb.medicines.flatMap((m) => m.formulations.map((f) => ({
    m, f, key: `${m.id}:${f.id}`,
    hay: normq([m.name, ...(m.searchTerms ?? []), ...(m.ingredients ?? []).map((i) => kb.ingredientNames?.[i] ?? i), f.label, f.route].join(' ')),
    name: normq(m.name),
  }))), [kb])
  const results = useMemo(() => {
    const n = normq(q)
    if (!n) return []
    const words = n.split(' ')
    return index.filter((x) => words.every((w) => x.hay.includes(w)))
      .sort((a, b) => (b.name.startsWith(n) - a.name.startsWith(n)) || a.m.name.localeCompare(b.m.name))
      .slice(0, 14)
  }, [q, index])

  const add = (r) => {
    setSelection((s) => [...s, { key: `${r.key}#${Date.now().toString(36)}`, medId: r.m.id, formId: r.f.id }])
    setQ(''); setOpen(false); setHi(0); inputRef.current?.focus()
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && results[hi]) { e.preventDefault(); add(results[hi]) }
    else if (e.key === 'Escape') setOpen(false)
  }
  const med = (id) => kb.medicines.find((m) => m.id === id)

  return (
    <section aria-labelledby="mc-meds">
      <h3 id="mc-meds" className="mb-2 text-sm font-semibold">Medicines</h3>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input ref={inputRef} id="mc-search" type="search" value={q} autoComplete="off" spellCheck={false}
          placeholder="Search by generic name…" aria-label="Search medicines by generic name"
          role="combobox" aria-expanded={open && results.length > 0} aria-controls="mc-search-results" aria-autocomplete="list"
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0) }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKey}
          className={`${fieldCls} h-10 pl-8`} />
        {open && q && (
          <ul id="mc-search-results" role="listbox" className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-lg border bg-card p-1 shadow-lg">
            {results.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No medicine in this database matches “{q}”. Only {kb.medicines.length} medicines are covered.</li>}
            {results.map((r, i) => (
              <li key={r.key} role="option" aria-selected={i === hi} onMouseDown={(e) => { e.preventDefault(); add(r) }} onMouseEnter={() => setHi(i)}
                className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-md px-3 py-2 text-sm ${i === hi ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
                <span className="font-medium">{r.m.name}</span>
                <span className="text-right text-xs text-muted-foreground">{r.f.label}{r.f.route ? ` · ${r.f.route}` : ''}{(r.m.availability?.status === 'no-uk-product' || r.f.availability === 'no-uk-product') && <span className="ml-1.5 rounded bg-slate-200 px-1 py-px text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">no UK product</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selection.length > 0 ? (
        <ul className="mt-2.5 space-y-1.5" aria-label="Selected medicines">
          {selection.map((s) => {
            const m = med(s.medId)
            if (!m) return <li key={s.key} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700">Unknown medicine “{s.medId}” (not in the data file)</li>
            return (
              <li key={s.key} className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.name}</span>
                {m.formulations.length > 1 ? (
                  <select aria-label={`${m.name} formulation`} value={s.formId} onChange={(e) => setSelection((all) => all.map((x) => x.key === s.key ? { ...x, formId: e.target.value } : x))}
                    className="h-7 max-w-[11rem] rounded-md border bg-card px-1.5 text-xs">
                    {m.formulations.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                ) : <span className="text-xs text-muted-foreground">{m.formulations[0].label}</span>}
                <button type="button" onClick={() => setSelection((all) => all.filter((x) => x.key !== s.key))} aria-label={`Remove ${m.name}`}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
              </li>
            )
          })}
        </ul>
      ) : <p className="mt-2.5 text-sm text-muted-foreground">Add the medicines to check, including any OTC or herbal products.</p>}

    </section>
  )
}
