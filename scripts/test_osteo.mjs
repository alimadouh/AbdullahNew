// Tests for src/lib/osteo.js — run: node scripts/test_osteo.mjs
import fs from 'fs'
import path from 'path'
import os from 'os'
import { pathToFileURL } from 'url'
// Node needs an import attribute for JSON; load a temp copy of the module with the data inlined
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..')
const data = fs.readFileSync(path.join(root, 'src/data/fraxKuwait.json'), 'utf8')
const src = fs.readFileSync(path.join(root, 'src/lib/osteo.js'), 'utf8').replace("import CHARTS from '../data/fraxKuwait.json'", `const CHARTS = ${data}`)
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
console.log(fails ? `${fails} FAILURES` : 'ALL TESTS PASSED')
fs.unlinkSync(tmp)
process.exit(fails ? 1 : 0)
