/**
 * Worked examples published by the model authors.
 *  - SCORE2: Eur Heart J 2021;42:2439 (doi:10.1093/eurheartj/ehab309), text example.
 *  - SCORE2-OP: Eur Heart J 2021;42:2455 (doi:10.1093/eurheartj/ehab312), Supplementary material,
 *    worked calculation tables (men and women). The supplement prints the women's linear predictor as
 *    "-0.5029" but uses +0.5029 in the next line; +0.5029 is the arithmetically correct value.
 *    The worked examples recalibrate with an older low-region scale pair (men -0.61/0.89,
 *    women -0.85/0.82) that differs from the supplement's own scale table; the formula is checked here
 *    with the example's own numbers.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, computeScore2OP, computeScore2Diabetes } from '../../src/lib/cvd/index.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs published ${b}`);
const recal = (r0, s1, s2) => 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - r0))));

test('SCORE2 paper: man 50, smoker, SBP 140, TC 5.5, HDL 1.3 → 5.9 % (low) and 14.0 % (very high)', () => {
  const p = { sex: 'male', age: 50, smoking: true, sbp: 140, totalCholesterol: 5.5, hdl: 1.3 };
  near(calculate('score2', { ...p, region: 'low' }).riskPercent, 5.9, 0.05, 'low');
  near(calculate('score2', { ...p, region: 'veryHigh' }).riskPercent, 14.0, 0.05, 'very high');
});

for (const [sex, lp, uncal, s1, s2, recalibrated] of [
  ['male', 0.3298, 0.2966, -0.61, 0.89, 0.193],
  ['female', 0.5029, 0.2442, -0.85, 0.82, 0.1397],
]) {
  test(`SCORE2-OP supplement worked example (${sex}, 75, smoker, SBP 140, TC 5.5, HDL 1.3)`, () => {
    const r = computeScore2OP({ region: 'low', sex, age: 75, smoking: true, sbp: 140, totalCholesterol: 5.5, hdl: 1.3 });
    near(r.linearPredictor, lp, 0.00005, 'linear predictor');
    near(r.uncalibratedRisk, uncal, 0.00005, 'unrecalibrated risk');
    near(recal(r.uncalibratedRisk, s1, s2), recalibrated, 0.00005, 'recalibration formula');
  });
}

// Official SCORE2-Diabetes calculator spreadsheet published with the paper (Eur Heart J 2023, ehad260,
// appendix 2; copy in reference/papers/). Example: age 53, diagnosed at 30, smoker, SBP 110, TC 4.5,
// HDL 1.4, HbA1c 55 mmol/mol, eGFR 95. Values are the spreadsheet's own results (15 significant digits).
const DM_OFFICIAL = {
  male: { low: 9.9553916389537811, moderate: 13.116444885691047, high: 15.388566936926818, veryHigh: 24.147741949388656 },
  female: { low: 8.0800210342973351, moderate: 10.302441868725165, high: 16.007637019557475, veryHigh: 27.869447538407009 },
};
for (const [sex, byRegion] of Object.entries(DM_OFFICIAL))
  for (const [region, expected] of Object.entries(byRegion))
    test(`SCORE2-Diabetes official spreadsheet: ${sex}, ${region} region = ${expected.toFixed(4)} %`, () => {
      const r = computeScore2Diabetes({ sex, region, age: 53, diabetesAge: 30, smoking: true, sbp: 110, totalCholesterol: 4.5, hdl: 1.4, hba1c: 55, egfr: 95 });
      near(r.riskPercent, expected, 1e-9, `${sex} ${region}`);
    });
