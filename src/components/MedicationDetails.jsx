import React, { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  ShieldCheck, ShieldAlert, ChevronDown, Clock, Syringe, BadgeCheck, Baby, Activity,
  AlertTriangle, MessageCircle, Calculator, ListChecks, CalendarCheck, HelpCircle,
} from 'lucide-react'

// ---- Data model (version 2) -------------------------------------------------
// Indications column:       { v: 2, indications, placeInTreatment, dosing, calc, evidence, lastVerified, unverified }
// Contraindications column: { v: 2, absolute, pregnancy, breastfeeding, cautions, seSerious, seVeryCommon,
//                             seCommon, seUncommon, seRare, seVeryRare, seNotKnown, counselling }
// All values are markdown strings; calc is a JSON string of calculator definitions.

export const IND_FIELDS_V2 = [
  { key: 'indications', label: 'Indications' },
  { key: 'placeInTreatment', label: 'When to give it / Place in treatment' },
  { key: 'dosing', label: 'Dose + calculation' },
  { key: 'calc', label: 'Dose calculator (JSON)' },
  { key: 'evidence', label: 'Evidence-based / Approval status' },
  { key: 'lastVerified', label: 'Last verified (YYYY-MM-DD)' },
  { key: 'unverified', label: 'Still requiring verification' },
]

export const SIDE_EFFECT_GROUPS = [
  { key: 'seVeryCommon', label: 'Very common', hint: 'more than 1 in 10' },
  { key: 'seCommon', label: 'Common', hint: 'up to 1 in 10' },
  { key: 'seUncommon', label: 'Uncommon', hint: 'up to 1 in 100' },
  { key: 'seRare', label: 'Rare', hint: 'up to 1 in 1,000' },
  { key: 'seVeryRare', label: 'Very rare', hint: 'up to 1 in 10,000' },
  { key: 'seNotKnown', label: 'Frequency not known', hint: 'cannot be estimated from the data — this does not mean rare' },
]

export const CONTRA_FIELDS_V2 = [
  { key: 'absolute', label: 'Absolute contraindications' },
  { key: 'pregnancy', label: 'Pregnancy' },
  { key: 'breastfeeding', label: 'Breastfeeding' },
  { key: 'cautions', label: 'Cautions + monitoring' },
  { key: 'seSerious', label: 'Serious side effects' },
  ...SIDE_EFFECT_GROUPS.map(g => ({ key: g.key, label: `Side effects — ${g.label}` })),
  { key: 'counselling', label: 'Patient counselling' },
]

export function isMonographV2(val) {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val) && val.v === 2)
}

// ---- Markdown ---------------------------------------------------------------

export function Md({ children }) {
  if (!children || !String(children).trim()) return <p className="text-sm text-foreground/50">—</p>
  return (
    <div className="monograph-md text-sm leading-relaxed text-foreground/85">
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 break-words" />
          ),
          h3: ({ node, ...props }) => <h4 {...props} className="mt-3 first:mt-0 mb-1 text-[13px] font-semibold text-foreground" />,
          h4: ({ node, ...props }) => <h5 {...props} className="mt-2 mb-1 text-[13px] font-semibold text-foreground" />,
          ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 space-y-1 my-1" />,
          ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 space-y-1 my-1" />,
          p: ({ node, ...props }) => <p {...props} className="my-1" />,
          strong: ({ node, ...props }) => <strong {...props} className="font-semibold text-foreground" />,
        }}
      >
        {String(children)}
      </ReactMarkdown>
    </div>
  )
}

// ---- Dose calculator --------------------------------------------------------

// Two calculator types live in the calc JSON array:
//  - weight (default): { label, basis: perDose|perDay, mgPerKg, dosesPerDay, concentrationMgPerMl, maxSingleMg, maxDailyMg, minAge, weightMeasure, source }
//  - age:              { type: 'age', label, bands: [{ minMonths, maxMonths|null, dose, maxPerDay? }], note?, source }
export function parseCalc(text) {
  if (!text || !String(text).trim()) return []
  try {
    const arr = JSON.parse(text)
    if (!Array.isArray(arr)) return []
    return arr.filter(c => c && (
      (c.type === 'age' && Array.isArray(c.bands) && c.bands.length > 0) ||
      ((!c.type || c.type === 'weight') && c.mgPerKg > 0 && (c.basis === 'perDose' || c.basis === 'perDay'))
    ))
  } catch {
    return []
  }
}

