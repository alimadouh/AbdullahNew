# Audit: batches H and I (antidiabetic medicines)

Independent second check, 2026-10-17.

**Scope**
- Batch H: dapagliflozin, empagliflozin, dapagliflozin/metformin, empagliflozin/metformin, gliclazide, glimepiride, repaglinide.
- Batch I: linagliptin, sitagliptin, sitagliptin/metformin, vildagliptin, vildagliptin/metformin, liraglutide, dulaglutide.

**Method**
- All 20 emc SmPCs were re-fetched and sections 4.1 to 4.6 read in full. Sections 4.8, 5.1 and 6.1 were read where an item depends on them.
- The SPS sulfonamide page was read in full.
- Every rule was compared with its quote, and section 4.5 was compared with the rule list.
- Group memberships and condition ids were checked across all batches.

**Result after edits**
- 1791/1791 quotes in these 14 files and the H/I group entries were found, using the same `quoteFound` function as `verify.mjs`.
- `validate()` gives 0 errors for the whole KB.
- Rule count went from 362 to 406.
- A scratch build (written to the scratchpad, not to `public/`) and engine runs confirmed the new rules behave as intended:
  - gliclazide + miconazole cream gives no finding; with the oral gel it is contraindicated;
  - repaglinide + co-trimoxazole gives `avoid`;
  - sitagliptin/metformin + gliclazide now fires;
  - a furosemide allergy gives the gliclazide SmPC rule plus the SPS info rule;
  - empagliflozin at eGFR 15 gives both `avoid` (starting) and the 10 mg dose limit.
- `verify.mjs` was not run, because it rewrites the shared `verify-report.json`.

## 1. Changes

