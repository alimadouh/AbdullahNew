import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate, validateModelInput, computeScore2OP, classifyWithScheme,
  hba1cPercentToMmolMol, hba1cMmolMolToPercent, MODELS, REGION_IDS,
} from '../../src/lib/cvd/index.js';

const op = { region: 'moderate', sex: 'female', age: 75, smoking: false, sbp: 140, totalCholesterol: 5.5, hdl: 1.4, cholesterolUnit: 'mmol' };
const dm = { region: 'moderate', sex: 'male', age: 60, diabetesAge: 50, smoking: false, sbp: 140, totalCholesterol: 5.0, hdl: 1.2, hba1c: 7.0, egfr: 85, units: { cholesterol: 'mmol', hba1c: 'percent' } };

// --- SCORE2-OP ---------------------------------------------------------------

test('SCORE2-OP: valid range 70–89 only', () => {
  assert.ok(validateModelInput('score2op', { ...op, age: 70 }).valid);
  assert.ok(validateModelInput('score2op', { ...op, age: 89 }).valid);
  assert.match(validateModelInput('score2op', { ...op, age: 69 }).errors.age, /SCORE2 for people aged 40–69/);
  assert.ok(validateModelInput('score2op', { ...op, age: 90 }).errors.age);
});

test('SCORE2-OP: diabetes is fixed to "no" (as in the ESC app) and increases risk in the core model', () => {
  const r = calculate('score2op', op);
  const core = computeScore2OP({ ...op, diabetes: false }).riskPercent;
  assert.ok(Math.abs(r.riskPercent - core) < 1e-9);
  assert.ok(computeScore2OP({ ...op, diabetes: true }).riskPercent > core);
});

test('SCORE2-OP: risk increases low → very high region and with smoking', () => {
  for (const sex of ['male', 'female']) {
    const risks = REGION_IDS.map((region) => calculate('score2op', { ...op, sex, region }).riskPercent);
    for (let i = 1; i < risks.length; i++) assert.ok(risks[i] > risks[i - 1], `${sex}: ${risks}`);
    assert.ok(calculate('score2op', { ...op, sex, smoking: true }).riskPercent > calculate('score2op', { ...op, sex }).riskPercent);
  }
});

test('SCORE2-OP uses the ≥70 ESC thresholds (7.5 / 15 %)', () => {
  const r = calculate('score2op', op);
  assert.deepEqual(r.thresholds, [7.5, 15]);
});

// --- SCORE2-Diabetes -------------------------------------------------------

test('SCORE2-Diabetes: valid input computes and uses the 4-level ESC 2023 scheme', () => {
  const r = calculate('score2diabetes', dm);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.thresholds, [5, 10, 20]);
  assert.ok(['low', 'moderate', 'high', 'veryHigh'].includes(r.category.id));
});

test('SCORE2-Diabetes: HbA1c in % and mmol/mol give the same result', () => {
  const a = calculate('score2diabetes', dm).riskPercent;
  const b = calculate('score2diabetes', { ...dm, hba1c: hba1cPercentToMmolMol(7.0), units: { cholesterol: 'mmol', hba1c: 'mmolmol' } }).riskPercent;
  assert.ok(Math.abs(a - b) < 1e-9);
  assert.ok(Math.abs(hba1cPercentToMmolMol(7.0) - 53) < 0.1);
  assert.ok(Math.abs(hba1cMmolMolToPercent(53) - 7.0) < 0.01);
});

test('SCORE2-Diabetes: risk rises with HbA1c, falls with later diagnosis age and higher eGFR (in normal range)', () => {
  const r = (o) => calculate('score2diabetes', { ...dm, ...o }).riskPercent;
  assert.ok(r({ hba1c: 9 }) > r({ hba1c: 6 }));
  assert.ok(r({ diabetesAge: 35 }) > r({ diabetesAge: 58 }));
  assert.ok(r({ egfr: 50 }) > r({ egfr: 95 }));
});

test('SCORE2-Diabetes: validation', () => {
  const e = (o) => validateModelInput('score2diabetes', { ...dm, ...o }).errors;
  assert.match(e({ diabetesAge: 61 }).diabetesAge, /later than current age/);
  assert.ok(e({ diabetesAge: 17 }).diabetesAge);
  assert.ok(e({ egfr: 14 }).egfr);
  assert.ok(e({ egfr: 201 }).egfr);
  assert.ok(e({ hba1c: 1.9 }).hba1c);
  assert.ok(e({ hba1c: 21.1 }).hba1c);
  assert.ok(e({ totalCholesterol: 1.4 }).totalCholesterol);
  assert.ok(e({ hdl: 4.6 }).hdl);
  assert.ok(e({ age: 70 }).age);
});

// --- Every model ------------------------------------------------------------

test('every model returns a probability in (0,100) at the corners of its input ranges', () => {
  for (const [id, m] of Object.entries(MODELS)) {
    const lim = m.limits;
    for (const sex of ['male', 'female'])
      for (const age of [lim.age.min, lim.age.max])
        for (const sbp of [lim.sbp.min, lim.sbp.max]) {
          const raw = {
            region: 'veryHigh', sex, age, sbp, smoking: true,
            totalCholesterol: lim.totalCholesterol.mmol.max, hdl: lim.hdl.mmol.min, cholesterolUnit: 'mmol',
            diabetesAge: Math.min(age, 40), hba1c: 12, egfr: 60,
          };
          const r = calculate(id, raw);
          assert.equal(r.ok, true, `${id}: ${JSON.stringify(r.errors)}`);
          assert.ok(r.riskPercent > 0 && r.riskPercent < 100, `${id} ${sex} ${age} ${sbp}: ${r.riskPercent}`);
        }
  }
});
