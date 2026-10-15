import { useState, useEffect } from 'react'
import { HeartPulse, RotateCcw, Calculator, AlertTriangle } from 'lucide-react'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'
import {
  calculate, MODELS, REGIONS, COUNTRIES, regionForCountry,
  RESULT_EXPLANATION, UNIT_KINDS, segmentRangeText, convertUnit,
} from '../lib/cvd/index.js'

// 10-year cardiovascular risk (ESC SCORE2 family). The maths lives in src/lib/cvd (tested against the
// ESC CVD Risk app and the published papers: node --test scripts/cvd-tests); this page is only the form.

const CALCS = [
  { id: 'score2', label: 'SCORE2', sub: '40–69 years' },
  { id: 'score2op', label: 'SCORE2-OP', sub: '70–89 years' },
  { id: 'score2diabetes', label: 'SCORE2-Diabetes', sub: 'Type 2 diabetes' },
]
const EMPTY = { region: '', country: '', sex: '', age: '', diabetesAge: '', smoking: false, sbp: '', totalCholesterol: '', hdl: '', hba1c: '', egfr: '' }

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

function Row({ label, error, children }) {
  return (
    <div className="border-b py-2.5 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        {children}
      </div>
      {error && <div className="mt-1 text-right text-[11px] font-medium text-red-600 dark:text-red-400">{error}</div>}
    </div>
  )
}

function UnitSwitch({ value, options, onChange, accent }) {
  return (
    <div className="flex overflow-hidden rounded-md border text-[11px] font-semibold">
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className="px-1.5 py-1.5 cursor-pointer"
          style={value === v ? { background: accent, color: '#fff' } : undefined}>{l}</button>
      ))}
    </div>
  )
}

// Risk bar: the category segments for this patient, with the patient's risk marked
// White text is hard to read on yellow and orange; use dark text there
const textOn = (bg) => (['#e8b326', '#e8832a'].includes(String(bg).toLowerCase()) ? '#1f2937' : '#ffffff')