| File | Item / rule | Before | After | Reason | Quote |
|---|---|---|---|---|---|
| gliclazide.json | `gliclazide:interaction:miconazole` (contraindicated) | `other: miconazole`, all forms (fired for cream and pessary) | `otherFormulations: ["miconazole-oral-gel"]`; concern/action name the oral gel | **Over-firing.** The SmPC names only systemic and oromucosal gel miconazole. | emc-102252: "Miconazole (systemic route, oromucosal gel): increases the hypoglycaemic effect…" |
| glimepiride.json | `glimepiride:interaction:miconazole` (info) | all forms | oral gel only | Coordinator instruction: the SmPC says "miconazole" with no route. The vaginal pessary has its own sulfonylurea rule in miconazole.json. | emc-10744: "miconazole, fluconazole" |
| gliclazide.json, glimepiride.json | `…:allergy:sulfonamide` (contraindicated) | allergen `group:sulfonamide` only (co-trimoxazole) | adds `group:non-antibiotic-sulfonamide`; concern says the SmPC wording covers both | The SmPC says "sulfonamides" without limiting it to antibiotics. Other batches encode SmPC sulfonamide contraindications with both groups (furosemide, indapamide, celecoxib). | emc-102252: "Hypersensitivity to gliclazide … other sulfonylureas, sulfonamides" |
| gliclazide.json, glimepiride.json | NEW `…:allergy:non-antibiotic-sulfonamide-sps` (info) | — | SPS view for thiazide or loop-diuretic allergy | Coordinator: keep SmPC and SPS separate. The existing SPS rule covers antibiotic allergy only. | sps-sulfonamide: "There is no evidence of cross-reactivity between different classes of non-antibiotic sulfonamides." |
| sources/H.json | group `non-antibiotic-sulfonamide` | gliclazide and glimepiride not members | both members | SPS lists sulfonylureas as a class in which every member has a sulfonamide group. Glimepiride SmPC 5.1 says "Sulfonamides, urea derivatives". | sps-sulfonamide: "Classes where all members have a sulfonamide group include: carbonic anhydrase inhibitors loop diuretics sulfonylureas" |
| sources/I.json + both files | group `biguanide` | sitagliptin/metformin and vildagliptin/metformin not members | members | **Incomplete group.** The gliclazide and repaglinide biguanide rules did not reach these metformin combinations. | emc-564: "metformin hydrochloride, a member of the biguanide class" |
| empagliflozin.json | `empagliflozin:renal:20-60` → `empagliflozin:renal:lt60` (dose) | eGFR 20 to < 60 | eGFR < 60, no lower bound | **Wrong boundary.** A patient already on treatment whose eGFR fell below 20 had no 10 mg limit. | emc-7703: "In patients with an eGFR <60 ml/min/1.73 m2 the daily dose of empagliflozin is 10 mg." |
| repaglinide.json | `…:interaction:carbamazepine`, `…:interaction:st-johns-wort` | monitor | caution; 4.4 quote added | **Wrong level.** SmPC 4.4 says medicines that influence repaglinide metabolism "should be used with caution or be avoided". This matches the existing clarithromycin rule. | emc-12974: "Repaglinide should be used with caution or be avoided in patients receiving medicinal products which influence repaglinide metabolism" |
| sitagliptin-metformin.json | formulation, dosing[0], administration[0], renal[3] | Formulation "Film-coated tablets (immediate release)". Dosing "sitagliptin 50 mg twice daily … twice daily with meals". Renal "The fixed 50 mg/1000 mg tablet twice daily exceeds these". | Formulation is labelled as the clinic prolonged-release tablet, with the UK immediate-release source stated. The twice-daily schedule is marked as immediate-release only. The renal text no longer assumes twice-daily dosing. | Coordinator: immediate-release doses must not be shown as if they apply to the prolonged-release product (SCHEMA: include only content that applies to the clinic form). | emc-564: "Janumet should be given twice daily with meals…" |
| dapagliflozin, empagliflozin, dapagliflozin/metformin, empagliflozin/metformin | NEW `…:condition:pancreatitis-current` (caution) | only `pancreatitis-history` | mirror rule on `pancreatitis` (batch O id) | **Missing rule.** The KB has two pancreatitis ids, and a patient recorded under the other one got no warning. | emc-7607: "…or patients with a history of pancreatitis)"; "SGLT2 inhibitors should be used with caution in these patients." |
| same 4 files | NEW `…:condition:restricted-food-intake` (caution, `malnutrition`) | none | rule | 4.4 names restricted food intake as a ketoacidosis risk factor (use with caution). | emc-7607: "patients with conditions that lead to restricted food intake or severe dehydration" |
| linagliptin, sitagliptin, sitagliptin/metformin, vildagliptin, vildagliptin/metformin, liraglutide, dulaglutide | NEW `…:condition:pancreatitis-current` (avoid) | only `pancreatitis-history` (caution) | Rule on `pancreatitis`. The concern states "acute, current or suspected", and points to the history rule for chronic or past pancreatitis. | **Missing rule** for current pancreatitis. The SmPC says to stop and not restart. | emc-4762: "If pancreatitis is suspected, linagliptin should be discontinued; if acute pancreatitis is confirmed, linagliptin should not be restarted." |
| dapagliflozin/metformin, empagliflozin/metformin, sitagliptin/metformin, vildagliptin/metformin | NEW `…:condition:metabolic-acidosis` (contraindicated) | only `diabetic-ketoacidosis` | rule on `metabolic-acidosis` (batch M/N id) | **Missing 4.3 contraindication**: "any type of acute metabolic acidosis". | emc-7612: "any type of acute metabolic acidosis (such as lactic acidosis, diabetic ketoacidosis)" |
| same 4 files | NEW `…:condition:acute-alcohol-intoxication` (contraindicated) | only `alcohol-dependence` | rule on `acute-alcoholism` (batch A id) | **Missing 4.3 contraindication**: acute alcohol intoxication. | emc-11421: "Hepatic impairment, acute alcohol intoxication, alcoholism" |
| dapagliflozin/metformin, empagliflozin/metformin, sitagliptin/metformin | NEW `…:interaction:inhaled-corticosteroid` (monitor) | `group:corticosteroid` only | rule on `group:inhaled-corticosteroid`, as in metformin.json | 4.5 names glucocorticoids "given by systemic and local routes". | emc-564: "Glucocorticoids (given by systemic and local routes) beta-2-agonists, and diuretics have intrinsic hyperglycaemic activity." |
| gliclazide.json | NEW 8 × `gliclazide:interaction:cutaneous-corticosteroid:<id>` (monitor) | group rule only. The engine ignores group matches for skin products. | One rule for each skin product in the master list that contains a corticosteroid. | The SmPC explicitly names cutaneous glucocorticoids. | emc-102252: "Glucocorticoids (systemic and local route: intra-articular, cutaneous and rectal preparations) … increase blood glucose levels with possible ketosis" |
| gliclazide.json | NEW `gliclazide:condition:hypoglycaemia-prone` (dose) | none | 30 mg minimum starting dose | The SmPC heading "Patients at risk of hypoglycaemia" matches the batch N id. | emc-102252: "It is recommended that the minimum daily starting dose of 30 mg is used." |
| glimepiride.json | NEW `…:condition:malnutrition`, `:alcohol`, `:adrenal-insufficiency`, `:thyroid` (info) | risk factors in text only | info rules | Condition-related warnings should reach the safety panel; gliclazide already had them. | emc-10744: "Factors favouring hypoglycaemia include"; "undernutrition, irregular mealtimes or missed meals or periods of fasting" |
| repaglinide.json | NEW `repaglinide:condition:alcohol` (info) | none | info rule | 4.5 lists alcohol among substances that may enhance or prolong hypoglycaemia. | emc-12974: "salicylates, NSAIDs, octreotide, alcohol, and anabolic steroids." |
| liraglutide.json | NEW `liraglutide:condition:thyroid-dysfunction` (caution) | only hypothyroidism and thyrotoxicosis | mirror rule | A patient recorded under the general thyroid id got no warning. | emc-100178: "Liraglutide should therefore be used with caution in these patients." |
| vildagliptin-metformin.json | `…:renal:30-44` (dose) | No vildagliptin limit for GFR 30-44 (the emc table row has lost that cell). | Action cites the vildagliptin SmPC: 50 mg once daily in moderate or severe renal impairment. | Fills the gap from a UK source without guessing. | emc-6225: "In patients with moderate or severe renal impairment or with end-stage renal disease (ESRD), the recommended dose of Galvus is 50 mg once daily" |
| vildagliptin-metformin.json | NEW `…:age:ge65` (monitor) | none | renal monitoring rule | 4.2 "Elderly (≥ 65 years)" statement. | emc-11521: "elderly patients taking Eucreas should have their renal function monitored regularly" |
| linagliptin, sitagliptin, sitagliptin/metformin, vildagliptin, vildagliptin/metformin | breastfeeding[1] SPS quote | "here is limited or no…" (word cut) | "limited or no published information…" | Cosmetic | — |
| sitagliptin.json, dulaglutide.json | formulation src | 100 mg (sitagliptin) and 1.5/4.5 mg (dulaglutide) quoted only | 25/50 mg and 0.75/3 mg quotes added | Every listed strength is now sourced. | emc-7887: "equivalent to 25 mg sitagliptin" |
| sources/H.json, sources/I.json | notes | — | audit summary appended; H note 8 corrected | — | — |

