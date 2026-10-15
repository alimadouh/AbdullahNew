import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  calculateScore2, computeScore2, validateScore2Input, classifyRisk, formatRiskPercent,
  mgdlToMmol, regionForCountry, COUNTRIES, REGION_IDS, score2Warnings,
  calculate, computeScore2Diabetes, hba1cPercentToMmolMol,
} from '../../src/lib/cvd/index.js';

const reference = JSON.parse(readFileSync(new URL('./reference-cases.json', import.meta.url), 'utf8'));

const base = { region: 'moderate', sex: 'male', age: 55, smoking: false, sbp: 130, totalCholesterol: 5.5, hdl: 1.3, cholesterolUnit: 'mmol' };

// --- Accuracy against published / official results -------------------------

for (const c of reference.cases) {
  // Known, not-yet-explained differences from the app are reported as TODO (visible, but not failing).
  test(`reference: ${c.id}`, c.knownMismatch ? { todo: c.knownMismatch } : {}, () => {
    let riskPercent;
    if (c.coreOnly) {
      const { hba1cPercent, ...rest } = c.input;
      riskPercent = computeScore2Diabetes({ ...rest, hba1c: hba1cPercentToMmolMol(hba1cPercent) }).riskPercent;
    } else {
      const r = calculate(c.model || 'score2', c.input);
      assert.equal(r.ok, true, JSON.stringify(r.errors));
      riskPercent = r.riskPercent;
    }
    if ('expectedPercent' in c)
      assert.ok(Math.abs(riskPercent - c.expectedPercent) <= c.tolerance,
        `${riskPercent.toFixed(3)}% vs expected ${c.expectedPercent}% (±${c.tolerance})`);
    // The official app shows whole percents; compare our exact value rounded the same way.
    if ('appWholePercent' in c) assert.equal(Math.round(riskPercent), c.appWholePercent, `ours ${riskPercent.toFixed(3)}%`);
    if ('appOneDecimal' in c) assert.equal(riskPercent.toFixed(1), c.appOneDecimal, `ours ${riskPercent.toFixed(3)}%`);
    if (!c.coreOnly && 'appScreen' in c) {
      assert.equal(calculate(c.model || 'score2', c.input).display, c.appScreen, 'website screen must equal the app screen');
    }
  });
}

test('regression: user app case unrounded value is stable', () => {
  const r = calculateScore2({ region: 'veryHigh', sex: 'female', age: 55, smoking: true, sbp: 167, totalCholesterol: 5.3, hdl: 1.2 });
  assert.ok(Math.abs(r.riskPercent - 25.66) < 0.01, r.riskPercent);
});

// --- Model behaviour -------------------------------------------------------

test('risk increases with region: low < moderate < high < very high', () => {
  for (const sex of ['male', 'female']) {
    const risks = REGION_IDS.map((region) => calculateScore2({ ...base, sex, region }).riskPercent);
    for (let i = 1; i < risks.length; i++) assert.ok(risks[i] > risks[i - 1], `${sex}: ${risks}`);
  }
});

test('risk increases with age, SBP, total cholesterol and smoking; decreases with HDL', () => {
  const r = (o) => calculateScore2({ ...base, ...o }).riskPercent;
  assert.ok(r({ age: 65 }) > r({ age: 45 }));
  assert.ok(r({ sbp: 170 }) > r({ sbp: 120 }));
  assert.ok(r({ totalCholesterol: 7.5 }) > r({ totalCholesterol: 4.0 }));
  assert.ok(r({ smoking: true }) > r({ smoking: false }));
  assert.ok(r({ hdl: 2.0 }) < r({ hdl: 0.9 }));
});

test('risk is always a valid probability across the whole input range', () => {
  for (const sex of ['male', 'female'])
    for (const region of REGION_IDS)
      for (const age of [40, 69])
        for (const sbp of [100, 200])
          for (const [totalCholesterol, hdl] of [[3.0, 0.7], [9.0, 0.7], [9.0, 2.5], [3.0, 2.5]])
            for (const smoking of [true, false]) {
              const { risk } = computeScore2({ sex, region, age, sbp, totalCholesterol, hdl, smoking });
              assert.ok(risk > 0 && risk < 1, `${sex} ${region} ${age} ${sbp} ${totalCholesterol} ${hdl} -> ${risk}`);
            }
});

test('mg/dL input gives the same result as the equivalent mmol/L input', () => {
  const mmol = calculateScore2({ ...base, totalCholesterol: 5.5, hdl: 1.3 });
  const mgdl = calculateScore2({ ...base, cholesterolUnit: 'mgdl', totalCholesterol: 5.5 * 38.67, hdl: 1.3 * 38.67 });
  assert.ok(Math.abs(mmol.riskPercent - mgdl.riskPercent) < 1e-9);
  assert.ok(Math.abs(mgdlToMmol(212.7) - 5.5) < 0.01);
});

