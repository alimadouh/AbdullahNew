# Audit: batches T and U (cough/cold, nasal and inhaler products)

Independent second check, 2026-10-17.

- **Batch T:** paracetamol/pseudoephedrine/chlorphenamine, the same with caffeine, dextromethorphan/guaifenesin, bromhexine, xylometazoline and sodium chloride nasal.
- **Batch U:** budesonide/formoterol, fluticasone propionate/salmeterol, fluticasone propionate/formoterol, tiotropium, fluticasone furoate/umeclidinium/vilanterol, salbutamol and salbutamol/budesonide.

Method:
- Every source in `sources/T.json` and `sources/U.json` was re-read from the shared cache, sections 4.1 to 4.6 in full plus 5.1 and 6.1 where needed.
- The no-uk-product claims were re-checked with the MHRA products search index, the same index the products.mhra.gov.uk site uses. emc search was rate-limited (HTTP 429) during this audit.
- Newer MHRA products SPC files were compared word by word with the emc texts used.
- After the edits, all 815 quotes in these 13 medicine files and in the T/U group memberships are FOUND. `validate()` reports 0 errors for the whole data set.
- An engine simulation confirmed that the new and changed rules fire as intended.

## 1. Changes

| # | File | Item / rule | Before → after | Reason | Quote (all FOUND) |
|---|---|---|---|---|---|
| 1 | paracetamol-pseudoephedrine-chlorphenamine.json | formulation `strengths` | "15 mg + 120 mg + 0.75 mg" → "Pseudoephedrine 15 mg + paracetamol 120 mg + chlorphenamine 0.75 mg (clinic list, matched in the clinic's order)" | The entry name starts with paracetamol, so the bare numbers read as "paracetamol 15 mg". The clinic lists the ingredients as "Pseudoephedrine + paracetamol + Chlorphenamine". | clinic-map row (no source quote; clinic data) |
| 2 | paracetamol-pseudoephedrine-chlorphenamine-caffeine.json | formulation `strengths` | "30 mg + 400 mg + 3 mg + 32 mg" → each strength labelled by ingredient, in the clinic's order | Same misreading risk (paracetamol 30 mg) | clinic-map row |
| 3 | dextromethorphan-guaifenesin.json | formulation `strengths` | "15 mg/5 mL (clinic list)" → adds "the clinic does not say which ingredient" | The ingredient was not stated | clinic-map row |
| 4 | xylometazoline.json | 9 display texts and 4 rule consequences | "older 0.1% spray SmPC" → "0.1% spray SmPC revised 2024 (still the current text for that product)" | The emc SmPC (PL 44673/0184) is not superseded. MHRA products re-uploaded the identical text on 17 Aug 2026 (revision 27/02/2024). It is the SmPC the clinic links for its product. Calling it "older" could lead a doctor to dismiss its glaucoma, phaeochromocytoma, prostatic hypertrophy and rhinitis sicca contraindications. | MHRA SPC PL 44673/0184 "4.3 Contraindications Known hypersensitivity to xylometazoline. … Narrow-angle glaucoma. Rhinitis sicca or atrophic rhinitis." (same as emc-3008) |
| 5 | xylometazoline.json | `xylometazoline:condition:ischaemic-heart-disease` → `xylometazoline:condition:cardiac-disease` | condition IHD → cardiac-disease; concern "Coronary artery disease or other cardiovascular disease" | One SmPC says "cardiovascular disease", which is broader than IHD. cardiac-disease is implied by IHD and heart failure, so the rule still fires for IHD. | emc-3008 "Caution is recommended in patients with hypertension, cardiovascular disease, hyperthyroidism, diabetes mellitus or tri and tetra-cyclic antidepressant treatment" |
| 6 | xylometazoline.json | rules hypertension, hyperthyroidism, diabetes | emc-3008 quote added | The consequence said "both SmPCs", but only one SmPC was quoted | as #5 |
| 7 | sources/T.json | emc-3008 `version`; `notes` | Version now records the 2024 revision and the Aug 2026 MHRA copy. "Four of six" → "Five of six" no-uk-product. Audit addendum added. | Accuracy | — |
| 8 | salbutamol.json | `salbutamol:condition:asthma-no-ics` | concern → "Asthma: applies only if no inhaled corticosteroid (ICS) is co-prescribed"; action → says no action is needed if an ICS is co-prescribed; consequence wording; quote added | The coordinator asked for this. The engine cannot test whether an ICS is absent, so the rule shows for every asthma patient. The title now states the qualifier. The "death" in the consequence now has a supporting quote. | mhra-dsu-saba-overuse-2025 "do not prescribe SABA to people of any age with asthma without a concomitant prescription of an inhaled corticosteroid"; emc-850 "leading to an increased risk of severe asthma exacerbations and mortality" |
| 9 | salbutamol.json | `salbutamol:pregnancy:tocolysis` | concern → "Pregnancy: use to stop uncomplicated premature labour or threatened abortion (not asthma use)" | This contraindicated rule appears in the "do not give in" list. Its scope there is only "Pregnancy", so the concern must state the subgroup. | emc-850 "Non-i.v. formulations of salbutamol must not be used to arrest uncomplicated premature labour or threatened abortion." |
| 10 | tiotropium.json | `tiotropium:condition:asthma-monotherapy` | concern → "Asthma: applies only if tiotropium is used without an inhaled corticosteroid (monotherapy)" | Same problem as #8 | emc-407 "Spiriva Respimat should not be used as monotherapy for asthma." |
| 11 | budesonide-formoterol.json | `budesonide-formoterol:age:under-12` (avoid, 0 to 12 years) → `age:under-6` (avoid) + `age:6-11` (dose) | Split | Wrong level for 6 to 11 years. The SmPC says "not recommended" only under 6 years. For 6 to 11 years it says a lower strength is available, because this 200/6 strength is licensed from 12. That makes 6 to 11 a strength/dose issue, coded the same way batch U coded the 50/250 strength of fluticasone/salmeterol. | emc-1327 "Symbicort is not recommended for children younger than 6 years"; "A lower strength (100 micrograms/6 micrograms/inhalation) is available for children 6-11 years."; "is indicated in adults and adolescents (12 years and older) for the regular treatment of asthma" |
| 12 | budesonide-formoterol.json | paediatric item 1 | "not recommended under 12 years" (for MART/reliever) → "not recommended in children" | Faithful to the source wording | emc-1327 "Symbicort maintenance and reliever therapy is not recommended for children." |
| 13 | budesonide-formoterol.json, fluticasone-propionate-salmeterol.json | new `…:pregnancy:bumps-ics` (info) | — → info rule | The BUMPS pregnancy statement was in the section but had no rule. The brief requires pregnancy statements as rules, and fluticasone/formoterol, tiotropium and salbutamol already had one. | bumps-inhaled-corticosteroids "Inhaled corticosteroids should be continued throughout pregnancy to ensure that breathing problems do not occur." |
| 14 | fluticasone-propionate-salmeterol.json | new `…:condition:cardiac-disease` (caution) | — → caution | Missing 4.4 condition: "severe cardiovascular disorders". Only the "heart rhythm abnormalities" part had a rule. | emc-7597 "Seretide should be used with caution in patients with severe cardiovascular disorders or heart rhythm abnormalities …" |
| 15 | fluticasone-propionate-salmeterol.json | new `…:condition:copd-strength` (dose); formulation note; COPD indication item | — → dose rule; note and indication now say "the COPD dose is 50/500 twice daily" | The clinic strength (50/250) is not the COPD dose. The newer MHRA 50/250 SPC (17/11/2023) states the COPD indication without naming a strength, so "only 50/500 is licensed for COPD" was reworded to the posology, which both texts share. | emc-7597 "Seretide (50 micrograms salmeterol and 500 micrograms fluticasone propionate) is indicated for the symptomatic treatment of patients with COPD"; "One inhalation of 50 micrograms salmeterol and 500 micrograms fluticasone propionate twice daily." |
| 16 | fluticasone-propionate-formoterol.json | new `…:interaction:laba` (avoid, group:long-acting-beta2-agonist) | — → avoid | Missing interaction. The statement was only in the restrictions section. | emc-7649 "Patients using Flutiform inhaler should not use additional long-acting β2 agonists for any reason." |
| 17 | fluticasone-propionate-formoterol.json | new `…:interaction:xylometazoline` (caution, exact id) | — → caution | The SmPC says "by any route". The existing group:sympathomimetic rule can never reach the nasal xylometazoline, because the engine ignores group matches for local products. An exact-id rule is needed. | emc-7649 "If additional adrenergic drugs are to be administered by any route, they should be used with caution, because the pharmacologically predictable sympathetic effects of formoterol may be potentiated." |
| 18 | fluticasone-furoate-umeclidinium-vilanterol.json | new `…:breastfeeding:sps-fluticasone` (info) | — → info | The SPS breastfeeding item had no rule. The other ICS inhalers have one. | sps-ics-breastfeeding "When applied to the skin, inhaled or used intranasally, fluticasone can be used during breastfeeding." |
| 19 | salbutamol-budesonide.json | formulation label/strengths/note | "Pressurised inhaler …" → "Inhaler (salbutamol with budesonide)"; strengths field added from the clinic list | The clinic only says "Inhaler". "Pressurised" was not from any allowed source. | clinic-map row |
| 20 | sources/U.json | groups beta2-agonist and inhaled-corticosteroid | salbutamol-budesonide added | Without this, other medicines' beta2-agonist and ICS rules (prednisolone, clarithromycin, metformin combinations, insulins) never reach this product. Batch T uses the same ingredient-level approach for its no-uk-product combinations. | emc-850 "Salbutamol is a selective beta2-adrenoceptor agonist."; emc-1327 "Budesonide is a glucocorticosteroid which when inhaled has a dose-dependent anti-inflammatory action in the airways" |
| 21 | sources/U.json | `notes` | Audit addendum: no-uk-product confirmation, MHRA text comparison, QT decision flagged | Records #8 to #20 | — |

