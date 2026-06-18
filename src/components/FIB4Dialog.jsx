import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'

export default function FIB4Dialog({ open, onOpenChange, theme }) {
  const [age, setAge] = useState('')
  const [ast, setAst] = useState('')
  const [alt, setAlt] = useState('')
  const [plt, setPlt] = useState('')

  const result = useMemo(() => {
    const a = parseFloat(age), s = parseFloat(ast), l = parseFloat(alt), p = parseFloat(plt)
    if (!(a > 0 && s > 0 && l > 0 && p > 0)) return null
    const score = (a * s) / (p * Math.sqrt(l))
    const elderly = a > 65
    const lowCut = elderly ? 2.0 : 1.3
    let band
    if (score < lowCut) {
      band = { label: 'Advanced fibrosis unlikely', color: '#16a34a', note: 'Low risk — routine primary-care management.' }
    } else if (score <= 2.67) {
      band = { label: 'Indeterminate', color: '#d97706', note: 'Further assessment advised — consider FibroScan.' }
    } else {
      band = { label: 'Advanced fibrosis likely', color: '#dc2626', note: 'Consider specialist referral / FibroScan.' }
    }
    return { score, band, lowCut, elderly }
  }, [age, ast, alt, plt])

  const reset = () => { setAge(''); setAst(''); setAlt(''); setPlt('') }

  const fields = [
    { key: 'age', label: 'Age', unit: 'years', value: age, set: setAge, ph: 'e.g. 58' },
    { key: 'ast', label: 'AST', unit: 'U/L', value: ast, set: setAst, ph: 'e.g. 45' },
    { key: 'alt', label: 'ALT', unit: 'U/L', value: alt, set: setAlt, ph: 'e.g. 30' },
    { key: 'plt', label: 'Platelets', unit: '×10⁹/L', value: plt, set: setPlt, ph: 'e.g. 220' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: theme?.text }}>
            <FlaskConical className="h-5 w-5" />
            FIB-4 Score
          </DialogTitle>
          <DialogDescription className="sr-only">FIB-4 liver fibrosis score calculator</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{f.label} <span className="opacity-70">({f.unit})</span></label>
              <Input
                type="number"
                inputMode="decimal"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
              />
            </div>
          ))}
        </div>

        {result ? (
          <div
            className="mt-1 rounded-xl border p-4"
            style={{ borderColor: result.band.color + '66', background: result.band.color + '14' }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums" style={{ color: result.band.color }}>{result.score.toFixed(2)}</span>
              <span className="text-xs font-medium text-muted-foreground">FIB-4</span>
            </div>
            <div className="mt-1 text-sm font-bold" style={{ color: result.band.color }}>{result.band.label}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{result.band.note}</p>
            {result.elderly && (
              <p className="mt-2 text-[11px] text-muted-foreground">Age &gt; 65 — low-risk cutoff of <strong>2.0</strong> applied (instead of 1.3).</p>
            )}
          </div>
        ) : (
          <div className="mt-1 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Enter all four values to calculate.
          </div>
        )}

        {/* Reference */}
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <div className="mb-1 font-mono text-[10px]">FIB-4 = (Age × AST) ÷ (Platelets × √ALT)</div>
          <div><span className="font-semibold text-green-600 dark:text-green-400">&lt; 1.3</span> · advanced fibrosis unlikely</div>
          <div><span className="font-semibold text-amber-600 dark:text-amber-400">1.3 – 2.67</span> · indeterminate</div>
          <div><span className="font-semibold text-red-600 dark:text-red-400">&gt; 2.67</span> · advanced fibrosis likely</div>
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
