import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Pill, Syringe, Cross, CornerDownLeft, X } from 'lucide-react'
import { prefetchData } from '../utils/api.js'
import { findColumnName } from '../utils/columns.js'
import { medImageFor } from './MedImage.jsx'
import { parseCalc } from './MedicationDetails.jsx'

// Home: one search over every medicine and vaccine, a moving shelf of real product photos,
// and live counts. Nothing on this page is typed in by hand: it all comes from the tables.

const SOURCES = [
  { key: 'clinic', label: 'Clinic', Icon: Pill },
  { key: 'er-medication', label: 'ER', Icon: Cross },
  { key: 'vaccination', label: 'Vaccine', Icon: Syringe },
]

const ECG = 'M0,60 H100 l12,-6 l12,6 H150 l6,6 l8,-46 l8,82 l6,-42 H230 l14,-10 l14,10 H370 l12,-6 l12,6 H410 l6,6 l8,-46 l8,82 l6,-42 H490 l14,-10 l14,10 H600'

// Built once per visit and kept, so going back to Home is instant
let indexCache = null

function buildIndex(section, data) {
  const cols = data?.columns || []
  const nameCol = findColumnName(cols, ['trading name', 'trading'])
  const genCol = findColumnName(cols, ['generic name', 'generic', 'medication', 'vaccine'])
  const doseCol = findColumnName(cols, ['dose'])
  const typeCol = findColumnName(cols, ['type'])
  const indCol = findColumnName(cols, ['indications'])
  // Vaccines repeat by age, so the age goes on the second line
  const ageCol = section === 'vaccination' ? findColumnName(cols, ['age/timing', 'age', 'category']) : null
  const s = (d, c) => { const v = c ? String(d[c] ?? '').trim() : ''; return /^[-–—]+$/.test(v) ? '' : v }
  return (data?.rows || []).map((r) => {
    const d = r.data || {}
    const generic = s(d, genCol)
    const name = s(d, nameCol) || generic
    return { id: r.id, section, name, generic: generic !== name ? generic : '', age: s(d, ageCol), dose: s(d, doseCol), type: s(d, typeCol), img: medImageFor(r), calc: !!(indCol && d[indCol] && typeof d[indCol] === 'object' && parseCalc(d[indCol].calc).length) }
  }).filter((x) => x.name)
}

const norm = (t) => t.toLowerCase().replace(/[^a-z0-9./%]+/g, ' ').trim()

function searchIndex(items, q) {
  const words = norm(q).split(' ').filter(Boolean)
  if (!words.length) return []
  const out = []
  for (const it of items) {
    const name = norm(it.name), all = `${name} ${norm(it.generic)} ${norm(it.type)} ${norm(it.dose)}`
    if (!words.every((w) => all.includes(w))) continue
    const score = name.startsWith(words[0]) ? 0 : name.includes(words[0]) ? 1 : 2
    out.push([score, it])
  }
  return out.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).slice(0, 8).map((x) => x[1])
}

// Same order on every visit (no random), different spread across the shelf
const hash = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h }

function useCountUp(target, run) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run || !target) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return }
    let raf, start
    const step = (t) => {
      start ??= t
      const p = Math.min(1, (t - start) / 1400)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, run])
  return n
}

function Stat({ value, label, run }) {
  const n = useCountUp(value, run)
  return (
    <div className="min-w-0 text-center">
      <div className="font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">{value && run ? n : '–'}</div>
      <div className="mt-0.5 truncate text-[11px] font-medium text-slate-400 sm:text-xs">{label}</div>
    </div>
  )
}

// Types a real medicine name into the empty search box, one letter at a time
function useTypingHint(names, active) {
  const [text, setText] = useState('')
  useEffect(() => {
    if (!active || !names.length) { setText(''); return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setText(names[0]); return }
    let i = 0, pos = 0, dir = 1, timer
    const tick = () => {
      const word = names[i % names.length]
      pos += dir
      setText(word.slice(0, pos))
      let wait = dir > 0 ? 75 : 35
      if (dir > 0 && pos >= word.length) { dir = -1; wait = 1600 }
      else if (dir < 0 && pos <= 0) { dir = 1; i++; wait = 350 }
      timer = setTimeout(tick, wait)
    }
    timer = setTimeout(tick, 600)
    return () => clearTimeout(timer)
  }, [names, active])
  return text
}

