# FRAX Kuwait: country inputs from published sources

Compiled 2026-10-16. Only published sources were used. The FRAX website was not queried or scraped.
Every number below was copied from the opened source. Anything that could not be found in an open source is marked **NOT CONFIRMED**.

Local copies of the sources are saved in `frax_site\dl\` (same folder as this file).

---

## 0. Short answer

| Input | Status | Best source |
|---|---|---|
| Paper describing the Kuwait FRAX model | No stand-alone "FRAX Kuwait model" paper found. The model was **released March 2016** and is described only briefly in Johansson et al. 2017 | Johansson H, Azizieh F, Al Ali N, Alessa T, Harvey NC, McCloskey E, Kanis JA. *FRAX- vs. T-score-based intervention thresholds for osteoporosis.* Osteoporos Int 2017;28(11):3099–3105. doi:10.1007/s00198-017-4160-7 (PMC5881885) |
| Hip fracture incidence by 5-year age and sex used inside FRAX Kuwait | **NOT CONFIRMED** (the source cited for it is paywalled) | Azizieh FY. *Incidence of hip fracture in Kuwait: a national registry-based study.* Arch Osteoporos 2015;10:40. doi:10.1007/s11657-015-0248-x (closed access; only the abstract was readable) |
| Closest open hip fracture incidence (same author, same registry, same years, 10-year age bands) | Found, exact | Azizieh FY et al. *Fractures in Kuwait: incidence and distribution.* Risk Manag Healthc Policy 2017;10:117–125, **Table 2** (PMC5476756) |
| Mortality used inside FRAX Kuwait | **NOT CONFIRMED** (source and year not published). A 2022 FRAX paper implies it used **Kuwaiti nationals'** mortality | Saleh et al. 2022 (PMC8976798), Discussion |
| Fallback mortality (WHO life table, all residents of Kuwait) | Found, exact (not the FRAX input) | WHO Global Health Observatory, indicator LIFE_0000000029 (nMx) |
| Swedish (Malmö) MOF/hip ratios | Method confirmed for FRAX models in general and the Gulf models; **no Kuwait-specific statement found**; the ratio values by age are **NOT CONFIRMED** (not published in open form) | Abdulla et al. 2022 (Qatar), Saleh et al. 2022 (Saudi), Chakhtoura et al. 2021 |
| IT / LAT / UAT table (e.g. age 65: 7.6 / 3.8 / 9.1) | Found, exact, with method | Johansson et al. 2017, **Table 2**; repeated with extra ages in the **Kuwait Osteoporosis Guidelines 2022**, "Fracture Probability Table" (PDF page 5) |

---

## 1. The Kuwait FRAX model paper

**Johansson H, Azizieh F, Al Ali N, Alessa T, Harvey NC, McCloskey E, Kanis JA.** FRAX- vs. T-score-based intervention thresholds for osteoporosis. *Osteoporos Int.* 2017 Aug 7;28(11):3099–3105. doi:10.1007/s00198-017-4160-7. PMID 28782072. PMCID PMC5881885.
- Full text (author manuscript): https://pmc.ncbi.nlm.nih.gov/articles/PMC5881885/
- Same manuscript as PDF: https://eprints.whiterose.ac.uk/129499/1/emss-76781.pdf
- Supplement (Tables A1, A2): https://pmc.ncbi.nlm.nih.gov/articles/instance/5881885/bin/NIHMS76781-supplement-Supplementary_tables.docx

Exact quotes (Introduction, manuscript PDF p.4):
> "A FRAX model for Kuwait, calibrated to the total Kuwaiti population, was released in March, 2016 [13]."

Reference [13] in that paper is:
> "Azizieh FY. Incidence of hip fracture in Kuwait: a national registry-based study. Arch Osteoporos. 2015;10:40. doi: 10.1007/s11657-015-0248-x."

Note: "total Kuwaiti population" is not defined further. The 2015 paper it cites studied the **Kuwaiti (national) subpopulation aged 50+**, 2009–2012 (see section 2). Whether "total" means all nationals or all residents is **NOT CONFIRMED**.

No separate paper that sets out the Kuwait FRAX hip fracture and death hazards was found (searched PubMed/PMC, Springer, OpenAlex citing works of Azizieh 2015, and the later Gulf FRAX papers).

---

## 2. Hip fracture incidence

### 2a. The source cited for the model: Azizieh 2015 (paywalled)

Azizieh FY. Incidence of hip fracture in Kuwait: a national registry-based study. *Arch Osteoporos.* 2015;10:40. doi:10.1007/s11657-015-0248-x. Online 17 Nov 2015.
Publisher page: https://link.springer.com/article/10.1007/s11657-015-0248-x (subscription; OpenAlex reports `oa_status: closed`).

Only the abstract could be opened. Exact abstract text:
> "Using the Ministry of Public Health's registry data, this population-based study evaluated the incidence of hip fractures in Kuwaiti subpopulation aged 50 and above for the years 2009, 2010, 2011, and 2012."
>
> "Hip fracture crude incidence rates varied between 113.7 and 147.4/100,000 for males and between 135.3 and 148.1/100,000 for females, with a female/male ratio of 1.3–1.5. The combined (men and women) incidence rate of hip fractures increased by 17.1 % over the 4-year period of study (125.9/100,000 in 2009 to 147.8/100,000 in 2012). Using the world population in 2010 as a reference, the age-standardized rates were 129.5, 131.5, 154.6, and 169.8 for males and 189.6, 192.9, 197.2, and 214.4 for females, for the years 2009, 2010, 2011, and 2012, respectively."

| Kuwaitis aged 50+ | 2009 | 2010 | 2011 | 2012 |
|---|---|---|---|---|
| Age-standardized rate, males (/100,000, world pop 2010) | 129.5 | 131.5 | 154.6 | 169.8 |
| Age-standardized rate, females (/100,000) | 189.6 | 192.9 | 197.2 | 214.4 |
| Crude, both sexes (/100,000) | 125.9 | – | – | 147.8 |

**Age-specific (5-year band) rates by sex from this paper: NOT CONFIRMED** (they are in the paywalled full text). This is the main gap.

### 2b. Open alternative: Azizieh 2017, Table 2 (exact)

Azizieh FY, et al. Fractures in Kuwait: incidence and distribution. *Risk Manag Healthc Policy.* 2017 Jun 14;10:117–125. doi:10.2147/RMHP.S136844. PMC5476756.
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC5476756/

Same data source (MOPH national registry), same years (2009–2012), by **10-year** age band, split by nationality.
Table title (exact): "Numbers and age-specific incidence rates (per 100,000 person-years) of fractures in the hip and other sites, in Kuwait (2009–2012)."
"Population" is person-years summed over the 4 years (check: 45 / 119,177 × 100,000 = 37.8).

**Hip fracture, Kuwaitis (nationals)**

| Age (y) | Male person-yrs | Male hip n | **Male rate** | Female person-yrs | Female hip n | **Female rate** | M:F |
|---|---|---|---|---|---|---|---|
| 40–49 | 208,893 | 38 | **18.2** | 240,772 | 18 | **7.5** | 2.4 |
| 50–59 | 119,177 | 45 | **37.8** | 155,392 | 39 | **25.1** | 1.5 |
| 60–69 | 59,293 | 52 | **87.7** | 83,456 | 116 | **139.0** | 0.6 |
| 70–79 * | 32,840 | 105 | **319.7** | 37,090 | 141 | **380.2** | 0.8 |
| ≥80 | 9,748 | 84 | **861.7** | 10,814 | 96 | **887.7** | 1.0 |

**Hip fracture, non-Kuwaitis (expatriates)**

| Age (y) | Male person-yrs | Male hip n | **Male rate** | Female person-yrs | Female hip n | **Female rate** | M:F |
|---|---|---|---|---|---|---|---|
| 40–49 | 1,367,301 | 180 | **13.2** | 534,345 | 29 | **5.4** | 2.4 |
| 50–59 | 593,897 | 113 | **19.0** | 184,184 | 45 | **24.4** | 0.8 |
| 60–69 | 137,913 | 85 | **61.6** | 51,664 | 66 | **127.7** | 0.5 |
| 70–79 * | 25,675 | 67 | **261.0** | 17,109 | 88 | **514.3** | 0.5 |
| ≥80 | 4,449 | 40 | **899.1** | 6,623 | 62 | **936.1** | 1.0 |

\* The source table prints this row as "79–79"; the text of the same paper calls it "the age group 70–79 years", so it is a typo in the source.

Caution: these are 10-year bands and are **not** the exact rates inside FRAX Kuwait. FRAX models normally use 5-year bands, smoothed. Use these only as a documented approximation.

---

## 3. Mortality

### 3a. What FRAX Kuwait used: NOT CONFIRMED

No open paper states the mortality source or year for the Kuwait model. Johansson 2017 does not state it.

Only indirect evidence, from the Saudi FRAX paper (Saleh YAL et al. *Incidence of hip fracture in Saudi Arabia and the development of a FRAX model.* Arch Osteoporos 2022;17(1):56. doi:10.1007/s11657-022-01085-x. PMC8976798, Discussion):
> "After the age of 70 years, the mortality estimates were much higher in Saudi nationals than for the nationals of Kuwait or Abu Dhabi. These observations emphasise the importance of the death hazard as well as the fracture hazard in the determination of fracture probability."

This suggests the Kuwait model used mortality for **Kuwaiti nationals**, not WHO all-resident life tables. Source and year: **NOT CONFIRMED**.
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC8976798/

### 3b. Fallback only: WHO life table, Kuwait (all residents)

Source: WHO Global Health Observatory, indicator `LIFE_0000000029` ("nMx – age-specific death rate between ages x and x+n"), country KWT, current WHO GHE release (records dated 2026-10-01).
API URL used: `https://ghoapi.azureedge.net/api/LIFE_0000000029?$filter=SpatialDim eq 'KWT'`
Values are annual death rates per person (multiply by 100,000 for per-100,000).

