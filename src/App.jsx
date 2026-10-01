import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import DataTable from './components/DataTable.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import GrowthCalculator from './components/GrowthCalculator.jsx'
import DevMilestones from './components/DevMilestones.jsx'
import Library from './components/Library.jsx'
import PHQ9Dialog from './components/PHQ9Dialog.jsx'
import PHQ9PatientForm from './components/PHQ9PatientForm.jsx'
import GAD7Dialog from './components/GAD7Dialog.jsx'
import FIB4Dialog from './components/FIB4Dialog.jsx'
import CURB65Dialog from './components/CURB65Dialog.jsx'
import { TopBar, BottomBar } from './components/AppNav.jsx'
import HomePage from './components/HomePage.jsx'
import MedPage from './components/MedPage.jsx'
import { apiGetData, apiAdminAuth, apiAdminUpdate } from './utils/api.js'
import { findColumnName, parseAgeMonths } from './utils/columns.js'
import { Button } from './components/ui/button.jsx'
import { Input } from './components/ui/input.jsx'
import { Badge } from './components/ui/badge.jsx'
import { Card, CardContent } from './components/ui/card.jsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog.jsx'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip.jsx'

import { Loader2, AlertCircle, RefreshCw, Search, ShieldCheck, LogOut, Settings, ArrowUp, Syringe, Cross, BookOpen, Pill, ZoomIn, ZoomOut, MessageSquare, Send, Bell, Trash2, Inbox, Clock, ChevronRight, CheckCheck, Eye, Users, CalendarDays, TrendingUp, Baby, Calculator, LibraryBig, Brain, ClipboardCheck, Home, Wrench, ArrowLeft, FlaskConical, Stethoscope } from 'lucide-react'

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

const SECTIONS = ['clinic', 'vaccination', 'er-medication', 'library', 'tools']
const SECTION_LABELS = { clinic: 'Clinic Medications', vaccination: 'Vaccination', 'er-medication': 'ER Medication', library: 'Library', tools: 'Tools' }

const SECTION_THEMES = {
  home:           { primary: 'oklch(0.50 0.04 250)', fg: 'oklch(0.98 0.005 250)', ring: 'oklch(0.50 0.04 250)', pageBg: '#f8fafc', bg: '#e2e8f0', text: '#475569', darkText: '#94a3b8', border: '#cbd5e1' },   // neutral slate
  clinic:         { primary: 'oklch(0.55 0.18 230)', fg: 'oklch(0.98 0.005 230)', ring: 'oklch(0.55 0.18 230)', pageBg: '#f0f9ff', bg: '#e0f2fe', text: '#0284c7', darkText: '#38bdf8', border: '#7dd3fc' },   // sky blue
  vaccination:    { primary: 'oklch(0.60 0.15 85)',  fg: 'oklch(0.98 0.005 85)',  ring: 'oklch(0.60 0.15 85)',  pageBg: '#fefce8', bg: '#fef9c3', text: '#a16207', darkText: '#fbbf24', border: '#fde047' },   // amber
  'er-medication':{ primary: 'oklch(0.55 0.2 25)',   fg: 'oklch(0.98 0.005 25)',  ring: 'oklch(0.55 0.2 25)',   pageBg: '#fef2f2', bg: '#fecaca', text: '#dc2626', darkText: '#f87171', border: '#fca5a5' },   // red
  'er-guidelines':{ primary: 'oklch(0.62 0.16 55)',  fg: 'oklch(0.98 0.005 55)',  ring: 'oklch(0.62 0.16 55)',  pageBg: '#fff7ed', bg: '#ffedd5', text: '#ea580c', darkText: '#fb923c', border: '#fdba74' },   // orange
  pediatrics:     { primary: 'oklch(0.55 0.17 150)', fg: 'oklch(0.98 0.005 150)', ring: 'oklch(0.55 0.17 150)', pageBg: '#f0fdf4', bg: '#dcfce7', text: '#16a34a', darkText: '#4ade80', border: '#86efac' },   // green
  psychiatrics:   { primary: 'oklch(0.55 0.15 195)', fg: 'oklch(0.98 0.005 195)', ring: 'oklch(0.55 0.15 195)', pageBg: '#f0fdfa', bg: '#ccfbf1', text: '#0d9488', darkText: '#2dd4bf', border: '#5eead4' },   // teal
  library:        { primary: 'oklch(0.60 0.15 300)', fg: 'oklch(0.98 0.005 300)', ring: 'oklch(0.60 0.15 300)', pageBg: '#faf5ff', bg: '#f3e8ff', text: '#9333ea', darkText: '#c084fc', border: '#d8b4fe' },   // purple
  tools:          { primary: 'oklch(0.55 0.16 275)', fg: 'oklch(0.98 0.005 275)', ring: 'oklch(0.55 0.16 275)', pageBg: '#eef2ff', bg: '#e0e7ff', text: '#4f46e5', darkText: '#818cf8', border: '#a5b4fc' },   // indigo
  notifications:  { primary: 'oklch(0.55 0.18 280)', fg: 'oklch(0.98 0.005 280)', ring: 'oklch(0.55 0.18 280)', pageBg: '#f5f3ff', bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },   // purple
}

