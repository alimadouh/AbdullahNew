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
  const chart = Number.isFinite(x) ? chartProbability({ sex, outcome: 'mof', kind, age, x, crfs }) : null
  const hipChart = Number.isFinite(x) ? chartProbability({ sex, outcome: 'hip', kind, age, x, crfs }) : null
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

// Kuwait screening checklist: > 60 mandatory; > 50 needs 1 major + 2 minor risk factors
export function screening(age, majors, minors) {
  if (age > 60) return { required: true, why: 'Age above 60: screening is mandatory' }
  if (age > 50 && majors >= 1 && minors >= 2) return { required: true, why: 'Age above 50 with 1 major and 2 minor risk factors' }
  if (age > 50) return { required: false, why: 'Age above 50: screening needs 1 major and 2 minor risk factors' }
  return { required: false, why: 'Screening rules start above age 50' }
}

// Indications for vertebral imaging (VFA or lateral spine X-ray), Kuwait 2022
export function vfaReasons({ age, sex, lowTraumaFracture, heightLossHistoric, heightLossProspective, glucocorticoids }) {
  const out = []
  if ((sex === 'female' && age >= 70) || (sex === 'male' && age >= 80)) out.push(sex === 'female' ? 'Woman aged 70 or older' : 'Man aged 80 or older')
  if (age > 50) {
    if (lowTraumaFracture) out.push('Low trauma fracture')
    if (heightLossHistoric) out.push('Historical height loss of 4 cm or more')
    if (heightLossProspective) out.push('Prospective height loss of 2 cm or more')
    if (glucocorticoids) out.push('Recent or ongoing long term glucocorticoid treatment')
  }
  return out
}