**This is NOT the FRAX input.** WHO revises past years in each release, and these figures cover the whole resident population (about two-thirds expatriates), while FRAX Kuwait appears to use nationals.

| Age (y) | Women 2012 | Men 2012 | Women 2015 | Men 2015 |
|---|---|---|---|---|
| 40–44 | 0.000621033 | 0.001172283 | 0.000480584 | 0.001010973 |
| 45–49 | 0.000845352 | 0.0019274 | 0.000865078 | 0.001629057 |
| 50–54 | 0.001834652 | 0.00308494 | 0.001592363 | 0.002781561 |
| 55–59 | 0.003096437 | 0.005022104 | 0.00309592 | 0.0041064 |
| 60–64 | 0.007348875 | 0.008166589 | 0.006228382 | 0.006521625 |
| 65–69 | 0.015300606 | 0.015612702 | 0.013219531 | 0.011882241 |
| 70–74 | 0.028025426 | 0.02962299 | 0.026624067 | 0.022929407 |
| 75–79 | 0.051639194 | 0.048049101 | 0.049558819 | 0.042523718 |
| 80–84 | 0.074916276 | 0.064669565 | 0.06743197 | 0.059641246 |
| 85+ | 0.110263293 | 0.113512765 | 0.12401188 | 0.1076108 |

