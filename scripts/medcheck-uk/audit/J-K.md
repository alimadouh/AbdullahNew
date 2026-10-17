# Audit: batches J (insulins) and K (ARBs)

Independent second check, 2026-10-17.

Medicines checked:
- J: insulin lispro, insulin aspart, insulin glargine, insulin degludec, insulin glargine/lixisenatide, human insulin.
- K: candesartan, valsartan, valsartan/hydrochlorothiazide, telmisartan, telmisartan/amlodipine, telmisartan/hydrochlorothiazide.

What I read:
- All 38 J and K sources were fetched again. For every product SmPC I read sections 4.1 to 4.9 in full.
- I compared every rule and every section item against the source text.
- After the edits, all 1688 quotes in the 10 UK-sourced files are FOUND.
- The schema check gives 0 errors for these files (and 0 overall at the last run).
- `test-engine.mjs` passes (38 tests).
- Scenario runs confirm the changed rules fire as intended. Valsartan with the 300 mg analgesic aspirin gives Caution. Valsartan with 75 mg aspirin gives no ARB rule. Telmisartan with nebulised budesonide gives nothing. Telmisartan with prednisolone gives a Note.

## 1. Changes

| File | Item / rule | Before | After | Reason | Supporting quote |
|---|---|---|---|---|---|
| insulin-degludec.json + sources/J.json | formulation `insulin-degludec-100` (note, src, sourceIds); new source `mhra-plgb04668-0410-spc` | The note said no UK SmPC exists for the 100 units/mL pre-filled pen, so the cartridge SmPC was used instead | The pen's own UK SmPC (MHRA Products, PLGB 04668/0410) is now the formulation source. The note says clinical quotes still cite the newer cartridge SmPC. I checked 64 of its 68 quotes word for word in the pen SmPC; the other 4 differ only in table layout or pen storage. | **Wrong product claim.** The MHRA Products index lists "TRESIBA 100 UNITS/ML SOLUTION FOR INJECTION IN PRE FILLED PEN" (Spc, PLGB 04668/0410). | pen SmPC: "Tresiba 100 units/mL solution for injection in pre-filled pen One pre-filled pen contains 300 units of insulin degludec in 3 mL solution." |
| insulin-degludec.json | administration, storage item | "In use … not refrigerated (cartridge SmPC)" | Adds that the pen SmPC allows refrigerator storage during the 8 weeks in use, while the cartridge SmPC says do not refrigerate | The pen storage advice differs from the cartridge | pen SmPC: "…maximum of 8 weeks. Do not store above 30°C. Can be stored in a refrigerator (2°C - 8°C)." |
| insulin-lispro.json | dosing item (mealtime) | The text said "onset about 15 minutes", but no quote covered it | Quote extended to include the onset | Unsupported fact | emc-8545: "Insulin lispro has a rapid onset of action (approximately 15 minutes), thus allowing it to be given closer to a meal…" |
| insulin-lispro.json | "Premixed suspensions: never give intravenously" | In `contraindications` | Moved to `cautions` and labelled as a section 4.2/4.4 statement | The `contraindications` section holds SmPC 4.3 items only. This statement is in 4.2/4.4. | emc-7473: "Under no circumstances should Humalog Mix50 be given intravenously." (4.2, 4.4) |
| insulin-aspart.json | biphasic IV item | In `contraindications` | Moved to `cautions`; text also adds "avoid IM; not for pumps" (same quote) | It is a 4.4 statement, not 4.3 | emc-1600: "NovoMix 30 must not be administered intravenously… Intramuscular administration should be avoided. NovoMix 30 is not to be used in insulin infusion pumps." |
| insulin-glargine.json | rule `insulin-glargine:condition:diabetic-ketoacidosis` (avoid) | Concern "Diabetic ketoacidosis"; action "Not the insulin of choice: use IV regular insulin" | Concern changed to "Treatment of diabetic ketoacidosis". Action says the SmPC concerns treating DKA and does not address stopping or continuing basal insulin. Level is unchanged. | The old wording read as "avoid glargine in a patient with DKA", which the source does not say | emc-8098: "Lantus is not the insulin of choice for the treatment of diabetic ketoacidosis. Instead, regular insulin administered intravenously is recommended in such cases." |
| candesartan, valsartan, valsartan-hydrochlorothiazide, telmisartan, telmisartan-hydrochlorothiazide | rule `<id>:interaction:aspirin` (caution, effect nephrotoxicity) | `other: aspirin`, so it fired for the clinic's low-dose 75 mg aspirin, even though the concern said it covers anti-inflammatory doses only | Added `otherFormulations: ["aspirin-analgesic"]` (the 300 mg analgesic-dose entry added to aspirin.json today). Level stays caution. Concern and action now say the rule applies only at anti-inflammatory doses (above 3 g/day for candesartan/valsartan/valsartan-HCTZ; "anti-inflammatory dosage regimens" for the telmisartan products) and not to low-dose aspirin. | **Over-firing on a dose-specific rule** (coordinator note) | emc-12850: "acetylsalicylic acid (> 3 g/day)"; emc-3164: "acetylsalicylic acid at anti-inflammatory dosage regimens" |
| valsartan-hydrochlorothiazide, telmisartan-hydrochlorothiazide | rule `…:condition:hypercalcaemia` (contraindicated) | Concern "Hypercalcaemia (refractory)"; action "Do not use." | Concern "Refractory hypercalcaemia"; action "Do not use if the hypercalcaemia is refractory (SmPC 4.3 wording)…" | Coordinator note: the scope must be explicit, because the rule is mapped to the general condition | emc-5537: "Refractory hypokalaemia, hyponatraemia, hypercalcaemia, and symptomatic hyperuricaemia." |
| valsartan-hydrochlorothiazide, telmisartan-hydrochlorothiazide | rules `…:condition:hypokalaemia` (and `…:hyponatraemia` for valsartan-HCTZ) | Action "Contraindicated if refractory…" | Action reworded to "Do not use if the … is refractory (SmPC 4.3 wording)…". The concerns already said "Refractory". | Consistency | as above |
| telmisartan.json | rule `telmisartan:interaction:corticosteroid` (other `group:corticosteroid`, info) | Fired for nebulised budesonide (inhaled, not systemic) | Replaced by two rules, `telmisartan:interaction:prednisolone` and `telmisartan:interaction:dexamethasone` (both oral-only products). The action no longer adds "monitor blood pressure", which the source does not say. | The SmPC limits this to the systemic route. `otherFormulations` cannot be used with a group `other` (schema). | emc-3164: "Corticosteroids (systemic route) Reduction of the antihypertensive effect." |
| telmisartan.json | interactions item, lithium | "Lithium: raised levels and toxicity; if needed, monitor" | Now says "concomitant use not recommended" | It sits under the SmPC heading "Concomitant use not recommended" | emc-3164: "Concomitant use not recommended. Potassium sparing diuretics or potassium supplements" |
| telmisartan-hydrochlorothiazide.json | rule `…:interaction:methotrexate` (info) | Action "monitor blood counts as for methotrexate" | "Be aware … (no specific action stated in the SmPC)" | The action was not in the source | emc-3162: "Thiazides may reduce the renal excretion of cytotoxic medicinal products and potentiate their myelosuppressive effects." |
| candesartan.json | counselling, angioedema item | "swelling of the face, lips or tongue" | Reworded to the SmPC content: intestinal angioedema symptoms, stop if diagnosed, angioedema very rare | Facts not in the candesartan quotes | emc-12850: "If intestinal angioedema is diagnosed, candesartan cilexetil should be discontinued" |
| valsartan.json, valsartan-hydrochlorothiazide.json | counselling, angioedema / urgent-help items | Face/lips/throat swelling with no quote | Quotes added | Unsupported text | "swelling of the face, lips, pharynx, and/or tongue"; "Valsartan should be immediately discontinued in patients who develop angioedema" |
| telmisartan-hydrochlorothiazide.json | counselling, urgent-help item | "facial or throat swelling" with no quote | "signs of angioedema (serious angioedema may occur rarely)" plus quote | Unsupported text | emc-3162: "Serious angioedema may occur rarely" |
| valsartan-hydrochlorothiazide, telmisartan-hydrochlorothiazide | counselling, skin item | The "limit sun/UV" advice had no quote | SmPC quote added | Unsupported text | "Possible preventive measures such as limited exposure to sunlight and UV rays and, in case of exposure, adequate protection should be advised" |
| sources/J.json, sources/K.json | `notes` | — | Audit summary appended; the J note's "no pen SmPC" statement is marked as superseded | Keep the integrator informed | — |

