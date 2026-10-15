// Osteoporosis risk logic (Kuwait Osteoporosis Guidelines 2022 / KOPS slides + FRAX Kuwait paper charts).
// Pure functions only — the page (components/OsteoTool.jsx) shows the results.
import CHARTS from '../data/fraxKuwait.json'

// Kuwait fracture probability table: 10-year MOF (%) thresholds by age
const KW_TABLE = [
  // age, IT, LAT, UAT
  [40, 2.3, 1.0, 2.8], [43, 2.8, 1.3, 3.4], [45, 3.2, 1.4, 3.8], [47, 3.6, 1.7, 4.3],
  [50, 4.3, 2.0, 5.1], [53, 5.0, 2.3, 6.0], [55, 5.4, 2.5, 6.5], [57, 5.8, 2.8, 7.0],
  [60, 6.5, 3.1, 7.8], [63, 7.2, 3.5, 8.6], [65, 7.6, 3.8, 9.1], [67, 8.2, 4.1, 9.8],
  [70, 9.0, 4.7, 11], [73, 10, 5.5, 12], [75, 11, 6.2, 13], [77, 12, 7.0, 14],
  [80, 14, 8.5, 17], [83, 17, 10, 20], [85, 19, 12, 23], [87, 20, 13, 24], [90, 23, 14, 27],
]
export const THRESHOLD_ROWS = KW_TABLE.map(([age, it, lat, uat]) => ({ age, it, lat, uat }))

// FRAX enhancers slide: recent fracture correcting factors by age
const RECENT_FX = [
  // age, humerus, forearm
  [40, 4.7, 3.5], [50, 1.9, 1.5], [60, 1.5, 1.16], [70, 1.4, 1.1], [80, 1.25, 1.0], [90, 1.1, 0.82],
]

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Piecewise-linear lookup in a table sorted by its first column
function interpRow(rows, x) {
  const xs = rows.map(r => r[0])
  const v = clamp(x, xs[0], xs[xs.length - 1])
  let i = xs.findIndex((a, k) => k < xs.length - 1 && v >= a && v <= xs[k + 1])
  if (i < 0) i = xs.length - 2
  const t = (v - xs[i]) / (xs[i + 1] - xs[i] || 1)
  return rows[i].map((a, k) => (k === 0 ? v : lerp(a, rows[i + 1][k], t)))
}

export function thresholdsForAge(age) {
  const [, it, lat, uat] = interpRow(KW_TABLE, age)
  return { it, lat, uat }
}

export function recentFractureFactor(age, site) {
  const [, humerus, forearm] = interpRow(RECENT_FX, age)
  return site === 'humerus' ? humerus : site === 'forearm' ? forearm : 1
}

// Glucocorticoid dose (prednisolone equivalent, mg/day): low < 2.5 → ×0.8, medium → ×1, high ≥ 7.5 → ×1.15
export function glucocorticoidFactor(band) {
  return band === 'low' ? 0.8 : band === 'high' ? 1.15 : 1
}

// Lumbar spine lower than femoral neck: 1 SD → ×1.1, 2 SD or more → ×1.2
export function discordanceFactor(fnT, lsT) {
  if (!Number.isFinite(fnT) || !Number.isFinite(lsT)) return { sd: 0, factor: 1 }
  const sd = Math.round(fnT - lsT)
  if (sd <= 0) return { sd: 0, factor: 1 }
  return { sd, factor: sd >= 2 ? 1.2 : 1.1 }
}

