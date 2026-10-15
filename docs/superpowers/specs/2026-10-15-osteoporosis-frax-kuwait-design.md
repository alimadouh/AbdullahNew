# Osteoporosis Risk (FRAX Kuwait) tool — design

Date: 2026-10-15 · Approved in chat by the site owner.

## Goal
A Tools page that follows the Kuwait Osteoporosis Guidelines 2022 (KOPS) workflow:
FRAX before DXA decides whether DXA is needed; after DXA the T-score is entered and the
tool decides treatment. Only content from the owner's PDF/slides (osteoporosis.pdf,
Dr Mohammad Sharkawy) plus the official FRAX Kuwait paper charts.

## Source data
- FRAX Kuwait paper charts (fraxplus.org/paper-charts, © University of Sheffield, free for
  not-for-profit clinical use): MOF and hip, women and men, by BMI (15–45) and by femoral-neck
  T-score (−4.0 to +1.0, BMI fixed at 24), ages 50–90 in 5-year steps, 0–6 CRFs.
  No FRAX API; the FRAX algorithm itself is not public. Values are interpolated between chart
  cells (age and BMI/T-score). The doctor may override with the official FRAX number.
- Kuwait fracture probability table: IT / LAT / UAT by age 40–90.
- Slides: assessment flowchart, FRAX enhancers, VFA indications, DXA contraindications,
  Kuwait screening checklist, treatment pathway.

## Flow (4 steps, step-by-step UI, one page under Tools)
1. Screening: major/minor risk-factor checklist (≥60 mandatory; >50 with 1 major + 2 minor);
   DXA contraindications (pregnancy, GI contrast 72 h, weight >114 kg).
2. Risk factors & FRAX before DXA: age, sex, weight, height (BMI), the FRAX CRFs.
   Fragility fracture (spine, hip or ≥2 other) → Very high risk, anabolic ± DXA.
   Else MOF from BMI chart (or override) vs LAT/UAT → Low (repeat FRAX in 5 y) / Do DXA /
   Very high (anabolic ± DXA).
3. DXA result: FN T-score (+ optional LS T-score) → MOF from BMD chart (or override),
   enhancers (GC dose ×0.8/×1.15; recent humerus/forearm factor by age; LS discordance
   1 SD ×1.1, ≥2 SD ×1.2; T2DM / ADT counted as RA) vs IT/UAT → Low (repeat FRAX & DXA in 3 y)
   / High (antiresorptive) / Very high (anabolic).
4. Plan: treatment pathway from the slide + VFA indications.

Nothing is saved (owner choice: re-enter on the return visit).

## Testing
Chart extraction checked cell-by-cell against the PDFs; Kuwait threshold table checked per row;
the 16 practice cases in the PDF run through the tool; light/dark and phone sizes.