**Coordinator points confirmed (no change needed):**
- **Insulin glargine/lixisenatide: no-uk-product is correct.**
  - The MHRA Drug Safety Update of January 2026 says: "Exenatide is no longer marketed in the UK and lixisenatide is no longer authorised."
  - emc search and MHRA Products (product name "lixisenatide" and the trade name) return nothing.
- **Telmisartan/amlodipine: no-uk-product is correct.**
  - emc search by ingredient pair and by trade name: no results.
  - MHRA Products has 0 documents for the trade name or for "amlodipine telmisartan".
  - All 81 MHRA product-name hits for "telmisartan" are single-ingredient telmisartan or telmisartan/HCTZ.
- **Hypoglycaemia mapping across manufacturers is consistent:**
  - Lilly analogue and Lilly human insulin SmPCs list it in 4.3, so contraindicated.
  - Novo SmPCs (aspart solution and biphasic, Actrapid, Insulatard) say in 4.4 "must not be injected", so contraindicated under the "must not be" mapping.
  - Sanofi glargine (100 and 300) and Novo degludec (cartridge and pen) have no such statement, so there is no rule. I re-checked each text for "suspected"/"Hypoglycaemia.".
- **Insulin renal impairment as condition rules is correct.** No insulin SmPC gives a number.
  - Levels follow the wording: lispro and glargine info ("may be reduced/diminished"); aspart, degludec and human insulin monitor ("glucose monitoring should be intensified").
  - The engine links `renal-impairment` to GFR < 60 as a provisional flag. That is acceptable at these levels.
