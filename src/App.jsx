import React, { useEffect, useMemo, useState } from 'react'
import DataTable from './components/DataTable.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import { apiGetData, apiAdminAuth, apiAdminUpdate } from './utils/api.js'
import { findColumnName } from './utils/columns.js'

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)))
}

export default function App() {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('__ALL__')
  const [searchQuery, setSearchQuery] = useState('')
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token') || '')
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginPw, setLoginPw] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [saving, setSaving] = useState(false)

  const adminMode = Boolean(adminToken)

  const reload = async () => {
    setLoading(true)
    setErr('')
    try {
      const data = await apiGetData()
      setColumns(data.columns || [])
      setRows(data.rows || [])
    } catch (e) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const categoryCol = useMemo(() => findColumnName(columns, ['category']), [columns])
  const categories = useMemo(() => {
    if (!categoryCol) return []
    const cats = rows.map(r => String((r.data || {})[categoryCol] ?? '').trim()).filter(Boolean)
    return uniq(cats).sort((a, b) => a.localeCompare(b))
  }, [rows, categoryCol])

  const onCellChange = (rowId, col, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      return { ...r, data: { ...(r.data || {}), [col]: value } }
    }))
  }

  const onDeleteRow = (rowId) => {
    if (!confirm('Delete this row?')) return
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  const openAdmin = () => {
    if (adminMode) setAdminOpen(true)
    else setLoginOpen(true)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setAdminToken('')
    setAdminOpen(false)
  }

  const doLogin = async () => {
    setLoginErr('')
    try {
      const res = await apiAdminAuth(loginPw)
      const token = res.token
      localStorage.setItem('admin_token', token)
      setAdminToken(token)
      setLoginPw('')
      setLoginOpen(false)
      setAdminOpen(true)
    } catch (e) {
      setLoginErr(String(e?.message || e))
    }
  }

  const saveToDb = async () => {
    setSaving(true)
    try {
      await apiAdminUpdate({ token: adminToken, columns, rows })
      setAdminOpen(false)
      await reload()
      alert('Saved.')
    } catch (e) {
      alert(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">Loading…</div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ marginBottom: 10 }}><strong>Failed to load data</strong></div>
          <div className="smallMuted">{err}</div>
          <div style={{ height: 12 }} />
          <button onClick={reload}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <h1>West Sabahiya Health Center</h1>
          <h2>Dr. Abdullah Almusallam</h2>
        </div>

        <div className="toolbar">
          {adminMode ? (
            <>
              <span className="badge">Admin: ON</span>
              <button className="primary" onClick={() => setAdminOpen(true)}>Admin Panel</button>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="primary" onClick={openAdmin}>Admin Panel</button>
          )}
        </div>
      </div>

      <div className="controls">
        <div className="row">
          <span className="label">Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={!categoryCol}
            title={!categoryCol ? 'No Category column found' : ''}
          >
            <option value="__ALL__">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="row" style={{ flex: 1, minWidth: 260 }}>
          <span className="label">Search</span>
          <input
            type="text"
            placeholder="Search anything (generic name, dose, indications...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <button onClick={reload}>Refresh</button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
        adminMode={adminMode}
        onCellChange={onCellChange}
        onDeleteRow={onDeleteRow}
      />

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        columns={columns}
        setColumns={setColumns}
        rows={rows}
        setRows={setRows}
        saving={saving}
        onSaveToDb={saveToDb}
        onReloadFromDb={reload}
      />

      {loginOpen ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ width: 'min(420px, 100%)' }}>
            <div className="modalHeader">
              <h3>Enter admin password</h3>
              <button onClick={() => setLoginOpen(false)}>Close</button>
            </div>
            <div className="smallMuted">
              If you don&apos;t want admin access, just close this window and use the filters/search.
            </div>
            <div className="hr" />
            <div className="row">
              <input
                type="password"
                placeholder="Password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doLogin()
                }}
              />
              <button className="primary" onClick={doLogin}>Enter</button>
            </div>
            {loginErr ? (
              <div style={{ marginTop: 10 }} className="badge">
                <span style={{ color: '#fca5a5' }}>{loginErr}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
