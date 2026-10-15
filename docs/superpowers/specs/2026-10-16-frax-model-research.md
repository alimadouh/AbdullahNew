# FRAX 10-year fracture probability: model structure and parameters from published sources

Prepared 2026-10-16 for the Kuwait clinic website project. Research only. No FRAX calculator was queried or scraped. No website repo, database or git was touched.

## How to read this file

- **[PUBLISHED]** = copied from the source named, with table and page. Numbers are copied exactly as printed (including any typos, which are flagged).
- **[INFERRED]** = my reading of how the published parts fit together. Not stated in this exact form by the FRAX authors.
- **[MY CALCULATION]** = a check I ran myself on published numbers.
- **[MY RECOMMENDATION]** = an implementation choice for the website. Not from any source.
- **NOT CONFIRMED** = I looked and could not find or open it.
- Page numbers: "p." = the printed page number of the source. For the WHO report I also give the PDF page ("PDF p."), because the printed number is 2 lower than the PDF page.

## Sources used (all opened and read unless marked)

| ID | Source | Where I read it |
|---|---|---|
| S1 | Kanis JA on behalf of the WHO Scientific Group. *Assessment of osteoporosis at the primary health-care level.* Technical Report. WHO Collaborating Centre for Metabolic Bone Diseases, University of Sheffield, 2007 (printed 2007, often cited 2008). 339-page PDF. | https://www.fraxplus.org/sites/frax/files/pdf/WHO_Technical_Report.pdf (only this published PDF was downloaded; no calculator page was used). The PDF ends at printed p. 337. **Annex 5 "Relationship between probability and hazard functions" (listed in the contents at p. 338) is missing from this copy.** |
| S2 | Kanis JA, Oden A, Johnell O, et al. The use of clinical risk factors enhances the performance of BMD in the prediction of hip and osteoporotic fractures in men and women. *Osteoporos Int* 2007;18:1033–1046. doi:10.1007/s00198-007-0343-y | Publisher PDF via Utrecht University repository, http://hdl.handle.net/1874/27395 |
| S3 | Kanis JA, Johnell O, Oden A, Johansson H, McCloskey E. FRAX and the assessment of fracture probability in men and women from the UK. *Osteoporos Int* 2008;19:385–397. doi:10.1007/s00198-007-0543-5 | Springer PDF (includes the Appendix with the equations) |
| S4 | Kanis JA, Johansson H, Harvey NC, McCloskey EV. A brief history of FRAX. *Arch Osteoporos* 2018;13:118. doi:10.1007/s11657-018-0510-0 | https://pmc.ncbi.nlm.nih.gov/articles/PMC6290984/ |
| S5 | Johansson H, Azizieh F, Al Ali N, et al. FRAX- vs. T-score-based intervention thresholds for osteoporosis. *Osteoporos Int* 2017;28:3099–3105 (Kuwait FRAX model) | https://pmc.ncbi.nlm.nih.gov/articles/PMC5881885/ (supplement tables A1–A2 could not be downloaded: NOT CONFIRMED) |
| S6 | Azizieh FY. Fractures in Kuwait: incidence and distribution. *Risk Manag Healthc Policy* 2017;10:117–125 | https://pmc.ncbi.nlm.nih.gov/articles/PMC5476756/ |
| S7 | Azizieh FY. Incidence of hip fracture in Kuwait: a national registry-based study. *Arch Osteoporos* 2015;10:40 | Abstract only (PubMed 26577246). Full text paywalled. |
| S8 | Chakhtoura M, et al. Systematic review of major osteoporotic fracture to hip fracture incidence rate ratios worldwide: implications for FRAX-derived estimates. *J Bone Miner Res* 2021;36:1942–1956 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8531513/ |
| S9 | Leslie WD, Lix LM, Wu X. Competing mortality and fracture risk assessment. *Osteoporos Int* 2013;24:681–688 | Abstract only (PubMed 22736068) |
| S10 | Kanis JA, et al. Guidance for the adjustment of FRAX according to the dose of glucocorticoids. *Osteoporos Int* 2011;22:809–816 | Abstract only (PubMed 21229233) |
| S11 | Johnell O, et al. Predictive value of BMD for hip and other fractures. *J Bone Miner Res* 2005;20:1185–1194 | Abstract only (PubMed 15940371); its tables are reproduced in S1 |
| S12 | De Laet C, et al. Body mass index as a predictor of fracture risk: a meta-analysis. *Osteoporos Int* 2005;16:1330–1338 | Abstract only (PubMed 15928804); its tables are reproduced in S1 |
| S13 | Oden A, et al. Lifetime risk of hip fractures is underestimated. *Osteoporos Int* 1998;8:599–603; Kanis JA, et al. Ten year probabilities of osteoporotic fractures according to BMD and diagnostic thresholds. *Osteoporos Int* 2001;12:989–995; Kanis JA, et al. Long-term risk of osteoporotic fracture in Malmö. *Osteoporos Int* 2000;11:669–674 | Abstracts only (PubMed 10326067, 11846333, 11095169) |
| S14 | Allbritton-King JD, Elrod JK, Rosenberg PS, Bhattacharyya T. Reverse engineering the FRAX algorithm. *Bone* 2022;159:116376 | https://pmc.ncbi.nlm.nih.gov/articles/PMC9035136 (read by a helper agent) |
| S15 | Li C-C, et al. Decomposing and simplifying the Fracture Risk Assessment Tool — a module from the Taiwan-specific calculator. *JBMR Plus* 2024;8(5):ziae039 | https://pmc.ncbi.nlm.nih.gov/articles/PMC11032218/ (read by a helper agent) |
| S16 | Leslie WD, Berger C, Langsetmo L, et al. Construction and validation of a simplified fracture risk assessment tool for Canadian women and men (CAROC). *Osteoporos Int* 2011;22:1873–1883 | Abstract only (read by a helper agent) |
| S17 | Lo JC, Pressman AR, Chandra M, Ettinger B. Fracture risk tool validation in an integrated healthcare delivery system. *Am J Manag Care* 2011;17:188–194 (FORE calculator) | https://www.ajmc.com/view/ajmc_11mar_lo_188to194 (read by a helper agent) |

The underlying meta-analyses (family history Bone 2004;35:1029; corticosteroids JBMR 2004;19:893; prior fracture Bone 2004;35:375; smoking Osteoporos Int 2005; alcohol Osteoporos Int 2005;16:737; BMI S12; BMD S11) are paywalled. Their key tables are reproduced in S1, Section 5, and I copied the numbers from S1. Note: S1 cites the smoking paper as *Osteoporos Int* 2005;16:155–162, while S2 and S3 cite it as 16:222–228.

---

## (a) Model structure and equations

### a1. What FRAX outputs [PUBLISHED]

- Two outputs: 10-year probability of a **major osteoporotic fracture (MOF)** = first fracture of hip, clinical spine, proximal humerus (shoulder) or forearm (wrist); and 10-year probability of **hip fracture**. S1 p. 196 (PDF p. 198); S3 p. 388.
- **Four models** were built: hip fracture with BMD, hip fracture without BMD, "other major osteoporotic fractures" (clinical spine, forearm, proximal humerus, i.e. *excluding hip*) with BMD, and the same without BMD. S1 §7.5.1 p. 189; S3 p. 387; S4 ("The model").
- "For each model, fracture and death as continuous hazard functions were computed using a Poisson regression." S1 p. 189; S3 p. 387. S4 calls it "a modified Poisson regression approach".

### a2. The hazard function [PUBLISHED]

S3 Appendix p. 394:

> "The estimated hazard functions were of the form exp(β0 + β1·x1 + … + βk·xk), where the betas were coefficients and x1, …, xk were the values of the variables. The hazard functions were estimated as continuous functions by Poisson regression."

- One Poisson regression per cohort, men and women together, sex as a variable (S3 p. 394). (S2 p. 1039 says analyses were done for both sexes separately; S3 Appendix says men and women were included together with sex as a variable.)
- Interactions with time, age or sex are included (S3 p. 394).
- **Time-varying coefficient** (S1 §6.3.1 p. 154, PDF p. 156): "the linear combination can contain expressions like β1·x1 + β2·x1·t = (β1 + β2·t)·x1. We can consider (β1 + β2·t) as a time-dependent beta coefficient of x1."
- **Piecewise-linear term** (used for BMI) (S1 p. 154–155): "exchange a simple expression of the form β1·x with b1·min(x, g) + β2·max(x−g, 0) … The number g (for example, a specific value for BMI) is a limit chosen somewhere in the range of the risk variable." The value of g used in FRAX is **NOT CONFIRMED** (not published). S1 p. 101 notes an "inflection point" of risk at about 22 kg/m².
- **Merging cohorts** (S3 p. 394): "Let var_i denote the variance of β_i, and s = Σ(β_i/var_i), z = Σ(1/var_i). Then the merged beta was β = s/z, and the standard deviation SD of β was SD = √(1/z)." (Fixed-effects, inverse-variance weights; S1 p. 93.)

### a3. Interaction terms kept in the final models [PUBLISHED]

- S1 §7.5.1 p. 190: "(age·sex), (BMD·age); (BMD·BMD); (prior fracture·age); (BMI·BMI); and (age·age)". BMI·age was tested and **dropped** from the fracture hazards. BMD·age was kept in both the hip and the other-fracture model "though this fell short of significance in the model for other osteoporotic fractures (p=0.074)".
- S2 p. 1039 lists the retained interactions as: "age·sex, BMD·age, BMD·BMD, **family history·age**, prior fracture·age, BMI·BMI, and age·age". (S2 adds family history·age; S1 does not list it.)
- "Interactions that were significant for hip fracture risk were also entered in the model for other osteoporotic fractures, and also included in the model for death." (S1 p. 190; S3 p. 387.)
- Significance grid of each interaction (S1 Table 7.13, p. 191, PDF p. 193), "++" = p<0.05, "+" = 0.05<p<0.1, "-" = p>0.1, na = not applicable. Columns: BMD | Age | Variable·itself | Sex | Time.

| Risk factor | Hip: BMD | Age | Var | Sex | Time | Any OP: BMD | Age | Var | Sex | Time | OP excl. hip: BMD | Age | Var | Sex | Time |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BMI | - | - | ++ | - | ++ | - | ++ | - | - | + | - | ++ | - | - | - |
| Prior fracture | - | ++ | na | - | - | - | + | na | - | + | - | - | na | - | - |
| Age | ++ | ++ | ++ | - | ++ | ++ | - | - | ++ | - | ++ | na | - | ++ | - |
| Corticosteroids | - | - | na | - | - | + | + | na | - | - | - | - | na | - | + |
| Family history | - | - | na | - | - | - | + | na | - | + | - | ++ | na | - | - |
| Smoking | - | - | na | - | - | - | - | na | - | - | - | - | na | - | - |
| Rheumatoid arthritis | - | - | na | - | - | - | - | na | - | - | ++ | - | na | - | - |
| BMD | - | ++ | - | - | - | ++ | ++ | ++ | - | - | ++ | ++ | ++ | - | - |
| Alcohol | - | - | na | - | - | - | - | na | - | + | - | - | na | - | - |

### a4. Calibration to a country [PUBLISHED, S3 Appendix p. 394]

> "By considering all variables except age, a risk score was calculated by multiplying each variable by the corresponding beta coefficient and adding the products. The hazard functions are then calibrated to a specified country so that the relative importance of the variables except age is preserved, but the mean hazard function (mean taken over all values of the risk score) equals the mean risk of the country. The adjusted hazard function is a product between three factors. The first factor is the natural number e to the linear combination obtained from the cohorts, i.e., e to the risk score. The second factor is calculated from the general fracture risk among the general population … The third factor is a normalising factor making the mean risk equal to the second factor for each age. Let us denote the third factor z(age). If a random variable Y has a normal distribution with the mean μ and standard deviation σ then the expected value E[exp(Y)] = exp(μ+σ²/2). In this application Y is a risk score. By linear regression (in the simplest case) we determine E[Y | age] = a + b × age and the standard deviation σ around the regression line. Then the third factor z(age), the calibrating one, can be put equal to 1/exp(a + b × age + σ²/2)."

Written as one formula [INFERRED from the quote above]:

```
h_person(age) = λ_country(age, sex) × exp(Y_person) / exp(a + b·age + σ²/2)
```

- λ_country = national incidence of (first) hip fracture, or of (first) other major fracture, by age and sex.
- Y_person = the person's risk score (all variables except age).
- a, b, σ = the regression of the risk score on age in the *source population*. **The values of a, b and σ are NOT CONFIRMED (not published).**
- The same three-factor structure is used for the death hazard d(age): national mortality × exp(death risk score) × normaliser. (S3 says the death hazard is computed and calibrated "as detailed in the Appendix"; S1 p. 194 says "The hazard functions of fracture and death are applied to specific populations".)

**[MY CALCULATION] check of the normaliser using S1 Annex 1.** For a single normal risk score with gradient of risk GR per SD, Y = −ln(GR)·Z and σ = ln(GR), so a person at the mean (Z = 0) should get exp(−ln(GR)²/2) times the population hazard. S1 Table A1.2 (UK women, PDF p. 294): 10-year hip probability at age 65 = 3.7% (GR 1.00) and 3.4% at Z = 0 with GR 1.50. 3.7 × exp(−(ln 1.5)²/2) = 3.7 × 0.921 = 3.41. Women age 70, GR 1.25, Z = 0: 6.0 × 0.975 = 5.85 vs table 5.9. Men age 80, GR 1.50 (Table A1.1, PDF p. 291): 5.0 × 0.921 = 4.61 vs table 4.6. The published tables follow this rule.

### a5. From hazards to 10-year probability [PUBLISHED, S3 Appendix p. 395]

> "let h(t) denote the hip fracture hazard function, d(t) the death hazard function and g(t) the hazard function of the combined event hip fracture or death. … The hazard function g of having the first event of death or hip fracture is well approximated … by d + h. … the probability of being free from any of the two types of events at the end of the period (0,t) is exp(−∫₀ᵗ g(u)du). The probability p of a hip fracture event before t is, therefore, given by"

```
p = ∫₀ᵗ h(v) · exp( −∫₀ᵛ g(u) du ) dv
  ≈ ∫₀ᵗ h(v) · exp( −∫₀ᵛ ( h(u) + d(u) ) du ) dv          with t = 10 years
```

> "g(x) is somewhat less than the sum of the two functions because when a hip fracture causes death, both will contribute to the right side of the relationship but only the hip fracture to the left side, so the approximation gives an underestimation of the probability."

- Time inside the 10 years: the hazard is a function of age (age increases as t increases) and of time since baseline (the β(t) terms). S1 §6.3.1 p. 153: "The hazard function is a function of at least one type of time parameter (e.g. time since start of follow-up, age, calendar time)".
- **Time step**: FRAX hazards are "continuous functions" (S3 p. 393: "Such hazard functions are continuous as a function of time, unlike Cox's regression"). The numerical integration step used in the FRAX software is **NOT CONFIRMED**. The earlier Malmö/Sweden work computed "future mortality rates … for each year of age from Poisson models" (S13 abstracts).
- **MOF probability**: S1 and S3 do not print the MOF equation. [INFERRED] The same integral with h(v) = hazard of first hip fracture + hazard of first other major fracture, each from its own model and calibrated to its own national incidence, competing with death. S4 states the target quantity: "the metric of interest was the incidence of a first major fracture whether this be at the hip, spine, humerus or forearm."
- Why FRAX uses death as a competing risk (S3 p. 393): "in a study of men followed after orchidectomy, the cumulative incidence of fractures was 19% after 15 years, but the figure was 40% when deaths were considered as a competing event". (S3 wording: probability is "markedly underestimated" if death is ignored; S9 shows the reverse effect for observed-risk methods, see section d.)

### a6. Inputs and how they enter [PUBLISHED]

