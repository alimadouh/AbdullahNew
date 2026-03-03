import React, { useState } from 'react'
import { importFromCsvFile, exportToCsv } from '../utils/csv.js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { Button } from './ui/button.jsx'
import {
  Save, PlusCircle, Trash2,
  Download, Upload, AlertCircle, X, Pencil,
} from 'lucide-react'

export default function AdminPanel({
  open,
  onClose,
  columns,
  setColumns,
  rows,
  setRows,
  onSaveToDb,
  saving,
  onReloadFromDb,
  theme,
}) {
  const [importError, setImportError] = useState('')

  /* ── CSV operations ── */
  const importCsv = async (file) => {
    setImportError('')
    const { columns: cols, rows: importedRows } = await importFromCsvFile(file)
    if (!cols.length) throw new Error('CSV must have a header row (column names).')
    setColumns(cols)
    const withIds = importedRows.map((r) => ({ id: crypto.randomUUID(), data: r.data }))
    setRows(withIds)
  }

  const wipeAll = () => {
    const pw = prompt('Enter password to delete all data:')
    if (pw === null) return
    if (pw !== '5123') { alert('Wrong password.'); return }
    setRows([])
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent
        className="w-[90vw] max-w-sm p-0 gap-0 rounded-2xl"
        style={{
          '--color-primary': theme?.primary,
          '--color-primary-foreground': theme?.fg,
          '--color-ring': theme?.ring,
          '--color-border': theme?.border,
          '--color-input': theme?.border,
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-center">Admin Panel</DialogTitle>
          <DialogDescription className="sr-only">Admin panel</DialogDescription>
        </DialogHeader>

        {/* ── Content ── */}
        <div className="px-6 pb-6 pt-3 space-y-3">
          {/* Error banner */}
          {importError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-xs">{importError}</span>
              <button onClick={() => setImportError('')} className="shrink-0 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Edit data */}
          <Button className="w-full h-11 text-sm font-semibold rounded-xl gap-2" onClick={onClose}>
            <Pencil className="h-4 w-4" />
            Edit Data
          </Button>

          {/* Import / Export */}
          <div className="grid gap-2 grid-cols-2">
            <Button variant="outline" className="h-11 rounded-xl text-sm font-medium gap-2" onClick={() => exportToCsv({ columns, rows })} disabled={columns.length === 0}>
              <Download className="h-4 w-4" />
              Export
            </Button>

            <label>
              <Button variant="outline" className="w-full h-11 rounded-xl text-sm font-medium gap-2" asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    await importCsv(file)
                  } catch (err) {
                    setImportError(String(err?.message || err))
                  } finally {
                    e.target.value = ''
                  }
                }}
              />
            </label>
          </div>

          {/* Save */}
          <Button className="w-full h-11 text-sm font-semibold rounded-xl gap-2" onClick={onSaveToDb} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>

          {/* Delete all */}
          <button
            className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-2 cursor-pointer"
            onClick={wipeAll}
            disabled={saving || rows.length === 0}
          >
            Delete All Data
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
