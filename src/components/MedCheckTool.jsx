import { useEffect, useMemo, useRef, useState } from 'react'
import { ShieldPlus, LoaderCircle, Eraser, ArrowUp, UserRound, ChevronUp, ChevronDown } from 'lucide-react'
import { assess, LEVELS, cockcroftGault, contraindications } from '../lib/medcheck/engine.js'
import { MedicinePicker, PatientPanel } from './medcheck/Inputs.jsx'
import SafetyPanel from './medcheck/SafetyPanel.jsx'
import QuickPanel from './medcheck/QuickPanel.jsx'
import MedicineCard from './medcheck/MedicineCard.jsx'
import { LEVEL_META } from './medcheck/common.jsx'

// Medication Safety Checker (UK sources). Data: public/medcheck/kb.json, built by scripts/medcheck-uk (see SCHEMA.md).
let kbPromise = null
const loadKb = () => (kbPromise ??= fetch('/medcheck/kb.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json() }).then((k) => { if (k.format !== 'uk-medcheck-1') throw new Error('format'); return k }).catch((e) => { kbPromise = null; throw e }))

const EMPTY_PATIENT = { ageYears: null, sex: null, weightKg: null, pregnancy: null, trimester: null, breastfeeding: null, egfr: null, crcl: null, crclCreat: null, hepatic: null, allergyStatus: null, allergies: [], conditions: [], conditionsComplete: false }

function patientLine(kb, p) {
  const nr = 'not recorded'
  return [
    `age ${p.ageYears ?? nr}`, `sex ${p.sex ?? nr}`, `weight ${p.weightKg != null ? p.weightKg + ' kg' : nr}`,
    p.sex !== 'male' && `pregnant ${p.pregnancy ?? nr}${p.trimester ? ` (T${p.trimester})` : ''}`, p.sex !== 'male' && `breastfeeding ${p.breastfeeding ?? nr}`,
    `eGFR ${p.egfr ?? nr}`, `CrCl ${p.crcl ?? nr}`, `hepatic ${p.hepatic ?? nr}`,
    `allergies ${p.allergyStatus === 'nkda' ? 'none known' : p.allergyStatus === 'listed' ? p.allergies.map((a) => kb.allergens.find((x) => x.id === a.allergen)?.name ?? a.allergen).join(', ') : nr}`,
    `diagnoses ${p.conditions.length ? p.conditions.map((c) => kb.conditions.find((x) => x.id === c)?.name ?? c).join(', ') : nr}${p.conditionsComplete ? ' (list complete)' : ''}`,
  ].filter(Boolean).join('; ')
}

export default function MedCheckTool() {
  const [kb, setKb] = useState(null)
  const [error, setError] = useState(false)
  const [selection, setSelection] = useState([])
  const [medsComplete, setMedsComplete] = useState(false)
  const [patient, setPatient] = useState(EMPTY_PATIENT)
  const [panelVisible, setPanelVisible] = useState(true)
  const [resetN, setResetN] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [showPatient, setShowPatient] = useState(false) // patient details are optional and folded away by default
  const panelRef = useRef(null)

  useEffect(() => {
    let live = true
    loadKb().then((k) => live && setKb(k)).catch(() => live && setError(true))
    return () => { live = false }
  }, [])

  const result = useMemo(() => (kb ? assess(kb, selection, showPatient ? { ...patient, medsComplete } : { medsComplete }) : null), [kb, selection, patient, medsComplete, showPatient])
  const contra = useMemo(() => (kb ? contraindications(kb, selection) : []), [kb, selection])
  const patientRef = useRef(null)

  // keep a compact summary on screen when the safety panel scrolls out of view
  useEffect(() => {
    const el = panelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setPanelVisible(e.isIntersecting), { rootMargin: '-64px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [kb, selection.length > 0])

  // a CrCl calculated from creatinine is kept in step with age, weight and sex (cleared if it can no longer be calculated)
  const set = (patch) => setPatient((p) => {
    const n = { ...p, ...patch }
    if (n.crclCreat != null && ['ageYears', 'weightKg', 'sex'].some((k) => k in patch && patch[k] !== p[k])) {
      const cg = Number.isFinite(n.ageYears) && n.ageYears < 18 ? null : cockcroftGault({ ageYears: n.ageYears, weightKg: n.weightKg, sex: n.sex, creatinine: n.crclCreat })
      n.crcl = cg ? cg.value : null
      if (!cg) n.crclCreat = null
    }
    return n
  })
  const focusField = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const target = el.matches('input,select,button') ? el : el.querySelector('input,select,button')
    setTimeout(() => target?.focus({ preventScroll: true }), 350)
  }
  const reset = () => { setSelection([]); setPatient(EMPTY_PATIENT); setMedsComplete(false); setResetN((x) => x + 1) }

  if (error) return <p className="mx-auto max-w-xl rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">Could not load the medicine data, so nothing was checked. Check the connection and open the tool again.</p>
  if (!kb) return <div className="flex justify-center py-16" role="status" aria-label="Loading"><LoaderCircle className="h-7 w-7 animate-spin text-blue-600" /></div>

  const medLabels = selection.map((s) => { const m = kb.medicines.find((x) => x.id === s.medId); const f = m?.formulations.find((x) => x.id === s.formId); return m ? `${m.name} ${f ? '(' + f.label.toLowerCase() + ')' : ''}`.trim() : s.medId })
  const serious = result.findings.filter((f) => f.level === 'contraindicated' || f.level === 'avoid')

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card px-4 py-3 shadow-sm sm:px-5">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-blue-600"><ShieldPlus className="h-5 w-5" />Medication Safety Checker</h2>
          <p className="text-xs text-muted-foreground">UK sources: SmPC · MHRA · NICE · SPS · UKTIS/BUMPS · {kb.medicines.length} medicines · quotes checked {kb.verification.checkedAt.slice(0, 10)}</p>
        </div>
        {(selection.length > 0 || patient !== EMPTY_PATIENT) && <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"><Eraser className="h-3.5 w-3.5" />Clear all</button>}
      </div>

      <div className={`mb-4 grid gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5 ${showPatient ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8' : ''}`}>
        <div>
          <MedicinePicker kb={kb} selection={selection} setSelection={setSelection} medsComplete={medsComplete} setMedsComplete={setMedsComplete} showComplete={showPatient} />
          {!showPatient && (
            <button type="button" id="mc-show-patient" onClick={() => setShowPatient(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
              <UserRound className="h-3.5 w-3.5" />Check against a patient (optional)
            </button>
          )}
        </div>
        {showPatient && (
          <div className="relative border-t pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <button type="button" onClick={() => setShowPatient(false)} className="absolute right-0 top-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground lg:top-0"><ChevronUp className="h-3.5 w-3.5" />Hide</button>
            <PatientPanel key={resetN} kb={kb} patient={patient} set={set} needed={new Set(result.missing.map((m) => m.field))} />
          </div>
        )}
      </div>

      {selection.length > 0 ? (
        <>
          <QuickPanel result={result} contra={contra} nDistinct={new Set(selection.map((s) => s.medId)).size} nCovered={kb.medicines.length} panelRef={panelRef} />
          {showPatient && <div className="mt-4"><SafetyPanel kb={kb} result={result} selection={selection} panelRef={patientRef} onFocusField={focusField} ctx={{ medLabels, patientLine: patientLine(kb, patient) }} /></div>}
          <button type="button" id="mc-show-details" onClick={() => setShowDetails((x) => !x)} aria-expanded={showDetails}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} />{showDetails ? 'Hide' : 'Show'} full medicine details (dose, cautions, monitoring)
          </button>
          {showDetails && (
            <div className={`mt-3 grid gap-4 ${selection.length > 1 ? 'lg:grid-cols-2 2xl:grid-cols-3' : 'max-w-3xl'}`}>
              {selection.map((s) => <MedicineCard key={s.key} kb={kb} entry={s} findings={result.findings} patient={patient} onRemove={() => setSelection((all) => all.filter((x) => x.key !== s.key))} />)}
            </div>
          )}
        </>
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Add medicines to see how they interact and when each one must not be given.</p>
      )}

      {selection.length > 0 && !panelVisible && (
        <div className="no-print fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-40 border-t bg-card/95 py-2 pl-3 pr-16 lg:bottom-0 lg:pr-20 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-card/80" role="status" aria-live="polite">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {result.findings.length ? LEVELS.filter((l) => result.counts[l]).map((l) => { const M = LEVEL_META[l]; return <span key={l} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold ${M.cls}`}><M.Icon className="h-3.5 w-3.5" aria-hidden="true" />{result.counts[l]} {M.label}</span> })
                : !result.errors.length && <span className="text-xs text-muted-foreground">No issue found in the checks that could be run</span>}
              {result.errors.length > 0 && <span className="inline-flex items-center gap-1 rounded-md border border-red-400 bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-200">{result.errors.length} check{result.errors.length === 1 ? '' : 's'} failed</span>}
              {result.unknown.length > 0 && <span className="text-xs font-semibold text-red-700 dark:text-red-300">· {result.unknown.length} not in data, not checked</span>}
              {result.missing.length > 0 && <span className="text-xs text-amber-700 dark:text-amber-300">· {result.missing.length} item{result.missing.length === 1 ? '' : 's'} not assessed</span>}
              {serious[0] && <span className="w-full truncate text-xs font-medium md:w-auto">{serious[0].concern}: {serious[0].meds.join(' + ')}{serious.length > 1 ? ` (+${serious.length - 1} more)` : ''}</span>}
            </div>
            <button type="button" onClick={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"><ArrowUp className="h-3.5 w-3.5" />Findings</button>
          </div>
        </div>
      )}
    </div>
  )
}