| Input | How it enters | Source |
|---|---|---|
| Age | Continuous; age·age and age·sex terms; hazards change with age over the 10 years | S1 p. 190 |
| Sex | Variable in the model; age·sex term | S3 p. 394 |
| BMI | Continuous, from weight and height; piecewise (min/max) form and BMI·BMI term; "the change of risk was allowed to have a different increase or decrease below or above a pre specified limit" | S3 p. 394; S1 p. 154–155 |
| Prior fragility fracture (incl. morphometric vertebral) | Yes/no; prior fracture·age term | S1 p. 191, 196 |
| Parental history of hip fracture | Yes/no; family history·age term in S2 | S1 p. 192; S2 p. 1039 |
| Current smoking | Yes/no | S1 p. 192 |
| Ever long-term oral glucocorticoids | Yes/no (no dose) | S1 p. 192, 196 |
| Rheumatoid arthritis | Yes/no; counted with and without BMD | S1 p. 197 |
| Other secondary osteoporosis | Yes/no; uses the **same β as rheumatoid arthritis**, but **only when BMD is not entered** and only if RA = no | S1 p. 197; S3 p. 387–388 |
| Alcohol ≥3 units/day (">2 units daily") | Yes/no. S1 defines a unit as 10 g ethanol (8 g in the UK) | S1 p. 117, 196 |
| Femoral neck BMD | Optional; entered as T-score or Z-score; continuous; BMD·age and BMD·BMD terms | S1 p. 197 |
| Missing yes/no answer | "If any of the fields for dichotomous variables is not completed, a negative response is assumed." | S1 p. 196; S3 p. 388 |
| Age range | S1 (2007 draft tool): "age (41 to 87 years)"; S3: "age (50 to 90 years)"; S5 (Kuwait, 2017) reports ages 40 to 90 | S1 p. 195; S3 p. 387; S5 Table 1 |

**Z-score to T-score conversion (women, femoral neck, NHANES III)** [PUBLISHED, S1 p. 197, PDF p. 199]:

```
T = c0 + c1·Z + c2·age + c3·Z·age
women < 55 years:  c0 = 0.892,  c1 = 0.984,  c2 = -0.034,  c3 = 0.0007
women ≥ 55 years:  c0 = 1.6617, c1 = 1.2658, c2 = -0.0480, c3 = -0.0044
```

S3 p. 388: "The transformation of Z- to T-score and vice versa is derived for the NHANES III database for female Caucasians aged 20–29 years" (the female reference is also used for men). Constants for men: **NOT CONFIRMED**. NHANES III mean and SD in g/cm²: **NOT CONFIRMED**; S1 p. 65 gives only "The threshold for diagnosing osteoporosis using DXA at the femoral neck is 0.577 g/cm² derived from the young white female population aged 20–29 years using the Hologic device."

### a7. Gradient of risk and AUC [PUBLISHED, S2 Appendix p. 1044]

```
GR = exp(β1·σ) = exp(Δ/σ)          ln(GR) = Δ/σ
AUC = Φ( ln(GR) / √2 )
```

[MY CALCULATION] Φ(ln 4.23/√2) = 0.846, Φ(ln 1.44/√2) = 0.602, Φ(ln 2.91/√2) = 0.775, Φ(ln 1.84/√2) = 0.667. These match the published AUCs (84%, 60%, 0.78, 0.67).

### a8. Country epidemiology [PUBLISHED]

- Death hazard: "For all countries, the risk of death was taken from United Nations estimates for 1999, except for the United States where the National Vital Statistics reports were used for 2001" (S1 p. 195, 2007 version). S1 Annexes use UN World Population Prospects 2002 revision (S1 p. 288).
- Hip fracture: national data where possible. Other major fractures: where only hip data exist, FRAX assumes the Swedish (Malmö) ratio of other fractures to hip fracture. S3 p. 387: "the clinical vertebral fracture incidence was calculated by assuming that the ratio of clinical vertebral fracture to hip fracture would be similar in the UK compared to Sweden". S4: "Olof Johnell characterised the incidence of a first major fracture from detailed information from all fracture cases in Malmo, Sweden. From this, correction factors were derived to adjust the more usual estimates of age and sex specific incidence of hip fracture available in other regions of the world to provide estimates for the MOF incidence." S8 (Introduction): "In almost all other countries where MOF rates are not available, FRAX uses country specific hip fracture data and assumes the MOF/Hip fracture ratio is the same worldwide as in Malmo, Sweden."
- The Malmö correction factors themselves are **NOT CONFIRMED as a table**. S8 says: "We were unable to compare the derived IRRs to those from Malmo Sweden, due to the unavailability of number of fractures by age and gender specific categories."
- Published Swedish incidence per 100 000 per year (S1 Table 2.3, p. 21, PDF p. 23; source Kanis 2001 *Osteoporos Int* 12:417). Selected sites:

| Age | Men vertebra | Men prox. humerus | Men hip | Men distal forearm | Women vertebra | Women prox. humerus | Women hip | Women distal forearm |
|---|---|---|---|---|---|---|---|---|
| 50–54 | 195 | 65 | 42 | 101 | 161 | 124 | 41 | 417 |
| 55–59 | 119 | 31 | 68 | 151 | 158 | 127 | 91 | 456 |
| 60–64 | 226 | 60 | 134 | 140 | 303 | 126 | 181 | 568 |
| 65–69 | 242 | 92 | 274 | 282 | 439 | 352 | 387 | 691 |
| 70–74 | 499 | 207 | 495 | 89 | 778 | 384 | 817 | 904 |
| 75–79 | 619 | 179 | 940 | 175 | 1 111 | 629 | 1 689 | 1 032 |
| 80–84 | 933 | 235 | 1 923 | 259 | 1 163 | 585 | 3 364 | 1 208 |
| 85–89 | 1 194 | 505 | 3 241 | 323 | 1 641 | 1 120 | 5 183 | 1 387 |

- Overestimation (%) of *first* fracture rates from raw incidence, Sweden (S1 Table 6.7, p. 155, PDF p. 157):

| Age | Spine M | Spine W | Forearm M | Forearm W | Shoulder M | Shoulder W | Hip M | Hip W |
|---|---|---|---|---|---|---|---|---|
| 50–59 | 29 | 31 | 7 | 10 | 3 | 2 | 0 | 9 |
| 60–69 | 58 | 38 | 16 | 13 | 16 | 55 | 29 | 9 |
| 70–79 | 50 | 40 | 33 | 26 | 0 | 4 | 8 | 14 |
| 80–89 | 38 | 40 | 25 | 29 | 0 | 2 | 19 | 22 |

- Ten-year risk (%) of first fracture, Malmö population (S1 Table 6.10, p. 159, PDF p. 161; source Kanis 2000 Malmö). Columns M/W: forearm, hip, spine, proximal humerus, any of these.

| Age | Forearm M | W | Hip M | W | Spine M | W | Humerus M | W | Any M | Any W |
|---|---|---|---|---|---|---|---|---|---|---|
| 45 | 1.2 | 2.5 | 0.5 | 0.4 | 0.8 | 0.6 | 0.5 | 0.8 | 2.6 | 3.8 |
| 50 | 1.2 | 3.9 | 0.8 | 0.6 | 1.1 | 1.2 | 0.5 | 1.2 | 3.3 | 6.0 |
| 55 | 1.3 | 4.7 | 0.8 | 1.2 | 1.4 | 1.7 | 0.4 | 1.4 | 3.9 | 7.8 |
| 60 | 1.7 | 5.6 | 1.2 | 2.3 | 1.7 | 2.7 | 0.7 | 2.3 | 4.9 | 10.6 |
| 65 | 1.5 | 6.5 | 2.1 | 3.9 | 2.1 | 4.3 | 1.3 | 3.4 | 5.9 | 14.3 |
| 70 | 0.9 | 7.2 | 3.4 | 7.3 | 3.1 | 5.9 | 1.5 | 4.4 | 7.6 | 18.9 |
| 75 | 1.2 | 7.6 | 5.9 | 11.7 | 3.8 | 6.5 | 1.5 | 5.0 | 10.4 | 22.9 |
| 80 | 1.4 | 7.3 | 7.6 | 15.5 | 4.4 | 6.9 | 1.9 | 5.6 | 13.1 | 26.5 |
| 85 | 1.1 | 6.0 | 7.1 | 16.1 | 4.0 | 6.8 | 2.3 | 6.3 | 13.1 | 27.0 |
| 90 | 0.8 | 4.3 | 6.2 | 12.4 | 1.4 | 5.0 | 2.1 | 5.8 | 10.3 | 21.4 |
| 95 | 1.3 | 2.8 | 5.2 | 8.0 | 0.1 | 2.6 | 1.3 | 3.9 | 8.3 | 13.9 |

---

## (b) Risk ratios of the clinical risk factors (with age dependence)

Important: these are the **meta-analysis** risk ratios (one factor at a time, adjusted for age and time, and for BMD where stated). The **final FRAX β coefficients** (all factors together, with interactions) were **never published** (see section f). S1 p. 191: "When one dichotomous variable (e.g. smoking) was deleted from the model, this had a very minor effect on the b coefficients for the other variables." Men and women are combined unless stated.

"Osteoporotic fracture" (OP) in Section 5 of S1 **includes hip**. The FRAX "other osteoporotic fracture" model **excludes hip** (S1 p. 192). Table b9 gives the excluding-hip values.

### b1. Summary RR, hip fracture (S1 Table 5.24, p. 122, PDF p. 124)

| Risk indicator | Without BMD RR (95% CI) | With BMD RR (95% CI) |
|---|---|---|
| BMI 20 vs 25 kg/m² | 1.95 (1.71–2.22) | 1.42 (1.23–1.65) |
| BMI 30 vs 25 kg/m² | 0.83 (0.69–0.99) | 1.00 (0.82–1.21) |
| Prior fracture after 50 years | 1.85 (1.58–2.17) | 1.62 (1.30–2.01) |
| Parental history of hip fracture | 2.27 (1.47–3.49) | 2.28 (1.48–3.51) |
| Current smoking | 1.84 (1.52–2.22) | 1.60 (1.27–2.02) |
| Ever use of systemic corticosteroids | 2.31 (1.67–3.20) | 2.25 (1.60–3.15) |
| Alcohol intake 3+ units daily | 1.68 (1.19–2.36) | 1.70 (1.20–2.42) |
| Rheumatoid arthritis | 1.95 (1.11–3.42) | 1.73 (0.94–3.20) |

### b2. Summary RR, any osteoporotic fracture incl. hip (S1 Table 5.23, p. 121, PDF p. 123)

| Risk indicator | Without BMD | With BMD |
|---|---|---|
| BMI 20 vs 25 | 1.27 (1.16–1.38) | 1.02 (0.92–1.13) |
| BMI 30 vs 25 | 0.89 (0.81–0.98) | 0.96 (0.86–1.08) |
| Prior fracture after 50 years | 1.86 (1.72–2.01) | 1.76 (1.60–1.93) |
| Parental history of hip fracture | 1.54 (1.25–1.88) | 1.54 (1.25–1.88) |
| Current smoking | 1.29 (1.17–1.43) | 1.13 (1.00–1.28) |
| Ever use of systemic corticosteroids | 1.65 (1.42–1.90) | 1.66 (1.42–1.92) |
| Alcohol intake 3+ units daily | 1.38 (1.16–1.65) | 1.36 (1.13–1.63) |
| Rheumatoid arthritis | 1.56 (1.20–2.02) | 1.47 (1.12–1.92) |

### b3. Summary RR, osteoporotic fracture OTHER THAN hip (S1 Table 5.26, p. 123, PDF p. 125)

| Risk indicator | Without BMD | With BMD |
|---|---|---|
| BMI 20 vs 25 | 1.07 (0.96–1.20) | 1.07 (0.95–1.22) |
| BMI 30 vs 25 | 0.98 (0.89–1.09) | 0.90 (0.80–1.02) |
| Prior fracture after 50 years | 1.92 (1.75–2.10) | 1.78 (1.59–1.99) |
| Parental history of hip fracture | 1.52 (1.21–1.91) | 1.51 (1.20–1.91) |
| Current smoking | 1.16 (1.03–1.31) | 1.03 (0.89–1.20) |
| Ever use of systemic corticosteroids | 1.55 (1.30–1.84) | 1.56 (1.27–1.90) |
| Alcohol intake 3+ units daily | 1.24 (1.01–1.53) | 1.19 (0.96–1.49) |
| Rheumatoid arthritis | 1.48 (1.09–2.02) | 1.42 (1.03–1.95) |

### b4. Prior fracture by age (S1 Table 5.10, p. 105, PDF p. 107; source Kanis Bone 2004 Tables 5–6)

| Age | Any fracture, no BMD | Any fracture, with BMD | Hip, no BMD | Hip, with BMD |
|---|---|---|---|---|
| 50 | 1.92 (1.63–2.20) | 1.91 (1.59–2.29) | 5.04 (2.66–9.56) | 3.88 (1.79–8.43) |
| 55 | 1.90 (1.73–2.09) | 1.83 (1.60–2.10) | 4.20 (2.46–7.15) | 3.98 (2.08–7.62) |
| 60 | 1.98 (1.80–2.18) | 1.94 (1.73–2.17) | 3.40 (2.21–5.24) | 3.16 (1.88–5.32) |
| 65 | 2.02 (1.86–2.20) | 1.99 (1.81–2.20) | 2.60 (1.85–3.64) | 2.28 (1.52–3.41) |
| 70 | 2.03 (1.87–2.21) | 1.98 (1.79–2.18) | 2.31 (1.76–3.02) | 1.90 (1.37–2.65) |
| 75 | 1.96 (1.80–2.13) | 1.82 (1.65–2.02) | 2.14 (1.71–2.68) | 1.64 (1.24–2.17) |
| 80 | 1.88 (1.72–2.06) | 1.72 (1.54–1.91) | 1.90 (1.58–2.28) | 1.41 (1.12–1.78) |
| 85 | 1.83 (1.65–2.04) | 1.72 (1.51–1.96) | 1.66 (1.39–1.98) | 1.32 (1.04–1.68) |
| All ages | 1.86 (1.75–1.98) | 1.77 (1.64–1.91) | 1.85 (1.58–2.17) | 1.62 (1.30–2.01) |

Prior fracture by sex (S1 Table 5.9, p. 104, PDF p. 106):

| Outcome | Men no BMD | Women no BMD | M+W no BMD | Men with BMD | Women with BMD | M+W with BMD |
|---|---|---|---|---|---|---|
| Any | 2.02 (1.73–2.38) | 1.84 (1.72–1.96) | 1.86 (1.75–1.98) | 2.04 (1.67–2.48) | 1.73 (1.59–1.88) | 1.77 (1.64–1.91) |
| Osteoporotic | 1.93 (1.61–2.33) | 1.85 (1.70–2.01) | 1.86 (1.72–2.01) | 1.91 (1.50–2.43) | 1.74 (1.57–1.92) | 1.76 (1.60–1.93) |
| Hip | 2.30 (1.56–3.41) | 1.77 (1.49–2.11) | 1.85 (1.58–2.17) | 1.97 (1.12–3.48) | 1.56 (1.23–1.98) | 1.62 (1.30–2.01) |

Text (S1 p. 104): for hip fracture, risk ratios "decreased … by about 10% per decade of age"; "p<0.002 for the interaction term". For OP fracture, risk ratios "relatively constant with age". The age-specific OP-fracture values are only in Fig. 5.6 (figure, numbers NOT CONFIRMED).

### b5. Glucocorticoids (ever use) by age, **adjusted for BMD** (S1 Table 5.11, p. 107, PDF p. 109; source Kanis JBMR 2004 Table 3)

