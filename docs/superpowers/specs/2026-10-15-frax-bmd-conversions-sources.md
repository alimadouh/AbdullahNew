# Femoral neck BMD to FRAX T-score: conversions per machine

Checked 2026-10-15. Every number below was copied from a source that was opened in this session. Where the original paper was behind a paywall, that is said clearly.

Tags: **[STATED]** = written in the source. **[INFERRED]** = my own step built from stated numbers. **[MY RECOMMENDATION]** = my advice.

## Summary

| Machine (FRAX code) | Status | Formula used here |
|---|---|---|
| Hologic (2) | **CONFIRMED** | T = (BMD − 0.858) / 0.120 |
| GE-Lunar (1) | **CONFIRMED (coefficients)** / FRAX's own equation **NOT CONFIRMED** | H = (0.939·BMD − 0.023 − 0.019) / 1.087, then T = (H − 0.858) / 0.120 |
| Norland (3) | **CONFIRMED (coefficients, secondary sources)** / FRAX's own equation **NOT FOUND** | H = (0.985·BMD + 0.006 − 0.019) / 1.087, then T = (H − 0.858) / 0.120 [INFERRED] |
| DMS/Medilink (5) | **NOT FOUND** | none |
| IMEX/Medical (5.1) | **NOT FOUND** | none |
| Mindways QCT (6) | **NOT FOUND** | none |
| Osteosys (7) | **NOT FOUND** | none |
| T-score (4) | n/a | user types the T-score directly |

Important: the FRAX calculator does **not** do the conversion in the browser. The fraxplus.org calculator script (`/modules/custom/frax_calculator/js/index-BvSNS0RO.js`) only lists the machines and sends the BMD to the server. The T-score comes back from the server (`variables.score`). The FRAX website does not publish the equations. So no machine's "FRAX equation" can be copied from FRAX itself.

---

## 0. What FRAX says about the reference (CONFIRMED)

**FRAX FAQ**, https://www.fraxplus.org/faq [STATED]:
> "You should input a T-score for the femoral neck derived from the reference standard (the NHANES III database for female Caucasians aged 20-29 years as widely recommended). ... Note that the same reference range is used for men (i.e. the NHANES III database for female Caucasians age 20-29 years). If you are uncertain about the T-score, input the manufacturer of the measurement device and the BMD result. The FRAX ® T-score will be calculated for you."

**FRAX calculator text** (pop-up when "T-score" is chosen), from https://www.fraxplus.org/calculation-tool, script `index-BvSNS0RO.js` [STATED]:
> "The site and reference technology is DXA at the femoral neck. T-scores are based on the NHANES reference values for women aged 20-29 years. The same absolute values are used in men."

**FRAX machine list in that script** [STATED]: GE-Lunar = 1, Hologic = 2, Norland = 3, T-score = 4, DMS/Medilink = 5, IMEX/Medical = 5.1, Mindways QCT = 6, Osteosys = 7. (IMEX has code 5.1, next to DMS/Medilink 5. This hints that FRAX groups them, but it does not show an equation.)

**Kanis JA et al. Bone 2008;42:467–475** (PMID 18180210), abstract via PubMed E-utilities [STATED]:
> "The recommended reference range is the NHANES III reference database for femoral neck measurements in women aged 20-29 years. A similar cut-off value for femoral neck BMD that is used to define osteoporosis in women can be used for the diagnosis of osteoporosis in men - namely, a value for BMD 2.5 SD or more below the average for young adult women."
Full text is paywalled (ScienceDirect returned 403). Its tables were NOT opened.

**Kanis JA et al. Osteoporos Int 2013 (IOF position paper)**, https://esceo.org/sites/esceo/files/pdf/2013-05-04%20Kanis%202013%20Standardising%20BMD%20OI%20on%20line.pdf, page 1 [STATED]:
> "The recommended reference range was the National Health and Nutrition Examination Survey (NHANES) III reference database for femoral neck measurements in Caucasian women aged 20 –29 years [5]."
Reference [5] = Looker AC et al. (1998) Osteoporos Int 8:468–489.

