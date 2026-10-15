/**
 * Public entry point of the CVD risk calculator module.
 *
 *   import { calculate } from './src/index.js';      // logic only
 *   import './src/ui/cvd-risk-tools.js';            // registers <cvd-risk-tools>
 */
import { MODELS } from './models.js';
import { validateModelInput, score2Warnings } from './validation.js';
import { classifyWithScheme, formatRiskPercent } from './riskCategories.js';

export * from './score2.js';
export * from './score2op.js';
export * from './score2diabetes.js';
export * from './regions.js';
export * from './riskCategories.js';
export * from './units.js';
export * from './validation.js';
export * from './models.js';
export * from './content.js';

/**
 * Validate raw form input and compute the risk for any model.
 * @param {'score2'|'score2op'|'score2diabetes'} modelId
 * @param {object} raw form values (see validateModelInput)
 * @returns {{ok:false, errors:object} | {ok:true, modelId, model, input, riskPercent:number,
 *            display:string, category, band, thresholds, segments, scheme, warnings:string[]}}
 */
export function calculate(modelId, raw) {
  const model = MODELS[modelId];
  const { valid, errors, values } = validateModelInput(modelId, raw);
  if (!valid) return { ok: false, errors };
  const { riskPercent } = model.compute(values);
  const { scheme, band, category, thresholds, segments } = classifyWithScheme(model.scheme, riskPercent, values.age);
  const warnings = model.scheme === 'esc2021' ? score2Warnings(values) : [];
  return {
    ok: true,
    modelId,
    model: model.meta,
    title: model.title,
    outcome: model.outcome,
    input: values,
    riskPercent,
    display: formatRiskPercent(riskPercent, model.displayDecimals ?? 'auto'),
    category,
    band,
    thresholds,
    segments,
    scheme,
    warnings,
  };
}

/** Backwards-compatible helper for SCORE2. */
export function calculateScore2(raw) {
  return calculate('score2', raw);
}
