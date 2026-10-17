import { useState } from 'react'
import { ChevronDown, OctagonX, ArrowLeftRight } from 'lucide-react'
import { LevelBadge, sourceShort } from './common.jsx'

// At-a-glance panel shown by default (no patient details needed):
// 1) interactions / duplicates between the medicines entered, 2) for each medicine, when it must not be given.
const KIND_LABEL = { condition: 'Condition', pregnancy: 'Pregnancy', breastfeeding: 'Breastfeeding', renal: 'Kidney', hepatic: 'Liver', age: 'Age', allergy: 'Allergy' }
const clean = (s) => s.replace(/\s*\(source gives no numeric threshold\)/i, '').replace(/\s*\(any severity; source gives no numeric threshold\)/i, '')

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

function CiList({ items }) {
  return (
    <ul className="space-y-1">
      {items.map((c) => (
        <li key={c.scope} className="flex gap-2 text-[13px] leading-snug">
          <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{KIND_LABEL[c.kind]}</span>
          <span className="min-w-0">{clean(c.scope)}<Refs sources={c.sources} /></span>
        </li>
      ))}
    </ul>
  )
}

function MedBlock({ m }) {
  const [more, setMore] = useState(false)
  return (
    <div className="rounded-xl border p-3">
      <p className="mb-1.5 text-sm font-bold">{m.label}</p>
      {m.contraindicated.length ? (
        <>
          <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-red-700 dark:text-red-300"><OctagonX className="h-3.5 w-3.5" aria-hidden="true" />Do not give (contraindicated)</p>
          <CiList items={m.contraindicated} />
        </>
      ) : <p className="text-[13px] text-muted-foreground">No contraindication listed in the UK sources used.</p>}
      {m.avoid.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setMore((x) => !x)} aria-expanded={more} className="inline-flex items-center gap-1 text-xs font-semibold text-orange-800 dark:text-orange-300">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${more ? 'rotate-180' : ''}`} />Avoid / not recommended ({m.avoid.length})
          </button>
          {more && <div className="mt-1.5"><CiList items={m.avoid} /></div>}
        </div>
      )}
    </div>
  )
}

export default function QuickPanel({ result, contra, nDistinct, nCovered, panelRef }) {
  const pairs = result.findings.filter((f) => f.kind === 'interaction' || f.kind === 'duplication')
  return (
    <section ref={panelRef} id="mc-quick" aria-labelledby="mc-quick-h" className="scroll-mt-20 rounded-2xl border-2 border-slate-300 bg-card shadow-sm dark:border-slate-600">
      <div className="space-y-5 px-4 py-4 sm:px-5">
        <div>
          <h3 id="mc-quick-h" className="mb-2 flex items-center gap-1.5 text-base font-bold"><ArrowLeftRight className="h-4 w-4" aria-hidden="true" />Interactions</h3>
          {nDistinct < 2 ? <p className="text-sm text-muted-foreground">Add another medicine to check interactions.</p>
            : pairs.length === 0 ? <p className="text-sm text-muted-foreground">No interaction found between these medicines in the UK sources used.</p>
            : (
              <ul className="divide-y rounded-xl border">
                {pairs.map((f) => {
                  const s = f.statements[0]
                  const sources = f.statements.flatMap((x) => x.sources).filter((x, i, a) => x.url && a.findIndex((y) => y.id === x.id) === i)
                  return (
                    <li key={f.key} className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3">
                      <LevelBadge level={f.level} className="self-start" />
                      <div className="min-w-0 flex-1 text-[13px] leading-snug">
                        <p><b>{f.meds.join(' + ')}</b><span className="text-muted-foreground"> · {f.kind === 'duplication' ? f.concern : f.concern.replace(/^Interaction:\s*/, '')}</span></p>
                        <p className="mt-0.5">{s.action}<Refs sources={sources} /></p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-base font-bold"><OctagonX className="h-4 w-4 text-red-600" aria-hidden="true" />When not to give</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {contra.map((m) => <MedBlock key={m.key} m={m} />)}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">UK sources only (SmPC, MHRA, NICE, SPS, BUMPS). BNF not accessed. Only the {nCovered} medicines in this list are covered. Hover or tap [n] for the source.</p>
      </div>
    </section>
  )
}