**NHANES III was measured on Hologic.** Binkley N et al. J Bone Miner Res 2005;20:195–201 (PMID 15647812), abstract [STATED]:
> "the International Committee for Standards in Bone Measurement (ICSBM) recommended the NHANES III database for femur T-score derivation. Acquired on Hologic (Hol) instruments, this database requires conversion equations for application to other DXA systems."

---

## 1. Hologic: CONFIRMED

### Reference mean and SD
**Fujiwara S, Nakamura T, Orimo H, Hosoi T, Gorai I, Oden A, Johansson H, Kanis JA.** "Development and application of a Japanese model of the WHO fracture risk assessment tool (FRAX)." Osteoporos Int 2008;19:429–435. PMC2267486, section "Japanese reference values". Authors include Kanis, Oden and Johansson (the FRAX team at Sheffield). [STATED]
> "The reference mean in women aged 20–29 years at the femoral neck was 0.858 g/cm 2 (SD = 0.120 g/cm 2 ) using the NHANES III data. ... Thus the threshold for osteoporosis using the NHANES III data was 0.558 g/cm 2 ... The thresholds for osteopenia (WHO definition) were 0.738 g/cm 2"

The same paper cites NHANES III as ref 15 = Looker AC, Wahner HW, Dunn WL, Calvo MS, Harris TB, Heyse SP (1998) Osteoporos Int 8:468–486.
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC2267486/

**Second paper giving the same numbers and citing Looker 1998 directly**: Yu et al., J Bone Miner Res 2026 (MrOS), PMC12875646, Table 1 footnote [STATED]:
> "T-score was calculated as number of standard deviation (SD) below Looker 1998 reference values [34] for young Caucasian females (mean = 0.858, SD = 0.120)"
Ref 34 = Looker AC, Updated data on proximal femur bone mineral levels of US adults. Osteoporos Int 1998;8(5):468–89.
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC12875646/

**FRAX-team paper writing the formula itself**: Povoroznyuk V, Grygorieva N, Johansson H, Lorentzon M, Harvey NC, McCloskey EV, ..., Kanis JA. "FRAX-Based Intervention Thresholds for Osteoporosis Treatment in Ukraine." J Osteoporos 2021. PMC8214495, Table 2 footnote a [STATED]:
> "For Hologic: T-score = (BMD–0.858)/0.120 [ 9 ]."
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC8214495/

**Cross-check from CDC (NCHS), Healthy People 2010 objective 2-9**, https://ftp.cdc.gov/pub/HEALTH_STATISTICS/NCHS/Datasets/DATA2010/Focusarea02/O0209.pdf, page 1 [STATED]:
> "The choice of a femoral BMD of less than 0.56 is the measure 2.5 or more standard deviations below the reference mean for young non-Hispanic white women aged 20 - 29 years from NHANES III."
Check [INFERRED]: 0.858 − 2.5 × 0.120 = 0.858 − 0.300 = 0.558, which rounds to 0.56. It matches.

**Looker 1998 itself (PMID 9850356)**: the abstract was opened, but the full paper is paywalled (Springer). Its table with the 20–29 femoral neck row was **NOT OPENED**. The values 0.858 / 0.120 are attributed to it by the papers above, one of them by the FRAX authors.

### Formula
**T = (BMD_Hologic − 0.858) / 0.120**

### Tests
- BMD = 0.700: (0.700 − 0.858) / 0.120 = −0.158 / 0.120 = **−1.32**
- BMD = 0.558: (0.558 − 0.858) / 0.120 = −0.300 / 0.120 = **−2.50**

---

## 2. GE-Lunar: coefficients CONFIRMED; FRAX's own equation NOT CONFIRMED

### Lu 2001 femoral neck sBMD equations
Primary: Lu Y, Fuerst T, Hui S, Genant HK. "Standardization of bone mineral density at femoral neck, trochanter and Ward's triangle." Osteoporos Int 2001;12:438–444 (PMID 11446558). Abstract opened. Full text paywalled; its table was **NOT OPENED**.