The full Kuwait series (2000–2023, all ages, both sexes) is saved in `dl\who_nmx_kwt.json`.

---

## 4. Swedish (Malmö) MOF/hip ratios

**Is it used for Kuwait?** No open source says so for Kuwait in words. The general rule is stated in the later Gulf FRAX papers by the same FRAX team:

Qatar (Abdulla N, et al. *Epidemiology of hip fracture in Qatar and development of a country specific FRAX model.* Arch Osteoporos 2022;17(1):49. doi:10.1007/s11657-022-01083-z), Methods:
> "For other major osteoporotic fractures (MOF; clinical spine, forearm, and humeral fractures), it was assumed that the age- and sex-specific ratios of these fractures to hip fracture risk found in Sweden were comparable to those in Qatar. This assumption has been used for many of the FRAX models with incomplete epidemiological information."
> "In the absence of such information, FRAX models are based on the assumption that the age- and sex-specific pattern of these fractures is similar to that observed in Malmo, Sweden [13]."
URL: https://link.springer.com/article/10.1007/s11657-022-01083-z

Saudi (Saleh et al. 2022, PMC8976798) uses the same wording.

Chakhtoura M, et al. 2021, systematic review of MOF/hip ratios (J Bone Miner Res; PMC8531513):
> "In almost all other countries where MOF rates are not available, FRAX uses country specific hip fracture data and assumes the MOF/Hip fracture ratio is the same worldwide as in Malmo, Sweden (5)."
> "FRAX calculator therefore uses the Malmo MOF/hip IRRs to derive 10-year MOF estimates for almost all country specific calculators (5), with the exception, to the best of our knowledge, of Iceland (33), and Switzerland (51, 52)."
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC8531513/

Since Kuwait only had hip fracture data (section 2) and is not named as an exception, Kuwait **very likely** uses the Malmö ratios. **[INFERRED]**, not stated for Kuwait.

**Ratio values by age: NOT CONFIRMED.** The same review says:
> "We were unable to compare the derived IRRs to those from Malmo Sweden, due to the unavailability of number of fractures by age and gender specific categories."

