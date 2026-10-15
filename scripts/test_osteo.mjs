// Tests for src/lib/osteo.js — run: node scripts/test_osteo.mjs
import fs from 'fs'
import path from 'path'
import os from 'os'
import { pathToFileURL } from 'url'
// Node needs an import attribute for JSON; load a temp copy of the module with the data inlined
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..')
const data = fs.readFileSync(path.join(root, 'src/data/fraxKuwait.json'), 'utf8')
const src = fs.readFileSync(path.join(root, 'src/lib/osteo.js'), 'utf8').replace("import CHARTS from '../data/fraxKuwait.json'", `const CHARTS = ${data}`)
  .replace("from './fraxSurrogate.js'", `from '${pathToFileURL(path.join(root, 'src/lib/fraxSurrogate.js')).href}'`)
const tmp = path.join(os.tmpdir(), `osteo_test_${process.pid}.mjs`); fs.writeFileSync(tmp, src)
const O = await import(pathToFileURL(tmp).href)
const C = JSON.parse(data)
let fails = 0
const eq = (name, got, want, tol = 1e-9) => { const ok = Math.abs(got - want) <= tol; if (!ok) { fails++; console.log('FAIL', name, 'got', got, 'want', want) } }

// 1. Every chart grid cell is returned exactly
let cells = 0
for (const sex of ['female', 'male']) for (const outcome of ['mof', 'hip']) for (const kind of ['bmi', 'bmd']) {
  const t = C[sex][outcome][kind]
  t.ages.forEach((age, ai) => t.x.forEach((x, xi) => { for (let n = 0; n <= 6; n++) {
    const r = O.chartProbability({ sex, outcome, kind, age, x, crfs: n }); const want = t.rows[ai][n][xi]
    eq(`${sex} ${outcome} ${kind} a${age} x${x} n${n}`, r.value, want[0]); if (want[1] !== undefined) { eq('low', r.low, want[1]); eq('high', r.high, want[2]) }
    cells++ } }))
}
console.log('chart cells checked:', cells)
// 2. Blending sits between neighbours: women MOF BMI, age 62.5, BMI 27.5, 2 CRFs
{ const r = O.chartProbability({ sex: 'female', outcome: 'mof', kind: 'bmi', age: 62.5, x: 27.5, crfs: 2 })
  const t = C.female.mof.bmi, a = [t.ages.indexOf(60), t.ages.indexOf(65)], x = [t.x.indexOf(25), t.x.indexOf(30)]
  const avg = (a.flatMap(i => x.map(j => t.rows[i][2][j][0]))).reduce((s, v) => s + v, 0) / 4
  eq('bilinear midpoint', r.value, avg, 1e-9) }
