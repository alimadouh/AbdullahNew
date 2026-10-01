import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Map as MapIcon, Minus, Plus, X, Globe2 } from 'lucide-react'
import KW from '../data/kwMap.json'

// Visitors by Kuwait governorate, in the Laborya staff-panel style:
// a "Governorates" card (bars + list) and a "Visitors map" window with grey governorates,
// blue number bubbles, drag to move, wheel / pinch / buttons to zoom, and tap to see a governorate.

const GOV_ORDER = ['Capital', 'Hawalli', 'Farwaniya', 'Mubarak Al-Kabeer', 'Ahmadi', 'Jahra']
const LABEL = { Capital: 'Al Asimah', 'Mubarak Al-Kabeer': 'Mubarak Al-Kabeer' }
const SHORT = { Capital: 'Al Asimah', 'Mubarak Al-Kabeer': 'M. Al-Kabeer' }
const BLUE = '#2a78d6', BLUE_DEEP = '#184f95'
// Zoomed out, the four small city governorates would stack: their bubbles are nudged apart (as in Laborya)
const GOV_DOT = { Capital: [430, 254], Hawalli: [486, 280], Farwaniya: [404, 296], 'Mubarak Al-Kabeer': [492, 322], Ahmadi: [480, 372], Jahra: [240, 255] }
const ALL = { x: 0, y: 0, w: KW.w, h: KW.h }

const fmt = (n) => (n ?? 0).toLocaleString()
const name = (g) => LABEL[g] || g

function useCounts(places, range) {
  return useMemo(() => {
    const key = range === 'all' ? 'count' : 'recent'
    const gov = Object.fromEntries(GOV_ORDER.map((g) => [g, 0]))
    const other = Object.fromEntries(GOV_ORDER.map((g) => [g, 0]))   // the other range, for the detail card
    let outside = 0, unknown = 0
    const countries = {}
    for (const p of places || []) {
      const n = p[key] || 0, m = p[key === 'count' ? 'recent' : 'count'] || 0
      if (p.country === 'KW' && p.region && gov[p.region] != null) { gov[p.region] += n; other[p.region] += m; continue }
      if (!n) continue
      if (!p.country || p.country === 'KW') unknown += n
      else { outside += n; countries[p.country] = (countries[p.country] || 0) + n }
    }
    const inKw = Object.values(gov).reduce((s, v) => s + v, 0)
    return { gov, other, outside, unknown, inKw, countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5) }
  }, [places, range])
}