// FRAX Kuwait paper chart value, blended between the printed ages and BMI / T-score columns.
// kind: 'bmi' (before DXA) or 'bmd' (femoral neck T-score; chart BMI fixed at 24).
export function chartProbability({ sex, outcome, kind, age, x, crfs }) {
  const t = CHARTS[sex]?.[outcome]?.[kind]
  if (!t || !Number.isFinite(age) || !Number.isFinite(x)) return null
  const n = clamp(Math.round(crfs), 0, 6)
  const a = clamp(age, t.ages[0], t.ages[t.ages.length - 1])
  const xv = clamp(x, t.x[0], t.x[t.x.length - 1])
  let ai = t.ages.findIndex((v, k) => k < t.ages.length - 1 && a >= v && a <= t.ages[k + 1]); if (ai < 0) ai = t.ages.length - 2
  let xi = t.x.findIndex((v, k) => k < t.x.length - 1 && xv >= v && xv <= t.x[k + 1]); if (xi < 0) xi = t.x.length - 2
  const ta = (a - t.ages[ai]) / (t.ages[ai + 1] - t.ages[ai])
  const tx = (xv - t.x[xi]) / (t.x[xi + 1] - t.x[xi])
  const cell = (r, c, k) => { const v = t.rows[r][n][c]; return v[k] ?? v[0] }
  const blend = (k) => lerp(lerp(cell(ai, xi, k), cell(ai, xi + 1, k), tx), lerp(cell(ai + 1, xi, k), cell(ai + 1, xi + 1, k), tx), ta)
  const hasRange = t.rows[ai][n][xi].length === 3
  return {
    value: blend(0),
    low: hasRange ? blend(1) : null,
    high: hasRange ? blend(2) : null,
    clampedAge: a !== age, clampedX: xv !== x, crfs: n,
  }
}

// ── Weighting the risk factors ─────────────────────────────────────────────────────────────
// The paper charts give, for each number of risk factors, a mean and a range: the low end is the
// weakest factors, the high end the strongest. Where a patient sits in that range is set by FRAX's
// own weight of each factor, taken from published FRAX outputs for single risk factors (UK model,
// BMI 25: Kanis et al., Osteoporos Int 2008;19:385–397, Tables 1–2). FRAX weighs risk factors the
// same way in every country model; only the base rates differ.
const SINGLE_CRF = {
  bmi: { // no BMD, ages 50 / 60 / 70 / 80
    ages: [50, 60, 70, 80],
    female: {
      mof: { none: [3.5, 6.0, 11, 17], parentHip: [6.9, 12, 17, 31], smoking: [3.6, 6.5, 12, 19], alcohol: [4.1, 7.3, 14, 22], ra: [4.7, 8.2, 15, 25], glucocorticoids: [5.6, 9.8, 18, 26], prevFracture: [7.4, 12, 20, 28] },
      hip: { none: [0.2, 0.7, 2.3, 7.0], parentHip: [0.3, 0.9, 5.0, 22], smoking: [0.3, 1.1, 3.4, 9.5], alcohol: [0.3, 1.1, 3.6, 10], ra: [0.4, 1.3, 4.1, 12], glucocorticoids: [0.5, 1.5, 4.8, 13], prevFracture: [0.8, 2.1, 4.9, 11] },
    },
    male: {
      mof: { none: [2.8, 3.9, 5.7, 7.2], parentHip: [5.5, 7.6, 9.1, 15], smoking: [2.8, 4.1, 5.9, 7.5], alcohol: [3.3, 4.7, 7.1, 9.5], ra: [3.7, 5.3, 8.0, 11], glucocorticoids: [4.4, 6.1, 8.5, 10], prevFracture: [5.8, 7.9, 11, 12] },
      hip: { none: [0.1, 0.4, 1.3, 3.4], parentHip: [0.2, 0.6, 2.8, 11], smoking: [0.2, 0.7, 1.8, 4.2], alcohol: [0.2, 0.7, 2.0, 5.1], ra: [0.2, 0.8, 2.3, 5.8], glucocorticoids: [0.3, 0.9, 2.4, 5.5], prevFracture: [0.5, 1.3, 2.7, 5.2] },
    },
  },
  bmd: { // with BMD: published for age 65, T-score −2.5 only
    female: {
      mof: { none: 12.4, parentHip: 22.1, smoking: 13.7, alcohol: 15.4, ra: 16.1, glucocorticoids: 19.7, prevFracture: 20.2 },
      hip: { none: 3.0, parentHip: 3.2, smoking: 5.1, alcohol: 4.6, ra: 4.3, glucocorticoids: 5.5, prevFracture: 5.0 },
    },
    male: {
      mof: { none: 9.8, parentHip: 16.5, smoking: 11.0, alcohol: 12.5, ra: 12.8, glucocorticoids: 15.0, prevFracture: 16.0 },
      hip: { none: 3.6, parentHip: 3.7, smoking: 5.6, alcohol: 5.4, ra: 5.0, glucocorticoids: 6.1, prevFracture: 5.9 },
    },
  },
}
// Factors each chart counts (secondary osteoporosis only without BMD, weighted like rheumatoid arthritis)
const CHART_FACTORS = {
  bmi: ['prevFracture', 'parentHip', 'smoking', 'glucocorticoids', 'ra', 'secondary', 'alcohol'],
  bmd: ['prevFracture', 'parentHip', 'smoking', 'glucocorticoids', 'ra', 'alcohol'],
}

