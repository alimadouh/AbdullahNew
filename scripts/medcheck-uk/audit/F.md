# Audit: batch F (trimethoprim, co-trimoxazole, dapsone, hydroxychloroquine, methotrexate)

Second checker, 2026-10-17. Every SmPC in `sources/F.json` was re-read in full (4.1-4.9, 5.1/5.2 where relevant), plus the SPS, MHRA, BUMPS and RCOphth pages. The 4.5 sections of the other batches' SmPCs were searched for these five medicines. All new and changed quotes were checked FOUND. `verify.mjs` after the changes: 4567/4567 quotes found, 0 schema errors, 0 warnings. Scenario runs of `engine.js` against the edited data behaved as intended (see the end of this file).

Coordinator follow-ups were also handled: methotrexate with PPIs at high dose; the engine change so that `med` matches only that medicine; separation-interval level; the oral-antidiabetic group; paediatric eGFR units (none in batch F).

## 1. Changes

Abbreviations: Teva = trimethoprim 200 mg tablet SmPC (mhra-tmp-tab-teva); Pinewood = trimethoprim suspension SmPC (emc-4566); Aspen 480/Forte/paed/adult = co-trimoxazole SmPCs emc-6999/6997/6994/6996; Orion = emc-10988; Mercury = emc-511; Metoject = emc-5443.

### Wrong level

| File | Rule | Before → after | Reason | Supporting quote |
|---|---|---|---|---|
| trimethoprim | `trimethoprim:age:tab-under-4-months` | avoid → contraindicated | The statement sits in 4.3 Contra-indications, and 4.6 says "contra-indicated" | Teva: "Trimethoprim should not be administered to pregnant women, premature infants or children under 4 months of age" (4.3); "Trimethoprim is contra-indicated in pregnant women, premature infants or infants during the first few weeks of life." |
| trimethoprim | `trimethoprim:age:susp-under-6-weeks` | avoid → contraindicated; the full 4.3 sentence now replaces a fragment quote | Same reason (Pinewood 4.3 and 4.6) | Pinewood: "Trimethoprim should not be administered to pregnant women (first trimester of pregnancy (see section 4.6)), premature infants and neonates under 6 weeks." |
| co-trimoxazole | `co-trimoxazole:hepatic:severe` | avoid → contraindicated | Listed in 4.3; the Forte and adult-suspension SmPCs word it "Contra-indicated" | Forte: "Contra-indicated in patients with severe impairment of liver function." |
| co-trimoxazole | `co-trimoxazole:age:under-6-weeks` | avoid → contraindicated | 4.3 item in all four Aspen SmPCs | "Co-trimoxazole should not be given to infants during the first 6 weeks of life." |
| co-trimoxazole | `co-trimoxazole:condition:porphyria` | avoid → contraindicated | 4.3 item | "Co-Trimoxazole should not be given to patients with acute porphyria." |
| co-trimoxazole | `co-trimoxazole:condition:immune-thrombocytopenia` | avoid → contraindicated | 4.3 item | "Co-Trimoxazole should not be given to patients with a history of drug-induced immune thrombocytopenia with use of trimethoprim and/or sulphonamides." |
| methotrexate | `methotrexate:interaction:ciprofloxacin` | info → avoid; effect bone-marrow-suppression; action rewritten | The ciprofloxacin SmPC (batch E, emc-4346) says "not recommended". The old rule said "No specific action stated" | emc-4346: "The concomitant use of ciprofloxacin with methotrexate is not recommended" |
| hydroxychloroquine | `hydroxychloroquine:interaction:antacid` | dose → caution | Timing advice, not a dose change (coordinator item 3) | "a 4 hour interval be observed between hydroxychloroquine sulfate and antacid dosing" |

### Wrong number or boundary

| File | Rule | Before → after | Reason | Quote |
|---|---|---|---|---|
| trimethoprim | `trimethoprim:renal:egfr-15-30` | `{min 15, max 30}` → adds `maxInclusive: true` | The table bands are "Over 30" / "15- 30" / "Under 15", so 30 belongs to the 15-30 band. Before, eGFR exactly 30 matched no rule | "eGFR (ml/min) Dosage advised Over 30 Normal 15- 30 Normal for 3 days then half dose Under 15 Half the normal dose" |
| co-trimoxazole | `co-trimoxazole:renal:crcl-15-30` | adds `maxInclusive: true` | The table bands are ">30" / "15 to 30" / "<15" | "Creatinine Clearance (ml/min) Recommended Dosage >30 2 tablets every 12 hours 15 to 30 1 tablet every 12 hours <15 Not recommended" |

