// Fit the FRAX Kuwait surrogate (approach B) to the official paper charts and write the parameters
// into src/lib/fraxSurrogate.js (between the PARAMS markers).
// Usage: node scripts/frax_surrogate/fit.mjs        single thread; env ITERS, VERBOSE
//
// Steps for each sex and kind (no-BMD charts first, their weights feed the BMD priors):
//  1. hip chart, free fit: per age, 6 unnamed factor weights (quadratic in x), death term and
//     curvature, base η0 per cell. The model is symmetric in the factors, so the charts fix the
//     spread of weights but not which factor is which.
//  2. naming: dynamic programming over the chart ages picks, at each age, the permutation that is
//     closest to the published single-factor weights (priors.mjs) and changes least from the
//     previous age.
//  3. MOF chart: free fit without the hip mixture, named the same way, then converted to "other
//     fracture" weights and refitted with the hip mixture (pairs each factor with its hip weight).
import fs from 'fs'
import os from 'os'
try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL) } catch {}   // keep the PC responsive
import { lmJ } from './lm.mjs'
import { linkProb, features, setProb, polyW, polyLd, polyGam, cr1, bmiFactorWithBmd } from '../../src/lib/fraxSurrogate.js'
import { fitCases } from './cases.mjs'
const CASE_W = +(process.env.CASEW ?? 2)
const CASES = CASE_W > 0 ? fitCases().filter(c => c.id !== process.env.EXCLUDE) : []   // EXCLUDE=id for leave-one-out
import { priorWeights, ukBmd65 } from './priors.mjs'

const ROOT = new URL('../../', import.meta.url)
const LIB = new URL('src/lib/fraxSurrogate.js', ROOT)
const C = JSON.parse(fs.readFileSync(new URL('src/data/fraxKuwait.json', ROOT)))
// cross-validation: DROP="55,75,85" leaves those chart ages out; OUT=file writes the parameters there
const DROP = (process.env.DROP || '').split(',').filter(Boolean).map(Number)
if (DROP.length) for (const sex of ['female', 'male']) for (const oc of ['mof', 'hip']) for (const kind of ['bmi', 'bmd']) {
  const t = C[sex][oc][kind], keep = t.ages.map((a, i) => (DROP.includes(a) ? -1 : i)).filter(i => i >= 0)
  C[sex][oc][kind] = { ...t, ages: keep.map(i => t.ages[i]), rows: keep.map(i => t.rows[i]) }
}
// DROPX=1 leaves out every other BMI column (20, 30, 40) and T-score column (−3.5 … 0.5)
if (process.env.DROPX) for (const sex of ['female', 'male']) for (const oc of ['mof', 'hip']) for (const kind of ['bmi', 'bmd']) {
  const t = C[sex][oc][kind], keep = t.x.map((x, i) => (i % 2 === 1 ? -1 : i)).filter(i => i >= 0)
  C[sex][oc][kind] = { ...t, x: keep.map(i => t.x[i]), rows: t.rows.map(A => A.map(R => keep.map(i => R[i]))) }
}
const ITERS = +(process.env.ITERS || 300)
const VERBOSE = !!process.env.VERBOSE

const SUBS = Array.from({ length: 7 }, () => [])
for (let m = 0; m < 64; m++) { let k = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) k++; SUBS[k].push(m) }
const tolOf = (v) => (v < 10 ? 0.05 : 0.5)
// most patients have 0–2 risk factors: those chart rows count more
const ROW_WEIGHT = (process.env.ROWW || '5,1.6,1.3,1,0.8,0.7,0.7').split(',').map(Number)
const NLD = 3, NGAM = 2, NW = 3, NPI = 2, PER_AGE = NLD + NGAM + 6 * NW + NPI
const I_PI = NLD + NGAM + 6 * NW
const sigmoid = (z) => 1 / (1 + Math.exp(-z))
const PERMS = (() => { const out = []; const rec = (a, rest) => { if (!rest.length) out.push(a); rest.forEach((v, i) => rec([...a, v], rest.filter((_, k) => k !== i))) }; rec([], [0, 1, 2, 3, 4, 5]); return out })()
const vPriorOf = (kind) => features(kind, 70, kind === 'bmi' ? 25 : -2.5).v