// Log weight of each factor (ln of probability with the factor ÷ without) for this sex, outcome and age
export function factorWeights({ sex, outcome, kind, age }) {
  const w = {}
  if (kind === 'bmd') {
    // Published at age 65 only; other ages follow the age change of the no-BMD weights
    const t = SINGLE_CRF.bmd[sex][outcome]
    const now = factorWeights({ sex, outcome, kind: 'bmi', age }), at65 = factorWeights({ sex, outcome, kind: 'bmi', age: 65 })
    for (const k of Object.keys(t)) if (k !== 'none') w[k] = Math.log(t[k] / t.none) + (now[k] - at65[k])
  } else {
    const ages = SINGLE_CRF.bmi.ages, t = SINGLE_CRF.bmi[sex][outcome]
    const a = clamp(age, ages[0], ages[ages.length - 1])
    let i = ages.findIndex((v, j) => j < ages.length - 1 && a >= v && a <= ages[j + 1]); if (i < 0) i = ages.length - 2
    const f = (a - ages[i]) / (ages[i + 1] - ages[i])
    const at = (arr) => lerp(Math.log(arr[i]), Math.log(arr[i + 1]), f)
    for (const k of Object.keys(t)) if (k !== 'none') w[k] = at(t[k]) - at(t.none)
  }
  w.secondary = w.ra
  return w
}

// Chart value placed inside the chart range by the weight of the patient's own risk factors
export function weightedChartProbability({ sex, outcome, kind, age, x, factors }) {
  const present = CHART_FACTORS[kind].filter(k => factors[k])
  const base = chartProbability({ sex, outcome, kind, age, x, crfs: present.length })
  if (!base || base.low == null || base.crfs !== present.length) return { ...base, position: null }
  const w = factorWeights({ sex, outcome, kind, age })
  const all = CHART_FACTORS[kind].map(k => w[k]).sort((p, q) => p - q)
  const n = present.length
  const lo = all.slice(0, n).reduce((s, v) => s + v, 0)
  const hi = all.slice(-n).reduce((s, v) => s + v, 0)
  const sum = present.reduce((s, k) => s + w[k], 0)
  const position = hi > lo ? clamp((sum - lo) / (hi - lo), 0, 1) : 0.5
  const value = Math.exp(Math.log(base.low) + position * (Math.log(base.high) - Math.log(base.low)))
  return { ...base, value, chartMean: base.value, position }
}

// With BMD the paper charts assume BMI 24. Published FRAX outputs show the small BMI effect that
// remains once BMD is known (women aged 65, T-score −2.7; Kanis et al., WHO Technical Report 2007,
// Table 7.17). Used as a ratio to BMI 24 for MOF and hip.
const BMI_WITH_BMD = {
  bmi: [16, 18, 20, 22, 24, 26, 28, 30, 32],
  mof: [13.5, 14.2, 15.0, 15.7, 16.4, 16.7, 16.4, 16.0, 15.7],
  hip: [5.4, 5.5, 5.7, 5.8, 6.0, 6.0, 5.8, 5.6, 5.5],
}
export function bmiFactorWithBmd(outcome, bmiValue) {
  if (!Number.isFinite(bmiValue)) return 1
  const rows = BMI_WITH_BMD.bmi.map((b, i) => [b, BMI_WITH_BMD[outcome][i]])
  const [, v] = interpRow(rows, bmiValue)
  const [, ref] = interpRow(rows, 24)
  return v / ref
}

export const bmi = (kg, cm) => (kg > 0 && cm > 0 ? kg / Math.pow(cm / 100, 2) : NaN)

/**
 * Number of FRAX clinical risk factors.
 * Before DXA (BMI charts) every factor counts, including secondary osteoporosis.
 * With BMD charts secondary osteoporosis is not used, except rheumatoid arthritis.
 * T2DM and androgen deprivation therapy are entered "as rheumatoid arthritis" (enhancers slide).
 */
export function countCrfs(f, kind) {
  const ra = f.ra || f.t2dm || f.adt
  let n = [f.prevFracture, f.parentHip, f.smoking, f.glucocorticoids, ra, f.alcohol].filter(Boolean).length
  if (kind === 'bmi' && f.secondary) n += 1
  return n
}