**Trimethoprim renal measure: the decision.** I kept `eGFR`. Both the Teva and the Pinewood SmPCs name the column eGFR. The unit they print is "ml/min", not ml/min/1.73 m². The engine shows eGFR thresholds as mL/min/1.73 m². The rule action and the renal item now say that the SmPCs name eGFR but print ml/min. The engine marks the result provisional if only CrCl is entered. Relabelling the rule as CrCl would contradict the named measure.

### Scope (formulations / age)

| File | Rule(s) | Change | Reason |
|---|---|---|---|
| trimethoprim | `trimethoprim:breastfeeding:susp-infant-under-4m`, `trimethoprim:breastfeeding:tab-short-term` (and the two breastfeeding items) | `formulations` removed. Concern and action name the SmPC; action says the infant's age cannot be checked | These are statements about trimethoprim in breast milk, not about a dosage form. The engine defaults to the first formulation (tablets), so a user who picked "trimethoprim" never saw the suspension SmPC's contraindication |
| trimethoprim | `trimethoprim:condition:porphyria:tab`, `...:porphyria:susp` | `formulations` removed; concerns name Teva / Pinewood | Same reason. Both statements now show, and the stricter one (avoid) leads |
| co-trimoxazole | `co-trimoxazole:renal:crcl-15-30`, `co-trimoxazole:renal:crcl-under-15` | `age: {minYears: 12}` added | The CrCl table is stated only for "Adults and children over 12 years". Children 12 and under are covered by the new renal-impairment condition rule. Quote: "Impaired renal function: Dosage recommendation : Adults and children over 12 years: Creatinine Clearance (ml/min)" |

Age rules for trimethoprim stay formulation-scoped. The tablet limit is under 4 months and the suspension limit is under 6 weeks. That is a product-licence matter, and the suspension SmPC gives dosing from 6 weeks.

### Allergy matching false positive

| File | Rule | Before → after | Reason |
|---|---|---|---|
| dapsone | `dapsone:allergy:own-and-sulfonamide` | allergen `[dapsone, group:sulfonamide, sulfamethoxazole, co-trimoxazole]` → `[dapsone, sulfamethoxazole]` | `group:sulfonamide` and `co-trimoxazole` both expand to all ingredients of co-trimoxazole, including **trimethoprim**. A trimethoprim-only allergy therefore flagged dapsone as contraindicated, although trimethoprim is not a sulfonamide (SPS). A recorded co-trimoxazole or sulfonamide allergy still matches, through sulfamethoxazole. Checked by scenario |
| dapsone | `dapsone:allergy:serious-sulfonamide-sps` | allergen → `[sulfamethoxazole]` | Same reason |

### Missing rules added (20)

