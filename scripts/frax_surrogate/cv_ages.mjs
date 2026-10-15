// Cross-validation of the age interpolation: parameters fitted without some chart ages
// (DROP=55,75,85 OUT=file node fit.mjs) predict the left-out chart cells and known cases.
// Usage: node scripts/frax_surrogate/cv_ages.mjs <params.json> 55,75,85
import fs from 'fs'
import { outcomeProb, roundAsShown, setInterp, setAgeMode, fraxProbability } from '../../src/lib/fraxSurrogate.js'
import { knownCases } from './cases.mjs'
const C = JSON.parse(fs.readFileSync(new URL('../../src/data/fraxKuwait.json', import.meta.url)))
const P = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const drop = process.argv[3].split(',').map(Number)
const SUBS = Array.from({ length: 7 }, () => []); for (let m = 0; m < 64; m++) { let k = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) k++; SUBS[k].push(m) }
for (const ageMode of ['param', 'output']) for (const mode of ['cr', 'pchip', 'linear']) {
  setInterp(mode); setAgeMode(ageMode)
  const e = [], e01 = []
  for (const sex of ['female', 'male']) for (const oc of ['mof', 'hip']) for (const kind of ['bmi', 'bmd']) {
    const t = C[sex][oc][kind]
    for (const a of drop) {
      const ai = t.ages.indexOf(a)
      t.x.forEach((x, xi) => {
        for (let k = 0; k <= 6; k++) {
          const ps = SUBS[k].map(m => outcomeProb(P, sex, oc, kind, a, x, m))
          const S = [ps.reduce((s, v) => s + v, 0) / ps.length, Math.min(...ps), Math.max(...ps)]
          t.rows[ai][k][xi].forEach((o, i) => { const d = Math.abs(roundAsShown(S[i]) - o); e.push(d); if (k <= 2) e01.push(d) })
        }
      })
    }
  }
  const cs = knownCases().filter(c => drop.includes(c.age)).map(c => {
    const r = fraxProbability(c, P)
    return `${c.id} ${roundAsShown(r.mof)}/${roundAsShown(r.hip)} (FRAX ${c.mof}/${c.hip})`
  })
  const mean = (a) => (a.reduce((s, v) => s + v, 0) / a.length).toFixed(3)
  console.log(ageMode.padEnd(6), mode.padEnd(7), 'left-out cells: mean', mean(e), 'max', Math.max(...e), '| rows 0-2 mean', mean(e01), 'max', Math.max(...e01), '|', cs.join('; '))
}
