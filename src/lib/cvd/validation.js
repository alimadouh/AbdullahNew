/**
 * Input validation for all calculators. Field ranges live in models.js and
 * match the ESC CVD Risk app sliders (reference/app-screenshots/). Values
 * outside these ranges are rejected, never clamped or extrapolated.
 */
import { REGION_IDS } from './regions.js';
import { MODELS, FIELDS, TOGGLES } from './models.js';
import { toCanonical, UNIT_KINDS, CHOLESTEROL_MGDL_PER_MMOL } from './units.js';

function toNumber(v) {
  if (v === null || v === undefined || v === '') return NaN;
  if (typeof v === 'number') return v;
  return Number(String(v).trim().replace(',', '.'));
}

/** Unit chosen for a unit kind; accepts `units: {cholesterol, hba1c}` or legacy `cholesterolUnit`. */
export function unitFor(raw, kind) {
  const u = raw.units?.[kind] ?? (kind === 'cholesterol' ? raw.cholesterolUnit : undefined);
  const allowed = Object.keys(UNIT_KINDS[kind].units);
  return allowed.includes(u) ? u : (kind === 'hba1c' ? 'percent' : 'mmol');
}

/** Limits for a field in the unit currently selected. */
export function limitsFor(modelId, field, raw = {}) {
  const lim = MODELS[modelId].limits[field];
  const kind = FIELDS[field]?.unitKind;
  return kind ? lim[unitFor(raw, kind)] : lim;
}

const fmt = (n) => String(n);

/**
 * @param {string} modelId  key of MODELS
 * @param {object} raw      form values (strings or numbers), plus `units`
 * @returns {{valid:boolean, errors:Record<string,string>, values:object|null}}
 *          values normalised to mmHg, mmol/L (cholesterol) and mmol/mol (HbA1c).
 */
export function validateModelInput(modelId, raw) {
  const model = MODELS[modelId];
  if (!model) throw new Error(`Unknown model "${modelId}"`);
  const errors = {};
  const values = {};
  const items = model.steps.flat();

  for (const item of items) {
    if (item === 'region') {
      if (!REGION_IDS.includes(raw.region)) errors.region = 'Select a risk region or country.';
      else values.region = raw.region;
    } else if (item === 'sex') {
      if (raw.sex !== 'male' && raw.sex !== 'female') errors.sex = 'Select sex.';
      else values.sex = raw.sex;
    } else if (TOGGLES[item]) {
      if (typeof raw[item] !== 'boolean') errors[item] = `Specify ${TOGGLES[item].label.toLowerCase()}.`;
      else values[item] = raw[item];
    } else if (FIELDS[item]) {
      const def = FIELDS[item];
      const n = toNumber(raw[item]);
      const lim = limitsFor(modelId, item, raw);
      const unitLabel = def.unitKind ? UNIT_KINDS[def.unitKind].units[unitFor(raw, def.unitKind)] : def.unit;
      if (!Number.isFinite(n)) {
        errors[item] = `Enter a value for ${def.label}.`;
      } else if (def.integer && !Number.isInteger(n)) {
        errors[item] = `${def.label} must be a whole number of years.`;
      } else if (n < lim.min - tolerance(def, raw) || n > lim.max + tolerance(def, raw)) {
        if (item === 'age') {
          const hint = model.limits.age.outOfRange?.(n);
          errors.age = `${model.title} applies to ages ${lim.min}–${lim.max}.` + (hint ? ` ${hint}` : '');
        } else {
          errors[item] = `${def.label} must be ${fmt(lim.min)}–${fmt(lim.max)} ${unitLabel}.`;
        }
      } else {
        values[item] = def.unitKind ? toCanonical(def.unitKind, n, unitFor(raw, def.unitKind)) : n;
      }
    }
  }

  if (values.totalCholesterol !== undefined && values.hdl !== undefined && values.hdl >= values.totalCholesterol)
    errors.hdl = 'HDL cholesterol must be lower than total cholesterol.';
  if (values.diabetesAge !== undefined && values.age !== undefined && values.diabetesAge > values.age)
    errors.diabetesAge = 'Age at diabetes diagnosis cannot be later than current age.';

  const valid = Object.keys(errors).length === 0;
  return { valid, errors, values: valid ? values : null };
}

// mg/dL bounds are whole numbers; allow for that rounding.
function tolerance(def, raw) {
  return def.unitKind === 'cholesterol' && unitFor(raw, 'cholesterol') === 'mgdl' ? 0.5 : 1e-9;
}

// ---- SCORE2 compatibility exports ----------------------------------------

export const SCORE2_LIMITS = MODELS.score2.limits;
export const SCORE2_EXCLUSIONS = Object.freeze([...MODELS.score2.exclusions]);

export function validateScore2Input(raw) {
  return validateModelInput('score2', raw);
}

/**
 * Warnings (not errors) shown with SCORE2 / SCORE2-OP results. The ESC 2021
 * guidelines treat a markedly elevated single risk factor as at least high
 * risk irrespective of the estimate. Inputs in mmHg / mmol/L.
 */
export function score2Warnings({ sbp, totalCholesterol }) {
  const warnings = [];
  if (totalCholesterol > 8)
    warnings.push(`Total cholesterol > 8 mmol/L (${Math.round(8 * CHOLESTEROL_MGDL_PER_MMOL)} mg/dL) is a markedly elevated single risk factor: ` +
      'the person is considered at least high risk regardless of the SCORE2 estimate. Consider familial hypercholesterolaemia.');
  if (sbp >= 180)
    warnings.push('Systolic BP ≥ 180 mmHg is a markedly elevated single risk factor: ' +
      'the person is considered at least high risk regardless of the SCORE2 estimate.');
  return warnings;
}