The same coefficients are printed in an open-access paper by Lu and Genant's own group:
**Fan B, Lu Y, Genant H, Fuerst T, Shepherd J.** "Does standardized BMD still remove differences between Hologic and GE-Lunar state-of-the-art DXA systems?" Osteoporos Int 2010;21:1227–1236. Page 3, "Data conversion and statistical analysis" [STATED]:
> "and the Lu et al. formulas for femur BMD [ 4]:
> sBMD Total hip = 1.008 × HTOTBMD Hologic + 0.006
> sBMD Total hip = 0.979 × HTOTBMD Lunar − 0.031
> sBMD Neck = 1.087 × NeckBMD Hologic + 0.019
> sBMD Neck = 0.939 × NeckBMD Lunar − 0.023"
> "Although it is customary to represent sBMD in mg/cm2, we used g/cm2 throughout this paper"
Ref [4] = Lu Y, Fuerst T, Hui S, Genant HK (2001) Osteoporos Int 12:438–444.
URL: https://link.springer.com/content/pdf/10.1007/s00198-009-1062-3.pdf

Second source: Clin Transplant 2011 (PMC6860010), Methods [STATED]:
> "Femoral Neck ( 47 ) Hologic 0.019 + (1.087 × BMD) Lunar −0.023 + (0.939 × BMD) Norland 0.006 + (0.985 × BMD)"
Ref 47 = Lu Y, Fuerst T, Hui S, Genant HK. Osteoporos Int 2001;12:438.
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC6860010/

### The Lunar equation used in a FRAX-team paper
Povoroznyuk ... Johansson, McCloskey, Kanis (2021), PMC8214495, Table 2 footnote b [STATED]:
> "For GE Lunar: T-score = ((−0.023 + 0.939 × BMD–0.019)/1.087–0.858)/0.120) [ 9 , 11 ]."
The Methods say: "Bone density was measured on Hologic or GE Lunar equipment, with the T-scores converted to Hologic T-score units using established conversion equations."

This is the Lu route: Lunar BMD → sBMD → Hologic-equivalent BMD → NHANES T-score. Three FRAX authors are on this paper. But it does **not** say "this is the equation inside the FRAX calculator". So: FRAX's own Lunar equation = **NOT CONFIRMED** (best available evidence only).

### Formula
Step 1: sBMD = 0.939 × BMD_Lunar − 0.023
Step 2: Hologic-equivalent H = (sBMD − 0.019) / 1.087
Step 3: T = (H − 0.858) / 0.120

Same thing in one line [INFERRED]: H = 0.86385 × BMD_Lunar − 0.03864. This is the same as saying the Lunar young-adult mean is about 1.038 g/cm² and the SD is about 0.139 g/cm².

### Tests
- BMD = 1.000: sBMD = 0.939 × 1.000 − 0.023 = 0.9160; H = (0.9160 − 0.019) / 1.087 = 0.8970 / 1.087 = 0.82521; T = (0.82521 − 0.858) / 0.120 = −0.03279 / 0.120 = **−0.27**
- BMD = 0.800: sBMD = 0.939 × 0.800 − 0.023 = 0.7282; H = (0.7282 − 0.019) / 1.087 = 0.7092 / 1.087 = 0.65244; T = (0.65244 − 0.858) / 0.120 = −0.20556 / 0.120 = **−1.71**

---

## 3. Norland: coefficients CONFIRMED (secondary); FRAX's own equation NOT FOUND

### Lu 2001 Norland femoral neck coefficient
The Lu 2001 primary table was not opened (paywall). Fan 2010 lists only Hologic and Lunar. The Norland neck line comes from two secondary papers:

