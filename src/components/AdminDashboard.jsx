import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutDashboard, MessageSquare, Table2, X, LogOut, RefreshCw, Trash2, Loader2, Users, CalendarDays, TrendingUp, Eye, MapPin, Globe2 } from 'lucide-react'
import KW from '../data/kwMap.json'

// Admin panel in the house style: dark top bar (tabs on computers), bottom icon bar on phones,
// light grey page with white cards, stat tiles first. Overview = visits growth + Kuwait map.

const TABS = [
  { key: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { key: 'feedback', label: 'Feedback', Icon: MessageSquare },
  { key: 'tables', label: 'Tables', Icon: Table2 },
]
const GOV_ORDER = ['Capital', 'Hawalli', 'Farwaniya', 'Mubarak Al-Kabeer', 'Ahmadi', 'Jahra']
const GOV_LABEL = { Capital: 'Al Asimah', 'Mubarak Al-Kabeer': 'Mubarak Al-Kabeer' }
const ACCENT = '#0e7490'
// Map badge spots for the four small city governorates (out in the bay / sea, joined by a line)
const CALLOUT = { Capital: [452, 200], Hawalli: [552, 240], 'Mubarak Al-Kabeer': [556, 330], Farwaniya: [360, 352] }
// Big governorates: badge inside their own land, away from the city cluster
const SPOT = { Jahra: [230, 250], Ahmadi: [470, 440] }
const SHORT = { Capital: 'Asimah', 'Mubarak Al-Kabeer': 'Mubarak' }

const fmt = (n) => (n ?? 0).toLocaleString()
const dayKey = (d) => d.toISOString().slice(0, 10)
const addDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x }
// Today's date in Kuwait (UTC+3), as a UTC midnight Date so day maths stays simple
const kuwaitToday = () => { const t = new Date(Date.now() + 3 * 3600 * 1000); return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())) }