- **Insulin group membership is complete.** Both `insulin` and `antidiabetic` contain the five UK insulin entries. The no-UK lixisenatide combination is correctly in no group.
- **Levels checked and left as they are:**
  - ARB pregnancy: T1 avoid, T2–3 contraindicated, MHRA any-stage avoid.
  - Breastfeeding: SmPC/MHRA avoid and SPS caution, kept as separate statements.
  - Hepatic: severe and cholestasis contraindicated; mild–moderate dose (candesartan 4 mg start, valsartan max 80 mg, telmisartan max 40 mg).
  - Candesartan potassium rules monitor (its 4.5 wording) vs avoid for valsartan and telmisartan.
- **Renal boundaries checked:**
  - candesartan CrCl < 15;
  - valsartan CrCl < 10;
  - valsartan in children: CrCl < 30;
  - HCTZ combinations: CrCl < 30, contraindicated (4.3 says creatinine clearance);
  - SPS eGFR < 30;
  - all `maxInclusive` false, matching "<".

## 2. Problems found but not fixable in my files

1. **Engine bug, high impact (for the integrator).** In `src/lib/medcheck/engine.js`, `LOCAL_ROUTE` contains `cutaneous`, which also matches **"subcutaneous"**.
   - Every subcutaneous product is treated as a local product. That covers all insulins, liraglutide, dulaglutide and denosumab.
   - So any interaction that reaches them through a group or ingredient is silently dropped.
   - Confirmed in a scenario run: insulin degludec + liraglutide, and insulin glargine + liraglutide, give **no interaction**, although `group:glp1-agonist` rules exist (degludec: reduce dose by 20%).
   - It also suppresses other medicines' `group:insulin` and `group:antidiabetic` rules against the insulins.
   - Suggested fix: match `\bcutaneous` or test for `^subcutaneous` first. Then re-run test-engine.
2. **Degludec pen SmPC is older text** (revised 13/01/2022), while the cartridge SmPC was updated on emc in Nov 2025. Clinical statements still quote the cartridge SmPC. A future editor could move every quote to the pen SmPC, but 4 cartridge quotes (table layout, storage) do not exist in the pen text.
3. **Toujeo 4.5 says "anti-hyperglycaemic medicinal products"**, so the 300 units/mL rule uses `group:antidiabetic`. That group includes the other insulins. Basal + bolus combinations (for example with insulin aspart) will show a dose-level "enhanced glucose-lowering" row. This is faithful to the wording but noisy. I left it.
4. **`group:sulfonamide` has two meanings.**
   - The insulin rules use it for "sulpha antibiotics".
   - The HCTZ allergy contraindications use it for "sulfonamide-derived medicinal products", a wider class that includes thiazides, sulfonylureas, furosemide and celecoxib.
   - With today's membership (co-trimoxazole only) both behave correctly. If someone widens the group, the insulin interaction rules would over-fire. A separate group for sulfonamide-derived medicines would be needed.
