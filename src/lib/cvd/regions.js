/**
 * SCORE2 risk regions and the countries assigned to each.
 * Source: 2021 ESC Guidelines on cardiovascular disease prevention in clinical
 * practice (Eur Heart J 2021;42:3227–3337), section on SCORE2/SCORE2-OP risk
 * regions, grouped by WHO age- and sex-standardised CVD mortality.
 *
 * Countries outside this list (including Kuwait and the other GCC states) are
 * NOT covered by SCORE2 calibration. See docs/LIMITATIONS-AND-LICENSING.md.
 */

export const REGIONS = Object.freeze([
  {
    id: 'low',
    label: 'Low risk',
    color: '#2e9e5b',
    description: 'CVD mortality < 100 per 100 000',
    countries: [
      'Belgium', 'Denmark', 'France', 'Luxembourg', 'Netherlands',
      'Norway', 'Spain', 'Switzerland', 'United Kingdom',
    ],
  },
  {
    id: 'moderate',
    label: 'Moderate risk',
    color: '#e8b326',
    description: 'CVD mortality 100–149 per 100 000',
    countries: [
      'Austria', 'Cyprus', 'Finland', 'Germany', 'Greece', 'Iceland', 'Ireland',
      'Italy', 'Malta', 'Portugal', 'San Marino', 'Slovenia', 'Sweden',
    ],
  },
  {
    id: 'high',
    label: 'High risk',
    color: '#e8832a',
    description: 'CVD mortality 150–299 per 100 000',
    countries: [
      'Albania', 'Bosnia and Herzegovina', 'Croatia', 'Czech Republic', 'Estonia',
      'Hungary', 'Kazakhstan', 'Poland', 'Slovakia', 'Turkey',
    ],
  },
  {
    id: 'veryHigh',
    label: 'Very high risk',
    color: '#c62f2f',
    description: 'CVD mortality ≥ 300 per 100 000',
    countries: [
      'Algeria', 'Armenia', 'Azerbaijan', 'Belarus', 'Bulgaria', 'Egypt', 'Georgia',
      'Kyrgyzstan', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Montenegro',
      'Morocco', 'North Macedonia', 'Republic of Moldova', 'Romania',
      'Russian Federation', 'Serbia', 'Syria', 'Tunisia', 'Ukraine', 'Uzbekistan',
    ],
  },
]);

export const REGION_IDS = Object.freeze(REGIONS.map((r) => r.id));

export function getRegion(id) {
  return REGIONS.find((r) => r.id === id) || null;
}

/** Alphabetical list of { country, regionId } for the country picker. */
export const COUNTRIES = Object.freeze(
  REGIONS.flatMap((r) => r.countries.map((country) => ({ country, regionId: r.id })))
    .sort((a, b) => a.country.localeCompare(b.country))
);

export function regionForCountry(country) {
  return COUNTRIES.find((c) => c.country === country)?.regionId || null;
}

export const UNCOVERED_REGION_NOTE =
  'SCORE2 is calibrated only for the European and ESC-member countries listed. ' +
  'It has not been calibrated or validated for Kuwait or other Gulf (GCC) countries. ' +
  'For patients from countries not listed, selecting a risk region is a clinical judgement ' +
  'and the absolute risk estimate may be inaccurate.';