function RiskBar({ result }) {
  const max = result.scheme.gaugeMax
  const pos = (v) => `${Math.min(100, (Math.min(v, max) / max) * 100)}%`
  return (
    <div className="pt-7 pb-6">
      <div className="relative h-3">
        <div className="flex h-3 overflow-hidden rounded-full">
          {result.segments.map(s => (
            <div key={s.label} className="h-3" style={{ width: `${((Math.min(s.to, max) - s.from) / max) * 100}%`, background: s.color }} />
          ))}
        </div>
        <div className="absolute -top-7 flex -translate-x-1/2 flex-col items-center transition-all duration-500" style={{ left: pos(result.riskPercent) }}>
          <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background tabular-nums">{result.display}%</span>
          <span className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-foreground" />
        </div>
        {result.thresholds.map((t, i) => (
          <div key={t} className="absolute top-3" style={{ left: pos(t) }}>
            <span className="absolute left-0 top-0 h-2 w-px bg-foreground/50" />
            <span className={`absolute top-2 whitespace-nowrap text-[10px] font-semibold text-muted-foreground tabular-nums ${i === 0 && result.thresholds.length > 1 ? 'right-0 pr-0.5 text-right' : 'left-0 pl-0.5'}`}>{t}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CVDTool({ theme }) {
  const accent = theme?.text || '#dc2626'
  const [calc, setCalc] = useState('score2')
  const [f, setF] = useState(EMPTY)
  const [cholUnit, setCholUnit] = useState('mmol')
  const [hba1cUnit, setHba1cUnit] = useState('percent')
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})

  const model = MODELS[calc]
  const isDm = calc === 'score2diabetes'
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const lim = (field, unit) => { const l = model.limits[field]; return unit ? l[unit] : l }
  const ph = (field, unit) => { const l = lim(field, unit); return `${l.min}–${l.max}` }

  const pickCalc = (id) => { setCalc(id); setResult(null); setErrors({}) }
  // Switching a unit converts what is already typed, so the value keeps its meaning
  const roundTo = (v, unit) => (unit === 'mgdl' || unit === 'mmolmol' ? String(Math.round(v)) : String(Math.round(v * 10) / 10))
  const conv = (kind, raw, from, to) => {
    const v = parseFloat(String(raw).replace(',', '.'))
    return Number.isFinite(v) ? roundTo(convertUnit(kind, v, from, to), to) : raw
  }
  const switchChol = (u) => { if (u === cholUnit) return; setF(p => ({ ...p, totalCholesterol: conv('cholesterol', p.totalCholesterol, cholUnit, u), hdl: conv('cholesterol', p.hdl, cholUnit, u) })); setCholUnit(u) }
  const switchHba1c = (u) => { if (u === hba1cUnit) return; setF(p => ({ ...p, hba1c: conv('hba1c', p.hba1c, hba1cUnit, u) })); setHba1cUnit(u) }
  // Any change to the answers hides the old result until Calculate is pressed again
  useEffect(() => { setResult(null) }, [f, cholUnit, hba1cUnit])
  const pickCountry = (country) => setF(p => ({ ...p, country, region: country ? regionForCountry(country) : p.region }))

  const run = () => {
    const r = calculate(calc, { ...f, units: { cholesterol: cholUnit, hba1c: hba1cUnit } })
    if (!r.ok) { setErrors(r.errors); setResult(null); return }
    setErrors({}); setResult(r)
  }
  const clear = () => { setF(EMPTY); setCholUnit('mmol'); setHba1cUnit('percent'); setResult(null); setErrors({}) }

  const cholLabel = UNIT_KINDS.cholesterol.units[cholUnit]
  const color = result?.category?.color

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold" style={{ color: accent }}>
          <HeartPulse className="h-5 w-5" />
          CVD Risk
        </h2>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: accent + '1a', color: accent }}>10-year risk · SCORE2</span>
      </div>

      {/* Calculator */}
      <div className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-1">
        {CALCS.map(c => {
          const on = calc === c.id
          return (
            <button key={c.id} type="button" onClick={() => pickCalc(c.id)} className="rounded-lg px-1.5 py-1.5 text-center leading-tight transition-colors cursor-pointer"
              style={on ? { background: accent, color: '#fff' } : undefined}>
              <div className="text-xs font-bold">{c.label}</div>
              <div className="text-[10px] opacity-80">{c.sub}</div>
            </button>
          )
        })}
      </div>
      <details className="rounded-xl border px-3 py-2 text-xs">
        <summary className="cursor-pointer font-semibold">Who is {model.title} for?</summary>
        <p className="mt-1.5 text-muted-foreground">{model.eligibilityIntro} Not for people with:</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">{model.exclusions.map(x => <li key={x}>{x}</li>)}</ul>
      </details>

      {/* Region */}
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold">Risk region</div>
        <div className="grid grid-cols-4 gap-1.5">
          {REGIONS.map(r => {
            const on = f.region === r.id
            return (
              <button key={r.id} type="button" onClick={() => setF(p => ({ ...p, region: r.id, country: '' }))}
                className="rounded-lg border px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors cursor-pointer"
                style={on ? { background: r.color, borderColor: r.color, color: textOn(r.color) } : { borderTop: `3px solid ${r.color}` }}>
                {r.label}
              </button>
            )
          })}
        </div>
        <select value={f.country} onChange={e => pickCountry(e.target.value)} aria-label="Country"
          className="h-9 cursor-pointer rounded-md border bg-background px-2 text-sm">
          <option value="">Or choose a country…</option>
          {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.country}</option>)}
        </select>
        {errors.region && <div className="text-[11px] font-medium text-red-600 dark:text-red-400">{errors.region}</div>}
      </div>

      {/* Patient */}
      <div className="rounded-xl border px-3">
        <Row label="Sex" error={errors.sex}>
          <div className="flex gap-3 text-sm">
            {[['female', 'Female'], ['male', 'Male']].map(([v, l]) => (
              <label key={v} className="flex cursor-pointer items-center gap-1.5">
                <input type="radio" name="cvd-sex" checked={f.sex === v} onChange={() => set('sex', v)} className="h-4 w-4 accent-[#22b8c8]" />{l}
              </label>
            ))}
          </div>
        </Row>
        <Row label="Age (years)" error={errors.age}>
          <Input className="w-24" type="text" inputMode="numeric" value={f.age} onChange={e => set('age', e.target.value)} placeholder={ph('age')} />
        </Row>
        {isDm && (
          <Row label="Age at diabetes diagnosis" error={errors.diabetesAge}>
            <Input className="w-24" type="text" inputMode="numeric" value={f.diabetesAge} onChange={e => set('diabetesAge', e.target.value)} placeholder={ph('diabetesAge')} />
          </Row>
        )}
        <Row label="Current smoking">
          <Toggle on={f.smoking} label="Current smoking" onChange={v => set('smoking', v)} />
        </Row>
        <Row label="Systolic BP (mmHg)" error={errors.sbp}>
          <Input className="w-24" type="text" inputMode="numeric" value={f.sbp} onChange={e => set('sbp', e.target.value)} placeholder={ph('sbp')} />
        </Row>
        <Row label="Total cholesterol" error={errors.totalCholesterol}>
          <div className="flex items-center gap-1.5">
            <UnitSwitch value={cholUnit} onChange={switchChol} accent={accent} options={[['mmol', 'mmol/L'], ['mgdl', 'mg/dL']]} />
            <Input className="w-20" type="text" inputMode="decimal" value={f.totalCholesterol} onChange={e => set('totalCholesterol', e.target.value)} placeholder={ph('totalCholesterol', cholUnit)} />
          </div>
        </Row>
        <Row label={`HDL cholesterol (${cholLabel})`} error={errors.hdl}>
          <Input className="w-20" type="text" inputMode="decimal" value={f.hdl} onChange={e => set('hdl', e.target.value)} placeholder={ph('hdl', cholUnit)} />
        </Row>
        {isDm && (
          <>
            <Row label="HbA1c" error={errors.hba1c}>
              <div className="flex items-center gap-1.5">
                <UnitSwitch value={hba1cUnit} onChange={switchHba1c} accent={accent} options={[['percent', '%'], ['mmolmol', 'mmol/mol']]} />
                <Input className="w-20" type="text" inputMode="decimal" value={f.hba1c} onChange={e => set('hba1c', e.target.value)} placeholder={ph('hba1c', hba1cUnit)} />
              </div>
            </Row>
            <Row label="eGFR (mL/min/1.73m²)" error={errors.egfr}>
              <Input className="w-24" type="text" inputMode="numeric" value={f.egfr} onChange={e => set('egfr', e.target.value)} placeholder={ph('egfr')} />
            </Row>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={run} className="gap-1.5 text-white" style={{ background: accent }}><Calculator className="h-4 w-4" />Calculate</Button>
        <Button variant="outline" onClick={clear} className="gap-1.5"><RotateCcw className="h-4 w-4" />Clear</Button>
      </div>

      {result && (
        <div className="rounded-xl border p-4" style={{ borderColor: color + '88', background: color + '12' }} aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{result.title} · {result.outcome}</div>
              <div className="flex items-center gap-2"><span className="h-6 w-1.5 rounded-full" style={{ background: color }} /><span className="text-3xl font-extrabold tabular-nums text-foreground">{result.display}%</span></div>
            </div>
            <span className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: color, color: textOn(color) }}>{result.category.label}</span>
          </div>
          <RiskBar result={result} />
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {result.segments.map(s => (
              <span key={s.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.label} {segmentRangeText(s)}</span>
            ))}
          </div>
          {result.category.guidance && <p className="mt-2 text-xs font-semibold">{result.category.guidance}</p>}
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{RESULT_EXPLANATION}</p>
          {result.band && <p className="mt-1 text-[11px] text-muted-foreground">Age group {result.band.label} thresholds.</p>}
          {result.warnings.map(w => (
            <p key={w} className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-500/10 p-2 text-[11px] text-red-700 dark:text-red-400"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</p>
          ))}
          <p className="mt-2 text-[10px] text-muted-foreground">{result.scheme.footnote}</p>
        </div>
      )}

    </div>
  )
}
