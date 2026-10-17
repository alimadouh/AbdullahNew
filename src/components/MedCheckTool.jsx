import { useEffect, useMemo, useRef, useState } from 'react'
import { ShieldPlus, LoaderCircle, Eraser, ArrowUp, ChevronDown } from 'lucide-react'
import { assess, LEVELS, contraindications } from '../lib/medcheck/engine.js'
import { MedicinePicker } from './medcheck/Inputs.jsx'
import QuickPanel from './medcheck/QuickPanel.jsx'
import MedicineCard from './medcheck/MedicineCard.jsx'
import { LEVEL_META } from './medcheck/common.jsx'

// Medication Safety Checker (UK sources). Data: public/medcheck/kb.json, built by scripts/medcheck-uk (see SCHEMA.md).
// Medicines only: one summary box (interactions + when not to give), full tables folded below.
let kbPromise = null
const loadKb = () => (kbPromise ??= fetch('/medcheck/kb.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json() }).then((k) => { if (k.format !== 'uk-medcheck-1') throw new Error('format'); return k }).catch((e) => { kbPromise = null; throw e }))

let detailsPromise = null
const loadDetails = (builtAt) => (detailsPromise ??= fetch('/medcheck/kb-details.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json() }).then((d) => { if (d.builtAt !== builtAt) throw new Error('version'); return d.sections }).catch((e) => { detailsPromise = null; throw e }))

const NO_PATIENT = {}

export default function MedCheckTool() {
  const [kb, setKb] = useState(null)
  const [error, setError] = useState(false)
  const [selection, setSelection] = useState([])
  const [panelVisible, setPanelVisible] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [details, setDetails] = useState(null) // medicine tables, loaded the first time they are opened
  const [detailsError, setDetailsError] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    let live = true
    loadKb().then((k) => live && setKb(k)).catch(() => live && setError(true))
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!showDetails || details || !kb) return
    let live = true
    setDetailsError(false)
    loadDetails(kb.builtAt).then((d) => live && setDetails(d)).catch(() => live && setDetailsError(true))
    return () => { live = false }
  }, [showDetails, details, kb])
  const kbFull = useMemo(() => (kb && details ? { ...kb, medicines: kb.medicines.map((m) => ({ ...m, sections: details[m.id] ?? {} })) } : null), [kb, details])

  const result = useMemo(() => (kb ? assess(kb, selection, NO_PATIENT) : null), [kb, selection])
  const contra = useMemo(() => (kb ? contraindications(kb, selection) : []), [kb, selection])

  // keep a compact summary on screen when the summary box scrolls out of view
  useEffect(() => {
    const el = panelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setPanelVisible(e.isIntersecting), { rootMargin: '-64px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [kb, selection.length > 0])

  if (error) return <p className="mx-auto max-w-xl rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">Could not load the medicine data, so nothing was checked. Check the connection and open the tool again.</p>
  if (!kb) return <div className="flex justify-center py-16" role="status" aria-label="Loading"><LoaderCircle className="h-7 w-7 animate-spin text-blue-600" /></div>

  const pairs = result.findings.filter((f) => f.kind === 'interaction' || f.kind === 'duplication')
  const serious = pairs.filter((f) => f.level === 'contraindicated' || f.level === 'avoid')

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card px-4 py-3 shadow-sm sm:px-5">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-blue-600"><ShieldPlus className="h-5 w-5" />Medication Safety Checker</h2>
          <p className="text-xs text-muted-foreground">UK sources: SmPC · MHRA · NICE · SPS · UKTIS/BUMPS · {kb.medicines.length} medicines · quotes checked {kb.verification.checkedAt.slice(0, 10)}</p>
        </div>
        {selection.length > 0 && <button type="button" onClick={() => setSelection([])} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"><Eraser className="h-3.5 w-3.5" />Clear all</button>}
      </div>

      <div className="mb-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <MedicinePicker kb={kb} selection={selection} setSelection={setSelection} />
      </div>

      {selection.length > 0 ? (
        <>
          {result.errors.length > 0 && <p role="alert" className="mb-3 rounded-lg border border-red-400 bg-red-50 p-2.5 text-sm font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-200">The interaction check failed. Do not rely on this result.</p>}
          <QuickPanel result={result} contra={contra} nDistinct={new Set(selection.map((s) => s.medId)).size} nCovered={kb.medicines.length} panelRef={panelRef} />
          <button type="button" id="mc-show-details" onClick={() => setShowDetails((x) => !x)} aria-expanded={showDetails}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} />{showDetails ? 'Hide' : 'Show'} full medicine details (dose, cautions, monitoring)
          </button>
          {showDetails && (detailsError ? <p className="mt-3 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">Could not load the medicine details. Check the connection and try again.</p>
            : !kbFull ? <div className="flex justify-center py-8" role="status" aria-label="Loading details"><LoaderCircle className="h-6 w-6 animate-spin text-blue-600" /></div>
            : (
            <div className={`mt-3 grid gap-4 ${selection.length > 1 ? 'lg:grid-cols-2 2xl:grid-cols-3' : 'max-w-3xl'}`}>
              {selection.map((s) => <MedicineCard key={s.key} kb={kbFull} entry={s} findings={result.findings} patient={NO_PATIENT} onRemove={() => setSelection((all) => all.filter((x) => x.key !== s.key))} />)}
            </div>
          ))}
        </>
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Add medicines to see how they interact and when each one must not be given.</p>
      )}

      {selection.length > 0 && !panelVisible && (
        <div className="no-print fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-40 border-t bg-card/95 py-2 pl-3 pr-16 lg:bottom-0 lg:pr-20 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-card/80" role="status" aria-live="polite">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {pairs.length ? LEVELS.filter((l) => pairs.some((f) => f.level === l)).map((l) => { const M = LEVEL_META[l]; const n = pairs.filter((f) => f.level === l).length; return <span key={l} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold ${M.cls}`}><M.Icon className="h-3.5 w-3.5" aria-hidden="true" />{n} {M.label}</span> })
                : <span className="text-xs text-muted-foreground">No interaction found</span>}
              {serious[0] && <span className="w-full truncate text-xs font-medium md:w-auto">{serious[0].meds.join(' + ')}{serious.length > 1 ? ` (+${serious.length - 1} more)` : ''}</span>}
            </div>
            <button type="button" onClick={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"><ArrowUp className="h-3.5 w-3.5" />Summary</button>
          </div>
        </div>
      )}
    </div>
  )
}
