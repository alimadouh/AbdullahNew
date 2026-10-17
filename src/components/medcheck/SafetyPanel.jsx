import { useState } from 'react'
import { CircleCheck, CircleHelp, CircleDashed, OctagonX, TriangleAlert, Copy, Check, Layers, ListChecks, ArrowRight, ChevronDown } from 'lucide-react'
import { LEVELS, LEVEL_LABEL } from '../../lib/medcheck/engine.js'
import { LEVEL_META, LevelBadge, SourceList, sourceShort } from './common.jsx'

const AREAS = [
  ['interactions', 'Interactions'], ['duplication', 'Duplicate ingredients'], ['allergy', 'Allergies'], ['conditions', 'Diagnoses'],
  ['pregnancy', 'Pregnancy'], ['breastfeeding', 'Breastfeeding'], ['renal', 'Kidney function'], ['hepatic', 'Liver function'], ['age', 'Age'],
]
const FIELD_INPUT = { renal: 'mc-egfr', crcl: 'mc-crcl', hepatic: 'mc-liver', 'hepatic-severity': 'mc-liver', allergy: 'mc-allergy-status', conditions: 'mc-cond', pregnancy: 'mc-preg', trimester: 'mc-preg', breastfeeding: 'mc-bf', age: 'mc-age', weight: 'mc-weight', medsComplete: 'mc-meds-complete' }

function statusView(area, c, nMeds) {
  if (!c) return { Icon: CircleDashed, text: 'Not run', cls: 'text-muted-foreground' }
  switch (c.status) {
    case 'issues': return { Icon: TriangleAlert, text: `${c.count ?? ''} finding${c.count === 1 ? '' : 's'}`.trim(), cls: 'text-orange-700 dark:text-orange-300' }
    case 'clear':
      if (area === 'interactions') return { Icon: CircleCheck, text: `None found between these ${c.distinct ?? nMeds} medicines${c.complete ? '' : ' (list not confirmed complete)'}`, cls: 'text-emerald-700 dark:text-emerald-300' }
      return { Icon: CircleCheck, text: `No issue found${c.note ? ` · ${c.note}` : ''}`, cls: 'text-emerald-700 dark:text-emerald-300' }
    case 'clear-norules': return { Icon: CircleDashed, text: 'No sourced rule for these medicines', cls: 'text-muted-foreground' }
    case 'missing': return { Icon: CircleHelp, text: `Not assessed: ${c.note ? c.note.toLowerCase() : 'not recorded'}`, cls: 'text-amber-700 dark:text-amber-300' }
    case 'partial': return { Icon: CircleHelp, text: `Only ${c.entered} entered diagnos${c.entered === 1 ? 'is' : 'es'} checked`, cls: 'text-amber-700 dark:text-amber-300' }
    case 'na': return { Icon: CircleDashed, text: area === 'interactions' || area === 'duplication' ? 'Needs 2 or more medicines' : 'Not applicable', cls: 'text-muted-foreground' }
    case 'failed': return { Icon: OctagonX, text: 'Check failed: do not rely on this area', cls: 'text-red-700 dark:text-red-300 font-semibold' }
    default: return { Icon: CircleDashed, text: c.status, cls: 'text-muted-foreground' }
  }
}