The Malmö source data are in Kanis JA et al. *The burden of osteoporotic fractures: a method for setting intervention thresholds.* Osteoporos Int 2001;12:417–427 (doi:10.1007/s001980170112) and Kanis JA et al. *Long-term risk of osteoporotic fracture in Malmö.* Osteoporos Int 2000;11:669–674 (doi:10.1007/s001980070064). Both are closed access (OpenAlex `oa_status: closed`), so no ratio values are given here.

---

## 5. Intervention and assessment thresholds (IT, LAT, UAT)

### 5a. Johansson et al. 2017, Table 2 (exact)

Table 2 title (exact): "Ten-year probabilities of a major osteoporotic fracture (%) in postmenopausal women by age to show the intervention threshold together with the upper assessment threshold and lower assessment threshold, derived using the Kuwaiti FRAX model. Under this scheme, BMD testing would be recommended at probabilities lying between the upper and lower assessment thresholds."
(PMC5881885, Table 2; manuscript PDF p.16)

| Age | IT | LAT | UAT |
|---|---|---|---|
| 40 | 2.3 | 1.0 | 2.8 |
| 45 | 3.2 | 1.4 | 3.8 |
| 50 | 4.3 | 2.0 | 5.1 |
| 55 | 5.4 | 2.5 | 6.5 |
| 60 | 6.5 | 3.1 | 7.8 |
| 65 | 7.6 | 3.8 | 9.1 |
| 70 | 9.0 | 4.7 | 11 |
| 75 | 11 | 6.2 | 13 |
| 80 | 14 | 8.5 | 17 |
| 85 | 19 | 12 | 23 |
| 90 | 23 | 14 | 27 |

### 5b. How they were derived (exact quotes, Johansson 2017, Methods and Results)

- BMI: "Body mass index was set at 30kg/m2 (the average value Kuwaiti women [19]) for all scenarios and individuals were assumed to have no other FRAX risk variables." (Ref [19] = Public Authority for Civil Information, paci.gov.kw.)
- IT: "The intervention threshold was set at the age-dependent 10-year probability of a major osteoporotic fracture that was equivalent to a woman with a prior fragility fracture (see Figure 1)." Probabilities were computed "without the inclusion of BMD".
- Abstract: "A FRAX-based intervention threshold, defined as the 10-year probability of a major osteoporotic fracture in a woman of average BMI with a previous fracture, rose with age from 4.3% at the age of 50 years to 23%, at the age of 90 years".
- LAT: "The lower assessment threshold was based on the 10-year probability (without BMD) of a major osteoporosis fracture equivalent to women without clinical risk factors (and a body mass index of 30 kg/m2)."
- UAT: "For this reason, the upper assessment threshold was set at 1.2 times the intervention threshold."
- Hip: "The methodology used in the present report for hip fracture was identical to that used for a major osteoporotic fracture."

So: **IT = 10-yr MOF probability, woman, BMI 30, prior fragility fracture, no other risk factor, no BMD. LAT = same woman with no risk factors. UAT = 1.2 × IT.** It follows the UK NOGG method.

### 5c. Kuwait Osteoporosis Guidelines 2022 (KOPS), "Fracture Probability Table" (exact)

Kuwait Osteoporosis Society. *Kuwait Osteoporosis Guidelines 2022.* PDF page 5, "Fracture Probability Table — The ten year Probability of Major Osteoporotic Fracture MOF (%)".
Original URL (now returns 404): https://kops-kw.org/uploads/KOPS%20guidlines%202022-compressed.pdf
Archived copy used: https://web.archive.org/web/20250415195114/https://kops-kw.org/uploads/KOPS%20guidlines%202022-compressed.pdf (saved as `dl\kops2022.pdf`, SHA-256 69bdc3fd…bb17)

| Age | IT | LAT | UAT |
|---|---|---|---|
| 40 | 2.3 | 1.0 | 2.8 |
| 43 | 2.8 | 1.3 | 3.4 |
| 45 | 3.2 | 1.4 | 3.8 |
| 47 | 3.6 | 1.7 | 4.3 |
| 50 | 4.3 | 2.0 | 5.1 |
| 53 | 5.0 | 2.3 | 6.0 |
| 55 | 5.4 | 2.5 | 6.5 |
| 57 | 5.8 | 2.8 | 7.0 |
| 60 | 6.5 | 3.1 | 7.8 |
| 63 | 7.2 | 3.5 | 8.6 |
| 65 | 7.6 | 3.8 | 9.1 |
| 67 | 8.2 | 4.1 | 9.8 |
| 70 | 9.0 | 4.7 | 11 |
| 73 | 10 | 5.5 | 12 |
| 75 | 11 | 6.2 | 13 |
| 77 | 12 | 7.0 | 14 |
| 80 | 14 | 8.5 | 17 |
| 83 | 17 | 10 | 20 |
| 85 | 19 | 12 | 23 |
| 87 | 20 | 13 | 24 |
| 90 | 23 | 14 | 27 |

