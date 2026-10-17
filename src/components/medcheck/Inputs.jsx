import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, Calculator } from 'lucide-react'
import { Segmented } from './common.jsx'
import { REACTION_GROUPS, HEPATIC_LEVELS, cockcroftGault } from '../../lib/medcheck/engine.js'

const normq = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const fieldCls = 'h-9 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

// ---------- medicine search ----------
export function MedicinePicker({ kb, selection, setSelection, medsComplete, setMedsComplete }) {
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
                <span className="text-right text-xs text-muted-foreground">{r.f.label}{r.f.route ? ` · ${r.f.route}` : ''}</span>
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

      <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs">
        <input id="mc-meds-complete" type="checkbox" checked={medsComplete} onChange={(e) => setMedsComplete(e.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-600" />
        <span>This is the patient's <b>full</b> medicine list, including OTC and herbal products</span>
      </label>
    </section>
  )
}

// ---------- patient context ----------
function Field({ label, htmlFor, children, hint, need }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        {label}
        {need && <span className="rounded bg-amber-100 px-1 py-px text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300" title="A rule for the selected medicines depends on this">needed</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
const num = (v) => (v === '' || v == null ? null : Number(v))

// Number box that only passes on valid values. Invalid or out-of-range input is shown as an error and treated as
// "not recorded" (null), never as a value.
function NumInput({ id, value, onValue, min = 0, max, minExclusive = false, placeholder = '—', unit, className = '' }) {
  const [raw, setRaw] = useState(value ?? '')
  const last = useRef(value ?? null) // last value this box sent up; anything else is an outside change (reset, calculator)
  useEffect(() => { if ((value ?? null) !== last.current) { last.current = value ?? null; setRaw(value ?? '') } }, [value])
  const v = num(raw)
  const bad = raw !== '' && (!Number.isFinite(v) || (minExclusive ? v <= min : v < min) || (max != null && v > max))
  return (
    <>
      <input id={id} type="number" inputMode="decimal" step="any" min={min} max={max} placeholder={placeholder} value={raw} aria-invalid={bad || undefined}
        onChange={(e) => { const r = e.target.value; setRaw(r); const n = num(r); const ok = r !== '' && Number.isFinite(n) && (minExclusive ? n > min : n >= min) && (max == null || n <= max); last.current = ok ? n : null; onValue(ok ? n : null) }}
        className={`${fieldCls} ${bad ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`} />
      {bad && <p role="alert" className="mt-1 text-[11px] font-medium text-red-700 dark:text-red-300">Enter a number {minExclusive ? 'above' : 'from'} {min}{max != null ? ` up to ${max}` : ''}{unit ? ` ${unit}` : ''}. Treated as not recorded.</p>}
    </>
  )
}

function Picker({ id, placeholder, options, onPick, exclude = [] }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const list = useMemo(() => {
    const n = normq(q)
    return options.filter((o) => !exclude.includes(o.id) && (!n || normq(o.name).includes(n))).slice(0, 40)
  }, [q, options, exclude])
  return (
    <div className="relative">
      <input id={id} type="search" value={q} placeholder={placeholder} autoComplete="off" onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} className={fieldCls} />
      {open && (
        <ul role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-card p-1 shadow-lg">
          {list.length === 0 && <li className="px-3 py-2 text-xs text-muted-foreground">No match in this list. Only listed items can be checked.</li>}
          {list.map((o) => (
            <li key={o.id} role="option" aria-selected="false" onMouseDown={(e) => { e.preventDefault(); onPick(o); setQ(''); setOpen(false) }}
              className="cursor-pointer rounded-md px-2.5 py-1.5 text-sm hover:bg-muted">
              {o.name}{o.kind === 'group' && <span className="ml-1 text-xs text-muted-foreground">(group)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PatientPanel({ kb, patient, set, needed = new Set() }) {
  const [calcOpen, setCalcOpen] = useState(false)
  const [creat, setCreat] = useState(patient.crclCreat ?? null)
  const child = Number.isFinite(patient.ageYears) && patient.ageYears < 18
  const cg = child ? null : cockcroftGault({ ageYears: patient.ageYears, weightKg: patient.weightKg, sex: patient.sex, creatinine: creat })
  const female = patient.sex !== 'male'
  const NR = { value: null, label: 'Not recorded' }

  return (
    <section aria-labelledby="mc-patient">
      <h3 id="mc-patient" className="mb-2 text-sm font-semibold">Patient</h3>
      <div className="grid grid-cols-3 gap-2.5">
        <Field label="Age (years)" htmlFor="mc-age" need={needed.has('age')}>
          <NumInput id="mc-age" value={patient.ageYears} onValue={(v) => set({ ageYears: v })} min={0} max={120} unit="years" />
        </Field>
        <Field label="Weight (kg)" htmlFor="mc-weight" need={needed.has('weight')}>
          <NumInput id="mc-weight" value={patient.weightKg} onValue={(v) => set({ weightKg: v })} min={0} minExclusive max={400} unit="kg" />
        </Field>
        <Field label="Sex" htmlFor="mc-sex">
          <select id="mc-sex" value={patient.sex ?? ''} onChange={(e) => set({ sex: e.target.value || null, ...(e.target.value === 'male' ? { pregnancy: null, trimester: null, breastfeeding: null } : {}) })} className={fieldCls}>
            <option value="">Not recorded</option><option value="female">Female</option><option value="male">Male</option>
          </select>
        </Field>
      </div>

      {female && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <Field label="Pregnant" htmlFor="mc-preg" need={needed.has('pregnancy') || needed.has('trimester')}>
            <Segmented id="mc-preg" label="Pregnant" value={patient.pregnancy} onChange={(v) => set({ pregnancy: v, ...(v !== 'yes' ? { trimester: null } : {}) })} options={[NR, { value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
            {patient.pregnancy === 'yes' && (
              <div className="mt-1.5"><Segmented label="Trimester" size="xs" value={patient.trimester} onChange={(v) => set({ trimester: v })} options={[{ value: null, label: 'Trimester ?' }, { value: 1, label: '1st' }, { value: 2, label: '2nd' }, { value: 3, label: '3rd' }]} /></div>
            )}
          </Field>
          <Field label="Breastfeeding" htmlFor="mc-bf" need={needed.has('breastfeeding')}>
            <Segmented id="mc-bf" label="Breastfeeding" value={patient.breastfeeding} onChange={(v) => set({ breastfeeding: v })} options={[NR, { value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
          </Field>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Field label="eGFR (mL/min/1.73 m²)" htmlFor="mc-egfr" need={needed.has('renal')}>
          <NumInput id="mc-egfr" value={patient.egfr} onValue={(v) => set({ egfr: v })} min={0} max={200} placeholder="Not recorded" />
        </Field>
        <Field label="CrCl (mL/min)" htmlFor="mc-crcl" need={needed.has('renal') || needed.has('crcl')}>
          <div className="flex gap-1">
            <div className="min-w-0 flex-1"><NumInput id="mc-crcl" value={patient.crcl} onValue={(v) => set({ crcl: v, crclCreat: null })} min={0} max={300} placeholder="Not recorded" /></div>
            <button type="button" onClick={() => setCalcOpen((o) => !o)} aria-expanded={calcOpen} title="Calculate creatinine clearance (Cockcroft-Gault)"
              className="shrink-0 rounded-lg border px-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Calculator className="h-4 w-4" /><span className="sr-only">Calculate CrCl</span></button>
          </div>
          {patient.crclCreat != null && patient.crcl != null && <p className="mt-1 text-[11px] text-muted-foreground">Cockcroft-Gault from creatinine {patient.crclCreat} µmol/L. It updates when age, weight or sex change.</p>}
        </Field>
      </div>
      {calcOpen && (
        <div className="mt-2 rounded-lg border border-dashed p-2.5 text-xs">
          <p className="font-semibold">Creatinine clearance (Cockcroft-Gault)</p>
          <div className="mt-1.5 flex items-center gap-2">
            <label htmlFor="mc-creat" className="shrink-0">Serum creatinine</label>
            <div className="w-28"><NumInput id="mc-creat" value={creat} onValue={setCreat} min={0} minExclusive max={3000} unit="µmol/L" className="h-8" /></div>
            <span className="shrink-0">µmol/L</span>
          </div>
          <p className="mt-1.5 text-muted-foreground">CrCl (mL/min) = (140 − age) × weight (kg) × F ÷ creatinine (µmol/L); F = 1.23 for men and 1.04 for women. This uses actual body weight. It needs age, weight and sex above.</p>
          {child ? <p className="mt-1.5 text-amber-700 dark:text-amber-300">This calculator is set up for adults (18 years and over) only.</p> : cg ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-mono">(140 − {patient.ageYears}) × {patient.weightKg} × {cg.factor} ÷ {creat} = <b>{Math.trunc(cg.value * 10) / 10} mL/min</b></span>
              <button type="button" onClick={() => { set({ crcl: cg.value, crclCreat: creat }); setCalcOpen(false) }} className="rounded-md bg-blue-600 px-2 py-1 font-semibold text-white hover:bg-blue-700">Use</button>
            </div>
          ) : <p className="mt-1.5 text-amber-700 dark:text-amber-300">Enter age, weight, sex and creatinine to calculate.</p>}
          <p className="mt-1.5 text-muted-foreground">The MHRA says to use Cockcroft-Gault CrCl, not eGFR, for some groups (for example DOACs, people aged 75 or over, and extremes of muscle mass). SPS notes that the result is less accurate at extremes of weight. <a className="underline" href="https://www.gov.uk/drug-safety-update/prescribing-medicines-in-renal-impairment-using-the-appropriate-estimate-of-renal-function-to-avoid-the-risk-of-adverse-drug-reactions" target="_blank" rel="noopener noreferrer">MHRA</a> · <a className="underline" href="https://www.sps.nhs.uk/articles/calculating-kidney-function/" target="_blank" rel="noopener noreferrer">SPS</a></p>
        </div>
      )}

      <div className="mt-3">
        <Field label="Hepatic impairment" htmlFor="mc-liver" need={needed.has('hepatic') || needed.has('hepatic-severity')}>
          <select id="mc-liver" value={patient.hepatic ?? ''} onChange={(e) => set({ hepatic: e.target.value || null })} className={fieldCls}>
            <option value="">Not recorded</option>
            {HEPATIC_LEVELS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Drug allergies" htmlFor="mc-allergy-status" need={needed.has('allergy')}>
          <Segmented id="mc-allergy-status" label="Drug allergy status" value={patient.allergyStatus} onChange={(v) => set({ allergyStatus: v, ...(v !== 'listed' ? { allergies: [] } : {}) })}
            options={[NR, { value: 'nkda', label: 'None known' }, { value: 'listed', label: 'Has allergies' }]} />
        </Field>
        {patient.allergyStatus === 'listed' && (
          <div className="mt-2 space-y-1.5">
            {patient.allergies.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg border bg-background px-2 py-1">
                <span className="min-w-0 flex-1 truncate text-sm">{kb.allergens.find((x) => x.id === a.allergen)?.name ?? a.allergen}</span>
                <select aria-label="Reaction type" value={a.reaction} onChange={(e) => set({ allergies: patient.allergies.map((x, j) => j === i ? { ...x, reaction: e.target.value } : x) })} className="h-7 max-w-[10.5rem] rounded-md border bg-card px-1 text-xs">
                  {REACTION_GROUPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <button type="button" aria-label="Remove allergy" onClick={() => set({ allergies: patient.allergies.filter((_, j) => j !== i) })} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <Picker id="mc-allergen" placeholder="Add allergen (medicine or group)…" options={kb.allergens} exclude={patient.allergies.map((a) => a.allergen)}
              onPick={(o) => set({ allergies: [...patient.allergies, { allergen: o.id, reaction: 'unknown' }] })} />
            {patient.allergies.length === 0 && <p className="text-[11px] text-amber-700 dark:text-amber-300">Add at least one allergen, or choose “None known”.</p>}
          </div>
        )}
      </div>

      <div className="mt-3">
        <Field label="Diagnoses and conditions" htmlFor="mc-cond" need={needed.has('conditions')}>
          {patient.conditions.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {patient.conditions.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full border bg-background py-0.5 pl-2.5 pr-1 text-xs">
                  {kb.conditions.find((x) => x.id === c)?.name ?? c}
                  <button type="button" aria-label="Remove condition" onClick={() => set({ conditions: patient.conditions.filter((x) => x !== c) })} className="rounded-full p-0.5 hover:bg-muted"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
          <Picker id="mc-cond" placeholder="Add diagnosis…" options={kb.conditions} exclude={patient.conditions} onPick={(o) => set({ conditions: [...patient.conditions, o.id] })} />
        </Field>
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs">
          <input type="checkbox" checked={patient.conditionsComplete} onChange={(e) => set({ conditionsComplete: e.target.checked })} className="mt-0.5 h-4 w-4 accent-blue-600" />
          <span>I have reviewed the diagnoses: <b>none of the others in this list apply</b></span>
        </label>
      </div>
    </section>
  )
}

