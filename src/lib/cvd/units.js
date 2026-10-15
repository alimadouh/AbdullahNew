/**
 * Unit conversions.
 *  Cholesterol: 1 mmol/L = 38.67 mg/dL (molar mass of cholesterol 386.65 g/mol).
 *  HbA1c: IFCC(mmol/mol) = 10.93 × NGSP(%) − 23.5 — the conversion that reproduces the ESC app exactly
 *         (checked on 3 app results, including one 0.0001 % from a rounding edge).
 */
export const CHOLESTEROL_MGDL_PER_MMOL = 38.67;

export const UNIT_KINDS = Object.freeze({
  cholesterol: { canonical: 'mmol', units: { mmol: 'mmol/L', mgdl: 'mg/dL' } },
  hba1c: { canonical: 'mmolmol', units: { percent: '%', mmolmol: 'mmol/mol' } },
});

export const UNITS = Object.freeze({
  mmol: { id: 'mmol', label: 'mmol/L' },
  mgdl: { id: 'mgdl', label: 'mg/dL' },
});

export function mgdlToMmol(mgdl) {
  return mgdl / CHOLESTEROL_MGDL_PER_MMOL;
}

export function mmolToMgdl(mmol) {
  return mmol * CHOLESTEROL_MGDL_PER_MMOL;
}

export function toMmol(value, unit) {
  return unit === 'mgdl' ? mgdlToMmol(value) : value;
}

export function fromMmol(value, unit) {
  return unit === 'mgdl' ? mmolToMgdl(value) : value;
}

export function hba1cPercentToMmolMol(percent) {
  return 10.93 * percent - 23.5;
}

export function hba1cMmolMolToPercent(mmolmol) {
  return (mmolmol + 23.5) / 10.93;
}

/** Convert a value of `kind` from `unit` to the canonical unit (mmol/L, mmol/mol). */
export function toCanonical(kind, value, unit) {
  if (kind === 'cholesterol') return toMmol(value, unit);
  if (kind === 'hba1c') return unit === 'percent' ? hba1cPercentToMmolMol(value) : value;
  return value;
}

/** Convert a value of `kind` between two display units. */
export function convertUnit(kind, value, from, to) {
  if (from === to) return value;
  if (kind === 'cholesterol') return fromMmol(toMmol(value, from), to);
  if (kind === 'hba1c') return to === 'percent' ? hba1cMmolMolToPercent(value) : hba1cPercentToMmolMol(value);
  return value;
}
