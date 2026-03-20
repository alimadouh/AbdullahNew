import React, { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { AlertTriangle, CheckCircle2, XCircle, Circle, RotateCcw, ChevronDown, ChevronUp, ExternalLink, Clock, TrendingUp } from 'lucide-react'

// ── Milestone Data ──────────────────────────────────────────────────────────
const MILESTONES = {
  grossMotor: {
    name: 'Gross Motor',
    emoji: '🏃',
    color: '#2563eb',
    items: [
      { m: 3, text: 'Little or no head lag on being pulled to sit' },
      { m: 3, text: 'Lying on abdomen, good head control' },
      { m: 3, text: 'Held sitting, lumbar curve' },
      { m: 6, text: 'Lying on abdomen, arms extended' },
      { m: 6, text: 'Lying on back, lifts and grasps feet' },
      { m: 6, text: 'Pulls self to sitting' },
      { m: 6, text: 'Held sitting, back straight' },
      { m: 6, text: 'Rolls front to back' },
      { m: 8, text: 'Sits without support', ref: 12, refDetail: 'Refer if not sitting without support by 12 months' },
      { m: 9, text: 'Pulls to standing' },
      { m: 9, text: 'Crawls' },
      { m: 12, text: 'Cruises' },
      { m: 12, text: 'Walks with one hand held' },
      { m: 15, text: 'Walks unsupported', ref: 18, refDetail: 'Refer if not walking unsupported by 18 months. Hand dominance before 12 months is a red flag and may indicate hemiparesis.' },
      { m: 18, text: 'Squats to pick up a toy' },
      { m: 24, text: 'Runs' },
      { m: 24, text: 'Walks upstairs and downstairs holding on to rail' },
      { m: 36, text: 'Rides a tricycle using pedals' },
      { m: 36, text: 'Walks up stairs without holding on to rail' },
      { m: 48, text: 'Hops on one leg' },
    ],
  },
  fineMotor: {
    name: 'Fine Motor & Vision',
    emoji: '✋',
    color: '#0891b2',
    items: [
      { m: 3, text: 'Reaches for object', ref: 5, refDetail: 'Failure to reach for objects by 5 months is a red flag. Persistent fisting prior to 3 months is abnormal.' },
      { m: 3, text: 'Holds rattle briefly if given to hand', refDetail: 'Persistent fisting prior to 3 months is abnormal' },
      { m: 3, text: 'Visually alert, particularly human faces' },
      { m: 3, text: 'Fixes and follows to 180 degrees' },
      { m: 6, text: 'Holds in palmar grasp' },
      { m: 6, text: 'Pass objects from one hand to another' },
      { m: 9, text: 'Points with finger' },
      { m: 9, text: 'Early pincer' },
      { m: 12, text: 'Good pincer grip', ref: 15, refDetail: 'Hand preference before 12 months is abnormal and may indicate cerebral palsy' },
      { m: 12, text: 'Bangs toys together' },
      { m: 15, text: 'Tower of 2 bricks' },
      { m: 15, text: 'Looks at book, pats page' },
      { m: 18, text: 'Tower of 3 bricks' },
      { m: 18, text: 'Circular scribble' },
      { m: 18, text: 'Turns pages, several at time' },
      { m: 24, text: 'Tower of 6 bricks' },
      { m: 24, text: 'Copies vertical line' },
      { m: 24, text: 'Turns pages, one at time' },
      { m: 36, text: 'Tower of 9 bricks' },
      { m: 36, text: 'Copies circle' },
      { m: 48, text: 'Copies cross' },
      { m: 60, text: 'Copies square and triangle' },
    ],
  },
  speech: {
    name: 'Speech & Hearing',
    emoji: '🗣️',
    color: '#7c3aed',
    items: [
      { m: 3, text: 'Quietens to parents voice' },
      { m: 3, text: 'Turns towards sound' },
      { m: 3, text: 'Squeals' },
      { m: 6, text: "Double syllables 'adah', 'erleh'" },
      { m: 9, text: "Says 'mama' and 'dada'" },
      { m: 9, text: "Understands 'no'" },
      { m: 12, text: 'Knows and responds to own name' },
      { m: 15, text: 'Knows about 2-6 words', ref: 18, refDetail: 'Refer if fewer than 6 words by 18 months' },
      { m: 15, text: "Understands simple commands – 'give it to mummy'" },
      { m: 24, text: 'Combine two words' },
      { m: 24, text: 'Points to parts of the body' },
      { m: 30, text: 'Vocabulary of 200 words' },
      { m: 36, text: 'Talks in short sentences (3-5 words)' },
      { m: 36, text: "Asks 'what' and 'who' questions" },
      { m: 36, text: 'Identifies colours' },
      { m: 36, text: 'Counts to 10' },
      { m: 48, text: "Asks 'why', 'when' and 'how' questions" },
    ],
  },
  social: {
    name: 'Social & Play',
    emoji: '🤝',
    color: '#ea580c',
    items: [
      { m: 1.4, text: 'Smiles', ref: 2.5, refDetail: 'Absent smile by 10 weeks is a red flag — refer immediately' },
      { m: 3, text: 'Laughs' },
      { m: 3, text: 'Enjoys friendly handling' },
      { m: 6, text: 'Not shy' },
      { m: 6, text: 'May put hand on bottle when being fed' },
      { m: 9, text: 'Shy / stranger anxiety' },
      { m: 9, text: "Plays 'peek-a-boo'" },
      { m: 12, text: "Waves 'bye-bye'" },
      { m: 12, text: "Plays 'pat-a-cake'" },
      { m: 15, text: 'Helps getting dressed/undressed' },
      { m: 15, text: 'Drinks from cup + uses spoon', ref: 18, refDetail: 'Using a spoon develops around 12-15 months. Delay may indicate motor or developmental concerns.' },
      { m: 18, text: 'Plays contentedly alone' },
      { m: 18, text: 'Takes off shoes, hat but unable to replace' },
      { m: 24, text: 'Plays near others, not with them' },
      { m: 24, text: 'Puts on hat and shoes' },
      { m: 24, text: "Competent with spoon, doesn't spill with cup" },
      { m: 36, text: 'Uses spoon and fork' },
      { m: 48, text: 'Plays with other children' },
      { m: 48, text: 'Can dress and undress independently except for laces and buttons' },
      { m: 60, text: 'Uses knife and fork' },
    ],
  },
}

const RED_FLAGS = [
  { min: 0, max: 3, text: 'Persistent fisting prior to 3 months' },
  { min: 0, max: 3, text: 'Rolling prior to 3 months' },
  { min: 2.5, max: 6, text: 'Absent smile by 10 weeks' },
  { min: 4, max: 6, text: 'Failure to reach for objects by 5 months' },
  { min: 6, max: 12, text: 'Persistence of primitive reflexes after 6 months' },
  { min: 12, max: 24, text: 'Hand dominance before 12 months (may indicate hemiparesis)' },
  { min: 12, max: 24, text: 'Not walking unsupported by 18 months' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
function ageLabel(months) {
  if (months < 1) return 'Birth'
  if (months < 24) return `${Math.round(months)} mo`
  const y = Math.floor(months / 12)
  const m = Math.round(months % 12)
  return m ? `${y}y ${m}m` : `${y}y`
}

function groupByAge(items) {
  const map = new Map()
  items.forEach(item => {
    const key = item.m
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
}

// ── Component ───────────────────────────────────────────────────────────────
export default function DevMilestones({ open, onClose }) {
  const [years, setYears] = useState('')
  const [months, setMonths] = useState('')
  const [weeks, setWeeks] = useState('')
  const [applied, setApplied] = useState(false)
  const [failed, setFailed] = useState({})
  const [redFlagChecked, setRedFlagChecked] = useState({})
  const defaultCollapsed = { grossMotor: true, fineMotor: true, speech: true, social: true, redFlags: true }
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [notes, setNotes] = useState('')

  const totalMonths = useMemo(() => {
    return (parseInt(years) || 0) * 12 + (parseInt(months) || 0) + (parseInt(weeks) || 0) / 4.33
  }, [years, months, weeks])

  // Filter milestones up to child's age
  const filtered = useMemo(() => {
    if (!applied) return {}
    const result = {}
    for (const [key, cat] of Object.entries(MILESTONES)) {
      const items = cat.items.filter(i => i.m <= totalMonths)
      if (items.length > 0) result[key] = items
    }
    return result
  }, [applied, totalMonths])

  // Next milestones (just beyond current age)
  const upcoming = useMemo(() => {
    if (!applied) return []
    const next = []
    for (const [, cat] of Object.entries(MILESTONES)) {
      const future = cat.items.filter(i => i.m > totalMonths && i.m <= totalMonths + 6)
      if (future.length > 0) next.push({ name: cat.name, color: cat.color, items: future.slice(0, 3) })
    }
    return next
  }, [applied, totalMonths])

  // Red flags for this age
  const redFlags = useMemo(() => {
    if (!applied) return []
    return RED_FLAGS.filter(rf => totalMonths >= rf.min && totalMonths <= rf.max)
  }, [applied, totalMonths])

  // Per-category stats
  const catStats = useMemo(() => {
    const stats = {}
    for (const [key] of Object.entries(MILESTONES)) {
      const items = filtered[key] || []
      const done = items.filter(i => !failed[`${key}:${i.text}`]).length
      stats[key] = { total: items.length, done }
    }
    return stats
  }, [filtered, failed])

  // Developmental age estimate per category
  const devAge = useMemo(() => {
    const ages = {}
    for (const [key, cat] of Object.entries(MILESTONES)) {
      const items = filtered[key] || []
      if (items.length === 0) { ages[key] = null; continue }
      // Find the highest age group where all milestones are achieved
      const groups = groupByAge(items)
      let lastFullAge = 0
      for (const [ageM, groupItems] of groups) {
        const allDone = groupItems.every(i => !failed[`${key}:${i.text}`])
        if (allDone) lastFullAge = ageM
        else break
      }
      ages[key] = lastFullAge
    }
    return ages
  }, [filtered, failed])

  // Assessment
  const assessment = useMemo(() => {
    if (!applied) return null
    const totalItems = Object.values(filtered).reduce((s, arr) => s + arr.length, 0)
    const totalFailed = Object.values(failed).filter(Boolean).length

    const delays = []
    const referrals = []

    for (const [key, cat] of Object.entries(MILESTONES)) {
      const items = filtered[key] || []
      const missed = items.filter(i => failed[`${key}:${i.text}`])
      if (missed.length > 0) {
        delays.push({ category: cat.name, color: cat.color, items: missed })
        const needsRef = missed.filter(i => i.ref && totalMonths >= i.ref)
        if (needsRef.length > 0) referrals.push({ category: cat.name, color: cat.color, items: needsRef })
      }
    }

    // Red flag concerns
    const redFlagConcerns = redFlags.filter((_, i) => redFlagChecked[i])

    const onTrack = delays.length === 0 && redFlagConcerns.length === 0
    return { delays, referrals, redFlagConcerns, onTrack, totalItems, totalFailed }
  }, [applied, filtered, failed, catStats, totalMonths, redFlags, redFlagChecked])

  const handleReset = () => {
    setApplied(false)
    setFailed({})
    setRedFlagChecked({})
    setCollapsed(defaultCollapsed)
    setNotes('')
    setYears('')
    setMonths('')
    setWeeks('')
  }

  const openReport = () => {
    if (!assessment) return
    const childAge = ageLabel(Math.round(totalMonths))
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const accentColor = '#16a34a'

    // Summary table
    const summaryRows = Object.entries(MILESTONES).map(([key, cat]) => {
      const items = filtered[key] || []
      if (items.length === 0) return ''
      const failedItems = items.filter(i => failed[`${key}:${i.text}`])
      const status = failedItems.length === 0
      const color = status ? '#16a34a' : '#dc2626'
      const bg = status ? '#f0fdf4' : '#fef2f2'
      const label = status ? 'On Track' : `${failedItems.length} concern${failedItems.length > 1 ? 's' : ''}`
      return `<tr style="background:${bg}">
        <td style="padding:8px 12px;font-weight:500">${cat.emoji} ${cat.name}</td>
        <td style="padding:8px 12px;text-align:center"><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:${color};background:${bg}">${label}</span></td>
      </tr>`
    }).join('')

    // Category detail sections
    const catSections = Object.entries(MILESTONES).map(([key, cat]) => {
      const items = filtered[key] || []
      if (items.length === 0) return ''
      const groups = groupByAge(items)
      const groupsHTML = groups.map(([ageM, groupItems]) => {
        const rowsHTML = groupItems.map(i => {
          const done = !failed[`${key}:${i.text}`]
          const icon = done ? '✅' : '❌'
          const textStyle = done ? '' : 'color:#dc2626;font-weight:500'
          const refBadge = !done && i.ref && totalMonths >= i.ref ? '<span style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700;color:#dc2626;background:#fecaca">REFER</span>' : ''
          const detailLine = !done && i.refDetail ? `<div style="font-size:11px;color:#dc2626;margin:2px 0 0 28px">${i.refDetail}</div>` : ''
          return `<div style="padding:5px 0;border-bottom:1px solid #f3f4f6"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px">${icon}</span><span style="font-size:13px;${textStyle}">${i.text}</span>${refBadge}</div>${detailLine}</div>`
        }).join('')
        return `<div style="margin-bottom:4px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${cat.color}88;padding:4px 0">By ${ageLabel(ageM)}</div>${rowsHTML}</div>`
      }).join('')

      return `<div style="margin-bottom:24px;break-inside:avoid">
        <div style="background:${cat.color}0d;border:1px solid ${cat.color}25;border-radius:8px;padding:10px 14px;margin-bottom:8px">
          <span style="font-size:15px;font-weight:700;color:${cat.color}">${cat.emoji} ${cat.name}</span>
        </div>
        <div style="padding:0 4px">${groupsHTML}</div>
      </div>`
    }).join('')

    // Red flags section
    const redFlagRows = redFlags.map((rf, i) => {
      const present = !!redFlagChecked[i]
      const icon = present ? '⚠️' : '✅'
      const style = present ? 'color:#dc2626;font-weight:500' : ''
      return `<div style="padding:5px 0;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:8px"><span style="font-size:14px">${icon}</span><span style="font-size:13px;${style}">${rf.text}</span></div>`
    }).join('')
    const redFlagSection = redFlags.length > 0 ? `<div style="margin-bottom:24px;break-inside:avoid">
      <div style="background:#dc26260d;border:1px solid #dc262625;border-radius:8px;padding:10px 14px;margin-bottom:8px">
        <span style="font-size:15px;font-weight:700;color:#dc2626">🚩 Red Flags</span>
      </div>
      <div style="padding:0 4px">${redFlagRows}</div>
    </div>` : ''

    // Assessment section
    let assessmentHTML = ''
    if (assessment.onTrack) {
      assessmentHTML = `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 18px;margin-bottom:24px">
        <h2 style="font-size:14px;font-weight:700;color:#16a34a;margin:0 0 4px">✅ Development On Track</h2>
        <p style="font-size:13px;color:#166534;margin:0">All expected milestones for this age have been achieved. No red flags identified.</p>
      </div>`
    } else {
      const parts = []
      if (assessment.delays.length > 0) {
        const delayRows = assessment.delays.flatMap(d => d.items.map(i => `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #fde68a;font-size:12px;font-weight:600;color:${d.color}">${d.category}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #fde68a;font-size:12px;color:#92400e">${i.text}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #fde68a;font-size:12px;color:#d97706">By ${ageLabel(i.m)}</td>
        </tr>`)).join('')
        parts.push(`<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:10px;overflow:hidden">
          <h3 style="font-size:13px;font-weight:700;color:#d97706;margin:0 0 8px">⚠️ Delayed Milestones</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#fef3c7">
              <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:600;color:#92400e;border-bottom:1px solid #fde68a">Category</th>
              <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:600;color:#92400e;border-bottom:1px solid #fde68a">Milestone</th>
              <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:600;color:#92400e;border-bottom:1px solid #fde68a">Expected</th>
            </tr></thead>
            <tbody>${delayRows}</tbody>
          </table>
        </div>`)
      }
      if (assessment.referrals.length > 0 || assessment.redFlagConcerns.length > 0) {
        const allRows = []
        assessment.referrals.forEach(r => r.items.forEach(i => {
          allRows.push(`<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #fecaca;font-size:12px;font-weight:600;color:${r.color}">${r.category}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #fecaca;font-size:12px;color:#991b1b">${i.text}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #fecaca;font-size:11px;color:#dc2626">${i.refDetail || ''}</td>
          </tr>`)
        }))
        assessment.redFlagConcerns.forEach(rf => {
          allRows.push(`<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #fecaca;font-size:12px;font-weight:600;color:#dc2626">Red Flag</td>
            <td style="padding:6px 12px;border-bottom:1px solid #fecaca;font-size:12px;color:#991b1b;font-weight:500">${rf.text}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #fecaca;font-size:11px;color:#dc2626"></td>
          </tr>`)
        })
        parts.push(`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-bottom:10px;overflow:hidden">
          <h3 style="font-size:13px;font-weight:700;color:#dc2626;margin:0 0 8px">🚨 Red Flags & Referrals</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#fee2e2">
              <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:600;color:#991b1b;border-bottom:1px solid #fecaca">Category</th>
              <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:600;color:#991b1b;border-bottom:1px solid #fecaca">Concern</th>
              <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:600;color:#991b1b;border-bottom:1px solid #fecaca">Details</th>
            </tr></thead>
            <tbody>${allRows.join('')}</tbody>
          </table>
        </div>`)
      }
      assessmentHTML = parts.join('')
    }

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Developmental Milestones — ${childAge}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; background:#f5f5f5; color:#333; }
  .page { max-width:900px; margin:20px auto; background:#fff; padding:32px 36px; box-shadow:0 1px 10px rgba(0,0,0,0.12); }
  @media (max-width:640px) { .page { margin:0; padding:20px 14px; box-shadow:none; } }
  @media print {
    body { background:#fff; }
    .page { margin:0; padding:20px; box-shadow:none; }
    .no-print { display:none !important; }
  }
</style>
</head><body>
<div class="page">

  <!-- Header -->
  <div style="border-bottom:3px solid ${accentColor};padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:8px">
    <div>
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a">Developmental Milestones Assessment</h1>
      <p style="font-size:12px;color:#888;margin-top:4px">Generated on ${dateStr}</p>
    </div>
    <div style="font-size:11px;color:#888;text-align:right;line-height:1.5">
      Pediatric Developmental Screening<br>Based on standard milestones
    </div>
  </div>

  <!-- Patient Info -->
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:24px">
    <h2 style="font-size:13px;font-weight:700;color:${accentColor};margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Patient Information</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px 24px;font-size:13px">
      <div><span style="color:#666">Age:</span> <strong>${childAge}</strong></div>
      <div><span style="color:#666">Date:</span> <strong>${new Date().toLocaleDateString('en-GB')}</strong></div>
    </div>
  </div>

  <!-- Summary -->
  <h2 style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Summary</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <thead><tr style="background:#f9fafb">
      <th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb">Category</th>
      <th style="padding:8px 12px;text-align:center;font-size:12px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb">Status</th>
    </tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <!-- Assessment -->
  ${assessmentHTML}

  <p style="margin-top:32px;font-size:11px;color:#999;text-align:center">Generated by PCIS Medication — ${dateStr}</p>
  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:10px 20px;background:${accentColor};color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.15)">Print / Save PDF</button>
</div>
</body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const hasAge = (parseInt(years) || 0) > 0 || (parseInt(months) || 0) > 0 || (parseInt(weeks) || 0) > 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { handleReset(); onClose() } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Developmental Milestones</DialogTitle>
          <DialogDescription className="sr-only">Developmental milestones assessment</DialogDescription>
        </DialogHeader>

        {/* ── Age Input ── */}
        {!applied ? (
          <div className="flex gap-3 items-end mt-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Years</label>
              <Input type="number" min="0" max="5" placeholder="0" value={years} onChange={e => setYears(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Months</label>
              <Input type="number" min="0" max="11" placeholder="0" value={months} onChange={e => setMonths(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Weeks</label>
              <Input type="number" min="0" max="4" placeholder="0" value={weeks} onChange={e => setWeeks(e.target.value)} />
            </div>
            <Button onClick={() => setApplied(true)} disabled={!hasAge} className="shrink-0">Apply</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Age: <strong className="text-foreground">{ageLabel(Math.round(totalMonths))}</strong></span>
            <Button variant="outline" size="sm" onClick={handleReset} className="ml-auto gap-1 text-xs h-7">
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          </div>
        )}

        {/* ── Overview Cards ── */}

        {/* ── Milestones Checklist ── */}
        {applied && (
          <div className="flex flex-col gap-3">
            {Object.entries(MILESTONES).map(([key, cat]) => {
              const items = filtered[key]
              if (!items || items.length === 0) return null
              const isCollapsed = collapsed[key]
              const groups = groupByAge(items)

              return (
                <div key={key} className="border rounded-xl overflow-hidden" style={{ borderColor: cat.color + '25' }}>
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-full flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors"
                    style={{ backgroundColor: cat.color + '0d' }}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="font-semibold text-sm flex-1 text-left" style={{ color: cat.color }}>{cat.name}</span>
                    {isCollapsed ? <ChevronDown className="h-4 w-4" style={{ color: cat.color }} /> : <ChevronUp className="h-4 w-4" style={{ color: cat.color }} />}
                  </button>
                  {!isCollapsed && (
                    <div>
                      {groups.map(([ageM, groupItems]) => (
                        <div key={ageM}>
                          <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: cat.color + '90', backgroundColor: cat.color + '06' }}>
                            By {ageLabel(ageM)}
                          </div>
                          {groupItems.map((item) => {
                            const id = `${key}:${item.text}`
                            const isFailed = !!failed[id]
                            return (
                              <button
                                key={id}
                                onClick={() => setFailed(prev => ({ ...prev, [id]: !prev[id] }))}
                                className="w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer hover:bg-accent/50 transition-colors border-b last:border-b-0"
                                style={{ borderColor: cat.color + '10' }}
                              >
                                {isFailed ? (
                                  <XCircle className="h-[18px] w-[18px] shrink-0 text-red-500" />
                                ) : (
                                  <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-green-500" />
                                )}
                                <span className={`text-sm flex-1 ${isFailed ? 'text-red-600' : ''}`}>{item.text}</span>
                                {item.ref && isFailed && totalMonths >= item.ref && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-semibold shrink-0">REFER</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* ── Red Flags ── */}
            {redFlags.length > 0 && (
              <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#dc262630' }}>
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, redFlags: !prev.redFlags }))}
                  className="w-full flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors"
                  style={{ backgroundColor: '#dc26260d' }}
                >
                  <span className="text-base">🚩</span>
                  <span className="font-semibold text-sm flex-1 text-left text-red-600">Red Flags</span>
                  {collapsed.redFlags ? <ChevronDown className="h-4 w-4 text-red-400" /> : <ChevronUp className="h-4 w-4 text-red-400" />}
                </button>
                {!collapsed.redFlags && (
                  <div>
                    <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-50/50">
                      Check if present
                    </div>
                    {redFlags.map((rf, i) => {
                      const isChecked = !!redFlagChecked[i]
                      return (
                        <button
                          key={i}
                          onClick={() => setRedFlagChecked(prev => ({ ...prev, [i]: !prev[i] }))}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer hover:bg-red-50/50 transition-colors border-b last:border-b-0"
                          style={{ borderColor: '#dc262610' }}
                        >
                          {isChecked ? (
                            <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-red-600" />
                          ) : (
                            <Circle className="h-[18px] w-[18px] shrink-0 text-muted-foreground/30" />
                          )}
                          <span className={`text-sm ${isChecked ? 'text-red-700 font-medium' : ''}`}>{rf.text}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Assessment ── */}
            {assessment && (
              <div className="border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 font-semibold text-sm flex items-center gap-2">
                  Assessment
                  <Button variant="outline" size="sm" className="ml-auto gap-1 text-xs h-7" onClick={openReport}>
                    <ExternalLink className="h-3 w-3" /> Full Report
                  </Button>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {assessment.onTrack ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <div>
                        <span className="font-semibold">Development on track</span>
                        <p className="text-xs text-green-700 mt-0.5">All expected milestones achieved. No red flags.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {assessment.delays.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <p className="text-sm font-semibold text-amber-700 mb-1">⚠️ Delayed Milestones</p>
                          {assessment.delays.map((d, i) => (
                            <div key={i} className="mb-1">
                              <span className="text-xs font-bold" style={{ color: d.color }}>{d.category}: </span>
                              <span className="text-xs text-amber-800">{d.items.map(item => item.text).join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {assessment.referrals.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" /> Referral Recommended
                          </p>
                          {assessment.referrals.map((r, i) => (
                            <div key={i} className="mb-2">
                              <span className="text-xs font-bold" style={{ color: r.color }}>{r.category}:</span>
                              {r.items.map((item, j) => (
                                <div key={j} className="ml-2 mt-0.5">
                                  <p className="text-xs text-red-800 font-medium">• {item.text}</p>
                                  {item.refDetail && <p className="text-[11px] text-red-600 ml-3 mt-0.5">{item.refDetail}</p>}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {assessment.redFlagConcerns.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" /> Red Flags Present
                          </p>
                          {assessment.redFlagConcerns.map((rf, i) => (
                            <p key={i} className="text-xs text-red-800 ml-2">• {rf.text}</p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
