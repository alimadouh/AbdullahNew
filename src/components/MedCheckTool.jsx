import { useEffect, useRef, useState } from 'react'
import { ShieldPlus, Loader2 } from 'lucide-react'
import { mountMedCheck } from '../lib/medcheck/mount.js'
import './medcheck.css'

// Medication safety checker (from laborya mid). The knowledge base (~5 MB) loads only when the page opens.
let kbPromise = null
const loadKb = () => (kbPromise ??= fetch('/medcheck/kb.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json() }).catch(e => { kbPromise = null; throw e }))

export default function MedCheckTool({ dark }) {
  const root = useRef(null)
  const [kb, setKb] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let live = true
    loadKb().then(k => live && setKb(k)).catch(() => live && setError(true))
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!kb || !root.current) return
    return mountMedCheck(root.current, kb)
  }, [kb])

  return (
    <div className={`medcheck mx-auto w-full max-w-6xl${dark ? ' mc-dark' : ''}`}>
      <div className="mb-3 rounded-2xl border bg-card px-4 py-3 shadow-sm sm:px-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold" style={{ color: '#2563eb', margin: 0 }}>
          <ShieldPlus className="h-5 w-5" />
          Medication Safety Checker
        </h2>
      </div>

      {error && <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">Could not load the medicine data. Check the connection and open the tool again.</p>}
      {!kb && !error && (
        <div className="flex justify-center py-16" role="status" aria-label="Loading"><Loader2 className="h-7 w-7 animate-spin" style={{ color: '#2563eb' }} /></div>
      )}

      {kb && (
        <div ref={root}>
          <div className="grid">
            <section className="panel" aria-labelledby="mc-meds-h">
              <h2 id="mc-meds-h">Medicines &amp; supplements</h2>
              <div className="search">
                <label className="sr-only" htmlFor="mc-med-search">Search by generic or brand name</label>
                <div className="search-row">
                  <input id="mc-med-search" type="search" autoComplete="off" placeholder="Search medicine or brand…" role="combobox" aria-expanded="false" aria-controls="mc-med-results" />
                  <select id="mc-country" aria-label="Product market" defaultValue="all">
                    <option value="all">All</option>
                    <option value="KW">Kuwait</option>
                    <option value="US">US</option>
                    <option value="any">Generic</option>
                  </select>
                </div>
                <ul id="mc-med-results" className="results-list" role="listbox" hidden></ul>
              </div>
              <ul id="mc-med-list" className="entries" aria-live="polite"></ul>
              <p id="mc-med-empty" className="empty">No medicines yet.</p>
            </section>

            <section className="panel results" aria-labelledby="mc-res-h" aria-live="polite">
              <h2 id="mc-res-h">Results</h2>
              <div id="mc-summary" className="summary"></div>
              <div id="mc-between"></div>
              <div id="mc-profile"></div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
