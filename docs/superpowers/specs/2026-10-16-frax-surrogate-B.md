# FRAX Kuwait surrogate — approach B (fitted to the paper charts)

Date: 2026-10-16. Status: built, not wired into the UI. `src/lib/osteo.js` is unchanged.

## What it is

`src/lib/fraxSurrogate.js` (pure ESM, no imports, about 34 kB with the fitted numbers inside):

```js
import { fraxProbability, roundAsShown } from './fraxSurrogate.js'
fraxProbability({ sex: 'female', age: 75, bmi: 25.4, tScore: -2.5,
  factors: { prior: true, parentHip: true, smoke: false, gc: false, ra: false, secondary: false, alcohol: false } })
// → { mof: 25.7…, hip: 17.4… }   (shown 26 / 17; FRAX shows 26 / 18)
```

`tScore` = femoral neck T-score, or `null` for no BMD. Secondary osteoporosis counts only without BMD and only when RA is no (it uses the RA weight). Output is the raw probability in %; `roundAsShown` rounds like FRAX (one decimal below 10, whole numbers from 10).

## Model

For each sex, outcome (MOF, hip) and kind (no BMD by BMI, or BMD by T-score at BMI 24):

```
p     = 100 · h/(h+d) · (1 − e^−(h+d))            competing-risk link (fracture h, death d)
log h = η0(age, x) + L + γ·L²
hip:  L = Σ wh_j                                      (sum over the patient's factors)
MOF:  L = ln((1−π)·e^{Σ wo_j} + π·e^{Σ wh_j})          (part of MOF behaves like hip)
```

- η0 is fitted for every chart cell. d, γ, π and the six factor weights are fitted for every chart age as quadratics in x (BMI or T-score). Between grid points everything is interpolated with a monotone cubic (PCHIP).
- The fit makes, for every chart cell and every number of factors 0–6, the model's mean, lowest and highest value over all factor sets of that size match the chart's mean, low and high. Residuals are in rounding half-units (0.05 below 10 %, 0.5 from 10 %), with more weight on rows 0–2 (most patients).
- The link was chosen by test: per cell, competing-risk fits the charts better than log, logit or cloglog (rms 1.06 vs 1.33–3.3 half-units). The hip "mixture" for MOF is needed because the charts show hip-type factors adding up faster in MOF than a plain sum (with BMD, MOF rms 1.4 → 1.0).
- **Naming the weights.** The charts give the spread of the six weights but not which factor is which. A dynamic program over the ages picks, at each age, the order closest to published FRAX single-factor outputs (UK, Kanis 2008 Tables 1–2; Sweden, WHO 2007 Table 7.15) while changing least from the previous age. With BMD, the prior is the UK age-65 BMD weight plus the age trend of the fitted no-BMD weights. Result: parental hip fracture is the weakest hip factor up to 65 and jumps to the strongest by 75 (hip hazard ratio with BMD: ×1.05 at 65, ×2.2 at 70, ×4.5 at 75); prior fracture is the strongest hip factor at 50–60.
- Extra fitting points (weight 2): the 19 fraxplus.org outputs (2026-10-15 validation) and 11 published Kuwait outputs (Kanis 2017: women BMI 30 prior fracture at 50–90; T −2.5 / −2.0 + parental hip at 65).
- With BMD, BMI other than 24 uses the published BMI effect with BMD (WHO 2007 Table 7.17, ratio to BMI 24). Check: Kuwait women BMI 30, T −2.5 and −1.5, ages 40–90, all within 0.1–0.2.
- Ages 40–49: MOF base follows Kuwait women at 40/45 (×0.50/×0.70 of age 50 without BMD, ×0.59/×0.76 with BMD); hip uses the chart's 50→55 slope; prior fracture weight +0.065 below 50. Ages over 90 use 90. BMI is limited to 15–45, T-score to −5…+2 (weights stay at the chart edge outside −4…+1).
- FRAX itself lets smoking lower MOF a little with BMD at good T-scores (155 chart cells have k=1 low ≤ the no-factor value). The surrogate keeps that.

## Results

Chart cells (all 11 016 printed numbers; model rounded as FRAX shows; points):

| Chart | mean abs | max |
|---|---|---|
| female MOF, no BMD | 0.20 | 3 |
| female MOF, BMD | 0.21 | 4 |
| female hip, no BMD | 0.16 | 3 |
| female hip, BMD | 0.08 | 2 |
| male MOF, no BMD | 0.13 | 2 |
| male MOF, BMD | 0.24 | 4 |
| male hip, no BMD | 0.11 | 3 |
| male hip, BMD | 0.08 | 2 |
| **all** | **0.15** | **4** |