/**
 * Full assessment for one stage.
 * stage 'before' = no BMD (BMI chart vs LAT/UAT); 'after' = femoral neck T-score (BMD chart vs IT/UAT).
 * override: official FRAX MOF % typed by the doctor (replaces the chart estimate before enhancers).
 */
export function assess(input, stage) {
  const { age, sex, weight, height, factors: f, fnT, lsT, overrideMof, overrideHip } = input
  const thr = thresholdsForAge(age)

  // Flowchart: history of fragility fracture (spine, hip or ≥ 2 other) → very high risk straight away
  if (f.fragility === 'spineHip' || f.fragility === 'twoOther') {
    return { stage, thr, category: 'veryHigh', reason: 'fragility', mof: null, hip: null, adjustments: [] }
  }

  const kind = stage === 'before' ? 'bmi' : 'bmd'
  const x = kind === 'bmi' ? bmi(weight, height) : fnT
  const crfs = countCrfs(f, kind)
  const fw = { ...f, ra: f.ra || f.t2dm || f.adt }
  const withBmi = (r, outcome) => (r && kind === 'bmd' ? { ...r, value: r.value * bmiFactorWithBmd(outcome, bmi(weight, height)) } : r)
  const chart = Number.isFinite(x) ? withBmi(weightedChartProbability({ sex, outcome: 'mof', kind, age, x, factors: fw }), 'mof') : null
  const hipChart = Number.isFinite(x) ? withBmi(weightedChartProbability({ sex, outcome: 'hip', kind, age, x, factors: fw }), 'hip') : null
  const official = Number.isFinite(overrideMof) && overrideMof > 0
  const base = official ? overrideMof : chart?.value
  if (!Number.isFinite(base)) return { stage, thr, category: null, crfs, chart, hipChart }

  // FRAX enhancers (MOF only)
  const adjustments = []
  if (f.glucocorticoids && f.gcDose && f.gcDose !== 'medium') {
    adjustments.push({ key: 'gc', label: `Glucocorticoids, ${f.gcDose} dose`, factor: glucocorticoidFactor(f.gcDose) })
  }
  if (f.recentSite === 'humerus' || f.recentSite === 'forearm') {
    adjustments.push({ key: 'recent', label: `Recent ${f.recentSite} fracture`, factor: recentFractureFactor(age, f.recentSite) })
  }
  if (stage === 'after') {
    const d = discordanceFactor(fnT, lsT)
    if (d.factor !== 1) adjustments.push({ key: 'ls', label: `Lumbar spine ${d.sd} SD lower than femoral neck`, factor: d.factor })
  }
  const mof = Math.min(100, adjustments.reduce((v, a) => v * a.factor, base))
  const hip = Number.isFinite(overrideHip) && overrideHip > 0 ? overrideHip : hipChart?.value ?? null

  let category
  if (stage === 'before') category = mof < thr.lat ? 'low' : mof > thr.uat ? 'veryHigh' : 'dxa'
  else category = mof < thr.it ? 'low' : mof > thr.uat ? 'veryHigh' : 'high'

  return { stage, thr, category, reason: 'frax', crfs, chart, hipChart, base, official, adjustments, mof, hip }
}

// Femoral neck BMD entry, as on the FRAX form. Machine values (g/cm²) are turned into a T-score;
// a machine is listed only once its conversion is confirmed from a primary source.
// FRAX reference: NHANES III femoral neck, white women aged 20–29 (also used for men):
// mean 0.858 g/cm², SD 0.120 (Hologic scale; Fujiwara et al. 2008 citing Looker et al. 1998).
// Checked against fraxplus.org: Hologic 0.700 g/cm² → T-score −1.32.
const hologicToT = (bmd) => (bmd - 0.858) / 0.120

// Femoral neck BMD choices (owner choice: only these two for now)
export const BMD_TYPES = [
  { value: 'none', label: 'No BMD available', unit: '' },
  { value: 'hologic', label: 'Hologic', unit: 'g/cm²', toT: hologicToT },
]

export function toTScore(type, value) {
  if (!Number.isFinite(value)) return NaN
  const t = BMD_TYPES.find(b => b.value === type)
  return t?.toT ? t.toT(value) : NaN
}