| Age | Any fracture | Osteoporotic fracture | Hip fracture |
|---|---|---|---|
| 50 | 1.98 (1.35–2.92) | 2.63 (1.68–4.13) | 4.42 (1.26–15.49) |
| 55 | 1.83 (1.35–2.47) | 2.32 (1.63–3.30) | 4.15 (1.50–11.49) |
| 60 | 1.67 (1.33–2.09) | 2.00 (1.52–2.62) | 3.71 (1.67–8.23) |
| 65 | 1.56 (1.29–1.88) | 1.81 (1.43–2.27) | 2.98 (1.55–5.74) |
| 70 | 1.55 (1.30–1.86) | 1.76 (1.42–2.19) | 2.44 (1.37–4.36) |
| 75 | 1.64 (1.37–1.97) | 1.70 (1.36–2.11) | 2.22 (1.35–3.63) |
| 80 | 1.62 (1.31–2.00) | 1.59 (1.26–2.02) | 2.13 (1.39–3.27) |
| 85 | 1.66 (1.26–2.17) | 1.71 (1.29–2.28) | 2.48 (1.58–3.89) |
| All ages | 1.57 (1.37–1.80) | 1.66 (1.42–1.92) | 2.25 (1.60–3.15) |
| All ages (vs population risk) | 1.53 | 1.61 | 2.13 |

Text (S1 p. 107–108): the S1 table title says "adjusted for bone mineral density", while the footnote "a" says "Ever use versus no use". "relative risk at 50 years with and without BMD in the model was 2.54 and 2.63, respectively" (OP fracture; note 2.63 is printed in the table that is titled "adjusted for BMD", so the title and text disagree — flagged). For hip fracture "When BMD was excluded from the model, the risk ratio was lower up to the age of 75 years (Fig. 5.7)"; the without-BMD hip values by age are in the figure only (NOT CONFIRMED). Age trends were "not significantly" different.

### b6. Parental history of hip fracture by age, no BMD (S1 Table 5.15, p. 112, PDF p. 114; source Kanis Bone 2004 Table 6)

| Age | Osteoporotic fracture | Hip fracture |
|---|---|---|
| 50 | 1.80 (1.19–2.72) | 2.34 (0.64–8.52) |
| 55 | 1.66 (1.21–2.30) | 2.36 (0.81–6.90) |
| 60 | 1.56 (1.22–1.98) | 2.41 (1.03–5.64) |
| 65 | 1.50 (1.23–1.82) | 2.44 (1.27–4.68) |
| 70 | 1.47 (1.21–1.77) | 2.57 (1.53–4.30) |
| 75 | 1.31 (1.07–1.61) | 1.75 (1.08–2.82) |
| 80 | 1.14 (0.91–1.44) | 1.26 (0.82–1.94) |
| 85 | 1.14 (0.86–1.51) | 1.33 (0.87–2.02) |

Parental history of **any** fracture by age (S1 Table 5.14, PDF p. 114) — not the FRAX input, but shown for completeness:

| Age | OP fracture | Hip fracture |
|---|---|---|
| 50 | 1.31 (1.02–1.69) | 1.63 (0.69–3.86) |
| 55 | 1.29 (1.05–1.59) | 1.73 (0.84–3.58) |
| 60 | 1.28 (1.08–1.51) | 1.82 (1.01–3.27) |
| 65 | 1.27 (1.11–1.46) | 1.86 (1.17–2.96) |
| 70 | 1.25 (1.10–1.42) | 1.79 (1.24–2.57) |
| 75 | 1.20 (1.06–1.35) | 1.53 (1.14–2.07) |
| 80 | 1.12 (0.98–1.28) | 1.35 (1.04–1.75) |
| 85 | 1.08 (0.91–1.27) | 1.31 (0.99–1.73) |

Overall (S1 Table 5.13, PDF p. 113), without / with BMD: parental hip fracture → any 1.42 (1.19–1.71) / 1.41 (1.17–1.71); OP 1.54 (1.25–1.88) / 1.54 (1.25–1.88); hip 2.27 (1.47–3.49) / 2.28 (1.48–3.51). Parental any fracture → any 1.18 / 1.18; OP 1.22 / 1.22; hip 1.63 / 1.63. Prevalence (S1 p. 110): maternal, paternal, sibling history of hip fracture 6%, 4%, 2%.

### b7. Current smoking by age (S1 Table 5.17, p. 115, PDF p. 117; source Kanis Osteoporos Int 2005 Table 5)

| Age | OP fracture no BMD | OP fracture with BMD | Hip no BMD | Hip with BMD |
|---|---|---|---|---|
| 50 | 1.05 (0.80–1.37) | 0.82 (0.57–1.18) | 2.52 (1.24–5.10) | 2.28 (0.94–5.51) |
| 55 | 1.06 (0.86–1.30) | 0.85 (0.65–1.12) | 2.35 (1.32–4.19) | 2.09 (1.03–4.24) |
| 60 | 1.08 (0.92–1.26) | 0.88 (0.72–1.08) | 2.17 (1.38–3.44) | 1.87 (1.07–3.25) |
| 65 | 1.14 (1.00–1.30) | 0.91 (0.76–1.09) | 1.98 (1.38–2.86) | 1.68 (1.07–2.65) |
| 70 | 1.27 (1.12–1.45) | 1.01 (0.85–1.20) | 1.92 (1.42–2.60) | 1.69 (1.15–2.48) |
| 75 | 1.45 (1.28–1.65) | 1.20 (1.01–1.43) | 1.94 (1.52–2.49) | 1.76 (1.30–2.37) |
| 80 | 1.54 (1.34–1.77) | 1.30 (1.08–1.57) | 1.91 (1.55–2.35) | 1.69 (1.31–2.19) |
| 85 | 1.52 (1.28–1.80) | 1.28 (1.00–1.63) | 1.80 (1.43–2.26) | 1.57 (1.16–2.13) |

Smoking by sex (S1 Table 5.16, PDF p. 116), RR / RR adjusted for BMD: Any fracture M 1.50 / 1.49, F 1.18 / 1.02, M+F 1.25 / 1.13. Osteoporotic M 1.53 / 1.54, F 1.20 / 1.01, M+F 1.29 / 1.13. Hip M 1.82 / 1.69, F 1.85 / 1.55, M+F 1.84 / 1.60. "For any fracture and for osteoporotic fracture, the risk in smokers was significantly higher in men than in women" (S1 p. 114). The final FRAX model has no smoking·sex term in S1's retained list.

Smoking with other adjustments (S1 Table 5.18, PDF p. 118), RR any / OP / hip: age only 1.25 / 1.29 / 1.84; age+BMD 1.13 / 1.13 / 1.60; age+BMI 1.19 / 1.21 / 1.65; age+BMI+BMD 1.12 / 1.11 / 1.55.

### b8. Alcohol (S1 Tables 5.19–5.21, PDF p. 120 and 122; source Kanis Osteoporos Int 2005;16:737)

By intake, reference 1 unit/day (Table 5.19):

| Units/day | Men OP | Men hip | Women OP | Women hip |
|---|---|---|---|---|
| 0 | 1.06 (0.83–1.34) | 0.94 (0.58–1.54) | 0.96 (0.85–1.08) | 0.98 (0.75–1.27) |
| 1 | 1.00 | 1.00 | 1.00 | 1.00 |
| 2 | 1.05 (0.92–1.20) | 1.21 (0.92–1.59) | 1.07 (0.99–1.16) | 1.09 (0.91–1.29) |
| 3 | 1.38 (0.87–2.18) | 1.91 (1.21–3.03) | 1.20 (0.91–1.58) | 1.33 (1.01–1.75) |
| 4 | 1.81 (1.24–2.64) | 2.84 (1.21–6.64) | 1.38 (1.12–1.69) | 1.72 (1.08–2.73) |

Dichotomised, men and women combined (Table 5.20), without BMD / with BMD:

| Cut-off | Any fracture | Any OP fracture | Hip fracture |
|---|---|---|---|
| >2 units/day | 1.23 (1.06–1.43) / 1.24 (1.06–1.45) | 1.38 (1.16–1.65) / 1.36 (1.13–1.63) | 1.68 (1.19–2.36) / 1.70 (1.20–2.42) |
| >3 | 1.33 (1.10–1.60) / 1.34 (1.11–1.62) | 1.55 (1.26–1.92) / 1.53 (1.23–1.91) | 1.92 (1.28–2.88) / 2.05 (1.35–3.11) |
| >4 | 1.51 (1.20–1.91) / 1.51 (1.19–1.93) | 1.70 (1.30–2.22) / 1.64 (1.24–2.17) | 2.26 (1.35–3.79) / 2.39 (1.39–4.09) |

No age effect is reported for alcohol (S1 Table 5.25: alcohol·age "–").

### b9. Rheumatoid arthritis (S1 Table 5.22, p. 121, PDF p. 123)

| Model | Any fracture | Any OP fracture | Hip fracture |
|---|---|---|---|
| Base case | 1.45 (1.16–1.80) | 1.56 (1.20–2.02) | 1.95 (1.11–3.42) |
| + BMD | 1.38 (1.10–1.73) | 1.47 (1.12–1.92) | 1.73 (0.94–3.20) |
| + glucocorticoids | 1.38 (1.11–1.72) | 1.46 (1.12–1.90) | 1.76 (0.97–3.19) |
| + glucocorticoids + BMD | 1.30 (1.03–1.64) | 1.35 (1.02–1.77) | 1.46 (0.75–2.83) |
| + prior fracture | 1.40 (1.12–1.73) | 1.49 (1.15–1.94) | 1.85 (1.05–3.26) |
| + prior fracture + BMD | 1.36 (1.08–1.71) | 1.45 (1.11–1.91) | 1.71 (0.93–3.17) |

No age-specific RA values were published in the original series (S1 Table 5.25: RA·age "–").

### b10. Combined performance of FRAX risk scores by age (S2 Table 3, p. 1040; same in S1 Table 7.14)

Gradient of risk per SD of the risk score (95% CI):

| Age | Hip: BMD only | Hip: CRFs alone | Hip: CRFs + BMD | Other OP: BMD only | Other OP: CRFs alone | Other OP: CRFs + BMD |
|---|---|---|---|---|---|---|
| 50 | 3.68 (2.61–5.19) | 2.05 (1.58–2.65) | 4.23 (3.12–5.73) | 1.19 (1.05–1.34) | 1.41 (1.28–1.56) | 1.44 (1.30–1.59) |
| 60 | 3.07 (2.42–3.89) | 1.95 (1.63–2.33) | 3.51 (2.85–4.33) | 1.28 (1.18–1.39) | 1.48 (1.39–1.58) | 1.52 (1.42–1.62) |
| 70 | 2.78 (2.39–3.23) | 1.84 (1.65–2.05) | 2.91 (2.56–3.31) | 1.39 (1.30–1.48) | 1.55 (1.48–1.62) | 1.61 (1.54–1.68) |
| 80 | 2.28 (2.09–2.50) | 1.75 (1.62–1.90) | 2.42 (2.18–2.69) | 1.54 (1.44–1.65) | 1.63 (1.54–1.72) | 1.71 (1.62–1.80) |
| 90 | 1.70 (1.50–1.93) | 1.66 (1.47–1.87) | 2.02 (1.71–2.38) | 1.56 (1.40–1.75) | 1.72 (1.58–1.88) | 1.81 (1.67–1.97) |

Correlation between CRF score and BMD: r = 0.25 (hip), r = 0.10 (other OP) (S2 p. 1042).

External validation, standardised to age 70 (S2 Table 4, p. 1041): original cohorts hip 1.84 [AUC 0.67] without BMD, 2.91 [0.78] with BMD; other OP 1.55 [0.62] and 1.61 [0.63]. Mean AUC in the 11 validation cohorts: hip 0.66 without BMD, 0.74 with BMD; other OP 0.60 and 0.62 (S2 p. 1042). Note: for WHI hip with BMD, S2 Table 4 prints 2.44 (1.85–3.21) [0.74] while S1 Table 7.22 prints 1.44 (0.74); S2 is probably correct, since an AUC of 0.74 matches a GR near 2.4, not 1.44 [MY CALCULATION: Φ(ln 2.44/√2) = 0.74].

### b11. Published FRAX outputs that can be used as test cases [PUBLISHED]

These are outputs of the real tool printed in papers (not scraped). They let a re-implementation be checked.

**Sweden, woman, BMI 24, no BMD, single risk factor** (S1 Table 7.15, p. 198, PDF p. 200):

| Age | None | Smoking | Alcohol | RA | Glucocorticoids | FH | Prior fracture |
|---|---|---|---|---|---|---|---|
| MOF 50 | 4.2 | 4.5 | 5.1 | 5.7 | 6.9 | 8.2 | 9.1 |
| MOF 60 | 7.7 | 8.4 | 9.4 | 10.6 | 12.7 | 14.4 | 15.6 |
| MOF 70 | 14.4 | 16.4 | 18.1 | 20.3 | 23.5 | 23.0 | 26.2 |
| MOF 80 | 25.9 | 29.1 | 32.8 | 36.3 | 38.2 | 46.8 | 39.1 |
| Hip 50 | 0.4 | 0.6 | 0.6 | 0.7 | 0.9 | 0.5 | 1.6 |
| Hip 60 | 1.3 | 2.0 | 2.0 | 2.3 | 2.8 | 1.7 | 3.8 |
| Hip 70 | 4.7 | 6.9 | 7.1 | 8.2 | 9.6 | 9.9 | 9.8 |
| Hip 80 | 13.1 | 17.8 | 19.2 | 21.8 | 23.4 | 37.8 | 19.6 |

(These are from the 2007 Swedish prototype. The FH hip value at 80 (37.8) looks unusually high but is copied as printed.)

**UK, BMI 25, no BMD, single risk factor** (S3 Table 2, p. 389):

| | MOF 50 | MOF 60 | MOF 70 | MOF 80 | Hip 50 | Hip 60 | Hip 70 | Hip 80 |
|---|---|---|---|---|---|---|---|---|
| Men, none | 2.8 | 3.9 | 5.7 | 7.2 | 0.1 | 0.4 | 1.3 | 3.4 |
| Men, parental hip fx | 5.5 | 7.6 | 9.1 | 15 | 0.2 | 0.6 | 2.8 | 11 |
| Men, current smoking | 2.8 | 4.1 | 5.9 | 7.5 | 0.2 | 0.7 | 1.8 | 4.2 |
| Men, alcohol >2 u/d | 3.3 | 4.7 | 7.1 | 9.5 | 0.2 | 0.7 | 2.0 | 5.1 |
| Men, RA | 3.7 | 5.3 | 8.0 | 11 | 0.2 | 0.8 | 2.3 | 5.8 |
| Men, oral GC | 4.4 | 6.1 | 8.5 | 10 | 0.3 | 0.9 | 2.4 | 5.5 |
| Men, prior fx | 5.8 | 7.9 | 11 | 12 | 0.5 | 1.3 | 2.7 | 5.2 |
| Women, none | 3.5 | 6.0 | 11 | 17 | 0.2 | 0.7 | 2.3 | 7.0 |
| Women, parental hip fx | 6.9 | 12 | 17 | 31 | 0.3 | 0.9 | 5.0 | 22 |
| Women, current smoking | 3.6 | 6.5 | 12 | 19 | 0.3 | 1.1 | 3.4 | 9.5 |
| Women, alcohol >2 u/d | 4.1 | 7.3 | 14 | 22 | 0.3 | 1.1 | 3.6 | 10 |
| Women, RA | 4.7 | 8.2 | 15 | 25 | 0.4 | 1.3 | 4.1 | 12 |
| Women, oral GC | 5.6 | 9.8 | 18 | 26 | 0.5 | 1.5 | 4.8 | 13 |
| Women, prior fx | 7.4 | 12 | 20 | 28 | 0.8 | 2.1 | 4.9 | 11 |

**UK, age 65, BMI 25, single risk factor, without BMD and at T = −2.5** (S3 Table 1, p. 389): columns Men MOF / Men hip / Women MOF / Women hip (no BMD) then the same at T = −2.5.