const fmt = (n, d = 1) => Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString('en-US') : '—'

const ageText = (m) => {
  if (m == null) return ''
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`
  return m % 12 === 0 ? `${m / 12} years` : `${fmt(m / 12, 1)} years`
}
const bandText = (b) => b.maxMonths == null ? `${ageText(b.minMonths)} and over` : `${ageText(b.minMonths)} to under ${ageText(b.maxMonths)}`

function AgeCalc({ c }) {
  const [years, setYears] = useState('')
  const [months, setMonths] = useState('')
  const y = years === '' ? 0 : parseInt(years, 10)
  const mo = months === '' ? 0 : parseInt(months, 10)
  const entered = years !== '' || months !== ''
  const valid = entered && Number.isFinite(y) && Number.isFinite(mo) && y >= 0 && y <= 120 && mo >= 0 && mo <= 11
  const total = valid ? y * 12 + mo : null
  const band = valid ? c.bands.find(b => total >= b.minMonths && (b.maxMonths == null || total < b.maxMonths)) : null
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted-foreground">Age: years
          <input type="number" inputMode="numeric" min="0" max="120" value={years} onChange={e => setYears(e.target.value)} placeholder="e.g. 4"
            className="mt-1 w-full rounded-md border bg-background px-2.5 py-1.5 text-base sm:text-sm" />
        </label>
        <label className="text-xs text-muted-foreground">+ months
          <input type="number" inputMode="numeric" min="0" max="11" value={months} onChange={e => setMonths(e.target.value)} placeholder="0"
            className="mt-1 w-full rounded-md border bg-background px-2.5 py-1.5 text-base sm:text-sm" />
        </label>
      </div>
      {entered && !valid && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">Enter years 0–120 and months 0–11.</p>}
      {valid && (band ? (
        <div className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">Age band: {bandText(band)}</p>
          <p><strong>{band.dose}</strong></p>
          {band.maxPerDay && <p className="text-xs text-muted-foreground">Max: {band.maxPerDay}</p>}
        </div>
      ) : (
        <p className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          No dose for this age in the source. See the dosing text; do not guess.
        </p>
      ))}
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer">All age bands</summary>
        <ul className="mt-1 space-y-0.5">
          {c.bands.map((b, i) => <li key={i}><span className="font-medium">{bandText(b)}:</span> {b.dose}{b.maxPerDay ? ` (max ${b.maxPerDay})` : ''}</li>)}
        </ul>
      </details>
      {c.note && <p className="mt-1.5 text-xs text-muted-foreground">{c.note}</p>}
    </>
  )
}

export function DoseCalculator({ calcs, bare = false }) {
  const [idx, setIdx] = useState(0)
  const c = calcs[Math.min(idx, calcs.length - 1)]
  if (!c) return null
  return (
    <div className={bare ? '' : 'mt-3 rounded-lg border border-primary/25 bg-background/60 p-3'}>
      {!bare && (
        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wide text-primary">
          <Calculator className="h-3.5 w-3.5" /> Dose calculator
        </div>
      )}
      {calcs.length > 1 && (
        // Tappable cards instead of a <select>: long labels wrap instead of running off a phone screen
        <div role="radiogroup" aria-label="Choose a calculator" className="mb-3 space-y-1.5">
          {calcs.map((x, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i === idx}
              onClick={() => setIdx(i)}
              className={`w-full text-left rounded-md border px-2.5 py-2 text-[13px] leading-snug transition-colors cursor-pointer ${i === idx ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background hover:bg-primary/5 text-muted-foreground'}`}
            >
              <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${x.type === 'age' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-primary/15 text-primary'}`}>
                {x.type === 'age' ? 'By age' : 'By weight'}
              </span>
              <span className={i === idx ? '' : 'line-clamp-2'}>{x.label}</span>
            </button>
          ))}
        </div>
      )}
      {calcs.length === 1 && <p className="text-[13px] font-medium mb-2">{c.label}</p>}
      {c.type === 'age' ? <AgeCalc key={idx} c={c} /> : <WeightCalc key={idx} c={c} />}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Check the result against the dosing text and the product strength in hand.
        {c.source && <> Source: <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline">link</a></>}
      </p>
    </div>
  )
}

