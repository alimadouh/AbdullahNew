// Verifies the UK medication checker data:
//  1. schema + id checks (lib/load.mjs validate)
//  2. every source URL is on the UK allow-list and loads (HTTP 200)
//  3. every quote is found verbatim (after whitespace/quote/dash normalisation) in the fetched page text
// Writes verify-report.json (read by build.mjs). Use --fresh to re-download every page.
//   MEDCHECK_CACHE=<dir> node scripts/medcheck-uk/verify.mjs [--fresh]
import fs from 'fs'
import path from 'path'
import { loadAll, validate, allQuotes, ROOT } from './lib/load.mjs'
import { getText, quoteFound } from './lib/text.mjs'

const fresh = process.argv.includes('--fresh')
const data = loadAll()
const { errs, warns } = validate(data)

// group membership claimed in a medicine file but not backed by a sourced member entry
for (const m of data.medicines) for (const g of m.groups ?? []) {
  if (!data.groups[g]?.members.some((x) => x.med === m.id)) warns.push(`${m.id}: membership of group ${g} has no sourced member entry`)
}

const pages = {}
const ids = [...new Set([...allQuotes(data)].map((x) => x.ref.s))].filter((id) => data.sources[id])
let done = 0
for (const id of ids) {
  const s = data.sources[id]
  pages[id] = await getText(s.url, { fresh })
  if (++done % 20 === 0) console.log(`fetched ${done}/${ids.length}`)
}

const sourceStatus = {}
for (const id of ids) {
  const p = pages[id]
  sourceStatus[id] = { status: p.status, ok: p.status === 200 && p.text.length > 500, fetchedAt: p.fetchedAt, finalUrl: p.finalUrl, chars: p.text.length }
  if (!sourceStatus[id].ok) errs.push(`source ${id} did not load (status ${p.status}, ${p.text.length} chars): ${data.sources[id].url}`)
}

const quotes = {}
let found = 0, total = 0
const failures = []
for (const { where, ref } of allQuotes(data)) {
  const p = pages[ref.s]; if (!p) continue
  total++
  const ok = !!p.text && quoteFound(p.text, ref.q)
  quotes[`${ref.s}\u0000${ref.q}`] = ok
  if (ok) found++; else failures.push({ where, source: ref.s, quote: ref.q })
}

const report = { checkedAt: new Date().toISOString(), quotesTotal: total, quotesFound: found, failures, sourceStatus, quotes, errors: errs, warnings: warns }
fs.writeFileSync(path.join(ROOT, 'verify-report.json'), JSON.stringify(report, null, 1))
console.log(`medicines ${data.medicines.length} | sources ${ids.length} | quotes ${found}/${total} found | schema errors ${errs.length} | warnings ${warns.length}`)
for (const e of errs.slice(0, 60)) console.log('ERROR', e)
for (const f of failures.slice(0, 60)) console.log('NOT FOUND', f.where, '|', f.source, '|', f.quote.slice(0, 120))
for (const w of warns.slice(0, 40)) console.log('warn', w)
process.exitCode = errs.length || failures.length ? 1 : 0