| File | New rule id | Level | Source wording |
|---|---|---|---|
| trimethoprim | `trimethoprim:condition:renal-impairment` | caution | Pinewood 4.4: "Care is necessary in administration to patients with impaired renal function." / "In patients with renal impairment, care should be taken to avoid accumulation." |
| trimethoprim | `trimethoprim:condition:fructose-intolerance` (suspension only) | avoid | Pinewood: "Patients with rare hereditary problems of fructose intolerance should not take this medicine." |
| co-trimoxazole | `co-trimoxazole:condition:severe-renal-impairment` | contraindicated (the concern states the qualifier) | 4.3: "Contra-indicated in severe renal insufficiency where repeated measurements of the plasma concentration cannot be performed." (This 4.3 item had no rule.) |
| co-trimoxazole | `co-trimoxazole:condition:renal-impairment` | caution | 4.4: "For patients with known renal impairment special measures should be adopted (see section 4.2)." Also the "No information is available for children aged 12 years and under with renal failure." |
| hydroxychloroquine | `hydroxychloroquine:condition:hypomagnesaemia` | caution | "uncorrected hypokalemia and/or hypomagnesemia" (QT risk factors). Only hypokalaemia had a rule |
| hydroxychloroquine | `hydroxychloroquine:condition:cardiac-disease` | caution | "cardiac disease, e.g., heart failure, myocardial infarction"; "a history of ventricular dysrhythmias" |
| hydroxychloroquine | `hydroxychloroquine:condition:epilepsy` | info | "Hydroxychloroquine can lower the convulsive threshold." |
| hydroxychloroquine | `hydroxychloroquine:condition:blood-disorder` | caution | "patients with severe gastrointestinal, neurological or blood disorders." |
| hydroxychloroquine | `hydroxychloroquine:age:over-65-eye` | monitor | "This examination should be more frequent and adapted to the patient in the following situations" ... "age above 65 years" |
| methotrexate | `methotrexate:interaction:antifolate-tab` (tablets; `group:folate-antagonist` = trimethoprim, co-trimoxazole) | contraindicated | Mercury **4.3**: "Methotrexate tablets should not be used concomitantly with drugs with antifolate properties (e.g. co-trimoxazole)". The existing trimethoprim/co-trimoxazole rules (avoid, SPS) remain and cover the pen |
| methotrexate | `methotrexate:hepatic:liver-disease-mercury` | contraindicated (hepatic any) | Mercury 4.3: "Liver disease including fibrosis, cirrhosis, recent or active hepatitis" |
| methotrexate | `methotrexate:condition:active-liver-disease` | contraindicated | Same quote |
| methotrexate | `methotrexate:condition:no-contraception` | contraindicated | Orion 4.6: "effective contraception must be used during treatment with methotrexate and at least 6 months thereafter"; Mercury lists 6-month contraception inside 4.3 |
| methotrexate | `methotrexate:condition:attempting-to-conceive` | contraindicated | Orion 4.6 pregnancy contraindication + 6-month contraception; BUMPS "wait at least three months" |
| methotrexate | `methotrexate:condition:folate-deficiency` | caution | Orion: "Particular care is therefore advisable in the presence of existing folic acid deficiency."; Mercury: "Folate deficiency may increase methotrexate toxicity" |
| methotrexate | `methotrexate:condition:peptic-ulcer` | caution | Mercury: "Extreme caution should be exercised if there is peptic ulcer or ulcerative colitis." |
| methotrexate | `methotrexate:condition:ulcerative-colitis` | caution | Same quote |
| methotrexate | `methotrexate:condition:psychiatric-depression`, `...:psychiatric-bipolar` | caution | Mercury: "Methotrexate should be used with extreme caution in - debility - extreme youth ... - psychiatric disorders" |
| methotrexate | `methotrexate:interaction:ppi-high-dose` | avoid (concern says HIGH-dose only) | Mercury: "Concomitant use of proton pump inhibitors (PPIs) and high dose methotrexate should be avoided, especially in patients with renal impairment." (coordinator item 1) |

### Text and faithfulness corrections (rules)

| File | Rule | Change | Reason / quote |
|---|---|---|---|
| trimethoprim | `trimethoprim:pregnancy:t2-3` | The action now notes the broader statements: the 4.6 line "contra-indicated in pregnant women" and the Teva 4.3 line "should not be administered to pregnant women". Level stays avoid (see section 2) | Omitted source statements |
| trimethoprim | both renal rules | Action notes the "ml/min" unit printed with eGFR | Measure faithfulness |
| co-trimoxazole | `co-trimoxazole:renal:crcl-15-30` | Action gives the Forte (1 tablet per DAY) and adult suspension (5 ml every 12 hours) doses; adds the Forte quote | Forte: "> 30 1 tablet every 12 hours 15 to 30 1 tablet per day <15 Not recommended". "Halve the dose (e.g. 1 tablet 480 mg)" could be misapplied to Forte |
| co-trimoxazole | `co-trimoxazole:interaction:methotrexate` | Action notes that the Mercury SmPC lists the combination in 4.3 | Mercury 4.3 |
| methotrexate | `methotrexate:interaction:ppi` | Now "Low-dose methotrexate with PPIs" (info, SPS only). High dose is split into the new avoid rule | Coordinator item 1 |
| methotrexate | `methotrexate:interaction:nsaid` | Adds Mercury: "Methotrexate dosage should be monitored if concomitant treatment with aspirin, ibuprofen or indometacin (NSAIDs) is commenced, as concomitant use of NSAID's has been associated with fatal methotrexate toxicity." | Omitted SmPC statement |
| methotrexate | `methotrexate:pregnancy` | Concern is now "Pregnancy" (Mercury contraindicates it for all indications); adds the Mercury quote | "Methotrexate is teratogenic and should not be given during pregnancy or to mothers who are breast-feeding" |
| methotrexate | `methotrexate:condition:serious-infection` | Adds Mercury "Active infectious disease" (4.3) | Omitted 4.3 item |
| methotrexate | `methotrexate:interaction:trimethoprim`, `...:co-trimoxazole` | Action points to the Mercury 4.3 tablet rule | Cross-reference |
| methotrexate | `methotrexate:renal:crcl-30-59` | Adds the Metoject renal table quote. Thresholds checked: Orion and Metoject "≥60 100%, 30-59 50%, <30 must not be used" = `min 30, max 60` (exclusive) and `max 30` (exclusive) for CrCl. Correct | — |
| hydroxychloroquine | `hydroxychloroquine:interaction:antidiabetic` | Consequence now says the SmPC names "insulin or anti-diabetic drugs" as a class (in this database the group holds only metformin). Level stays dose ("a decrease in doses ... may be required") | Coordinator item 4 |
| hydroxychloroquine | `hydroxychloroquine:renal:egfr-under-60` | Adds the SmPC quote on plasma levels in severe renal impairment; the action mentions more frequent eye exams | Action text was unsourced |
| dapsone | `dapsone:allergy:own-and-sulfonamide` | Action rewritten for the new allergen list | — |