// A row inside the Settings popup
function SettingsRow({ icon: Icon, label, onClick, badge, value, destructive }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent ${destructive ? 'text-destructive' : ''}`}
    >
      <Icon className={`h-4 w-4 ${destructive ? '' : 'text-muted-foreground'}`} />
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {value != null && <span className="text-[11px] text-muted-foreground">{value}</span>}
    </button>
  )
}

// Single unified theme applied across the whole app (home-page brand look)
const UNIFIED_THEME = {
  primary: 'oklch(0.56 0.11 220)',
  fg: 'oklch(0.99 0.005 220)',
  ring: 'oklch(0.56 0.11 220)',
  pageBg: '#f4f8fb',
  bg: '#e0f2fe',
  text: '#0e7490',
  border: '#bae6fd',
}

const SECTION_ITEMS = [
  { key: 'clinic', label: 'Clinic Medications', short: 'Clinic', Icon: Pill, desc: 'Adult clinic drug formulary' },
  { key: 'tools', label: 'Tools', short: 'Tools', Icon: Wrench, desc: 'Growth, milestones & screening' },
  { key: 'vaccination', label: 'Vaccination', short: 'Vaccines', Icon: Syringe, desc: 'Immunization schedules & doses' },
  { key: 'er-medication', label: 'ER Medication', short: 'ER', Icon: Cross, desc: 'Emergency drugs & dosing' },
  { key: 'library', label: 'Library', short: 'Library', Icon: LibraryBig, desc: 'Guidelines, pediatrics & references' },
]

// Accent of each section on the dark top bar and bottom bar
const NAV_COLORS = { ...Object.fromEntries(Object.entries(SECTION_THEMES).map(([k, t]) => [k, t.darkText || t.text])), home: '#22d3ee' }

export default function App() {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [adminOpen, setAdminOpen] = useState(false)
  const [dashOpen, setDashOpen] = useState(false)
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token') || '')
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginPw, setLoginPw] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const param = params.get('section')
      if (params.get('med')) return 'home'
      if (param && SECTIONS.includes(param)) return param
    }
    return 'home'
  })
  const [medView, setMedView] = useState(() => {
    if (typeof window === 'undefined') return null
    const p = new URLSearchParams(window.location.search)
    const id = p.get('med'), section = p.get('section') || 'clinic'
    return id && ['clinic', 'er-medication', 'vaccination'].includes(section) ? { section, id } : null
  })
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('theme')
      if (param === 'dark' || param === 'light') return param === 'dark'
    }
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return true // default to dark theme
  })
  const [growthCalcOpen, setGrowthCalcOpen] = useState(false)
  const [milestonesOpen, setMilestonesOpen] = useState(false)
  const [phq9Open, setPhq9Open] = useState(false)
  const [phq9EnOpen, setPhq9EnOpen] = useState(false)
  const [gad7Open, setGad7Open] = useState(false)
  const [gad7EnOpen, setGad7EnOpen] = useState(false)
  const [fib4Open, setFib4Open] = useState(false)
  const [curb65Open, setCurb65Open] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackList, setFeedbackList] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [visitorStats, setVisitorStats] = useState(null)
  const [visitorStatsOpen, setVisitorStatsOpen] = useState(false)

  const adminMode = Boolean(adminToken)
  // Each section keeps its own accent colour (matching its home card) for icons/buttons/table,
  // but the page background stays consistent app-wide. In dark mode the accent brightens for legibility.
  const baseTheme = SECTION_THEMES[activeSection] || UNIFIED_THEME
  const theme = {
    ...baseTheme,
    pageBg: UNIFIED_THEME.pageBg,
    text: dark ? (baseTheme.darkText || baseTheme.text) : baseTheme.text,
  }

  // Apply dark mode class + persist preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Track the visual viewport height so dialogs stay above the on-screen keyboard (iOS)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => document.documentElement.style.setProperty('--app-vh', `${vv.height}px`)
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update) }
  }, [])

  // Apply page background color to body (light: section tint; dark: token deep slate)
  useEffect(() => {
    document.body.style.background = dark ? '' : theme.pageBg
    document.body.style.transition = 'background 0.3s ease'
  }, [activeSection, dark])

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
    if (s === 'home' || s === 'library' || s === 'tools') { setLoading(false); return }
    setLoading(true)
    setErr('')
    try {
      const data = await apiGetData(s)
      const cols = data.columns || []
      // Ensure __kuwait__ column exists for clinic section
      if (s === 'clinic' && !cols.includes('__kuwait__')) {
        cols.push('__kuwait__')
      }
      // Hidden out-of-stock flag column (same pattern as __kuwait__)
      if (s === 'clinic' && !cols.includes('__oos__')) {
        cols.push('__oos__')
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

  // Single medicine page: its own history entry, so the phone Back button returns to Home
  const openMed = (section, id) => {
    setMedView({ section, id })
    window.history.pushState({ med: { section, id } }, '', `?section=${encodeURIComponent(section)}&med=${encodeURIComponent(id)}`)
    window.scrollTo(0, 0)
  }
  const closeMed = () => {
    if (window.history.state?.med) window.history.back()
    else { setMedView(null); window.history.replaceState(null, '', window.location.pathname) }
  }
  useEffect(() => {
    const onPop = (e) => { setMedView(e.state?.med || null); window.scrollTo(0, 0) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const switchSection = (s) => {
    if (medView) {
      setMedView(null)
      window.history.replaceState(null, '', window.location.pathname)
    }
    if (s === activeSection) return
    setCategoryFilter(s === 'pediatrics' ? '__ALL__' : '')
    setSearchQuery('')
    setActiveSection(s)
  }


  const categoryCol = useMemo(() => findColumnName(columns, ['category', 'age/timing', 'age']), [columns])
  const categories = useMemo(() => {
    if (!categoryCol) return []
    const cats = rows.map(r => String((r.data || {})[categoryCol] ?? '').trim()).filter(Boolean)
    return uniq(cats).sort((a, b) => parseAgeMonths(a) - parseAgeMonths(b) || a.localeCompare(b))
  }, [rows, categoryCol])

  // Categories with medication counts (for the category picker grid)
  const categoryList = useMemo(() => {
    if (!categoryCol) return []
    const counts = {}
    for (const r of rows) {
      const c = String((r.data || {})[categoryCol] ?? '').trim()
      if (c) counts[c] = (counts[c] || 0) + 1
    }
    return categories.map(name => ({ name, count: counts[name] || 0 }))
  }, [rows, categoryCol, categories])

  // Vaccination lists vaccines, not medications
  const itemNoun = activeSection === 'vaccination' ? 'vaccine' : 'medication'

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
    if (adminMode) setDashOpen(true)
    else setLoginOpen(true)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setAdminToken('')
    setAdminOpen(false)
    setDashOpen(false)
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
      setDashOpen(true)
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

  // Record visit once per session
  useEffect(() => {
    if (!sessionStorage.getItem('visited')) {
      fetch('/.netlify/functions/visitors', { method: 'POST' }).catch(() => {})
      sessionStorage.setItem('visited', '1')
    }
  }, [])

  const loadVisitorStats = async () => {
    if (!adminToken) return
    try {
      const res = await fetch('/.netlify/functions/visitors', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      })
      if (!res.ok) throw new Error()
      setVisitorStats(await res.json())
    } catch {
      setVisitorStats(null)
    }
  }

  // Load feedback count and visitor stats on admin login
  useEffect(() => {
    if (adminToken) {
      loadFeedback()
      loadVisitorStats()
    }
  }, [adminToken])


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

  // Tools page groups (also counted on the home page)
  const toolGroups = [
    { section: 'Pediatrics', accent: theme.text, tools: [
      { label: 'Growth Calculator', desc: 'WHO percentiles & Z-scores by age', Icon: Calculator, onClick: () => setGrowthCalcOpen(true) },
      { label: 'Developmental Milestones', desc: 'Milestone checklist & red flags', Icon: Baby, onClick: () => setMilestonesOpen(true) },
    ] },
    { section: 'Psychiatrics', accent: theme.text, tools: [
      { label: 'PHQ-9 Depression Screening', desc: 'Patient Health Questionnaire', Icon: ClipboardCheck, languages: [
        { label: 'العربية', onClick: () => setPhq9Open(true) },
        { label: 'English', onClick: () => setPhq9EnOpen(true) },
      ] },
      { label: 'GAD-7 Anxiety Screening', desc: 'Generalized Anxiety Disorder', Icon: ClipboardCheck, languages: [
        { label: 'العربية', onClick: () => setGad7Open(true) },
        { label: 'English', onClick: () => setGad7EnOpen(true) },
      ] },
    ] },
    { section: 'Hepatology', accent: theme.text, tools: [
      { label: 'FIB-4 Score', desc: 'Liver fibrosis estimate (no biopsy)', Icon: FlaskConical, onClick: () => setFib4Open(true) },
    ] },
    { section: 'Respiratory', accent: theme.text, tools: [
      { label: 'CURB-65 Score', desc: 'Pneumonia severity & disposition', Icon: Stethoscope, onClick: () => setCurb65Open(true) },
    ] },
  ]
  const toolCount = toolGroups.reduce((n, g) => n + g.tools.length, 0)

  return (
    <TooltipProvider>
      <div
        className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
        style={{
          '--color-primary': theme.primary,
          '--color-primary-foreground': theme.fg,
          '--color-ring': theme.ring,
          '--color-success': theme.primary,
          '--color-success-foreground': theme.fg,
          // In light mode, tint borders with the section color; in dark mode let the dark tokens win
          ...(dark ? {} : { '--color-border': theme.border, '--color-input': theme.border }),
        }}
      >
        <TopBar
          items={SECTION_ITEMS}
          colors={NAV_COLORS}
          active={activeSection}
          onGo={switchSection}
          dark={dark}
          onToggleDark={() => setDark(d => !d)}
          onSettings={() => setSettingsOpen(true)}
          adminMode={adminMode}
          badge={adminMode ? feedbackList.length : 0}
        />
        <BottomBar items={SECTION_ITEMS} colors={NAV_COLORS} active={activeSection} onGo={switchSection} />

        {medView ? (
          <MedPage
            key={`${medView.section}-${medView.id}`}
            section={medView.section}
            id={medView.id}
            color={dark ? SECTION_THEMES[medView.section].darkText : SECTION_THEMES[medView.section].text}
            onBack={closeMed}
            onShowInList={(name) => {
              const section = medView.section
              setMedView(null)
              window.history.replaceState(null, '', window.location.pathname)
              setCategoryFilter(''); setSearchQuery(name); setActiveSection(section); window.scrollTo(0, 0)
            }}
          />
        ) : activeSection === 'home' && (
          <HomePage
            toolCount={toolCount}
            colors={Object.fromEntries(['clinic', 'er-medication', 'vaccination'].map(k => [k, dark ? SECTION_THEMES[k].darkText : SECTION_THEMES[k].text]))}
            onOpen={openMed}
            onSearch={(section, query) => { setCategoryFilter(''); setSearchQuery(query); setActiveSection(section); window.scrollTo(0, 0) }}
          />
        )}

        <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${activeSection === 'home' ? '' : 'py-4 sm:py-6'}`}>
        {/* Settings popup */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </DialogTitle>
              <DialogDescription className="sr-only">App settings and tools</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Display</p>
                <SettingsRow icon={ZoomIn} label={`Zoom In (${zoom}%)`} onClick={zoomIn} />
                <SettingsRow icon={ZoomOut} label={`Zoom Out (${zoom}%)`} onClick={zoomOut} />
              </div>

              <div>
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">General</p>
                <SettingsRow icon={MessageSquare} label="Send Feedback" onClick={() => { setFeedbackOpen(true); setFeedbackSent(false); setSettingsOpen(false) }} />
              </div>

              {adminMode ? (
                <>
                  <div>
                    <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Admin</p>
                    <SettingsRow icon={Settings} label="Admin Panel" badge={feedbackList.length} onClick={() => { setDashOpen(true); setSettingsOpen(false); loadFeedback() }} />
                  </div>
                  <div className="border-t pt-2">
                    <SettingsRow icon={LogOut} label="Logout" destructive onClick={() => { logout(); setSettingsOpen(false) }} />
                  </div>
                </>
              ) : (
                <div>
                  <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Admin</p>
                  <SettingsRow icon={ShieldCheck} label="Admin Panel" onClick={() => { openAdmin(); setSettingsOpen(false) }} />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Controls */}
        {activeSection !== 'home' && (
        <div className="no-print flex flex-col gap-3 mb-5">
          {/* Section title */}
          <div className="flex items-center gap-3">
            {(() => {
              const current = SECTION_ITEMS.find(s => s.key === activeSection)
              const CurrentIcon = current?.Icon || Pill
              return (
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: theme.text }}
                  >
                    <CurrentIcon className="h-4 w-4 text-white" />
                  </span>
                  <h2 className="font-display text-lg font-bold tracking-tight truncate sm:text-xl" style={{ color: theme.text }}>
                    {SECTION_LABELS[activeSection]}
                  </h2>
                </div>
              )
            })()}
          </div>

          {activeSection !== 'library' && activeSection !== 'tools' && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${itemNoun}s by name, dose, use…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl pl-10 text-base shadow-sm sm:text-sm"
            />
          </div>
          )}
        </div>
        )}



        {/* Tools section — clean cards grouped by their origin section */}
        {activeSection === 'tools' && (
          <div className="mb-4 flex flex-col gap-7">
            {toolGroups.map(({ section, accent, tools }) => (
              <div key={section}>
                {/* Group label + divider line */}
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{section}</span>
                  <span className="h-px flex-1 rounded-full" style={{ backgroundColor: accent + '33' }} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tools.map((tool) => {
                    const Icon = tool.Icon
                    const iconTile = (
                      <span
                        className="lift-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 6px 14px -5px ${accent}80` }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </span>
                    )
                    if (tool.languages) {
                      return (
                        <div key={tool.label} className="lift-card flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm" style={{ '--lift': accent }}>
                          <div className="flex items-center gap-3">
                            {iconTile}
                            <div className="min-w-0">
                              <div className="font-display text-sm font-semibold leading-tight">{tool.label}</div>
                              <div className="text-xs text-muted-foreground">{tool.desc}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {tool.languages.map((lang) => (
                              <button
                                key={lang.label}
                                onClick={lang.onClick}
                                className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white cursor-pointer transition-transform hover:-translate-y-0.5"
                                style={{ backgroundColor: accent }}
                              >
                                {lang.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return (
                      <button
                        key={tool.label}
                        onClick={tool.onClick}
                        className="lift-card group flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm cursor-pointer"
                        style={{ '--lift': accent }}
                      >
                        {iconTile}
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-sm font-semibold leading-tight">{tool.label}</div>
                          <div className="text-xs text-muted-foreground">{tool.desc}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: accent }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <PHQ9Dialog open={phq9Open} onOpenChange={setPhq9Open} theme={theme} lang="ar" />
        <PHQ9Dialog open={phq9EnOpen} onOpenChange={setPhq9EnOpen} theme={theme} lang="en" />
        <GAD7Dialog open={gad7Open} onOpenChange={setGad7Open} theme={theme} lang="ar" />
        <GAD7Dialog open={gad7EnOpen} onOpenChange={setGad7EnOpen} theme={theme} lang="en" />
        <FIB4Dialog open={fib4Open} onOpenChange={setFib4Open} theme={theme} />
        <CURB65Dialog open={curb65Open} onOpenChange={setCurb65Open} theme={theme} />

        {/* Library */}
        {activeSection === 'library' && (
          <Library theme={theme} dark={dark} />
        )}

        {/* Content — medication sections: search · category grid · category table */}
        {activeSection !== 'home' && activeSection !== 'library' && activeSection !== 'tools' && (
          searchQuery.trim() ? (
            /* Search across every category */
            <DataTable
              columns={columns}
              rows={rows}
              categoryFilter="__ALL__"
              searchQuery={searchQuery}
              adminMode={adminMode}
              onCellChange={onCellChange}
              onDeleteRow={onDeleteRow}
              onAddRow={onAddRow}
              hideInfoBar
              dark={dark}
            />
          ) : (categoryCol && categoryList.length > 0 && !adminMode) ? (
            categoryFilter && categoryFilter !== '__ALL__' ? (
              /* A category is open → its medications + back button */
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCategoryFilter('')} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    All Categories
                  </Button>
                  <span className="font-semibold text-sm" style={{ color: theme.text }}>{categoryFilter}</span>
                </div>
                <DataTable
                  columns={columns}
                  rows={rows}
                  categoryFilter={categoryFilter}
                  searchQuery=""
                  adminMode={adminMode}
                  onCellChange={onCellChange}
                  onDeleteRow={onDeleteRow}
                  onAddRow={onAddRow}
                  hideInfoBar
                  dark={dark}
                />
              </div>
            ) : (
              /* Category picker grid */
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                {categoryList.map((cat) => {
                  const SecIcon = SECTION_ITEMS.find(s => s.key === activeSection)?.Icon || Pill
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setCategoryFilter(cat.name)}
                      className="tile group flex items-center gap-3 rounded-2xl border bg-card p-3.5 text-left cursor-pointer"
                      style={{ '--tile': theme.text }}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: theme.text + '1f', color: theme.text }}
                      >
                        <SecIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-semibold leading-tight">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">{cat.count} {itemNoun}{cat.count !== 1 ? 's' : ''}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: theme.text }} />
                    </button>
                  )
                })}
              </div>
            )
          ) : (
            /* No categories (or admin editing) → show the full table */
            <DataTable
              columns={columns}
              rows={rows}
              categoryFilter="__ALL__"
              searchQuery={searchQuery}
              adminMode={adminMode}
              onCellChange={onCellChange}
              onDeleteRow={onDeleteRow}
              onAddRow={onAddRow}
              hideInfoBar
              dark={dark}
            />
          )
        )}

        {/* Growth Calculator */}
        <GrowthCalculator
          open={growthCalcOpen}
          onClose={() => setGrowthCalcOpen(false)}
          theme={theme}
        />

        {/* Developmental Milestones */}
        <DevMilestones
          open={milestonesOpen}
          onClose={() => setMilestonesOpen(false)}
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

        {/* Notifications Dialog */}
        <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DialogContent className="w-[95vw] max-w-lg p-0 gap-0 rounded-2xl max-h-[85vh] flex flex-col" style={{
            '--color-primary': SECTION_THEMES.notifications.primary,
            '--color-primary-foreground': SECTION_THEMES.notifications.fg,
            '--color-ring': SECTION_THEMES.notifications.ring,
            '--color-border': SECTION_THEMES.notifications.border,
            '--color-input': SECTION_THEMES.notifications.border,
          }}>
            <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2.5 text-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: SECTION_THEMES.notifications.bg }}>
                    <Bell className="h-4 w-4" style={{ color: SECTION_THEMES.notifications.text }} />
                  </div>
                  Notifications
                  {feedbackList.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-bold text-white px-1.5" style={{ backgroundColor: SECTION_THEMES.notifications.text }}>
                      {feedbackList.length}
                    </span>
                  )}
                </DialogTitle>
                {feedbackList.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] text-muted-foreground gap-1 mr-12"
                    onClick={() => {
                      if (confirm(`Delete all ${feedbackList.length} notifications?`)) {
                        feedbackList.forEach(f => deleteFeedback(f.id))
                      }
                    }}
                  >
                    <CheckCheck className="h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
              <DialogDescription className="sr-only">View and manage user feedback notifications</DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 p-4">
              {feedbackLoading && feedbackList.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="h-7 w-7 animate-spin" style={{ color: SECTION_THEMES.notifications.text }} />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: SECTION_THEMES.notifications.bg }}>
                    <Inbox className="h-7 w-7" style={{ color: SECTION_THEMES.notifications.text }} />
                  </div>
                  <div>
                    <p className="font-semibold">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">No feedback yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {feedbackList.map(f => {
                    const isOpen = expandedFeedback === f.id
                    const timeAgo = getTimeAgo(f.created_at)
                    const nt = SECTION_THEMES.notifications
                    return (
                      <div key={f.id} className={`rounded-xl border overflow-hidden transition-all duration-200 ${isOpen ? 'shadow-md' : 'hover:shadow-sm'}`} style={isOpen ? { borderColor: nt.border } : {}}>
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer transition-colors hover:bg-muted/40"
                          onClick={() => setExpandedFeedback(isOpen ? null : f.id)}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: nt.bg }}>
                            <MessageSquare className="h-3.5 w-3.5" style={{ color: nt.text }} />
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
                            <div className="px-4 py-3" style={{ backgroundColor: `${nt.bg}50` }}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>{f.message}</p>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20">
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(f.created_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                onClick={() => deleteFeedback(f.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
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

        {/* Visitor Stats Dialog */}
        <Dialog open={visitorStatsOpen} onOpenChange={setVisitorStatsOpen}>
          <DialogContent className="w-[90vw] max-w-sm p-0 gap-0 rounded-2xl" style={{
            '--color-primary': theme.primary,
            '--color-primary-foreground': theme.fg,
            '--color-ring': theme.ring,
            '--color-border': theme.border,
          }}>
            <DialogHeader className="px-5 pt-5 pb-3 border-b">
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                Visitor Stats
              </DialogTitle>
              <DialogDescription className="sr-only">Website visitor statistics</DialogDescription>
            </DialogHeader>
            <div className="p-5">
              {visitorStats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-bold">{visitorStats.total.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Today</span>
                    </div>
                    <p className="text-2xl font-bold">{visitorStats.today.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">This Week</span>
                    </div>
                    <p className="text-2xl font-bold">{visitorStats.week.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">This Month</span>
                    </div>
                    <p className="text-2xl font-bold">{visitorStats.month.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {dashOpen && adminMode && (
          <AdminDashboard
            token={adminToken}
            onClose={() => setDashOpen(false)}
            onLogout={logout}
            feedback={feedbackList}
            feedbackLoading={feedbackLoading}
            onReloadFeedback={loadFeedback}
            onDeleteFeedback={deleteFeedback}
            sectionLabel={['clinic', 'vaccination', 'er-medication'].includes(activeSection) ? SECTION_LABELS[activeSection] : ''}
            onOpenTableTools={() => { if (['clinic', 'vaccination', 'er-medication'].includes(activeSection)) setAdminOpen(true) }}
          />
        )}

        {/* Back to Top */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="no-print animate-fade-in-up fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-10 w-10 lg:bottom-6 lg:right-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
        </div>
      </div>
    </TooltipProvider>
  )
}
