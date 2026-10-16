import { useState, useEffect } from 'react'
import { Bone, RotateCcw, Calculator, Pill, Activity, ClipboardList, Dumbbell, AlertTriangle, ExternalLink } from 'lucide-react'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'
import { assess, bmi, roundAsShown, THRESHOLD_ROWS, BMD_TYPES, toTScore, HOLOGIC_RANGE } from '../lib/osteo.js'

// Osteoporosis Risk: the FRAX questionnaire (Kuwait), then the Kuwait Osteoporosis Guidelines 2022
// decision. Without BMD → LAT/UAT (do DXA or not); with femoral neck T-score → IT/UAT (treatment).
// FRAX values come from the official FRAX Kuwait paper charts (no FRAX API).

const RISK = {
  low: { color: '#16a34a' },
  dxa: { color: '#ea7a12' },
  high: { color: '#ea7a12' },
  veryHigh: { color: '#dc2626' },
}

const QUESTIONS = [
  ['prevFracture', 'Previous Fracture'],
  ['parentHip', 'Parent Fractured Hip'],
  ['smoking', 'Current smoking'],
  ['glucocorticoids', 'Glucocorticoids'],
  ['ra', 'Rheumatoid arthritis'],
  ['secondary', 'Secondary osteoporosis'],
  ['alcohol', 'Alcohol 3 or more units/day'],
]
const EMPTY = { prevFracture: false, parentHip: false, smoking: false, glucocorticoids: false, ra: false, secondary: false, alcohol: false }

const num = (v) => (v === '' || v == null ? NaN : parseFloat(v))
const f1 = (v) => { if (!Number.isFinite(v)) return '—'; const r = roundAsShown(v); return r < 10 ? r.toFixed(1) : String(r) }

// FRAX-style on/off switch
function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className="relative h-7 w-14 shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ background: on ? '#22b8c8' : 'var(--color-muted, #e5e7eb)' }}>
      <span className="absolute top-1/2 -translate-y-1/2 text-xs font-bold" style={on ? { left: 9, color: '#fff' } : { right: 9, color: '#9ca3af' }}>{on ? '✓' : '✕'}</span>
      <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: on ? 30 : 2 }} />
    </button>
  )
}

function Row({ n, label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0">
      <span className="text-sm font-semibold"><span className="mr-1 text-muted-foreground">{n}.</span>{label}</span>
      {children}
    </div>
  )
}