### Section items (tables)

- **trimethoprim**
  - contraindications: the T1 item now notes the Teva 4.3 "pregnant women" wording; a new item gives the infant age limits (4 months vs 6 weeks).
  - renal: the measure explanation was rewritten and the Teva quote added.
  - pregnancy T2-3: notes the blanket 4.6/4.3 lines.
  - breastfeeding: formulation scope removed.
- **co-trimoxazole**
  - paediatric: the age-limit item was corrected. "Not licensed" became "Must not be given (4.3)", and the 8-week breastfeeding sentence is explained.
  - paediatric PJP prevention: now includes the once-daily, 3-consecutive-days option ("6 to 12 years 20 ml once a day, three times per week on consecutive days").
  - contraindications: the liver item names "Contra-indicated" (Forte and adult suspension).
  - renal: Forte, adult suspension and paediatric statements added.
  - interactions/methotrexate: Mercury 4.3 named.
- **hydroxychloroquine**
  - dosing: the RCOphth item now says <5 mg/kg/day by ABSOLUTE (actual) body weight, against the SmPC's 6.5 mg/kg/day by IDEAL body weight ("ensuring safe drug dosing according to absolute body weight").
  - monitoring: new SmPC item on when eye exams should be more frequent (>6.5 mg/kg lean body weight, renal insufficiency, VA below 6/8, age above 65, cumulative dose >200 g, tamoxifen).
- **methotrexate**
  - dosing:
    - New first item, "MAXIMUM WEEKLY DOSE - SOURCES DIFFER": 25 mg/WEEK for Orion and Metoject (pen exceptionally 30 mg/WEEK) vs 20 mg/WEEK for Mercury. All three state that more than 20 mg/WEEK markedly raises toxicity. It ends "ONCE WEEKLY, never daily".
    - The Mercury RA item now quotes the test dose.
    - The psoriasis item adds the Mercury regimen (test dose 5-10 mg; 10-25 mg ONCE A WEEK).
  - contraindications: Mercury 4.3 items added (liver disease, active infection, antifolates for tablets, 6-month contraception). The pregnancy item notes that the Mercury SmPC covers any use.
  - cautions: folate deficiency, and the Mercury "extreme caution" list.
  - interactions: the trimethoprim/co-trimoxazole, NSAID, PPI and ciprofloxacin items were corrected as for the rules.
  - hepatic: Mercury liver-disease contraindication added.
  - reproductive: the contraception conflict item is no longer hidden under "More". It now quotes both Mercury 6-month passages (4.3, 4.4), the 3-month men passage (4.6) and BUMPS. The women item adds pregnancy exclusion before starting.
  - monitoring: Mercury schedule added (weekly until stable, then every 2-3 months).
  - counselling: contraception text states the Mercury difference.