**Counts**
- 44 new rules.
- 8 rules changed:
  - 2 scope fixes (miconazole);
  - 2 allergen fixes;
  - 1 renal boundary;
  - 2 level changes;
  - 1 action.
- 4 new group memberships.
- Display-text fixes in 7 files.
- 0 conversions to no-uk-product.

**Checked and left unchanged (correct)**
- **SGLT2 inhibitor levels:**
  - type 1 diabetes = avoid ("should not be used", 4.4);
  - pregnancy = avoid (dapagliflozin "not recommended" 2nd/3rd trimester plus "discontinue when detected"; empagliflozin "preferable to avoid");
  - breastfeeding = avoid.
- **Renal thresholds:**
  - dapagliflozin eGFR < 15 (do not start), 15 to < 45 (info);
  - empagliflozin eGFR < 20 (do not start);
  - metformin combinations use GFR (mL/min) or eGFR exactly as each SmPC says;
  - none of the "<" boundaries needs `maxInclusive`.
- **Heart failure (coordinator note).** These follow their own SmPCs and are not merged:
  - dapagliflozin/metformin, sitagliptin/metformin and vildagliptin/metformin contraindicate cardiac failure in 4.3 ("acute or chronic disease which may cause tissue hypoxia");
  - empagliflozin/metformin contraindicates only decompensated, acute or unstable heart failure, and allows stable chronic heart failure with monitoring.