- At ages 40, 45, 50 … 90 the KOPS values are **identical** to Johansson 2017 Table 2. The KOPS PDF does not name its source, and it does not say how the odd ages (43, 47, …, 87) were made.
- KOPS 2022 decision rules (page 2 flowchart, exact wording): "Below intervention threshold → Low Risk → Reassure and repeat FRAX & DXA after 3 years"; "Between intervention threshold and upper assessment threshold → High Risk → Treat with antiresorptive therapy"; "Above upper assessment threshold → Very High Risk → Treat with anabolic therapy"; history of fragility fracture "(Spine, hip or [symbol] 2 other fractures)" → "Very High Risk". (One symbol before "2" did not come through in the text; it is probably "≥", but this is NOT CONFIRMED. Check the PDF by eye.)

### 5d. Hip fracture thresholds (Johansson 2017, supplement Table A2, exact)

"Ten-year probabilities of a hip fracture (%) in postmenopausal women by age to show the intervention threshold together with the upper assessment threshold and lower assessment threshold, derived using the Kuwaiti FRAX model."

| Age | IT | LAT | UAT |
|---|---|---|---|
| 40 | 0.23 | 0.04 | 0.28 |
| 45 | 0.35 | 0.07 | 0.42 |
| 50 | 0.56 | 0.14 | 0.67 |
| 55 | 0.91 | 0.27 | 1.09 |
| 60 | 1.43 | 0.49 | 1.72 |
| 65 | 2.04 | 0.82 | 2.44 |
| 70 | 2.79 | 1.32 | 3.35 |
| 75 | 3.70 | 2.04 | 4.44 |
| 80 | 4.87 | 3.16 | 5.84 |
| 85 | 7.35 | 4.8 | 8.82 |
| 90 | 10.2 | 6.72 | 12.2 |

### 5e. Different thresholds at BMI 25 (abstract only)

Naseri A, et al. *FRAX-derived intervention and assessment thresholds for osteoporosis in ten Middle Eastern countries.* Arch Osteoporos 2024;19(1):41. doi:10.1007/s11657-024-01397-0. PMID 38780743 (closed access; abstract only).
> "The age-specific 10-year probabilities of a major osteoporotic fracture (MOF) for a woman with a BMI of 25.0 kg/m2, without BMD and clinical risk factors except for prior fracture, were calculated as intervention Threshold (IT)."
> "… 2.7 to 27.0% in Kuwait … at the age of 40 and 90 years, respectively."

This uses BMI 25, not 30, so it does not match the KOPS table. Do not mix the two.

---

## 6. Published FRAX Kuwait outputs to test a re-built model against

If the clinic site rebuilds the model, these are the published outputs it should reproduce.

**Johansson 2017, Table 1:** 10-year MOF probability (%), women, BMI 30, Kuwait model (manuscript PDF p.15).

| Age | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| No clinical risk factors | 1.0 | 1.4 | 2.0 | 2.5 | 3.1 | 3.8 | 4.7 | 6.2 | 8.5 | 12 | 14 |
| BMD T-score −2.5 SD | 2.6 | 3.3 | 4.3 | 5.3 | 6.0 | 6.5 | 7.1 | 8.0 | 9.5 | 11 | 13 |
| Previous fracture | 2.3 | 3.2 | 4.3 | 5.4 | 6.5 | 7.6 | 9.0 | 11 | 14 | 19 | 23 |
| BMD T-score −1.5 SD | 1.6 | 2.1 | 2.8 | 3.3 | 3.7 | 4.0 | 4.4 | 5.2 | 6.4 | 7.9 | 9.2 |

**Johansson 2017, supplement Table A1:** 10-year **hip** fracture probability (%), women, BMI 30.

| Age | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| No clinical risk factors | 0.04 | 0.07 | 0.14 | 0.27 | 0.49 | 0.82 | 1.32 | 2.04 | 3.16 | 4.80 | 6.72 |
| BMD T-score −2.5 SD | 1.02 | 1.10 | 1.32 | 1.67 | 2.02 | 2.31 | 2.59 | 2.95 | 3.49 | 4.28 | 5.22 |
| Previous fracture | 0.23 | 0.35 | 0.56 | 0.91 | 1.43 | 2.04 | 2.79 | 3.70 | 4.87 | 7.35 | 10.2 |
| BMD T-score −1.5 SD | 0.21 | 0.26 | 0.34 | 0.48 | 0.63 | 0.78 | 0.97 | 1.23 | 1.65 | 2.30 | 3.19 |

