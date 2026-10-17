# Audit: batches AH and AI

Independent second check of the clinic-expansion batches AH and AI, 2026-10-17.

**Medicines converted to no-uk-product:** aescin (AI). Five stay no-uk-product after a recheck: betamethasone-miconazole-gentamicin and triamcinolone-nystatin-neomycin (AH), and aescin-diethylamine-salicylate, diosmin-hesperidin and white-soft-paraffin (AI). White soft paraffin was also made to follow the SCHEMA rule for no-uk-product medicines.

**How I checked**
- Re-read sections 4.1 to 4.9 in full of every source in both batches. That is 21 pages:
  - 5 clotrimazole SmPCs and the BUMPS leaflet;
  - 2 mupirocin SmPCs and the SPS impetigo breastfeeding page;
  - the silver sulfadiazine SPC;
  - the 2 povidone-iodine SPCs, plus 6.2;
  - the calamine SmPC;
  - the lidocaine gel SPC, plus 4.9 and 5.1;
  - the 2 capsaicin SmPCs and NICE CG173;
  - the muscle rub SmPC;
  - the horse chestnut THR SPC;
  - the MHRA emollient DSU and the SPS emollient fire-risk page.
- Rechecked the product choices and current licences in the MHRA Products search index (the index behind products.mhra.gov.uk). I searched by product name and by full text.
- I also compared the emc muscle rub SmPC (2019) with the newest MHRA copy of the same licence (PL 00240/0360, indexed 2026-05-22). Sections 4.1 to 4.9 are the same.
- Ran real-data engine scenarios. All gave the expected result:
  - clotrimazole cream with a nail or scalp infection;
  - povidone-iodine with silver sulfadiazine;
  - silver sulfadiazine with gliclazide;
  - lidocaine with atenolol, verapamil and co-trimoxazole;
  - the muscle rub with warfarin, insulin and aspirin (the rub does not trigger the salicylate-group rules);
  - calamine in pregnancy and breastfeeding.

**Results after the edits**
- All 592 quotes in the 14 files are FOUND (lib/text.mjs `quoteFound`).
- `validate()` gives 0 errors in the whole KB, and 0 errors and 0 warnings for these ids.
- A display-text scan for brand, manufacturer or emc product ids finds none. The only hits are "emc" used as a website name in search notes.

## 1. Changes