| | M MOF | M hip | W MOF | W hip | M MOF T−2.5 | M hip T−2.5 | W MOF T−2.5 | W hip T−2.5 |
|---|---|---|---|---|---|---|---|---|
| None | 4.9 | 0.8 | 8.6 | 1.3 | 9.8 | 3.6 | 12.4 | 3.0 |
| Parental hip fx | 9.3 | 1.0 | 16.0 | 1.7 | 16.5 | 3.7 | 22.1 | 3.2 |
| Current smoking | 5.1 | 1.1 | 9.2 | 1.9 | 11.0 | 5.6 | 13.7 | 5.1 |
| Alcohol >2 u/d | 6.0 | 1.2 | 10.4 | 2.0 | 12.5 | 5.4 | 15.4 | 4.6 |
| RA | 6.8 | 1.4 | 11.7 | 2.3 | 12.8 | 5.0 | 16.1 | 4.3 |
| Oral GC | 7.5 | 1.5 | 13.7 | 2.7 | 15.0 | 6.1 | 19.7 | 5.5 |
| Prior fragility fx | 9.6 | 1.9 | 16.4 | 3.2 | 16.0 | 5.9 | 20.2 | 5.0 |

**UK, BMI 25, no CRFs, by T-score** (S3 Table 3, p. 391), T = +1 / 0 / −1 / −2 / −3 / −4:

| Age | Hip men | Hip women | MOF men | MOF women |
|---|---|---|---|---|
| 50 | <0.1 / 0.1 / 0.4 / 1.3 / 4.7 / 16.0 | <0.1 / 0.1 / 0.2 / 0.8 / 3.2 / 11.7 | 2.5 / 2.7 / 3.5 / 5.1 / 9.2 / 20.9 | 3.0 / 3.3 / 3.8 / 5.2 / 8.5 / 17.7 |
| 60 | 0.1 / 0.2 / 0.6 / 1.9 / 5.6 / 15.6 | 0.1 / 0.2 / 0.4 / 1.4 / 4.4 / 13.5 | 3.0 / 3.5 / 4.5 / 6.8 / 11.5 / 22.2 | 4.2 / 4.8 / 5.6 / 7.9 / 12.6 / 23.0 |
| 70 | 0.2 / 0.5 / 1.1 / 2.6 / 5.9 / 12.9 | 0.1 / 0.4 / 0.9 / 2.4 / 6.3 / 16.2 | 3.6 / 4.3 / 5.5 / 8.2 / 12.8 / 20.9 | 5.6 / 6.8 / 8.4 / 11.5 / 18.2 / 30.4 |
| 80 | 0.6 / 1.1 / 1.9 / 3.4 / 6.1 / 10.7 | 0.5 / 1.0 / 2.1 / 4.4 / 9.5 / 19.7 | 3.2 / 4.0 / 5.2 / 7.6 / 11.3 / 16.9 | 5.8 / 7.5 / 10.1 / 13.8 / 21.7 / 34.3 |
| 90 | 1.2 / 1.8 / 2.5 / 3.8 / 5.6 / 8.3 | 1.2 / 2.0 / 3.5 / 5.8 / 9.8 / 16.9 | 3.1 / 3.9 / 5.1 / 6.9 / 9.7 / 13.5 | 5.1 / 7.1 / 9.9 / 13.8 / 20.0 / 30.3 |

Other published UK numbers (S3 p. 388–390): woman 65, BMI 25: hip 1.3% with no CRF; 1 CRF 1.7–3.2%; 2 CRFs 2.5–6.6%; 3, 4, 5 CRFs 3.8–11%, 6.7–17%, 13–24%; all six 30%. Woman 65 hip: 2.3% at BMI 20, 0.6% at BMI 40. MOF woman 65, BMI 25 with RA 12% vs 9% without. S1 Annexes 3–4 (PDF p. 310–337) give UK 10-year probabilities by age × T-score (or BMI) × number of CRFs (mean and range) for men and women — a large extra test set (not copied here; use the PDF).

**Sweden, BMI 24, no CRFs, T = −2.5** (S1 Table 7.16, PDF p. 201): age 50/55/60/65/70/75/80/85 → Men MOF 9.1/10.2/11.9/13.0/14.5/15.5/15.1/13.5; Men hip 4.3/4.8/5.5/6.0/7.2/8.8/8.8/7.3; Women MOF 8.2/9.8/12.5/14.9/18.2/21.3/24.1/23.6; Women hip 2.8/3.2/4.0/4.9/6.9/9.4/10.9/10.0.

**Sweden, women age 65, BMI effect** (S1 Table 7.17, PDF p. 201; with-BMD values at T = −2.7): BMI 16/18/20/22/24/26/28/30/32 → MOF without BMD 13.4/12.4/11.5/10.9/10.3/9.8/9.3/8.8/8.3; MOF with BMD 13.5/14.2/15.0/15.7/16.4/16.7/16.4/16.0/15.7; hip without BMD 6.1/4.8/3.8/3.0/2.3/2.0/1.8/1.6/1.5; hip with BMD 5.4/5.5/5.7/5.8/6.0/6.0/5.8/5.6/5.5.

**Kuwait** — see section K below.

---

## (c) BMI and BMD effects

### c1. BMD (femoral neck, DXA)

Per SD decrease in Z-score, all ages (S1 Table 5.5, p. 95, PDF p. 97; source S11 Table 2). RR/SD with age- and sex-specific SD (a), and with NHANES III young female SD (b):

| Outcome | Sex | RR/SD (a) | RR/SD (b) |
|---|---|---|---|
| Any | Men | 1.47 (1.34–1.60) | 1.44 (1.32–1.58) |
| Any | Women | 1.45 (1.39–1.51) | 1.46 (1.39–1.53) |
| Any | Combined | 1.45 (1.39–1.51) | 1.46 (1.40–1.52) |
| Osteoporotic | Men | 1.60 (1.43–1.79) | 1.55 (1.40–1.73) |
| Osteoporotic | Women | 1.53 (1.46–1.62) | 1.56 (1.47–1.64) |
| Osteoporotic | Combined | 1.55 (1.47–1.62) | 1.56 (1.49–1.64) |
| Hip | Men | 2.42 (1.90–3.09) | 2.28 (1.81–2.87) |
| Hip | Women | 2.03 (1.87–2.21) | 2.18 (1.99–2.39) |
| Hip | Combined | 2.07 (1.91–2.24) | 2.21 (2.03–2.41) |

Hip fracture, by age, men and women combined (S1 Table 5.7, p. 96, PDF p. 98; source S11 Table 4):

| Age | 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 |
|---|---|---|---|---|---|---|---|---|
| RR/SD | 3.68 (2.61–5.19) | 3.35 (2.51–4.47) | 3.07 (2.42–3.89) | 2.89 (2.39–3.50) | 2.78 (2.39–3.23) | 2.58 (2.30–2.90) | 2.28 (2.09–2.50) | 1.93 (1.76–2.10) |

S2 Table 3 adds age 90: 1.70 (1.50–1.93).

Osteoporotic fracture (incl. hip), by age (S1 Table 5.6, p. 96, PDF p. 98; source S11 Table 3; copied in the column order printed: Men, Women, Men and women):

| Age | Men | Women | Men and women |
|---|---|---|---|
| 50 | 1.27 (1.13–1.42) | 1.22 (1.07–1.39) | 1.37 (1.23–1.52) |
| 55 | 1.31 (1.19–1.45) | 1.27 (1.14–1.41) | 1.40 (1.29–1.52) |
| 60 | 1.36 (1.26–1.47) | 1.32 (1.21–1.44) | 1.43 (1.34–1.53) |
| 65 | 1.41 (1.33–1.51) | 1.38 (1.28–1.48) | 1.45 (1.37–1.53) |
| 70 | 1.49 (1.41–1.58) | 1.46 (1.37–1.56) | 1.49 (1.42–1.57) |
| 75 | 1.59 (1.50–1.68) | 1.57 (1.48–1.67) | 1.57 (1.50–1.66) |
| 80 | 1.66 (1.57–1.76) | 1.66 (1.56–1.76) | 1.62 (1.54–1.71) |
| 85 | 1.66 (1.54–1.78) | 1.65 (1.53–1.79) | 1.54 (1.44–1.63) |
| All ages | 1.60 (1.43–1.79) | 1.53 (1.46–1.62) | 1.55 (1.47–1.62) |

(The men and women values at 65 match the S11 abstract: men 1.41 (1.33–1.51), women 1.38 (1.28–1.48). The combined column is above both sexes at younger ages; copied as printed.)

Other BMD facts [PUBLISHED]:
- BMD·BMD (non-linear): S11 abstract: "At a z score of -4 SD, the risk gradient was 2.10 per SD (95% CI = 1.63-2.71) and at a z score of -1 SD, the risk was 1.73 per SD (95% CI = 1.59-1.89) in men and women combined" (any osteoporotic fracture). "A similar but less pronounced and nonsignificant effect was observed for hip fractures." The full curve is S1 Fig. 5.2 (from S11 Table 6) — numbers NOT CONFIRMED.
- Time since measurement, hip: "The immediate risk of hip fracture was 2.18/SD and the risk was 1.91/SD at 10 years" (S1 p. 97). No time effect for any/OP fracture.
- Sex: same risk for the same BMD and age: "the age-specific risk of hip fracture at a given femoral neck BMD in men appears to be the same in women with the same BMD and age" (S1 p. 95).
- Hip GR for the "BMD only" risk score at age 50 vs other-OP: 3.68 vs 1.19 (S2 Table 3).
- Death: "smoking and low BMD are risk factors for fracture but also significant risk factors for death. Thus, at very low T-scores for BMD, hip fracture probabilities decrease with age … in part related to the higher mortality associated with the lower values for BMD" (S3 p. 393).

### c2. BMI

Per unit increase in BMI, adjusted for age and time (S12 abstract; S1 p. 99): RR 0.98 (0.97–0.99) any fracture, 0.97 (0.96–0.98) OP fracture, 0.93 (0.91–0.94) hip fracture. After adjustment for BMD: "these RR became 1 for any fracture or osteoporotic fracture and 0.98 for hip fracture (significant in women)" (S12 abstract). "the average SD for BMI was around 4 kg/m², corresponding to a RR for hip fracture of 1.4/SD decrease in BMI" (S1 p. 102).

RR by BMI level, reference BMI 25, men and women combined (S1 Table 5.8, p. 101, PDF p. 103; source S12 Table 3):

| BMI | Any, no BMD | OP, no BMD | Hip, no BMD | Any, with BMD | OP, with BMD | Hip, with BMD |
|---|---|---|---|---|---|---|
| 15 | 1.66 (1.31–2.09) | 1.79 (1.35–2.37) | 4.48 (3.11–6.45) | 1.00 (0.75–1.33) | 1.07 (0.78–1.48) | 2.16 (1.42–3.28) |
| 20 | 1.21 (1.12–1.30) | 1.27 (1.16–1.38) | 1.95 (1.71–2.22) | 0.98 (0.9–1.08) | 1.02 (0.92–1.13) | 1.42 (1.23–1.65) |
| 25 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| 30 | 0.92 (0.85–1.00) | 0.89 (0.81–0.98) | 0.83 (0.69–0.99) | 1.01 (0.91–1.11) | 0.96 (0.86–1.08) | 1.00 (0.82–1.21) |
| 35 | 0.85 (0.74–0.98) | 0.74 (0.62–0.90) | 0.75 (0.50–1.11) | 0.99 (0.82–1.19) | 0.91 (0.73–1.13) | 1.18 (0.78–1.80) |
| 40 | 0.80 (0.62–1.03) | 0.57 (0.39–0.85) | 0.53 (0.18–1.56) | 0.99 (0.68–1.43) | 0.89 (0.56–1.4) | 1.25 (0.44–3.57) |

- Inflection: "increased BMI over 22 kg/m² is associated with modest decreases in fracture risk, whereas below this threshold the risk is markedly increased" (S1 p. 101). 22 kg/m² and lower = about 10% of men and 17% of women in these cohorts (S1 p. 102).
- BMI by age: per-unit RR "increased with advancing age" for any and OP fracture, opposite (not significant) for hip (S1 p. 99–100; values only in Fig. 5.4, NOT CONFIRMED). This BMI·age term was **dropped** from FRAX (S1 p. 190).
- In the final FRAX, with BMD entered, BMI has almost no effect: S3 p. 390: "When BMD was fixed, hip fracture probability remained constant irrespective of BMI (Fig. 7)". See also S1 Table 7.17 above.

---

## (d) Death hazard effects

What is published [PUBLISHED]:
- FRAX has a separate death hazard for each of the four models, built the same way (Poisson, continuous). "Interactions that were significant for hip fracture risk were also entered … in the model for death." "For the death hazard, all significant interactions for fracture risk were included and thereafter omitted if appropriate in a step-wise manner" (S3 p. 387; S1 p. 190).
- Risk factors change the death hazard too. S3 p. 393: "FRAX™ also takes account of the impact of risk factors on the death hazard. For example, smoking and low BMD are risk factors for fracture but also significant risk factors for death." S4: "for each risk factor the hazard for death was determined since, if significant, would compete with the fracture hazard in a probability model. A good example was current smoking which was a moderate risk factor for fracture but would turn out to be a weak risk factor for fracture probability because smoking also significantly increased the risk of death."
- Sex: elderly men have lower probabilities than women at the same BMD "due to the higher death hazard" (S3 p. 390).
- Glucocorticoid dose: S10 abstract: "In addition to fracture risk, a dose response for the death hazard was estimated". Published dose rule (S10 abstract): "For low-dose exposure (< 2.5 mg daily of prednisolone or equivalent), the probability of a major fracture is decreased by about 20% depending on age. For medium doses (2.5-7.5 mg daily), the unadjusted FRAX value can be used. For high doses (> 7.5 mg daily), probabilities can be upward revised by about 15%." Hip factors exist in the full paper (NOT CONFIRMED, paywalled).
- National mortality: UN estimates for 1999 (US: NVSR 2001) in the 2007 build (S1 p. 195). Future mortality changes matter: Swedish lifetime hip risk at 50 = 4.6% / 13.9% (men/women) if all die at average life expectancy, 8.1% / 19.5% with current mortality, 11.1% / 22.7% with predicted mortality (S13 Oden 1998 abstract; S1 p. 155–156).
- Size of the competing-death effect in real data (S9 abstract, Manitoba, N = 39,063): ignoring competing mortality "overestimated fracture probability by 16-56 % with the standard nonparametric (Kaplan-Meier) method and 15-29 % with the standard parametric (Cox) model" in high-mortality groups (men, age >80, high fracture probability, diabetes); for hip fracture 18–36% and 17–35%.
- Mortality after fracture (S1 Table 2.6, p. 26, PDF p. 28) is published by site and age for Sweden (e.g. hip, women age 60, year 0 after fracture: 10.4; age 80: 3.4), but FRAX does not use post-fracture mortality inside the 10-year calculation as far as the papers say.

What is NOT published for the **current** FRAX: the death-hazard β coefficients for any risk factor, BMD or BMI; the death-model interaction list; the death normaliser (a, b, σ). All **NOT CONFIRMED**.

**New (2023–2026): death hazard ratios from the "update FRAX" meta-analyses** [PUBLISHED; read by a helper agent; full citations in section U]. These are from the new cohort collection for the *next* FRAX, not the 2008 model, but they are the only published per-factor death HRs:

