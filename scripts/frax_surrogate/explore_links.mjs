// Per-cell test of link functions: for each chart cell fit 6 unlabeled factor weights (+ link
// parameter) to rows 0-6 (mean, low, high) and report the residuals in rounding half-units.
import fs from 'fs'
import { lm } from './lm.mjs'
const C = JSON.parse(fs.readFileSync(new URL('../../src/data/fraxKuwait.json', import.meta.url)))
const SUBS = Array.from({ length: 7 }, () => [])
for (let m = 0; m < 64; m++) { let k = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) k++; SUBS[k].push(m) }
const tolOf = (v) => (v < 10 ? 0.05 : 0.5)
const LINKS = {
  log: { np: 0, g: (e) => 100 * Math.exp(e) },
  logit: { np: 0, g: (e) => 100 / (1 + Math.exp(-e)) },
  cloglog: { np: 0, g: (e) => 100 * (1 - Math.exp(-Math.exp(e))) },
  // competing risk, constant hazards over the period: h = exp(e), death d = exp(q)
  comp: { np: 1, g: (e, q) => { const h = Math.exp(e), d = Math.exp(q[0]); return 100 * h / (h + d) * (1 - Math.exp(-(h + d))) } },
  // competing risk where factors also scale death by a common power: d = exp(q0) * (h/h0)^q1
}
export function cellModel(link, eta0, w, q) {
  const L = LINKS[link], out = []
  const sums = new Float64Array(64)
  for (let m = 0; m < 64; m++) { let s = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) s += w[j]; sums[m] = s }
  for (let k = 0; k <= 6; k++) {
    const ps = SUBS[k].map(m => L.g(eta0 + sums[m], q))
    out.push([ps.reduce((a, v) => a + v, 0) / ps.length, Math.min(...ps), Math.max(...ps)])
  }
  return out
}
function fitCell(link, rows) {
  const L = LINKS[link]
  const r0 = rows[0][0]
  const res = (p) => {
    const eta0 = p[0], w = p.slice(1, 7), q = p.slice(7)
    const M = cellModel(link, eta0, w, q), r = []
    for (let k = 0; k <= 6; k++) {
      const obs = rows[k]
      r.push((M[k][0] - obs[0]) / tolOf(obs[0]))
      if (obs.length === 3) { r.push((M[k][1] - obs[1]) / tolOf(obs[1])); r.push((M[k][2] - obs[2]) / tolOf(obs[2])) }
    }
    return r
  }
  // start: eta0 from r0 under log link, weights spread
  const r0s = Math.max(r0, 0.03), ratio = Math.log(Math.max(rows[6][0], 0.1) / r0s) / 6
  const best = { cost: Infinity }
  for (const qs of L.np ? [[-4], [-2], [-1]] : [[]]) {
    const p0 = [Math.log(r0s / 100), ...[0.4, 0.6, 0.8, 1.0, 1.2, 1.4].map(f => f * ratio), ...qs]
    const f = lm(res, p0, { iters: 300 })
    if (f.cost < best.cost) Object.assign(best, f)
  }
  return best
}
const report = {}
for (const link of Object.keys(LINKS)) {
  let n = 0, sq = 0, maxAbs = 0, over1 = 0, cnt = 0
  for (const sex of ['female', 'male']) for (const oc of ['mof', 'hip']) for (const kind of ['bmi', 'bmd']) {
    const t = C[sex][oc][kind]
    for (let ai = 0; ai < t.ages.length; ai++) for (let xi = 0; xi < t.x.length; xi++) {
      const rows = t.rows[ai].map(r => r[xi])
      const f = fitCell(link, rows)
      for (const v of f.r) { sq += v * v; cnt++; maxAbs = Math.max(maxAbs, Math.abs(v)); if (Math.abs(v) > 1) over1++ }
      n++
    }
  }
  report[link] = { cells: n, rmsHalfUnits: Math.sqrt(sq / cnt).toFixed(3), maxHalfUnits: maxAbs.toFixed(2), fracOver1: (over1 / cnt).toFixed(3) }
  console.log(link, report[link])
}