- **Dapagliflozin/metformin strength (coordinator note).** No 10 mg/1000 mg tablet exists in the UK. The UK 5 mg/850 mg and 5 mg/1000 mg tablets give 10 mg of dapagliflozin a day. The formulation note says this. Same active ingredients, salt and route, so acceptable.
- **Liraglutide (coordinator note).**
  - The newer SmPC (emc-100178, Aug 2025) is stricter than the older one (emc-100248, Nov 2024). The newer one adds the aspiration warning, caution in a pancreatitis history, and necrotising or fatal pancreatitis.
  - The two do not conflict. All rules cite the newer SmPC or MHRA.
- **Sulfonylurea allergy.** The SmPC contraindication and the SPS view are kept as separate rules. Repaglinide keeps an info rule: "no reason to suspect cross-allergenicity with sulphonylurea".
- **Repaglinide + trimethoprim (avoid).** It fires for co-trimoxazole through the shared ingredient, so no separate rule is needed.
- **Vildagliptin renal rule.** It uses CrCl < 50 (the SmPC defines mild impairment as CrCl ≥ 50).
- **Dulaglutide + sitagliptin.** The rule also matches sitagliptin/metformin by ingredient.

## 2. Problems not fixed here (for the integrator or other batches)

1. **Two pancreatitis condition ids.**
   - `pancreatitis` (batch O) and `pancreatitis-history` (batches H and I).
   - Fixed here by mirror rules, but the ids should be merged or linked.
   - The same applies to:
     - `malnutrition` (H), `hypoglycaemia-prone` (N) and `severe-debility` (Z);
     - `thyroid-dysfunction` vs `hypothyroidism`/`thyrotoxicosis`;
     - `alcohol-dependence` vs `acute-alcoholism`.
2. **metformin.json (batch D/AE).** It has no `metabolic-acidosis` or `acute-alcoholism` rules, but its SmPC 4.3 lists both. Please add them, as done here for the four combinations.
3. **insulin-glargine-lixisenatide (batch J).**
   - It is not a member of `antidiabetic`, `insulin` or `glp1-agonist`, so every group rule in this batch misses it.
   - The MHRA DSU (Jan 2026) says lixisenatide is no longer authorised in the UK. That product should be checked for no-uk-product status.
4. **`oral-antidiabetic` group name.**
   - vocab.json calls it "Antidiabetic medicines", the same as the all-inclusive group.
   - Rules from other batches that use `group:oral-antidiabetic` (for example warfarin, ciprofloxacin, clarithromycin, sertraline) display as if they cover insulin and GLP-1 agonists, but they do not.
   - Suggest renaming it to "Oral antidiabetic medicines" in vocab.json.