function Statement({ s, multi }) {
  return (
    <div className={multi ? 'border-l-2 pl-2' : ''}>
      {multi && <div className="mb-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">{s.about}: <LevelBadge level={s.level} size="xs" /></div>}
      {multi && s.title && <p className="text-[12px] font-medium leading-snug">{s.title}</p>}
      {s.consequence && <p className="text-[13px] leading-snug">{s.consequence}</p>}
      {multi && s.provisional && <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-200">Needs confirmation: {s.provisional}</p>}
    </div>
  )
}

function FindingRow({ f, idx }) {
  const multi = f.statements.length > 1
  return (
    <tr className="align-top">
      <td className="hidden border-t px-3 py-2.5 md:table-cell"><LevelBadge level={f.level} /></td>
      <td className="border-t px-3 py-2.5">
        <div className="md:hidden mb-1.5"><LevelBadge level={f.level} /></div>
        <p className="text-sm font-semibold leading-snug">{f.concern}</p>
        {f.toolCheck && <p className="mt-0.5 text-[11px] text-muted-foreground">Detected by this tool</p>}
        {!f.verified && <p className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">Unverified: source wording not matched</p>}
        {f.provisional && <p className="mt-1 rounded border border-dashed border-amber-400 px-1.5 py-0.5 text-[11px] text-amber-800 dark:text-amber-200">Needs confirmation: {f.provisional}</p>}
      </td>
      <td className="border-t px-3 py-2.5 text-[13px]">
        <span className="font-medium">{f.meds.join(' + ')}</span>
        {f.factor && <div className="mt-0.5 text-xs text-muted-foreground">{f.factor}</div>}
      </td>
      <td className="border-t px-3 py-2.5"><div className="space-y-1.5">{f.statements.map((s, i) => <Statement key={i} s={s} multi={multi} />)}</div></td>
      <td className="border-t px-3 py-2.5">
        <div className="space-y-1.5">{f.statements.map((s, i) => (
          <div key={i} className={multi ? 'border-l-2 pl-2' : ''}>
            {multi && <div className="text-[11px] font-semibold text-muted-foreground">{s.about}</div>}
            <p className="text-[13px] font-medium leading-snug">{s.action}</p>
            {s.sourceWording && <p className="mt-0.5 text-[11px] text-muted-foreground">Source wording: “{s.sourceWording}”</p>}
          </div>
        ))}</div>
      </td>
      <td className="border-t px-3 py-2.5 md:min-w-[11rem]">
        <div className="space-y-1.5">{f.statements.map((s, i) => <SourceList key={i} sources={s.sources} />)}</div>
      </td>
    </tr>
  )
}

function FindingCardMobile({ f }) {
  const multi = f.statements.length > 1
  return (
    <li className={`rounded-xl border-l-4 border bg-card p-3 ${LEVEL_META[f.level].cls.split(' ').filter((c) => c.startsWith('border-') || c.startsWith('dark:border-')).join(' ')}`}>
      <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold leading-snug">{f.concern}</p><LevelBadge level={f.level} size="xs" /></div>
      <p className="mt-1 text-xs"><span className="font-medium">{f.meds.join(' + ')}</span>{f.factor && <span className="text-muted-foreground"> · {f.factor}</span>}</p>
      {f.toolCheck && <p className="mt-0.5 text-[11px] text-muted-foreground">Detected by this tool</p>}
      {!f.verified && <p className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">Unverified: source wording not matched</p>}
      {f.provisional && <p className="mt-1 rounded border border-dashed border-amber-400 px-1.5 py-0.5 text-[11px] text-amber-800 dark:text-amber-200">Needs confirmation: {f.provisional}</p>}
      <dl className="mt-2 space-y-2">
        {f.statements.map((s, i) => (
          <div key={i} className={multi ? 'border-l-2 pl-2' : ''}>
            {multi && <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">{s.about} <LevelBadge level={s.level} size="xs" /></div>}
            {s.consequence && <><dt className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Consequence</dt><dd className="text-[13px] leading-snug">{s.consequence}</dd></>}
            <dt className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Action</dt><dd className="text-[13px] font-medium leading-snug">{s.action}</dd>
            {s.sourceWording && <dd className="mt-0.5 text-[11px] text-muted-foreground">Source wording: “{s.sourceWording}”</dd>}
            <dt className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Source</dt><dd><SourceList sources={s.sources} /></dd>
          </div>
        ))}
      </dl>
    </li>
  )
}

export function summaryText(result, ctx) {
  const L = []
  L.push(`Medication safety check (${new Date().toLocaleString('en-GB')})`)
  L.push(`Medicines: ${ctx.medLabels.join('; ') || 'none'}`)
  L.push(`Patient: ${ctx.patientLine}`)
  L.push('')
  if (result.errors.length) L.push(`CHECKS FAILED (do not rely on these areas): ${result.errors.join(', ')}`)
  if (result.unknown.length) L.push(`NOT IN THE DATA, NOT CHECKED: ${result.unknown.join(', ')}`)
  if (!result.findings.length) L.push('No issue found in the checks that could be run (this is not a statement that the combination is safe).')
  for (const lv of LEVELS) {
    const fs = result.findings.filter((f) => f.level === lv)
    if (!fs.length) continue
    L.push(`${LEVEL_LABEL[lv].toUpperCase()}`)
    for (const f of fs) {
      L.push(`- ${f.concern} [${f.meds.join(' + ')}${f.factor ? '; ' + f.factor : ''}]`)
      if (f.provisional) L.push(`  Needs confirmation: ${f.provisional}`)
      for (const s of f.statements) L.push(`  ${s.about}: ${s.action}${s.sources?.length ? ' (' + s.sources.map(sourceShort).join('; ') + ')' : ''}`)
    }
  }
  if (result.missing.length) { L.push(''); L.push('NOT ASSESSED / COULD CHANGE THIS ASSESSMENT'); for (const m of result.missing) L.push(`- ${m.label}: ${m.why}`) }
  L.push(''); L.push('WHAT WAS CHECKED')
  for (const [k, label] of AREAS) L.push(`- ${label}: ${statusView(k, result.checks[k], ctx.medLabels.length).text}`)
  L.push(''); L.push('UK sources only (SmPC, MHRA, NICE, SPS, UKTIS/BUMPS). BNF/BNFC not accessed. Not a substitute for clinical judgement.')
  return L.join('\n')
}

export default function SafetyPanel({ kb, result, selection, ctx, onFocusField, panelRef }) {
  const [copied, setCopied] = useState(false)
  const [openMissing, setOpenMissing] = useState({})
  const nMeds = selection.length
  const { findings, counts, missing, checks, cumulative } = result
  const copy = async () => { try { await navigator.clipboard.writeText(summaryText(result, ctx)); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* clipboard blocked */ } }

  return (
    <section ref={panelRef} id="mc-safety" aria-labelledby="mc-safety-h" className="scroll-mt-20 rounded-2xl border-2 border-slate-300 bg-card shadow-sm dark:border-slate-600">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
        <div>
          <h3 id="mc-safety-h" className="text-base font-bold">Combined safety assessment</h3>
          <p className="text-xs text-muted-foreground">{nMeds} medicine{nMeds === 1 ? '' : 's'} checked together against the patient details entered</p>
        </div>
        <button type="button" onClick={copy} disabled={!nMeds} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy summary for notes'}
        </button>
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {result.errors.length > 0 && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400 bg-red-50 p-2.5 text-sm font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-200"><OctagonX className="mt-0.5 h-4 w-4 shrink-0" />Some checks failed ({result.errors.join(', ')}). Do not rely on those areas.</p>
        )}
        {result.unknown.length > 0 && <p role="alert" className="rounded-lg border border-red-400 bg-red-50 p-2.5 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-200">Not in the data file, so not checked: {result.unknown.join(', ')}</p>}

        {/* counts */}
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          {findings.length ? LEVELS.filter((l) => counts[l]).map((l) => {
            const M = LEVEL_META[l]
            return <span key={l} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold ${M.cls}`}><M.Icon className="h-4 w-4" aria-hidden="true" />{counts[l]} {M.label}</span>
          }) : (
            <p className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span><b>No issue found in the checks that could be run.</b> This does not mean the combination is safe. See what was not assessed below.</span>
            </p>
          )}
        </div>

        {/* findings */}
        {findings.length > 0 && (
          <>
            <div className="hidden overflow-x-auto rounded-xl border md:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-3 py-2 font-semibold">Level</th><th className="px-3 py-2 font-semibold">Concern</th><th className="px-3 py-2 font-semibold">Medicines · patient factor</th><th className="px-3 py-2 font-semibold">Clinical consequence</th><th className="px-3 py-2 font-semibold">Recommended action</th><th className="px-3 py-2 font-semibold">Source</th></tr>
                </thead>
                <tbody>{findings.map((f, i) => <FindingRow key={f.key} f={f} idx={i} />)}</tbody>
              </table>
            </div>
            <ul className="space-y-2.5 md:hidden">{findings.map((f) => <FindingCardMobile key={f.key} f={f} />)}</ul>
          </>
        )}

        {/* cumulative */}
        {cumulative.length > 0 && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold"><Layers className="h-4 w-4" />Adding-up risks</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {cumulative.map((c) => (
                <div key={c.effect} className={`rounded-lg border px-3 py-2 text-sm ${LEVEL_META[c.level].cls}`}>
                  <b>{c.label}</b>: {c.meds.length} medicines add to this risk ({c.meds.join(', ')}). Highest level: {LEVEL_LABEL[c.level]}.
                </div>
              ))}
            </div>
          </div>
        )}

        {/* what could change this assessment */}
        {missing.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <h4 className="flex items-center gap-1.5 text-sm font-bold"><CircleHelp className="h-4 w-4" />What could change this assessment?</h4>
            <p className="mb-2 text-xs text-muted-foreground">Missing details, ranked by the strongest advice they could trigger. Each line comes from a sourced rule for the medicines selected.</p>
            <ul className="space-y-2">
              {missing.map((m) => {
                const shown = openMissing[m.field] ? m.impacts : m.impacts.slice(0, 4)
                return (
                  <li key={m.field} className="rounded-lg border bg-card p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{m.label} <span className="font-normal text-muted-foreground">: {m.why}</span></p>
                      {FIELD_INPUT[m.field] && <button type="button" onClick={() => onFocusField(FIELD_INPUT[m.field])} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold hover:bg-muted">Add <ArrowRight className="h-3 w-3" /></button>}
                    </div>
                    {m.impacts.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {shown.map((x, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
                            <LevelBadge level={x.level} size="xs" />
                            <span className="font-medium">{x.med}</span>
                            {x.scope && <span className="text-muted-foreground">· {x.scope}</span>}
                            {x.concern && <span className="text-muted-foreground">· {x.concern}</span>}
                          </li>
                        ))}
                        {m.impacts.length > 4 && (
                          <li><button type="button" onClick={() => setOpenMissing((o) => ({ ...o, [m.field]: !o[m.field] }))} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                            <ChevronDown className={`h-3 w-3 transition-transform ${openMissing[m.field] ? 'rotate-180' : ''}`} />{openMissing[m.field] ? 'Show fewer' : `${m.impacts.length - 4} more`}
                          </button></li>
                        )}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* checks run */}
        <div>
          <h4 className="mb-1.5 text-sm font-semibold">What was checked</h4>
          <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {AREAS.map(([k, label]) => {
              const v = statusView(k, checks[k], nMeds)
              return (
                <li key={k} className="flex items-start gap-1.5 text-xs">
                  <v.Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${v.cls}`} aria-hidden="true" />
                  <span><b>{label}:</b> <span className={v.cls}>{v.text}</span></span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* scope & limitations */}
        <details className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          <summary className="cursor-pointer select-none font-semibold">Scope and limitations</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
            <li>The data covers <b>{kb.medicines.length} medicines only</b>. A medicine that is not in the list is not checked.</li>
            <li>Interactions come only from what the UK SmPCs (and the MHRA/SPS pages cited) of these medicines say about each other. This is not a full interaction database.</li>
            <li><b>BNF and BNFC were not accessed</b>: they are only available in the UK. Nothing here has been checked against them.</li>
            <li>Diagnoses: only the conditions in the picker are checked. A diagnosis that was not entered is treated as <b>unknown</b>, not absent, unless you confirm that the list is complete.</li>
            <li>Where a rule uses CrCl but only eGFR was given (or the reverse), the finding is marked “needs confirmation”.</li>
            <li>Every rule is tied to a verbatim quote that was found on the source page on {kb.verification.checkedAt.slice(0, 10)} ({kb.verification.quotesFound}/{kb.verification.quotesTotal} quotes matched). The rules have <b>not</b> been clinically validated or reviewed by a pharmacist. Use clinical judgement.</li>
          </ul>
        </details>
      </div>
    </section>
  )
}