**Johansson 2017, Table 3:** women aged 65, BMI 30, 10-year MOF (%): A T −2.5, no CRF = 6.5; B T −2.5 + parental hip fracture = 11.0; C T −2.0, no CRF = 5.0; D T −2.0 + parental hip fracture = 9.1; E no BMD, prior fracture = 7.6.

**Abdulbari A, et al. *Epidemiology of hip fracture in Iraq and development of a country-specific FRAX model.* Arch Osteoporos 2025;20(1):145. doi:10.1007/s11657-025-01631-3 (PMC12657562), Table 2:** age 65, prior fracture, no other risk factors, no BMD, **BMI 25**, Kuwait model: women MOF **8.9**, hip **2.6**; men MOF **5.6**, hip **1.7**.

**Lifetime hip fracture probability at age 50, Kuwait** (Saleh 2022 Table 3, and Abdulbari 2025 Table 3): women **9.2 %**, men **7.6 %**.

**Note on the FRAX engine:** country inputs alone are not enough to rebuild FRAX. The risk-factor hazard functions and the probability engine are FRAX's own and are not fully published. A rebuilt model should be checked against the outputs above. The numbers may also shift a little between FRAX versions (the 2017 and 2025 values come from different years).

---

## 7. What is missing

1. Age-specific (5-year) hip fracture incidence used in FRAX Kuwait. It is likely in Azizieh 2015 (Arch Osteoporos 10:40), which is paywalled. You need library access or the author's copy.
2. The mortality source and year used in FRAX Kuwait. No open source states it; the evidence points to Kuwaiti nationals.
3. The Malmö MOF/hip ratio values by age and sex. These are not published in open form.
4. Kuwait IT/LAT/UAT for **men**. Johansson 2017 says the same thresholds apply to men by design (NOGG approach), but no separate table for men was published.
5. The source for the KOPS 2022 odd-age rows (43, 47, … 87). The PDF does not cite one.

---

## 8. JSON

