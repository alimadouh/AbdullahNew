// Evaluate the surrogate (src/lib/fraxSurrogate.js) against
//  1. every FRAX Kuwait paper-chart cell (mean, low, high per number of risk factors),
//  2. the 19 known fraxplus.org outputs (docs/superpowers/specs/2026-10-15-frax-validation-cases.json),
//     next to the current method (src/lib/osteo.js),
//  3. published Kuwait FRAX outputs (Kanis et al. 2017, women BMI 30).
// Usage: node scripts/frax_surrogate/eval.mjs [--cases]
import fs from 'fs'; import path from 'path'; import os from 'os'; import { pathToFileURL, fileURLToPath } from 'url'
import { fraxProbability, pointQuantities, setProb, roundAsShown } from '../../src/lib/fraxSurrogate.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CH = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/fraxKuwait.json'), 'utf8'))
const CASES = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/superpowers/specs/2026-10-15-frax-validation-cases.json'), 'utf8'))

// current method, loaded with the chart JSON inlined (as scripts/osteo_cases.mjs does)
const osrc = fs.readFileSync(path.join(ROOT, 'src/lib/osteo.js'), 'utf8').replace("import CHARTS from '../data/fraxKuwait.json'", `const CHARTS = ${JSON.stringify(CH)}`)
const tmp = path.join(os.tmpdir(), `osteo_eval_${process.pid}.mjs`); fs.writeFileSync(tmp, osrc)
const O = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp)

const SUBS = Array.from({ length: 7 }, () => [])
for (let m = 0; m < 64; m++) { let k = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) k++; SUBS[k].push(m) }
const stat = (a) => ({ n: a.length, mean: a.reduce((s, v) => s + v, 0) / a.length, max: Math.max(...a) })
const f2 = (v) => v.toFixed(2)

// 1. chart cells
const cellErr = { all: [], byKind: {} }
for (const sex of ['female', 'male']) for (const oc of ['mof', 'hip']) for (const kind of ['bmi', 'bmd']) {
  const t = CH[sex][oc][kind], errs = []
  t.ages.forEach((age, ai) => t.x.forEach((x, xi) => {
    const q = pointQuantities(undefined, sex, oc, kind, age, x)
    for (let k = 0; k <= 6; k++) {
      const ps = SUBS[k].map(m => setProb(q, m))
      const S = [ps.reduce((a, v) => a + v, 0) / ps.length, Math.min(...ps), Math.max(...ps)]
      t.rows[ai][k][xi].forEach((o, i) => errs.push(Math.abs(roundAsShown(S[i]) - o)))
    }
  }))
  cellErr.byKind[`${sex} ${oc} ${kind}`] = stat(errs); cellErr.all.push(...errs)
}
console.log('Chart cells (abs error in points, model rounded as FRAX shows):')
for (const [k, s] of Object.entries(cellErr.byKind)) console.log(`  ${k.padEnd(18)} n ${s.n}  mean ${f2(s.mean)}  max ${f2(s.max)}`)
const sa = stat(cellErr.all); console.log(`  ALL                n ${sa.n}  mean ${f2(sa.mean)}  max ${f2(sa.max)}`)

