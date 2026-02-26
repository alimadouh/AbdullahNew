import React from 'react'
import { groupRows } from '../utils/grouping.js'

export default function DataTable({
  columns,
  rows,
  categoryFilter,
  searchQuery,
  adminMode,
  onCellChange,
  onDeleteRow,
}) {
  const { groups, filteredCount } = groupRows({ columns, rows, categoryFilter, searchQuery })
  const showCategoryHeaders = categoryFilter === '__ALL__'

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="badge">
          <span className="smallMuted">Rows:</span>
          <strong>{filteredCount}</strong>
        </div>
        <div className="smallMuted">
          Grouped by <strong>Category → Route</strong> so routes don&apos;t interleave.
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
              {adminMode ? <th className="actionsCol">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (adminMode ? 1 : 0)}>
                  <span className="smallMuted">No rows match your filter/search.</span>
                </td>
              </tr>
            ) : null}

            {groups.map((catGroup) => (
              <React.Fragment key={catGroup.category}>
                {showCategoryHeaders ? (
                  <tr className="groupRow">
                    <td colSpan={columns.length + (adminMode ? 1 : 0)}>
                      {catGroup.category || 'Uncategorized'}
                    </td>
                  </tr>
                ) : null}

                {catGroup.routes.map((routeGroup) => (
                  <React.Fragment key={`${catGroup.category}::${routeGroup.route}`}>
                    <tr className="groupRow">
                      <td colSpan={columns.length + (adminMode ? 1 : 0)}>
                        <span className="sub">{routeGroup.route || 'Other'}</span>
                      </td>
                    </tr>

                    {routeGroup.rows.map((r) => (
                      <tr key={r.id}>
                        {columns.map((col) => {
                          const value = (r.data || {})[col] ?? ''
                          return (
                            <td key={`${r.id}:${col}`}>
                              {adminMode ? (
                                <input
                                  className="cellInput"
                                  type="text"
                                  value={value}
                                  onChange={(e) => onCellChange?.(r.id, col, e.target.value)}
                                />
                              ) : (
                                String(value)
                              )}
                            </td>
                          )
                        })}
                        {adminMode ? (
                          <td className="actionsCol">
                            <button className="danger" onClick={() => onDeleteRow?.(r.id)}>
                              Delete row
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
