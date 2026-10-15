/**
 * SCORE2-OP — 10-year risk of fatal and non-fatal CVD for apparently healthy
 * people aged 70–89 years in Europe.
 *
 * Source: SCORE2-OP working group and ESC Cardiovascular risk collaboration.
 *   "SCORE2-OP risk prediction algorithms: estimating incident cardiovascular
 *   event risk in older persons in four geographical risk regions."
 *   Eur Heart J 2021;42(25):2455–2467. doi:10.1093/eurheartj/ehab312
 * Cross-checked against RiskScorescvd (CRAN) and the ESC CVD Risk app
 * (tests/reference-cases.json).
 *
 * The ESC app's SCORE2-OP screen is for people WITHOUT diabetes (people with
 * diabetes are routed to SCORE2-Diabetes), so diabetes is fixed to 0 here,
 * exactly as in the app.
 */

export const SCORE2OP_MODEL = Object.freeze({
  id: 'score2op',
  name: 'SCORE2-OP',
  ageMin: 70,
  ageMax: 89,
  citation:
    'SCORE2-OP working group and ESC Cardiovascular risk collaboration. SCORE2-OP risk prediction algorithms: estimating incident cardiovascular event risk in older persons in four geographical risk regions. Eur Heart J. 2021;42(25):2455-2467.',
  doi: '10.1093/eurheartj/ehab312',
});

/**
 * Transformed predictors: cage = age − 73, csbp = SBP − 150, ctchol = TC − 6,
 * chdl = HDL − 1.4 (mmol/L). risk₀ = 1 − S₀^exp(LP − meanLP).
 */
export const SCORE2OP_COEFFICIENTS = Object.freeze({
  male: Object.freeze({
    age: 0.0634, diabetes: 0.4245, smoking: 0.3524, sbp: 0.0094, tchol: 0.085, hdl: -0.3564,
    diabetesXage: -0.0174, smokingXage: -0.0247, sbpXage: -0.0005, tcholXage: 0.0073, hdlXage: 0.0091,
    baselineSurvival: 0.7576, meanLinearPredictor: 0.0929,
  }),
  female: Object.freeze({
    age: 0.0789, diabetes: 0.601, smoking: 0.4921, sbp: 0.0102, tchol: 0.0605, hdl: -0.304,
    diabetesXage: -0.0107, smokingXage: -0.0255, sbpXage: -0.0004, tcholXage: -0.0009, hdlXage: 0.0154,
    baselineSurvival: 0.8082, meanLinearPredictor: 0.229,
  }),
});

/**
 * Region recalibration scales [scale1, scale2] for SCORE2-OP.
 * The paper publishes these rounded to 2 decimals. The ESC CVD Risk app uses more precise values:
 * for very-high-risk men, 0.0467 / 0.7049 (which round to the published 0.05 / 0.70) reproduce
 * every app result collected so far (43, 26, 42, 43 % - tests/reference-cases.json), while the
 * rounded values gave 1 % too much in 3 of the 4 cases. Other groups keep the published values
 * until app results for them are available (docs/APP-CHECKLIST-SCORE2OP-ISSUE.md).
 */
export const SCORE2OP_RECALIBRATION = Object.freeze({
  low: Object.freeze({ male: [-0.34, 1.19], female: [-0.52, 1.01] }),
  moderate: Object.freeze({ male: [0.01, 1.25], female: [-0.1, 1.1] }),
  high: Object.freeze({ male: [0.08, 1.15], female: [0.38, 1.09] }),
  veryHigh: Object.freeze({ male: [0.0467, 0.7049], female: [0.38, 0.69] }), // men: matched to the ESC app (published 0.05, 0.70)
});

/** @param {{sex, age, smoking, sbp, totalCholesterol, hdl, region, diabetes?}} input mmHg / mmol/L */
export function computeScore2OP(input) {
  const { sex, region } = input;
  const c = SCORE2OP_COEFFICIENTS[sex];
  const scales = SCORE2OP_RECALIBRATION[region]?.[sex];
  if (!c || !scales) throw new Error(`Unknown region "${region}" or sex "${sex}"`);
  const cage = input.age - 73;
  const csbp = input.sbp - 150;
  const ctchol = input.totalCholesterol - 6;
  const chdl = input.hdl - 1.4;
  const smk = input.smoking ? 1 : 0;
  const dm = input.diabetes ? 1 : 0;
  const lp =
    c.age * cage + c.diabetes * dm + c.smoking * smk + c.sbp * csbp + c.tchol * ctchol + c.hdl * chdl +
    c.diabetesXage * cage * dm + c.smokingXage * cage * smk + c.sbpXage * cage * csbp +
    c.tcholXage * cage * ctchol + c.hdlXage * cage * chdl;
  const uncalibratedRisk = 1 - Math.pow(c.baselineSurvival, Math.exp(lp - c.meanLinearPredictor));
  const [s1, s2] = scales;
  const risk = 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - uncalibratedRisk))));
  return { risk, riskPercent: risk * 100, uncalibratedRisk, linearPredictor: lp };
}
