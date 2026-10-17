import { useState } from 'react'
import { OctagonX, TriangleAlert, CircleCheck } from 'lucide-react'
import { LevelBadge, sourceShort } from './common.jsx'

// One box, shown by default (no patient details needed):
//  title  = which medicines interact + the conditions in which a medicine must not be given
//  below  = each interacting pair with what the interaction is and the action, in one line each.
const clean = (s) => s.replace(/\s*\((any severity; )?source gives no numeric threshold\)/i, '')

function Refs({ sources }) {
  return (
    <span className="ml-1 inline-flex flex-wrap gap-x-1 align-baseline">
      {sources.map((s, i) => (
        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" title={`${sourceShort(s)}${s.quote ? `\n“${s.quote}”` : ''}`}
          className="text-[10.5px] font-semibold text-blue-700 hover:underline dark:text-blue-300">[{i + 1}]</a>
      ))}
    </span>
  )
}

// short label for a contraindication; allergy to the medicine itself is left out (obvious)
function ciText(c, medName) {
  if (c.kind === 'allergy' && c.scope.replace('Allergy to ', '').toLowerCase().startsWith(medName.toLowerCase().split(' ')[0])) return null
  let s = clean(c.scope)
  if (/^[A-Z][a-z]/.test(s)) s = s[0].toLowerCase() + s.slice(1) // "Active bleeding" -> "active bleeding" (keeps G6PD, QT)
  return c.kind === 'pregnancy' ? s.replace('pregnancy, trimester', 'pregnancy (trimester').replace(/(\d)$/, '$1)') : s
}

// one line per medicine; long lists show the first items and a "+N more" button
const SHOW = 6
function CiLine({ m }) {
  const [all, setAll] = useState(false)
  const lines = all ? m.lines : m.lines.slice(0, SHOW)
  return (
    <span><b>{m.label}</b>: do not give in {lines.map((c, i) => <span key={c.scope}>{i ? ', ' : ''}{c.text}<Refs sources={c.sources.slice(0, 1)} /></span>)}
      {m.lines.length > SHOW && <button type="button" onClick={() => setAll((x) => !x)} className="ml-1 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300">{all ? 'show less' : `+${m.lines.length - SHOW} more`}</button>}
    </span>
  )
}

export default function QuickPanel({ result, contra, nDistinct, nCovered, panelRef }) {
  const pairs = result.findings.filter((f) => f.kind === 'interaction' || f.kind === 'duplication')
  const serious = pairs.filter((f) => ['contraindicated', 'avoid'].includes(f.level))
  const ci = contra.map((m) => ({ ...m, lines: m.contraindicated.map((c) => ({ ...c, text: ciText(c, m.label) })).filter((c) => c.text) })).filter((m) => m.lines.length)

  return (
    <section ref={panelRef} id="mc-quick" aria-labelledby="mc-quick-h" className="scroll-mt-20 overflow-hidden rounded-2xl border-2 border-slate-300 bg-card shadow-sm dark:border-slate-600">
      {/* title: the answer in one look */}
      <header className={`border-b px-4 py-3 sm:px-5 ${pairs.length ? (serious.length ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/20') : 'bg-muted/40'}`}>
        <h3 id="mc-quick-h" className="sr-only">Safety check</h3>
        {nDistinct < 2 ? (
          <p className="text-sm font-semibold text-muted-foreground">Add another medicine to check interactions.</p>
        ) : pairs.length ? (
          <ul className="space-y-1">
            {pairs.map((f) => (
              <li key={f.key} className="flex flex-wrap items-center gap-2 text-[15px] font-bold leading-snug">
                <TriangleAlert className="h-4 w-4 shrink-0 text-red-700 dark:text-red-300" aria-hidden="true" />
                <span>{f.meds.join(' + ')}</span>
                <LevelBadge level={f.level} size="xs" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-[15px] font-bold"><CircleCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />No interaction found between these medicines</p>
        )}
        {result.unchecked?.length > 0 && (
          <p className="mt-2 rounded-md border border-dashed border-slate-400 px-2 py-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            No UK product information for: {result.unchecked.join('; ')}
          </p>
        )}
        {ci.length > 0 && (
          <div className="mt-2 space-y-1">
            {ci.map((m) => (
              <p key={m.key} className="flex gap-2 text-[13px] leading-snug">
                <OctagonX className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                <CiLine m={m} />
              </p>
            ))}
          </div>
        )}
      </header>

      {/* below: what each interaction is, one line each */}
      {pairs.length > 0 && (
        <ul className="divide-y">
          {pairs.map((f) => {
            const s = f.statements[0]
            const what = f.kind === 'duplication' ? f.concern : f.concern.replace(/^Interaction:\s*/, '')
            const sources = f.statements.flatMap((x) => x.sources).filter((x, i, a) => x.url && a.findIndex((y) => y.id === x.id) === i).slice(0, 3)
            return (
              <li key={f.key} className="px-4 py-2.5 text-[13px] leading-snug sm:px-5">
                <b>{f.meds.join(' + ')}</b>: <span className="font-medium">{what}</span>. {s.action}<Refs sources={sources} />
              </li>
            )
          })}
        </ul>
      )}
      <p className="border-t px-4 py-2 text-[11px] text-muted-foreground sm:px-5">UK sources only (SmPC, MHRA, NICE, SPS, BUMPS); BNF not accessed. Covers the {nCovered} medicines in this list. Tap [n] for the source.</p>
    </section>
  )
}