// Width of an element in CSS pixels, so SVG text and marks can be drawn at a fixed on-screen size
function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function Panel({ title, right, children, className = '' }) {
  return (
    <section className={`adm-card rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-card ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

function Seg({ value, onChange, options, label }) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-white/10" role="group" aria-label={label}>
      {options.map(([k, l]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={`adm-press rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${value === k ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function Kpi({ label, value, Icon, sub }) {
  return (
    <div className="adm-card rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-white/10 dark:bg-card">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums">{value == null ? '–' : fmt(value)}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  )
}

// Visits per day / week / month as bars, with the period total and change against the period before
function GrowthChart({ daily }) {
  const [range, setRange] = useState('day')
  const series = useMemo(() => {
    const byDay = new Map((daily || []).map((r) => [r.day, r.count]))
    const today = kuwaitToday()
    if (range === 'day') {
      return Array.from({ length: 30 }, (_, i) => {
        const d = addDays(today, i - 29)
        return { label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, value: byDay.get(dayKey(d)) || 0 }
      })
    }
    if (range === 'week') {
      // 12 weeks ending today (Sunday-start weeks, as in Kuwait)
      const start = addDays(today, -today.getUTCDay() - 7 * 11)
      return Array.from({ length: 12 }, (_, w) => {
        const ws = addDays(start, w * 7)
        let v = 0
        for (let i = 0; i < 7; i++) v += byDay.get(dayKey(addDays(ws, i))) || 0
        return { label: `${ws.getUTCDate()}/${ws.getUTCMonth() + 1}`, value: v }
      })
    }
    // 12 months ending this month
    const months = []
    for (let m = 11; m >= 0; m--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - m, 1))
      const key = d.toISOString().slice(0, 7)
      let v = 0
      for (const [k, c] of byDay) if (k.startsWith(key)) v += c
      months.push({ label: d.toLocaleString('en', { month: 'short', timeZone: 'UTC' }), value: v })
    }
    return months
  }, [daily, range])

  const max = Math.max(1, ...series.map((s) => s.value))
  const total = series.reduce((n, s) => n + s.value, 0)
  const half = Math.floor(series.length / 2)
  const recent = series.slice(half).reduce((n, s) => n + s.value, 0)
  const before = series.slice(0, half).reduce((n, s) => n + s.value, 0)
  const change = before ? Math.round(((recent - before) / before) * 100) : null
  const [boxRef, boxW] = useWidth()
  const W = Math.max(280, boxW), H = 210, padB = 22, padT = 18
  const bw = W / series.length
  // label every bar when they fit, otherwise every few
  const every = Math.max(1, Math.ceil(series.length / Math.floor(W / 44)))

  return (
    <Panel
      title="Visitors growth"
      right={<Seg label="Growth range" value={range} onChange={setRange} options={[['day', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']]} />}
    >
      <div className="mb-2 flex items-baseline gap-3">
        <span className="text-2xl font-bold tabular-nums">{fmt(total)}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">visits, {range === 'day' ? 'last 30 days' : range === 'week' ? 'last 12 weeks' : 'last 12 months'}</span>
        {change != null && (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${change >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'}`} title="Second half of the range compared with the first half">
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div ref={boxRef} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Visits chart">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1="0" x2={W} y1={padT + (H - padB - padT) * (1 - f)} y2={padT + (H - padB - padT) * (1 - f)} className="stroke-slate-100 dark:stroke-white/10" strokeWidth="1" />
        ))}
        {series.map((s, i) => {
          const h = ((H - padB - padT) * s.value) / max
          const x = i * bw + bw * 0.18
          return (
            <g key={i}>
              <rect x={x} y={H - padB - h} width={bw * 0.64} height={Math.max(h, s.value ? 2 : 0)} rx="3" fill={ACCENT} className="adm-bar" style={{ animationDelay: `${i * 15}ms` }}>
                <title>{s.label}: {s.value}</title>
              </rect>
              {series.length <= 12 && s.value > 0 && (
                <text x={x + bw * 0.32} y={H - padB - h - 4} textAnchor="middle" fontSize="10" className="fill-slate-500 dark:fill-slate-400">{s.value}</text>
              )}
              {(series.length - 1 - i) % every === 0 && (
                <text x={Math.min(W - 14, Math.max(14, x + bw * 0.32))} y={H - 6} textAnchor="middle" fontSize="10" className="fill-slate-400">{s.label}</text>
              )}
            </g>
          )
        })}
      </svg>
      </div>
    </Panel>
  )
}

// Kuwait governorates shaded by visits, with a count on each and a list beside it
function KuwaitMap({ places, since }) {
  const [range, setRange] = useState('all')
  const key = range === 'all' ? 'count' : 'recent'
  const { gov, outside, unknown, countries } = useMemo(() => {
    const gov = Object.fromEntries(GOV_ORDER.map((g) => [g, 0]))
    let outside = 0, unknown = 0
    const countries = {}
    for (const p of places || []) {
      const n = p[key] || 0
      if (!n) continue
      if (!p.country) unknown += n
      else if (p.country === 'KW') { if (p.region && gov[p.region] != null) gov[p.region] += n; else unknown += n }
      else { outside += n; countries[p.country] = (countries[p.country] || 0) + n }
    }
    return { gov, outside, unknown, countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5) }
  }, [places, key])
  const [mapRef, mapW] = useWidth()
  const u = mapW ? KW.w / mapW : 1 // map units per screen pixel
  const inKw = Object.values(gov).reduce((n, v) => n + v, 0)
  const max = Math.max(1, ...Object.values(gov))
  const regionName = (c) => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(c) } catch { return c } }

  return (
    <Panel
      title="Kuwait map"
      right={<Seg label="Map range" value={range} onChange={setRange} options={[['all', 'All time'], ['30', 'Last 30 days']]} />}
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div ref={mapRef} className="relative overflow-hidden rounded-xl bg-sky-50/60 dark:bg-white/5">
          <svg viewBox={`0 0 ${KW.w} ${KW.h}`} className="mx-auto block h-auto max-h-[440px] w-full" role="img" aria-label="Visits by governorate">
            {KW.govs.map((g) => {
              const v = gov[g.name] || 0
              const t = v / max
              return (
                <path key={g.name} d={g.d} className="adm-gov" stroke="#fff" strokeWidth={1.2 * u}
                  fill={v ? `color-mix(in oklch, ${ACCENT} ${18 + t * 72}%, #e2e8f0)` : '#e2e8f0'}>
                  <title>{GOV_LABEL[g.name] || g.name}: {v} visits</title>
                </path>
              )
            })}
            {Object.entries(KW.govCenter).map(([g, [x, y]]) => {
              const v = gov[g] || 0
              // the four small city governorates sit close together: their badge goes out to the sea with a line
              const [bx, by] = CALLOUT[g] || SPOT[g] || [x, y]
              const label = String(v)
              const r = (8 + label.length * 3.2) * u
              return (
                <g key={g} className="pointer-events-none">
                  {CALLOUT[g] && <line x1={x} y1={y} x2={bx} y2={by} stroke="#0f172a" strokeOpacity="0.5" strokeWidth={1 * u} />}
                  {CALLOUT[g] && <circle cx={x} cy={y} r={2.2 * u} fill="#0f172a" />}
                  <circle cx={bx} cy={by} r={r} fill="#0f172a" opacity="0.9" />
                  <text x={bx} y={by} textAnchor="middle" dy={3.8 * u} fontSize={11 * u} fontWeight="700" fill="#fff">{label}</text>
                  <text x={bx} y={by + r + 11 * u} textAnchor="middle" fontSize={9.5 * u} fontWeight="600" fill="#334155">{SHORT[g] || g}</text>
                </g>
              )
            })}
          </svg>
          <p className="absolute bottom-1.5 right-2 text-[9px] text-slate-400">Borders: geoBoundaries (CC BY 4.0)</p>
        </div>

        <div>
          <ul className="divide-y divide-slate-100 dark:divide-white/10">
            {GOV_ORDER.map((g) => {
              const v = gov[g]
              const pct = inKw ? Math.round((v / inKw) * 100) : 0
              return (
                <li key={g} className="flex items-center gap-3 py-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{GOV_LABEL[g] || g}</span>
                  <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10 sm:block">
                    <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }} />
                  </span>
                  <span className="w-10 text-right text-sm font-semibold tabular-nums">{fmt(v)}</span>
                  <span className="w-9 text-right text-[11px] tabular-nums text-slate-400">{pct}%</span>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><Globe2 className="h-3 w-3" /> Outside Kuwait</div>
              <div className="text-lg font-bold tabular-nums">{fmt(outside)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Location unknown</div>
              <div className="text-lg font-bold tabular-nums">{fmt(unknown)}</div>
            </div>
          </div>
          {countries.length > 0 && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Top countries outside Kuwait: {countries.map(([c, n]) => `${regionName(c)} ${n}`).join(' · ')}
            </p>
          )}
          <p className="mt-2 text-[11px] leading-snug text-slate-400">
            Area comes from the visitor's internet connection, so it is approximate. No IP address is saved.
            {since ? ` Location saved since ${new Date(since).toLocaleDateString('en-GB')}; older visits show as unknown.` : ' Older visits have no location and show as unknown.'}
          </p>
        </div>
      </div>
    </Panel>
  )
}

export default function AdminDashboard({ token, onClose, onLogout, feedback, feedbackLoading, onReloadFeedback, onDeleteFeedback, sectionLabel, onOpenTableTools }) {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const res = await fetch('/.netlify/functions/visitors', { headers: { Authorization: `Bearer ${token}` } })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `Could not load stats (${res.status})`)
      setStats(body)
    } catch (e) { setErr(String(e?.message || e)) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])
  // The panel covers the site: stop the page under it from scrolling
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const newest = feedback?.[0]?.created_at

  return (
    <div className="adm fixed inset-0 z-[45] flex flex-col bg-[#F4F6F9] text-slate-900 dark:bg-background dark:text-foreground" role="dialog" aria-modal="true" aria-label="Admin panel">
      {/* Top bar */}
      <header className="shrink-0 border-b border-white/10 bg-[#0f172a] text-white dark:bg-[#0a0f1c]">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <img src="/icons/pcis-128.png" alt="" className="h-10 w-10 shrink-0" />
          <nav className="ml-2 hidden h-full items-stretch gap-1 md:flex" aria-label="Admin sections">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-current={tab === key ? 'page' : undefined}
                className={`flex items-center gap-2 border-b-2 px-3 text-sm font-semibold cursor-pointer transition-colors ${tab === key ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                <Icon className="h-4 w-4" /> {label}
                {key === 'feedback' && feedback?.length > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold">{feedback.length}</span>}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => { load(); onReloadFeedback() }} className="nav-icon flex h-9 w-9 items-center justify-center rounded-full border border-white/15 cursor-pointer" aria-label="Refresh" title="Refresh">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
            <button type="button" onClick={onLogout} className="nav-icon flex h-9 w-9 items-center justify-center rounded-full border border-white/15 cursor-pointer" aria-label="Log out" title="Log out">
              <LogOut className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="nav-icon flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-sm font-semibold cursor-pointer" aria-label="Close admin panel">
              <X className="h-4 w-4" /> <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
          {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">{err}</p>}

          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Today" value={stats?.today} Icon={Eye} />
                <Kpi label="Last 7 days" value={stats?.week} Icon={CalendarDays} />
                <Kpi label="Last 30 days" value={stats?.month} Icon={TrendingUp} />
                <Kpi label="All time" value={stats?.total} Icon={Users} />
              </div>
              <GrowthChart daily={stats?.daily} />
              <KuwaitMap places={stats?.places} since={stats?.locationSince} />
              <p className="px-1 text-[11px] text-slate-400">A visit is counted once per browser session.</p>
            </>
          )}

          {tab === 'feedback' && (
            <Panel
              title={`Feedback${feedback?.length ? ` (${feedback.length})` : ''}`}
              right={feedback?.length > 0 && (
                <button type="button" onClick={() => { if (confirm(`Delete all ${feedback.length} messages?`)) feedback.forEach((f) => onDeleteFeedback(f.id)) }} className="adm-press flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:border-red-300 hover:bg-red-50 cursor-pointer dark:border-white/10 dark:hover:bg-red-950/40">
                  <Trash2 className="h-3.5 w-3.5" /> Delete all
                </button>
              )}
            >
              {feedbackLoading && !feedback?.length ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
              ) : !feedback?.length ? (
                <p className="py-8 text-center text-sm text-slate-500">No feedback yet.</p>
              ) : (
                <ul className="space-y-2">
                  {feedback.map((f) => (
                    <li key={f.id} className="adm-card flex gap-3 rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap break-words text-sm">{f.message}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{new Date(f.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                      <button type="button" onClick={() => onDeleteFeedback(f.id)} className="adm-press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:hover:bg-red-950/40" aria-label="Delete message">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {newest && <p className="mt-3 text-[11px] text-slate-400">Newest: {new Date(newest).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
            </Panel>
          )}

          {tab === 'tables' && (
            <Panel title="Tables">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Edit rows directly in the site while logged in. Table tools (save to database, CSV import / export) work on the section that is open now:
              </p>
              <button type="button" onClick={onOpenTableTools} className="adm-press mt-3 flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white cursor-pointer hover:brightness-125 dark:bg-cyan-500 dark:text-slate-950">
                <Table2 className="h-4 w-4" /> Open table tools{sectionLabel ? ` — ${sectionLabel}` : ''}
              </button>
              {!sectionLabel && <p className="mt-2 text-xs text-slate-500">Open a section (Clinic, Vaccines, ER) first, then come back here.</p>}
            </Panel>
          )}
        </div>
      </main>

      {/* Phones: sections as a bottom icon bar */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#0f172a] pb-[env(safe-area-inset-bottom)] md:hidden dark:bg-[#0a0f1c]" aria-label="Admin sections">
        <div className="grid h-16 grid-cols-3">
          {TABS.map(({ key, label, Icon }) => {
            const on = tab === key
            return (
              <button key={key} type="button" onClick={() => setTab(key)} aria-current={on ? 'page' : undefined}
                className={`nav-press relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${on ? 'text-white' : 'text-slate-400'}`}>
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${on ? 'bg-cyan-400/20' : ''}`}>
                  <Icon className={`h-[19px] w-[19px] ${on ? 'text-cyan-300' : ''}`} />
                </span>
                {label}
                {key === 'feedback' && feedback?.length > 0 && <span className="absolute top-1.5 left-[calc(50%+8px)] rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">{feedback.length}</span>}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
