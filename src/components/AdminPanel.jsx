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
import {
  Save, RefreshCw, PlusCircle, Trash2, GripVertical,
  Download, Upload, AlertCircle, X, Columns3, Table2,
  ArrowLeftRight, AlertTriangle,
} from 'lucide-react'

function SortableColumn({ id, label, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 ${isDragging ? 'ring-2 ring-ring opacity-80 shadow-lg z-10' : ''}`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium flex-1 truncate">{label}</span>
      <button
        onClick={() => onDelete(id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100 cursor-pointer"
        title={`Remove "${label}"`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
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
  const [activeTab, setActiveTab] = useState('columns')
  const [newColName, setNewColName] = useState('')
  const [importError, setImportError] = useState('')

  /* ── Column operations ── */
  const removeColumn = (col) => {
    if (!confirm(`Remove column "${col}"? This deletes that field from every row.`)) return
    const nextCols = columns.filter(c => c !== col)
    setColumns(nextCols)
    setRows(rows.map(r => {
      const data = { ...(r.data || {}) }
      delete data[col]
      return { ...r, data }
    }))
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

  /* ── CSV operations ── */
  const importCsv = async (file) => {
    setImportError('')
    const { columns: cols, rows: importedRows } = await importFromCsvFile(file)
    if (!cols.length) throw new Error('CSV must have a header row (column names).')
    setColumns(cols)
    const withIds = importedRows.map((r) => ({ id: crypto.randomUUID(), data: r.data }))
    setRows(withIds)
    setActiveTab('columns')
  }

  /* ── Row operations ── */
  const addRow = () => {
    const empty = {}
    for (const c of columns) empty[c] = ''
    setRows([{ id: crypto.randomUUID(), data: empty }, ...rows])
  }

  const wipeAll = () => {
    if (!confirm('This will remove ALL rows (columns stay). Continue?')) return
    setRows([])
  }

  /* ── Tab definitions ── */
  const tabs = [
    { key: 'columns', label: 'Columns', icon: Columns3 },
    { key: 'rows', label: 'Rows', icon: Table2 },
    { key: 'import-export', label: 'Import / Export', icon: ArrowLeftRight },
  ]

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-20 border-b bg-background px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl">Admin Panel</DialogTitle>
              <DialogDescription>
                Manage columns, rows, and import/export your data.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Columns3 className="h-3 w-3" />
                {columns.length} cols
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Table2 className="h-3 w-3" />
                {rows.length} rows
              </Badge>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <Button size="sm" onClick={onSaveToDb} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={onReloadFromDb} disabled={saving}>
                <RefreshCw className="h-4 w-4" />
                Reload
              </Button>
            </div>
          </div>

          {/* ── Tab switcher ── */}
          <div className="mt-4 flex gap-1 rounded-lg bg-muted p-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setImportError('') }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable content area ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Error banner */}
          {importError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">{importError}</span>
              <button onClick={() => setImportError('')} className="shrink-0 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Tab: Columns ── */}
          {activeTab === 'columns' && (
            <div className="space-y-5">
              {columns.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                  No columns yet. Add one below or import a CSV.
                </div>
              ) : (
                <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} autoScroll={false}>
                  <SortableContext items={columns} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-2">
                      {columns.map(col => (
                        <SortableColumn key={col} id={col} label={col} onDelete={removeColumn} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <Separator />

              {/* Add new column */}
              <div>
                <h4 className="text-sm font-medium mb-2">Add New Column</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Column name…"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addColumn() }}
                    className="flex-1 max-w-sm"
                  />
                  <Button size="sm" onClick={addColumn}>
                    <PlusCircle className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Rows ── */}
          {activeTab === 'rows' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Add row card */}
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h4 className="text-sm font-semibold">Add Empty Row</h4>
                <p className="text-sm text-muted-foreground">
                  Creates a new blank row at the top of the table with all current columns.
                </p>
                <Button size="sm" onClick={addRow} disabled={saving || columns.length === 0}>
                  <PlusCircle className="h-4 w-4" />
                  Add Row
                </Button>
              </div>

              {/* Delete all rows card */}
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-destructive">Delete All Rows</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently removes all <span className="font-bold">{rows.length}</span> rows. Columns are kept.
                </p>
                <Button variant="destructive" size="sm" onClick={wipeAll} disabled={saving || rows.length === 0}>
                  <Trash2 className="h-4 w-4" />
                  Delete All ({rows.length})
                </Button>
              </div>

              {/* Summary */}
              <div className="sm:col-span-2 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                Current dataset: <strong>{columns.length}</strong> columns × <strong>{rows.length}</strong> rows. Remember to <strong>Save</strong> after making changes.
              </div>
            </div>
          )}

          {/* ── Tab: Import / Export ── */}
          {activeTab === 'import-export' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Export card */}
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h4 className="text-sm font-semibold">Export to CSV</h4>
                <p className="text-sm text-muted-foreground">
                  Download the current table as a CSV file. Includes all columns and rows.
                </p>
                <Button variant="outline" size="sm" onClick={() => exportToCsv({ columns, rows })} disabled={columns.length === 0}>
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              </div>

              {/* Import card */}
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h4 className="text-sm font-semibold">Import from CSV</h4>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file to replace the current table. The header row becomes your column names.
                </p>
                <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Import replaces all existing columns and rows.
                </div>
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Choose CSV File
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
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t px-6 py-3">
          <p className="text-xs text-muted-foreground text-center">
            Changes are local until you Save. Save persists to Neon (Postgres).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
