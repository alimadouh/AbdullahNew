/**
 * SCORE2-Diabetes — 10-year risk of fatal and non-fatal CVD in people with
 * type 2 diabetes aged 40–69 years without established ASCVD, in Europe.
 *
 * Source: SCORE2-Diabetes Working Group and ESC Cardiovascular Risk
 *   Collaboration. "SCORE2-Diabetes: 10-year cardiovascular risk estimation in
 *   type 2 diabetes in Europe." Eur Heart J 2023;44(28):2544–2556.
 *   doi:10.1093/eurheartj/ehad260
 * Adopted by: 2023 ESC Guidelines for the management of cardiovascular disease
 *   in patients with diabetes. doi:10.1093/eurheartj/ehad192
 * Cross-checked against RiskScorescvd (CRAN) and the ESC CVD Risk app:
 *   baseline survival 0.9605 (men) / 0.9776 (women) reproduces the app exactly
 *   (30.7 % test case, tests/reference-cases.json).
 */
import { SCORE2_RECALIBRATION } from './score2.js';

export const SCORE2DIABETES_MODEL = Object.freeze({
  id: 'score2diabetes',
  name: 'SCORE2-Diabetes',
  ageMin: 40,
  ageMax: 69,
  citation:
    'SCORE2-Diabetes Working Group and the ESC Cardiovascular Risk Collaboration. SCORE2-Diabetes: 10-year cardiovascular risk estimation in type 2 diabetes in Europe. Eur Heart J. 2023;44(28):2544-2556.',
  doi: '10.1093/eurheartj/ehad260',
});

/**
 * Transformed predictors:
 *   cage = (age − 60)/5, csbp = (SBP − 120)/20, ctchol = TC − 6, chdl = (HDL − 1.3)/0.5,
 *   cdiagAge = (age at diabetes diagnosis − 50)/5,
 *   chba1c = (HbA1c[mmol/mol] − 31)/9.34, cegfr = (ln eGFR − 4.5)/0.15
 */
export const SCORE2DIABETES_COEFFICIENTS = Object.freeze({
  male: Object.freeze({
    age: 0.5368, smoking: 0.4774, sbp: 0.1322, diabetes: 0.6457, tchol: 0.1102, hdl: -0.1087,
    smokingXage: -0.0672, sbpXage: -0.0268, diabetesXage: -0.0983, tcholXage: -0.0181, hdlXage: 0.0095,
    diagAge: -0.0998, hba1c: 0.0955, egfr: -0.0591, egfr2: 0.0058, hba1cXage: -0.0134, egfrXage: 0.0115,
    baselineSurvival: 0.9605,
  }),
  female: Object.freeze({
    age: 0.6624, smoking: 0.6139, sbp: 0.1421, diabetes: 0.8096, tchol: 0.1127, hdl: -0.1568,
    smokingXage: -0.1122, sbpXage: -0.0167, diabetesXage: -0.1272, tcholXage: -0.02, hdlXage: 0.0186,
    diagAge: -0.118, hba1c: 0.1173, egfr: -0.064, egfr2: 0.0062, hba1cXage: -0.0196, egfrXage: 0.0169,
    baselineSurvival: 0.9776,
  }),
});

/**
 * @param {{sex, age, smoking, sbp, totalCholesterol, hdl, region,
 *          diabetesAge:number, hba1c:number (mmol/mol), egfr:number}} input
 */
export function computeScore2Diabetes(input) {
  const { sex, region } = input;
  const c = SCORE2DIABETES_COEFFICIENTS[sex];
  const scales = SCORE2_RECALIBRATION[region]?.[sex];
  if (!c || !scales) throw new Error(`Unknown region "${region}" or sex "${sex}"`);
  const cage = (input.age - 60) / 5;
  const csbp = (input.sbp - 120) / 20;
  const ctchol = input.totalCholesterol - 6;
  const chdl = (input.hdl - 1.3) / 0.5;
  const smk = input.smoking ? 1 : 0;
  const dm = 1;
  const cdiag = (input.diabetesAge - 50) / 5;
  const chba1c = (input.hba1c - 31) / 9.34;
  const cegfr = (Math.log(input.egfr) - 4.5) / 0.15;
  const lp =
    c.age * cage + c.smoking * smk + c.sbp * csbp + c.diabetes * dm + c.tchol * ctchol + c.hdl * chdl +
    c.smokingXage * cage * smk + c.sbpXage * cage * csbp + c.diabetesXage * cage * dm +
    c.tcholXage * cage * ctchol + c.hdlXage * cage * chdl +
    c.diagAge * dm * cdiag + c.hba1c * chba1c + c.egfr * cegfr + c.egfr2 * cegfr * cegfr +
    c.hba1cXage * chba1c * cage + c.egfrXage * cegfr * cage;
  const uncalibratedRisk = 1 - Math.pow(c.baselineSurvival, Math.exp(lp));
  const [s1, s2] = scales;
  const risk = 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - uncalibratedRisk))));
  return { risk, riskPercent: risk * 100, uncalibratedRisk, linearPredictor: lp };
}