| File | Item / rule | Before → after | Reason | Quote |
|---|---|---|---|---|
| aescin.json | whole file | Filled from the UK THR horse chestnut seed extract tablet (8 rules, all sections) → `availability: no-uk-product`. Every section is not-available, `rules: []`, and there are 2 clinic formulations (aescin 50 mg, aescin 20 mg) with no `src`. Formulation ids are now `aescin-tab-50` and `aescin-tab-20`. The extract search terms were removed. | **Different active substance.** The MHRA index records the THR active substance as "Aesculus hippocastanum dry extract 4-6:1". It is a whole herbal extract, standardised to 50 mg triterpene glycosides as beta-aescin. The clinic products are "Aescin 50 mg" and "Aescine salicylate 20 mg". The coordinator's test was "accept only if same active substance". The previous file is saved in the scratchpad (`ahai/before/aescin.json`). | THR SPC: "157.5-225.0 mg of extract (as dry extract) from fresh Horse chestnut seeds … corresponding to 50 mg triterpene glycosides, calculated as anhydrous β-aescin" |
| white-soft-paraffin.json | sections cautions, adverseSerious, monitoring, counselling | 4 sourced items (MHRA DSU / SPS fire risk) → all not-available. The fire-risk advice is summarised in `availability.note`, which names MHRA DSU Dec 2018 and SPS June 2026. | SCHEMA: a no-uk-product medicine has every section not-available (coordinator's instruction). | Not applicable |
| clotrimazole.json | NEW rule `clotrimazole:condition:nail-scalp-infection` (contraindicated, cream only) + NEW condition `nail-scalp-fungal-infection` in sources/AH.json | No rule | **Missing 4.3 contraindication** (cream SmPC) | emc-1282 "Do not use the cream to treat nail or scalp infections." |
| clotrimazole.json | NEW rule `clotrimazole:breastfeeding` (info) | No breastfeeding rule | Brief: breastfeeding statements must be rules | emc-1282 "Clotrimazole may be used during lactation." / "If used topically on the nipple area, wash breasts before feeding child." |
| clotrimazole.json | cautions, cream excipients/fire item | "Fabric soaked with the cream burns more easily" → "Fabric that has been in contact with the cream burns more easily and is a serious fire hazard". The quote was added. | Faithfulness: "soaked" is not in the source | emc-1282 "Fabric (clothing, bedding, dressings etc) that has been in contact with this product burns more easily and is a serious fire hazard." |
| calamine-zinc-oxide.json | NEW rules `calamine-zinc-oxide:pregnancy` and `:breastfeeding` (info) | No rules | Brief: pregnancy and breastfeeding statements must be rules | emc-4822 "No evidence has been found as to the safety of the product when used during pregnancy and lactation." / "the product has been used for many years without any apparent ill effects" |
| mupirocin.json | rule `mupirocin:breastfeeding` | Consequence said "negligible amounts expected in milk", and the action quoted the infant-contact advice, but neither was among the rule's quotes → consequence is now "SPS: can be used … SmPC has no information on excretion in milk". Both quotes were added. Level `monitor` kept. | Every rule statement must be backed by the rule's own quotes | emc-1156 "There is no information on the excretion of Bactroban in milk."; SPS "Care should be taken to avoid direct contact between the infant and impetigo lesion(s) and treated area." |
| silver-sulfadiazine.json | rule `interaction:oral-antidiabetic` action | "Monitor blood levels (glucose-lowering effect)…" → "In large-area burns, monitor blood levels of the oral hypoglycaemic agent, as its effect can be potentiated." | Faithfulness: the SPC says monitor blood levels of these drugs, not glucose | SPC "it is recommended that blood levels should be monitored as their effects can be potentiated" |
| povidone-iodine.json | formulation `povidone-iodine-oint` note | Added that the pea-sized amounts and the age maximums are for the 5% cream, cannot be transferred to the clinic 10% ointment, and that the clinic label should be used. Mapping kept: same active, different strength (coordinator). | Numbers: the UK amounts would give twice the iodine with a 10% product | Not applicable |
| povidone-iodine.json | cautions, fire item | "cream-soaked fabric" → "fabric that has been in contact with the cream". The quote was added. | Faithfulness | SPC "that has been in contact with this product burns more easily and is a serious fire hazard" |
| lidocaine-topical.json | rule `condition:g6pd-deficiency` | level `caution` → `info`. The action now says no specific action is stated for the gel, and that methylene blue cannot be given if methaemoglobinaemia occurs. | **Level upgraded without support:** the SPC only says these patients are "more susceptible". The matching hereditary methaemoglobinaemia rule was already `info`. | SPC "Patients with defective glucose-6-phosphate dehydrogenase, hereditary or idiopathic methaemoglobinemia are more susceptible" |
| lidocaine-topical.json | counselling item | Example symptoms "ringing in the ears, blurred vision, twitching" → "dizziness, nausea, vomiting, slurred speech, unsteadiness, hearing or vision disturbance" | Faithfulness: the old examples were not in the quoted text | SPC "dizziness, nausea, vomiting, dysarthria, ataxia, hearing and vision disorders" |
| menthol-methyl-salicylate-camphor.json | formulation note | "The only UK SmPC for a cream with all three ingredients" → the product contains all three plus a fourth active (capsicum oleoresin), and the clinic products' strengths are not known. | **Untrue claim.** The MHRA index also lists a cream with camphor, menthol, capsicum oleoresin and methyl salicylate, and a balm/vapour rub with exactly the three ingredients. The SmPC used is the same brand and licence as the clinic's first product, so it was kept. | Not applicable |
| diosmin-hesperidin.json | formulation strengths | "500 mg (clinic product)" → "Diosmin 450 mg + hesperidin 50 mg (500 mg, clinic product)" | Clinic list gives both components | Not applicable |
| sources/AI.json | conditions, notes | `venous-leg-ulcer` removed (it was only used by the old aescin rules). The audit notes were added. The THR, DSU and SPS source entries are kept for reference but are no longer quoted. | Follows the conversions | Not applicable |
| sources/AH.json | conditions, notes | `nail-scalp-fungal-infection` added; audit notes appended | New rule | Not applicable |

**Change counts**
- 1 converted to no-uk-product (aescin).
- 1 no-uk-product file made schema-consistent (white soft paraffin).
- 4 new rules: clotrimazole ×2 and calamine ×2. The clotrimazole nail/scalp rule also needed 1 new condition.
- 1 level correction (lidocaine G6PD).
- 9 wording, quote or note fixes.

## 2. Checked and confirmed (coordinator's questions)

- **Two triple-combination creams are no-uk-product. Confirmed.**
  - Gentamicin: the MHRA index has only injections, intrathecal and eye/ear drops. There is no skin product, so no betamethasone, miconazole and gentamicin combination exists.
  - Triamcinolone: the MHRA index has only a hexacetonide injection. The emc search returns two discontinued injections and a nasal spray.
  - The clinic-linked emc products are single-ingredient products or clobetasol, and were rightly not used.
- **Povidone-iodine 10% ointment → UK 5% cream SPC. Acceptable with a note.**
  - Same active and skin route. A dose-amount warning was added (see the change table).
  - The cream and spray licences (PL 58442/0003 and /0001) are current, indexed 2026-09-04.
  - The dry powder spray maps to the UK 2.5% cutaneous spray powder (clinic strength not stated).
- **Aescin: not the same active.** Converted (see the change table).
- **Menthol/methyl salicylate rub is not in group `salicylate`. Confirmed correct.**
  - It is a local product.
  - The group drives systemic interactions (insulin, sulfonylureas, diuretics, corticosteroids), and the rub's SmPC does not state them. The engine would ignore group matches for a topical product anyway.
  - The salicylate hypersensitivity contraindication is kept as an allergy rule (`allergen: methyl-salicylate, group:salicylate, aspirin`).
  - The warfarin rule (info, bleeding) is the only interaction the SmPC states.
- **White soft paraffin.** Made consistent (see the change table).
- **Lidocaine topical gel via the MHRA SPC. Accepted.**
  - It is a single-ingredient lidocaine hydrochloride 2% gel, the same salt and strength as the clinic product.
  - Licence PL 03377/0003 is current, indexed 2026-08-07.
  - Its licensed uses are urethral and rectal, and the formulation note says so.
- **Routes.** All local products have local routes: topical, vaginal, nasal, or "topical (urethral, rectal, mucosal)". All match `isLocal`. The only oral ones are diosmin-hesperidin and aescin, which are now both no-uk-product.

## 3. Problems not fixed

- **Mupirocin skin ointment, renal rule.** The rule uses the condition `moderate-severe-renal-impairment` with no numeric threshold, because the SmPC gives none. It will not fire from an entered eGFR or CrCl value alone.
- **Silver sulfadiazine pregnancy rule.** "At, or near term" is encoded as trimester 3. The concern text states "at or near term", but the rule will show as contraindicated for the whole third trimester.
- **Silver sulfadiazine and oral antidiabetics.** The rule applies only to large-area burns, but the engine cannot know the burn area. The concern text says "Large-area burns".
- **Clotrimazole vaginal forms.** The interaction with oral tacrolimus or sirolimus is text only, because neither medicine is in the master list. The same applies to the povidone-iodine and lithium interaction, mercury products, and the lidocaine interactions with class I/III anti-arrhythmics (mexiletine, amiodarone), phenytoin and phenobarbital.
- **Lidocaine and other amide local anaesthetics** ("should not be used … toxic effects are additive"). No rule is possible, because lidocaine-topical is the only member of `amide-local-anaesthetic`.
- **For the integrator (batch AJ).** Batch AJ puts povidone-iodine in group `antiseptic`, but no rule uses that group now. Even if one did, the engine's `isLocal` check would ignore a group match where the other medicine is topical. I did not add `antiseptic` to povidone-iodine.json `groups` (another batch's group, and not needed by the engine).
- **Capsaicin strength.** The clinic product is 0.03%. The UK has only 0.025% (osteoarthritis) and 0.075% (post-herpetic neuralgia, painful diabetic neuropathy), and they are shown as two formulations. The notes say so, but a user must pick the one matching the indication.

