// Leave-one-out check of the known FRAX cases: for each case, refit (that sex only) without it and
// predict it. Runs fit.mjs one case at a time (single thread, low priority).
// Usage: node scripts/frax_surrogate/loo_cases.mjs <scratch dir>
import { execFileSync } from 'child_process'
import fs from 'fs'; import path from 'path'; import os from 'os'
import { fraxProbability, roundAsShown } from '../../src/lib/fraxSurrogate.js'
import { knownCases } from './cases.mjs'
const dir = process.argv[2] || os.tmpdir()
const fit = new URL('./fit.mjs', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const e = { mof: [], hip: [] }
for (const c of knownCases()) {
  const out = path.join(dir, `loo_${c.id}.json`)
  if (!fs.existsSync(out)) execFileSync(process.execPath, [fit], { env: { ...process.env, EXCLUDE: c.id, ONLYSEX: c.sex, OUT: out }, stdio: 'ignore' })
  const P = JSON.parse(fs.readFileSync(out, 'utf8'))
  const r = fraxProbability(c, P), m = roundAsShown(r.mof), h = roundAsShown(r.hip)
  e.mof.push(Math.abs(m - c.mof)); e.hip.push(Math.abs(h - c.hip))
  console.log(`${c.id.padEnd(4)} FRAX ${c.mof}/${c.hip}  left-out fit ${m}/${h}`)
}
const st = (a) => `mean ${(a.reduce((s, v) => s + v, 0) / a.length).toFixed(2)} max ${Math.max(...a).toFixed(2)}`
console.log(`LOO  MOF ${st(e.mof)} | hip ${st(e.hip)}`)