```json
{
  "meta": {
    "compiled": "2026-10-16",
    "model_release": "March 2016 (Johansson et al. 2017, Osteoporos Int 28:3099-3105, PMC5881885)",
    "units": {
      "probabilities": "10-year probability, percent",
      "incidence": "per 100,000 person-years",
      "mortality_nMx": "annual death rate per person"
    }
  },
  "intervention_thresholds_MOF_women_BMI30": {
    "source": "Johansson 2017 Table 2 (ages 40-90 step 5); KOPS Kuwait Osteoporosis Guidelines 2022 p.5 (all ages listed)",
    "definition": {
      "IT": "10-yr MOF probability, woman, BMI 30, prior fragility fracture, no other CRF, no BMD",
      "LAT": "10-yr MOF probability, woman, BMI 30, no CRF, no BMD",
      "UAT": "1.2 x IT"
    },
    "rows": [
      {"age": 40, "IT": 2.3, "LAT": 1.0, "UAT": 2.8},
      {"age": 43, "IT": 2.8, "LAT": 1.3, "UAT": 3.4, "source_only": "KOPS 2022"},
      {"age": 45, "IT": 3.2, "LAT": 1.4, "UAT": 3.8},
      {"age": 47, "IT": 3.6, "LAT": 1.7, "UAT": 4.3, "source_only": "KOPS 2022"},
      {"age": 50, "IT": 4.3, "LAT": 2.0, "UAT": 5.1},
      {"age": 53, "IT": 5.0, "LAT": 2.3, "UAT": 6.0, "source_only": "KOPS 2022"},
      {"age": 55, "IT": 5.4, "LAT": 2.5, "UAT": 6.5},
      {"age": 57, "IT": 5.8, "LAT": 2.8, "UAT": 7.0, "source_only": "KOPS 2022"},
      {"age": 60, "IT": 6.5, "LAT": 3.1, "UAT": 7.8},
      {"age": 63, "IT": 7.2, "LAT": 3.5, "UAT": 8.6, "source_only": "KOPS 2022"},
      {"age": 65, "IT": 7.6, "LAT": 3.8, "UAT": 9.1},
      {"age": 67, "IT": 8.2, "LAT": 4.1, "UAT": 9.8, "source_only": "KOPS 2022"},
      {"age": 70, "IT": 9.0, "LAT": 4.7, "UAT": 11},
      {"age": 73, "IT": 10, "LAT": 5.5, "UAT": 12, "source_only": "KOPS 2022"},
      {"age": 75, "IT": 11, "LAT": 6.2, "UAT": 13},
      {"age": 77, "IT": 12, "LAT": 7.0, "UAT": 14, "source_only": "KOPS 2022"},
      {"age": 80, "IT": 14, "LAT": 8.5, "UAT": 17},
      {"age": 83, "IT": 17, "LAT": 10, "UAT": 20, "source_only": "KOPS 2022"},
      {"age": 85, "IT": 19, "LAT": 12, "UAT": 23},
      {"age": 87, "IT": 20, "LAT": 13, "UAT": 24, "source_only": "KOPS 2022"},
      {"age": 90, "IT": 23, "LAT": 14, "UAT": 27}
    ]
  },
  "intervention_thresholds_HIP_women_BMI30": {
    "source": "Johansson 2017 supplementary Table A2",
    "rows": [
      {"age": 40, "IT": 0.23, "LAT": 0.04, "UAT": 0.28},
      {"age": 45, "IT": 0.35, "LAT": 0.07, "UAT": 0.42},
      {"age": 50, "IT": 0.56, "LAT": 0.14, "UAT": 0.67},
      {"age": 55, "IT": 0.91, "LAT": 0.27, "UAT": 1.09},
      {"age": 60, "IT": 1.43, "LAT": 0.49, "UAT": 1.72},
      {"age": 65, "IT": 2.04, "LAT": 0.82, "UAT": 2.44},
      {"age": 70, "IT": 2.79, "LAT": 1.32, "UAT": 3.35},
      {"age": 75, "IT": 3.70, "LAT": 2.04, "UAT": 4.44},
      {"age": 80, "IT": 4.87, "LAT": 3.16, "UAT": 5.84},
      {"age": 85, "IT": 7.35, "LAT": 4.8, "UAT": 8.82},
      {"age": 90, "IT": 10.2, "LAT": 6.72, "UAT": 12.2}
    ]
  },
  "validation_outputs": {
    "MOF_women_BMI30_Johansson2017_Table1": {
      "ages": [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90],
      "no_CRF": [1.0, 1.4, 2.0, 2.5, 3.1, 3.8, 4.7, 6.2, 8.5, 12, 14],
      "T_minus2_5": [2.6, 3.3, 4.3, 5.3, 6.0, 6.5, 7.1, 8.0, 9.5, 11, 13],
      "prior_fracture": [2.3, 3.2, 4.3, 5.4, 6.5, 7.6, 9.0, 11, 14, 19, 23],
      "T_minus1_5": [1.6, 2.1, 2.8, 3.3, 3.7, 4.0, 4.4, 5.2, 6.4, 7.9, 9.2]
    },
    "HIP_women_BMI30_Johansson2017_TableA1": {
      "ages": [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90],
      "no_CRF": [0.04, 0.07, 0.14, 0.27, 0.49, 0.82, 1.32, 2.04, 3.16, 4.80, 6.72],
      "T_minus2_5": [1.02, 1.10, 1.32, 1.67, 2.02, 2.31, 2.59, 2.95, 3.49, 4.28, 5.22],
      "prior_fracture": [0.23, 0.35, 0.56, 0.91, 1.43, 2.04, 2.79, 3.70, 4.87, 7.35, 10.2],
      "T_minus1_5": [0.21, 0.26, 0.34, 0.48, 0.63, 0.78, 0.97, 1.23, 1.65, 2.30, 3.19]
    },
    "age65_women_BMI30_MOF_Johansson2017_Table3": {
      "T-2.5_noCRF": 6.5, "T-2.5_parentalHip": 11.0, "T-2.0_noCRF": 5.0, "T-2.0_parentalHip": 9.1, "noBMD_priorFracture": 7.6
    },
    "age65_priorFracture_BMI25_Abdulbari2025_Table2": {
      "women": {"MOF": 8.9, "HIP": 2.6},
      "men": {"MOF": 5.6, "HIP": 1.7}
    },
    "lifetime_hip_at50_pct": {"women": 9.2, "men": 7.6, "source": "Saleh 2022 Table 3; Abdulbari 2025 Table 3"}
  },
  "hip_fracture_incidence": {
    "FRAX_model_5yr_rates": "NOT CONFIRMED (Azizieh 2015 Arch Osteoporos 10:40, paywalled)",
    "Azizieh2015_abstract_ASR_50plus_Kuwaitis": {
      "years": [2009, 2010, 2011, 2012],
      "male": [129.5, 131.5, 154.6, 169.8],
      "female": [189.6, 192.9, 197.2, 214.4],
      "standard": "world population 2010"
    },
    "Azizieh2017_RMHP_Table2_hip_10yr_bands": {
      "note": "2009-2012 MOPH registry; NOT the FRAX input; row printed '79-79' in source = 70-79",
      "Kuwaitis": {
        "40-49": {"male": 18.2, "female": 7.5},
        "50-59": {"male": 37.8, "female": 25.1},
        "60-69": {"male": 87.7, "female": 139.0},
        "70-79": {"male": 319.7, "female": 380.2},
        "80+":   {"male": 861.7, "female": 887.7}
      },
      "non_Kuwaitis": {
        "40-49": {"male": 13.2, "female": 5.4},
        "50-59": {"male": 19.0, "female": 24.4},
        "60-69": {"male": 61.6, "female": 127.7},
        "70-79": {"male": 261.0, "female": 514.3},
        "80+":   {"male": 899.1, "female": 936.1}
      }
    }
  },
  "mortality": {
    "FRAX_model_source": "NOT CONFIRMED (Saleh 2022 implies Kuwaiti nationals)",
    "WHO_GHO_LIFE_0000000029_nMx_KWT_fallback": {
      "note": "all residents; current WHO GHE release; NOT the FRAX input",
      "ages": ["40-44", "45-49", "50-54", "55-59", "60-64", "65-69", "70-74", "75-79", "80-84", "85+"],
      "2012": {
        "female": [0.000621033, 0.000845352, 0.001834652, 0.003096437, 0.007348875, 0.015300606, 0.028025426, 0.051639194, 0.074916276, 0.110263293],
        "male":   [0.001172283, 0.0019274, 0.00308494, 0.005022104, 0.008166589, 0.015612702, 0.02962299, 0.048049101, 0.064669565, 0.113512765]
      },
      "2015": {
        "female": [0.000480584, 0.000865078, 0.001592363, 0.00309592, 0.006228382, 0.013219531, 0.026624067, 0.049558819, 0.06743197, 0.12401188],
        "male":   [0.001010973, 0.001629057, 0.002781561, 0.0041064, 0.006521625, 0.011882241, 0.022929407, 0.042523718, 0.059641246, 0.1076108]
      }
    }
  },
  "swedish_MOF_to_hip_ratios": {
    "used_for_Kuwait": "INFERRED (general FRAX rule; Kuwait not named as an exception; no Kuwait-specific statement found)",
    "values_by_age": "NOT CONFIRMED (Kanis 2000/2001 Malmo data, closed access)"
  }
}
```