- Clin Transplant 2011, PMC6860010 (quoted above, cites Lu 2001 as ref 47) [STATED]: "Norland 0.006 + (0.985 × BMD)"
- Gulsvik et al., Eur Rev Aging Phys Act 2018, PMC6240258, Methods [STATED]:
> "We used the formula sBMD =1000(a + b*BMD). a = 0.019, − 0-023, and 0.006, and b = 1.087, 0.939, and 0.985 when BMD was measured with a Hologic, Lunar and Norland device respectively."
  (This paper cites a textbook, Bonnick 2010, not Lu 2001 directly.)
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC6240258/

No FRAX or Kanis source with a Norland equation was found.

### Formula [INFERRED: same route as the Lunar equation above]
Step 1: sBMD = 0.985 × BMD_Norland + 0.006
Step 2: H = (sBMD − 0.019) / 1.087
Step 3: T = (H − 0.858) / 0.120
One line [INFERRED]: H = 0.90616 × BMD_Norland − 0.01196.

### Tests
- BMD = 0.900: sBMD = 0.985 × 0.900 + 0.006 = 0.8925; H = (0.8925 − 0.019) / 1.087 = 0.8735 / 1.087 = 0.80359; T = (0.80359 − 0.858) / 0.120 = −0.05441 / 0.120 = **−0.45**
- BMD = 0.700: sBMD = 0.985 × 0.700 + 0.006 = 0.6955; H = (0.6955 − 0.019) / 1.087 = 0.6765 / 1.087 = 0.62236; T = (0.62236 − 0.858) / 0.120 = −0.23564 / 0.120 = **−1.96**

---

## 4. DMS/Medilink: NOT FOUND
No FRAX document, Kanis paper or manufacturer document with the equation FRAX uses was found. Published Stratos-vs-Hologic and Stratos-vs-Lunar cross-calibration studies exist (Montpellier group; J Clin Densitom 2024, Stratos vs Hologic Horizon A), but their coefficients were not opened, and nothing shows FRAX uses them. Not used.

## 5. IMEX/Medical: NOT FOUND
Nothing found. Only fact: in the FRAX script IMEX has code 5.1, next to DMS/Medilink (5).