function WeightCalc({ c }) {
  const [weight, setWeight] = useState('')
  const w = parseFloat(weight)
  const validWeight = Number.isFinite(w) && w > 0 && w <= 250

  const result = useMemo(() => {
    if (!c || !validWeight) return null
    const perDay = c.basis === 'perDay'
    const doses = perDay ? c.dosesPerDay : c.dosesPerDay || null
    let mgDose = perDay ? (w * c.mgPerKg) / c.dosesPerDay : w * c.mgPerKg
    const raw = mgDose
    const capped = []
    if (c.maxSingleMg > 0 && mgDose > c.maxSingleMg) { mgDose = c.maxSingleMg; capped.push(`capped at the maximum single dose of ${fmt(c.maxSingleMg)} mg`) }
    if (c.maxDailyMg > 0 && doses && mgDose * doses > c.maxDailyMg) {
      mgDose = c.maxDailyMg / doses
      capped.push(`reduced so the daily total does not exceed ${fmt(c.maxDailyMg)} mg/day`)
    }
    const ml = c.concentrationMgPerMl > 0 ? mgDose / c.concentrationMgPerMl : null
    return { perDay, doses, raw, mgDose, ml, daily: doses ? mgDose * doses : null, capped }
  }, [c, w, validWeight])

  return (
    <>
      <label className="text-xs text-muted-foreground">
        Weight (kg){c.weightMeasure ? ` — use ${c.weightMeasure}` : ''}
      </label>
      <input
        type="number"
        inputMode="decimal"
        min="0.5"
        max="250"
        step="0.1"
        value={weight}
        onChange={e => setWeight(e.target.value)}
        placeholder="e.g. 18"
        className="mt-1 w-full rounded-md border bg-background px-2.5 py-1.5 text-base sm:text-sm"
      />
      {weight !== '' && !validWeight && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">Enter a weight between 0.5 and 250 kg.</p>
      )}
      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
        {c.basis === 'perDay' ? (
          <>
            <p>Total mg/day = weight (kg) × {fmt(c.mgPerKg, 2)} mg/kg/day</p>
            <p>mg per dose = total mg/day ÷ {c.dosesPerDay} doses</p>
          </>
        ) : (
          <p>mg per dose = weight (kg) × {fmt(c.mgPerKg, 2)} mg/kg/dose</p>
        )}
        {c.concentrationMgPerMl > 0 && <p>mL per dose = mg per dose ÷ {fmt(c.concentrationMgPerMl, 2)} mg/mL</p>}
        {(c.maxSingleMg > 0 || c.maxDailyMg > 0) && (
          <p>Limits: {[c.maxSingleMg > 0 && `max ${fmt(c.maxSingleMg)} mg per dose`, c.maxDailyMg > 0 && `max ${fmt(c.maxDailyMg)} mg/day`].filter(Boolean).join(', ')}</p>
        )}
        {c.minAge && <p>For age {c.minAge} and over.</p>}
      </div>
      {result && (
        <div className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-sm">
          <p><span className="text-muted-foreground">Dose:</span> <strong>{fmt(result.mgDose)} mg</strong>{result.ml != null && <> = <strong>{fmt(result.ml, 2)} mL</strong></>}{result.doses ? <>, {result.doses} times daily</> : null}</p>
          {result.daily != null && <p className="text-xs text-muted-foreground">Daily total: {fmt(result.daily)} mg/day</p>}
          {result.capped.map(t => <p key={t} className="text-xs text-amber-700 dark:text-amber-400">Calculated {fmt(result.raw)} mg — {t}.</p>)}
        </div>
      )}
    </>
  )
}

