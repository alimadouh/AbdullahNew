/**
 * Risk category schemes. Thresholds are applied to the exact (unrounded) risk.
 *
 *  esc2021      — 2021 ESC Guidelines on CVD prevention (SCORE2 / SCORE2-OP),
 *                 age-specific, apparently healthy people. Eur Heart J 2021;42:3227–3337.
 *  esc2023dm    — 2023 ESC Guidelines for CVD in patients with diabetes
 *                 (SCORE2-Diabetes). Eur Heart J 2023;44:4043–4140.
 */

const GREEN = '#2e9e5b', YELLOW = '#e8b326', ORANGE = '#e8832a', RED = '#c62f2f', DARKRED = '#7d1414';

export const CATEGORIES = Object.freeze({
  lowModerate: { id: 'lowModerate', label: 'Low-to-moderate risk', color: GREEN, guidance: 'Risk factor treatment is generally not recommended.' },
  high: { id: 'high', label: 'High risk', color: ORANGE, guidance: 'Risk factor treatment should be considered.' },
  veryHigh: { id: 'veryHigh', label: 'Very high risk', color: RED, guidance: 'Risk factor treatment is recommended.' },
});

export const AGE_BANDS = Object.freeze([
  { id: 'under50', label: '<50 years', minAge: 0, maxAge: 49, thresholds: [2.5, 7.5] },
  { id: '50to69', label: '50–69 years', minAge: 50, maxAge: 69, thresholds: [5, 10] },
  { id: '70plus', label: '≥70 years', minAge: 70, maxAge: Infinity, thresholds: [7.5, 15] },
]);

export const GUIDANCE_FOOTNOTE =
  'Per the 2021 ESC prevention guidelines, treatment decisions should also take into account ' +
  'risk modifiers, frailty, comorbidities, lifetime CVD risk and treatment benefit, ' +
  'drug–drug interactions and patient preferences.';

export const SCHEMES = Object.freeze({
  esc2021: {
    id: 'esc2021',
    source: '2021 ESC Guidelines on cardiovascular disease prevention in clinical practice',
    ageBanded: true,
    gaugeMax: 50,
    footnote: GUIDANCE_FOOTNOTE,
  },
  esc2023dm: {
    id: 'esc2023dm',
    source: '2023 ESC Guidelines for the management of cardiovascular disease in patients with diabetes',
    ageBanded: false,
    gaugeMax: 40,
    categories: [
      { id: 'low', label: 'Low risk', color: GREEN, upTo: 5 },
      { id: 'moderate', label: 'Moderate risk', color: YELLOW, upTo: 10 },
      { id: 'high', label: 'High risk', color: RED, upTo: 20 },
      { id: 'veryHigh', label: 'Very high risk', color: DARKRED, upTo: Infinity },
    ],
    footnote:
      'Per the 2023 ESC diabetes guidelines, people with type 2 diabetes and established ASCVD or severe target-organ damage ' +
      'are at very high risk and are not assessed with SCORE2-Diabetes. Treatment intensity should be individualised.',
  },
});

export function ageBandFor(age) {
  return AGE_BANDS.find((b) => age >= b.minAge && age <= b.maxAge) || null;
}

/** ESC 2021 (SCORE2 / SCORE2-OP) classification. */
export function classifyRisk(riskPercent, age) {
  const band = ageBandFor(age);
  if (!band) throw new Error(`No age band for age ${age}`);
  const [t1, t2] = band.thresholds;
  const category =
    riskPercent < t1 ? CATEGORIES.lowModerate : riskPercent < t2 ? CATEGORIES.high : CATEGORIES.veryHigh;
  return { band, category, thresholds: band.thresholds };
}

/**
 * Classify with any scheme. Returns the category plus `segments`
 * ([{from, to, color, label}]) used by the gauge and legend.
 */
export function classifyWithScheme(schemeId, riskPercent, age) {
  const scheme = SCHEMES[schemeId];
  if (scheme.ageBanded) {
    const { band, category, thresholds } = classifyRisk(riskPercent, age);
    const [t1, t2] = thresholds;
    const segments = [
      { from: 0, to: t1, ...pick(CATEGORIES.lowModerate) },
      { from: t1, to: t2, ...pick(CATEGORIES.high) },
      { from: t2, to: Infinity, ...pick(CATEGORIES.veryHigh) },
    ];
    return { scheme, band, category, thresholds, segments };
  }
  let from = 0;
  const segments = scheme.categories.map((c) => {
    const s = { from, to: c.upTo, label: c.label, color: c.color };
    from = c.upTo;
    return s;
  });
  const category = scheme.categories.find((c) => riskPercent < c.upTo);
  return { scheme, band: null, category, thresholds: scheme.categories.slice(0, -1).map((c) => c.upTo), segments };
}

function pick(c) {
  return { label: c.label, color: c.color };
}

/**
 * Format the risk exactly as the ESC CVD Risk app shows it (observed on the app):
 *   - below 10 %: one decimal            (7.5008 → "7.5")
 *   - 10 % and above: whole percent      (25.66 → "26", 42.8 → "43")
 *   - SCORE2-Diabetes: always one decimal (30.73 → "30.7")   → pass decimals = 1
 * Values that round to 0.0 show "<0.1".
 */
export function formatRiskPercent(riskPercent, decimals = 'auto') {
  const oneDecimal = Math.round(riskPercent * 10) / 10;
  if (oneDecimal === 0) return '<0.1';
  if (decimals === 1 || oneDecimal < 10) return oneDecimal.toFixed(1);
  return String(Math.round(riskPercent));
}

/** Human-readable range text for a segment, e.g. "5 to <10%". */
export function segmentRangeText({ from, to }) {
  if (from === 0) return `<${to}%`;
  if (to === Infinity) return `≥${from}%`;
  return `${from} to <${to}%`;
}