5. **Nasal steroids in a systemic group.** The `corticosteroid` group contains the nasal products mometasone-nasal, fluticasone-furoate-nasal and beclometasone-nasal. This breaks the "local products are never in systemic groups" rule. The engine ignores the match for nasal routes anyway, but the membership should be removed by the owning batch.
6. **salbutamol-budesonide** is in no group (`inhaled-corticosteroid`, `beta2-agonist`). The metformin-combination glucose-monitoring rules therefore miss it.
7. **Topical corticosteroids and the metformin combinations.**
   - The SmPCs say glucocorticoids "by systemic and local routes".
   - Only the inhaled group was added, matching metformin.json.
   - Skin products are not covered, because group matches are ignored for skin routes. This is a deliberate choice to avoid noise. Only the gliclazide SmPC names cutaneous use explicitly.
8. **`verify-report.json` is stale for these files** (not rerun, as it is shared). The integrator should run `verify.mjs` before building.
9. **Vildagliptin/metformin GFR 30-44 row.** The emc text has lost the vildagliptin cell. The original table probably spans rows. The single-agent SmPC figure is cited, but the combination's own value could not be read.

## 3. Per-medicine assessment

- **Dapagliflozin**
  - Accurate and complete before the audit, apart from the pancreatitis id gap and the restricted-intake rule.
  - Licensed UK SmPC, same ingredient, salt and route.
  - Good.
- **Empagliflozin**
  - One real error: the 10 mg limit was not applied below eGFR 20. Fixed.
  - Everything else matches the SmPC.
  - Good.
- **Dapagliflozin/metformin**
  - The strength substitution is handled honestly.
  - Two 4.3 items were missing (metabolic acidosis in general, acute alcohol intoxication). Added.
  - The heart failure contraindication is correctly taken from its own SmPC.
  - Good after fixes.
- **Empagliflozin/metformin**
  - Same two 4.3 gaps, plus the inhaled-steroid gap. Fixed.
  - The renal table was transcribed correctly, including the "established cardiovascular disease" footnote.
  - Good.
- **Gliclazide**
  - The most important fix: the miconazole contraindication was firing for miconazole cream and pessary. Now oral gel only.
  - Sulfonamide allergy is now consistent with other batches.
  - Severe renal impairment has no numeric threshold in the SmPC; it is correctly coded as a condition.
  - Good after fixes.
- **Glimepiride**
  - Many 4.5 interactions are correctly `info`, because the SmPC gives no action.
  - The miconazole scope and the risk-factor rules were fixed.
  - The UK SmPCs are old (2021) but current on emc.
  - Acceptable.
- **Repaglinide**
  - Interaction levels are now consistent with 4.4.
  - Gemfibrozil and ciclosporin are not on the master list (text only).
  - Good.
- **Linagliptin**
  - Accurate. Breastfeeding = caution (benefit/risk decision) is correct.
  - The only change is the pancreatitis mirror rule.
  - Good.
- **Sitagliptin**
  - Accurate. The GFR dose bands are correct.
  - The CYP3A4 rule is `info` and fires regardless of renal function. The engine cannot combine an interaction with a renal limit, and the concern says this.
  - Good.
- **Sitagliptin/metformin**
  - The XR vs IR issue is now explicit and not misleading.
  - No UK dosing exists for the once-daily clinic tablet; users must follow the pack.
  - Contraindications are complete.
  - Acceptable, with that limit.
- **Vildagliptin**
  - Accurate. Hepatic impairment = avoid ("should not be used", 4.2/4.4, not 4.3) is correct.
  - Good.
- **Vildagliptin/metformin**
  - Hepatic impairment = contraindicated (4.3) is correct.
  - The GFR 30-44 limitation is stated (see section 2, item 9).
  - Good.
- **Liraglutide**
  - Uses a generic UK 6 mg/mL SmPC; same active ingredient and route as the clinic pen.
  - Brand prescribing comes from SPS.
  - Good.
- **Dulaglutide**
  - Accurate, including the 10 to 17 years dose limit and the eGFR < 15 rule.
  - Good.
