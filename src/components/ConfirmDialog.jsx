import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { Button } from './ui/button.jsx'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, onConfirm, onCancel, title, description, confirmLabel, variant }) {
  const isDestructive = variant === 'destructive'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 rounded-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-4 gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isDestructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg">{title || 'Are you sure?'}</DialogTitle>
            <DialogDescription className="text-sm">{description || 'This action cannot be undone.'}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            className="flex-1 rounded-xl"
            onClick={onConfirm}
          >
            {confirmLabel || 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
