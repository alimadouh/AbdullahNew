import React, { useEffect, useMemo, useState, useCallback } from 'react'
import DataTable from './components/DataTable.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import { apiGetData, apiAdminAuth, apiAdminUpdate } from './utils/api.js'
import { findColumnName } from './utils/columns.js'
import { Button } from './components/ui/button.jsx'
import { Input } from './components/ui/input.jsx'
import { Badge } from './components/ui/badge.jsx'
import { Card, CardContent } from './components/ui/card.jsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog.jsx'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip.jsx'
import { Separator } from './components/ui/separator.jsx'
import { Loader2, AlertCircle, RefreshCw, Search, ShieldCheck, LogOut, Settings, Printer, ArrowUp } from 'lucide-react'

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
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
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
        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Category</span>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              disabled={!categoryCol}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Search</span>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search anything (generic name, dose, indications...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={reload}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh data</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print table</TooltipContent>
          </Tooltip>
        </div>

        <Separator className="no-print mb-5" />

        {/* Stats Bar */}
        <div className="no-print flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            {rows.length} Medications
          </Badge>
          {categories.length > 0 && (
            <Badge variant="secondary" className="gap-1.5 text-xs">
              {categories.length} Categories
            </Badge>
          )}
          {routeCount > 0 && (
            <Badge variant="secondary" className="gap-1.5 text-xs">
              {routeCount} Routes
            </Badge>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          rows={rows}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
          adminMode={adminMode}
          onCellChange={onCellChange}
          onDeleteRow={onDeleteRow}
        />

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
          onReloadFromDb={reload}
        />

        {/* Login Dialog */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter admin password</DialogTitle>
              <DialogDescription>
                If you don&apos;t want admin access, just close this window and use the filters/search.
              </DialogDescription>
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
