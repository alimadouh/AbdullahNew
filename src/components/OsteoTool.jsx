import { useState, useMemo } from 'react'
import { Bone, ChevronLeft, ChevronRight, RotateCcw, ShieldAlert, Check, AlertTriangle, ScanLine, Pill, Activity, ClipboardList, Dumbbell, Stethoscope } from 'lucide-react'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'
import { assess, bmi, screening, vfaReasons, THRESHOLD_ROWS } from '../lib/osteo.js'

// Osteoporosis Risk (FRAX Kuwait): screening → FRAX before DXA → DXA result → plan.
// Content follows the KOPS / Kuwait Osteoporosis Guidelines 2022 slides; FRAX values come from the
// official FRAX Kuwait paper charts (no FRAX API), or the official FRAX number typed by the doctor.

const RISK = {
  low: { label: 'Low risk', color: '#16a34a' },
  dxa: { label: 'Risk not determined', color: '#ea7a12' },
  high: { label: 'High risk', color: '#ea7a12' },
  veryHigh: { label: 'Very high risk', color: '#dc2626' },
}

const MAJOR = [
  'Age > 60 years', 'Fragility fracture after age 40 years', 'H/O parental hip fracture', 'Systemic steroid therapy > 3 months',
  'Malabsorption conditions', 'Primary hyperparathyroidism', 'Hypogonadism', 'Early menopause before age 45',
  'Osteopenia apparent on x-ray', 'Follow-up after at least 18 months',
]
const MINOR = {
  'Medical conditions': ['DM', 'Osteogenesis imperfecta', 'Major depression', 'Multiple sclerosis', 'Hematological malignancies', 'Hemophilia, Thalassaemia', 'Hyperthyroidism', "Cushing's Syndrome", 'GH deficiency', 'Anorexia Nervosa', 'Rheumatoid arthritis', 'COPD', 'Chronic liver disease', 'Chronic renal disease'],
  Modifiable: ['Smoking > 20 cig/day', 'Weight < 57 KG', 'Caffeine > 3 cups/day', 'Alcohol > 3 units/day', 'Vitamin D deficiency', 'Ca intake < 600 mg/day', 'Recurrent falls'],
  Drugs: ['Corticosteroids', 'Proton Pump Inhibitors PPI', 'Antiepileptic Drugs', 'SSRI', 'Heparin', 'Thyroxine in supraphysiological doses', 'Cytotoxic Drugs', 'Thiazolidinediones', 'GnRH Agonist', 'Immune Suppressants', 'Lithium', 'Excess Vit A', 'Aromatase Inhibitors'],
}
const STEPS = ['Screening', 'FRAX', 'DXA result', 'Plan']

const num = (v) => (v === '' || v == null ? NaN : parseFloat(v))
const f1 = (v) => (Number.isFinite(v) ? (v < 10 ? v.toFixed(1) : v.toFixed(0)) : '—')

// ── small pieces ────────────────────────────────────────────────────────────────────────────

