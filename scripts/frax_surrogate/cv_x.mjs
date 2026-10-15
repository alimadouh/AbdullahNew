// Cross-validation of the BMI / T-score interpolation: parameters fitted without every other
// x column (DROPX=1 OUT=file node fit.mjs) predict the left-out columns.
// Usage: node scripts/frax_surrogate/cv_x.mjs <params.json>
import fs from 'fs'
import { outcomeProb, roundAsShown, setInterp } from '../../src/lib/fraxSurrogate.js'
const C = JSON.parse(fs.readFileSync(new URL('../../src/data/fraxKuwait.json', import.meta.url)))
const P = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const SUBS = Array.from({ length: 7 }, () => []); for (let m = 0; m < 64; m++) { let k = 0; for (let j = 0; j < 6; j++) if (m >> j & 1) k++; SUBS[k].push(m) }
for (const mode of ['cr', 'pchip', 'linear']) {
  setInterp(mode)
  const e = { bmi: [], bmd: [] }
  for (const sex of ['female', 'male']) for (const oc of ['mof', 'hip']) for (const kind of ['bmi', 'bmd']) {
    const t = C[sex][oc][kind]
    t.ages.forEach((a, ai) => t.x.forEach((x, xi) => {
      if (xi % 2 === 0) return
      for (let k = 0; k <= 6; k++) {
        const ps = SUBS[k].map(m => outcomeProb(P, sex, oc, kind, a, x, m))
        const S = [ps.reduce((s, v) => s + v, 0) / ps.length, Math.min(...ps), Math.max(...ps)]
        t.rows[ai][k][xi].forEach((o, i) => e[kind].push(Math.abs(roundAsShown(S[i]) - o)))
      }
    }))
  }
  const mean = (a) => (a.reduce((s, v) => s + v, 0) / a.length).toFixed(3)
  console.log(mode.padEnd(7), 'BMI columns: mean', mean(e.bmi), 'max', Math.max(...e.bmi), '| T columns: mean', mean(e.bmd), 'max', Math.max(...e.bmd))
}