| Risk factor | Death HR women | Death HR men | Notes | Source |
|---|---|---|---|---|
| Previous fracture | 1.10 (1.05–1.15) | 1.11 (1.02–1.21) | "unchanged when adjusted for femoral neck BMD" | Kanis 2023 |
| Previous fall (past year) | 1.15 (1.09–1.22) | 1.20 (1.09–1.33) | about the same with T-score added | Vandenput 2024 |
| Rheumatoid arthritis | 1.48 (1.19–1.85) | 1.31 (0.96–1.77) | glucocorticoid-adjusted: women 1.31, men 1.13 | Kanis 2025 |
| BMI underweight vs normal | 1.60 (BMD-adj 1.55) | 1.71 (1.66) | | BMI 2025, Appendix Tables 8a/8b |
| BMI overweight | 0.92 (0.94) | 0.96 (0.98) | | same |
| BMI obese I | 1.08 (1.13) | 1.07 (1.13) | | same |
| BMI obese II | 1.31 (1.40) | 1.27 (1.39) | | same |
| Parental hip fracture | 0.90 (0.83–0.96), sexes combined | — | BMD cohorts 0.86 with and without BMD | McCloskey 2025, Table 5 |
| Current smoking | 1.81 (1.63–2.00); BMD-adj 1.79 | 1.69 (1.51–1.89); BMD-adj 1.67 | | Schini 2026, Table 3 |
| Femoral neck BMD, per SD lower | 1.11 | 1.08 | combined 1.10 (1.07–1.12), sex p = 0.31 | Kanis 2026 |

No death HR found yet for glucocorticoids or alcohol in this series (papers not found).

---

## (e) Independent re-implementations and approximations

FRAX developers' own statement (S4, p. 10 of the PMC manuscript): "The name was registered since we wished to distinguish the authentic algorithms from those that might be copied later. In hindsight, this was a prudent investment since several groups reverse engineered copies, one of which is still in use today [90]." Ref 90 = the FORE 10-Year Fracture Risk Calculator. S4 also: the cohort owners required "that all material would be held in confidence and that no details of individual cohorts would be published."

| Work | Method | Fitted to | Accuracy vs official FRAX | Status |
|---|---|---|---|---|
| S14 Allbritton-King et al., *Bone* 2022 | GLM on log(hip probability); age categorical, BMI and T-score continuous, 6 yes/no factors; no interaction terms; BMI <18.5 excluded | 473,088 outputs scraped from the US Caucasian calculator: women, age 50–90 (2-year steps), BMI 15–40, T-score −2.5 to −1.0 (osteopenia only). Fig. 2A legend says 236,544 for the GLM (the paper does not explain the two counts) | R² = 0.91 (abstract); 0.917 full model (Table 2); 0.791 without T-score; 0.533 age + BMI only. Agreement with FRAX treat decision (hip ≥3%) in 6,675 SOF women: 83.4% (Table 1A). No MAE/RMSE/max error. Hip only. No code. Quote: "its underlying algorithm is not public" | CONFIRMED (PMC9035136, read by helper) |
| S15 Li et al., *JBMR Plus* 2024 (Taiwan) | Multiple linear regression on log(MOF and hip probability), with/without BMD; decision tree ranking; simplified model = age, sex, prior fracture | Real FRAX outputs for 16,384 Taiwan survey participants, age 40–90 | Adjusted R² (log scale): full with BMD MOF 0.9206, hip 0.9376; full without BMD MOF 0.9538, hip 0.9554 (Table 2); simplified 3-factor MOF 0.8210, hip 0.8528 (Table 4); ≥65 y MOF 0.7186, hip 0.6167. MOF ≥20% classification: accuracy >90%, sensitivity 0.5, specificity 0.96. Simplified coefficients (Table 4): MOF intercept −1.61, age 0.06, sex −0.60, prior fracture 0.73; hip intercept −6.41, age 0.11, sex −0.59, prior fracture 0.91 (log base not stated). Quote: "its formulation is not publicly disclosed" | CONFIRMED (PMC11032218, read by helper) |
| S16 Leslie et al., *Osteoporos Int* 2011 (CAROC) | Paper lookup table (age × sex × femoral neck T-score) built from Canadian FRAX MOF probabilities, plus fixed CRF adjustments; 3 risk bands <10%, 10–20%, >20% | Canadian FRAX | Same band as Canadian FRAX in 89% (CaMos) and 88% (Manitoba) | Abstract only |
| S17 FORE 10-Year Fracture Risk Calculator (Lo et al., *Am J Manag Care* 2011) | Base rate by age, sex, race × relative risk per input; "the same base-rate source and the same risk input variables" as FRAX, different RRs | — | Validated only against observed hip fractures (94,489 Kaiser women; observed/predicted 1.3–1.4; AUC 0.85 with BMD, 0.83 without). No published comparison with FRAX output | CONFIRMED (read by helper) |
| GitHub `sufyansuleman/HealthMarkers` (R/frax_score.R) | Self-described "simplified, non-validated approximation… does not implement the proprietary FRAX algorithm" | — | None reported | Code only, not a source |

No CRAN or PyPI package re-implements FRAX from published coefficients (helper search via GitHub/CRAN/PyPI). Other GitHub hits only scrape the official tool. Not re-implementations: Gadam et al. *Endocr Pract* 2013 (FRAX with vs without BMD); Dagan et al. *Nat Med* 2020 (CT-based model vs FRAX). NOT CONFIRMED: an MDPI *Osteology* 2025 Japanese paper (403 on access).

**Bottom line for (e):** nobody has published a re-implementation built from the published structure and parameters that reproduces FRAX to a stated percentage-point error. The two that report R² were fitted to FRAX *outputs* in one country, on the log scale and within narrow input ranges.

---

## K. Kuwait-specific published data

- A FRAX model for Kuwait "calibrated to the total Kuwaiti population, was released in March, 2016" (S5). It cites Azizieh 2015 (S7) as the Kuwait epidemiology reference. S1 (2007) already listed Kuwait in the "high risk" group of countries (S1 p. 194).
- Mean BMI of Kuwaiti women = 30 kg/m² (S5).

**Published Kuwait FRAX outputs, women, BMI 30, no BMD unless stated, MOF % (S5 Table 1)**:

| Age | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| No clinical risk factors | 1.0 | 1.4 | 2.0 | 2.5 | 3.1 | 3.8 | 4.7 | 6.2 | 8.5 | 12 | 14 |
| BMD T-score −2.5 (no other CRF) | 2.6 | 3.3 | 4.3 | 5.3 | 6.0 | 6.5 | 7.1 | 8.0 | 9.5 | 11 | 13 |
| Previous fracture (no other CRF) | 2.3 | 3.2 | 4.3 | 5.4 | 6.5 | 7.6 | 9.0 | 11 | 14 | 19 | 23 |
| BMD T-score −1.5 (no other CRF) | 1.6 | 2.1 | 2.8 | 3.3 | 3.7 | 4.0 | 4.4 | 5.2 | 6.4 | 7.9 | 9.2 |

S5 Table 3 (woman 65, BMI 30, MOF %): T −2.5 no CRF 6.5; T −2.5 + parental hip fracture 11.0; T −2.0 no CRF 5.0; T −2.0 + parental hip fracture 9.1; no BMD + prior fracture 7.6. Kuwait hip-fracture tables (supplement A1–A2): NOT CONFIRMED (download blocked).

**Kuwait hip fracture incidence, total population 2009–2012, per 100 000 person-years** (S6 text and Fig. 2; ICD-10 S72.0/S72.1, all causes, national MOPH registry):

| Age | Women | Men |
|---|---|---|
| 50–59 | 24.7 | 22.2 |
| 60–69 | 134.7 | 69.5 |
| 70–79 | 422.5 | 293.9 |
| ≥80 | 906.1 | 873.4 |

Kuwaiti nationals only (S6 Table 2): men 50–59 37.8, 60–69 87.7, 70–79 319.7, ≥80 861.7; women 25.1, 139.0, 380.2, 887.7 (the table prints "79–79" for the 70–79 row, a typo). Age-standardised hip rates (world 2010 population): men 45.1, women 52.5 (S6). S7 (Kuwaiti subpopulation ≥50, abstract): age-standardised 2009–2012 men 129.5, 131.5, 154.6, 169.8; women 189.6, 192.9, 197.2, 214.4 per 100 000.

