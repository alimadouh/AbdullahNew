/**
 * SCORE2 — 10-year risk of fatal and non-fatal cardiovascular disease
 * (myocardial infarction, stroke, CV death) for apparently healthy people
 * aged 40–69 years in Europe.
 *
 * Source (do not edit numbers without re-checking the source):
 *   SCORE2 working group and ESC Cardiovascular risk collaboration.
 *   "SCORE2 risk prediction algorithms: new models to estimate 10-year risk of
 *   cardiovascular disease in Europe." Eur Heart J 2021;42(25):2439–2454.
 *   doi:10.1093/eurheartj/ehab309 — Supplementary Methods (model coefficients,
 *   baseline survival, region recalibration scales).
 *   Adopted by: 2021 ESC Guidelines on CVD prevention, Eur Heart J
 *   2021;42(34):3227–3337, doi:10.1093/eurheartj/ehab484.
 *
 * Cross-checked against the open-source R package RiskScorescvd (CRAN) and
 * against the published worked example and the ESC CVD Risk app
 * (see tests/ and docs/METHODOLOGY.md).
 *
 * Pure functions only — no DOM, no I/O. Safe to use in browser or Node.
 */

export const SCORE2_MODEL = Object.freeze({
  id: 'score2',
  name: 'SCORE2',
  population: 'Apparently healthy people in Europe without established ASCVD, diabetes, CKD or familial hypercholesterolaemia',
  ageMin: 40,
  ageMax: 69,
  horizonYears: 10,
  outcome: 'Fatal and non-fatal cardiovascular events (myocardial infarction, stroke, cardiovascular death)',
  citation:
    'SCORE2 working group and ESC Cardiovascular risk collaboration. SCORE2 risk prediction algorithms: new models to estimate 10-year risk of cardiovascular disease in Europe. Eur Heart J. 2021;42(25):2439-2454.',
  doi: '10.1093/eurheartj/ehab309',
});

/**
 * Sex-specific log sub-distribution hazard ratios.
 * Transformed predictors:
 *   cage  = (age − 60) / 5
 *   csbp  = (SBP − 120) / 20          (mmHg)
 *   ctchol = totalCholesterol − 6     (mmol/L)
 *   chdl  = (HDL − 1.3) / 0.5         (mmol/L)
 *   smoking = 1 current smoker, 0 otherwise
 */
export const SCORE2_COEFFICIENTS = Object.freeze({
  male: Object.freeze({
    age: 0.3742,
    smoking: 0.6012,
    sbp: 0.2777,
    tchol: 0.1458,
    hdl: -0.2698,
    smokingXage: -0.0755,
    sbpXage: -0.0255,
    tcholXage: -0.0281,
    hdlXage: 0.0426,
    baselineSurvival: 0.9605,
  }),
  female: Object.freeze({
    age: 0.4648,
    smoking: 0.7744,
    sbp: 0.3131,
    tchol: 0.1002,
    hdl: -0.2606,
    smokingXage: -0.1088,
    sbpXage: -0.0277,
    tcholXage: -0.0226,
    hdlXage: 0.0613,
    baselineSurvival: 0.9776,
  }),
});

/**
 * Region recalibration scales: risk = 1 − exp(−exp(scale1 + scale2 · ln(−ln(1 − uncalibratedRisk))))
 */
export const SCORE2_RECALIBRATION = Object.freeze({
  low: Object.freeze({ male: [-0.5699, 0.7476], female: [-0.738, 0.7019] }),
  moderate: Object.freeze({ male: [-0.1565, 0.8009], female: [-0.3143, 0.7701] }),
  high: Object.freeze({ male: [0.3207, 0.936], female: [0.571, 0.9369] }),
  veryHigh: Object.freeze({ male: [0.5836, 0.8294], female: [0.9412, 0.8329] }),
});

/** Linear predictor (sum of coefficient × transformed predictor). Inputs in mmHg and mmol/L. */
export function score2LinearPredictor({ sex, age, smoking, sbp, totalCholesterol, hdl }) {
  const c = SCORE2_COEFFICIENTS[sex];
  if (!c) throw new Error(`Unknown sex "${sex}"`);
  const cage = (age - 60) / 5;
  const csbp = (sbp - 120) / 20;
  const ctchol = totalCholesterol - 6;
  const chdl = (hdl - 1.3) / 0.5;
  const smk = smoking ? 1 : 0;
  return (
    c.age * cage +
    c.smoking * smk +
    c.sbp * csbp +
    c.tchol * ctchol +
    c.hdl * chdl +
    c.smokingXage * cage * smk +
    c.sbpXage * cage * csbp +
    c.tcholXage * cage * ctchol +
    c.hdlXage * cage * chdl
  );
}

/**
 * Compute SCORE2 for already-validated inputs (use validateScore2Input first).
 * @param {{sex:'male'|'female', age:number, smoking:boolean, sbp:number,
 *          totalCholesterol:number, hdl:number, region:'low'|'moderate'|'high'|'veryHigh'}} input
 *        sbp in mmHg, cholesterol values in mmol/L.
 * @returns {{risk:number, riskPercent:number, uncalibratedRisk:number, linearPredictor:number}}
 *          risk is a fraction 0–1; riskPercent is unrounded percent.
 */
export function computeScore2(input) {
  const { sex, region } = input;
  const scales = SCORE2_RECALIBRATION[region]?.[sex];
  if (!scales) throw new Error(`Unknown region "${region}" or sex "${sex}"`);
  const lp = score2LinearPredictor(input);
  const s0 = SCORE2_COEFFICIENTS[sex].baselineSurvival;
  const uncalibratedRisk = 1 - Math.pow(s0, Math.exp(lp));
  const [scale1, scale2] = scales;
  const risk = 1 - Math.exp(-Math.exp(scale1 + scale2 * Math.log(-Math.log(1 - uncalibratedRisk))));
  return { risk, riskPercent: risk * 100, uncalibratedRisk, linearPredictor: lp };
}
