import React, { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import MED_IMAGES from '../data/medImages.json'
import ZoomImage from './ZoomImage.jsx'

// Product photo for a medication row. Photos live in /public/med-images and are mapped to
// table rows by row id in src/data/medImages.json ({ "<row id>": "<file>.webp" }).
export function medImageFor(row) {
  const file = row?.id ? MED_IMAGES[row.id] : null
  return file ? `/med-images/${file}` : null
}

export default function MedImageButton({ row, title, className = '' }) {
  const [open, setOpen] = useState(false)
  const src = medImageFor(row)
  if (!src) return null
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className={`inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer ${className}`}
        aria-label={`Show picture of ${title || 'medication'}`}
        title="Picture"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-2 text-left">
            <DialogTitle className="text-base pr-8">{title || 'Medication'}</DialogTitle>
            <DialogDescription className="sr-only">Product picture</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-5">
            <ZoomImage
              src={src}
              alt={title || 'Medication picture'}
              className="rounded-lg bg-white"
              imgClassName="w-full max-h-[70vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