## 6. Mindways QCT: NOT FOUND
The FDA 510(k) K002113 (CTXA Hip, Mindways, 2001; transcription at https://fda.innolitics.com/device/K002113, scanned original https://www.accessdata.fda.gov/cdrh_docs/pdf/K002113.pdf) [STATED]: "BMD estimates are derived in units of g/cm2 equivalent K2HPO4 density" and "T-scores are calculated with respect to CTXA Hip young normal female reference data". No equation to NHANES III / FRAX was found.

## 7. Osteosys: NOT FOUND
Only an Osteosys Primus vs GE Lunar Prodigy study was found (Ha & Yoo 2021, whole body and spine, not femoral neck to Hologic). No FRAX equation found.

---

## Conflicts between sources

1. **Lunar: Lu sBMD route vs Fan 2010 direct regression.** Fan 2010, Table 4 (Lunar Prodigy vs Hologic Apex), page 8 [STATED]: "Left neck BMD ... Hologic=0.902×GE-Lunar −0.079" and "Right neck BMD ... Hologic=0.913×GE-Lunar −0.080". The Lu route gives H = 0.86385×L − 0.03864. Example with Lunar BMD 0.800: Lu route T = −1.71; Fan left-neck equation gives H = 0.902 × 0.800 − 0.079 = 0.6426, so T = (0.6426 − 0.858) / 0.120 = **−1.80**. Difference about 0.08 SD.
2. **GE Lunar's own printed T-score may differ from FRAX.** Binkley 2005 abstract [STATED]: after GE added NHANES III to Lunar software, "FN ... differences were larger, with mean GE T-scores lower than Hol (p < 0.001) by 0.17", and the cause was "direct application of published NHANES III SDs at the FN". So a Lunar report's T-score is not always the same as the FRAX T-score.
3. **Old pre-1998 values.** Faulkner KG et al., Osteoporos Int 1996 (PMID 9116387) [STATED]: "The Hologic young normal value (mean +/- SD) was redefined as 0.85 +/- 0.11 g/cm2, while the Lunar value was redefined as 1.00 +/- 0.11 g/cm2." This is older than Looker 1998 and does not match 0.858 / 0.120. Do not use.
4. **Lunar conversion in men.** Ganda K et al., Arch Osteoporos 2014 (PMID 25527404) [STATED]: equations derived in women "may not applicable to men at the lumbar spine". The femoral neck was a smaller problem, but FRAX uses the same female reference for men anyway.

## Recommendations [MY RECOMMENDATION]

- Use the Hologic formula as confirmed.
- For Lunar, use the Lu route (it matches the FRAX-team 2021 paper). Label it on the site as "estimated, may differ slightly from fraxplus.org".
- For Norland, the Lu route is reasonable but it is my own build. Label it the same way.
- For DMS/Medilink, IMEX, Mindways QCT and Osteosys: do not offer a g/cm² box. Ask for the femoral neck T-score (NHANES III reference) instead, or send the user to fraxplus.org.
- To check the Lunar and Norland results against FRAX, one person can enter a few BMD values by hand on fraxplus.org and compare the T-score it shows. I did not do this; it was not part of the task, and FRAX limits automated use.

---

## JSON

```json
{
  "reference": {
    "source": "NHANES III femoral neck, white women 20-29 (Looker 1998), Hologic units",
    "mean_g_cm2": 0.858,
    "sd_g_cm2": 0.120,
    "formula": "T = (H - 0.858) / 0.120, where H = Hologic-equivalent femoral neck BMD",
    "status": "CONFIRMED"
  },
  "hologic": {
    "frax_code": 2,
    "status": "CONFIRMED",
    "to_hologic": "H = BMD",
    "tscore": "T = (BMD - 0.858) / 0.120",
    "tests": [{"bmd": 0.700, "t": -1.32}, {"bmd": 0.558, "t": -2.50}],
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2267486/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8214495/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12875646/",
      "https://ftp.cdc.gov/pub/HEALTH_STATISTICS/NCHS/Datasets/DATA2010/Focusarea02/O0209.pdf"
    ]
  },
  "lunar": {
    "frax_code": 1,
    "status": "CONFIRMED coefficients (Lu 2001 via Fan 2010); FRAX internal equation NOT CONFIRMED",
    "sbmd": "sBMD = 0.939 * BMD - 0.023",
    "to_hologic": "H = (sBMD - 0.019) / 1.087  (= 0.86385 * BMD - 0.03864)",
    "tscore": "T = (H - 0.858) / 0.120",
    "tests": [{"bmd": 1.000, "h": 0.82521, "t": -0.27}, {"bmd": 0.800, "h": 0.65244, "t": -1.71}],
    "sources": [
      "https://link.springer.com/content/pdf/10.1007/s00198-009-1062-3.pdf",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8214495/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6860010/"
    ]
  },
  "norland": {
    "frax_code": 3,
    "status": "CONFIRMED coefficients (secondary sources citing Lu 2001); FRAX internal equation NOT FOUND; route INFERRED",
    "sbmd": "sBMD = 0.985 * BMD + 0.006",
    "to_hologic": "H = (sBMD - 0.019) / 1.087  (= 0.90616 * BMD - 0.01196)",
    "tscore": "T = (H - 0.858) / 0.120",
    "tests": [{"bmd": 0.900, "h": 0.80359, "t": -0.45}, {"bmd": 0.700, "h": 0.62236, "t": -1.96}],
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6860010/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6240258/"
    ]
  },
  "dms_medilink": {"frax_code": 5, "status": "NOT FOUND"},
  "imex_medical": {"frax_code": 5.1, "status": "NOT FOUND"},
  "mindways_qct": {"frax_code": 6, "status": "NOT FOUND"},
  "osteosys": {"frax_code": 7, "status": "NOT FOUND"},
  "tscore_direct": {"frax_code": 4, "note": "user enters NHANES III femoral neck T-score directly"}
}
```
