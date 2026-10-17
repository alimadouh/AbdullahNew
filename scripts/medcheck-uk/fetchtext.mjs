// Research helper: fetch a source page as normalised plain text (same text the verifier checks).
//   node scripts/medcheck-uk/fetchtext.mjs <url>                     -> status + length + first 3000 chars
//   node scripts/medcheck-uk/fetchtext.mjs <url> --grep "pattern"    -> each match with 300 chars around it
//   node scripts/medcheck-uk/fetchtext.mjs <url> --section "4.3" "4.4" -> text between two markers
//   node scripts/medcheck-uk/fetchtext.mjs <url> --check "exact quote" -> FOUND / NOT FOUND
//   add --fresh to bypass the cache
import { getText, norm, quoteFound, decodeEntities } from './lib/text.mjs'

const [url, ...rest] = process.argv.slice(2)
if (!url) { console.log('usage: fetchtext.mjs <url> [--grep re | --section from to | --check quote | --all] [--fresh]'); process.exit(1) }
const fresh = rest.includes('--fresh')
if (rest.includes('--links')) {
  // list links (href + anchor text), optionally filtered: --links "smpc"
  const filt = rest[rest.indexOf('--links') + 1]
  const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36' }, redirect: 'follow' })).text()
  const seen = new Set()
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = new URL(m[1].replace(/&amp;/g, '&'), url).href, txt = norm(decodeEntities(m[2].replace(/<[^>]+>/g, ' ')))
    if (filt && !filt.startsWith('--') && !(href + ' ' + txt).toLowerCase().includes(filt.toLowerCase())) continue
    if (seen.has(href + txt)) continue; seen.add(href + txt); console.log(`${txt} | ${href}`)
  }
} else await main()
async function main() {
const page = await getText(url, { fresh })
console.log(`status ${page.status} | final ${page.finalUrl} | chars ${page.text.length}${page.error ? ' | error ' + page.error : ''}`)
const t = page.text
const at = (flag) => rest.indexOf(flag)
if (at('--grep') >= 0) {
  const re = new RegExp(rest[at('--grep') + 1], 'gi'); let m, n = 0
  while ((m = re.exec(t)) && n < 40) { n++; console.log(`--- @${m.index}\n${t.slice(Math.max(0, m.index - 300), m.index + 300)}`) ; if (m[0] === '') re.lastIndex++ }
  if (!n) console.log('no match')
} else if (at('--section') >= 0) {
  const a = rest[at('--section') + 1], b = rest[at('--section') + 2]
  const i = t.indexOf(a), j = b ? t.indexOf(b, i + a.length) : -1
  console.log(i < 0 ? 'start marker not found' : t.slice(i, j > i ? j : i + 6000))
} else if (at('--check') >= 0) {
  const q = rest[at('--check') + 1]
  console.log(quoteFound(t, q) ? 'FOUND' : 'NOT FOUND', '|', norm(q))
} else if (rest.includes('--all')) {
  console.log(t)
} else {
  console.log(t.slice(0, 3000))
}
}
