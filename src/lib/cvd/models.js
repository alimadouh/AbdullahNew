/**
 * Model registry: everything the UI and validator need to know about each
 * calculator — which inputs, their ranges (matching the ESC CVD Risk app,
 * see reference/app-screenshots/), steps, exclusions, category scheme and
 * the compute function. Ranges are hard limits: out-of-range values are
 * rejected, never clamped.
 */
import { computeScore2, SCORE2_MODEL } from './score2.js';
import { computeScore2OP, SCORE2OP_MODEL } from './score2op.js';
import { computeScore2Diabetes, SCORE2DIABETES_MODEL } from './score2diabetes.js';

/** Shared field definitions. `unitKind` fields accept alternative units. */
export const FIELDS = Object.freeze({
  age: { label: 'Age', unit: 'years', integer: true },
  diabetesAge: { label: 'Age at diabetes diagnosis', unit: 'years', integer: true },
  sbp: { label: 'Systolic blood pressure', unit: 'mmHg' },
  totalCholesterol: { label: 'Total cholesterol', unitKind: 'cholesterol' },
  hdl: { label: 'HDL cholesterol', unitKind: 'cholesterol', unitSelector: false }, // follows the total cholesterol unit, as in the app
  hba1c: { label: 'HbA1c', unitKind: 'hba1c' },
  egfr: { label: 'eGFR', unit: 'mL/min/1.73m²' },
});

export const TOGGLES = Object.freeze({
  smoking: { label: 'Current smoking' },
});

const BASE_EXCLUSIONS = [
  'Documented atherosclerotic cardiovascular disease (clinical or unequivocal on imaging)',
  'Diabetes mellitus (type 1 or type 2)',
  'Moderate or severe chronic kidney disease',
  'Familial hypercholesterolaemia or other genetic/rare lipid or blood pressure disorder',
];

const CHOL_STD = { mmol: { min: 3.0, max: 9.0, step: 0.1 }, mgdl: { min: 116, max: 348, step: 1 } };
const HDL_STD = { mmol: { min: 0.7, max: 2.5, step: 0.1 }, mgdl: { min: 27, max: 97, step: 1 } };
const SBP_STD = { min: 100, max: 200, step: 1 };

export const MODELS = Object.freeze({
  score2: {
    meta: SCORE2_MODEL,
    title: 'SCORE2',
    tileSub: ['(Europe)', '40–69 years'],
    badge: 'stars',
    region: true,
    scheme: 'esc2021',
    outcome: '10-year risk of fatal and non-fatal CV event',
    eligibilityIntro: 'Apparently healthy people aged 40–69 years.',
    exclusions: BASE_EXCLUSIONS,
    steps: [['region'], ['sex', 'age', 'smoking'], ['sbp', 'totalCholesterol', 'hdl']],
    limits: {
      age: { min: 40, max: 69, step: 1, outOfRange: (v) => (v >= 70 ? 'Use SCORE2-OP for people aged 70 or over.' : 'Not applicable under 40.') },
      sbp: SBP_STD, totalCholesterol: CHOL_STD, hdl: HDL_STD,
    },
    compute: (v) => computeScore2(v),
  },
  score2op: {
    meta: SCORE2OP_MODEL,
    title: 'SCORE2-OP',
    tileSub: ['(Europe)', '≥70 years'],
    badge: 'stars',
    region: true,
    scheme: 'esc2021',
    outcome: '10-year risk of fatal and non-fatal CV event',
    eligibilityIntro: 'Apparently healthy people aged 70–89 years.',
    exclusions: BASE_EXCLUSIONS,
    steps: [['region'], ['sex', 'age', 'smoking'], ['sbp', 'totalCholesterol', 'hdl']],
    limits: {
      age: { min: 70, max: 89, step: 1, outOfRange: (v) => (v < 70 ? 'Use SCORE2 for people aged 40–69.' : 'Not applicable over 89.') },
      sbp: SBP_STD, totalCholesterol: CHOL_STD, hdl: HDL_STD,
    },
    compute: (v) => computeScore2OP({ ...v, diabetes: false }),
  },
  score2diabetes: {
    meta: SCORE2DIABETES_MODEL,
    title: 'SCORE2-Diabetes',
    displayDecimals: 1, // the app always shows one decimal for SCORE2-Diabetes
    tileSub: ['(Europe)', 'Type 2 diabetes'],
    badge: 'gauge',
    region: true,
    scheme: 'esc2023dm',
    outcome: '10-year risk of fatal and non-fatal CV event',
    eligibilityIntro: 'People with type 2 diabetes aged 40–69 years.',
    exclusions: [
      'Documented atherosclerotic cardiovascular disease (clinical or unequivocal on imaging)',
      'Severe target-organ damage (eGFR < 45; eGFR 45–59 with microalbuminuria; proteinuria; or microvascular disease in at least three different sites)',
      'Type 1 diabetes',
    ],
    steps: [['region'], ['sex', 'age', 'diabetesAge', 'smoking'], ['sbp', 'totalCholesterol', 'hdl', 'hba1c', 'egfr']],
    limits: {
      age: { min: 40, max: 69, step: 1 },
      diabetesAge: { min: 18, max: 69, step: 1 },
      sbp: SBP_STD,
      totalCholesterol: { mmol: { min: 1.5, max: 10.0, step: 0.1 }, mgdl: { min: 58, max: 387, step: 1 } },
      hdl: { mmol: { min: 0.5, max: 4.5, step: 0.1 }, mgdl: { min: 19, max: 174, step: 1 } },
      hba1c: { percent: { min: 2.0, max: 21.0, step: 0.1 }, mmolmol: { min: 0, max: 206, step: 1 } },
      egfr: { min: 15, max: 200, step: 1 },
    },
    compute: (v) => computeScore2Diabetes(v),
  },
});

/** Calculators shown in the hub, in order. */
export const HUB = Object.freeze([
  { group: 'No previous cardiovascular disease or type 2 diabetes', items: ['score2', 'score2op'] },
  { items: ['score2diabetes'] },
]);

