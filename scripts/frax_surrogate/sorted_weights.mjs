// Unlabeled per-cell fit (competing-risk link): the six factor weights of each chart cell, sorted.
// Shows how the spread of weights moves with age; used to check the factor labels.
// Usage: node scripts/frax_surrogate/sorted_weights.mjs female hip bmd -2.5
import fs from 'fs'
import { lm } from './lm.mjs'
import { linkProb } from '../../src/lib/fraxSurrogate.js'
const C = JSON.parse(fs.readFileSync(new URL('../../src/data/fraxKuwait.json', import.meta.url)))
const [sex, oc, kind, xs] = process.argv.slice(2)
const SUBS = Array.from({ length: 7 }, () => [])
for (let m = 0; m < 64; m++) { let k = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) k++; SUBS[k].push(m) }
const tolOf = (v) => (v < 10 ? 0.05 : 0.5)
const t = C[sex][oc][kind], xi = t.x.indexOf(+xs)
for (let ai = 0; ai < t.ages.length; ai++) {
  const rows = t.rows[ai].map(r => r[xi])
  const res = (p) => {
    const w = p.slice(1, 7), r = []
    for (let k = 0; k <= 6; k++) {
      const ps = SUBS[k].map(m => { let s = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) s += w[j]; return linkProb(p[0] + s + p[8] * s * s, p[7]) })
      const S = [ps.reduce((a, v) => a + v, 0) / ps.length, Math.min(...ps), Math.max(...ps)]
      rows[k].forEach((o, i) => r.push((S[i] - o) / tolOf(o)))
    }
    return r
  }
  let best = null
  for (const ld of [-3, -1.5, 0]) {
    const f = lm(res, [Math.log(Math.max(rows[0][0], 0.03) / 100), 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, ld, 0], { iters: 300 })
    if (!best || f.cost < best.cost) best = f
  }
  const w = best.p.slice(1, 7).sort((a, b) => a - b)
  console.log(t.ages[ai], 'k1 range', JSON.stringify(rows[1]), 'sorted w', w.map(v => v.toFixed(2)).join(' '), 'cost', best.cost.toFixed(1))
}
