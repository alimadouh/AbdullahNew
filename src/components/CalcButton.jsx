import React, { useState } from 'react'
import { Calculator } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { DoseCalculator, parseCalc } from './MedicationDetails.jsx'

// Dose calculator for one medication row, opened from a round button beside the picture button.
// Shown only when the row's monograph has a weight- or age-based calculator (fixed doses have none).
export function calcsFor(row, indicationsCol) {
  const ind = indicationsCol ? (row?.data || {})[indicationsCol] : null
  return ind && typeof ind === 'object' ? parseCalc(ind.calc) : []
}

export default function CalcButton({ row, indicationsCol, title, className = '' }) {
  const [open, setOpen] = useState(false)
  const calcs = calcsFor(row, indicationsCol)
  if (!calcs.length) return null
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className={`inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer ${className}`}
        aria-label={`Dose calculator for ${title || 'medication'}`}
        title="Dose calculator"
      >
        <Calculator className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[88vh]">
          <DialogHeader className="px-5 pt-5 pb-2 text-left">
            <DialogTitle className="text-base pr-10 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary shrink-0" /> {title || 'Dose calculator'}
            </DialogTitle>
            <DialogDescription className="sr-only">Dose calculator</DialogDescription>
          </DialogHeader>
          <div data-dialog-scroll className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-5">
            <DoseCalculator calcs={calcs} bare />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