// Bar with the Kuwait thresholds for this age and the patient's MOF
function ThresholdBar({ mof, thr, withBmd }) {
  const lower = withBmd ? thr.it : thr.lat
  const max = Math.max(thr.uat * 1.6, mof * 1.1, 5)
  const pos = (v) => `${Math.min(100, (v / max) * 100)}%`
  return (
    <div className="pt-7 pb-5">
      <div className="relative h-3 rounded-full" style={{ background: `linear-gradient(90deg, #16a34a 0 ${pos(lower)}, #ea7a12 ${pos(lower)} ${pos(thr.uat)}, #dc2626 ${pos(thr.uat)} 100%)` }}>
        <div className="absolute -top-7 flex -translate-x-1/2 flex-col items-center transition-all duration-500" style={{ left: pos(mof) }}>
          <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background tabular-nums">{f1(mof)}%</span>
          <span className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-foreground" />
        </div>
        {[[lower, withBmd ? 'IT' : 'LAT', 'right'], [thr.uat, 'UAT', 'left']].map(([v, l, side]) => (
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
  const area = (top, bottom) => `${THRESHOLD_ROWS.map(r => `${x(r.age)},${y(top(r))}`).join(' ')} ${[...THRESHOLD_ROWS].reverse().map(r => `${x(r.age)},${y(bottom(r))}`).join(' ')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Ten year MOF probability by age with Kuwait thresholds">
      <polygon points={area(() => 40, r => r.uat)} fill="#dc2626" opacity="0.85" />
      <polygon points={area(r => r.uat, r => r.lat)} fill="#ea7a12" opacity="0.85" />
      <polygon points={area(r => r.lat, () => 0)} fill="#16a34a" opacity="0.85" />
      <polyline points={THRESHOLD_ROWS.map(r => `${x(r.age)},${y(r.it)}`).join(' ')} fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="4 3" />
      {[0, 10, 20, 30, 40].map(p => <text key={p} x={L - 4} y={y(p) + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>{p}</text>)}
      {[40, 50, 60, 70, 80, 90].map(a => <text key={a} x={x(a)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>{a}</text>)}
      <text x={W - R - 2} y={y(27) - 3} textAnchor="end" fill="#fff" style={{ fontSize: 8, fontWeight: 700 }}>UAT</text>
      <text x={W - R - 2} y={y(23) + 9} textAnchor="end" fill="#fff" style={{ fontSize: 8, fontWeight: 700 }}>IT</text>
      <text x={W - R - 2} y={y(14) + 9} textAnchor="end" fill="#fff" style={{ fontSize: 8, fontWeight: 700 }}>LAT</text>
      <circle cx={x(Math.min(age, 90))} cy={y(mof)} r="7" fill="#fff" opacity="0.5" />
      <circle cx={x(Math.min(age, 90))} cy={y(mof)} r="4.5" fill="#111827" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

// What the result means, as on the Kuwait flowchart
function decision(r) {
  if (r.stage === 'before') {
    if (r.category === 'low') return { title: 'Low risk', text: 'Below the lower assessment threshold. Reassure and repeat FRAX after 5 years or when the clinical condition changes.' }
    if (r.category === 'dxa') return { title: 'Perform DXA', text: 'Risk not determined: between the assessment thresholds. Do DXA, then enter the femoral neck BMD (question 12) to reassess the probability.' }
    return { title: 'Very high risk', text: 'Above the upper assessment threshold. Treat with anabolic therapy ± DXA.' }
  }
  if (r.category === 'low') return { title: 'Low risk', text: 'Below the intervention threshold. Reassure and repeat FRAX & DXA after 3 years.' }
  if (r.category === 'high') return { title: 'High risk', text: 'Between the intervention threshold and the upper assessment threshold. Treat with antiresorptive therapy.' }
  return { title: 'Very high risk', text: 'Above the upper assessment threshold. Treat with anabolic therapy.' }
}

function DrugCard({ name, brand, color, lines }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderTop: `3px solid ${color}` }}>
      <div className="text-sm font-bold">{name} <span className="font-medium text-muted-foreground">({brand})</span></div>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">{lines.map(l => <li key={l}>{l}</li>)}</ul>
    </div>
  )
}

function Plan({ category, accent }) {
  if (category !== 'high' && category !== 'veryHigh') return null
  const hi = category === 'high'
  const c = RISK[category].color
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-sm font-bold" style={{ color: c }}>{hi ? 'High risk → Antiresorptive agents' : 'Very high risk → Anabolic agents'}</div>
      {hi ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <DrugCard name="Alendronate" brand="Fosamax" color={c} lines={['Treat for 5 yrs then reassess risk', 'Low risk: drug holiday', 'High risk: continue for 10 yrs']} />
          <DrugCard name="Zoledronate" brand="Aclasta" color={c} lines={['Treat for 3 yrs then reassess', 'Low risk: drug holiday', 'High risk: continue for 6 yrs']} />
          <DrugCard name="Denosumab" brand="Prolia" color={c} lines={['Continue until the patient is no longer high risk', 'Ensure transition into another antiresorptive']} />
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <DrugCard name="Teriparatide" brand="Forteo" color={c} lines={['Contraindications: hypercalcemia, hyperparathyroidism, skeletal malignancy, Paget’s disease, radiation therapy', 'Treat for 24 m, once in a lifetime']} />
          <DrugCard name="Romosozumab" brand="Evenity" color={c} lines={['Contraindications: recent MI, CVA within the last 1 year; high risk for CVD', 'Treat for 12 m']} />
        </div>
      )}
      <div className="rounded-lg p-2.5 text-xs font-semibold" style={{ background: c + '1a', color: c }}>
        {hi ? 'Progression of bone loss or fracture → Anabolic agents' : 'Then sequential therapy with an antiresorptive agent'}
      </div>
      <details className="rounded-xl border p-3 text-xs">
        <summary className="cursor-pointer text-sm font-bold">Evaluation, lifestyle and monitoring</summary>
        <div className="mt-2 space-y-2 leading-relaxed text-muted-foreground">
          <div><div className="flex items-center gap-1.5 font-semibold text-foreground"><ClipboardList className="h-3.5 w-3.5" style={{ color: accent }} />Initial evaluation</div>
            History and physical examination · height and weight · labs: CBC + ESR, RFT, LFT, bone profile, ALP, PTH-I, TFT, 25OH Vitamin D, urine calcium/creatinine · additional: gonadal hormones, celiac screen, 24hr urine for calcium, sodium and creatinine.</div>
          <div><div className="flex items-center gap-1.5 font-semibold text-foreground"><Dumbbell className="h-3.5 w-3.5" style={{ color: accent }} />Non-pharmacological</div>
            Stop smoking and alcohol, caffeine &lt; 3 cups/day · weight-bearing exercise 30 minutes/day, balance and stretching · reduce the risk of falling, including physical therapy.</div>
          <div><div className="flex items-center gap-1.5 font-semibold text-foreground"><Pill className="h-3.5 w-3.5" style={{ color: accent }} />Pharmacological</div>
            Treat vitamin D deficiency; maintain vitamin D3 1000–2000 IU/day (25-OH Vit D 75–150 nmol/L) · calcium 1000–1200 mg/day, preferably from diet · one-alfa only in chronic renal impairment and hypoparathyroidism.</div>
          <div><div className="flex items-center gap-1.5 font-semibold text-foreground"><Activity className="h-3.5 w-3.5" style={{ color: accent }} />Monitoring</div>
            Repeat DXA every 2 years on the same machine (same technologist if possible); compare lumbar spine and total hip BMD, not T-scores. Failure: declining BMD or &gt; 1 fragility fracture (rule out nonadherence, scan issues, secondary causes). Success: stable or increasing BMD and no fragility fractures.</div>
        </div>
      </details>
    </div>
  )
}

export default function OsteoTool({ theme }) {
  const accent = theme?.text || '#059669'
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('female')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [q, setQ] = useState(EMPTY)
  const [bmdType, setBmdType] = useState('none')
  const [bmdValue, setBmdValue] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const calculate = () => {
    const a = num(age), w = num(weight), h = num(height), g = num(bmdValue)
    const t = bmdType === 'none' ? NaN : toTScore(bmdType, g)
    if (!(a >= 40 && a <= 90)) return setError('Enter an age between 40 and 90 years.'), setResult(null)
    if (a < 50) return setError('The FRAX Kuwait charts start at age 50.'), setResult(null)
    if (!(w > 0 && h > 0)) return setError('Enter weight and height.'), setResult(null)
    if (bmdType !== 'none' && !Number.isFinite(g)) return setError('Enter the femoral neck BMD value, or choose "No BMD available".'), setResult(null)
    if (bmdType === 'hologic' && (g < HOLOGIC_RANGE.min || g > HOLOGIC_RANGE.max))
      return setError(`Femoral neck BMD must be between ${HOLOGIC_RANGE.min.toFixed(2)} and ${HOLOGIC_RANGE.max.toFixed(2)} g/cm² (Hologic). Enter the BMD in g/cm², not the T-score.`), setResult(null)
    const withBmd = Number.isFinite(t)
    const r = assess({ age: a, sex, weight: w, height: h, factors: { ...q, fragility: 'none' }, fnT: t }, withBmd ? 'after' : 'before')
    setError(''); setResult({ ...r, age: a, bmiValue: bmi(w, h), withBmd, tScore: t, bmdType, tClamped: withBmd && (t < -4 || t > 1) })
  }
  // Any change to the answers hides the old result until Calculate is pressed again
  useEffect(() => { setResult(null) }, [age, sex, weight, height, q, bmdType, bmdValue])

  const clear = () => { setAge(''); setSex('female'); setWeight(''); setHeight(''); setQ(EMPTY); setBmdType('none'); setBmdValue(''); setResult(null); setError('') }

  const d = result ? decision(result) : null
  const color = result ? RISK[result.category].color : accent

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold" style={{ color: accent }}>
        <Bone className="h-5 w-5" />
        Osteoporosis Risk
      </h2>

      {/* Country (only Kuwait) */}
      <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
        <span className="text-sm font-semibold">Country</span>
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: '#d0021b' }}>
          <svg viewBox="0 0 12 6" className="h-3.5 w-7 rounded-[2px]" aria-hidden="true">
            <rect width="12" height="2" fill="#007a3d" /><rect y="2" width="12" height="2" fill="#fff" /><rect y="4" width="12" height="2" fill="#ce1126" />
            <polygon points="0,0 3,2 3,4 0,6" fill="#000" />
          </svg>
          Kuwait
        </span>
      </div>

      {/* Questionnaire */}
      <div className="rounded-xl border px-3">
        <Row n={1} label="Age (between 40 and 90 years)">
          <Input className="w-24" type="number" inputMode="decimal" value={age} onChange={e => setAge(e.target.value)} placeholder="60" />
        </Row>
        <Row n={2} label="Sex">
          <div className="flex gap-3 text-sm">
            {[['female', 'Female'], ['male', 'Male']].map(([v, l]) => (
              <label key={v} className="flex cursor-pointer items-center gap-1.5">
                <input type="radio" name="osteo-sex" checked={sex === v} onChange={() => setSex(v)} className="h-4 w-4 accent-[#22b8c8]" />{l}
              </label>
            ))}
          </div>
        </Row>
        <Row n={3} label="Weight (kg)">
          <Input className="w-24" type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" />
        </Row>
        <Row n={4} label="Height (cm)">
          <Input className="w-24" type="number" inputMode="decimal" value={height} onChange={e => setHeight(e.target.value)} placeholder="165" />
        </Row>
        {QUESTIONS.map(([k, label], i) => (
          <Row key={k} n={i + 5} label={label}>
            <Toggle on={q[k]} label={label} onChange={v => setQ(p => ({ ...p, [k]: v }))} />
          </Row>
        ))}
        <Row n={12} label="Femoral neck BMD">
          <div className="flex items-center gap-2">
            <select value={bmdType} onChange={e => { setBmdType(e.target.value); setBmdValue('') }} aria-label="Femoral neck BMD type"
              className="h-9 max-w-[9.5rem] cursor-pointer rounded-md border bg-background px-2 text-xs font-medium">
              {BMD_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            {bmdType !== 'none' && (
              <Input className="w-20" type="number" inputMode="decimal" step="0.001" value={bmdValue}
                onChange={e => setBmdValue(e.target.value)} placeholder="g/cm²" />
            )}
          </div>
        </Row>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={calculate} className="gap-1.5 text-white" style={{ background: '#d0021b' }}><Calculator className="h-4 w-4" />Calculate</Button>
        <Button variant="outline" onClick={clear} className="gap-1.5" style={{ borderColor: '#d0021b', color: '#d0021b' }}><RotateCcw className="h-4 w-4" />Clear</Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>
      )}

      {result && (
        <>
          {/* FRAX-style result box */}
          <div className="overflow-hidden rounded-xl text-white" style={{ background: '#9b0d1a' }}>
            <div className="px-4 pt-3 text-sm font-bold">BMI: {result.bmiValue.toFixed(1)}</div>
            <div className="px-4 pb-2 text-xs opacity-90">The ten year probability of fracture (%) {result.withBmd ? 'with BMD' : 'without BMD'}</div>
            <div className="mx-3 mb-3 overflow-hidden rounded-lg bg-white text-sm text-gray-900">
              {[['Major osteoporotic', result.mof], ['Hip Fracture', result.hip]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between border-b px-3 py-2 last:border-b-0">
                  <span>{l}</span><span className="text-base font-extrabold tabular-nums" style={{ color: '#9b0d1a' }}>{f1(v)}</span>
                </div>
              ))}
            </div>
          </div>
          <a href="https://www.fraxplus.org/calculation-tool" target="_blank" rel="noopener noreferrer"
            className="-mt-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted"
            style={{ borderColor: '#d0021b', color: '#d0021b' }}>
            <ExternalLink className="h-3.5 w-3.5" />Check on official FRAX
          </a>

          {/* Kuwait guideline decision */}
          <div className="rounded-xl border p-4" style={{ borderColor: color + '88', background: color + '12' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Kuwait guidelines · age {result.age}</div>
              <span className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white" style={{ background: color }}>{d.title}</span>
            </div>
            <ThresholdBar mof={result.mof} thr={result.thr} withBmd={result.withBmd} />
            <p className="text-xs leading-relaxed">{d.text}</p>
            {q.prevFracture && (
              <p className="mt-2 text-xs font-semibold" style={{ color: '#dc2626' }}>If the previous fracture was spine, hip, or 2 or more other fractures: very high risk — treat with anabolic therapy ± DXA.</p>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">
              Estimate fitted to the FRAX Kuwait charts; it may differ slightly from fraxplus.org.
              {result.withBmd && ` Femoral neck T-score ${result.tScore.toFixed(2)} (Hologic BMD, NHANES III reference).`}
              {result.withBmd && q.secondary && ' Secondary osteoporosis is not used when BMD is entered.'}
              {result.tClamped && ' The T-score is outside the chart range (−4.0 to +1.0), so the nearest chart value was used.'}
            </p>
          </div>

          <div className="rounded-xl border p-3">
            <div className="mb-1 text-xs font-bold">Ten year probability of MOF (%) by age</div>
            <AgeChart age={result.age} mof={result.mof} />
          </div>

          <Plan category={result.category} accent={accent} />
        </>
      )}
    </div>
  )
}