- **dapsone**
  - dosing: the dermatitis herpetiformis, malaria prophylaxis, Pneumocystis and paucibacillary leprosy items now say "adults and children over 12". Quote: "Adults and children over 12 years of age:". Before, they read as universal adult/child doses.
- **sources/F.json**: an audit paragraph was appended to `notes`. No source, group or condition entries changed.

### Checked and left as they were (examples)

- **Methotrexate is ONCE WEEKLY everywhere.**
  - Both formulation labels say it.
  - Every dosing and paediatric item says ONCE WEEKLY or "per WEEK". The ALL item says "usually given once weekly", as the source does.
  - The renal action says "still ONCE WEEKLY".
  - MHRA DSU items (day of the week on the prescription, patient card, "should not be taken daily") are present in restrictions, administration and counselling.
  - Oncology daily regimens are flagged as specialist-only.
- **Methotrexate interactions.**
  - Trimethoprim and co-trimoxazole: avoid (SPS), plus contraindicated for tablets (Mercury 4.3).
  - NSAIDs: caution (SPS).
  - Penicillins: caution (SPS; `group:penicillin` = amoxicillin, co-amoxiclav).
  - PPIs: info for low dose, avoid for high dose.
  - Ciprofloxacin: avoid.
  - Statins: info.
  - The other-medicine sides (amoxicillin, co-amoxiclav, ibuprofen, naproxen, omeprazole, ciprofloxacin) already carry their own rules.
- **Co-trimoxazole and the engine change** (coordinator item 2). It already had its own rules for everything its SmPC states: hepatic, renal, age, pregnancy, breastfeeding, porphyria, blood disorders, G6PD, asthma, K+/Na+, folate, methotrexate, warfarin, ACE inhibitors, K-sparing diuretics, diuretics. Trimethoprim-only statements (dapsone, eGFR bands, diabetes as a hyperkalaemia risk) correctly no longer reach it. `dapsone:interaction:trimethoprim` still reaches it through the ingredient on the `other` side.
- **Coordinator item 5**: batch F has no paediatric renal thresholds in mL/min/1.73 m². The co-trimoxazole and methotrexate thresholds are CrCl in ml/min, as the sources state.

## 2. Problems found but not fixed

1. **Engine: allergen group expansion over-matches.**
   - `allergenTokens` adds every ingredient of every member of a group. A recorded `group:sulfonamide` or `co-trimoxazole` allergy therefore yields the token `trimethoprim`.
   - As a result, `trimethoprim:allergy:own` (contraindicated) fires for a pure sulfonamide allergy, although SPS says "Trimethoprim is not a sulfonamide". `trimethoprim:allergy:co-trimoxazole-severe` also fires for any severe sulfamethoxazole allergy.
   - The fix belongs in `engine.js` (expand groups to the defining ingredient only), which I may not edit. I fixed the dapsone side in data.
2. **Breastfeeding infant age cannot be checked.** The Pinewood "contraindicated if the breast fed infant is less than 4 months" rule now shows for every breastfeeding mother on trimethoprim. Its concern and action state the age limit. The same applies to the co-trimoxazole "infant younger than eight weeks" wording.
3. **Dose-dependent statements cannot be gated.**
   - Methotrexate + PPI "avoid" applies only to HIGH-dose methotrexate, but it shows for every methotrexate + omeprazole pair. It is labelled as high-dose only.
   - Orion's "combined administration with NSAIDs is not recommended" applies only with renal impairment. It is kept in the action of a caution rule, because an interaction rule cannot also require a renal value.