export default function HomePage({ colors, onOpen, onSearch, toolCount }) {
  const [index, setIndex] = useState(indexCache)
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)
  const boxRef = useRef(null)

  useEffect(() => {
    if (indexCache) return
    let alive = true
    Promise.allSettled(SOURCES.map((s) => prefetchData(s.key).then((d) => buildIndex(s.key, d)))).then((res) => {
      const built = { items: [], counts: {} }
      res.forEach((r, i) => {
        const items = r.status === 'fulfilled' ? r.value : []
        built.items.push(...items)
        built.counts[SOURCES[i].key] = items.length
      })
      built.photos = built.items.filter((x) => x.img)
      built.calcs = built.items.filter((x) => x.calc).length
      if (built.items.length) indexCache = built
      if (alive) setIndex(built)
    })
    return () => { alive = false }
  }, [])

  const results = useMemo(() => (index ? searchIndex(index.items, q) : []), [index, q])
  useEffect(() => setSel(0), [q])

  // Two shelf rows of product photos, each shown twice so the loop has no seam
  const shelf = useMemo(() => {
    const photos = [...(index?.photos || [])].sort((a, b) => hash(a.id) - hash(b.id)).slice(0, 36)
    const half = Math.ceil(photos.length / 2)
    return [photos.slice(0, half), photos.slice(half)]
  }, [index])

  const hints = useMemo(() => shelf.flat().slice(0, 8).map((x) => x.name.split(/\s+/).slice(0, 2).join(' ')), [shelf])
  const typed = useTypingHint(hints, !q && !focused)

  // Close the results when tapping outside
  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setFocused(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const open = (it) => onOpen(it.section, it.id)
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[sel]) open(results[sel])
      else if (q.trim()) onSearch('clinic', q.trim())
    } else if (e.key === 'Escape') { setQ(''); inputRef.current?.blur() }
  }

  const showResults = focused && q.trim().length > 0
  const counts = index?.counts || {}

  return (
    <div className="no-print">
      {/* Hero */}
      <section className="home-hero relative isolate z-10 bg-[#0f172a] text-white dark:bg-[#0a0f1c]">
        {/* Background kept in its own clipped layer so the search results can hang below the hero */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="home-dots absolute inset-0" />
          <div className="home-glow absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full sm:h-[560px] sm:w-[560px]" />
        </div>

        <div className="mx-auto max-w-3xl px-4 pt-9 pb-8 sm:px-6 sm:pt-16 sm:pb-12">
          <h2 className="home-hero-in font-display text-center text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Every medicine,
            <span className="block text-cyan-300">one search away.</span>
          </h2>

          {/* Heartbeat line */}
          <svg viewBox="0 0 600 120" className="mx-auto mt-2 h-14 w-full max-w-xl overflow-visible sm:h-20" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <linearGradient id="homeEcg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
            <path className="ecg-base" pathLength="1000" d={ECG} style={{ stroke: '#334155', opacity: 0.7 }} />
            <path className="ecg-pulse" pathLength="1000" stroke="url(#homeEcg)" d={ECG} />
            <circle className="ecg-dot" r="4.5" fill="#22d3ee" />
          </svg>

          {/* Search */}
          <div ref={boxRef} className="relative mx-auto mt-2 max-w-xl">
            <div className={`home-search flex items-center gap-3 rounded-2xl bg-white px-4 text-slate-900 ${focused ? 'is-focused' : ''}`}>
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => {
                  setFocused(true)
                  // Phones: lift the box to the top so the keyboard does not cover the results
                  if (window.innerWidth < 1024) {
                    const top = boxRef.current.getBoundingClientRect().top + window.scrollY - 72
                    setTimeout(() => window.scrollTo({ top, behavior: 'smooth' }), 250)
                  }
                }}
                onKeyDown={onKey}
                placeholder={focused ? 'Name, generic, dose…' : typed ? `Try “${typed}”` : 'Search any medicine or vaccine'}
                className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
                aria-label="Search medicines and vaccines"
                role="combobox"
                aria-expanded={showResults}
                aria-controls="home-results"
                autoComplete="off"
              />
              {q && (
                <button type="button" onClick={() => { setQ(''); inputRef.current?.focus() }} className="nav-press flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showResults && (
              <div id="home-results" role="listbox" className="home-results absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-white/10 dark:bg-[#111827] dark:text-white">
                {!index ? (
                  <div className="px-4 py-5 text-sm text-slate-500">Loading medicines…</div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">No match for “{q.trim()}”.</div>
                ) : (
                  <ul className="max-h-[min(60vh,440px)] overflow-y-auto overscroll-contain py-1">
                    {results.map((it, i) => {
                      const src = SOURCES.find((s) => s.key === it.section)
                      const c = colors[it.section]
                      return (
                        <li key={`${it.section}-${it.id}`} role="option" aria-selected={i === sel}>
                          <button
                            type="button"
                            onMouseEnter={() => setSel(i)}
                            onClick={() => open(it)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left cursor-pointer ${i === sel ? 'bg-slate-100 dark:bg-white/10' : ''}`}
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-white/10">
                              {it.img
                                ? <img src={it.img} alt="" loading="lazy" className="h-full w-full object-contain" />
                                : <src.Icon className="h-5 w-5" style={{ color: c }} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{it.name}</span>
                              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{[it.age, it.generic, it.dose, it.type].filter(Boolean).join(' · ')}</span>
                            </span>
                            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: c, background: c + '1f' }}>{src.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {index && results.length > 0 && (
                  <div className="hidden items-center gap-1.5 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 dark:border-white/10 sm:flex">
                    <CornerDownLeft className="h-3 w-3" /> to open · ↑ ↓ to move
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live counts */}
          <div className="mx-auto mt-9 grid max-w-xl grid-cols-5 gap-1 border-t border-white/10 pt-6">
            <Stat value={counts.clinic} label="Clinic" run={!!index} />
            <Stat value={counts['er-medication']} label="ER" run={!!index} />
            <Stat value={counts.vaccination} label="Vaccines" run={!!index} />
            <Stat value={toolCount} label="Tools" run={!!index} />
            <Stat value={index?.calcs} label="Calculators" run={!!index} />
          </div>
        </div>
      </section>

      {/* Moving shelf of product photos */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto mb-5 flex max-w-7xl items-end justify-between gap-4 px-4 sm:px-6">
          <div>
            <h3 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">On the shelf</h3>
            <p className="text-sm text-muted-foreground">Tap a pack to see its dose.</p>
          </div>
        </div>
        {shelf[0].length ? (
          <div className="home-shelf flex flex-col gap-3">
            {shelf.map((row, r) => (
              <div key={r} className="overflow-hidden">
                <div className={`home-track flex w-max gap-3 ${r ? 'home-track-rev' : ''}`}>
                  {[...row, ...row].map((it, i) => (
                    <button
                      key={`${it.id}-${i}`}
                      type="button"
                      onClick={() => open(it)}
                      tabIndex={i >= row.length ? -1 : 0}
                      aria-hidden={i >= row.length ? 'true' : undefined}
                      className="tile group flex w-32 shrink-0 flex-col overflow-hidden rounded-2xl border bg-card text-left cursor-pointer sm:w-40"
                      style={{ '--tile': colors.clinic }}
                    >
                      <span className="flex h-28 items-center justify-center bg-white p-2 sm:h-36">
                        <img src={it.img} alt={it.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                      </span>
                      <span className="border-t px-2.5 py-2">
                        <span className="block truncate text-xs font-semibold">{it.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{it.dose || it.generic || ' '}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4">
            {[0, 1].map((r) => (
              <div key={r} className="flex gap-3 overflow-hidden">
                {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[165px] w-32 shrink-0 animate-pulse rounded-2xl bg-muted sm:h-[205px] sm:w-40" />)}
              </div>
            ))}
          </div>
        )}
        <p className="mt-10 text-center text-xs text-muted-foreground">Done by Dr. Abdullah Almusallam</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">Engineered by Ali Madouh</p>
      </section>
    </div>
  )
}