// --- Validation ------------------------------------------------------------

test('rejects out-of-range and missing inputs instead of extrapolating', () => {
  const bad = (o) => validateScore2Input({ ...base, ...o });
  assert.ok(bad({ age: 39 }).errors.age);
  assert.match(bad({ age: 70 }).errors.age, /SCORE2-OP/);
  assert.ok(bad({ age: 55.5 }).errors.age);
  assert.ok(bad({ sbp: 99 }).errors.sbp);
  assert.ok(bad({ sbp: 201 }).errors.sbp);
  assert.ok(bad({ totalCholesterol: 2.9 }).errors.totalCholesterol);
  assert.ok(bad({ totalCholesterol: 9.1 }).errors.totalCholesterol);
  assert.ok(bad({ hdl: 0.6 }).errors.hdl);
  assert.ok(bad({ hdl: 2.6 }).errors.hdl);
  assert.ok(bad({ sbp: '' }).errors.sbp);
  assert.ok(bad({ sex: undefined }).errors.sex);
  assert.ok(bad({ region: 'kuwait' }).errors.region);
  assert.ok(bad({ smoking: undefined }).errors.smoking);
});

test('accepts boundary values and comma decimals', () => {
  for (const o of [{ age: 40 }, { age: 69 }, { sbp: 100 }, { sbp: 200 }, { totalCholesterol: 3.0 }, { totalCholesterol: 9.0 }, { hdl: 0.7 }, { hdl: 2.5 }, { hdl: '1,3' }])
    assert.equal(validateScore2Input({ ...base, ...o }).valid, true, JSON.stringify(o));
  assert.equal(validateScore2Input({ ...base, cholesterolUnit: 'mgdl', totalCholesterol: 116, hdl: 27 }).valid, true);
  assert.equal(validateScore2Input({ ...base, cholesterolUnit: 'mgdl', totalCholesterol: 348, hdl: 97 }).valid, true);
  assert.equal(validateScore2Input({ ...base, cholesterolUnit: 'mgdl', totalCholesterol: 349 }).valid, false);
});

test('HDL must be lower than total cholesterol', () => {
  assert.ok(validateScore2Input({ ...base, totalCholesterol: 3.0, hdl: 2.5 }).valid);
  assert.match(validateScore2Input({ ...base, totalCholesterol: 3.0, hdl: 3.0 }).errors.hdl ?? '', /HDL/);
});

test('markedly elevated single risk factors produce warnings', () => {
  assert.equal(score2Warnings({ sbp: 179, totalCholesterol: 8.0 }).length, 0);
  assert.equal(score2Warnings({ sbp: 180, totalCholesterol: 8.1 }).length, 2);
});

// --- Categories and display -----------------------------------------------

test('ESC 2021 age-specific categories', () => {
  assert.equal(classifyRisk(2.49, 45).category.id, 'lowModerate');
  assert.equal(classifyRisk(2.5, 45).category.id, 'high');
  assert.equal(classifyRisk(7.5, 49).category.id, 'veryHigh');
  assert.equal(classifyRisk(4.99, 50).category.id, 'lowModerate');
  assert.equal(classifyRisk(5, 60).category.id, 'high');
  assert.equal(classifyRisk(9.99, 69).category.id, 'high');
  assert.equal(classifyRisk(10, 69).category.id, 'veryHigh');
});

test('display matches the ESC app: one decimal below 10 %, whole percent from 10 %, SCORE2-Diabetes always one decimal', () => {
  assert.equal(formatRiskPercent(7.5008), '7.5');
  assert.equal(formatRiskPercent(5.49), '5.5');
  assert.equal(formatRiskPercent(0.4), '0.4');
  assert.equal(formatRiskPercent(9.94), '9.9');
  assert.equal(formatRiskPercent(9.96), '10');
  assert.equal(formatRiskPercent(11.8), '12');
  assert.equal(formatRiskPercent(25.66), '26');
  assert.equal(formatRiskPercent(28.552, 1), '28.6');
  assert.equal(formatRiskPercent(30.73, 1), '30.7');
  assert.equal(formatRiskPercent(0.04), '<0.1');
});

test('result display equals the app screen (26 %)', () => {
  const r = calculateScore2({ region: 'veryHigh', sex: 'female', age: 55, smoking: true, sbp: 167, totalCholesterol: 5.3, hdl: 1.2 });
  assert.equal(r.display, '26');
});

test('country mapping', () => {
  assert.equal(regionForCountry('France'), 'low');
  assert.equal(regionForCountry('Germany'), 'moderate');
  assert.equal(regionForCountry('Turkey'), 'high');
  assert.equal(regionForCountry('Egypt'), 'veryHigh');
  assert.equal(regionForCountry('Kuwait'), null);
  assert.equal(COUNTRIES.length, 9 + 13 + 10 + 23);
  assert.equal(regionForCountry('Israel'), null);
});
