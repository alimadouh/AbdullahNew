// Runs the 16 practice cases from the KOPS osteoporosis PDF through src/lib/osteo.js
import fs from 'fs'; import path from 'path'; import os from 'os'; import { pathToFileURL } from 'url'
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..')
const data = fs.readFileSync(path.join(root, 'src/data/fraxKuwait.json'), 'utf8')
const src = fs.readFileSync(path.join(root, 'src/lib/osteo.js'), 'utf8').replace("import CHARTS from '../data/fraxKuwait.json'", `const CHARTS = ${data}`)
const tmp = path.join(os.tmpdir(), `osteo_cases_${process.pid}.mjs`); fs.writeFileSync(tmp, src)
const O = await import(pathToFileURL(tmp).href)
const F = (o) => ({ fragility: 'none', ...o })
const cases = [
  [1, 54, 'female', 67, 152, F({ glucocorticoids: true, gcDose: 'medium', secondary: true }), -1.2, -2.2, 'Pred 5 mg; 2° OP bullous pemphigoid'],
  [2, 73, 'female', 80, 163, F({ ra: true, t2dm: true }), -1.6, -2.5, 'RA + T2DM'],
  [3, 65, 'female', 87, 166, F({ prevFracture: true, recentSite: 'humerus' }), -1.8, -2.0, 'Humerus # 1 yr ago; inhaled steroids (not counted)'],
  [4, 65, 'female', 77, 155, F({ glucocorticoids: true, gcDose: 'low', t2dm: true, secondary: true }), -1.7, -2.1, 'Pred 2 mg; T2DM; Crohn'],
  [5, 67, 'male', 83, 175, F({ smoking: true }), -1.8, -3.8, 'Finger # (not fragility); smoker'],
  [6, 60, 'female', 67, 165, F({ parentHip: true, t2dm: true }), null, null, 'Parent hip; T2DM; no DXA'],
  [7, 75, 'female', 70, 160, F({ t2dm: true }), -2.1, -2.5, 'T2DM'],
  [8, 60, 'female', 80, 152, F({ ra: true }), -2.0, -2.4, 'RA'],
  [9, 77, 'male', 98, 167, F({ smoking: true }), null, null, 'Smoker; no DXA'],
  [10, 60, 'female', 75, 154, F({ secondary: true }), null, null, '2° OP LSG; no DXA'],
  [11, 60, 'female', 75, 154, F({ secondary: true }), -2.4, -3.5, '2° OP LSG'],
  [12, 55, 'female', 45, 160, F({ parentHip: true }), -2.3, -2.1, 'Mother hip #'],
  [13, 75, 'female', 65, 147, F({ prevFracture: true, t2dm: true }), -2.0, -2.2, 'Wrist # 8 yrs ago; T2DM'],
  [14, 75, 'female', 65, 147, F({ prevFracture: true, recentSite: 'forearm', t2dm: true }), -2.0, -2.2, 'Wrist # 8 months ago; T2DM'],
  [15, 80, 'female', 70, 156, F({}), -2.4, -3.2, 'No CRFs'],
  [16, 65, 'female', 74, 159, F({ prevFracture: true }), -1.7, -1.9, 'Toe # (not fragility) + tibia #'],
]
const label = { low: 'Low', dxa: 'Do DXA', high: 'High → antiresorptive', veryHigh: 'Very high → anabolic' }
const f1 = (v) => (v == null ? '—' : v.toFixed(1))
const lines = ['| # | Patient | Before DXA: MOF % (CRFs) → decision | After DXA: MOF % → decision | Enhancers |', '|---|---|---|---|---|']
for (const [n, age, sex, w, h, factors, fnT, lsT, note] of cases) {
  const b = O.assess({ age, sex, weight: w, height: h, factors }, 'before')
  const a = fnT == null ? null : O.assess({ age, sex, weight: w, height: h, factors, fnT, lsT }, 'after')
  const thrB = `LAT ${f1(b.thr.lat)} / UAT ${f1(b.thr.uat)}`
  const enh = a ? a.adjustments.map(x => `${x.label} ×${x.factor.toFixed(2)}`).join('; ') || '—' : (b.adjustments || []).map(x => `${x.label} ×${x.factor.toFixed(2)}`).join('; ') || '—'
  lines.push(`| ${n} | ${age}${sex[0].toUpperCase()}, BMI ${f1(O.bmi(w, h))}, ${note} | ${f1(b.mof)} (${b.crfs}) vs ${thrB} → **${label[b.category]}** | ${a ? `${f1(a.mof)} (FN ${fnT}) vs IT ${f1(a.thr.it)} / UAT ${f1(a.thr.uat)} → **${label[a.category]}**` : 'no DXA'} | ${enh} |`)
}
console.log(lines.join('\n'))
fs.unlinkSync(tmp)
