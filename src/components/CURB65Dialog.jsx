import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { Stethoscope, Check, RotateCcw } from 'lucide-react'
import { Button } from './ui/button.jsx'

const CRITERIA = [
  { key: 'confusion', label: 'Confusion', hint: 'New-onset disorientation' },
  { key: 'urea', label: 'Urea (BUN) > 19 mg/dL', hint: '> 7 mmol/L' },
  { key: 'rr', label: 'Respiratory rate ≥ 30 breaths/min', hint: '' },
  { key: 'bp', label: 'Systolic BP < 90 or Diastolic ≤ 60 mmHg', hint: '' },
  { key: 'age', label: 'Age ≥ 65 years', hint: '' },
]

export default function CURB65Dialog({ open, onOpenChange, theme }) {
  const [checked, setChecked] = useState({})
  const accent = theme?.text || '#0e7490'
  const score = CRITERIA.reduce((n, c) => n + (checked[c.key] ? 1 : 0), 0)
  const toggle = (k) => setChecked(p => ({ ...p, [k]: !p[k] }))
  const reset = () => setChecked({})

  const band = score <= 1
    ? { label: 'Low severity', color: '#16a34a', mortality: '1.5% 30-day mortality', advice: 'Outpatient care.' }
    : score === 2
    ? { label: 'Moderate severity', color: '#d97706', mortality: '9.2% 30-day mortality', advice: 'Inpatient versus observation admission.' }
    : { label: 'High severity', color: '#dc2626', mortality: '22% 30-day mortality', advice: 'Inpatient admission; consider ICU if score 4–5.' }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: accent }}>
            <Stethoscope className="h-5 w-5" />
            CURB-65 Score
          </DialogTitle>
          <DialogDescription className="sr-only">CURB-65 pneumonia severity score</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {CRITERIA.map((c) => {
            const on = !!checked[c.key]
            return (
              <button
                key={c.key}
                onClick={() => toggle(c.key)}
                className="flex items-center gap-3 rounded-xl border p-3 text-left cursor-pointer transition-colors hover:bg-accent"
                style={on ? { borderColor: accent, backgroundColor: accent + '14' } : undefined}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-input"
                  style={on ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  {on && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug">{c.label}</span>
                  {c.hint && <span className="block text-xs text-muted-foreground">{c.hint}</span>}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">+1</span>
              </button>
            )
          })}
        </div>

        {/* Result */}
        <div className="rounded-xl border p-4" style={{ borderColor: band.color + '66', background: band.color + '14' }}>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums" style={{ color: band.color }}>{score}</span>
            <span className="text-xs font-medium text-muted-foreground">/ 5</span>
          </div>
          <div className="mt-1 text-sm font-bold" style={{ color: band.color }}>{band.label}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{band.mortality} · {band.advice}</p>
        </div>

        {/* Reference */}
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <div><span className="font-semibold text-green-600 dark:text-green-400">0–1</span> · 1.5% mortality · outpatient</div>
          <div><span className="font-semibold text-amber-600 dark:text-amber-400">2</span> · 9.2% mortality · inpatient / observation</div>
          <div><span className="font-semibold text-red-600 dark:text-red-400">≥ 3</span> · 22% mortality · inpatient ± ICU (4–5)</div>
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