4. **Trimethoprim pregnancy, T2-3.** Both SmPCs say "contra-indicated in pregnant women" in 4.6, and the Teva 4.3 says "should not be administered to pregnant women", with no trimester. The same 4.6 then says T2/T3 "use should be avoided, unless clinically necessary". I kept T2-3 at **avoid** and quoted the broader lines. A clinical reviewer should confirm this choice.
5. **Trimethoprim renal unit.** eGFR is printed with "ml/min" (see above). The Teva table is also scrambled by the PDF layout, so the quote comes from the Pinewood SmPC (same values).
6. **Co-trimoxazole "severe renal insufficiency"** has no number. The new condition rule is flagged only when "severe renal impairment" is entered, or through the engine's <30 link (provisional). The age boundary "over 12" vs "12 and under" overlaps for ages 12 to 13 (minYears 12).
7. **Methotrexate protein-binding and excretion interactions** with "oral hypoglycaemics" and "thiazide diuretics" (Orion, Mercury, Metoject) were not encoded. In this database the antidiabetic group holds only metformin, and no thiazide is in the master list. Whether the class statement is meant to cover metformin is a clinical judgement, so I did not encode it.
8. **Lactose and galactose excipient warnings** (Teva, Orion, Mercury, hydroxychloroquine tablets) have no exact condition id. The nearest, `hereditary-sugar-intolerance`, covers glucose-galactose malabsorption only. They are left in the section text.
9. **Hydroxychloroquine eye monitoring and maximum dose.** The sources disagree on substance (SmPC baseline plus at least 12-monthly vs RCOphth/SPS no baseline, annual after 5 years or after 1 year with risk factors; 6.5 mg/kg ideal vs <5 mg/kg actual body weight). Both are shown side by side, with no single rule. The SPS monitoring pages (methotrexate, hydroxychloroquine) say they are being updated to the November 2025 BSR guideline, which I could not check.
10. **Smaller gaps.**
    - The Teva tablet SmPC contradicts itself on its lower age limit (not suitable under 6 years vs under 12 years). Both are shown.
    - The dapsone SmPC gives no renal guidance and no blood-count interval.
    - No SPS breastfeeding pages exist for these medicines.
    - BNF not accessed (by policy).

## 3. Overall assessment

- **Trimethoprim.**
  - Indications, dosing, contraindications, interactions and monitoring are accurate and well sourced.
  - Main errors fixed: 4.3 age limits were under-levelled; the eGFR 15-30 band missed 30; the breastfeeding and porphyria conflicts were hidden from tablet users.
  - Source conflicts are now explicit.
  - Still uncertain: the T2-3 pregnancy level (item 4) and the eGFR "ml/min" unit.
- **Co-trimoxazole.**
  - Good coverage of 4.3/4.4/4.5 and paediatric dosing.
  - Main errors fixed: four 4.3 contraindications were rated only "avoid"; the conditional severe renal contraindication had no rule; the CrCl 15-30 boundary was wrong; the renal table had no age scope; Forte renal dosing could have been misread.
  - Accurate and reasonably complete for the master-list interactions.
- **Dapsone.** A thin SmPC, faithfully represented. The real defect was an allergy false positive (trimethoprim allergy flagged dapsone as contraindicated), now fixed. Gaps in the source itself (renal, monitoring interval) remain.
- **Hydroxychloroquine.**
  - Accurate. SmPC vs RCOphth/SPS differences are now clearer, including actual vs ideal body weight.
  - Added the missing QT risk-factor, seizure-threshold, blood-disorder and age >65 eye-monitoring rules.
  - The antacid level was corrected.
- **Methotrexate.**
  - Weekly dosing is unmistakable throughout. The renal thresholds (CrCl, ≥60 / 30-59 / <30) are correct.
  - The main gap was that the stricter Mercury tablet SmPC 4.3 contraindications (liver disease, antifolate drugs, 6-month contraception for men and women, pregnancy for any use) and several of its cautions were missing. These are now encoded and attributed.
  - The ciprofloxacin interaction was under-levelled (fixed).
  - The 25 vs 20 mg/week maximum and the contraception-duration conflicts are shown prominently.
  - Residual limits are dose-dependent rules (item 3) and the pending BSR 2025 update to the SPS monitoring page.

## Scenario checks run (engine, edited data)

- Methotrexate tablets + co-trimoxazole: **contraindicated** (Mercury 4.3) + avoid (SPS).
- Methotrexate pen + trimethoprim: avoid.
- Methotrexate + ciprofloxacin: avoid.
- Methotrexate + omeprazole: low-dose info + high-dose avoid + omeprazole-side caution.
- Trimethoprim, eGFR 30: the 15-30 rule fires.
- Trimethoprim tablets + breastfeeding: contraindicated (Pinewood) + info (Teva).
- Co-trimoxazole, CrCl 30, age 40: the dose rule fires. Severe hepatic: contraindicated.
- Dapsone with a trimethoprim-only allergy: no finding. With a co-trimoxazole allergy: contraindicated.
- Methotrexate + no contraception: contraindicated.
- Hydroxychloroquine + calcium carbonate: caution.
