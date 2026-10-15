// Breakdown of the per-cell competing-risk fit: residuals (half-units) by chart, and which rows miss.
import fs from 'fs'
import { lm } from './lm.mjs'
const C = JSON.parse(fs.readFileSync(new URL('../../src/data/fraxKuwait.json', import.meta.url)))
const SUBS = Array.from({ length: 7 }, () => [])
for (let m = 0; m < 64; m++) { let k = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) k++; SUBS[k].push(m) }
const tolOf = (v) => (v < 10 ? 0.05 : 0.5)
const MODE = process.argv[2] || 'comp'
const useMean = process.argv[3] !== 'nomean'
const g = (e, q) => { const h = Math.exp(e), d = Math.exp(q[0]); return 100 * h / (h + d) * (1 - Math.exp(-(h + d))) }
function model(eta0, w, q) {
  const out = []
  for (let k = 0; k <= 6; k++) {
    const ps = SUBS[k].map(m => { let s = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) s += w[j]; return g(eta0 + s, q) })
    out.push([ps.reduce((a, v) => a + v, 0) / ps.length, Math.min(...ps), Math.max(...ps)])
  }
  return out
}
function fit(rows) {
  const r0s = Math.max(rows[0][0], 0.03), ratio = Math.log(Math.max(rows[6][0], 0.1) / r0s) / 6
  const res = (p) => {
    const M = model(p[0], p.slice(1, 7), p.slice(7)), r = []
    for (let k = 0; k <= 6; k++) {
      const o = rows[k]
      if (o.length === 1 || useMean) r.push((M[k][0] - o[0]) / tolOf(o[0]))
      else r.push(0)
      if (o.length === 3) { r.push((M[k][1] - o[1]) / tolOf(o[1])); r.push((M[k][2] - o[2]) / tolOf(o[2])) }
    }
    return r
  }
  let best = { cost: Infinity }
  for (const q of [-4, -2, -1, 0]) {
    const f = lm(res, [Math.log(r0s / 100), ...[0.4, 0.6, 0.8, 1, 1.2, 1.4].map(v => v * ratio), q], { iters: 300 })
    if (f.cost < best.cost) best = f
  }
  best.M = model(best.p[0], best.p.slice(1, 7), best.p.slice(7))
  return best
}
const worst = []
for (const sex of ['female', 'male']) for (const oc of ['mof', 'hip']) for (const kind of ['bmi', 'bmd']) {
  const t = C[sex][oc][kind]; let sq = 0, cnt = 0, mx = 0, meanErr = 0, mcnt = 0
  for (let ai = 0; ai < t.ages.length; ai++) for (let xi = 0; xi < t.x.length; xi++) {
    const rows = t.rows[ai].map(r => r[xi]); const f = fit(rows)
    for (const v of f.r) { sq += v * v; cnt++; mx = Math.max(mx, Math.abs(v)) }
    for (let k = 1; k <= 5; k++) { meanErr += Math.abs(f.M[k][0] - rows[k][0]) / tolOf(rows[k][0]); mcnt++ }
    worst.push({ id: `${sex} ${oc} ${kind} a${t.ages[ai]} x${t.x[xi]}`, cost: f.cost, rows, M: f.M.map(r => r.map(v => +v.toFixed(2))), d: Math.exp(f.p[7]).toFixed(3), w: f.p.slice(1, 7).map(v => +v.toFixed(3)).sort((a, b) => a - b) })
  }
  console.log(sex, oc, kind, 'rms', Math.sqrt(sq / cnt).toFixed(2), 'max', mx.toFixed(1), 'mean-row abs err (half-units)', (meanErr / mcnt).toFixed(2))
}
worst.sort((a, b) => b.cost - a.cost)
for (const w of worst.slice(0, 6)) console.log(w.id, 'cost', w.cost.toFixed(1), 'd', w.d, 'w', JSON.stringify(w.w), '\n obs', JSON.stringify(w.rows), '\n fit', JSON.stringify(w.M))
