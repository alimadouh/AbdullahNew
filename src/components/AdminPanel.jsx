import React, { useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { importFromCsvFile, exportToCsv } from '../utils/csv.js'

function SortableItem({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="columnItem">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="dragHandle" {...attributes} {...listeners}>⋮⋮</span>
        <span>{label}</span>
      </div>
      <span className="smallMuted">drag to reorder</span>
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

  // Note: columns can be dragged to any position, so new columns are simply appended.
  // Admin can reorder via drag-and-drop.

  if (!open) return null

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
    // Replace dataset (simple & predictable)
    setColumns(cols)
    // Create ids client-side; DB will accept them as-is
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
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modalHeader">
          <h3>Admin Panel</h3>
          <button onClick={onClose}>Close</button>
        </div>

        <div className="smallMuted">
          You can edit the table directly, manage columns, and import/export CSV.
        </div>

        <div className="hr" />

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <button className="primary" onClick={onSaveToDb} disabled={saving}>
              {saving ? 'Saving…' : 'Save to Database'}
            </button>
            <button onClick={onReloadFromDb} disabled={saving}>Reload from Database</button>
            <button onClick={addRow} disabled={saving}>Add row</button>
            <button className="danger" onClick={wipeAll} disabled={saving}>Delete all rows</button>
          </div>
          <div className="badge">
            <span className="smallMuted">Columns:</span>
            <strong>{columns.length}</strong>
            <span className="smallMuted">Rows:</span>
            <strong>{rows.length}</strong>
          </div>
        </div>

        <div className="hr" />

        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="label">Reorder columns (drag)</div>
            <div style={{ height: 8 }} />
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={columns} strategy={verticalListSortingStrategy}>
                <div className="columnsList">
                  {columns.map(col => (
                    <SortableItem key={col} id={col} label={col} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div style={{ width: 16 }} />

          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="label">Add new column</div>
            <div style={{ height: 8 }} />
            <div className="row">
              <input
                type="text"
                placeholder="New column name"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="primary" onClick={addColumn}>Add</button>
            </div>

            <div style={{ height: 14 }} />

            <div className="label">Remove column (type the column name)</div>
            <div style={{ height: 8 }} />
            <div className="row">
              <input
                type="text"
                placeholder="Column name to remove"
                value={removeName}
                onChange={(e) => setRemoveName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="danger" onClick={removeColumn}>Remove</button>
            </div>

            <div style={{ height: 14 }} />

            <div className="label">Import / Export</div>
            <div style={{ height: 8 }} />
            <div className="row">
              <button onClick={() => exportToCsv({ columns, rows })}>Export CSV</button>
              <label className="badge" style={{ cursor: 'pointer' }}>
                <input
                  type="file"
                  accept=".csv,text/csv"
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
                <span>Import CSV (replaces dataset)</span>
              </label>
            </div>

            {importError ? (
              <div style={{ marginTop: 10 }} className="badge">
                <span style={{ color: '#fca5a5' }}>{importError}</span>
              </div>
            ) : null}

            <div style={{ marginTop: 12 }} className="smallMuted">
              Tip: CSV header row becomes your column names. Import replaces the current table (columns + rows).
            </div>
          </div>
        </div>

        <div className="hr" />

        <div className="smallMuted">
          Changes to columns affect every row. Save to persist changes to Neon (Postgres).
        </div>
      </div>
    </div>
  )
}