function Seg({ value, onChange, options, accent, small }) {
  return (
    <div className="grid rounded-xl border bg-muted/40 p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map(o => {
        const on = value === o.value
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`rounded-[10px] px-1.5 ${small ? 'py-1 text-[11px]' : 'py-1.5 text-xs'} font-semibold leading-tight transition-colors cursor-pointer`}
            style={on ? { background: accent, color: '#fff' } : undefined}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function YesNo({ label, sub, value, onChange, accent, children }) {
  return (
    <div className="rounded-xl border p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight">{label}</div>
          {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        </div>
        <div className="w-28 shrink-0"><Seg small value={value ? 'y' : 'n'} onChange={v => onChange(v === 'y')} accent={accent} options={[{ value: 'n', label: 'No' }, { value: 'y', label: 'Yes' }]} /></div>
      </div>
      {value && children && <div className="mt-2">{children}</div>}
    </div>
  )
}

function Chip({ on, onClick, children, accent, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on}
      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer disabled:cursor-default"
      style={on ? { background: accent + '1f', borderColor: accent, color: accent } : undefined}>
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border" style={on ? { background: accent, borderColor: accent } : undefined}>
        {on && <Check className="h-2.5 w-2.5 text-white" />}
      </span>
      {children}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

// Bar from 0 to a bit above UAT with the Kuwait thresholds and the patient's MOF
function ThresholdBar({ mof, thr, stage }) {
  const max = Math.max(thr.uat * 1.6, (mof || 0) * 1.1, 5)
  const pos = (v) => `${Math.min(100, (v / max) * 100)}%`
  const lower = stage === 'before' ? thr.lat : thr.it
  return (
    <div className="pt-7 pb-5">
      <div className="relative h-3 rounded-full" style={{ background: `linear-gradient(90deg, #16a34a 0 ${pos(lower)}, #ea7a12 ${pos(lower)} ${pos(thr.uat)}, #dc2626 ${pos(thr.uat)} 100%)` }}>
        {Number.isFinite(mof) && (
          <div className="absolute -top-7 flex -translate-x-1/2 flex-col items-center transition-all duration-500" style={{ left: pos(mof) }}>
            <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background tabular-nums">{f1(mof)}%</span>
            <span className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-foreground" />
          </div>
        )}
        {[[lower, stage === 'before' ? 'LAT' : 'IT', 'right'], [thr.uat, 'UAT', 'left']].map(([v, l, side]) => (
          <div key={l} className="absolute top-3" style={{ left: pos(v) }}>
            <span className="absolute left-0 top-0 h-2 w-px bg-foreground/50" />
            <span className={`absolute top-2 whitespace-nowrap text-[10px] font-semibold text-muted-foreground tabular-nums ${side === 'right' ? 'right-0 pr-1 text-right' : 'left-0 pl-1'}`}>{l} {f1(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// The slide's age chart: zones by the Kuwait thresholds, patient as a dot
function AgeChart({ age, mof }) {
  const W = 320, H = 190, L = 28, B = 22, T = 6, R = 6
  const x = (a) => L + ((a - 40) / 50) * (W - L - R)
  const y = (p) => H - B - (Math.min(p, 40) / 40) * (H - B - T)
  const line = (k) => THRESHOLD_ROWS.map(r => `${x(r.age)},${y(r[k])}`).join(' ')
  const area = (top, bottom) => `${THRESHOLD_ROWS.map(r => `${x(r.age)},${y(top(r))}`).join(' ')} ${[...THRESHOLD_ROWS].reverse().map(r => `${x(r.age)},${y(bottom(r))}`).join(' ')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Ten year MOF probability by age with Kuwait thresholds">
      <polygon points={area(() => 40, r => r.uat)} fill="#dc2626" opacity="0.85" />
      <polygon points={area(r => r.uat, r => r.lat)} fill="#ea7a12" opacity="0.85" />
      <polygon points={area(r => r.lat, () => 0)} fill="#16a34a" opacity="0.85" />
      <polyline points={line('it')} fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="4 3" />
      {[0, 10, 20, 30, 40].map(p => <text key={p} x={L - 4} y={y(p) + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>{p}</text>)}
      {[40, 50, 60, 70, 80, 90].map(a => <text key={a} x={x(a)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>{a}</text>)}
      <text x={W - R - 2} y={y(27) - 3} textAnchor="end" fill="#fff" style={{ fontSize: 8, fontWeight: 700 }}>UAT</text>
      <text x={W - R - 2} y={y(23) + 9} textAnchor="end" fill="#fff" style={{ fontSize: 8, fontWeight: 700 }}>IT</text>
      <text x={W - R - 2} y={y(14) + 9} textAnchor="end" fill="#fff" style={{ fontSize: 8, fontWeight: 700 }}>LAT</text>
      {Number.isFinite(mof) && age >= 40 && (
        <g>
          <circle cx={x(Math.min(age, 90))} cy={y(mof)} r="7" fill="#fff" opacity="0.5" />
          <circle cx={x(Math.min(age, 90))} cy={y(mof)} r="4.5" fill="#111827" stroke="#fff" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  )
}

// What the stage result means, as on the flowchart
function decisionText(r) {
  if (!r?.category) return null
  if (r.reason === 'fragility') return { title: 'Very high risk', text: 'History of fragility fracture (spine, hip or 2 or more other fractures). Treat with anabolic therapy ± DXA.' }
  if (r.stage === 'before') {
    if (r.category === 'low') return { title: 'Low risk', text: 'Below the lower assessment threshold. Reassure and repeat FRAX after 5 years or when the clinical condition changes.' }
    if (r.category === 'dxa') return { title: 'Do DXA', text: 'Risk not determined: between the assessment thresholds. Do DXA, then enter the femoral neck T-score to reassess the probability.' }
    return { title: 'Very high risk', text: 'Above the upper assessment threshold. Treat with anabolic therapy ± DXA.' }
  }
  if (r.category === 'low') return { title: 'Low risk', text: 'Below the intervention threshold. Reassure and repeat FRAX & DXA after 3 years.' }
  if (r.category === 'high') return { title: 'High risk', text: 'Between the intervention threshold and the upper assessment threshold. Treat with antiresorptive therapy.' }
  return { title: 'Very high risk', text: 'Above the upper assessment threshold. Treat with anabolic therapy.' }
}

function ResultCard({ r, age, accent }) {
  const d = decisionText(r)
  if (!d) return null
  const color = RISK[r.category].color
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: color + '88', background: color + '12' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{r.stage === 'before' ? 'FRAX without BMD' : 'FRAX with BMD'}</div>
          {r.reason === 'fragility' ? (
            <div className="text-xl font-extrabold leading-tight" style={{ color }}>Fragility fracture</div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>{f1(r.mof)}%</span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">MOF · hip {f1(r.hip)}%</span>
            </div>
          )}
        </div>
        <span className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white" style={{ background: color }}>{d.title}</span>
      </div>
      {r.reason !== 'fragility' && <ThresholdBar mof={r.mof} thr={r.thr} stage={r.stage} />}
      <p className="text-xs leading-relaxed">{d.text}</p>
      {r.reason !== 'fragility' && (
        <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
          <div>
            {r.official ? 'Official FRAX MOF entered by the doctor' : `FRAX Kuwait chart estimate · ${r.crfs} risk factor${r.crfs === 1 ? '' : 's'}`}
            {!r.official && r.chart?.low != null && <> · chart range {f1(r.chart.low)}–{f1(r.chart.high)}%</>}
            {!r.official && r.chart?.clampedAge && <> · charts cover ages 50–90</>}
          </div>
          {r.adjustments?.length > 0 && (
            <div>{f1(r.base)}% {r.adjustments.map(a => `× ${a.factor.toFixed(2)} (${a.label})`).join(' ')} = {f1(r.mof)}%</div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ Icon, title, color, children }) {
  return (
    <div className="rounded-xl border p-3.5" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4" style={{ color }} />{title}</div>
      <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

function DrugCard({ name, brand, color, lines }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderTop: `3px solid ${color}` }}>
      <div className="text-sm font-bold">{name} <span className="font-medium text-muted-foreground">({brand})</span></div>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">{lines.map(l => <li key={l}>{l}</li>)}</ul>
    </div>
  )
}

// ── main page ───────────────────────────────────────────────────────────────────────────────

export default function OsteoTool({ theme }) {
  const accent = theme?.text || '#059669'
  const [step, setStep] = useState(0)
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('female')
  const [majors, setMajors] = useState(() => new Set())
  const [minors, setMinors] = useState(() => new Set())
  const [pregnant, setPregnant] = useState(false)
  const [contrast, setContrast] = useState(false)
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [fx, setFx] = useState({ fragility: 'none', recentSite: 'none', parentHip: false, smoking: false, glucocorticoids: false, gcDose: 'medium', ra: false, t2dm: false, adt: false, secondary: false, alcohol: false })
  const [ovBefore, setOvBefore] = useState({ mof: '', hip: '' })
  const [fnT, setFnT] = useState('')
  const [lsT, setLsT] = useState('')
  const [ovAfter, setOvAfter] = useState({ mof: '', hip: '' })
  const [heightLossH, setHeightLossH] = useState(false)
  const [heightLossP, setHeightLossP] = useState(false)

  const a = num(age), w = num(weight), h = num(height)
  const setF = (k, v) => setFx(p => ({ ...p, [k]: v }))
  const factors = { ...fx, prevFracture: fx.fragility === 'one', recentSite: fx.fragility === 'one' ? fx.recentSite : 'none', adt: sex === 'male' && fx.adt }

  const majorCount = majors.size + (a > 60 ? 1 : 0)
  const scr = Number.isFinite(a) ? screening(a, majorCount, minors.size) : null

  const before = useMemo(() => (Number.isFinite(a) ? assess({ age: a, sex, weight: w, height: h, factors, overrideMof: num(ovBefore.mof), overrideHip: num(ovBefore.hip) }, 'before') : null),
    [a, sex, w, h, JSON.stringify(factors), ovBefore.mof, ovBefore.hip])
  const hasDxa = Number.isFinite(num(fnT)) || Number.isFinite(num(ovAfter.mof))
  const after = useMemo(() => (Number.isFinite(a) && hasDxa ? assess({ age: a, sex, weight: w, height: h, factors, fnT: num(fnT), lsT: num(lsT), overrideMof: num(ovAfter.mof), overrideHip: num(ovAfter.hip) }, 'after') : null),
    [a, sex, w, h, JSON.stringify(factors), fnT, lsT, ovAfter.mof, ovAfter.hip, hasDxa])

  const final = after?.category ? after : before?.category ? before : null
  const dxaContra = [pregnant && 'Pregnancy', contrast && 'GI contrast within the last 72 hours', w > 114 && 'Weight over 114 kg (250 pounds)'].filter(Boolean)
  const vfa = Number.isFinite(a) ? vfaReasons({ age: a, sex, lowTraumaFracture: fx.fragility !== 'none', heightLossHistoric: heightLossH, heightLossProspective: heightLossP, glucocorticoids: fx.glucocorticoids }) : []
  const outsideAge = Number.isFinite(a) && (a < 50 || a > 90)

  const reset = () => {
    setStep(0); setAge(''); setSex('female'); setMajors(new Set()); setMinors(new Set()); setPregnant(false); setContrast(false)
    setWeight(''); setHeight(''); setFx({ fragility: 'none', recentSite: 'none', parentHip: false, smoking: false, glucocorticoids: false, gcDose: 'medium', ra: false, t2dm: false, adt: false, secondary: false, alcohol: false })
    setOvBefore({ mof: '', hip: '' }); setFnT(''); setLsT(''); setOvAfter({ mof: '', hip: '' }); setHeightLossH(false); setHeightLossP(false)
  }
  const toggle = (set, setter, k) => setter(() => { const n = new Set(set); n.has(k) ? n.delete(k) : n.add(k); return n })
  const go = (s) => { setStep(s); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const canNext = step === 0 ? Number.isFinite(a) : step === 1 ? !!before?.category : true

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold" style={{ color: accent }}>
          <Bone className="h-5 w-5" />
          Osteoporosis Risk
        </h2>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: accent + '1a', color: accent }}>FRAX Kuwait</span>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => {
          const done = i < step, on = i === step
          return (
            <button key={s} type="button" onClick={() => (i <= 1 || before?.category || i <= step) && go(i)} className="flex flex-col items-center gap-1 cursor-pointer">
              <span className="h-1.5 w-full rounded-full transition-colors" style={{ background: done || on ? accent : 'var(--color-muted, #e5e7eb)' }} />
              <span className="text-[10px] font-semibold" style={on ? { color: accent } : { opacity: 0.6 }}>{i + 1}. {s}</span>
            </button>
          )
        })}
      </div>

      {/* Step 1 — Screening */}
      {step === 0 && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age (years)"><Input type="number" inputMode="decimal" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 65" /></Field>
            <Field label="Sex"><Seg value={sex} onChange={setSex} accent={accent} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} /></Field>
          </div>
          <p className="text-[11px] text-muted-foreground">For postmenopausal women and men aged 50 years or more.</p>

          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>Major risk factors</div>
          <div className="flex flex-wrap gap-1.5">
            {MAJOR.map(m => m === 'Age > 60 years'
              ? <Chip key={m} on={a > 60} disabled accent={accent}>{m}</Chip>
              : <Chip key={m} on={majors.has(m)} onClick={() => toggle(majors, setMajors, m)} accent={accent}>{m}</Chip>)}
          </div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>Minor risk factors</div>
          {Object.entries(MINOR).map(([group, items]) => (
            <div key={group}>
              <div className="mb-1 text-[11px] font-semibold text-muted-foreground">{group}</div>
              <div className="flex flex-wrap gap-1.5">
                {items.map(m => <Chip key={m} on={minors.has(m)} onClick={() => toggle(minors, setMinors, m)} accent={accent}>{m}</Chip>)}
              </div>
            </div>
          ))}

          {scr && (
            <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: (scr.required ? accent : '#64748b') + '66', background: (scr.required ? accent : '#64748b') + '12' }}>
              <ScanLine className="h-5 w-5 shrink-0" style={{ color: scr.required ? accent : '#64748b' }} />
              <div className="min-w-0">
                <div className="text-sm font-bold">{scr.required ? 'Screening required' : 'Screening not required by the checklist'}</div>
                <div className="text-[11px] text-muted-foreground">{scr.why} · {majorCount} major · {minors.size} minor</div>
              </div>
            </div>
          )}

          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>Contraindications to DXA scan</div>
          <div className="flex flex-wrap gap-1.5">
            {sex === 'female' && <Chip on={pregnant} onClick={() => setPregnant(v => !v)} accent="#dc2626">Pregnancy</Chip>}
            <Chip on={contrast} onClick={() => setContrast(v => !v)} accent="#dc2626">GI contrast (72 hrs)</Chip>
            <Chip on={w > 114} disabled accent="#dc2626">Over 114 kg (250 pounds)</Chip>
          </div>
        </div>
      )}

      {/* Step 2 — Risk factors & FRAX before DXA */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Weight (kg)"><Input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70" /></Field>
            <Field label="Height (cm)"><Input type="number" inputMode="decimal" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 165" /></Field>
            <Field label="BMI">
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-bold tabular-nums">{Number.isFinite(bmi(w, h)) ? bmi(w, h).toFixed(1) : '—'}</div>
            </Field>
          </div>

          <Field label="History of fragility fracture">
            <Seg value={fx.fragility} onChange={v => setF('fragility', v)} accent={accent} small options={[
              { value: 'none', label: 'None' }, { value: 'one', label: '1 other' }, { value: 'spineHip', label: 'Spine or hip' }, { value: 'twoOther', label: '≥ 2 other' },
            ]} />
          </Field>
          {fx.fragility === 'one' && (
            <Field label="Recent fracture (FRAX enhancer)">
              <Seg value={fx.recentSite} onChange={v => setF('recentSite', v)} accent={accent} small options={[
                { value: 'none', label: 'Not recent' }, { value: 'humerus', label: 'Recent humerus' }, { value: 'forearm', label: 'Recent forearm' },
              ]} />
            </Field>
          )}
          <p className="-mt-1 text-[11px] text-muted-foreground">Skull, cervical spine, hands and feet fractures, and stress fractures, are not fragility fractures.</p>

          {fx.fragility !== 'spineHip' && fx.fragility !== 'twoOther' && (
            <>
              <YesNo label="Parent fractured hip" value={fx.parentHip} onChange={v => setF('parentHip', v)} accent={accent} />
              <YesNo label="Current smoking" value={fx.smoking} onChange={v => setF('smoking', v)} accent={accent} />
              <YesNo label="Glucocorticoids" sub="Oral steroids" value={fx.glucocorticoids} onChange={v => setF('glucocorticoids', v)} accent={accent}>
                <Seg value={fx.gcDose} onChange={v => setF('gcDose', v)} accent={accent} small options={[
                  { value: 'low', label: '< 2.5 mg/day' }, { value: 'medium', label: '2.5–7.5' }, { value: 'high', label: '≥ 7.5 mg/day' },
                ]} />
                <div className="mt-1 text-[10px] text-muted-foreground">Prednisolone equivalent · low ×0.8 · medium no adjustment · high ×1.15</div>
              </YesNo>
              <YesNo label="Rheumatoid arthritis" value={fx.ra} onChange={v => setF('ra', v)} accent={accent} />
              <YesNo label="Type 2 diabetes" sub="Entered as rheumatoid arthritis (FRAX enhancer)" value={fx.t2dm} onChange={v => setF('t2dm', v)} accent={accent} />
              {sex === 'male' && <YesNo label="Androgen deprivation therapy" sub="Entered as rheumatoid arthritis (FRAX enhancer)" value={fx.adt} onChange={v => setF('adt', v)} accent={accent} />}
              <YesNo label="Secondary osteoporosis" value={fx.secondary} onChange={v => setF('secondary', v)} accent={accent} />
              <YesNo label="Alcohol 3 or more units/day" value={fx.alcohol} onChange={v => setF('alcohol', v)} accent={accent} />

              <details className="rounded-xl border p-2.5 text-xs">
                <summary className="cursor-pointer font-semibold">Have the official FRAX number? (optional)</summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Major osteoporotic %"><Input type="number" inputMode="decimal" value={ovBefore.mof} onChange={e => setOvBefore(p => ({ ...p, mof: e.target.value }))} placeholder="e.g. 8.5" /></Field>
                  <Field label="Hip fracture %"><Input type="number" inputMode="decimal" value={ovBefore.hip} onChange={e => setOvBefore(p => ({ ...p, hip: e.target.value }))} placeholder="e.g. 1.2" /></Field>
                </div>
              </details>
            </>
          )}

          {outsideAge && !Number.isFinite(num(ovBefore.mof)) && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The FRAX Kuwait charts cover ages 50–90. Enter the official FRAX number for this age.
            </div>
          )}
          {before?.category
            ? <ResultCard r={before} age={a} accent={accent} />
            : <div className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">Enter weight and height to see the 10-year fracture probability.</div>}
        </div>
      )}

      {/* Step 3 — DXA result */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          {dxaContra.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-2.5 text-xs text-red-700 dark:text-red-400">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div><b>DXA contraindication:</b> {dxaContra.join(' · ')}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Femoral neck T-score"><Input type="number" inputMode="decimal" step="0.1" value={fnT} onChange={e => setFnT(e.target.value)} placeholder="e.g. -2.1" /></Field>
            <Field label="Lumbar spine T-score (optional)"><Input type="number" inputMode="decimal" step="0.1" value={lsT} onChange={e => setLsT(e.target.value)} placeholder="e.g. -2.8" /></Field>
          </div>
          <details className="rounded-xl border p-2.5 text-xs">
            <summary className="cursor-pointer font-semibold">Have the official FRAX number with BMD? (optional)</summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Major osteoporotic %"><Input type="number" inputMode="decimal" value={ovAfter.mof} onChange={e => setOvAfter(p => ({ ...p, mof: e.target.value }))} placeholder="e.g. 13" /></Field>
              <Field label="Hip fracture %"><Input type="number" inputMode="decimal" value={ovAfter.hip} onChange={e => setOvAfter(p => ({ ...p, hip: e.target.value }))} placeholder="e.g. 2.5" /></Field>
            </div>
          </details>

          {after?.category ? (
            <>
              <ResultCard r={after} age={a} accent={accent} />
              {after.reason !== 'fragility' && (
                <div className="rounded-xl border p-3">
                  <div className="mb-1 text-xs font-bold">Ten year probability of MOF (%) by age</div>
                  <AgeChart age={a} mof={after.mof} />
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">
                    <span><b style={{ color: '#16a34a' }}>■</b> Low risk</span><span><b style={{ color: '#ea7a12' }}>■</b> Measure BMD / high risk</span><span><b style={{ color: '#dc2626' }}>■</b> Very high risk</span><span>- - IT</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">Enter the femoral neck T-score from the DXA report.</div>
          )}
        </div>
      )}

      {/* Step 4 — Plan */}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          {final ? <ResultCard r={final} age={a} accent={accent} /> : <div className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">Complete the FRAX step first.</div>}

          {final && (final.category === 'high' || final.category === 'veryHigh') && (
            <>
              <Section Icon={ClipboardList} title="Initial evaluation" color={accent}>
                <ul className="list-disc space-y-0.5 pl-4">
                  <li>History and physical examination</li>
                  <li>Height and weight measurements</li>
                  <li>Lab tests: CBC + ESR, RFT, LFT, bone profile, ALP, PTH-I, TFT, 25OH Vitamin D, urine calcium/creatinine</li>
                  <li>Additional tests: gonadal hormones, celiac screen, 24hr urine for calcium, sodium and creatinine</li>
                </ul>
              </Section>
              <Section Icon={Dumbbell} title="Non-pharmacological" color={accent}>
                <ol className="list-decimal space-y-0.5 pl-4">
                  <li>Smoking and alcohol cessation and limitation of caffeine to &lt; 3 cups/day.</li>
                  <li>Weight-bearing exercises 30 minutes/day (walking, jogging, dancing, strength/resistance training), balance training and stretching exercises.</li>
                  <li>Measures to reduce the risk of falling including physical therapy.</li>
                </ol>
              </Section>
              <Section Icon={Pill} title="Pharmacological" color={accent}>
                <ol className="list-decimal space-y-0.5 pl-4">
                  <li>Treat vitamin D deficiency if present and maintain on an equivalent dose of 1000–2000 IU/day of vitamin D3 (cholecalciferol) to achieve serum total 25-OH Vit D level between 75–150 nmol/L.</li>
                  <li>Maintain a calcium intake of 1000–1200 mg/day, preferably through diet, if not then through supplements.</li>
                  <li>One-alfa should only be used in cases of chronic renal impairment and hypoparathyroidism.</li>
                </ol>
              </Section>

              {final.category === 'high' ? (
                <>
                  <div className="text-sm font-bold" style={{ color: RISK.high.color }}>High risk → Antiresorptive agents</div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <DrugCard name="Alendronate" brand="Fosamax" color={RISK.high.color} lines={['Treat for 5 yrs then reassess risk', 'Low risk: drug holiday', 'High risk: continue for 10 yrs']} />
                    <DrugCard name="Zoledronate" brand="Aclasta" color={RISK.high.color} lines={['Treat for 3 yrs then reassess', 'Low risk: drug holiday', 'High risk: continue for 6 yrs']} />
                    <DrugCard name="Denosumab" brand="Prolia" color={RISK.high.color} lines={['Continue until the patient is no longer high risk', 'Ensure transition into another antiresorptive']} />
                  </div>
                  <div className="rounded-lg bg-red-500/10 p-2.5 text-xs font-semibold text-red-700 dark:text-red-400">Progression of bone loss or fracture → Anabolic agents</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold" style={{ color: RISK.veryHigh.color }}>Very high risk → Anabolic agents</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <DrugCard name="Teriparatide" brand="Forteo" color={RISK.veryHigh.color} lines={['Contraindications: hypercalcemia, hyperparathyroidism, skeletal malignancy, Paget’s disease, radiation therapy', 'Treat for 24 m, once in a lifetime']} />
                    <DrugCard name="Romosozumab" brand="Evenity" color={RISK.veryHigh.color} lines={['Contraindications: recent MI, CVA within the last 1 year; high risk for CVD', 'Treat for 12 m']} />
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-2.5 text-xs font-semibold text-amber-700 dark:text-amber-400">Then sequential therapy with an antiresorptive agent</div>
                </>
              )}

              <Section Icon={Activity} title="Treatment monitoring" color={accent}>
                <ul className="list-disc space-y-0.5 pl-4">
                  <li>Repeat DXA every 2 years on the same machine and, if possible, with the same technologist.</li>
                  <li>Monitor changes at lumbar spine, total hip BMD. Compare BMDs and not T-scores.</li>
                </ul>
              </Section>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border p-3" style={{ borderTop: '3px solid #dc2626' }}>
                  <div className="text-sm font-bold">Treatment failure</div>
                  <ol className="mt-1 list-decimal pl-4 text-xs text-muted-foreground"><li>Declining BMD</li><li>Occurrence of &gt; 1 fragility fracture</li></ol>
                  <div className="mt-1 text-xs text-muted-foreground"><b>Rule out:</b> nonadherence, scan issues, secondary causes including medications</div>
                </div>
                <div className="rounded-xl border p-3" style={{ borderTop: '3px solid #16a34a' }}>
                  <div className="text-sm font-bold">Treatment success</div>
                  <ol className="mt-1 list-decimal pl-4 text-xs text-muted-foreground"><li>Stable or increasing BMD</li><li>Absence of fragility fractures</li></ol>
                </div>
              </div>
            </>
          )}

          {/* Vertebral imaging */}
          <Section Icon={Stethoscope} title="Vertebral imaging (VFA or lateral spine X-ray)" color={vfa.length ? '#ea7a12' : '#64748b'}>
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Chip on={heightLossH} onClick={() => setHeightLossH(v => !v)} accent={accent}>Historical height loss ≥ 4 cm</Chip>
              <Chip on={heightLossP} onClick={() => setHeightLossP(v => !v)} accent={accent}>Prospective height loss ≥ 2 cm</Chip>
            </div>
            {vfa.length ? (
              <><b className="text-foreground">Consider vertebral imaging:</b> {vfa.join(' · ')}</>
            ) : 'No indication from the Kuwait 2022 list.'}
          </Section>
          {dxaContra.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-2.5 text-xs text-red-700 dark:text-red-400">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div><b>DXA contraindication:</b> {dxaContra.join(' · ')}</div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <Button variant="outline" size="sm" onClick={step === 0 ? reset : () => go(step - 1)} className="gap-1.5">
          {step === 0 ? <><RotateCcw className="h-3.5 w-3.5" />Reset</> : <><ChevronLeft className="h-4 w-4" />Back</>}
        </Button>
        {step < 3 && (
          <Button size="sm" disabled={!canNext} onClick={() => go(step === 1 && before && before.category !== 'dxa' ? 3 : step + 1)} className="gap-1.5" style={{ background: accent }}>
            {step === 1 && before?.category === 'dxa' ? 'Enter DXA result' : step === 1 ? 'See plan' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {step === 3 && (
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5"><RotateCcw className="h-3.5 w-3.5" />New patient</Button>
        )}
      </div>
    </div>
  )
}