// ---- Sections ---------------------------------------------------------------

// Only one section is open at a time: opening one closes the one that was open before.
const OpenSection = React.createContext(null)

function Section({ n, icon: Icon, title, tone = 'primary', children }) {
  const ctx = React.useContext(OpenSection)
  const [ownOpen, setOwnOpen] = useState(false)
  const open = ctx ? ctx.open === n : ownOpen
  const headRef = React.useRef(null)
  const toggle = () => {
    if (ctx) ctx.setOpen(open ? null : n)
    else setOwnOpen(!open)
    // The section closing above can move this one up and out of view: bring its title back
    if (!open) requestAnimationFrame(() => headRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }
  const tones = {
    primary: 'bg-primary/5 border-primary/20',
    red: 'bg-red-50/50 border-red-200/60 dark:bg-red-950/30 dark:border-red-900/50',
    amber: 'bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/50',
  }
  const iconTone = { primary: 'text-primary', red: 'text-red-600 dark:text-red-400', amber: 'text-amber-600 dark:text-amber-400' }
  return (
    <div ref={headRef} className={`scroll-mt-20 rounded-lg border ${tones[tone]}`}>
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2 px-3.5 py-3 text-left cursor-pointer"
        aria-expanded={open}
      >
        <Icon className={`h-4 w-4 shrink-0 ${iconTone[tone]}`} />
        <span className="flex-1 text-xs font-bold uppercase tracking-wide text-foreground">{n}. {title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3.5 pb-3.5 animate-expand-in">{children}</div>}
    </div>
  )
}

function Labelled({ label, children, tone }) {
  const c = tone === 'red' ? 'text-red-700 dark:text-red-400' : 'text-primary'
  return (
    <div className="mt-3 first:mt-0">
      <p className={`text-[11px] font-bold uppercase tracking-wide ${c} mb-1`}>{label}</p>
      {children}
    </div>
  )
}

function SideEffects({ contra }) {
  const [openKey, setOpenKey] = useState(null)
  const groups = SIDE_EFFECT_GROUPS.filter(g => String(contra[g.key] || '').trim())
  return (
    <>
      {String(contra.seSerious || '').trim() && (
        <div className="rounded-md border border-red-300 bg-red-100/60 dark:bg-red-950/50 dark:border-red-800 p-3 mb-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-700 dark:text-red-400 mb-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Serious — stop / seek urgent help
          </p>
          <Md>{contra.seSerious}</Md>
        </div>
      )}
      {groups.length === 0 && <p className="text-sm text-foreground/50">—</p>}
      <div className="divide-y divide-border/50">
        {groups.map(g => {
          const open = openKey === g.key
          return (
            <div key={g.key}>
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : g.key)}
                className="w-full flex items-center justify-between gap-2 py-2 text-left cursor-pointer"
                aria-expanded={open}
              >
                <span className="text-[13px] font-semibold">{g.label} <span className="font-normal text-muted-foreground text-xs">({g.hint})</span></span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && <div className="pb-2 animate-expand-in"><Md>{contra[g.key]}</Md></div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

export function MedicationDetails({ ind = {}, contra = {} }) {
  const calcs = parseCalc(ind.calc)
  const [open, setOpen] = useState(null)
  return (
    <OpenSection.Provider value={{ open, setOpen }}>
    <div className="space-y-2.5">
      <Section n={1} icon={ShieldCheck} title="Indications">
        <Md>{ind.indications}</Md>
      </Section>
      <Section n={2} icon={ListChecks} title="When to give it / Place in treatment">
        <Md>{ind.placeInTreatment}</Md>
      </Section>
      <Section n={3} icon={Syringe} title="Dose + calculation">
        <Md>{ind.dosing}</Md>
        {calcs.length > 0 && <DoseCalculator calcs={calcs} />}
      </Section>
      <Section n={4} icon={BadgeCheck} title="Evidence-based / Approval status">
        <Md>{ind.evidence}</Md>
      </Section>
      <Section n={5} icon={ShieldAlert} title="Absolute contraindications + pregnancy and breastfeeding" tone="red">
        <Labelled label="Absolute contraindications" tone="red"><Md>{contra.absolute}</Md></Labelled>
        <Labelled label="Pregnancy" tone="red"><Md>{contra.pregnancy}</Md></Labelled>
        <Labelled label="Breastfeeding" tone="red"><Md>{contra.breastfeeding}</Md></Labelled>
      </Section>
      <Section n={6} icon={Activity} title="Cautions + monitoring" tone="red">
        <Md>{contra.cautions}</Md>
      </Section>
      <Section n={7} icon={AlertTriangle} title="Side effects" tone="red">
        <SideEffects contra={contra} />
      </Section>
      <Section n={8} icon={MessageCircle} title="Patient counselling">
        <Md>{contra.counselling}</Md>
      </Section>

      {String(ind.unverified || '').trim() && (
        <Section n="!" icon={HelpCircle} title="Still requiring verification" tone="amber">
          <Md>{ind.unverified}</Md>
        </Section>
      )}
      {ind.lastVerified && (
        <p className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
          <CalendarCheck className="h-3.5 w-3.5" /> Last verified: {ind.lastVerified}
        </p>
      )}
    </div>
    </OpenSection.Provider>
  )
}

// ---- Admin editor -----------------------------------------------------------

export function MonographEditor({ fields, value, onChange, color }) {
  const obj = value && typeof value === 'object' ? value : {}
  const border = color === 'red' ? 'border-red-200 dark:border-red-900/50' : 'border-primary/20'
  const labelColor = color === 'red' ? 'text-red-700 dark:text-red-400' : 'text-primary'
  const calcBad = fields.some(f => f.key === 'calc') && obj.calc && String(obj.calc).trim() && (() => {
    try { return !Array.isArray(JSON.parse(obj.calc)) } catch { return true }
  })()
  return (
    <div className="space-y-3">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className={`text-xs font-semibold ${labelColor} mb-1 block`}>{label}</label>
          <textarea
            className={`w-full rounded-md border ${border} bg-background px-3 py-2 text-sm font-mono min-h-[48px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/30`}
            value={obj[key] ?? ''}
            onChange={(e) => onChange({ ...obj, v: 2, [key]: e.target.value })}
            rows={key === 'lastVerified' ? 1 : 4}
          />
          {key === 'calc' && calcBad && <p className="text-xs text-red-600 mt-1">Not a valid JSON array — the calculator will be hidden.</p>}
        </div>
      ))}
    </div>
  )
}

// Plain-text rendering for Copy / WhatsApp.
export function monographToText(ind = {}, contra = {}, { short = false, bold = false } = {}) {
  const h = t => (bold ? `*${t}*` : t.toUpperCase())
  const strip = s => String(s || '').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, short ? '$1' : '$1 ($2)').replace(/^###\s*/gm, '').replace(/\*\*/g, bold ? '*' : '').trim()
  const parts = [
    ['Indications', ind.indications],
    !short && ['When to give it / Place in treatment', ind.placeInTreatment],
    ['Dose + calculation', ind.dosing],
    !short && ['Evidence-based / Approval status', ind.evidence],
    ['Absolute contraindications', contra.absolute],
    ['Pregnancy', contra.pregnancy],
    ['Breastfeeding', contra.breastfeeding],
    !short && ['Cautions + monitoring', contra.cautions],
    !short && ['Serious side effects', contra.seSerious],
    ...(!short ? SIDE_EFFECT_GROUPS.map(g => [`Side effects — ${g.label}`, contra[g.key]]) : []),
    !short && ['Patient counselling', contra.counselling],
  ].filter(p => p && String(p[1] || '').trim())
  const body = parts.map(([t, v]) => `${h(t)}\n${strip(v)}`).join('\n\n')
  return ind.lastVerified ? `${body}\n\nLast verified: ${ind.lastVerified}` : body
}
