import React, { useMemo, useState } from 'react'
import { groupRows } from '../utils/grouping.js'
import { findColumnName } from '../utils/columns.js'
import { Card, CardContent } from './ui/card.jsx'
import { Badge } from './ui/badge.jsx'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { FolderOpen, Trash2, Pencil, ShieldCheck, ShieldAlert, Info, Copy, Check } from 'lucide-react'

function InfoCell({ row, indicationsCol, contraCol, adminMode, onCellChange }) {
  const [open, setOpen] = useState(false)
  const indVal = (row.data || {})[indicationsCol] ?? ''
  const contraVal = (row.data || {})[contraCol] ?? ''

  return (
    <>
      <div className="flex items-center justify-center h-full">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full px-3 py-1 h-8 gap-1.5 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:text-primary"
          onClick={() => setOpen(true)}
        >
          {adminMode ? <Pencil className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
          <span className="text-xs font-medium">{adminMode ? 'Edit' : 'View'}</span>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 px-5 pt-5 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-base">Medication Details</DialogTitle>
              <DialogDescription className="text-xs">
                {adminMode ? 'Edit the fields below.' : 'Indications & contraindications for this item.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-5 space-y-4">
            {/* Indications card */}
            <div className="rounded-lg border bg-emerald-50/50 border-emerald-200/60 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Indications</span>
              </div>
              {adminMode ? (
                <textarea
                  className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  value={indVal}
                  onChange={(e) => onCellChange?.(row.id, indicationsCol, e.target.value)}
                />
              ) : (
                <p className="text-sm leading-relaxed text-foreground/80">{String(indVal) || '—'}</p>
              )}
            </div>

            {/* Contraindications card */}
            <div className="rounded-lg border bg-red-50/50 border-red-200/60 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-100">
                  <ShieldAlert className="h-3 w-3 text-red-600" />
                </div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Contraindications</span>
              </div>
              {adminMode ? (
                <textarea
                  className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-red-400/50"
                  value={contraVal}
                  onChange={(e) => onCellChange?.(row.id, contraCol, e.target.value)}
                />
              ) : (
                <p className="text-sm leading-relaxed text-foreground/80">{String(contraVal) || '—'}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function DataTable({
  columns,
  rows,
  categoryFilter,
  searchQuery,
  adminMode,
  onCellChange,
  onDeleteRow,
}) {
  const categoryCol = findColumnName(columns, ['category'])
  const indicationsCol = findColumnName(columns, ['indications'])
  const contraCol = findColumnName(columns, ['contraindications', 'contraindication'])
  const hasMergedCol = Boolean(indicationsCol && contraCol)

  const displayColumns = useMemo(() => {
    if (!hasMergedCol) return columns
    const result = []
    let inserted = false
    for (const col of columns) {
      if (col === indicationsCol || col === contraCol) {
        if (!inserted) { result.push('__INFO__'); inserted = true }
      } else {
        result.push(col)
      }
    }
    return result
  }, [columns, hasMergedCol, indicationsCol, contraCol])

  const [expandedRowId, setExpandedRowId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const formatMedicationText = (row) => {
    return columns.map(col => `*${col}:* ${(row.data || {})[col] ?? ''}`).join('\n')
  }

  const copyMedicationInfo = (row) => {
    const lines = columns.map(col => `${col}: ${(row.data || {})[col] ?? ''}`).join('\n')
    navigator.clipboard.writeText(lines).then(() => {
      setCopiedId(row.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const shareWhatsApp = (row) => {
    const text = formatMedicationText(row)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const { groups, filteredCount } = groupRows({ columns, rows, categoryFilter, searchQuery })
  const showCategoryHeaders = categoryFilter === '__ALL__'
  const colSpan = displayColumns.length + (adminMode ? 1 : 0)

  let globalRowIdx = 0

  return (
    <Card className="overflow-hidden">
      {/* Compact info bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0">
          Rows: <span className="font-bold">{filteredCount}</span>
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          Grouped by <strong>Category &rarr; Route</strong>
        </span>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px] table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                {displayColumns.map(col => (
                  <TableHead key={col} className="whitespace-nowrap">
                    {col === '__INFO__' ? 'Info' : col}
                  </TableHead>
                ))}
                {adminMode ? (
                  <TableHead className="w-10">
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colSpan} className="text-center py-6 text-muted-foreground">
                    No rows match your filter/search.
                  </TableCell>
                </TableRow>
              ) : null}

              {groups.map((catGroup) => (
                <React.Fragment key={catGroup.category}>
                  {showCategoryHeaders ? (
                    <TableRow className="bg-primary/5 hover:bg-primary/8">
                      <TableCell colSpan={colSpan} className="py-1 font-semibold text-foreground text-[13px]">
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                          {catGroup.category || 'Uncategorized'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {catGroup.routes.map((routeGroup) => (
                    <React.Fragment key={`${catGroup.category}::${routeGroup.route}`}>
                      <TableRow className="bg-emerald-50 hover:bg-emerald-50">
                        <TableCell colSpan={colSpan} className="py-1.5">
                        </TableCell>
                      </TableRow>

                      {routeGroup.rows.map((r, idx) => {
                        const rowDelay = globalRowIdx * 0.03
                        globalRowIdx++
                        const isExpanded = expandedRowId === r.id
                        return (
                          <React.Fragment key={r.id}>
                            <TableRow
                              className={`animate-row-in ${idx % 2 === 1 ? 'bg-muted/10' : ''} ${!adminMode ? 'cursor-pointer hover:bg-accent/50' : ''}`}
                              style={{ animationDelay: `${rowDelay}s` }}
                              onClick={() => { if (!adminMode) setExpandedRowId(isExpanded ? null : r.id) }}
                            >
                              {displayColumns.map((col) => {
                                if (col === '__INFO__') {
                                  return (
                                    <TableCell key={`${r.id}:__INFO__`} className="leading-snug" onClick={(e) => e.stopPropagation()}>
                                      <InfoCell
                                        row={r}
                                        indicationsCol={indicationsCol}
                                        contraCol={contraCol}
                                        adminMode={adminMode}
                                        onCellChange={onCellChange}
                                      />
                                    </TableCell>
                                  )
                                }
                                const value = (r.data || {})[col] ?? ''
                                const isCategory = col === categoryCol
                                return (
                                  <TableCell key={`${r.id}:${col}`} className="leading-snug">
                                    {adminMode ? (
                                      <Input
                                        type="text"
                                        value={value}
                                        onChange={(e) => onCellChange?.(r.id, col, e.target.value)}
                                        className="h-7 text-[12px] px-1.5"
                                      />
                                    ) : isCategory && value ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                        {String(value)}
                                      </span>
                                    ) : (
                                      <span className="line-clamp-4">{String(value)}</span>
                                    )}
                                  </TableCell>
                                )
                              })}
                              {adminMode ? (
                                <TableCell className="py-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onDeleteRow?.(r.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              ) : null}
                            </TableRow>

                            {/* Expanded detail row */}
                            {isExpanded && !adminMode && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={colSpan} className="p-0">
                                  <div className="animate-expand-in bg-accent/30 border-t border-b border-border px-4 py-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                                      {columns.map(col => {
                                        const val = (r.data || {})[col] ?? ''
                                        return (
                                          <div key={col} className="flex gap-2">
                                            <span className="font-medium text-muted-foreground shrink-0">{col}:</span>
                                            <span className="text-foreground">{String(val) || '—'}</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                    <div className="mt-3 flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-xs"
                                        onClick={(e) => { e.stopPropagation(); copyMedicationInfo(r) }}
                                      >
                                        {copiedId === r.id ? (
                                          <><Check className="h-3.5 w-3.5 text-success" /> Copied!</>
                                        ) : (
                                          <><Copy className="h-3.5 w-3.5" /> Copy Info</>
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="gap-1.5 text-xs bg-[#25D366] hover:bg-[#1da851] text-white border-0"
                                        onClick={(e) => { e.stopPropagation(); shareWhatsApp(r) }}
                                      >
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                        WhatsApp
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