---

## 9. Sources (all opened)

- Johansson H, et al. 2017. Osteoporos Int 28:3099–3105. https://pmc.ncbi.nlm.nih.gov/articles/PMC5881885/ ; PDF https://eprints.whiterose.ac.uk/129499/1/emss-76781.pdf ; supplement https://pmc.ncbi.nlm.nih.gov/articles/instance/5881885/bin/NIHMS76781-supplement-Supplementary_tables.docx
- Kuwait Osteoporosis Society. Kuwait Osteoporosis Guidelines 2022. https://kops-kw.org/uploads/KOPS%20guidlines%202022-compressed.pdf (archived copy: https://web.archive.org/web/20250415195114/https://kops-kw.org/uploads/KOPS%20guidlines%202022-compressed.pdf)
- Azizieh FY. 2015. Arch Osteoporos 10:40 (abstract only). https://link.springer.com/article/10.1007/s11657-015-0248-x
- Azizieh FY, et al. 2017. Risk Manag Healthc Policy 10:117–125. https://pmc.ncbi.nlm.nih.gov/articles/PMC5476756/
- Saleh YAL, et al. 2022. Arch Osteoporos 17:56. https://pmc.ncbi.nlm.nih.gov/articles/PMC8976798/
- Abdulla N, et al. 2022. Arch Osteoporos 17:49. https://link.springer.com/article/10.1007/s11657-022-01083-z
- Abdulbari A, et al. 2025. Arch Osteoporos 20:145. https://pmc.ncbi.nlm.nih.gov/articles/PMC12657562/
- Chakhtoura M, et al. 2021. J Bone Miner Res (MOF/hip ratio review). https://pmc.ncbi.nlm.nih.gov/articles/PMC8531513/
- Naseri A, et al. 2024. Arch Osteoporos 19:41 (abstract only, via NCBI E-utilities). https://pubmed.ncbi.nlm.nih.gov/38780743/
- WHO GHO OData API, LIFE_0000000029, Kuwait. https://ghoapi.azureedge.net/api/LIFE_0000000029?$filter=SpatialDim%20eq%20'KWT'
