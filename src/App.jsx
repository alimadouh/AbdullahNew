import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import DataTable from './components/DataTable.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { apiGetData, apiAdminAuth, apiAdminUpdate } from './utils/api.js'
import { findColumnName, parseAgeMonths } from './utils/columns.js'
import { Button } from './components/ui/button.jsx'
import { Input } from './components/ui/input.jsx'
import { Badge } from './components/ui/badge.jsx'
import { Card, CardContent } from './components/ui/card.jsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog.jsx'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip.jsx'

import { Loader2, AlertCircle, RefreshCw, Search, ShieldCheck, LogOut, Settings, Printer, ArrowUp, Syringe, Cross, BookOpen, Pill, ZoomIn, ZoomOut, MessageSquare, Send, Bell, Trash2, Inbox, Clock, ChevronRight, CheckCheck } from 'lucide-react'

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)))
}

function getTimeAgo(dateStr) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SECTIONS = ['clinic', 'vaccination', 'er-medication', 'er-guidelines']
const SECTION_LABELS = { clinic: 'Clinic Medications', vaccination: 'Vaccination', 'er-medication': 'ER Medication', 'er-guidelines': 'ER Guidelines' }

const SECTION_THEMES = {
  clinic:         { primary: 'oklch(0.55 0.18 230)', fg: 'oklch(0.98 0.005 230)', ring: 'oklch(0.55 0.18 230)', pageBg: '#f0f9ff', bg: '#e0f2fe', text: '#0284c7', border: '#7dd3fc' },   // sky blue
  vaccination:    { primary: 'oklch(0.60 0.15 85)',  fg: 'oklch(0.98 0.005 85)',  ring: 'oklch(0.60 0.15 85)',  pageBg: '#fefce8', bg: '#fef9c3', text: '#a16207', border: '#fde047' },   // light yellow
  'er-medication':{ primary: 'oklch(0.55 0.2 25)',   fg: 'oklch(0.98 0.005 25)',  ring: 'oklch(0.55 0.2 25)',   pageBg: '#fef2f2', bg: '#fecaca', text: '#dc2626', border: '#fca5a5' },   // light red
  'er-guidelines':{ primary: 'oklch(0.62 0.16 55)',  fg: 'oklch(0.98 0.005 55)',  ring: 'oklch(0.62 0.16 55)',  pageBg: '#fff7ed', bg: '#ffedd5', text: '#ea580c', border: '#fdba74' },   // light orange
  notifications:  { primary: 'oklch(0.55 0.18 280)', fg: 'oklch(0.98 0.005 280)', ring: 'oklch(0.55 0.18 280)', pageBg: '#f5f3ff', bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },   // purple
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackList, setFeedbackList] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState(null)

  const adminMode = Boolean(adminToken)
  const theme = SECTION_THEMES[activeSection]

  // Apply page background color to body
  useEffect(() => {
    document.body.style.background = SECTION_THEMES[activeSection].pageBg
    document.body.style.transition = 'background 0.3s ease'
  }, [activeSection])

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  // Swipe between sections
  const touchRef = useRef(null)

  const onTouchStart = useCallback((e) => {
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (!touchRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchRef.current.x
    const dy = t.clientY - touchRef.current.y
    touchRef.current = null

    // Only trigger on horizontal swipes (>80px, more horizontal than vertical)
    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx)) return

    const idx = SECTIONS.indexOf(activeSection)
    if (dx < 0 && idx < SECTIONS.length - 1) {
      switchSection(SECTIONS[idx + 1])
    } else if (dx > 0 && idx > 0) {
      switchSection(SECTIONS[idx - 1])
    }
  }, [activeSection])

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

  const [confirmDelete, setConfirmDelete] = useState(null)

  const onDeleteRow = (rowId) => {
    setConfirmDelete(rowId)
  }

  const doDeleteRow = () => {
    if (confirmDelete) setRows(prev => prev.filter(r => r.id !== confirmDelete))
    setConfirmDelete(null)
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

  const submitFeedback = async () => {
    if (!feedbackMsg.trim()) return
    setFeedbackSending(true)
    try {
      const res = await fetch('/.netlify/functions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackMsg.trim() }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setFeedbackMsg('')
      setFeedbackSent(true)
      setTimeout(() => { setFeedbackSent(false); setFeedbackOpen(false) }, 1500)
    } catch {
      alert('Failed to send feedback. Please try again.')
    } finally {
      setFeedbackSending(false)
    }
  }

  const loadFeedback = async () => {
    if (!adminToken) return
    setFeedbackLoading(true)
    try {
      const res = await fetch('/.netlify/functions/feedback', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFeedbackList(data.feedback || [])
    } catch {
      setFeedbackList([])
    } finally {
      setFeedbackLoading(false)
    }
  }

  const deleteFeedback = async (id) => {
    try {
      await fetch('/.netlify/functions/feedback', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ id }),
      })
      setFeedbackList(prev => prev.filter(f => f.id !== id))
    } catch {}
  }

  // Load feedback count on login and when switching to notifications
  useEffect(() => {
    if (adminToken) loadFeedback()
  }, [adminToken])

  useEffect(() => {
    if (activeSection === 'notifications' && adminToken) loadFeedback()
  }, [activeSection])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" style={{ '--color-primary': theme.primary, '--color-primary-foreground': theme.fg }}>
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground text-lg">Loading {SECTION_LABELS[activeSection]}...</span>
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
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
        <div className="no-print flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Ministry of Health - Kuwait" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">PCIS Medication</h1>
              <p className="text-sm font-medium text-muted-foreground">Ministry of Health</p>
              <p className="text-xs text-muted-foreground mt-0.5">Done by Dr. Abdullah Almusallam</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminMode && (
              <Badge variant="success" className="gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </Badge>
            )}
            <div className="relative" ref={settingsRef}>
              <Button variant="outline" size="icon" onClick={() => setSettingsOpen(v => !v)}>
                <Settings className="h-4 w-4" />
              </Button>
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg border bg-popover shadow-lg py-1">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors" onClick={() => { zoomIn(); }}>
                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                    Zoom In ({zoom}%)
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors" onClick={() => { zoomOut(); }}>
                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                    Zoom Out ({zoom}%)
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors" onClick={() => { window.print(); setSettingsOpen(false) }}>
                    <Printer className="h-4 w-4 text-muted-foreground" />
                    Print
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors" onClick={() => { setFeedbackOpen(true); setFeedbackSent(false); setSettingsOpen(false) }}>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Send Feedback
                  </button>
                  <div className="my-1 border-t" />
                  {adminMode ? (
                    <>
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors" onClick={() => { setAdminOpen(true); setSettingsOpen(false) }}>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Admin Panel
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors text-destructive" onClick={() => { logout(); setSettingsOpen(false) }}>
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors" onClick={() => { openAdmin(); setSettingsOpen(false) }}>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Admin Panel
                    </button>
                  )}
                </div>
              )}
            </div>
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
              ...(adminMode ? [{ key: 'notifications', label: 'Notifications', Icon: Bell }] : []),
            ].map(({ key, label, Icon }) => {
              const t = SECTION_THEMES[key]
              const active = activeSection === key
              const notifCount = key === 'notifications' ? feedbackList.length : 0
              return (
                <button
                  key={key}
                  onClick={() => switchSection(key)}
                  className="relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer"
                  style={active
                    ? { backgroundColor: t.text, color: '#fff', boxShadow: `0 2px 8px ${t.text}30` }
                    : { backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {notifCount > 0 && !active && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
                      {notifCount > 99 ? '99+' : notifCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {activeSection !== 'notifications' && <div className="flex items-center gap-2">
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

          </div>}
        </div>



        {/* Content */}
        {activeSection === 'notifications' ? (
          <div className="space-y-4">
            {/* Notifications header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Notifications</h2>
                {feedbackList.length > 0 && (
                  <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.text }}>
                    {feedbackList.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {feedbackList.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground gap-1.5"
                    onClick={() => {
                      if (confirm(`Delete all ${feedbackList.length} notifications?`)) {
                        feedbackList.forEach(f => deleteFeedback(f.id))
                      }
                    }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Clear All
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1.5" onClick={loadFeedback} disabled={feedbackLoading}>
                  <RefreshCw className={`h-3.5 w-3.5 ${feedbackLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Notifications list */}
            {feedbackLoading && feedbackList.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-16">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.text }} />
                  <p className="text-sm text-muted-foreground">Loading notifications...</p>
                </CardContent>
              </Card>
            ) : feedbackList.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: theme.bg }}>
                    <Inbox className="h-8 w-8" style={{ color: theme.text }} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">All caught up!</p>
                    <p className="text-sm text-muted-foreground mt-1">No feedback from users yet.<br/>They'll appear here when submitted.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {feedbackList.map((f, i) => {
                  const isOpen = expandedFeedback === f.id
                  const timeAgo = getTimeAgo(f.created_at)
                  return (
                    <Card key={f.id} className={`overflow-hidden transition-all duration-200 ${isOpen ? 'ring-2 shadow-md' : 'hover:shadow-sm'}`} style={isOpen ? { '--tw-ring-color': theme.border } : {}}>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer transition-colors hover:bg-muted/40"
                        onClick={() => setExpandedFeedback(isOpen ? null : f.id)}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.bg }}>
                          <MessageSquare className="h-4 w-4" style={{ color: theme.text }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{timeAgo}</span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="border-t">
                          <div className="px-4 py-3" style={{ backgroundColor: `${theme.bg}40` }}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>{f.message}</p>
                          </div>
                          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20">
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(f.created_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                              onClick={() => deleteFeedback(f.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        ) : activeSection !== 'er-guidelines' && !categoryFilter && !searchQuery.trim() ? (
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
          adminToken={adminToken}
        />

        {/* Login Dialog */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="sm:max-w-md" style={{
            '--color-primary': theme.primary,
            '--color-primary-foreground': theme.fg,
            '--color-ring': theme.ring,
            '--color-border': theme.border,
            '--color-input': theme.border,
          }}>
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

        {/* Feedback Dialog */}
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogContent className="sm:max-w-md" style={{
            '--color-primary': theme.primary,
            '--color-primary-foreground': theme.fg,
            '--color-ring': theme.ring,
            '--color-border': theme.border,
            '--color-input': theme.border,
          }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Feedback
              </DialogTitle>
              <DialogDescription>Report an error, suggest a feature, or share your thoughts.</DialogDescription>
            </DialogHeader>
            {feedbackSent ? (
              <div className="text-center py-6">
                <p className="text-lg font-semibold text-primary">Thank you!</p>
                <p className="text-sm text-muted-foreground mt-1">Your feedback has been sent.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Type your feedback here..."
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{feedbackMsg.length}/2000</span>
                  <Button onClick={submitFeedback} disabled={feedbackSending || !feedbackMsg.trim()} className="gap-1.5">
                    <Send className="h-4 w-4" />
                    {feedbackSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Row Confirm */}
        <ConfirmDialog
          open={Boolean(confirmDelete)}
          onConfirm={doDeleteRow}
          onCancel={() => setConfirmDelete(null)}
          title="Delete Row"
          description="Are you sure you want to delete this row? This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
        />

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
