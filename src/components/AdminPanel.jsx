import React, { useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { importFromCsvFile, exportToCsv } from '../utils/csv.js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Badge } from './ui/badge.jsx'
import { Separator } from './ui/separator.jsx'
import { Save, RefreshCw, PlusCircle, Trash2, GripVertical, Download, Upload, AlertCircle } from 'lucide-react'

function SortableItem({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 ${isDragging ? 'ring-2 ring-ring opacity-80 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2.5">
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">drag to reorder</span>
    </div>
  )
}

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
}) {
  const [removeName, setRemoveName] = useState('')
  const [newColName, setNewColName] = useState('')
  const [importError, setImportError] = useState('')

  const removeColumn = () => {
    const target = removeName.trim().toLowerCase()
    if (!target) return
    const idx = columns.findIndex(c => String(c).toLowerCase() === target)
    if (idx === -1) {
      setImportError(`Column not found: "${removeName}"`)
      return
    }
    const col = columns[idx]
    const nextCols = columns.filter(c => c !== col)
    setColumns(nextCols)
    setRows(rows.map(r => {
      const data = { ...(r.data || {}) }
      delete data[col]
      return { ...r, data }
    }))
    setRemoveName('')
    setImportError('')
  }

  const addColumn = () => {
    const name = newColName.trim()
    if (!name) {
      setImportError('New column name is required.')
      return
    }
    if (/^unnamed\b/i.test(name)) {
      setImportError('Column name cannot start with "Unnamed".')
      return
    }
    if (columns.some(c => String(c).toLowerCase() === name.toLowerCase())) {
      setImportError(`Column already exists: "${name}"`)
      return
    }
    const nextCols = [...columns, name]
    setColumns(nextCols)
    setRows(rows.map(r => ({
      ...r,
      data: { ...(r.data || {}), [name]: '' },
    })))
    setNewColName('')
    setImportError('')
  }

  const onDragEnd = (event) => {
    const { active, over } = event
    if (!over) return
    if (active.id !== over.id) {
      const oldIndex = columns.indexOf(active.id)
      const newIndex = columns.indexOf(over.id)
      setColumns(arrayMove(columns, oldIndex, newIndex))
    }
  }

  const importCsv = async (file) => {
    setImportError('')
    const { columns: cols, rows: importedRows } = await importFromCsvFile(file)
    if (!cols.length) throw new Error('CSV must have a header row (column names).')
    setColumns(cols)
    const withIds = importedRows.map((r) => ({ id: crypto.randomUUID(), data: r.data }))
    setRows(withIds)
  }

  const addRow = () => {
    const empty = {}
    for (const c of columns) empty[c] = ''
    setRows([{ id: crypto.randomUUID(), data: empty }, ...rows])
  }

  const wipeAll = () => {
    if (!confirm('This will remove ALL rows (columns stay). Continue?')) return
    setRows([])
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-3xl grid gap-4">
        <DialogHeader>
          <DialogTitle>Admin Panel</DialogTitle>
          <DialogDescription>
            Edit the table directly, manage columns, and import/export CSV.
          </DialogDescription>
        </DialogHeader>

        {/* Action bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onSaveToDb} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save to Database'}
            </Button>
            <Button variant="outline" size="sm" onClick={onReloadFromDb} disabled={saving}>
              <RefreshCw className="h-4 w-4" />
              Reload
            </Button>
            <Button variant="secondary" size="sm" onClick={addRow} disabled={saving}>
              <PlusCircle className="h-4 w-4" />
              Add row
            </Button>
            <Button variant="destructive" size="sm" onClick={wipeAll} disabled={saving}>
              <Trash2 className="h-4 w-4" />
              Delete all rows
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              Columns: <span className="font-bold">{columns.length}</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              Rows: <span className="font-bold">{rows.length}</span>
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Column reorder */}
          <div>
            <h4 className="text-sm font-medium mb-3">Reorder columns (drag)</h4>
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} autoScroll={false}>
              <SortableContext items={columns} strategy={verticalListSortingStrategy}>
                <div className="grid gap-2">
                  {columns.map(col => (
                    <SortableItem key={col} id={col} label={col} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Right: Add/Remove columns, CSV */}
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-medium mb-2">Add new column</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="New column name"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={addColumn}>
                  <PlusCircle className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Remove column</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Column name to remove"
                  value={removeName}
                  onChange={(e) => setRemoveName(e.target.value)}
                  className="flex-1"
                />
                <Button variant="destructive" size="sm" onClick={removeColumn}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Import / Export</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCsv({ columns, rows })}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Import CSV
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
              <p className="text-xs text-muted-foreground mt-2">
                CSV header row becomes your column names. Import replaces the current table (columns + rows).
              </p>
            </div>

            {importError ? (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {importError}
              </div>
            ) : null}
          </div>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          Changes to columns affect every row. Save to persist changes to Neon (Postgres).
        </p>
      </DialogContent>
    </Dialog>
  )
}
