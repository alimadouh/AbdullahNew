import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { Activity, RotateCcw, CalendarClock } from 'lucide-react'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'

// Prognosis of CKD by GFR and albuminuria categories — the KDIGO heat map as printed on the
// clinic card (table adapted from de Boer et al., Diabetes Care 2022). Nothing beyond the card.
const G_ROWS = [
  { g: 'G1', name: 'Normal or high', range: '≥90', min: 90 },
  { g: 'G2', name: 'Mildly decreased', range: '60–89', min: 60 },
  { g: 'G3a', name: 'Mildly to moderately decreased', range: '45–59', min: 45 },
  { g: 'G3b', name: 'Moderately to severely decreased', range: '30–44', min: 30 },
  { g: 'G4', name: 'Severely decreased', range: '15–29', min: 15 },
  { g: 'G5', name: 'Kidney failure', range: '<15', min: 0 },
]
const A_COLS = [
  { a: 'A1', name: 'Normal to mildly increased', mgg: '<30 mg/g', mgmmol: '<3 mg/mmol' },
  { a: 'A2', name: 'Moderately increased', mgg: '30–299 mg/g', mgmmol: '3–30 mg/mmol' },
  { a: 'A3', name: 'Severely increased', mgg: '≥300 mg/g', mgmmol: '>30 mg/mmol' },
]
// Box colours, rows G1..G5 × columns A1..A3
const GRID = [
  ['low', 'mod', 'vh1'],
  ['low', 'mod', 'vh1'],
  ['mod', 'high', 'vh1'],
  ['high', 'vh1', 'vh1'],
  ['vh1', 'vh1', 'vh2'],
  ['vh2', 'vh2', 'vh2'],
]
// Labels, actions and testing frequency from the card's legend and footnotes b–f
const RISK = {
  low:  { label: 'Low risk', action: 'Monitor', bg: '#5f9e83', fg: '#ffffff', dots: 1,
          note: 'Stable disease, or no CKD if there are no other markers of kidney damage. Measure once a year, or earlier if new symptoms or risk factors.' },
  mod:  { label: 'Moderately increased risk', action: 'Treat', bg: '#f0b43c', fg: '#3d2a00', dots: 1,
          note: 'Measure at least once a year.' },
  high: { label: 'High risk', action: 'Treat', bg: '#ea7426', fg: '#ffffff', dots: 2,
          note: 'Measure at least twice a year.' },
  vh1:  { label: 'Very high risk', action: 'Treat and consult', bg: '#d42136', fg: '#ffffff', dots: 3,
          note: 'Treat in agreement with a nephrologist. Measure at least three times a year.' },
  vh2:  { label: 'Very high risk', action: 'Treat and consult', bg: '#9b1328', fg: '#ffffff', dots: 4,
          note: 'Treat in agreement with a nephrologist. Closest monitoring: at least four times a year (every 1–3 months).' },
}
const LEGEND = [
  { label: 'Low risk', bg: RISK.low.bg },
  { label: 'Moderately increased risk', bg: RISK.mod.bg },
  { label: 'High risk', bg: RISK.high.bg },
  { label: 'Very high risk', bg: RISK.vh1.bg, bg2: RISK.vh2.bg },
]

const gIndex = (egfr) => G_ROWS.findIndex(r => egfr >= r.min)
function aIndex(acr, unit) {
  if (unit === 'mgmmol') return acr < 3 ? 0 : acr <= 30 ? 1 : 2
  return acr < 30 ? 0 : acr < 300 ? 1 : 2
}

