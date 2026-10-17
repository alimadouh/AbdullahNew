import { OctagonX, Ban, SlidersHorizontal, TriangleAlert, Activity, Info, ExternalLink } from 'lucide-react'
import { LEVEL_LABEL } from '../../lib/medcheck/engine.js'

// Severity is always shown as icon + words, never colour alone.
export const LEVEL_META = {
  contraindicated: { Icon: OctagonX, label: LEVEL_LABEL.contraindicated, meaning: 'The source says it must not be used.', cls: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200', dot: 'bg-red-600' },
  avoid: { Icon: Ban, label: LEVEL_LABEL.avoid, meaning: 'The source says avoid, should not be used, or not recommended.', cls: 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200', dot: 'bg-orange-500' },
  dose: { Icon: SlidersHorizontal, label: LEVEL_LABEL.dose, meaning: 'A dose change or dose limit is stated.', cls: 'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200', dot: 'bg-violet-500' },
  caution: { Icon: TriangleAlert, label: LEVEL_LABEL.caution, meaning: 'Use with caution or weigh risk and benefit.', cls: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200', dot: 'bg-amber-500' },
  monitor: { Icon: Activity, label: LEVEL_LABEL.monitor, meaning: 'Monitoring is required.', cls: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200', dot: 'bg-sky-500' },
  info: { Icon: Info, label: LEVEL_LABEL.info, meaning: 'Relevant information; no action stated.', cls: 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200', dot: 'bg-slate-500' },
}

export function LevelBadge({ level, size = 'sm', className = '' }) {
  const m = LEVEL_META[level] ?? LEVEL_META.info
  const s = size === 'xs' ? 'px-1.5 py-0.5 text-[10.5px] gap-1' : 'px-2 py-0.5 text-xs gap-1.5'
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md border font-semibold ${s} ${m.cls} ${className}`}>
      <m.Icon className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {m.label}
    </span>
  )
}

const TYPE_LABEL = { smpc: 'SmPC', mhra: 'MHRA', nice: 'NICE', sps: 'SPS', uktis: 'UKTIS', bumps: 'BUMPS', rcophth: 'RCOphth' }
export const sourceShort = (s) => `${TYPE_LABEL[s.type] ?? 'Source'}: ${s.title?.replace(/\s*-\s*(Summary of Product Characteristics \(SmPC\)|SmPC)\s*$/i, '') ?? s.id}`

// A list of sources for a finding/statement, with the verbatim quote available on demand.
export function SourceList({ sources, compact = false }) {
  if (!sources?.length) return <span className="text-xs italic text-muted-foreground">Tool check (no source statement)</span>
  return (
    <ul className="space-y-1">
      {sources.map((s, i) => (
        <li key={i} className="text-xs leading-snug">
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-300">
              <span>{sourceShort(s)}</span><ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          ) : <span className="text-red-700">Source missing</span>}
          {!compact && s.quote && (
            <details className="mt-0.5">
              <summary className="cursor-pointer select-none text-[11px] text-muted-foreground hover:text-foreground">Source wording</summary>
              <blockquote className="mt-1 border-l-2 pl-2 text-[11px] italic text-muted-foreground">“{s.quote}”</blockquote>
            </details>
          )}
        </li>
      ))}
    </ul>
  )
}

export function Segmented({ value, onChange, options, label, size = 'sm', id }) {
  return (
    <div role="radiogroup" aria-label={label} id={id} className="inline-flex flex-wrap gap-1 rounded-lg bg-muted/70 p-0.5">
      {options.map((o) => {
        const on = value === o.value
        return (
          <button key={String(o.value)} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`rounded-md px-2.5 ${size === 'xs' ? 'py-0.5 text-[11px]' : 'py-1 text-xs'} font-medium transition-colors ${on ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'} ${o.value === null && on ? 'italic' : ''}`}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
