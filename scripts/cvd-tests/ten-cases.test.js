/**
 * 10 test patients per calculator (60 total). The expected values come from an
 * independent Python implementation (tests/independent/reference_impl.py) written
 * from the published coefficient tables, so these tests catch any coding or
 * transcription error in the JavaScript. Tolerance: 0.01 percentage point.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate, formatRiskPercent } from '../../src/lib/cvd/index.js';

const { models } = JSON.parse(readFileSync(new URL('./ten-cases.json', import.meta.url), 'utf8'));

for (const [modelId, cases] of Object.entries(models)) {
  describe(`${modelId}: 10 independent test patients`, () => {
    for (const c of cases) {
      test(c.id, () => {
        const r = calculate(modelId, c.input);
        assert.equal(r.ok, true, JSON.stringify(r.errors));
        assert.ok(Math.abs(r.riskPercent - c.expectedPercent) < 0.01,
          `JS ${r.riskPercent.toFixed(4)}% vs independent Python ${c.expectedPercent.toFixed(4)}%`);
        const d = modelId === 'score2diabetes' ? 1 : 'auto';
        assert.equal(r.display, formatRiskPercent(c.expectedPercent, d));
      });
    }
  });
}