Counts by type:
- Level or scope corrections: 1 (#11).
- Concern or scope wording for subgroup rules: 3 (#8, #9, #10).
- New rules: 8 (#11 adds one more rule, #13 ×2, #14, #15, #16, #17, #18).
- Rule condition remapped: 1 (#5).
- Quotes added to existing rules: 4 (#6 ×3, #8).
- Display text accuracy: 6 (#1, #2, #3, #4, #12, #19).
- Group memberships added: 2 (#20).
- Source and notes records: 2 (#7, #21).
- Medicines converted to no-uk-product: 0. All six existing no-uk-product entries were confirmed.

## 2. Checks that found no problem

- **No-uk-product (6 medicines) confirmed** with the MHRA products index. The index has no SPC or PIL with these substances together:
  - dextromethorphan and guaifenesin (the clinic link emc 11927 is a dextromethorphan-only product);
  - bromhexine (the only hits are acetylcysteine documents);
  - paracetamol, pseudoephedrine and chlorphenamine, with or without caffeine (the only chlorphenamine and pseudoephedrine product has no paracetamol);
  - salbutamol and budesonide;
  - a sodium chloride nasal product.
- **T group memberships for the no-uk-product combinations are kept.** Each is sourced at ingredient level from a UK source:
  - sympathomimetic: pseudoephedrine SmPC 5.1;
  - antihistamine: MHRA 2009 DSU ingredient list;
  - serotonergic: dextromethorphan SmPC 5.1.

  The memberships for loratadine/pseudoephedrine and cetirizine/pseudoephedrine duplicate another batch's sourced entry. This is harmless because the build removes duplicates.
- **Product match and currency.**
  - All U SmPCs match the clinic active ingredients, route and strength. The Symbicort 200/6 metered dose is the clinic's 160/4.5 delivered dose.
  - The Flutiform 125/5 and 250/10 texts are identical in 4.1 to 4.6.
  - Newer MHRA SPC files for Symbicort 200/6, Spiriva Respimat and Ventolin Respirator differ only in layout.
  - The Trelegy MHRA file has the same date as the emc one. Its UK text is still COPD-only, with "should not be used in patients with asthma".
- **Levels.**
  - Every SmPC 4.3 statement is `contraindicated`. These are hypersensitivity, the salbutamol tocolysis use, and for xylometazoline: MAOIs, other sympathomimetic decongestants, under 12 years, hypophysectomy, and the 2024-SmPC conditions.
  - "Not recommended" and "should not" outside 4.3 are `avoid`.
  - Risk-benefit wording is `caution`.
  - Milk protein allergy is `contraindicated` for the two lactose-containing DPIs. Their 4.3 names the lactose excipient and its milk proteins. The triple inhaler's 6.1 lists lactose without a milk-protein statement, so it has only the galactose-intolerance "should not use" rule.
- **Interactions.**
  - CYP3A groups are correct. Fluticasone propionate SmPCs name moderate inhibitors, so they use group:cyp3a4-inhibitor. The triple inhaler names strong inhibitors only, so it uses group:strong-cyp3a4-inhibitor. Budesonide/formoterol names clarithromycin.
  - Only propranolol is a non-selective beta-blocker in the master list, so the salbutamol rule with `other: propranolol` is complete.
  - The salbutamol nebuliser + ipratropium rule is limited to the nebuliser formulation on both sides.
- **Renal.** Tiotropium CrCl ≤ 50 mL/min uses `maxInclusive: true`, which is correct.
- **Display text.** No brand names, manufacturers or emc ids in display text. Brands appear only inside verbatim quotes.
- **brandPrescribing.**
  - The three dry powder inhalers rest on the SPS statement that brand prescribing is necessary for "Specific devices … Examples include: adrenaline auto-injectors, dry powder inhalers".
  - Tiotropium rests on the explicit SPS tiotropium statement.
  - The pMDIs (salbutamol, fluticasone/formoterol) correctly have `null`.
- **Inhalers are kept out of the systemic `corticosteroid` group.** I agree this is intended. The group feeds NSAID GI-bleed, quinolone tendon and other systemic-steroid rules. ICS effects are covered by the separate `inhaled-corticosteroid` group.

## 3. Problems not fixed (for the integrator or other batches)

1. **QT group policy conflict (needs a decision).** The SPS QT page lists beta-2 agonists (salbutamol, formoterol) and the formoterol SmPCs say "Formoterol itself may induce prolongation of the QTc interval". Read literally, the policy would put the formoterol inhalers, and possibly salbutamol, in `qt-prolonging`. But SPS also says "When used alone and in the absence of other risk factors, beta agonist inhalers pose a low risk of clinically significant QT interval prolongation. The likelihood of a clinically significant interaction with other medicines known to prolong QT interval is considered low." Adding them would make the domperidone, escitalopram and moxifloxacin `contraindicated` QT rules fire for every inhaler user. I left them out, as batch U did.
2. **The `sympathomimetic` group now means "sympathomimetic decongestants" only.** Its members are xylometazoline and the pseudoephedrine combinations. The xylometazoline (contraindicated) and amitriptyline (avoid) rules need it that narrow. But metformin, the insulins, glimepiride, repaglinide, vildagliptin and others use group:sympathomimetic for hyperglycaemic sympathomimetics. Those rules therefore never fire for salbutamol or the LABA inhalers unless the medicine also has a beta2-agonist rule. Metformin, glimepiride, repaglinide and vildagliptin have none. Suggested fix: create a separate `decongestant` group for the xylometazoline and amitriptyline rules, then decide per SmPC whether beta2 agonists belong in `sympathomimetic`. This is not changed here because it affects several batches.
3. **`budesonide-nebuliser` (other batch) is in both `corticosteroid` and `inhaled-corticosteroid`.** This conflicts with the "inhalers stay out of the systemic group" policy. For example, the salbutamol, budesonide/formoterol and fluticasone inhaler rules titled "Corticosteroids (systemic)" fire for it.
4. **No-uk-product cough/cold combinations have no child-age warning.** MHRA (2009) says cough and cold medicines containing pseudoephedrine, chlorphenamine, dextromethorphan or guaifenesin "should no longer be used in children under 6 years". SCHEMA forbids rules on no-uk-product entries. The two syrups are child-relevant products. The integrator may want a tool-level, ingredient-based note similar to `componentsOf`.
5. **Condition overlap.** `phaeochromocytoma` (used by T and U) and `phaeochromocytoma-untreated` (batch N) both exist. Merging is for the integrator.
6. **Small source-wording point.** Several U rules title the steroid hypokalaemia interaction "Corticosteroids (systemic)" where the SmPC says "steroids" or "corticosteroids". This matches the meaning of the group, so it was left as is.

## 4. Per-medicine assessment

- **Paracetamol/pseudoephedrine/chlorphenamine (syrup):** no-uk-product confirmed. The strength text is now unambiguous. The paracetamol rules apply provisionally through `componentsOf`. Pseudoephedrine and chlorphenamine are covered only through group memberships of other medicines' rules.
- **Paracetamol/pseudoephedrine/chlorphenamine/caffeine (tablets):** as above.
- **Dextromethorphan/guaifenesin:** no-uk-product confirmed (a single-ingredient UK product is not the same product). The serotonergic membership is sourced. Note that the dextromethorphan SmPC 4.3 contraindication with SSRIs and MAOIs cannot be shown. Only the other side's caution-level serotonergic rules fire (see problem 4 for the general gap).
- **Bromhexine:** no-uk-product confirmed. No UK source exists.
- **Sodium chloride 0.9% nasal:** no-uk-product confirmed. Saline nasal drops have no SmPC or PIL in the MHRA index.
- **Xylometazoline:** good after the fixes. The two current UK 0.1% spray SmPCs genuinely differ: the 2024 text has extra contraindications and 7 days, the October 2026 text has 5 days. Both are kept and named. The MHRA 2026 DSU is reflected (5-day limit, the contraindication with other decongestants, rebound congestion). The 0.05% child drops are correctly shown as a different product, as detail only.
- **Budesonide/formoterol:** accurate and complete against 4.2 to 4.6. The age rule level is corrected. BUMPS rule added.
- **Fluticasone propionate/salmeterol:** accurate. Added the missing severe cardiovascular caution and the COPD-strength rule. BUMPS rule added.
- **Fluticasone propionate/formoterol:** accurate. Added the missing "no additional LABA" rule and the xylometazoline caution. The age rules per strength are correct.
- **Tiotropium:** accurate and complete. The asthma monotherapy concern is clarified. The ipratropium cross-allergy and anticholinergic avoid rules are correct.
- **Fluticasone furoate/umeclidinium/vilanterol:** accurate. The UK text is COPD-only and the asthma `avoid` is correct. Added the SPS breastfeeding rule.
- **Salbutamol:** accurate for both the pMDI and nebuliser SmPCs. Where the sources conflict, the strength of each is kept separately (inhaler SmPC avoid, nebuliser caution, BUMPS continue). The SABA-without-ICS rule title is now precise.
- **Salbutamol/budesonide:** no-uk-product confirmed. The label no longer claims a device type. Added to the beta2-agonist and inhaled-corticosteroid groups so that other medicines' rules reach it.