function Segmented({ value, onChange, options, accent }) {
  return (
    <div className="grid rounded-xl border bg-muted/40 p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(o => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-[10px] px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            style={on ? { background: accent, color: '#fff' } : undefined}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// Measurements per year: 4 dots, filled = how many times
function PerYearDots({ n, color }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${n} times a year`}>
      {[1, 2, 3, 4].map(i => (
        <span key={i} className="h-2.5 w-2.5 rounded-full border" style={i <= n ? { background: color, borderColor: color } : undefined} />
      ))}
    </div>
  )
}

// The heat map. The patient's box pulses; any box can be tapped to see what it means.
function HeatMap({ cell, picked, onPick, acrUnit }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid text-[10px] font-semibold" style={{ gridTemplateColumns: '64px repeat(3, 1fr)' }}>
        <div className="flex items-end bg-muted/60 p-1.5 leading-tight text-muted-foreground">eGFR ↓<br />UACR →</div>
        {A_COLS.map(c => (
          <div key={c.a} className="bg-muted/60 p-1.5 text-center leading-tight">
            <div className="text-xs font-extrabold">{c.a}</div>
            <div className="text-muted-foreground">{acrUnit === 'mgmmol' ? c.mgmmol : c.mgg}</div>
          </div>
        ))}
        {G_ROWS.map((row, gi) => (
          <div key={row.g} className="contents">
            <div className="flex flex-col justify-center border-t bg-muted/60 px-1.5 py-1 leading-tight">
              <span className="text-xs font-extrabold">{row.g}</span>
              <span className="text-muted-foreground">{row.range}</span>
            </div>
            {A_COLS.map((col, ai) => {
              const risk = RISK[GRID[gi][ai]]
              const isPatient = cell && cell.gi === gi && cell.ai === ai
              const isPicked = picked && picked.gi === gi && picked.ai === ai
              const dim = (cell || picked) && !isPatient && !isPicked
              return (
                <button
                  key={col.a}
                  type="button"
                  onClick={() => onPick(isPicked ? null : { gi, ai })}
                  className={`relative m-[2px] flex min-h-[44px] cursor-pointer items-center justify-center rounded-md px-1 text-center text-[10px] font-bold leading-tight transition-all duration-300 ${isPatient ? 'ckd-pulse z-10 scale-[1.06]' : ''}`}
                  style={{
                    background: risk.bg, color: risk.fg, opacity: dim ? 0.38 : 1,
                    boxShadow: isPicked && !isPatient ? 'inset 0 0 0 2px currentColor' : undefined,
                  }}
                  aria-label={`${row.g} ${col.a}: ${risk.label}, ${risk.action}`}
                >
                  {risk.action}
                  {isPatient && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-foreground" />}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CKDDialog({ open, onOpenChange, theme }) {
  const accent = theme?.text || '#0ea5e9'
  const [egfr, setEgfr] = useState('')
  const [acr, setAcr] = useState('')
  const [acrUnit, setAcrUnit] = useState('mgmmol')
  const [picked, setPicked] = useState(null)

  const cell = useMemo(() => {
    const e = parseFloat(egfr), u = parseFloat(acr)
    if (!(e >= 0) || egfr === '' || !(u >= 0) || acr === '') return null
    return { gi: gIndex(e), ai: aIndex(u, acrUnit) }
  }, [egfr, acr, acrUnit])

  // A new patient box clears any box the user tapped
  useEffect(() => { setPicked(null) }, [cell?.gi, cell?.ai])

  const view = picked || cell
  const risk = view ? RISK[GRID[view.gi][view.ai]] : null
  const isOther = picked && (!cell || picked.gi !== cell.gi || picked.ai !== cell.ai)

  const reset = () => { setEgfr(''); setAcr(''); setPicked(null) }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <style>{`
          @keyframes ckd-pulse { 0%,100% { box-shadow: 0 0 0 3px #fff, 0 0 0 5px currentColor } 50% { box-shadow: 0 0 0 3px #fff, 0 0 0 9px transparent } }
          .ckd-pulse { animation: ckd-pulse 1.6s ease-in-out infinite; }
        `}</style>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: accent }}>
            <Activity className="h-5 w-5" />
            CKD Prognosis
          </DialogTitle>
          <DialogDescription className="text-xs">Prognosis of CKD by GFR and albuminuria categories</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">eGFR <span className="opacity-70">(mL/min/1.73 m²)</span></label>
            <Input type="number" inputMode="decimal" value={egfr} onChange={e => setEgfr(e.target.value)} placeholder="e.g. 38" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">UACR</label>
            <Input type="number" inputMode="decimal" value={acr} onChange={e => setAcr(e.target.value)} placeholder={acrUnit === 'mgmmol' ? 'e.g. 12' : 'e.g. 110'} />
          </div>
        </div>
        <Segmented value={acrUnit} onChange={setAcrUnit} accent={accent} options={[{ value: 'mgmmol', label: 'UACR in mg/mmol' }, { value: 'mgg', label: 'UACR in mg/g' }]} />

        <HeatMap cell={cell} picked={picked} onPick={setPicked} acrUnit={acrUnit} />

        {view && risk ? (
          <div className="rounded-xl border p-4" style={{ borderColor: risk.bg + '88', background: risk.bg + '14' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{isOther ? 'Selected box' : 'This patient'}</div>
                <div className="text-2xl font-extrabold leading-tight">{G_ROWS[view.gi].g} · {A_COLS[view.ai].a}</div>
                <div className="text-sm font-bold" style={{ color: risk.bg }}>{risk.label}</div>
              </div>
              <span className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: risk.bg, color: risk.fg }}>{risk.action}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
              <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <PerYearDots n={risk.dots} color={risk.bg} />
              <span className="text-xs font-semibold">{risk.dots === 4 ? '4+' : risk.dots}× a year</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{risk.note}</p>
            <div className="mt-2 text-[11px] text-muted-foreground">
              GFR: {G_ROWS[view.gi].name} ({G_ROWS[view.gi].range}) · Albuminuria: {A_COLS[view.ai].name} ({acrUnit === 'mgmmol' ? A_COLS[view.ai].mgmmol : A_COLS[view.ai].mgg})
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Enter eGFR and UACR, or tap a box.
          </div>
        )}

        {/* Legend + source, as on the card */}
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <div className="mb-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {LEGEND.map(l => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: l.bg }} />
                {l.bg2 && <span className="-ml-1 h-3 w-3 rounded-sm" style={{ background: l.bg2 }} />}
                {l.label}
              </span>
            ))}
          </div>
          <div>
            Table adapted from{' '}
            <a href="https://diabetesjournals.org/care/article/45/12/3075/147614" target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-foreground">de Boer et al., Diabetes Care 2022</a>
            {' · '}
            <a href="https://www.theisn.org/wp-content/uploads/2022/11/One-Page-Print-Out.pdf" target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-foreground">ISN: CKD early identification</a>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
