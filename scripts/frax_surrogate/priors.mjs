// Prior log weights of each factor (ln of probability with the factor ÷ without), from published
// FRAX single-factor outputs. Used only to tell the fit which factor is which (the charts give the
// spread of weights, not their names) and as a weak pull.
// UK, BMI 25, no BMD (Kanis et al., Osteoporos Int 2008;19:385, Table 2), ages 50/60/70/80.
// Sweden prototype, women, BMI 24, no BMD (WHO Technical Report 2007, Table 7.15).
// UK, age 65, BMI 25, no BMD and T-score −2.5 (Kanis et al. 2008, Table 1).
// Order of factors: prior, parentHip, smoke, gc, ra, alcohol (as in src/lib/fraxSurrogate.js).
const AGES = [50, 60, 70, 80]
const UK = {
  female: {
    mof: { none: [3.5, 6.0, 11, 17], prior: [7.4, 12, 20, 28], parentHip: [6.9, 12, 17, 31], smoke: [3.6, 6.5, 12, 19], gc: [5.6, 9.8, 18, 26], ra: [4.7, 8.2, 15, 25], alcohol: [4.1, 7.3, 14, 22] },
    hip: { none: [0.2, 0.7, 2.3, 7.0], prior: [0.8, 2.1, 4.9, 11], parentHip: [0.3, 0.9, 5.0, 22], smoke: [0.3, 1.1, 3.4, 9.5], gc: [0.5, 1.5, 4.8, 13], ra: [0.4, 1.3, 4.1, 12], alcohol: [0.3, 1.1, 3.6, 10] },
  },
  male: {
    mof: { none: [2.8, 3.9, 5.7, 7.2], prior: [5.8, 7.9, 11, 12], parentHip: [5.5, 7.6, 9.1, 15], smoke: [2.8, 4.1, 5.9, 7.5], gc: [4.4, 6.1, 8.5, 10], ra: [3.7, 5.3, 8.0, 11], alcohol: [3.3, 4.7, 7.1, 9.5] },
    hip: { none: [0.1, 0.4, 1.3, 3.4], prior: [0.5, 1.3, 2.7, 5.2], parentHip: [0.2, 0.6, 2.8, 11], smoke: [0.2, 0.7, 1.8, 4.2], gc: [0.3, 0.9, 2.4, 5.5], ra: [0.2, 0.8, 2.3, 5.8], alcohol: [0.2, 0.7, 2.0, 5.1] },
  },
}
const SWE = {
  mof: { none: [4.2, 7.7, 14.4, 25.9], prior: [9.1, 15.6, 26.2, 39.1], parentHip: [8.2, 14.4, 23.0, 46.8], smoke: [4.5, 8.4, 16.4, 29.1], gc: [6.9, 12.7, 23.5, 38.2], ra: [5.7, 10.6, 20.3, 36.3], alcohol: [5.1, 9.4, 18.1, 32.8] },
  hip: { none: [0.4, 1.3, 4.7, 13.1], prior: [1.6, 3.8, 9.8, 19.6], parentHip: [0.5, 1.7, 9.9, 37.8], smoke: [0.6, 2.0, 6.9, 17.8], gc: [0.9, 2.8, 9.6, 23.4], ra: [0.7, 2.3, 8.2, 21.8], alcohol: [0.6, 2.0, 7.1, 19.2] },
}
// age 65: [none, prior, parentHip, smoke, gc, ra, alcohol]
const UK65 = {
  bmi: { male: { mof: [4.9, 9.6, 9.3, 5.1, 7.5, 6.8, 6.0], hip: [0.8, 1.9, 1.0, 1.1, 1.5, 1.4, 1.2] }, female: { mof: [8.6, 16.4, 16.0, 9.2, 13.7, 11.7, 10.4], hip: [1.3, 3.2, 1.7, 1.9, 2.7, 2.3, 2.0] } },
  bmd: { male: { mof: [9.8, 16.0, 16.5, 11.0, 15.0, 12.8, 12.5], hip: [3.6, 5.9, 3.7, 5.6, 6.1, 5.0, 5.4] }, female: { mof: [12.4, 20.2, 22.1, 13.7, 19.7, 16.1, 15.4], hip: [3.0, 5.0, 3.2, 5.1, 5.5, 4.3, 4.6] } },
}
const KEYS = ['prior', 'parentHip', 'smoke', 'gc', 'ra', 'alcohol']

function noBmdAt(sex, outcome, ai) {
  const uk = UK[sex][outcome], sw = SWE[outcome]
  return KEYS.map(k => {
    const lu = Math.log(uk[k][ai] / uk.none[ai]), ls = Math.log(sw[k][ai] / sw.none[ai])
    // UK hip values at 50/60 are printed with one decimal on 0.1–0.5 %: use the Swedish ratios there
    if (outcome === 'hip' && ai < 2) return ls
    return sex === 'female' || outcome === 'hip' ? (lu + ls) / 2 : lu
  })
}
function noBmd(sex, outcome, age) {
  const a = Math.min(80, Math.max(50, age))
  let i = 0; while (i < 2 && a > AGES[i + 1]) i++
  const t = (a - AGES[i]) / (AGES[i + 1] - AGES[i])
  const w0 = noBmdAt(sex, outcome, i), w1 = noBmdAt(sex, outcome, i + 1)
  return w0.map((v, j) => v + (w1[j] - v) * t)
}
export function priorWeights(sex, outcome, kind, age) {
  const now = noBmd(sex, outcome, age)
  if (kind === 'bmi') return now
  const at65 = noBmd(sex, outcome, 65), b = UK65.bmd[sex][outcome]
  return KEYS.map((_, j) => Math.log(b[j + 1] / b[0]) + (now[j] - at65[j]))
}
// UK age-65 weights with BMD (T −2.5), Kanis et al. 2008 Table 1
export function ukBmd65(sex, outcome) {
  const b = UK65.bmd[sex][outcome]
  return KEYS.map((_, j) => Math.log(b[j + 1] / b[0]))
}