By number of factors: 0 → 0.001, 1 → 0.045, 2 → 0.056, 3 → 0.12, 4 → 0.21, 5 → 0.30, 6 → 0.41. Every error of 2+ points is in rows with 4–6 factors.

19 known FRAX cases (points, both rounded as FRAX shows):

| Method | MOF mean | MOF max | hip mean | hip max |
|---|---|---|---|---|
| Surrogate B, final (cases in the fit) | 0.13 | 1 | 0.22 | 3 |
| Surrogate B, leave-one-out (each case left out of its own fit) | 0.36 | 2 | 0.28 | 4 |
| Surrogate B, charts only (no cases in the fit) | 0.37 | 2 | 0.28 | 4 |
| Current osteo.js (weightedChartProbability) | 0.20 | 1 | 0.56 | 6 |

The worst case for every method is L (90 F, 5 factors, T −2.8: FRAX 53 / 49). The leave-one-out row is the fair out-of-sample number: fitting the cases fixes those cases but barely helps a case the fit has not seen (0.36 vs 0.37 MOF). On these 19 the current osteo.js is better for MOF (it was tuned on the same cases) and B is better for hip.

Published Kuwait MOF (women BMI 30, 47 values, ages 40–90): mean 0.03, max 1.

Interpolation checks (refit with grid points left out, predict them):
- Ages 55, 75, 85 left out (10-year gaps): mean 0.72 points over all left-out chart numbers, rows 0–2 mean 0.34. PCHIP beat Catmull-Rom (0.84) and linear (0.89); interpolating parameters beat interpolating the outputs. The big misses are at 75, where the parental-hip effect jumps between 70 and 80 — with the real 5-year grid the error is much smaller, but the exact shape between 70 and 75 is unknown.
- Every other x column left out: BMI columns mean 0.32, T columns mean 0.19 (PCHIP; linear 0.37 / 0.26).

## Files

- `src/lib/fraxSurrogate.js` — the model and the fitted numbers (between `PARAMS-BEGIN/END`).
- `scripts/frax_surrogate/fit.mjs` — the fit (`node scripts/frax_surrogate/fit.mjs`, about 1–2 min, one core, below-normal priority). Options: `CASEW=0` (charts only), `DROP=55,75,85` / `DROPX=1` + `OUT=file` (leave-out tests), `EXCLUDE=id ONLYSEX=…` (leave-one-out).
- `scripts/frax_surrogate/eval.mjs [--cases]` — the tables above, next to osteo.js.
- `scripts/frax_surrogate/priors.mjs` — published single-factor outputs used to name the weights.
- `scripts/frax_surrogate/cases.mjs` — known FRAX outputs used as extra fitting points.
- `scripts/frax_surrogate/cv_ages.mjs`, `cv_x.mjs`, `loo_cases.mjs` — interpolation and leave-one-out checks.
- `scripts/frax_surrogate/explore_links.mjs`, `explore_cells.mjs`, `sorted_weights.mjs`, `probe.mjs` — link test, per-cell fits, unnamed weights by age, one-cell probe.
- `scripts/frax_surrogate/lm.mjs` — small Levenberg-Marquardt solver.

## Open doubts

1. **Middle factors.** In each chart row only the weakest and strongest factor (and the mean) are printed. The order of the four middle factors comes from UK/Swedish single-factor outputs plus the 19 cases. If Kuwait FRAX orders them differently, single-factor results can be off by up to about half the chart range for that row.
2. **Between ages 70 and 75 (and 65–70)** the parental-hip effect on hip rises steeply; the curve between grid ages is a guess (monotone cubic).
3. **Many factors (4–6)** fit less well (up to 3–4 points on the chart, 4 points hip on case L). These patients are rare.
4. **BMI with BMD** uses the Swedish age-65 curve for all ages, sexes and T-scores. It matches Kuwait women BMI 30 at all ages, but nothing checks BMI < 20 or > 35 with BMD.
5. **Ages 40–49** rest on four published Kuwait women values; men and hip below 50 are extrapolated.
6. Inputs outside the charts (BMI < 15 or > 45, T < −4 or > +1) are clamped or extrapolated; FRAX's own limits are not published.
