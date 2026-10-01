import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pill, Syringe, Cross, List, Loader2, AlertCircle, Calculator, ShieldCheck, ShieldAlert } from 'lucide-react'
import { prefetchData } from '../utils/api.js'
import { findColumnName } from '../utils/columns.js'
import { medImageFor } from './MedImage.jsx'
import ZoomImage from './ZoomImage.jsx'
import { MedicationDetails, DoseCalculator, isMonographV2, parseCalc } from './MedicationDetails.jsx'
import { OutOfStockBadge, KuwaitFlag, SubFieldDisplay, IND_FIELDS, CONTRA_FIELDS } from './DataTable.jsx'

// One medicine on its own page: pack photo on top, the key facts, the dose calculator
// and the full guidance below. Opened from the home search and the photo shelf.

const SECTION_META = {
  clinic: { label: 'Clinic Medications', Icon: Pill },
  'er-medication': { label: 'ER Medication', Icon: Cross },
  vaccination: { label: 'Vaccination', Icon: Syringe },
}

export default function MedPage({ section, id, color, onBack, onShowInList }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    setData(null); setErr('')
    prefetchData(section).then((d) => alive && setData(d)).catch((e) => alive && setErr(String(e?.message || e)))
    return () => { alive = false }
  }, [section])

  const view = useMemo(() => {
    if (!data) return null
    const cols = data.columns || []
    const row = (data.rows || []).find((r) => r.id === id)
    if (!row) return { missing: true }
    const d = row.data || {}
    const col = (names) => findColumnName(cols, names)
    const nameCol = col(['trading name', 'trading'])
    const genCol = col(['generic name', 'generic', 'medication', 'vaccine'])
    const indCol = col(['indications'])
    const contraCol = col(['contraindications'])
    const text = (c) => { const v = c ? String(d[c] ?? '').trim() : ''; return /^[-–—]+$/.test(v) ? '' : v }
    const generic = text(genCol)
    const name = text(nameCol) || generic
    // Every other filled column becomes a fact tile, in the table's own column order
    const skip = new Set([nameCol, genCol, indCol, contraCol].filter(Boolean))
    const facts = cols
      .filter((c) => !skip.has(c) && !String(c).startsWith('__'))
      .map((c) => ({ label: c, value: typeof d[c] === 'object' ? '' : text(c) }))
      .filter((f) => f.value)
    const ind = indCol ? d[indCol] : null
    const contra = contraCol ? d[contraCol] : null
    return {
      row, name, generic: generic !== name ? generic : '', facts, ind, contra,
      v2: isMonographV2(ind) || isMonographV2(contra),
      calcs: ind && typeof ind === 'object' ? parseCalc(ind.calc) : [],
      img: medImageFor(row),
      kuwait: Boolean(d.__kuwait__), oos: String(d.__oos__ || '') === '1',
    }
  }, [data, id])

  const meta = SECTION_META[section] || SECTION_META.clinic
  const top = (
    <div className="mb-4 flex items-center justify-between gap-2">
      <button type="button" onClick={onBack} className="nav-press inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-3.5 text-sm font-semibold cursor-pointer hover:bg-accent">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
        <meta.Icon className="h-3.5 w-3.5" /> {meta.label}
      </span>
    </div>
  )

  if (err) {
    return <div className="mx-auto max-w-3xl px-4 py-6">{top}<p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> {err}</p></div>
  }
  if (!view) {
    return <div className="mx-auto max-w-3xl px-4 py-6">{top}<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></div>
  }
  if (view.missing) {
    return <div className="mx-auto max-w-3xl px-4 py-6">{top}<p className="text-sm text-muted-foreground">This medicine was not found. It may have been removed.</p></div>
  }

  const { name, generic, facts, ind, contra, v2, calcs, img, kuwait, oos } = view
  return (
    <div className="no-print mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      {top}

      <article className="home-results overflow-hidden rounded-2xl border bg-card">
        {/* Pack photo */}
        {img ? (
          <ZoomImage src={img} alt={name} className="border-b bg-white" imgClassName="mx-auto h-72 w-full object-contain p-5 sm:h-96 sm:p-8" />
        ) : (
          <div className="flex h-36 items-center justify-center border-b" style={{ background: color + '14', color }}>
            <meta.Icon className="h-12 w-12 opacity-70" />
          </div>
        )}

        {/* Name + key facts */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-2">
            <h2 className="font-display min-w-0 flex-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{name}</h2>
            {kuwait && <KuwaitFlag className="mt-1.5 h-5 shrink-0" />}
          </div>
          {generic && <p className="mt-1 text-[15px] text-muted-foreground">{generic}</p>}
          {oos && <OutOfStockBadge className="mt-2" />}

          {facts.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className={`min-w-0 rounded-xl border bg-background/60 px-3 py-2.5 ${f.value.length > 16 ? 'col-span-2 sm:col-span-1' : ''}`}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <button
            type="button"
            onClick={() => onShowInList(name)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:underline underline-offset-2"
            style={{ color }}
          >
            <List className="h-3.5 w-3.5" /> Show in {meta.label} list
          </button>
        </div>
      </article>

      {/* Dose calculator, open on the page */}
      {calcs.length > 0 && (
        <section className="mt-4 rounded-2xl border bg-card p-4 sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color }}>
            <Calculator className="h-4 w-4" /> Dose calculator
          </h3>
          <DoseCalculator calcs={calcs} bare />
        </section>
      )}

      {/* Full guidance */}
      {v2 ? (
        <section className="mt-4">
          {/* the calculator is already open above, so it is left out of the Dose section here */}
          <MedicationDetails ind={isMonographV2(ind) ? { ...ind, calc: '' } : {}} contra={isMonographV2(contra) ? contra : {}} />
        </section>
      ) : (ind || contra) ? (
        <section className="mt-4 space-y-3">
          {ind && (
            <div className="rounded-2xl border bg-primary/5 border-primary/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><ShieldCheck className="h-4 w-4 text-primary" /> Indications</div>
              <SubFieldDisplay fields={IND_FIELDS} value={ind} color="primary" />
            </div>
          )}
          {contra && (
            <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" /> Contraindications</div>
              <SubFieldDisplay fields={CONTRA_FIELDS} value={contra} color="red" />
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
