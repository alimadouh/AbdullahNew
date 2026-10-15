// Probe one chart cell: chart rows vs model summary, and the model value for each single factor.
// Usage: node scripts/frax_surrogate/probe.mjs female mof bmi 85 25
import fs from 'fs'
import { pointQuantities, setProb, FACTORS } from '../../src/lib/fraxSurrogate.js'
const C = JSON.parse(fs.readFileSync(new URL('../../src/data/fraxKuwait.json', import.meta.url)))
const [sex, oc, kind, age, x] = process.argv.slice(2)
const t = C[sex][oc][kind], ai = t.ages.indexOf(+age), xi = t.x.indexOf(+x)
const q = pointQuantities(undefined, sex, oc, kind, +age, +x)
const SUBS = Array.from({ length: 7 }, () => []); for (let m = 0; m < 64; m++) { let k = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) k++; SUBS[k].push(m) }
if (ai >= 0 && xi >= 0) for (let k = 0; k <= 6; k++) {
  const ps = SUBS[k].map(m => setProb(q, m))
  console.log(k, 'chart', JSON.stringify(t.rows[ai][k][xi]), 'model', [ps.reduce((a, v) => a + v, 0) / ps.length, Math.min(...ps), Math.max(...ps)].map(v => v.toFixed(2)).join(' '))
}
console.log('singles', FACTORS.map((f, j) => `${f} ${setProb(q, 1 << j).toFixed(2)}`).join(', '), ' pi', q.pi?.toFixed(3))
