import { useState } from 'react'
import { X, ChevronDown, Pill, TriangleAlert } from 'lucide-react'
import { calcDose } from '../../lib/medcheck/engine.js'
import { LevelBadge, sourceShort } from './common.jsx'

// Fixed row order so medicines are easy to compare side by side.
const ROWS = [
  ['indications', 'Indications'],
  ['restrictions', 'Prescribing restrictions'],
  ['dosing', 'Dose (adults)'],
  ['paediatric', 'Children'],
  ['contraindications', 'Contraindications'],
  ['cautions', 'Cautions'],
  ['interactions', 'Interactions'],
  ['renal', 'Kidney impairment'],
  ['hepatic', 'Liver impairment'],
  ['pregnancy', 'Pregnancy'],
  ['breastfeeding', 'Breastfeeding'],
  ['reproductive', 'Fertility & contraception'],
  ['adverseCommon', 'Common side effects'],
  ['adverseSerious', 'Serious side effects: act now'],
  ['monitoring', 'Monitoring'],
  ['administration', 'How to take / give'],
  ['counselling', 'Patient counselling'],
]
// which table row a patient-specific finding belongs to
const ROW_OF = { renal: 'renal', hepatic: 'hepatic', pregnancy: 'pregnancy', breastfeeding: 'breastfeeding', age: 'paediatric', interaction: 'interactions', allergy: 'contraindications', duplication: 'formulation' }
const rowForFinding = (f) => (f.kind === 'condition' ? (f.level === 'contraindicated' ? 'contraindications' : 'cautions') : ROW_OF[f.kind])

function Refs({ src, num }) {
  const seen = new Set()
  src = src.filter((r) => !seen.has(r.s) && seen.add(r.s))
  return (
    <span className="ml-0.5 whitespace-nowrap align-super text-[10px]">
      {src.map((r, i) => (
        <a key={i} href={`#${num.anchor}-${num.of(r.s)}`} title={r.q} className="ml-0.5 font-semibold text-blue-700 hover:underline dark:text-blue-300">[{num.of(r.s)}]</a>
      ))}
    </span>
  )
}