function invertLink(p, ld) {
  let lo = -20, hi = 5
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (linkProb(m, ld) < p) lo = m; else hi = m }
  return (lo + hi) / 2
}

export function cellSummary(q) {
  const out = []
  for (let k = 0; k <= 6; k++) {
    let s = 0, mn = Infinity, mx = -Infinity
    for (const m of SUBS[k]) { const v = setProb(q, m); s += v; if (v < mn) mn = v; if (v > mx) mx = v }
    out.push([s / SUBS[k].length, mn, mx])
  }
  return out
}

// opts: { hipFit (mixture with these hip weights), prior: [{w, sd}] per age | null, init: {eta0, A} | null,
//         priorAges: per-age prior evaluated at vPrior }
function fitChart(sex, outcome, kind, opts = {}) {
  const t = C[sex][outcome][kind]
  const nA = t.ages.length, nX = t.x.length, nC = nA * nX
  const iAge = (ai) => nC + ai * PER_AGE
  const nP = nC + nA * PER_AGE
  const vPrior = vPriorOf(kind)
  const hipFit = opts.hipFit || null
  const cells = []
  for (let ai = 0; ai < nA; ai++) for (let xi = 0; xi < nX; xi++) {
    const age = t.ages[ai], x = t.x[xi], { v } = features(kind, age, x)
    const cell = { ai, xi, age, x, v, rows: t.rows[ai].map(r => r[xi]) }
    if (hipFit) cell.wh = hipFit.A[ai].W.map(c => polyW(c, v))
    cells.push(cell)
  }
  const unpackAge = (p, ai) => {
    const o = iAge(ai)
    return { ld: p.slice(o, o + NLD), gam: p.slice(o + NLD, o + NLD + NGAM), W: Array.from({ length: 6 }, (_, j) => p.slice(o + NLD + NGAM + NW * j, o + NLD + NGAM + NW * (j + 1))), pi: p.slice(o + I_PI, o + I_PI + NPI) }
  }
  const quant = (p, cell, eta0) => {
    const A = unpackAge(p, cell.ai)
    const ld = polyLd(A.ld, cell.v), gam = polyGam(A.gam, cell.v), w = A.W.map(c => polyW(c, cell.v))
    if (!hipFit) return { eta0, ld, gam, wh: w, wo: null, pi: 0 }
    return { eta0, ld, gam, wh: cell.wh, wo: w, pi: sigmoid(A.pi[0] + A.pi[1] * cell.v) }
  }
  const cellRes = (p, c) => {
    const cell = cells[c], S = cellSummary(quant(p, cell, p[c])), r = []
    for (let k = 0; k <= 6; k++) {
      const o = cell.rows[k]
      const wk = ROW_WEIGHT[k]
      r.push(wk * (S[k][0] - o[0]) / tolOf(o[0]))
      if (o.length === 3) { r.push(wk * (S[k][1] - o[1]) / tolOf(o[1])); r.push(wk * (S[k][2] - o[2]) / tolOf(o[2])) }
    }
    return r
  }
  const softRes = (p) => {
    const r = []
    for (let ai = 0; ai < nA; ai++) {
      const A = unpackAge(p, ai), o = iAge(ai)
      if (opts.prior) for (let j = 0; j < 6; j++) r.push((polyW(A.W[j], vPrior) - opts.prior[ai].w[j]) / opts.prior[ai].sd)
      for (let j = 0; j < 6; j++) { r.push(A.W[j][1] / 1.5); r.push(A.W[j][2] / 1.0) }   // keep x-shape of weights tame
      r.push(p[o + NLD] / 0.3); r.push(p[o + NLD + 1] / 0.3)
      r.push((p[o + I_PI] + 3) / (hipFit ? 3 : 0.01)); r.push(p[o + I_PI + 1] / (hipFit ? 2 : 0.01))
    }
    return r
  }
  const blockLen = cells.map(c => c.rows.reduce((a, o) => a + o.length, 0))
  const offs = []; { let o = 0; for (const b of blockLen) { offs.push(o); o += b } }
  const nCellRes = offs[nC - 1] + blockLen[nC - 1]
  // known FRAX outputs at chart ages for this sex and kind
  const cs = CASES.filter(k => k.sex === sex && k.kind === kind && k[outcome] != null && t.ages.includes(k.age)).map(k => ({ ...k, ai: t.ages.indexOf(k.age), v: features(kind, k.age, k.x).v }))
  const caseRes = (p, k) => {
    const c = cs[k], ai = c.ai, A = unpackAge(p, ai)
    const eta0 = cr1(t.x, t.x.map((_, xi) => p[ai * nX + xi]), c.x)
    const w = A.W.map(cc => polyW(cc, c.v)), ld = polyLd(A.ld, c.v), gam = polyGam(A.gam, c.v)
    const q = hipFit ? { eta0, ld, gam, wh: hipFit.A[ai].W.map(cc => polyW(cc, c.v)), wo: w, pi: sigmoid(A.pi[0] + A.pi[1] * c.v) } : { eta0, ld, gam, wh: w, wo: null, pi: 0 }
    const val = setProb(q, c.mask) * (kind === 'bmd' ? bmiFactorWithBmd(outcome, c.bmi) : 1)
    return CASE_W * (val - c[outcome]) / tolOf(c[outcome])
  }
  const nSoft = softRes(new Array(nP).fill(0)).length
  const resFn = (p) => { const r = []; for (let c = 0; c < nC; c++) r.push(...cellRes(p, c)); r.push(...softRes(p)); for (let k = 0; k < cs.length; k++) r.push(caseRes(p, k)); return r }
  const ageCells = t.ages.map((_, ai) => cells.map((c, i) => (c.ai === ai ? i : -1)).filter(i => i >= 0))
  const jacFn = (p, r) => {
    const m = r.length, J = Array.from({ length: m }, () => new Float64Array(nP))
    for (let j = 0; j < nP; j++) {
      const h = 1e-5 * Math.max(1, Math.abs(p[j])), q = p.slice(); q[j] += h
      const affected = j < nC ? [j] : ageCells[Math.floor((j - nC) / PER_AGE)]
      for (const c of affected) {
        const rc = cellRes(q, c)
        for (let i = 0; i < rc.length; i++) J[offs[c] + i][j] = (rc[i] - r[offs[c] + i]) / h
      }
      const aj = j < nC ? Math.floor(j / nX) : Math.floor((j - nC) / PER_AGE)
      cs.forEach((c, k) => { if (c.ai === aj) { const i = nCellRes + nSoft + k; J[i][j] = (caseRes(q, k) - r[i]) / h } })
      if (j >= nC) {
        const sq = softRes(q)
        for (let i = 0; i < sq.length; i++) { const d = (sq[i] - r[nCellRes + i]) / h; if (d) J[nCellRes + i][j] = d }
      }
    }
    return J
  }
  const p0 = new Array(nP).fill(0)
  if (opts.init) {
    for (let ai = 0; ai < nA; ai++) {
      const o = iAge(ai), A = opts.init.A[ai]
      A.ld.forEach((v, k) => (p0[o + k] = v)); A.gam.forEach((v, k) => (p0[o + NLD + k] = v))
      A.W.forEach((c, j) => c.forEach((v, k) => (p0[o + NLD + NGAM + NW * j + k] = v)))
      p0[o + I_PI] = A.pi ? A.pi[0] : -3; p0[o + I_PI + 1] = A.pi ? A.pi[1] : 0
      for (let xi = 0; xi < nX; xi++) p0[ai * nX + xi] = opts.init.eta0[ai][xi]
    }
  } else {
    for (let ai = 0; ai < nA; ai++) {
      const o = iAge(ai); p0[o] = -1.5; p0[o + I_PI] = -3
      for (let j = 0; j < 6; j++) p0[o + NLD + NGAM + NW * j] = opts.start[ai][j]
    }
    for (let c = 0; c < nC; c++) p0[c] = invertLink(Math.max(cells[c].rows[0][0], 0.02), -1.5)
  }
  const lo = new Array(nP).fill(-Infinity), hi = new Array(nP).fill(Infinity)
  for (let ai = 0; ai < nA; ai++) { const o = iAge(ai); lo[o] = -8; hi[o] = 3; for (let k = 0; k < NGAM; k++) { lo[o + NLD + k] = -0.5; hi[o + NLD + k] = 0.5 } }
  const t0 = Date.now()
  const f = lmJ(resFn, jacFn, p0, { iters: ITERS, lo, hi })
  const p = f.p
  const res = { ages: t.ages, x: t.x, eta0: t.ages.map((_, ai) => t.x.map((_, xi) => p[ai * nX + xi])), A: t.ages.map((_, ai) => unpackAge(p, ai)) }
  const cr = f.r.slice(0, nCellRes)
  const rms = Math.sqrt(cr.reduce((a, v) => a + v * v, 0) / cr.length), mx = Math.max(...cr.map(Math.abs))
  console.log(`${sex} ${outcome} ${kind} ${opts.tag || ''}: cell rms ${rms.toFixed(2)} half-units, max ${mx.toFixed(1)}, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
  res.stats = { rms, mx }
  return res
}

// Dynamic programming over ages: name the unnamed weights of `fit` after the factors.
// Cost = Σ (w − prior)² / sdP² + Σ over x of (w(age) − w(previous age))² / sdC².
function nameFactors(fit, kind, prior, sdC = 0.25) {
  const nA = fit.A.length, vP = vPriorOf(kind), vs = [-1, -0.5, 0, 0.5, 1]
  const val = fit.A.map(A => A.W.map(c => vs.map(v => polyW(c, v))))
  const valP = fit.A.map(A => A.W.map(c => polyW(c, vP)))
  const unary = (ai, perm) => perm.reduce((s, src, j) => s + ((valP[ai][src] - prior[ai].w[j]) / prior[ai].sd) ** 2, 0)
  const pair = (ai, pa, pb) => { let s = 0; for (let j = 0; j < 6; j++) { const a = val[ai - 1][pa[j]], b = val[ai][pb[j]]; for (let k = 0; k < vs.length; k++) s += ((a[k] - b[k]) / sdC) ** 2 / vs.length } return s }
  let cost = PERMS.map(pm => unary(0, pm)), back = []
  for (let ai = 1; ai < nA; ai++) {
    const nc = new Array(PERMS.length), bk = new Array(PERMS.length)
    for (let b = 0; b < PERMS.length; b++) {
      let best = Infinity, arg = -1
      for (let a = 0; a < PERMS.length; a++) { const c = cost[a] + pair(ai, PERMS[a], PERMS[b]); if (c < best) { best = c; arg = a } }
      nc[b] = best + unary(ai, PERMS[b]); bk[b] = arg
    }
    cost = nc; back.push(bk)
  }
  let b = cost.indexOf(Math.min(...cost)); const chosen = [b]
  for (let ai = nA - 1; ai > 0; ai--) { b = back[ai - 1][b]; chosen.unshift(b) }
  const A = fit.A.map((A0, ai) => ({ ...A0, W: PERMS[chosen[ai]].map(src => A0.W[src]) }))
  return { ...fit, A, perms: chosen.map(i => PERMS[i]) }
}

// MOF "other fracture" weights from no-mixture MOF weights w and hip weights b at the cell's π
function toOther(mofFit, hipFit, kind) {
  const t = { ages: mofFit.ages, x: mofFit.x }
  const A = mofFit.A.map((A0, ai) => {
    const W = A0.W.map((c, j) => {
      const xs = [], ys = []
      t.x.forEach((x, xi) => {
        const v = features(kind, t.ages[ai], x).v
        const pi = Math.min(0.95, Math.exp(hipFit.eta0[ai][xi] - mofFit.eta0[ai][xi]))
        const w = polyW(c, v), b = polyW(hipFit.A[ai].W[j], v)
        xs.push(v); ys.push(Math.log(Math.max((Math.exp(w) - pi * Math.exp(b)) / (1 - pi), 0.4)))
      })
      return quadFit(xs, ys)
    })
    return { ...A0, W }
  })
  return { ...mofFit, A }
}
function quadFit(xs, ys) {
  const M = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
  xs.forEach((x, i) => { const f = [1, x, x * x]; for (let a = 0; a < 3; a++) { for (let b = 0; b < 3; b++) M[a][b] += f[a] * f[b]; M[a][3] += f[a] * ys[i] } })
  for (let c = 0; c < 3; c++) for (let i = c + 1; i < 3; i++) { const f = M[i][c] / M[c][c]; for (let k = c; k < 4; k++) M[i][k] -= f * M[c][k] }
  const x = [0, 0, 0]; for (let i = 2; i >= 0; i--) { let s = M[i][3]; for (let k = i + 1; k < 3; k++) s -= M[i][k] * x[k]; x[i] = s / M[i][i] }
  return x
}

function priorsFor(sex, outcome, kind, ages, bmiFit) {
  return ages.map(a => {
    if (kind === 'bmi') return { sd: a <= 80 ? 0.3 : 0.5, w: priorWeights(sex, outcome, 'bmi', Math.min(a, 80)) }
    // with BMD: UK age-65 BMD weights + the age trend of the fitted (named) no-BMD weights at BMI 25
    const vB = vPriorOf('bmi'), ai = bmiFit.ages.indexOf(a), a65 = bmiFit.ages.indexOf(65)
    const now = bmiFit.A[ai].W.map(c => polyW(c, vB)), at65 = bmiFit.A[a65].W.map(c => polyW(c, vB))
    const b65 = ukBmd65(sex, outcome)
    return { sd: 0.35, w: b65.map((v, j) => v + now[j] - at65[j]) }
  })
}
const show = (name, fit, kind, prior) => {
  if (!VERBOSE) return
  const vP = vPriorOf(kind)
  fit.A.forEach((A, ai) => console.log(`   ${name} ${fit.ages[ai]}: ${A.W.map(c => polyW(c, vP).toFixed(2)).join(' ')}   prior ${prior[ai].w.map(v => v.toFixed(2)).join(' ')}`))
}

const out = { female: { hip: {}, mof: {} }, male: { hip: {}, mof: {} } }
const nomixBmi = {}
for (const sex of ['female', 'male']) for (const kind of ['bmi', 'bmd']) {
  if (process.env.ONLYSEX && process.env.ONLYSEX !== sex) continue
  const ages = C[sex].hip[kind].ages
  const bmiHip = out[sex].hip.bmi, bmiMof = nomixBmi[sex]
  const pH = priorsFor(sex, 'hip', kind, ages, bmiHip), pM = priorsFor(sex, 'mof', kind, ages, bmiMof)
  // hip
  const hipFree = fitChart(sex, 'hip', kind, { start: pH.map(p => p.w), tag: 'free' })
  const hip = nameFactors(hipFree, kind, pH)
  show('hip', hip, kind, pH)
  // MOF: free fit without mixture, name, convert, refit with mixture
  const mofFree = nameFactors(fitChart(sex, 'mof', kind, { start: pM.map(p => p.w), tag: 'free (no mixture)' }), kind, pM)
  show('mof-nomix', mofFree, kind, pM)
  if (kind === 'bmi') nomixBmi[sex] = mofFree
  const init = mofFree
  const vP = vPriorOf(kind)
  const keep = init.A.map(A => ({ sd: +(process.env.KEEPSD || 0.5), w: A.W.map(c => polyW(c, vP)) }))
  const mof = fitChart(sex, 'mof', kind, { hipFit: hip, init, prior: keep, tag: 'mixture' })
  show('mof-other', mof, kind, keep)
  // keep whichever MOF form fits the chart better
  const useMix = mof.stats.rms <= mofFree.stats.rms * 1.02 || process.env.MIX === '1'
  const chosen = useMix && process.env.MIX !== '0' ? { ...mof, mix: true } : { ...mofFree, mix: false }
  console.log(`  -> ${sex} mof ${kind}: ${chosen.mix ? 'hip mixture' : 'no mixture'}`)
  for (const f of [hip, chosen]) { delete f.stats; delete f.perms }
  if (!chosen.mix) chosen.A.forEach(A => delete A.pi)
  hip.A.forEach(A => delete A.pi)
  out[sex].hip[kind] = hip; out[sex].mof[kind] = chosen
}
const ser = JSON.stringify(out, (k, v) => (typeof v === 'number' ? +v.toFixed(5) : v))
if (process.env.OUT) { fs.writeFileSync(process.env.OUT, ser); console.log('wrote', process.env.OUT); process.exit(0) }
const src = fs.readFileSync(LIB, 'utf8').replace(/\/\*PARAMS-BEGIN\*\/[\s\S]*?\/\*PARAMS-END\*\//, `/*PARAMS-BEGIN*/${ser}/*PARAMS-END*/`)
fs.writeFileSync(LIB, src)
console.log('wrote parameters into src/lib/fraxSurrogate.js,', ser.length, 'chars')