// 3. Kuwait threshold rows exact
for (const row of O.THRESHOLD_ROWS) { const t = O.thresholdsForAge(row.age); eq(`IT ${row.age}`, t.it, row.it); eq(`LAT ${row.age}`, t.lat, row.lat); eq(`UAT ${row.age}`, t.uat, row.uat) }
console.log('threshold rows checked:', O.THRESHOLD_ROWS.length)
// 4. Enhancer factors from the slide
eq('GC low', O.glucocorticoidFactor('low'), 0.8); eq('GC high', O.glucocorticoidFactor('high'), 1.15); eq('GC med', O.glucocorticoidFactor('medium'), 1)
for (const [age, h, f] of [[40, 4.7, 3.5], [50, 1.9, 1.5], [60, 1.5, 1.16], [70, 1.4, 1.1], [80, 1.25, 1.0], [90, 1.1, 0.82]]) { eq(`hum ${age}`, O.recentFractureFactor(age, 'humerus'), h); eq(`fa ${age}`, O.recentFractureFactor(age, 'forearm'), f) }
eq('disc 1', O.discordanceFactor(-1.2, -2.2).factor, 1.1); eq('disc 2', O.discordanceFactor(-1.8, -3.8).factor, 1.2); eq('disc 0', O.discordanceFactor(-2, -1).factor, 1)
// 5. Category boundaries (before: LAT/UAT, after: IT/UAT) with an official override
const base = { age: 65, sex: 'female', weight: 70, height: 165, factors: {} }
const cat = (stage, mof) => O.assess({ ...base, fnT: -1, overrideMof: mof }, stage).category
const want = [['before', 3.7, 'low'], ['before', 3.8, 'dxa'], ['before', 9.1, 'dxa'], ['before', 9.2, 'veryHigh'], ['after', 7.5, 'low'], ['after', 7.6, 'high'], ['after', 9.1, 'high'], ['after', 9.2, 'veryHigh']]
for (const [s, m, w] of want) if (cat(s, m) !== w) { fails++; console.log('FAIL boundary', s, m, cat(s, m), w) }
// Fragility fracture branch
if (O.assess({ ...base, factors: { fragility: 'spineHip' } }, 'before').category !== 'veryHigh') { fails++; console.log('FAIL fragility') }
// CRF counting: secondary OP only in BMI charts; T2DM counts as RA once
eq('crf bmi', O.countCrfs({ secondary: true, smoking: true }, 'bmi'), 2); eq('crf bmd', O.countCrfs({ secondary: true, smoking: true }, 'bmd'), 1)
eq('t2dm as RA', O.countCrfs({ ra: true, t2dm: true }, 'bmd'), 1)
// 6. BMD machines → T-score (worked examples from the research notes)
// Hologic 0.700 → −1.32 (same as fraxplus.org); 0.558 → −2.50
for (const [type, bmd, want] of [['hologic', 0.700, -1.32], ['hologic', 0.558, -2.50]]) eq(`${type} ${bmd}`, O.toTScore(type, bmd), want, 0.005)
if (O.BMD_TYPES.map(b => b.label).join('|') !== 'No BMD available|Hologic') { fails++; console.log('FAIL BMD options', O.BMD_TYPES.map(b => b.label)) }
// 7. Risk-factor weighting vs published FRAX Kuwait values (Johansson et al. 2017 IT = woman, BMI 30, prior fracture)
const P = (sex, age, bmiV, factors, outcome = 'mof') => O.weightedChartProbability({ sex, outcome, kind: 'bmi', age, x: bmiV, factors }).value
for (const r of O.THRESHOLD_ROWS.filter(r => r.age >= 50 && r.age % 5 === 0)) eq(`Kuwait IT ${r.age}`, P('female', r.age, 30, { prevFracture: true }), r.it, 1.0)
eq('KW 65F prior fx MOF', P('female', 65, 25, { prevFracture: true }), 8.9, 0.05); eq('KW 65F prior fx hip', P('female', 65, 25, { prevFracture: true }, 'hip'), 2.6, 0.05)
eq('KW 65M prior fx MOF', P('male', 65, 25, { prevFracture: true }), 5.6, 0.05); eq('KW 65M prior fx hip', P('male', 65, 25, { prevFracture: true }, 'hip'), 1.7, 0.05)
// 8. Against fraxplus.org Kuwait results (2026-10-15, docs/superpowers/specs/2026-10-15-frax-validation.md): MOF within 1.5 points
const frax = [
  [60, 'female', 80, 152, { ra: true }, null, 3.8], [60, 'female', 80, 152, { ra: true }, -2.0, 5.8], [65, 'female', 70, 165, {}, null, 4.3], [65, 'female', 70, 165, {}, -2.4, 6.5],
  [75, 'female', 65, 160, { prevFracture: true, parentHip: true }, null, 23], [75, 'female', 65, 160, { prevFracture: true, parentHip: true }, -2.5, 26],
  [55, 'male', 85, 175, { smoking: true }, null, 2.1], [55, 'male', 85, 175, { smoking: true }, -1.0, 2.8], [70, 'male', 75, 170, { glucocorticoids: true, ra: true }, null, 7.2],
  [70, 'male', 75, 170, { glucocorticoids: true, ra: true }, -1.5, 7.8], [80, 'female', 55, 155, { prevFracture: true, secondary: true }, null, 25], [80, 'female', 55, 155, { prevFracture: true, secondary: true }, -3.0, 17],
  [50, 'female', 60, 160, { alcohol: true }, null, 2.8], [50, 'female', 60, 160, { alcohol: true }, -1.8, 3.8], [85, 'female', 60, 155, { parentHip: true }, null, 26],
  [90, 'female', 50, 150, { prevFracture: true, parentHip: true, smoking: true, glucocorticoids: true, ra: true }, -2.8, 53], [65, 'female', 70, 165, {}, (0.700 - 0.858) / 0.120, 3.9],
]
for (const [age, sex, w, h, f, t, want] of frax) {
  const r = O.assess({ age, sex, weight: w, height: h, factors: { fragility: 'none', ...f }, fnT: t ?? NaN }, t == null ? 'before' : 'after')
  eq(`fraxplus ${age}${sex[0]} ${JSON.stringify(f)} T${t ?? '-'}`, r.mof, want, 1.5)
}
// 9. Safety checks over a wide grid (from the 2026-10-16 audit)
{
  const keys = ['prevFracture', 'parentHip', 'smoking', 'glucocorticoids', 'ra', 'secondary', 'alcohol']
  const order = { low: 0, dxa: 1, high: 1, veryHigh: 2 }
  let checked = 0, monoFail = 0, hipFail = 0, nanFail = 0
  for (const sex of ['female', 'male']) for (const age of [50, 57, 65, 72, 81, 89, 90]) for (const h of [150, 165, 180]) for (const w of [45, 70, 110])
    for (const t of [null, -3.5, -2.5, -1.2, 0.5]) for (let mask = 0; mask < 128; mask++) {
      const f = { fragility: 'none' }; keys.forEach((k, i) => { f[k] = !!(mask & (1 << i)) })
      const stage = t == null ? 'before' : 'after'
      const r = O.assess({ age, sex, weight: w, height: h, factors: f, fnT: t ?? NaN }, stage)
      checked++
      if (!Number.isFinite(r.mof) || !Number.isFinite(r.hip)) { nanFail++; continue }
      if (r.hip > r.mof + 1e-9) hipFail++
      for (let i = 0; i < keys.length; i++) if (!(mask & (1 << i))) {
        const g = { ...f, [keys[i]]: true }
        const r2 = O.assess({ age, sex, weight: w, height: h, factors: g, fnT: t ?? NaN }, stage)
        if (r2.mof < r.mof - 1e-9 || r2.hip < r.hip - 1e-9 || order[r2.category] < order[r.category]) monoFail++
      }
    }
  console.log('grid cases checked:', checked)
  if (monoFail) { fails++; console.log('FAIL adding a risk factor lowered the result in', monoFail, 'cases') }
  if (hipFail) { fails++; console.log('FAIL hip above MOF in', hipFail, 'cases') }
  if (nanFail) { fails++; console.log('FAIL NaN result in', nanFail, 'cases') }
}
// RA and secondary osteoporosis count once (same weight; secondary only without BMD and only if RA = no)
eq('RA+secondary = RA (no BMD)', O.assess({ age: 70, sex: 'male', weight: 75, height: 170, factors: { ra: true, secondary: true } }, 'before').mof, O.assess({ age: 70, sex: 'male', weight: 75, height: 170, factors: { ra: true } }, 'before').mof)
eq('secondary alone = RA alone (no BMD)', O.assess({ age: 70, sex: 'male', weight: 75, height: 170, factors: { secondary: true } }, 'before').mof, O.assess({ age: 70, sex: 'male', weight: 75, height: 170, factors: { ra: true } }, 'before').mof)
eq('secondary ignored with BMD', O.assess({ age: 70, sex: 'male', weight: 75, height: 170, factors: { secondary: true }, fnT: -2 }, 'after').mof, O.assess({ age: 70, sex: 'male', weight: 75, height: 170, factors: {}, fnT: -2 }, 'after').mof)
// The category is decided on the number shown (e.g. 14.89 shows "15" = IT 15 at age 81 → not Low)
if (O.roundAsShown(14.89) !== 15 || O.roundAsShown(7.56) !== 7.6) { fails++; console.log('FAIL roundAsShown') }
console.log(fails ? `${fails} FAILURES` : 'ALL TESTS PASSED')
fs.unlinkSync(tmp)
process.exit(fails ? 1 : 0)
