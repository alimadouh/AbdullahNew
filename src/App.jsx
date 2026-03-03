import React, { useEffect, useMemo, useState, useCallback } from 'react'
import DataTable from './components/DataTable.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import { apiGetData, apiAdminAuth, apiAdminUpdate } from './utils/api.js'
import { findColumnName, parseAgeMonths } from './utils/columns.js'
import { Button } from './components/ui/button.jsx'
import { Input } from './components/ui/input.jsx'
import { Badge } from './components/ui/badge.jsx'
import { Card, CardContent } from './components/ui/card.jsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog.jsx'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip.jsx'

import { Loader2, AlertCircle, RefreshCw, Search, ShieldCheck, LogOut, Settings, Printer, ArrowUp, Syringe, Cross, BookOpen, Pill, ZoomIn, ZoomOut } from 'lucide-react'

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)))
}

const SECTION_THEMES = {
  clinic:         { primary: 'oklch(0.55 0.18 230)', fg: 'oklch(0.98 0.005 230)', ring: 'oklch(0.55 0.18 230)', pageBg: '#f0f9ff', bg: '#e0f2fe', text: '#0284c7', border: '#7dd3fc' },   // sky blue
  vaccination:    { primary: 'oklch(0.60 0.15 85)',  fg: 'oklch(0.98 0.005 85)',  ring: 'oklch(0.60 0.15 85)',  pageBg: '#fefce8', bg: '#fef9c3', text: '#a16207', border: '#fde047' },   // light yellow
  'er-medication':{ primary: 'oklch(0.55 0.2 25)',   fg: 'oklch(0.98 0.005 25)',  ring: 'oklch(0.55 0.2 25)',   pageBg: '#fef2f2', bg: '#fecaca', text: '#dc2626', border: '#fca5a5' },   // light red
  'er-guidelines':{ primary: 'oklch(0.62 0.16 55)',  fg: 'oklch(0.98 0.005 55)',  ring: 'oklch(0.62 0.16 55)',  pageBg: '#fff7ed', bg: '#ffedd5', text: '#ea580c', border: '#fdba74' },   // light orange
}