function Item({ it, num, weightKg, ageYears }) {
  const dose = it.calc ? calcDose(it.calc, weightKg, ageYears) : null
  return (
    <li className="leading-snug">
      {it.tag && <span className="font-semibold">{it.tag}: </span>}
      <span>{it.t}</span>
      <Refs src={it.src} num={num} />
      {!it.v && <span className="ml-1 rounded bg-red-100 px-1 text-[10px] font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">Unverified</span>}
      {it.calc && (
        <div className="mt-1 rounded-md border border-violet-200 bg-violet-50/70 px-2 py-1 text-[12px] dark:border-violet-900 dark:bg-violet-950/30">
          {dose ? (
            <>
              <span className="font-semibold">For {weightKg} kg:</span> {dose.steps.join('; ')}
              {dose.notes.map((n, i) => <div key={i} className="text-amber-800 dark:text-amber-300">{n}</div>)}
              <div className="text-[11px] text-muted-foreground">Check the result against the source dose table before prescribing.</div>
            </>
          ) : <span className="text-muted-foreground">Enter the patient's weight to calculate this weight-based dose.</span>}
        </div>
      )}
    </li>
  )
}

function Row({ k, label, section, formId, num, findings, weightKg, ageYears }) {
  const [more, setMore] = useState(false)
  const items = (section?.items ?? []).filter((it) => !it.formulations?.length || it.formulations.includes(formId))
  const main = items.filter((x) => !x.detail), extra = items.filter((x) => x.detail)
  const shown = more ? items : main.length ? main : items.slice(0, 2)
  const hidden = items.length - shown.length
  const urgent = k === 'contraindications' || k === 'adverseSerious'
  return (
    <div className="grid gap-x-3 gap-y-1 border-t px-3 py-2.5 sm:grid-cols-[8.5rem_1fr]" data-row={k}>
      <div className="text-xs font-semibold text-muted-foreground">
        <div className={urgent ? 'text-red-800 dark:text-red-300' : ''}>{label}</div>
        {section?.items && <div className="mt-0.5 text-[10.5px] font-normal">{section.unverified ? <span className="text-red-700 dark:text-red-300">{section.unverified} unverified</span> : section.verifiedAt ? `Verified ${section.verifiedAt}` : ''}</div>}
      </div>
      <div className="min-w-0 text-[13px]">
        {findings.length > 0 && (
          <ul className="mb-1.5 space-y-1">
            {findings.map((f) => (
              <li key={f.key} className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed border-orange-300 bg-orange-50/60 px-2 py-1 text-xs dark:border-orange-800 dark:bg-orange-950/30">
                <TriangleAlert className="h-3.5 w-3.5 text-orange-700 dark:text-orange-300" aria-hidden="true" />
                <span className="font-semibold">Applies to this patient:</span> {f.concern}{f.factor ? ` (${f.factor})` : ''} <LevelBadge level={f.level} size="xs" />
              </li>
            ))}
          </ul>
        )}
        {section?.status === 'not-stated' || !items.length ? (
          <p className="italic text-muted-foreground">{section?.status === 'not-stated' ? `Not stated in the UK sources checked.${section.note ? ' ' + section.note : ''}` : 'Nothing stated for this formulation.'}</p>
        ) : (
          <ul className="space-y-1">{shown.map((it, i) => <Item key={i} it={it} num={num} weightKg={weightKg} ageYears={ageYears} />)}</ul>
        )}
        {(hidden > 0 || (more && extra.length > 0)) && (
          <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <ChevronDown className={`h-3 w-3 transition-transform ${more ? 'rotate-180' : ''}`} />{more ? 'Show less' : `${hidden} more`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function MedicineCard({ kb, entry, findings, onRemove, patient }) {
  const m = kb.medicines.find((x) => x.id === entry.medId)
  if (!m) return null
  const f = m.formulations.find((x) => x.id === entry.formId) ?? m.formulations[0]
  // number sources in order of first use within this card
  const order = []
  const add = (id) => { if (!order.includes(id)) order.push(id) }
  for (const r of f.src ?? []) add(r.s)
  for (const [k] of ROWS) for (const it of m.sections[k]?.items ?? []) if (!it.formulations?.length || it.formulations.includes(f.id)) for (const r of it.src) add(r.s)
  const anchor = `mc-src-${entry.key.replace(/[^a-z0-9]/gi, '')}`
  const num = { anchor, of: (id) => order.indexOf(id) + 1 }
  const mine = findings.filter((x) => x.items.includes(entry.key))
  const byRow = (k) => mine.filter((x) => rowForFinding(x) === k)
  const ing = m.ingredients.map((i) => kb.ingredientNames?.[i] ?? i)

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label={m.name}>
      <header className="flex items-start gap-3 border-b bg-muted/40 px-3 py-3">
        <div className="mt-0.5 rounded-lg bg-blue-600/10 p-1.5 text-blue-700 dark:text-blue-300"><Pill className="h-4 w-4" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-tight">{m.name}</h3>
          <p className="text-xs text-muted-foreground">{m.className}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded-md border bg-card px-1.5 py-0.5 text-[11px] font-medium">{f.label}</span>
            {f.route && <span className="rounded-md border bg-card px-1.5 py-0.5 text-[11px]">{f.route}</span>}
            {f.release && f.release !== 'immediate' && f.release !== 'n/a' && <span className="rounded-md border border-violet-300 bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">{f.release}</span>}
            {mine.length > 0 && <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-900 dark:bg-orange-950 dark:text-orange-200">{mine.length} finding{mine.length === 1 ? '' : 's'} above</span>}
          </div>
        </div>
        <button type="button" onClick={onRemove} aria-label={`Remove ${m.name}`} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
      </header>

      <div className="flex-1">
        <div className="grid gap-x-3 gap-y-1 px-3 py-2.5 sm:grid-cols-[8.5rem_1fr]" data-row="formulation">
          <div className="text-xs font-semibold text-muted-foreground">Formulation</div>
          <div className="text-[13px]">
            {byRow('formulation').map((x) => <p key={x.key} className="mb-1 text-xs font-semibold text-orange-800 dark:text-orange-300">{x.concern}</p>)}
            <p><b>{f.label}</b>{f.route ? `, ${f.route}` : ''}{f.strengths ? ` · ${f.strengths}` : ''}{f.src?.length ? <Refs src={f.src} num={num} /> : null}</p>
            {ing.length > 1 && <p className="text-xs text-muted-foreground">Contains: {ing.join(' + ')}</p>}
            {f.note && <p className="mt-0.5 text-xs">{f.note}</p>}
            {m.brandPrescribing && <p className="mt-1 rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-900 dark:bg-violet-950/40 dark:text-violet-200">Brand prescribing: {m.brandPrescribing.t}<Refs src={m.brandPrescribing.src} num={num} /></p>}
          </div>
        </div>
        {ROWS.map(([k, label]) => <Row key={k} k={k} label={label} section={m.sections[k]} formId={f.id} num={num} findings={byRow(k)} weightKg={patient.weightKg} ageYears={patient.ageYears} />)}
      </div>

      <footer className="border-t bg-muted/30 px-3 py-2.5 text-[11px]">
        <p className="mb-1 font-semibold text-muted-foreground">Sources</p>
        <ol className="space-y-0.5">
          {order.map((id, i) => {
            const s = kb.sources[id]
            return (
              <li key={id} id={`${anchor}-${i + 1}`} className="scroll-mt-24">
                [{i + 1}] {s ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline-offset-2 hover:underline dark:text-blue-300">{sourceShort(s)}</a> : id}
                {s?.publisher && <span className="text-muted-foreground"> · {s.publisher}</span>}
                {s?.version && <span className="text-muted-foreground"> · {s.version}</span>}
                <span className="text-muted-foreground"> · {s?.checked ? `checked ${s.checked}` : 'could not be checked'}</span>
              </li>
            )
          })}
          <li className="text-muted-foreground">BNF/BNFC: not accessed (only available in the UK).</li>
        </ol>
      </footer>
    </article>
  )
}