## 4. Per-medicine assessment

**Batch AH**
- **Betamethasone/miconazole/gentamicin:** correct no-uk-product. The note is accurate.
- **Triamcinolone/nystatin/neomycin:** correct no-uk-product. The note is accurate.
- **Clotrimazole:** good. Five current UK SmPCs matched to the clinic forms.
  - Levels are faithful: 4.4 "medical advice must be sought" is caution, and "should not be used" is avoid.
  - Two gaps are now filled: the 4.3 nail/scalp rule and the breastfeeding rule.
  - Conflict kept: SmPC "supervision of a physician or midwife" versus BUMPS "first-choice treatment".
- **Mupirocin:** good. Ointment and nasal ointment are kept apart, including the PEG/renal statement for the skin ointment only. Small fix to the breastfeeding rule's sourcing.
- **Silver sulfadiazine:** good. The SPC is the clinic product's own licence.
  - The 4.3 items are all rules: term pregnancy, newborns under 3 months, and sulfonamide and own hypersensitivity.
  - SJS/TEN handling is faithful.
- **Povidone-iodine:**
  - Good for the spray powder.
  - Acceptable for the 10% ointment as a 5% cream proxy, now with an explicit warning about dose amounts.
  - All 4.3 items are rules: thyroid dysfunction (3 condition ids), radioiodine, age under 1, hypersensitivity. Breastfeeding is avoid, as in 4.6.
- **Calamine/zinc oxide:** good (simple SmPC). Pregnancy and breastfeeding info rules added.

**Batch AI**
- **Lidocaine (topical gel):** very thorough.
  - All 4.3 items are rules. The 4.4 special-attention list is caution. Renal and hepatic are dose.
  - The interactions match 4.5, and the CYP3A4/1A2 note "not of clinical significance" was correctly left without a rule.
  - One level fix (G6PD) and one counselling wording fix.
- **Capsaicin:** good. Both current UK strengths are used, with clear notes, and the levels are faithful.
- **Menthol/methyl salicylate/camphor:** good.
  - The SmPC used is the same brand and licence as the clinic product. The 2019 emc text is identical to the 2026 MHRA copy.
  - Correctly kept out of the salicylate group. The formulation note was corrected.
- **Aescin/diethylamine salicylate gel:** correct no-uk-product.
- **Aescin (oral):** converted to no-uk-product (different active substance).
- **Diosmin/hesperidin:** correct no-uk-product. The MHRA index has no product, PIL or THR for either substance.
- **White soft paraffin:** correct no-uk-product. Now consistent with SCHEMA, with the fire-risk advice in the availability note.
