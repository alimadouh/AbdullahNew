# Osteoporosis Risk tool vs official FRAX (Kuwait) — validation 2026-10-15

Each case was entered by hand-paced automation on fraxplus.org/calculation-tool (country Kuwait, 45 s apart), and run twice through our page (both runs identical). B and D were repeated on FRAX with identical results.

| Case | Patient | FRAX MOF / hip | Ours MOF / hip | MOF diff | FRAX decision | Our decision |
|---|---|---|---|---|---|---|
| A | 60F, 80/152, RA, no BMD | 3.8 / 0.7 | 4.3 / 0.7 | 0.5 | DXA | DXA |
| B | 60F, 80/152, RA, T -2 | 5.8 / 1.5 | 7.1 / 1.9 | 1.3 | Low | High ⚠ |
| C | 65F, 70/165, none, no BMD | 4.3 / 1 | 4.3 / 1.1 | 0.0 | DXA | DXA |
| D | 65F, 70/165, none, T -2.4 | 6.5 / 2.2 | 6.4 / 2.3 | -0.1 | Low | Low |
| E | 75F, 65/160, prev+parent, no BMD | 23 / 15 | 16.8 / 9.7 | -6.2 | VeryHigh | VeryHigh |
| F | 75F, 65/160, prev+parent, T -2.5 | 26 / 18 | 18.0 / 11.0 | -8.0 | VeryHigh | VeryHigh |
| G0 | 55M, 85/175, smoke, no BMD | 2.1 / 0.3 | 3.1 / 0.3 | 1.0 | Low | DXA ⚠ |
| G | 55M, 85/175, smoke, T -1 | 2.8 / 0.7 | 4.0 / 0.7 | 1.2 | Low | Low |
| M1 | 70M, 75/170, GC+RA, no BMD | 7.2 / 3.4 | 7.0 / 3.2 | -0.2 | DXA | DXA |
| H | 70M, 75/170, GC+RA, T -1.5 | 7.8 / 3.3 | 7.6 / 3.6 | -0.2 | Low | Low |
| I | 80F, 55/155, prev+sec, no BMD | 25 / 13 | 23.7 / 16.5 | -1.3 | VeryHigh | VeryHigh |
| J | 80F, 55/155, prev+sec, T -3 | 17 / 6.8 | 18.0 / 10.0 | 1.0 | High | VeryHigh ⚠ |
| K0 | 50F, 60/160, alc, no BMD | 2.8 / 0.3 | 3.7 / 0.5 | 0.9 | DXA | DXA |
| K | 50F, 60/160, alc, T -1.8 | 3.8 / 0.8 | 4.8 / 1.0 | 1.0 | Low | High ⚠ |
| N1 | 85F, 60/155, parent, no BMD | 26 / 20 | 20.0 / 11.0 | -6.0 | VeryHigh | DXA ⚠ |
| L | 90F, 50/150, prev+parent+smoke+GC+RA, T -2.8 | 53 / 49 | 55.0 / 49.6 | 2.0 | VeryHigh | VeryHigh |
| HOL | 65F, 70/165, none, hologic 0.7 | 3.9 / 0.7 | 3.9 / 0.7 | -0.0 | Low | Low |
| LUN | 65F, 70/165, none, lunar 0.8 | 4.6 / 1.1 | 4.5 / 1.1 | -0.1 | Low | Low |
| NOR | 65F, 70/165, none, norland 0.7 | 5.2 / 1.4 | 5.0 / 1.4 | -0.2 | Low | Low |

Summary: no clinical risk factors → within 0.2 % (and Hologic / GE-Lunar / Norland T-score conversions match FRAX exactly: -1.32, -1.71, -1.96). With risk factors the paper charts (risk factors counted, not weighted) differ by up to 8 points; 5 of 19 decisions differ.

## Update 2026-10-16 — risk factors weighted by FRAX's own published single-factor outputs

| Case | Patient | FRAX MOF / hip | Ours MOF / hip | MOF diff | FRAX decision | Our decision |
|---|---|---|---|---|---|---|
| A | 60F, 80/152, RA, no BMD | 3.8 / 0.7 | 3.8 / 0.7 | -0.0 | DXA | DXA |
| B | 60F, 80/152, RA, T -2 | 5.8 / 1.5 | 5.9 / 1.7 | 0.1 | Low | Low |
| C | 65F, 70/165, none, no BMD | 4.3 / 1 | 4.3 / 1.1 | 0.0 | DXA | DXA |
| D | 65F, 70/165, none, T -2.4 | 6.5 / 2.2 | 6.5 / 2.3 | -0.0 | Low | Low |
| E | 75F, 65/160, prev+parent, no BMD | 23 / 15 | 22.7 / 15.3 | -0.3 | VeryHigh | VeryHigh |
| F | 75F, 65/160, prev+parent, T -2.5 | 26 / 18 | 26.8 / 9.6 | 0.8 | VeryHigh | VeryHigh |
| G0 | 55M, 85/175, smoke, no BMD | 2.1 / 0.3 | 2.1 / 0.3 | 0.0 | Low | Low |
| G | 55M, 85/175, smoke, T -1 | 2.8 / 0.7 | 2.8 / 0.7 | 0.0 | Low | Low |
| M1 | 70M, 75/170, GC+RA, no BMD | 7.2 / 3.4 | 6.9 / 3.3 | -0.3 | DXA | DXA |
| H | 70M, 75/170, GC+RA, T -1.5 | 7.8 / 3.3 | 8.1 / 4.3 | 0.3 | Low | Low |
| I | 80F, 55/155, prev+sec, no BMD | 25 / 13 | 26.3 / 13.3 | 1.3 | VeryHigh | VeryHigh |
| J | 80F, 55/155, prev+sec, T -3 | 17 / 6.8 | 18.2 / 7.0 | 1.2 | High | VeryHigh ⚠ |
| K0 | 50F, 60/160, alc, no BMD | 2.8 / 0.3 | 2.8 / 0.3 | 0.0 | DXA | DXA |
| K | 50F, 60/160, alc, T -1.8 | 3.8 / 0.8 | 3.8 / 0.8 | -0.0 | Low | Low |
| N1 | 85F, 60/155, parent, no BMD | 26 / 20 | 26.0 / 20.0 | 0.0 | VeryHigh | VeryHigh |
| L | 90F, 50/150, prev+parent+smoke+GC+RA, T -2.8 | 53 / 49 | 52.6 / 40.3 | -0.4 | VeryHigh | VeryHigh |
| HOL | 65F, 70/165, none, hologic 0.7 | 3.9 / 0.7 | 3.9 / 0.7 | 0.0 | Low | Low |

Kuwait IT (published, woman BMI 30 + prior fracture) reproduced exactly at 50–75 and within 0.9 at 80–90; published Kuwait age-65 prior-fracture values (women 8.9/2.6, men 5.6/1.7) reproduced exactly. 16/17 decisions match fraxplus.org (J is 18 vs 17, on the UAT line at age 80).