export default function App() {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token') || '')
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginPw, setLoginPw] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('clinic')

  const adminMode = Boolean(adminToken)
  const theme = SECTION_THEMES[activeSection]

  // Apply page background color to body
  useEffect(() => {
    document.body.style.background = SECTION_THEMES[activeSection].pageBg
    document.body.style.transition = 'background 0.3s ease'
  }, [activeSection])

  // Zoom
  const [zoom, setZoom] = useState(100)
  const zoomIn = () => setZoom(z => { const next = Math.min(z + 10, 200); document.documentElement.style.zoom = `${next}%`; return next })
  const zoomOut = () => setZoom(z => { const next = Math.max(z - 10, 20); document.documentElement.style.zoom = `${next}%`; return next })

  // Back to top
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const reload = async (section) => {
    const s = section || activeSection
    setLoading(true)
    setErr('')
    try {
      const data = await apiGetData(s)
      const cols = data.columns || []
      // Ensure __kuwait__ column exists for clinic section
      if (s === 'clinic' && !cols.includes('__kuwait__')) {
        cols.push('__kuwait__')
      }
      setColumns(cols)
      setRows(data.rows || [])
    } catch (e) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload(activeSection)
  }, [activeSection])

  const switchSection = (s) => {
    if (s === activeSection) return
    setCategoryFilter(s === 'er-guidelines' ? '__ALL__' : '')
    setSearchQuery('')
    setActiveSection(s)
  }

  const categoryCol = useMemo(() => findColumnName(columns, ['category', 'age/timing', 'age']), [columns])
  const categories = useMemo(() => {
    if (!categoryCol) return []
    const cats = rows.map(r => String((r.data || {})[categoryCol] ?? '').trim()).filter(Boolean)
    return uniq(cats).sort((a, b) => parseAgeMonths(a) - parseAgeMonths(b) || a.localeCompare(b))
  }, [rows, categoryCol])

  const routeCol = useMemo(() => findColumnName(columns, ['route']), [columns])
  const routeCount = useMemo(() => {
    if (!routeCol) return 0
    return uniq(rows.map(r => String((r.data || {})[routeCol] ?? '').trim())).length
  }, [rows, routeCol])

  const onCellChange = (rowId, col, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      return { ...r, data: { ...(r.data || {}), [col]: value } }
    }))
  }

  const onAddRow = () => {
    const empty = {}
    for (const c of columns) empty[c] = ''
    if (categoryCol && categoryFilter && categoryFilter !== '__ALL__') {
      empty[categoryCol] = categoryFilter
    }
    setRows(prev => [{ id: crypto.randomUUID(), data: empty }, ...prev])
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
      await apiAdminUpdate({ token: adminToken, columns, rows, section: activeSection })
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
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" style={{ '--color-primary': theme.primary, '--color-primary-foreground': theme.fg }}>
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground text-lg">Loading data...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (err) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-lg">Failed to load data</p>
              <p className="text-sm text-muted-foreground mt-1">{err}</p>
            </div>
            <Button variant="outline" onClick={reload}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
        style={{
          '--color-primary': theme.primary,
          '--color-primary-foreground': theme.fg,
          '--color-ring': theme.ring,
          '--color-success': theme.primary,
          '--color-success-foreground': theme.fg,
          '--color-border': theme.border,
          '--color-input': theme.border,
        }}
      >
        {/* Header */}
        <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Ministry of Health - Kuwait" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">PCIS Medication</h1>
              <p className="text-sm font-medium text-muted-foreground">Ministry of Health</p>
              <p className="text-xs text-muted-foreground mt-0.5">Done by Dr. Abdullah Almusallam</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out ({zoom}%)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in ({zoom}%)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print table</TooltipContent>
            </Tooltip>
            {adminMode ? (
              <>
                <Badge variant="success" className="gap-1.5">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </Badge>
                <Button size="sm" onClick={() => setAdminOpen(true)}>
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={openAdmin}>
                <Settings className="h-4 w-4" />
                Admin Panel
              </Button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="no-print flex flex-col gap-3 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'clinic', label: 'Clinic Medications', Icon: Pill },
              { key: 'vaccination', label: 'Vaccination', Icon: Syringe },
              { key: 'er-medication', label: 'ER Medication', Icon: Cross },
              { key: 'er-guidelines', label: 'ER Guidelines', Icon: BookOpen },
            ].map(({ key, label, Icon }) => {
              const t = SECTION_THEMES[key]
              const active = activeSection === key
              return (
                <button
                  key={key}
                  onClick={() => switchSection(key)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer"
                  style={active
                    ? { backgroundColor: t.text, color: '#fff', boxShadow: `0 1px 3px ${t.text}40` }
                    : { backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              disabled={!categoryCol}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {activeSection === 'er-guidelines' && (
                  <SelectItem value="__ALL__">All Categories</SelectItem>
                )}
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

          </div>
        </div>



        {/* Data Table */}
        {activeSection !== 'er-guidelines' && !categoryFilter && !searchQuery.trim() ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">Select a category to view medications</p>
              <p className="text-sm text-muted-foreground">Use the dropdown above to choose a category</p>
            </CardContent>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            categoryFilter={categoryFilter}
            searchQuery={searchQuery}
            adminMode={adminMode}
            onCellChange={onCellChange}
            onDeleteRow={onDeleteRow}
            onAddRow={onAddRow}
            hideInfoBar={activeSection !== 'er-guidelines'}
          />
        )}

        {/* Admin Panel Dialog */}
        <AdminPanel
          open={adminOpen}
          onClose={() => setAdminOpen(false)}
          columns={columns}
          setColumns={setColumns}
          rows={rows}
          setRows={setRows}
          saving={saving}
          onSaveToDb={saveToDb}
          onReloadFromDb={() => reload()}
          theme={theme}
        />

        {/* Login Dialog */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Password</DialogTitle>
              <DialogDescription className="sr-only">Enter password to access admin panel</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doLogin()
                }}
              />
              <Button onClick={doLogin}>Enter</Button>
            </div>
            {loginErr ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {loginErr}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Back to Top */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="no-print animate-fade-in-up fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
    </TooltipProvider>
  )
}