5. **The aspirin rules depend on the `aspirin-analgesic` formulation id**, which another batch added to aspirin.json today. If it is renamed or removed, the schema check will flag these 5 rules.
6. **The "salicylic acid and derivatives" potassium-loss rules** (valsartan-HCTZ and telmisartan-HCTZ, `group:salicylate`, monitor) still apply to low-dose aspirin. The SmPCs give no dose limit, so this is faithful. Note it if clinicians find it noisy.
7. **Glargine DKA (avoid).** The source says only "not the insulin of choice for the treatment of DKA". I reworded the rule so it does not read as "stop basal insulin". No UK source in the allowed set was checked for continuing basal insulin in DKA.
8. **Not expressible as two-drug rules (unchanged; kept in cautions):**
   - ACE inhibitor + mineralocorticoid receptor antagonist + ARB;
   - ACE inhibitor + beta-blocker + valsartan in heart failure;
   - aliskiren, lithium, digoxin, heparin and ciclosporin (not in the master list).

## 3. Per-medicine assessment

- **Insulin lispro.** Good. The three Lilly SmPCs (solution, Mix50, Mix25) are correctly separated. 4.3 hypoglycaemia is contraindicated. The 4.5 list is fully encoded (MAOIs, SSRIs, captopril, ARBs, beta-blockers, salicylates, sulpha antibiotics, corticosteroids, thyroid hormone, beta2 agonists, oral contraceptives as a condition). One unsupported fact and one misplaced section item were fixed.
- **Insulin aspart.** Good. The solution vs biphasic differences (age 1 vs 10 years; GLP-1 20% reduction only in the biphasic SmPC) are correct. The misplaced IV item was fixed.
- **Insulin glargine.** Good. 100 and 300 units/mL are kept distinct, with correct switching figures (20–30% NPH reduction, about 20% when moving 300 to 100, 80% when moving from twice-daily basal to 300). The 4.5 list is complete for master-list medicines. The DKA wording was fixed. 4.8 table frequencies cannot be read in the fetched text, and the item says so honestly.
- **Insulin degludec.** Content accurate. The product-source claim was wrong (a UK pen SmPC exists) and is now fixed. GLP-1 20% dose rule and age < 1 year are correct.
- **Human insulin.** Good. The differences between Lilly and Novo are clearly named: paediatrics, desensitisation, and "non-selective" beta-blockers in Lilly vs "beta-blockers" in Novo. The second 30/70 brand has no UK SmPC and the substitute is declared. No changes.
- **Insulin glargine/lixisenatide.** no-uk-product confirmed (lixisenatide no longer authorised in the UK, MHRA DSU 2026). Structure correct.
- **Candesartan.** Very good. Contraindications are complete: hypersensitivity, T2/T3, severe hepatic impairment/cholestasis, age < 1. Aliskiren is section-only. Renal thresholds are correct. Fixed: the aspirin scope and one counselling item.
- **Valsartan.** Good. It uses the UK MHRA Products SmPCs for 80 and 160 mg (there is no emc SmPC for those strengths). The paediatric weight-band table was correctly read from the clearer 40 mg SmPC. Fixed: aspirin scope and counselling quotes.
- **Valsartan/hydrochlorothiazide.** Very thorough (59 rules, 4.5 fully encoded). Fixed: aspirin scope and the refractory wording. The CrCl vs GFR inconsistency inside the SmPC is disclosed.
- **Telmisartan.** Good. Fixed: aspirin scope, corticosteroid route over-firing and the lithium strength. The SPS breastfeeding "least preferred" point is correctly kept apart from the SmPC "not recommended".
- **Telmisartan/hydrochlorothiazide.** Good. 4.3 correctly has only "refractory hypokalaemia, hypercalcaemia" (no hyponatraemia; that rule is SPS caution). Fixed: aspirin scope, refractory wording, methotrexate action and counselling quotes.
- **Telmisartan/amlodipine.** no-uk-product confirmed (no UK SmPC, PIL or licence). Structure correct.