// 2. known cases
const T_OF = { hologic: (b) => (b - 0.858) / 0.120, lunar: () => -1.71, norland: () => -1.96 } // FRAX-shown T for LUN/NOR
const rows = [], eS = { mof: [], hip: [] }, eO = { mof: [], hip: [] }
for (const c of CASES) {
  const bmi = c.w / (c.h / 100) ** 2
  const tScore = c.bmd == null ? null : c.bmdType ? T_OF[c.bmdType](c.bmd) : c.bmd
  const factors = { prior: !!c.prev, parentHip: !!c.parent, smoke: !!c.smoking, gc: !!c.gc, ra: !!c.ra, secondary: !!c.sec, alcohol: !!c.alcohol }
  const s = fraxProbability({ sex: c.sex === 'M' ? 'male' : 'female', age: c.age, bmi, tScore, factors })
  const of = { prevFracture: !!c.prev, parentHip: !!c.parent, smoking: !!c.smoking, glucocorticoids: !!c.gc, ra: !!c.ra, secondary: !!c.sec, alcohol: !!c.alcohol, fragility: 'none' }
  const o = O.assess({ age: c.age, sex: c.sex === 'M' ? 'male' : 'female', weight: c.w, height: c.h, factors: of, fnT: tScore ?? NaN }, tScore == null ? 'before' : 'after')
  const sm = roundAsShown(s.mof), sh = roundAsShown(s.hip), om = roundAsShown(o.mof), oh = roundAsShown(o.hip)
  eS.mof.push(Math.abs(sm - c.fmof)); eS.hip.push(Math.abs(sh - c.fhip)); eO.mof.push(Math.abs(om - c.fmof)); eO.hip.push(Math.abs(oh - c.fhip))
  rows.push(`| ${c.id} | ${c.age}${c.sex} BMI ${bmi.toFixed(1)}${tScore == null ? '' : ` T ${tScore.toFixed(2)}`} ${Object.keys(factors).filter(k => factors[k]).join('+') || 'none'} | ${c.fmof} / ${c.fhip} | ${sm} / ${sh} | ${om} / ${oh} |`)
}
if (process.argv.includes('--cases')) { console.log('\n| Case | Patient | FRAX MOF / hip | Surrogate B | osteo.js now |\n|---|---|---|---|---|'); console.log(rows.join('\n')) }
console.log('\n19 known FRAX cases (abs error in points, both rounded as FRAX shows):')
for (const [name, e] of [['surrogate B', eS], ['osteo.js now', eO]]) {
  const m = stat(e.mof), h = stat(e.hip)
  console.log(`  ${name.padEnd(13)} MOF mean ${f2(m.mean)} max ${f2(m.max)} | hip mean ${f2(h.mean)} max ${f2(h.max)}`)
}

// 3. published Kuwait outputs (women, BMI 30, MOF): Kanis et al. 2017 Table 1 and Table 3
const ages = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]
const PUB = [
  ['none', ages, [1.0, 1.4, 2.0, 2.5, 3.1, 3.8, 4.7, 6.2, 8.5, 12, 14], null, {}],
  ['T-2.5', ages, [2.6, 3.3, 4.3, 5.3, 6.0, 6.5, 7.1, 8.0, 9.5, 11, 13], -2.5, {}],
  ['prior', ages, [2.3, 3.2, 4.3, 5.4, 6.5, 7.6, 9.0, 11, 14, 19, 23], null, { prior: true }],
  ['T-1.5', ages, [1.6, 2.1, 2.8, 3.3, 3.7, 4.0, 4.4, 5.2, 6.4, 7.9, 9.2], -1.5, {}],
  ['T-2.5+parent', [65], [11.0], -2.5, { parentHip: true }],
  ['T-2.0', [65], [5.0], -2.0, {}],
  ['T-2.0+parent', [65], [9.1], -2.0, { parentHip: true }],
]
const pe = [], lines = []
for (const [name, as, vals, T, f] of PUB) {
  const got = as.map(a => roundAsShown(fraxProbability({ sex: 'female', age: a, bmi: 30, tScore: T, factors: f }).mof))
  got.forEach((g, i) => pe.push(Math.abs(g - vals[i])))
  lines.push(`  ${name.padEnd(13)} ${as.map((a, i) => `${a}:${vals[i]}/${got[i]}`).join(' ')}`)
}
console.log('\nPublished Kuwait MOF, women BMI 30 (published/surrogate):'); console.log(lines.join('\n'))
const ps = stat(pe); console.log(`  abs error mean ${f2(ps.mean)} max ${f2(ps.max)} (n ${ps.n})`)