Earlier Kuwait hip data: Kanis JA et al., A systematic review of hip fracture incidence and probability of fracture worldwide, *Osteoporos Int* 2012;23:2239–2256 (https://pmc.ncbi.nlm.nih.gov/articles/PMC3421108/) lists Kuwait's source as Memon A, et al. Incidence of hip fracture in Kuwait. *Int J Epidemiol* 1998;27:860–865, "Kuwaiti data i.e., expatriates excluded" (sources table). That review placed Kuwait among high-risk countries for men on the men-only map, but in the combined men-and-women map (age- and sex-standardised), Kuwait (men) was coded moderate risk (text near Figs. 3 and 5). (Memon 1998 itself not opened: NOT CONFIRMED.)

Not found: Kuwait non-hip MOF incidence for FRAX (FRAX assumes the Swedish ratio where only hip data exist; S8); the Kuwait mortality table used by FRAX (presumably UN data; NOT CONFIRMED).

---

## (f) What is still NOT published (the gaps)

1. **The final β coefficients** of the four fracture models and four death models (intercepts, main effects, all interaction terms, time terms). Only single-factor meta-analysis RRs are published. This is the largest gap.
2. **The BMI knot g** and the two slopes of the piecewise BMI term.
3. **The calibration normaliser** a, b and σ (risk score vs age regression) for each model and sex.
4. **The death-hazard effects** used in the current FRAX for each risk factor, BMD and BMI. (Section d now lists per-factor death HRs from the 2023–2026 update papers, which can stand in, but they are not the 2008 values. None found for glucocorticoids or alcohol.)
5. **The MOF combination formula** (how the hip and "other" hazards are joined) — the structure can be inferred, but it is not printed. S1 Annex 5 (the probability/hazard annex) is missing from the available PDF.
6. **The Malmö MOF/hip correction factors** by age and sex as a usable table (S8 could not get them either).
7. **Country inputs** inside each national model (exact hip incidence and mortality tables used, year of data). For Kuwait, S7 is the stated source but its age-specific table is paywalled; S6 gives a close open alternative.
8. **Numerical method**: time step and integration rule inside the software.
9. **Men's Z→T conversion constants**; NHANES III mean/SD values as used by FRAX.
10. **Input handling rules** in the current tool (BMI clamps, age clamps, weight/height ranges) — only available from the calculator itself, which this project must not use.
11. **Version changes** after 2008 (e.g. US revision 2010, later updates) and the 2023–2026 "update FRAX" meta-analyses (section U) — whether the live tool already uses new coefficients is NOT CONFIRMED.

**How complete is this for rebuilding FRAX?** [INFERRED] The engine (hazard → competing-risk integral → calibration normaliser) is fully published. The parameters are not. A rebuild can use the published single-factor RRs (age-specific where given) as multiplicative hazard ratios, a published national hip incidence, a national life table, a Swedish-ratio MOF step, and the normaliser formula; then tune a small number of free values (BMI shape, death effects, normaliser) so that it reproduces the published test tables (S1 Tables 7.15–7.18, S3 Tables 1–3, S5 Table 1). It will be an approximation, not FRAX, and should be labelled that way. [MY RECOMMENDATION] Use a 0.1-year (or monthly) step for the integral; check against the S1 Annex 1 GR tables first (they isolate the engine from the risk-factor coefficients).

---

## U. Newer "meta-analysis to update FRAX" series (2023–2026)

[PUBLISHED; papers opened and read by a helper agent; numbers copied from the papers' tables.] These feed the **next** FRAX version. None of them gives a 10-year probability model, and none says the new version has been released ("the next iteration" wording in each). Whether the live tool uses any of these values is NOT CONFIRMED. All HRs are random-effects meta-analysis, adjusted for age and time since baseline unless stated. w = women, m = men.

- **U0. Analysis plan:** Vandenput L, et al. Update of the fracture risk prediction tool FRAX: a systematic review of potential cohorts and analysis plan. *Osteoporos Int* 2022;33:2103–2136. doi:10.1007/s00198-022-06435-6. 64 cohorts, 2,138,428 participants, about 20 million person-years. Quote: "multivariate hazard functions for hip fracture, major osteoporotic fracture and death will be tested using extended Poisson regression."

- **U1. Previous fracture:** Kanis JA, et al. *Osteoporos Int* 2023;34:2027–2045. doi:10.1007/s00198-023-06870-z (PMC7615305). 64 cohorts.
  - Table 4, no BMD, combined: hip 1.77 (1.59–1.98), MOF 1.80 (1.61–2.01); women/men hip 1.71/1.99, MOF 1.77/1.90. (Abstract prints 1.82 and 1.83 — differs from Table 4.)
  - Table 5, BMD cohorts: hip 1.70 → 1.43 (1.30–1.56) after BMD adjustment.
  - Table 6, by age 40/50/60/70/80/90: hip 3.57/3.00/2.53/2.13/1.79/1.51; MOF 2.32/2.13/1.97/1.81/1.67/1.54.
  - Table 7, by time since baseline 0/5/10 y: hip 2.12/1.78/1.49; MOF 2.06/1.75/1.49. Quote: time decline is "a phenomenon not accounted for in the current FRAX model".

- **U2. Previous falls:** Vandenput L, et al. *Osteoporos Int* 2024;35:469–494. doi:10.1007/s00198-023-07012-1. 46 cohorts. (A new candidate input, not in current FRAX.)
  - Table 2: hip w 1.36 (1.23–1.50), m 1.59 (1.38–1.84); MOF w 1.37 (1.28–1.46), m 1.50 (1.32–1.70). Sex difference significant (Table 3).
  - Table 4, women by age 40/50/60/70/80/90: hip 2.63/2.21/1.85/1.55/1.30/1.09; MOF 1.73/1.61/1.50/1.40/1.30/1.21. Men (age p not significant): hip 2.21/2.03/1.87/1.72/1.58/1.46; MOF 2.05/1.90/1.75/1.62/1.50/1.38.
  - Table 7, number of falls (MOF): women 1/2/3+ = 1.27/1.48/1.68; men 1.48/2.13/2.45.

- **U3. Rheumatoid arthritis:** Kanis JA, et al. *Osteoporos Int* 2025;36:653–671. doi:10.1007/s00198-025-07397-1. 29 cohorts.
  - Table 2: hip 1.93 (1.53–2.44) (abstract prints 2.23 (1.85–2.69) — conflict), MOF 1.49 (1.32–1.67).
  - Table 3, by age 40/50/60/70/80/90: hip 2.53/1.99/1.56/1.23/0.96/0.76 (p<0.001); MOF 1.42/1.37/1.33/1.28/1.24/1.20 (p>0.30).
  - Table 4, glucocorticoid-adjusted: hip "1.736" (as printed) (1.36–2.21), MOF 1.39 (1.21–1.60). Table 7, BMD cohorts: hip 1.46 → 1.58, MOF 1.36 → 1.41 after BMD adjustment.

- **U4. BMI:** *J Bone Miner Res* 2025;40(10):1144–1155. doi:10.1093/jbmr/zjaf091 (PMC12487781). 63 cohorts.
  - Table 1, HR per +1 kg/m² (all cohorts / BMD cohorts unadjusted / BMD-adjusted): hip w 0.95/0.95/0.99, m 0.95/0.95/1.03; MOF w 0.98/0.98/1.01, m 0.98/0.98/1.02.
  - Tables 2–3, vs normal BMI (no BMD → BMD-adjusted): hip underweight w 2.35 → 1.69, m 2.45 → 1.46; hip obese II w 0.66 → 1.24, m 0.91 → 1.70; MOF underweight w 1.43 → 1.16, m 1.87 → 1.25; MOF obese II w 0.78 → 1.21, m 0.96 → 1.54.
  - Appendix Table 6, per unit by age 40/50/60/70/80/90: hip 0.939/0.943/0.947/0.950/0.954/0.958 (p = 0.23); MOF 1.012/1.002/0.993/0.984/0.975/0.966 (p<0.001).
  - Quote: "will directly inform the revised FRAX engine, as a continuous exposure, in the second version".

- **U5. Parental history of hip fracture:** McCloskey EV, et al. *Osteoporos Int* 2025;36:1725–1741. doi:10.1007/s00198-025-07607-w. 42 cohorts.
  - Table 2: hip 1.37 (1.23–1.52), MOF 1.19 (1.12–1.27); BMD cohorts hip 1.29 → 1.18, MOF 1.17 → 1.11 after BMD adjustment. Mother/father (Table 3): hip 1.47/1.54, MOF 1.26/1.25. No significant age or time interaction (MOF HR 1.21 at age 40, 1.08 at age 90, p = 0.53, figure only).
  - Note: much lower than the 2007 values (hip 2.27, OP 1.54; section b).

- **U6. Smoking:** Schini M, et al. *Osteoporos Int* 2026;37(4):839–855. doi:10.1007/s00198-026-07853-6. 58 cohorts.
  - Table 2, current smoking: hip w 1.64 (1.50–1.78), m 1.78 (1.58–2.00); MOF w 1.23 (1.16–1.29), m 1.40 (1.28–1.53). Sex difference significant (Table S3). BMD cohorts (Table S4): hip w 1.68 → 1.52, m 1.98 → 1.65; MOF w 1.25 → 1.17, m 1.45 → 1.30 (Table 2 prints MOF men 1.32 in one place — conflict noted by helper).
  - Past smokers (Table 4): hip m 1.08, w 1.09; MOF m 1.12, w 1.06. Hip in women falls with age (interaction p = 0.018, figure only).

- **U7. BMD:** Kanis JA, et al. *Osteoporos Int* 2026;37(5):1067–1085. doi:10.1007/s00198-026-07925-7. 53 cohorts. Gradient of risk per SD lower femoral neck BMD.
  - Table 3: hip w 2.03 (1.91–2.16), m 2.31 (2.18–2.46) (sex p = 0.0064); MOF w 1.58 (1.51–1.66), m 1.74 (1.65–1.84).
  - Table 4, by age 50/65/80: hip w 3.23/2.61/2.11, m 3.49/2.73/2.14; MOF w 1.61/1.55/1.49, m 1.63/1.64/1.64.
  - Table 5, by T-score band (< −2.5 / −2.5 to −1 / > −1): hip 2.04/2.29/1.64; MOF 1.58/1.68/1.51.

- **Not found in the series (as of 2026-10-16):** glucocorticoids, alcohol, type 2 diabetes, secondary osteoporosis. Diabetes and falls are listed in the analysis plan as new candidate factors.

---

## JSON: all numeric parameters found

The block below was generated by a script and checked with a JSON parser. Keys name the source and table (S-numbers as in the source list; "update" keys = section U). "NOT published" means not found in any source.

```json
{
 "_meta": {
  "prepared": "2026-10-16",
  "units": "RR = risk ratio; [x,lo,hi] = estimate with 95% CI; probabilities in %",
  "note": "Single-factor meta-analysis values from WHO Technical Report 2007 (S1) unless noted. Final FRAX beta coefficients are NOT published."
 },
 "equations": {
  "hazard_form": "h = exp(b0 + b1*x1 + ... + bk*xk)  [S3 Appendix p.394]",
  "time_varying_beta": "b1*x1 + b2*x1*t = (b1 + b2*t)*x1  [S1 p.154]",
  "piecewise_term": "b1*min(x,g) + b2*max(x-g,0); g NOT published  [S1 p.154-155]",
  "meta_merge": "beta = sum(b_i/var_i)/sum(1/var_i); SD = sqrt(1/sum(1/var_i))  [S3 p.394]",
  "calibration": "h_person(age) = lambda_country(age) * exp(Y) * z(age); z(age) = 1/exp(a + b*age + sigma^2/2); a,b,sigma NOT published  [S3 p.394]",
  "probability": "p = integral_0^10 h(v) * exp(-integral_0^v (h(u)+d(u)) du) dv  [S3 p.395]",
  "gr_to_auc": "AUC = Phi(ln(GR)/sqrt(2))  [S2 Appendix p.1044]",
  "z_to_t_women": {
   "formula": "T = c0 + c1*Z + c2*age + c3*Z*age  [S1 p.197]",
   "age_lt_55": [
    0.892,
    0.984,
    -0.034,
    0.0007
   ],
   "age_ge_55": [
    1.6617,
    1.2658,
    -0.048,
    -0.0044
   ]
  },
  "fn_bmd_threshold_T_minus_2_5_g_cm2_hologic": 0.577
 },
 "retained_interactions": {
  "S1_p190": [
   "age*sex",
   "BMD*age",
   "BMD*BMD",
   "prior_fracture*age",
   "BMI*BMI",
   "age*age"
  ],
  "S2_p1039": [
   "age*sex",
   "BMD*age",
   "BMD*BMD",
   "family_history*age",
   "prior_fracture*age",
   "BMI*BMI",
   "age*age"
  ],
  "dropped": [
   "BMI*age (fracture hazards)"
  ]
 },
 "summary_rr": {
  "hip_S1_T5_24": {
   "no_bmd": {
    "bmi20_vs_25": [
     1.95,
     1.71,
     2.22
    ],
    "bmi30_vs_25": [
     0.83,
     0.69,
     0.99
    ],
    "prior_fracture": [
     1.85,
     1.58,
     2.17
    ],
    "parental_hip_fx": [
     2.27,
     1.47,
     3.49
    ],
    "current_smoking": [
     1.84,
     1.52,
     2.22
    ],
    "glucocorticoids": [
     2.31,
     1.67,
     3.2
    ],
    "alcohol_3plus": [
     1.68,
     1.19,
     2.36
    ],
    "rheumatoid_arthritis": [
     1.95,
     1.11,
     3.42
    ]
   },
   "with_bmd": {
    "bmi20_vs_25": [
     1.42,
     1.23,
     1.65
    ],
    "bmi30_vs_25": [
     1.0,
     0.82,
     1.21
    ],
    "prior_fracture": [
     1.62,
     1.3,
     2.01
    ],
    "parental_hip_fx": [
     2.28,
     1.48,
     3.51
    ],
    "current_smoking": [
     1.6,
     1.27,
     2.02
    ],
    "glucocorticoids": [
     2.25,
     1.6,
     3.15
    ],
    "alcohol_3plus": [
     1.7,
     1.2,
     2.42
    ],
    "rheumatoid_arthritis": [
     1.73,
     0.94,
     3.2
    ]
   }
  },
  "any_op_incl_hip_S1_T5_23": {
   "no_bmd": {
    "bmi20_vs_25": [
     1.27,
     1.16,
     1.38
    ],
    "bmi30_vs_25": [
     0.89,
     0.81,
     0.98
    ],
    "prior_fracture": [
     1.86,
     1.72,
     2.01
    ],
    "parental_hip_fx": [
     1.54,
     1.25,
     1.88
    ],
    "current_smoking": [
     1.29,
     1.17,
     1.43
    ],
    "glucocorticoids": [
     1.65,
     1.42,
     1.9
    ],
    "alcohol_3plus": [
     1.38,
     1.16,
     1.65
    ],
    "rheumatoid_arthritis": [
     1.56,
     1.2,
     2.02
    ]
   },
   "with_bmd": {
    "bmi20_vs_25": [
     1.02,
     0.92,
     1.13
    ],
    "bmi30_vs_25": [
     0.96,
     0.86,
     1.08
    ],
    "prior_fracture": [
     1.76,
     1.6,
     1.93
    ],
    "parental_hip_fx": [
     1.54,
     1.25,
     1.88
    ],
    "current_smoking": [
     1.13,
     1.0,
     1.28
    ],
    "glucocorticoids": [
     1.66,
     1.42,
     1.92
    ],
    "alcohol_3plus": [
     1.36,
     1.13,
     1.63
    ],
    "rheumatoid_arthritis": [
     1.47,
     1.12,
     1.92
    ]
   }
  },
  "op_excl_hip_S1_T5_26": {
   "no_bmd": {
    "bmi20_vs_25": [
     1.07,
     0.96,
     1.2
    ],
    "bmi30_vs_25": [
     0.98,
     0.89,
     1.09
    ],
    "prior_fracture": [
     1.92,
     1.75,
     2.1
    ],
    "parental_hip_fx": [
     1.52,
     1.21,
     1.91
    ],
    "current_smoking": [
     1.16,
     1.03,
     1.31
    ],
    "glucocorticoids": [
     1.55,
     1.3,
     1.84
    ],
    "alcohol_3plus": [
     1.24,
     1.01,
     1.53
    ],
    "rheumatoid_arthritis": [
     1.48,
     1.09,
     2.02
    ]
   },
   "with_bmd": {
    "bmi20_vs_25": [
     1.07,
     0.95,
     1.22
    ],
    "bmi30_vs_25": [
     0.9,
     0.8,
     1.02
    ],
    "prior_fracture": [
     1.78,
     1.59,
     1.99
    ],
    "parental_hip_fx": [
     1.51,
     1.2,
     1.91
    ],
    "current_smoking": [
     1.03,
     0.89,
     1.2
    ],
    "glucocorticoids": [
     1.56,
     1.27,
     1.9
    ],
    "alcohol_3plus": [
     1.19,
     0.96,
     1.49
    ],
    "rheumatoid_arthritis": [
     1.42,
     1.03,
     1.95
    ]
   }
  }
 },
 "age_specific_rr": {
  "prior_fracture_S1_T5_10": {
   "ages": [
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85
   ],
   "any_no_bmd": [
    1.92,
    1.9,
    1.98,
    2.02,
    2.03,
    1.96,
    1.88,
    1.83
   ],
   "any_with_bmd": [
    1.91,
    1.83,
    1.94,
    1.99,
    1.98,
    1.82,
    1.72,
    1.72
   ],
   "hip_no_bmd": [
    5.04,
    4.2,
    3.4,
    2.6,
    2.31,
    2.14,
    1.9,
    1.66
   ],
   "hip_with_bmd": [
    3.88,
    3.98,
    3.16,
    2.28,
    1.9,
    1.64,
    1.41,
    1.32
   ],
   "hip_no_bmd_ci": [
    [
     2.66,
     9.56
    ],
    [
     2.46,
     7.15
    ],
    [
     2.21,
     5.24
    ],
    [
     1.85,
     3.64
    ],
    [
     1.76,
     3.02
    ],
    [
     1.71,
     2.68
    ],
    [
     1.58,
     2.28
    ],
    [
     1.39,
     1.98
    ]
   ],
   "hip_with_bmd_ci": [
    [
     1.79,
     8.43
    ],
    [
     2.08,
     7.62
    ],
    [
     1.88,
     5.32
    ],
    [
     1.52,
     3.41
    ],
    [
     1.37,
     2.65
    ],
    [
     1.24,
     2.17
    ],
    [
     1.12,
     1.78
    ],
    [
     1.04,
     1.68
    ]
   ],
   "all_ages": {
    "any_no_bmd": 1.86,
    "any_with_bmd": 1.77,
    "hip_no_bmd": 1.85,
    "hip_with_bmd": 1.62
   }
  },
  "glucocorticoids_S1_T5_11_title_says_bmd_adjusted": {
   "ages": [
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85
   ],
   "any": [
    1.98,
    1.83,
    1.67,
    1.56,
    1.55,
    1.64,
    1.62,
    1.66
   ],
   "op_incl_hip": [
    2.63,
    2.32,
    2.0,
    1.81,
    1.76,
    1.7,
    1.59,
    1.71
   ],
   "hip": [
    4.42,
    4.15,
    3.71,
    2.98,
    2.44,
    2.22,
    2.13,
    2.48
   ],
   "all_ages": {
    "any": 1.57,
    "op": 1.66,
    "hip": 2.25
   },
   "all_ages_vs_population": {
    "any": 1.53,
    "op": 1.61,
    "hip": 2.13
   }
  },
  "parental_hip_fx_S1_T5_15_no_bmd": {
   "ages": [
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85
   ],
   "op_incl_hip": [
    1.8,
    1.66,
    1.56,
    1.5,
    1.47,
    1.31,
    1.14,
    1.14
   ],
   "hip": [
    2.34,
    2.36,
    2.41,
    2.44,
    2.57,
    1.75,
    1.26,
    1.33
   ]
  },
  "parental_any_fx_S1_T5_14_no_bmd": {
   "ages": [
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85
   ],
   "op_incl_hip": [
    1.31,
    1.29,
    1.28,
    1.27,
    1.25,
    1.2,
    1.12,
    1.08
   ],
   "hip": [
    1.63,
    1.73,
    1.82,
    1.86,
    1.79,
    1.53,
    1.35,
    1.31
   ]
  },
  "current_smoking_S1_T5_17": {
   "ages": [
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85
   ],
   "op_no_bmd": [
    1.05,
    1.06,
    1.08,
    1.14,
    1.27,
    1.45,
    1.54,
    1.52
   ],
   "op_with_bmd": [
    0.82,
    0.85,
    0.88,
    0.91,
    1.01,
    1.2,
    1.3,
    1.28
   ],
   "hip_no_bmd": [
    2.52,
    2.35,
    2.17,
    1.98,
    1.92,
    1.94,
    1.91,
    1.8
   ],
   "hip_with_bmd": [
    2.28,
    2.09,
    1.87,
    1.68,
    1.69,
    1.76,
    1.69,
    1.57
   ]
  },
  "current_smoking_by_sex_S1_T5_16": {
   "order": "[no_bmd, with_bmd]",
   "any": {
    "men": [
     1.5,
     1.49
    ],
    "women": [
     1.18,
     1.02
    ],
    "mw": [
     1.25,
     1.13
    ]
   },
   "op": {
    "men": [
     1.53,
     1.54
    ],
    "women": [
     1.2,
     1.01
    ],
    "mw": [
     1.29,
     1.13
    ]
   },
   "hip": {
    "men": [
     1.82,
     1.69
    ],
    "women": [
     1.85,
     1.55
    ],
    "mw": [
     1.84,
     1.6
    ]
   }
  },
  "alcohol_S1_T5_20_mw": {
   "order": "[no_bmd, with_bmd]",
   ">2": {
    "any": [
     1.23,
     1.24
    ],
    "op": [
     1.38,
     1.36
    ],
    "hip": [
     1.68,
     1.7
    ]
   },
   ">3": {
    "any": [
     1.33,
     1.34
    ],
    "op": [
     1.55,
     1.53
    ],
    "hip": [
     1.92,
     2.05
    ]
   },
   ">4": {
    "any": [
     1.51,
     1.51
    ],
    "op": [
     1.7,
     1.64
    ],
    "hip": [
     2.26,
     2.39
    ]
   }
  },
  "alcohol_by_units_S1_T5_19_ref_1_unit": {
   "units": [
    0,
    1,
    2,
    3,
    4
   ],
   "men_op": [
    1.06,
    1.0,
    1.05,
    1.38,
    1.81
   ],
   "men_hip": [
    0.94,
    1.0,
    1.21,
    1.91,
    2.84
   ],
   "women_op": [
    0.96,
    1.0,
    1.07,
    1.2,
    1.38
   ],
   "women_hip": [
    0.98,
    1.0,
    1.09,
    1.33,
    1.72
   ]
  },
  "rheumatoid_arthritis_S1_T5_22": {
   "base": {
    "any": 1.45,
    "op": 1.56,
    "hip": 1.95
   },
   "plus_bmd": {
    "any": 1.38,
    "op": 1.47,
    "hip": 1.73
   },
   "plus_gc": {
    "any": 1.38,
    "op": 1.46,
    "hip": 1.76
   },
   "plus_gc_bmd": {
    "any": 1.3,
    "op": 1.35,
    "hip": 1.46
   },
   "plus_prior_fx": {
    "any": 1.4,
    "op": 1.49,
    "hip": 1.85
   },
   "plus_prior_fx_bmd": {
    "any": 1.36,
    "op": 1.45,
    "hip": 1.71
   }
  }
 },
 "bmd": {
  "per_sd_all_ages_S1_T5_5": {
   "age_sex_specific_sd": {
    "any": {
     "men": 1.47,
     "women": 1.45,
     "combined": 1.45
    },
    "op": {
     "men": 1.6,
     "women": 1.53,
     "combined": 1.55
    },
    "hip": {
     "men": 2.42,
     "women": 2.03,
     "combined": 2.07
    }
   },
   "nhanes_young_female_sd": {
    "any": {
     "men": 1.44,
     "women": 1.46,
     "combined": 1.46
    },
    "op": {
     "men": 1.55,
     "women": 1.56,
     "combined": 1.56
    },
    "hip": {
     "men": 2.28,
     "women": 2.18,
     "combined": 2.21
    }
   }
  },
  "hip_by_age_S1_T5_7_plus_S2_age90": {
   "ages": [
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85,
    90
   ],
   "rr_per_sd": [
    3.68,
    3.35,
    3.07,
    2.89,
    2.78,
    2.58,
    2.28,
    1.93,
    1.7
   ],
   "ci": [
    [
     2.61,
     5.19
    ],
    [
     2.51,
     4.47
    ],
    [
     2.42,
     3.89
    ],
    [
     2.39,
     3.5
    ],
    [
     2.39,
     3.23
    ],
    [
     2.3,
     2.9
    ],
    [
     2.09,
     2.5
    ],
    [
     1.76,
     2.1
    ],
    [
     1.5,
     1.93
    ]
   ]
  },
  "op_incl_hip_by_age_S1_T5_6": {
   "ages": [
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85
   ],
   "men": [
    1.27,
    1.31,
    1.36,
    1.41,
    1.49,
    1.59,
    1.66,
    1.66
   ],
   "women": [
    1.22,
    1.27,
    1.32,
    1.38,
    1.46,
    1.57,
    1.66,
    1.65
   ],
   "combined_as_printed": [
    1.37,
    1.4,
    1.43,
    1.45,
    1.49,
    1.57,
    1.62,
    1.54
   ]
  },
  "bmd_by_bmd_S11": {
   "op_gr_at_z_minus4": [
    2.1,
    1.63,
    2.71
   ],
   "op_gr_at_z_minus1": [
    1.73,
    1.59,
    1.89
   ]
  },
  "hip_time_since_measurement_S1_p97": {
   "immediate": 2.18,
   "at_10_years": 1.91
  }
 },
 "bmi": {
  "per_unit_increase_no_bmd_S12": {
   "any": [
    0.98,
    0.97,
    0.99
   ],
   "op": [
    0.97,
    0.96,
    0.98
   ],
   "hip": [
    0.93,
    0.91,
    0.94
   ]
  },
  "per_unit_with_bmd_S12": {
   "any": 1.0,
   "op": 1.0,
   "hip": 0.98
  },
  "levels_ref25_S1_T5_8": {
   "bmi": [
    15,
    20,
    25,
    30,
    35,
    40
   ],
   "no_bmd": {
    "any": [
     1.66,
     1.21,
     1.0,
     0.92,
     0.85,
     0.8
    ],
    "op": [
     1.79,
     1.27,
     1.0,
     0.89,
     0.74,
     0.57
    ],
    "hip": [
     4.48,
     1.95,
     1.0,
     0.83,
     0.75,
     0.53
    ]
   },
   "with_bmd": {
    "any": [
     1.0,
     0.98,
     1.0,
     1.01,
     0.99,
     0.99
    ],
    "op": [
     1.07,
     1.02,
     1.0,
     0.96,
     0.91,
     0.89
    ],
    "hip": [
     2.16,
     1.42,
     1.0,
     1.0,
     1.18,
     1.25
    ]
   }
  },
  "inflection_kg_m2_S1_p101": 22,
  "sd_kg_m2_S1_p102": 4,
  "hip_rr_per_sd_decrease_S1_p102": 1.4
 },
 "risk_score_gradients_S2_T3": {
  "ages": [
   50,
   60,
   70,
   80,
   90
  ],
  "hip": {
   "bmd_only": [
    3.68,
    3.07,
    2.78,
    2.28,
    1.7
   ],
   "crf_only": [
    2.05,
    1.95,
    1.84,
    1.75,
    1.66
   ],
   "crf_plus_bmd": [
    4.23,
    3.51,
    2.91,
    2.42,
    2.02
   ]
  },
  "other_op_excl_hip": {
   "bmd_only": [
    1.19,
    1.28,
    1.39,
    1.54,
    1.56
   ],
   "crf_only": [
    1.41,
    1.48,
    1.55,
    1.63,
    1.72
   ],
   "crf_plus_bmd": [
    1.44,
    1.52,
    1.61,
    1.71,
    1.81
   ]
  },
  "corr_crf_score_bmd": {
   "hip": 0.25,
   "other_op": 0.1
  }
 },
 "sweden_incidence_per_100k_S1_T2_3": {
  "age_bands": [
   "50-54",
   "55-59",
   "60-64",
   "65-69",
   "70-74",
   "75-79",
   "80-84",
   "85-89"
  ],
  "men": {
   "vertebra": [
    195,
    119,
    226,
    242,
    499,
    619,
    933,
    1194
   ],
   "proximal_humerus": [
    65,
    31,
    60,
    92,
    207,
    179,
    235,
    505
   ],
   "hip": [
    42,
    68,
    134,
    274,
    495,
    940,
    1923,
    3241
   ],
   "distal_forearm": [
    101,
    151,
    140,
    282,
    89,
    175,
    259,
    323
   ]
  },
  "women": {
   "vertebra": [
    161,
    158,
    303,
    439,
    778,
    1111,
    1163,
    1641
   ],
   "proximal_humerus": [
    124,
    127,
    126,
    352,
    384,
    629,
    585,
    1120
   ],
   "hip": [
    41,
    91,
    181,
    387,
    817,
    1689,
    3364,
    5183
   ],
   "distal_forearm": [
    417,
    456,
    568,
    691,
    904,
    1032,
    1208,
    1387
   ]
  }
 },
 "sweden_first_fracture_overestimation_pct_S1_T6_7": {
  "age_bands": [
   "50-59",
   "60-69",
   "70-79",
   "80-89"
  ],
  "spine": {
   "men": [
    29,
    58,
    50,
    38
   ],
   "women": [
    31,
    38,
    40,
    40
   ]
  },
  "forearm": {
   "men": [
    7,
    16,
    33,
    25
   ],
   "women": [
    10,
    13,
    26,
    29
   ]
  },
  "shoulder": {
   "men": [
    3,
    16,
    0,
    0
   ],
   "women": [
    2,
    55,
    4,
    2
   ]
  },
  "hip": {
   "men": [
    0,
    29,
    8,
    19
   ],
   "women": [
    9,
    9,
    14,
    22
   ]
  }
 },
 "malmo_10yr_risk_pct_S1_T6_10": {
  "ages": [
   45,
   50,
   55,
   60,
   65,
   70,
   75,
   80,
   85,
   90,
   95
  ],
  "men": {
   "forearm": [
    1.2,
    1.2,
    1.3,
    1.7,
    1.5,
    0.9,
    1.2,
    1.4,
    1.1,
    0.8,
    1.3
   ],
   "hip": [
    0.5,
    0.8,
    0.8,
    1.2,
    2.1,
    3.4,
    5.9,
    7.6,
    7.1,
    6.2,
    5.2
   ],
   "spine": [
    0.8,
    1.1,
    1.4,
    1.7,
    2.1,
    3.1,
    3.8,
    4.4,
    4.0,
    1.4,
    0.1
   ],
   "humerus": [
    0.5,
    0.5,
    0.4,
    0.7,
    1.3,
    1.5,
    1.5,
    1.9,
    2.3,
    2.1,
    1.3
   ],
   "any": [
    2.6,
    3.3,
    3.9,
    4.9,
    5.9,
    7.6,
    10.4,
    13.1,
    13.1,
    10.3,
    8.3
   ]
  },
  "women": {
   "forearm": [
    2.5,
    3.9,
    4.7,
    5.6,
    6.5,
    7.2,
    7.6,
    7.3,
    6.0,
    4.3,
    2.8
   ],
   "hip": [
    0.4,
    0.6,
    1.2,
    2.3,
    3.9,
    7.3,
    11.7,
    15.5,
    16.1,
    12.4,
    8.0
   ],
   "spine": [
    0.6,
    1.2,
    1.7,
    2.7,
    4.3,
    5.9,
    6.5,
    6.9,
    6.8,
    5.0,
    2.6
   ],
   "humerus": [
    0.8,
    1.2,
    1.4,
    2.3,
    3.4,
    4.4,
    5.0,
    5.6,
    6.3,
    5.8,
    3.9
   ],
   "any": [
    3.8,
    6.0,
    7.8,
    10.6,
    14.3,
    18.9,
    22.9,
    26.5,
    27.0,
    21.4,
    13.9
   ]
  }
 },
 "death": {
  "coefficients": "NOT published",
  "gc_dose_rule_S10": {
   "lt_2_5mg_MOF_change_pct": -20,
   "2_5_to_7_5mg_change_pct": 0,
   "gt_7_5mg_MOF_change_pct": 15
  },
  "competing_mortality_overestimation_if_ignored_S9_pct": {
   "KM": [
    16,
    56
   ],
   "Cox": [
    15,
    29
   ],
   "hip_KM": [
    18,
    36
   ],
   "hip_Cox": [
    17,
    35
   ]
  },
  "sweden_lifetime_hip_risk_at_50_pct_S13": {
   "all_die_at_life_expectancy": {
    "men": 4.6,
    "women": 13.9
   },
   "current_mortality": {
    "men": 8.1,
    "women": 19.5
   },
   "predicted_mortality": {
    "men": 11.1,
    "women": 22.7
   }
  }
 },
 "uk_annex1_10yr_hip_pct_population_average_S1": {
  "ages": [
   50,
   55,
   60,
   65,
   70,
   75,
   80,
   85
  ],
  "men": [
   0.4,
   0.6,
   1.1,
   1.9,
   2.6,
   3.8,
   5.0,
   5.1
  ],
  "women": [
   0.5,
   0.8,
   1.8,
   3.7,
   6.0,
   9.3,
   12,
   11
  ]
 },
 "test_cases": {
  "sweden_woman_bmi24_no_bmd_S1_T7_15": {
   "ages": [
    50,
    60,
    70,
    80
   ],
   "mof": {
    "none": [
     4.2,
     7.7,
     14.4,
     25.9
    ],
    "smoking": [
     4.5,
     8.4,
     16.4,
     29.1
    ],
    "alcohol": [
     5.1,
     9.4,
     18.1,
     32.8
    ],
    "ra": [
     5.7,
     10.6,
     20.3,
     36.3
    ],
    "gc": [
     6.9,
     12.7,
     23.5,
     38.2
    ],
    "fh": [
     8.2,
     14.4,
     23.0,
     46.8
    ],
    "prior_fx": [
     9.1,
     15.6,
     26.2,
     39.1
    ]
   },
   "hip": {
    "none": [
     0.4,
     1.3,
     4.7,
     13.1
    ],
    "smoking": [
     0.6,
     2.0,
     6.9,
     17.8
    ],
    "alcohol": [
     0.6,
     2.0,
     7.1,
     19.2
    ],
    "ra": [
     0.7,
     2.3,
     8.2,
     21.8
    ],
    "gc": [
     0.9,
     2.8,
     9.6,
     23.4
    ],
    "fh": [
     0.5,
     1.7,
     9.9,
     37.8
    ],
    "prior_fx": [
     1.6,
     3.8,
     9.8,
     19.6
    ]
   }
  },
  "uk_bmi25_no_bmd_S3_T2": {
   "ages": [
    50,
    60,
    70,
    80
   ],
   "men": {
    "mof": {
     "none": [
      2.8,
      3.9,
      5.7,
      7.2
     ],
     "fh": [
      5.5,
      7.6,
      9.1,
      15
     ],
     "smoking": [
      2.8,
      4.1,
      5.9,
      7.5
     ],
     "alcohol": [
      3.3,
      4.7,
      7.1,
      9.5
     ],
     "ra": [
      3.7,
      5.3,
      8.0,
      11
     ],
     "gc": [
      4.4,
      6.1,
      8.5,
      10
     ],
     "prior_fx": [
      5.8,
      7.9,
      11,
      12
     ]
    },
    "hip": {
     "none": [
      0.1,
      0.4,
      1.3,
      3.4
     ],
     "fh": [
      0.2,
      0.6,
      2.8,
      11
     ],
     "smoking": [
      0.2,
      0.7,
      1.8,
      4.2
     ],
     "alcohol": [
      0.2,
      0.7,
      2.0,
      5.1
     ],
     "ra": [
      0.2,
      0.8,
      2.3,
      5.8
     ],
     "gc": [
      0.3,
      0.9,
      2.4,
      5.5
     ],
     "prior_fx": [
      0.5,
      1.3,
      2.7,
      5.2
     ]
    }
   },
   "women": {
    "mof": {
     "none": [
      3.5,
      6.0,
      11,
      17
     ],
     "fh": [
      6.9,
      12,
      17,
      31
     ],
     "smoking": [
      3.6,
      6.5,
      12,
      19
     ],
     "alcohol": [
      4.1,
      7.3,
      14,
      22
     ],
     "ra": [
      4.7,
      8.2,
      15,
      25
     ],
     "gc": [
      5.6,
      9.8,
      18,
      26
     ],
     "prior_fx": [
      7.4,
      12,
      20,
      28
     ]
    },
    "hip": {
     "none": [
      0.2,
      0.7,
      2.3,
      7.0
     ],
     "fh": [
      0.3,
      0.9,
      5.0,
      22
     ],
     "smoking": [
      0.3,
      1.1,
      3.4,
      9.5
     ],
     "alcohol": [
      0.3,
      1.1,
      3.6,
      10
     ],
     "ra": [
      0.4,
      1.3,
      4.1,
      12
     ],
     "gc": [
      0.5,
      1.5,
      4.8,
      13
     ],
     "prior_fx": [
      0.8,
      2.1,
      4.9,
      11
     ]
    }
   }
  },
  "uk_age65_bmi25_S3_T1": {
   "order": [
    "men_mof",
    "men_hip",
    "women_mof",
    "women_hip"
   ],
   "no_bmd": {
    "none": [
     4.9,
     0.8,
     8.6,
     1.3
    ],
    "fh": [
     9.3,
     1.0,
     16.0,
     1.7
    ],
    "smoking": [
     5.1,
     1.1,
     9.2,
     1.9
    ],
    "alcohol": [
     6.0,
     1.2,
     10.4,
     2.0
    ],
    "ra": [
     6.8,
     1.4,
     11.7,
     2.3
    ],
    "gc": [
     7.5,
     1.5,
     13.7,
     2.7
    ],
    "prior_fx": [
     9.6,
     1.9,
     16.4,
     3.2
    ]
   },
   "t_minus_2_5": {
    "none": [
     9.8,
     3.6,
     12.4,
     3.0
    ],
    "fh": [
     16.5,
     3.7,
     22.1,
     3.2
    ],
    "smoking": [
     11.0,
     5.6,
     13.7,
     5.1
    ],
    "alcohol": [
     12.5,
     5.4,
     15.4,
     4.6
    ],
    "ra": [
     12.8,
     5.0,
     16.1,
     4.3
    ],
    "gc": [
     15.0,
     6.1,
     19.7,
     5.5
    ],
    "prior_fx": [
     16.0,
     5.9,
     20.2,
     5.0
    ]
   }
  },
  "uk_bmi25_no_crf_by_tscore_S3_T3": {
   "t_scores": [
    1,
    0,
    -1,
    -2,
    -3,
    -4
   ],
   "note": "'<0.1' printed in source is stored as null",
   "hip_men": {
    "50": [
     null,
     0.1,
     0.4,
     1.3,
     4.7,
     16.0
    ],
    "60": [
     0.1,
     0.2,
     0.6,
     1.9,
     5.6,
     15.6
    ],
    "70": [
     0.2,
     0.5,
     1.1,
     2.6,
     5.9,
     12.9
    ],
    "80": [
     0.6,
     1.1,
     1.9,
     3.4,
     6.1,
     10.7
    ],
    "90": [
     1.2,
     1.8,
     2.5,
     3.8,
     5.6,
     8.3
    ]
   },
   "hip_women": {
    "50": [
     null,
     0.1,
     0.2,
     0.8,
     3.2,
     11.7
    ],
    "60": [
     0.1,
     0.2,
     0.4,
     1.4,
     4.4,
     13.5
    ],
    "70": [
     0.1,
     0.4,
     0.9,
     2.4,
     6.3,
     16.2
    ],
    "80": [
     0.5,
     1.0,
     2.1,
     4.4,
     9.5,
     19.7
    ],
    "90": [
     1.2,
     2.0,
     3.5,
     5.8,
     9.8,
     16.9
    ]
   },
   "mof_men": {
    "50": [
     2.5,
     2.7,
     3.5,
     5.1,
     9.2,
     20.9
    ],
    "60": [
     3.0,
     3.5,
     4.5,
     6.8,
     11.5,
     22.2
    ],
    "70": [
     3.6,
     4.3,
     5.5,
     8.2,
     12.8,
     20.9
    ],
    "80": [
     3.2,
     4.0,
     5.2,
     7.6,
     11.3,
     16.9
    ],
    "90": [
     3.1,
     3.9,
     5.1,
     6.9,
     9.7,
     13.5
    ]
   },
   "mof_women": {
    "50": [
     3.0,
     3.3,
     3.8,
     5.2,
     8.5,
     17.7
    ],
    "60": [
     4.2,
     4.8,
     5.6,
     7.9,
     12.6,
     23.0
    ],
    "70": [
     5.6,
     6.8,
     8.4,
     11.5,
     18.2,
     30.4
    ],
    "80": [
     5.8,
     7.5,
     10.1,
     13.8,
     21.7,
     34.3
    ],
    "90": [
     5.1,
     7.1,
     9.9,
     13.8,
     20.0,
     30.3
    ]
   }
  },
  "sweden_bmi24_no_crf_t_minus_2_5_S1_T7_16": {
   "ages": [
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85
   ],
   "men_mof": [
    9.1,
    10.2,
    11.9,
    13.0,
    14.5,
    15.5,
    15.1,
    13.5
   ],
   "men_hip": [
    4.3,
    4.8,
    5.5,
    6.0,
    7.2,
    8.8,
    8.8,
    7.3
   ],
   "women_mof": [
    8.2,
    9.8,
    12.5,
    14.9,
    18.2,
    21.3,
    24.1,
    23.6
   ],
   "women_hip": [
    2.8,
    3.2,
    4.0,
    4.9,
    6.9,
    9.4,
    10.9,
    10.0
   ]
  },
  "sweden_women65_bmi_S1_T7_17": {
   "bmi": [
    16,
    18,
    20,
    22,
    24,
    26,
    28,
    30,
    32
   ],
   "mof_no_bmd": [
    13.4,
    12.4,
    11.5,
    10.9,
    10.3,
    9.8,
    9.3,
    8.8,
    8.3
   ],
   "mof_with_bmd_T_minus_2_7": [
    13.5,
    14.2,
    15.0,
    15.7,
    16.4,
    16.7,
    16.4,
    16.0,
    15.7
   ],
   "hip_no_bmd": [
    6.1,
    4.8,
    3.8,
    3.0,
    2.3,
    2.0,
    1.8,
    1.6,
    1.5
   ],
   "hip_with_bmd_T_minus_2_7": [
    5.4,
    5.5,
    5.7,
    5.8,
    6.0,
    6.0,
    5.8,
    5.6,
    5.5
   ]
  },
  "uk_woman65_bmi25_hip_by_number_of_crfs_S3_p388": {
   "0": 1.3,
   "1": [
    1.7,
    3.2
   ],
   "2": [
    2.5,
    6.6
   ],
   "3": [
    3.8,
    11
   ],
   "4": [
    6.7,
    17
   ],
   "5": [
    13,
    24
   ],
   "6": 30
  }
 },
 "kuwait": {
  "frax_women_bmi30_mof_S5_T1": {
   "ages": [
    40,
    45,
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85,
    90
   ],
   "no_crf": [
    1.0,
    1.4,
    2.0,
    2.5,
    3.1,
    3.8,
    4.7,
    6.2,
    8.5,
    12,
    14
   ],
   "t_minus_2_5": [
    2.6,
    3.3,
    4.3,
    5.3,
    6.0,
    6.5,
    7.1,
    8.0,
    9.5,
    11,
    13
   ],
   "prior_fx_no_bmd": [
    2.3,
    3.2,
    4.3,
    5.4,
    6.5,
    7.6,
    9.0,
    11,
    14,
    19,
    23
   ],
   "t_minus_1_5": [
    1.6,
    2.1,
    2.8,
    3.3,
    3.7,
    4.0,
    4.4,
    5.2,
    6.4,
    7.9,
    9.2
   ]
  },
  "frax_woman65_bmi30_mof_S5_T3": {
   "t_minus_2_5_none": 6.5,
   "t_minus_2_5_parental_hip": 11.0,
   "t_minus_2_0_none": 5.0,
   "t_minus_2_0_parental_hip": 9.1,
   "no_bmd_prior_fx": 7.6
  },
  "hip_incidence_total_pop_2009_2012_per_100k_S6": {
   "age_bands": [
    "50-59",
    "60-69",
    "70-79",
    "80+"
   ],
   "women": [
    24.7,
    134.7,
    422.5,
    906.1
   ],
   "men": [
    22.2,
    69.5,
    293.9,
    873.4
   ]
  },
  "hip_incidence_kuwaiti_nationals_per_100k_S6_T2": {
   "age_bands": [
    "50-59",
    "60-69",
    "70-79",
    "80+"
   ],
   "women": [
    25.1,
    139.0,
    380.2,
    887.7
   ],
   "men": [
    37.8,
    87.7,
    319.7,
    861.7
   ]
  },
  "hip_incidence_age_standardised_kuwaiti_50plus_S7": {
   "years": [
    2009,
    2010,
    2011,
    2012
   ],
   "men": [
    129.5,
    131.5,
    154.6,
    169.8
   ],
   "women": [
    189.6,
    192.9,
    197.2,
    214.4
   ]
  },
  "mean_bmi_women_S5": 30
 },
 "reimplementations": {
  "allbritton_king_2022_S14": {
   "outcome": "hip",
   "r2_table2": 0.917,
   "r2_abstract": 0.91,
   "r2_no_tscore": 0.791,
   "r2_age_bmi_only": 0.533,
   "treat_decision_agreement_pct": 83.4
  },
  "li_2024_taiwan_S15": {
   "adj_r2": {
    "full_with_bmd": {
     "mof": 0.9206,
     "hip": 0.9376
    },
    "full_no_bmd": {
     "mof": 0.9538,
     "hip": 0.9554
    },
    "simplified_3factor": {
     "mof": 0.821,
     "hip": 0.8528
    },
    "simplified_age65plus": {
     "mof": 0.7186,
     "hip": 0.6167
    }
   },
   "simplified_coefficients_log_scale": {
    "mof": {
     "intercept": -1.61,
     "age": 0.06,
     "sex": -0.6,
     "prior_fx": 0.73
    },
    "hip": {
     "intercept": -6.41,
     "age": 0.11,
     "sex": -0.59,
     "prior_fx": 0.91
    }
   }
  },
  "caroc_2011_S16": {
   "same_category_pct": {
    "CaMos": 89,
    "Manitoba": 88
   }
  }
 },
 "update_frax_2023_2026": {
  "_note": "Inputs for the NEXT FRAX version; not confirmed to be in the live tool. Random-effects HRs adjusted for age and time.",
  "prior_fracture_Kanis2023": {
   "table4_no_bmd": {
    "hip": [
     1.77,
     1.59,
     1.98
    ],
    "mof": [
     1.8,
     1.61,
     2.01
    ],
    "hip_w": 1.71,
    "hip_m": 1.99,
    "mof_w": 1.77,
    "mof_m": 1.9
   },
   "table5_hip_bmd_cohorts": {
    "unadjusted": 1.7,
    "bmd_adjusted": [
     1.43,
     1.3,
     1.56
    ]
   },
   "table6_by_age": {
    "ages": [
     40,
     50,
     60,
     70,
     80,
     90
    ],
    "hip": [
     3.57,
     3.0,
     2.53,
     2.13,
     1.79,
     1.51
    ],
    "mof": [
     2.32,
     2.13,
     1.97,
     1.81,
     1.67,
     1.54
    ]
   },
   "table7_by_years_since_baseline": {
    "years": [
     0,
     5,
     10
    ],
    "hip": [
     2.12,
     1.78,
     1.49
    ],
    "mof": [
     2.06,
     1.75,
     1.49
    ]
   },
   "death_hr": {
    "w": [
     1.1,
     1.05,
     1.15
    ],
    "m": [
     1.11,
     1.02,
     1.21
    ]
   }
  },
  "falls_Vandenput2024": {
   "table2": {
    "hip_w": [
     1.36,
     1.23,
     1.5
    ],
    "hip_m": [
     1.59,
     1.38,
     1.84
    ],
    "mof_w": [
     1.37,
     1.28,
     1.46
    ],
    "mof_m": [
     1.5,
     1.32,
     1.7
    ]
   },
   "table4_by_age": {
    "ages": [
     40,
     50,
     60,
     70,
     80,
     90
    ],
    "hip_w": [
     2.63,
     2.21,
     1.85,
     1.55,
     1.3,
     1.09
    ],
    "mof_w": [
     1.73,
     1.61,
     1.5,
     1.4,
     1.3,
     1.21
    ],
    "hip_m": [
     2.21,
     2.03,
     1.87,
     1.72,
     1.58,
     1.46
    ],
    "mof_m": [
     2.05,
     1.9,
     1.75,
     1.62,
     1.5,
     1.38
    ]
   },
   "table7_mof_by_number_of_falls": {
    "falls": [
     1,
     2,
     "3+"
    ],
    "w": [
     1.27,
     1.48,
     1.68
    ],
    "m": [
     1.48,
     2.13,
     2.45
    ]
   },
   "death_hr": {
    "w": [
     1.15,
     1.09,
     1.22
    ],
    "m": [
     1.2,
     1.09,
     1.33
    ]
   }
  },
  "rheumatoid_arthritis_Kanis2025": {
   "table2": {
    "hip": [
     1.93,
     1.53,
     2.44
    ],
    "mof": [
     1.49,
     1.32,
     1.67
    ],
    "abstract_hip_conflict": [
     2.23,
     1.85,
     2.69
    ]
   },
   "table3_by_age": {
    "ages": [
     40,
     50,
     60,
     70,
     80,
     90
    ],
    "hip": [
     2.53,
     1.99,
     1.56,
     1.23,
     0.96,
     0.76
    ],
    "mof": [
     1.42,
     1.37,
     1.33,
     1.28,
     1.24,
     1.2
    ]
   },
   "table4_gc_adjusted": {
    "hip_as_printed": 1.736,
    "mof": 1.39
   },
   "death_hr": {
    "w": [
     1.48,
     1.19,
     1.85
    ],
    "m": [
     1.31,
     0.96,
     1.77
    ],
    "gc_adjusted_w": 1.31,
    "gc_adjusted_m": 1.13
   }
  },
  "bmi_JBMR2025": {
   "table1_per_unit_all_bmdcohorts_bmdadj": {
    "hip_w": [
     0.95,
     0.95,
     0.99
    ],
    "hip_m": [
     0.95,
     0.95,
     1.03
    ],
    "mof_w": [
     0.98,
     0.98,
     1.01
    ],
    "mof_m": [
     0.98,
     0.98,
     1.02
    ]
   },
   "categories_vs_normal_noBMD_then_BMDadj": {
    "hip_underweight_w": [
     2.35,
     1.69
    ],
    "hip_underweight_m": [
     2.45,
     1.46
    ],
    "hip_obeseII_w": [
     0.66,
     1.24
    ],
    "hip_obeseII_m": [
     0.91,
     1.7
    ],
    "mof_underweight_w": [
     1.43,
     1.16
    ],
    "mof_underweight_m": [
     1.87,
     1.25
    ],
    "mof_obeseII_w": [
     0.78,
     1.21
    ],
    "mof_obeseII_m": [
     0.96,
     1.54
    ]
   },
   "appendix6_per_unit_by_age": {
    "ages": [
     40,
     50,
     60,
     70,
     80,
     90
    ],
    "hip": [
     0.939,
     0.943,
     0.947,
     0.95,
     0.954,
     0.958
    ],
    "mof": [
     1.012,
     1.002,
     0.993,
     0.984,
     0.975,
     0.966
    ]
   },
   "death_hr_noBMD_then_BMDadj": {
    "underweight_w": [
     1.6,
     1.55
    ],
    "underweight_m": [
     1.71,
     1.66
    ],
    "overweight_w": [
     0.92,
     0.94
    ],
    "overweight_m": [
     0.96,
     0.98
    ],
    "obeseI_w": [
     1.08,
     1.13
    ],
    "obeseI_m": [
     1.07,
     1.13
    ],
    "obeseII_w": [
     1.31,
     1.4
    ],
    "obeseII_m": [
     1.27,
     1.39
    ]
   }
  },
  "parental_hip_fx_McCloskey2025": {
   "table2": {
    "hip": [
     1.37,
     1.23,
     1.52
    ],
    "mof": [
     1.19,
     1.12,
     1.27
    ],
    "hip_bmd_cohorts_unadj_then_adj": [
     1.29,
     1.18
    ],
    "mof_bmd_cohorts_unadj_then_adj": [
     1.17,
     1.11
    ]
   },
   "table3_mother_father": {
    "hip": [
     1.47,
     1.54
    ],
    "mof": [
     1.26,
     1.25
    ]
   },
   "death_hr": [
    0.9,
    0.83,
    0.96
   ]
  },
  "smoking_Schini2026": {
   "table2_current": {
    "hip_w": [
     1.64,
     1.5,
     1.78
    ],
    "hip_m": [
     1.78,
     1.58,
     2.0
    ],
    "mof_w": [
     1.23,
     1.16,
     1.29
    ],
    "mof_m": [
     1.4,
     1.28,
     1.53
    ]
   },
   "tableS4_bmd_cohorts_unadj_then_adj": {
    "hip_w": [
     1.68,
     1.52
    ],
    "hip_m": [
     1.98,
     1.65
    ],
    "mof_w": [
     1.25,
     1.17
    ],
    "mof_m": [
     1.45,
     1.3
    ]
   },
   "table4_past_smokers": {
    "hip_m": 1.08,
    "hip_w": 1.09,
    "mof_m": 1.12,
    "mof_w": 1.06
   },
   "death_hr": {
    "w": [
     1.81,
     1.63,
     2.0
    ],
    "m": [
     1.69,
     1.51,
     1.89
    ],
    "bmd_adj_w": 1.79,
    "bmd_adj_m": 1.67
   }
  },
  "bmd_Kanis2026_gr_per_sd": {
   "table3": {
    "hip_w": [
     2.03,
     1.91,
     2.16
    ],
    "hip_m": [
     2.31,
     2.18,
     2.46
    ],
    "mof_w": [
     1.58,
     1.51,
     1.66
    ],
    "mof_m": [
     1.74,
     1.65,
     1.84
    ]
   },
   "table4_by_age": {
    "ages": [
     50,
     65,
     80
    ],
    "hip_w": [
     3.23,
     2.61,
     2.11
    ],
    "hip_m": [
     3.49,
     2.73,
     2.14
    ],
    "mof_w": [
     1.61,
     1.55,
     1.49
    ],
    "mof_m": [
     1.63,
     1.64,
     1.64
    ]
   },
   "table5_by_tscore_band": {
    "bands": [
     "<-2.5",
     "-2.5 to -1",
     ">-1"
    ],
    "hip": [
     2.04,
     2.29,
     1.64
    ],
    "mof": [
     1.58,
     1.68,
     1.51
    ]
   },
   "death_hr_per_sd_lower": {
    "combined": [
     1.1,
     1.07,
     1.12
    ],
    "w": 1.11,
    "m": 1.08
   }
  }
 }
}
```
