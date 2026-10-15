// Known FRAX Kuwait outputs used as extra fitting points (and for checking):
//  - the 19 fraxplus.org outputs in docs/superpowers/specs/2026-10-15-frax-validation-cases.json
//  - published Kuwait outputs, women BMI 30, MOF (Kanis et al. 2017, Tables 1 and 3)
import fs from 'fs'
import { factorMask } from '../../src/lib/fraxSurrogate.js'
const RAW = JSON.parse(fs.readFileSync(new URL('../../docs/superpowers/specs/2026-10-15-frax-validation-cases.json', import.meta.url), 'utf8'))
// T-scores FRAX showed for the machine-value cases (2026-10-15 validation)
const T_OF = { hologic: (b) => (b - 0.858) / 0.120, lunar: () => -1.71, norland: () => -1.96 }
export function knownCases() {
  const out = []
  for (const c of RAW) {
    const bmi = c.w / (c.h / 100) ** 2
    const tScore = c.bmd == null ? null : c.bmdType ? T_OF[c.bmdType](c.bmd) : c.bmd
    const factors = { prior: !!c.prev, parentHip: !!c.parent, smoke: !!c.smoking, gc: !!c.gc, ra: !!c.ra, secondary: !!c.sec, alcohol: !!c.alcohol }
    out.push({ id: c.id, sex: c.sex === 'M' ? 'male' : 'female', age: c.age, bmi, tScore, factors, mof: c.fmof, hip: c.fhip })
  }
  return out
}
export function publishedCases() {
  const out = [], ages = [50, 55, 60, 65, 70, 75, 80, 85, 90]
  const prior = [4.3, 5.4, 6.5, 7.6, 9.0, 11, 14, 19, 23]
  ages.forEach((a, i) => out.push({ id: `S5-prior-${a}`, sex: 'female', age: a, bmi: 30, tScore: null, factors: { prior: true }, mof: prior[i], hip: null }))
  out.push({ id: 'S5-T-2.5+parent', sex: 'female', age: 65, bmi: 30, tScore: -2.5, factors: { parentHip: true }, mof: 11.0, hip: null })
  out.push({ id: 'S5-T-2.0+parent', sex: 'female', age: 65, bmi: 30, tScore: -2.0, factors: { parentHip: true }, mof: 9.1, hip: null })
  return out
}
export function fitCases() {
  return [...knownCases(), ...publishedCases()].map(c => {
    const kind = Number.isFinite(c.tScore) ? 'bmd' : 'bmi'
    return { ...c, kind, x: kind === 'bmd' ? c.tScore : c.bmi, mask: factorMask(c.factors, kind) }
  })
}