function Seg({ value, onChange }) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-white/10" role="group" aria-label="Range">
      {[['all', 'All time'], ['30', 'Last 30 days']].map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}
          className={`adm-press rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${value === k ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}

// ---------------- The map window ----------------
function MapModal({ counts, range, setRange, focus, onClose }) {
  const svgRef = useRef(null)
  const [vb, setVb] = useState(ALL)
  const vbRef = useRef(vb)
  const [sel, setSel] = useState(focus || null)
  const [, setTick] = useState(0) // re-measure on resize
  const ptrs = useRef(new Map())
  const gest = useRef(null)

  const apply = useCallback((v) => { vbRef.current = v; setVb(v) }, [])
  const rect = () => svgRef.current?.getBoundingClientRect() || { width: 1, height: 1, left: 0, top: 0 }

  // A view of the given box, shaped like the map area so a tall phone screen is filled
  const fit = useCallback((box, pad = 1.15) => {
    const r = rect()
    const ratio = r.width && r.height ? r.height / r.width : 0.9
    let w = box.w * pad, h = box.h * pad
    if (h / w < ratio) h = w * ratio; else w = h / ratio
    apply({ x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2, w, h })
  }, [apply])

  // Opening view: the whole country, or the governorate picked from the list
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      if (focus && KW.govCenter[focus]) {
        const [cx, cy] = KW.govCenter[focus]
        const size = focus === 'Jahra' ? 330 : focus === 'Ahmadi' ? 220 : 90
        fit({ x: cx - size / 2, y: cy - size / 2, w: size, h: size }, 1)
      } else fit({ x: 15, y: 5, w: 565, h: 545 }, 1.04)
    })
    return () => cancelAnimationFrame(t)
  }, [focus, fit])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    const onResize = () => setTick((t) => t + 1)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize) }
  }, [onClose])

  const toMap = (clientX, clientY) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    return [p.x, p.y]
  }
  // Zoom by factor f while the map point (px, py) stays under the finger / cursor
  const zoomAt = useCallback((f, px, py, from = vbRef.current) => {
    const w = Math.min(KW.w * 1.3, Math.max(24, from.w * f)); const k = w / from.w
    apply({ x: px - (px - from.x) * k, y: py - (py - from.y) * k, w, h: from.h * k })
  }, [apply])

  // Mouse wheel / trackpad zoom (needs a non-passive listener to stop the page scrolling)
  useEffect(() => {
    const svg = svgRef.current
    const onWheel = (e) => { e.preventDefault(); const [px, py] = toMap(e.clientX, e.clientY); zoomAt(e.deltaY > 0 ? 1.25 : 0.8, px, py) }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  // One pointer drags the map, two pointers pinch-zoom; a tap with no movement selects a governorate
  const onDown = (e) => {
    svgRef.current.setPointerCapture?.(e.pointerId)
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const list = [...ptrs.current.values()]
    if (list.length === 2) {
      const [a, b] = list
      gest.current = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, from: vbRef.current, mid: toMap((a.x + b.x) / 2, (a.y + b.y) / 2) }
    } else {
      gest.current = { type: 'drag', x: e.clientX, y: e.clientY, from: vbRef.current, moved: false, gov: e.target.closest?.('[data-gov]')?.getAttribute('data-gov') || null }
    }
  }
  const onMove = (e) => {
    if (!ptrs.current.has(e.pointerId)) return
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gest.current
    if (!g) return
    if (g.type === 'pinch') {
      const [a, b] = [...ptrs.current.values()]
      if (!b) return
      zoomAt(g.d / (Math.hypot(a.x - b.x, a.y - b.y) || 1), g.mid[0], g.mid[1], g.from)
      return
    }
    const dx = e.clientX - g.x, dy = e.clientY - g.y
    if (Math.abs(dx) + Math.abs(dy) > 5) g.moved = true
    if (!g.moved) return
    const r = rect(), k = Math.max(g.from.w / r.width, g.from.h / r.height)
    apply({ ...g.from, x: g.from.x - dx * k, y: g.from.y - dy * k })
  }
  const onUp = (e) => {
    const g = gest.current
    ptrs.current.delete(e.pointerId)
    if (g?.type === 'drag' && !g.moved) setSel(g.gov && g.gov !== sel ? g.gov : g.gov ? null : sel)
    gest.current = ptrs.current.size ? gest.current : null
    if (g?.type === 'pinch' && ptrs.current.size < 2) gest.current = null
  }

  // Marks are sized in screen pixels: u = map units per pixel at the current zoom
  const r = rect()
  const u = Math.max(vb.w / Math.max(1, r.width), vb.h / Math.max(1, r.height))
  const zoomedOut = vb.w > 300
  const max = Math.max(1, ...Object.values(counts.gov))
  const dots = GOV_ORDER.filter((g) => counts.gov[g] > 0).map((g) => {
    const [x, y] = (zoomedOut && GOV_DOT[g]) || KW.govCenter[g]
    return { g, x, y, n: counts.gov[g] }
  })
  const pct = (n) => (counts.inKw ? Math.round((n / counts.inKw) * 100) : 0)

  return (
    <div className="adm-map fixed inset-0 z-[60] flex flex-col bg-slate-900/45 md:p-4" role="dialog" aria-modal="true" aria-label="Visitors map"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex min-h-0 flex-1 flex-col bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] text-slate-900 md:mx-auto md:w-full md:max-w-[900px] md:rounded-2xl md:px-5 md:pt-4 md:pb-5 dark:bg-card dark:text-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h2 className="text-[22px] font-semibold">Visitors in Kuwait</h2>
          <div className="ms-auto flex items-center gap-2">
            <Seg value={range} onChange={setRange} />
            <button type="button" onClick={() => { const v = vbRef.current; zoomAt(1.5, v.x + v.w / 2, v.y + v.h / 2) }} className="adm-press flex h-9 w-10 items-center justify-center rounded-full border border-slate-200 bg-white cursor-pointer hover:border-slate-900 dark:border-white/15 dark:bg-transparent" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
            <button type="button" onClick={() => { const v = vbRef.current; zoomAt(1 / 1.5, v.x + v.w / 2, v.y + v.h / 2) }} className="adm-press flex h-9 w-10 items-center justify-center rounded-full border border-slate-200 bg-white cursor-pointer hover:border-slate-900 dark:border-white/15 dark:bg-transparent" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
            <button type="button" onClick={onClose} className="adm-press flex h-9 items-center rounded-full border border-slate-200 bg-white px-3.5 text-sm font-semibold cursor-pointer hover:border-slate-900 dark:border-white/15 dark:bg-transparent">Close</button>
          </div>
        </div>

        <svg ref={svgRef} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="mt-2.5 block min-h-0 w-full flex-1 cursor-grab select-none rounded-xl bg-[#F7F8FA] active:cursor-grabbing dark:bg-slate-800"
          style={{ touchAction: 'none' }} role="img" aria-label="Map of Kuwait with visitors per governorate"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <g>
            {KW.govs.map((gv) => (
              <path key={gv.name} d={gv.d} data-gov={gv.name}
                className="adm-gov-path cursor-pointer"
                fill={sel === gv.name ? 'var(--gov-sel)' : 'var(--gov-fill)'} stroke="var(--gov-line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
                <title>{name(gv.name)}: {fmt(counts.gov[gv.name])} visits</title>
              </path>
            ))}
          </g>
          {!zoomedOut && (
            <g className="pointer-events-none">
              {Object.entries(KW.govCenter).map(([g, [x, y]]) => (
                <text key={g} x={x} y={y - 18 * u} fontSize={12 * u} textAnchor="middle" fill="var(--gov-name)" style={{ letterSpacing: '.04em', textTransform: 'uppercase' }}>{name(g)}</text>
              ))}
            </g>
          )}
          <g>
            {dots.map((d) => {
              // bubble area follows the count; the busiest governorate is about 24 px across (radius)
              const rad = (10 + 14 * Math.sqrt(d.n / max)) * u
              return (
                <g key={d.g} data-gov={d.g} className="cursor-pointer">
                  <text x={d.x + rad + 3 * u} y={d.y} dy={3.8 * u} fontSize={10 * u} fill="var(--gov-label)" fontWeight="500"
                    stroke="var(--gov-halo)" strokeWidth={3 * u} strokeLinejoin="round" style={{ paintOrder: 'stroke' }} className="pointer-events-none">{SHORT[d.g] || d.g}</text>
                  <circle cx={d.x} cy={d.y} r={rad} fill={sel === d.g ? BLUE_DEEP : BLUE} stroke="#fff" strokeWidth={1.5 * u}>
                    <title>{name(d.g)}: {fmt(d.n)} visits</title>
                  </circle>
                  <text x={d.x} y={d.y} dy={4.2 * u} fontSize={11 * u} fill="#fff" fontWeight="600" textAnchor="middle" className="pointer-events-none">{d.n > 999 ? `${Math.round(d.n / 100) / 10}k` : d.n}</text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Picked governorate */}
        <div className="mt-3 min-h-[64px] rounded-xl border border-slate-200 p-3 dark:border-white/10">
          {sel ? (
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: BLUE }} />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{name(sel)}</div>
                <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                  <b className="tabular-nums text-slate-900 dark:text-white">{fmt(counts.gov[sel])}</b> visits {range === 'all' ? 'all time' : 'in the last 30 days'}
                  {' · '}{pct(counts.gov[sel])}% of visits from Kuwait
                </div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {range === 'all' ? 'Last 30 days' : 'All time'}: {fmt(counts.other[sel])}
                </div>
              </div>
              <button type="button" onClick={() => setSel(null)} className="adm-press flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer dark:hover:bg-white/10" aria-label="Clear"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tap a governorate or a bubble to see its visits. Drag to move, pinch or scroll to zoom.
              {' '}Outside Kuwait: <b className="text-slate-700 dark:text-slate-200">{fmt(counts.outside)}</b>
              {' · '}Location unknown: <b className="text-slate-700 dark:text-slate-200">{fmt(counts.unknown)}</b>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------- The Overview card ----------------
export default function KuwaitVisitorsMap({ places }) {
  const [range, setRange] = useState('all')
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(null)
  const counts = useCounts(places, range)
  const top = Math.max(1, ...Object.values(counts.gov))
  const pairs = GOV_ORDER.map((g) => [g, counts.gov[g]])
  const openAt = (g) => { setFocus(g); setOpen(true) }

  // Body stays still while the map window is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const W = 560, H = 170, pad = 12, bw = (W - pad * 2) / pairs.length, barW = Math.min(64, bw - 12)

  return (
    <section className="adm-card rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">Governorates</h2>
        <div className="flex items-center gap-2">
          <Seg value={range} onChange={setRange} />
          <button type="button" onClick={() => openAt(null)}
            className="adm-press flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold cursor-pointer hover:border-slate-900 dark:border-white/15 dark:hover:border-white">
            <MapIcon className="h-3.5 w-3.5" /> Visitors map
          </button>
        </div>
      </div>

      {/* Phones: rows with a bar; computers: a bar chart. Each one opens the map at that governorate. */}
      <div className="space-y-1 md:hidden">
        {pairs.map(([g, v]) => (
          <button key={g} type="button" onClick={() => openAt(g)} className="adm-press flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
            <span className="w-28 shrink-0 truncate text-sm">{SHORT[g] || g}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <i className="block h-full rounded-full" style={{ width: `${Math.max(2, (v / top) * 100)}%`, background: BLUE }} />
            </span>
            <b className="w-12 text-right text-sm font-semibold tabular-nums">{fmt(v)}</b>
          </button>
        ))}
      </div>
      <svg className="hidden w-full md:block" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visits by governorate">
        <line x1={pad} x2={W - pad} y1={H - 30} y2={H - 30} className="stroke-slate-200 dark:stroke-white/15" />
        {pairs.map(([g, v], i) => {
          const h = Math.max(3, Math.round((v / top) * (H - 56))), cx = pad + i * bw + bw / 2, y = H - 30 - h
          return (
            <g key={g} className="cursor-pointer" onClick={() => openAt(g)}>
              <rect x={cx - bw / 2 + 2} y={10} width={bw - 4} height={H - 20} fill="transparent" />
              <rect x={cx - barW / 2} y={y} width={barW} height={h} rx="4" fill={BLUE} className="adm-gov-bar"><title>{name(g)}: {v}</title></rect>
              <text x={cx} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="600" className="fill-slate-700 dark:fill-slate-200">{fmt(v)}</text>
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="11" className="fill-slate-500 dark:fill-slate-400">{SHORT[g] || g}</text>
            </g>
          )
        })}
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><Globe2 className="h-3 w-3" /> Outside Kuwait</div>
          <div className="text-lg font-bold tabular-nums">{fmt(counts.outside)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Location unknown</div>
          <div className="text-lg font-bold tabular-nums">{fmt(counts.unknown)}</div>
        </div>
      </div>

      {/* Rendered at page level: the card lifts on hover, which would move a window placed inside it */}
      {open && createPortal(<MapModal counts={counts} range={range} setRange={setRange} focus={focus} onClose={() => setOpen(false)} />, document.body)}
    </section>
  )
}
