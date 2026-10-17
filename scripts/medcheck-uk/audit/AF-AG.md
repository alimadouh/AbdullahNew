# Audit: batches AF and AG

Independent second check of the clinic-expansion batches AF and AG, 2026-10-17. Each section below has its own change table, unfixed problems and per-medicine assessment.

**Medicines converted to no-uk-product:** iron-polymaltose-b-complex (AF). mometasone-miconazole and isoconazole-diflucortolone (AG) were already no-uk-product; this is confirmed.

## Batch AF (colecalciferol, calcium-carbonate-colecalciferol, ferrous-sulfate-folic-acid, folic-acid, ascorbic-acid, vitamin-b-complex, iron-polymaltose-b-complex, calcium-glubionate)

Independent second check, 2026-10-17. I re-read sections 2 and 4.1 to 4.9 in full of every SmPC the batch uses: emc-6861, emc-7044, emc-8091, MHRA PL 20416/0805 (50,000 IU capsule), emc-2766, emc-4723, emc-1191, MHRA PL 48669/0001, emc-14604, emc-101277 and MHRA PL 20416/0410. I also re-checked the clinic-map rows for all 8 medicines and re-ran the emc search for "polymaltose".

After the edits:
- all 547 quotes in the 8 medicine files and `sources/AF.json` are FOUND (same `quoteFound` test as `--check`);
- `validate()` reports 0 schema errors in the whole KB;
- the display text (label, strengths, note, t, tag, concern, consequence, action, className, name, sourceWording, section notes) has no brand, manufacturer or emc id. Section notes still name the site "emc" and give MHRA PL numbers; these are not brands.

**Converted to no-uk-product:** iron-polymaltose-b-complex.

### 1. Changes

| File | Item / rule | Before | After | Reason | Supporting quote |
|---|---|---|---|---|---|
| iron-polymaltose-b-complex.json | whole file | Filled from a UK ferrous **fumarate** syrup (emc-2822): every section filled, plus rules | `availability: no-uk-product` (note records the searches); all 17 sections `not-available`; `rules: []`; one clinic formulation with no `src`; `groups: []`; "iron syrup" removed from searchTerms; className reworded | **Wrong active form.** A different iron salt is not iron polymaltose (brief, check 1). emc search for "polymaltose" re-run: "No search results for polymaltose". The `iron` ingredient is kept so the tool still flags two iron products chosen together. | Not applicable |
| sources/AF.json | groups `iron-preparation`, `polyvalent-cation` | iron-polymaltose-b-complex was a member (quoted from the ferrous fumarate SmPC) | Membership removed from both | Follows the conversion (coordinator) | Not applicable |
| sources/AF.json | source `emc-2822`; condition `non-iron-deficiency-anaemia` | Present | Removed (grep: nothing else uses them) | Follows the conversion | Not applicable |
| calcium-carbonate-colecalciferol.json | formulation `ccd-calcium-only-600` and its 4 items (indications, dosing, paediatric, administration) | Calcium-only chewable tablet (emc-1295) added inside this medicine | Removed | Coordinator: the clinic calcium-only row will be remapped to `calcium-carbonate` | Not applicable |
| calcium-carbonate-colecalciferol.json | rule `condition:severe-renal-failure-no-dialysis` | contraindicated, calcium-only formulation only | Removed | Applied only to the removed formulation | Not applicable |
| calcium-carbonate-colecalciferol.json | rule `condition:severe-renal-impairment` | `formulations: [600-400, 300-200]` | No formulation limit (now covers both remaining formulations) | Without this, nothing dangles, and the scope is kept for every remaining product | emc-2766 "Severe renal impairment and renal failure"; emc-4723 "Severe renal failure." |
| calcium-carbonate-colecalciferol.json | 10 rules and items with `formulations: [300-200, calcium-only]` | Included the removed formulation id | Now `[ccd-caplet-300-200]` | No dangling formulation ids | Not applicable |
| calcium-carbonate-colecalciferol.json | contraindication, renal, hepatic, interaction and pregnancy/breastfeeding items, plus rules `vitamin-d-overdose`, `primary-hyperparathyroidism`, `pregnancy:physician` | Cited emc-1295 or mentioned "calcium-only tablet" / "all three SmPCs" / "other two SmPCs" | emc-1295 quotes dropped or moved to emc-4723 (the same words are in its 4.3). Text now says "both SmPCs" / "the 300 mg / 200 IU tablet SmPC". Calcium-only sentences removed. | Consistency after the removal | emc-4723 "primary hyperparathyroidism and vitamin D overdosage" |
| calcium-carbonate-colecalciferol.json | rule `age:600-400` (avoid, under 18) | Action "Not for use under 18 years" (looked sourced) | "Not intended for children and adolescents. The SmPC gives no age; the tool applies this under 18 years." | The 18-year assumption must be stated | emc-2766 "Accrete D3 film coated tablets are not intended for use in children and adolescents." |
| calcium-carbonate-colecalciferol.json | rules `condition:peanut-soya` (contraindicated) and `condition:sugar-intolerance` (avoid) | Read as if they apply to the clinic product | Concern/consequence/action now say these are excipients of the UK proxy products and tell the user to check the clinic product's excipients. The second UK SmPC (emc-4723) is added to the sugar rule. Levels unchanged. | The clinic tablet (600 mg + 200 IU) is not the UK product; its excipients are unknown | emc-2766 "(including soya or peanut)"; emc-4723 "Patients with rare hereditary problems of fructose intolerance, glucose-galactose malabsorption or sucrase-isomaltase insufficiency should not take this medicine." |
| calcium-glubionate.json | formulation `strengths` / `note` | Note said the UK tablet is used, and the reader should "dose the syrup by its own calcium content" | Strengths show only the clinic syrup. The note says the UK tablet is a different calcium product (same active: calcium). Only calcium-class warnings, contraindications and interactions are shown. The tablet's dose, excipients and administration do NOT apply: use the clinic label for the syrup dose. | Coordinator: acceptable only with a clear note | emc-1191 "(equivalent to 1000 mg or 25 mmol of calcium)" |
| calcium-glubionate.json | `dosing`, `paediatric` | "1000 mg calcium per day … calculate volume" applied to the syrup | One item each, tagged "UK effervescent tablet only (not the syrup)", ending "use the clinic label for the syrup dose" | Tablet dose text must not be applied to the syrup | emc-1191 "Adults and children: 1000mg per day." |
| calcium-glubionate.json | `administration` | "Dissolve in a glass of water" | `not-stated`, with a note that it does not apply to the syrup | Tablet-only instruction | Not applicable |
| calcium-glubionate.json | cautions "citric acid…" and "Excipients of the UK product…"; renal item (citrate sentence) | Present | Removed / trimmed | Excipient-driven (citric acid, aspartame, glucose); the syrup's excipients are unknown | Not applicable |
| calcium-glubionate.json | rules `condition:severe-renal-impairment` (citrate), `condition:phenylketonuria`, `condition:sugar-intolerance`, `interaction:aluminium` | caution / caution / avoid / caution | **Removed** | All come from the UK tablet's excipients (citric acid → aluminium absorption, aspartame, glucose), not from calcium | emc-1191 "(which contains 3323.0 mg of citric acid)" |
| calcium-glubionate.json | rule `allergy:calcium` | "Hypersensitivity to the calcium salts or excipients" | Concern/action say this comes from the UK calcium tablet SmPC, whose salts and excipients differ from the syrup's. Level kept. | Honest scope | emc-1191 "Hypersensitivity to the active substances or to any of the excipients listed in section 6.1 of the effervescent tablet" |
| calcium-glubionate.json | NEW rule `breastfeeding` (info) | No breastfeeding rule | Can be used in lactation for calcium deficiency; no adverse effects in the neonate | Brief: breastfeeding statements must be rules | emc-1191 "Significant amounts of calcium are secreted in milk during lactation but do not cause any adverse effects to the neonate." |
| vitamin-b-complex.json | formulation `label` / `strengths` / `note` | Note said the clinic tablet's "exact vitamins are not stated" | Shows the clinic make-up (thiamine 2 + riboflavin 2 + pyridoxine 2 + calcium pantothenate 3 + niacinamide 20 mg) beside the UK one. The note says the UK product shares 4 actives, has more thiamine (5 vs 2 mg), has NO calcium pantothenate (not covered by any UK source here), and its dose and excipients do not apply. | **Wrong statement.** clinic-map.json names the vitamins. The match is partial and must be visible. | mhra-pl20416-0410-spc "Each coated tablet contains Thiamine HCI 5 mg, Riboflavin 2 mg, Nicotinamide 20 mg and Pyridoxine HC1 2 mg" |
| vitamin-b-complex.json | `dosing`, `paediatric` | "1-2 tablets three times daily" as if for the clinic tablet | Tagged "UK vitamin B compound strong tablet only", with "use the clinic label for its dose" | Different make-up per tablet | same quote as before |
| vitamin-b-complex.json | `cautions` item + rules `condition:galactose-intolerance`, `condition:sugar-intolerance` | lactose warning; 2 avoid rules | Cautions `not-stated` (with a note); both rules **removed** | Excipient of the UK tablet only; the clinic tablet's excipients are unknown | Not applicable |
| vitamin-b-complex.json | rule `age:under-3` | "Children under 3 years" | Concern/action name the UK tablet SmPC as the source. Level kept at avoid. | Scope | mhra-pl20416-0410-spc "Should not be used in children under 3 years." |
| vitamin-b-complex.json | `searchTerms` | Included "vitamin B compound strong" (UK product name) | Generic spellings, including the clinic's five-vitamin list | Generic names only | Not applicable |
| ferrous-sulfate-folic-acid.json | NEW rules `pregnancy` (info), `breastfeeding` (info) | None | Indicated in pregnancy; ferrous salts recommended in pregnancy and lactation; no adverse effects in breastfed infants | Brief: pregnancy/breastfeeding statements must be rules | MHRA PL 48669/0001 "Ferrous salts are recommended for use in pregnancy and lactation, and no contraindications to such are known." |
| ferrous-sulfate-folic-acid.json | rule `age:children` (avoid, under 18) | No age assumption stated | Action: "The SmPC gives no age; the tool applies this under 18 years". The elderly "not recommended" is noted but is not an age rule. | 18-year assumption must be stated | "Children and elderly: not recommended." |
| folic-acid.json | rule `condition:malignant-disease` (contraindicated) | Concern "Malignant disease (folate-dependent tumours)" | Concern "Malignant disease (unless megaloblastic anaemia from folate deficiency is an important complication)". Consequence reworded. Level kept (the statement is in 4.3). | **Missing qualifier** on a do-not-give item | emc-14604 "Folic acid should not be used in malignant disease unless megaloblastic anaemia owing to folate deficiency is an important complication." |
| folic-acid.json | rule `condition:cobalamin-deficiency` (contraindicated) | Concern did not say "long-term"; "short courses do no harm" had no quote | Concern starts "Long-term folate in untreated…"; a quote was added for short courses | **Missing qualifier** + an unsourced phrase | emc-14604 "No harm results from short courses of folate." |
| folic-acid.json | NEW rules `pregnancy` (info), `breastfeeding` (info) | None | No known hazards; the 5 mg tablet is not intended for healthy pregnant women. No adverse effects in breastfed infants. | Brief: pregnancy/breastfeeding statements must be rules | emc-14604 "This product is not intended for healthy pregnant women where lower doses are recommended…" |
| ascorbic-acid.json | rules `condition:galactose-intolerance`, `condition:sugar-intolerance` (avoid) | Read as applying to the clinic 1000 mg tablet | Consequence/action say lactose is in the UK 500 mg tablet; check the excipients of the product supplied. Level kept. | The proxy product's excipients may differ | emc-101277 "…should not take this medicine as it contains lactose." |
| colecalciferol.json | pregnancy item (drops) | Only "up to 2 000 I.U./day" | Adds that the 2740 IU/ml SmPC gives 400-4,000 IU daily for treatment in pregnancy and breastfeeding (the UK sources differ) | Conflicting UK sources must both be shown | emc-6861 "During pregnancy and breast-feeding Treatment of vitamin D deficiency 6 – 60 drops (400 – 4,000 IU) daily." (U+0096 dashes, FOUND) |
| sources/AF.json | source `emc-1295`; `notes` | emc-1295 listed; notes described the old calcium-only and ferrous fumarate approach | emc-1295 removed (batch G still lists it for calcium-carbonate). The notes record each audit decision and correct the imidazole reasoning. | Housekeeping | Not applicable |

**Counts:** 1 medicine converted to no-uk-product; 1 formulation removed; 7 rules removed (6 excipient-driven from proxy products, 1 for the removed formulation; the iron polymaltose rules removed in the conversion are not counted); 5 rules added (pregnancy/breastfeeding); 10 rule texts qualified (concern/action scope or missing qualifier); about 20 items scoped, rewritten or removed; 3 group memberships and 2 sources removed.

**Checked and left unchanged (correct):**
- **Colecalciferol:**
  - 4.3 items are `contraindicated`: hypersensitivity, hypercalcaemia/hypercalciuria, hypervitaminosis D, nephrolithiasis (the 10 000 I.U./ml SmPC's narrower wording is shown), nephrocalcinosis, severe renal impairment (eGFR <30 from emc-8091, `maxInclusive` false, correct), and pseudohypoparathyroidism (capsule only).
  - Capsule under-18, pregnancy and lactation are `avoid` ("not recommended"); SPS breastfeeding is `monitor`.
  - Thiazide is `monitor`; glucocorticoids and anticonvulsants (carbamazepine is in `antiepileptic`; SmPC: "anticonvulsants (such as phenytoin)") are `info`.
- **Calcium/colecalciferol:**
  - The two-product split (2766 = absolute stone/hypercalciuria contraindication; 4723 = relative) is kept as separate rules.
  - Separation-time rules are kept per source.
- **Ferrous sulfate/folic acid:** the UK product is the exact clinic product (same name, 150 mg + 0.5 mg). The 4.3 rules, cautions and interactions match the SmPC.
- **Folic acid:** an exact 5 mg match. The methotrexate rule (`info`) and the SPS context were checked.
- **Ascorbic acid:**
  - Hyperoxaluria is `contraindicated`: "should not be given" sits in 4.3.
  - Antacids are `avoid` ("not recommended").
  - The 4-11 years maximum of 500 mg is a `dose` rule.
- **Groups:**
  - vitamin-d: colecalciferol and calcium-carbonate-colecalciferol.
  - calcium-preparation and polyvalent-cation: calcium-carbonate-colecalciferol and calcium-glubionate.
  - iron-preparation and polyvalent-cation: ferrous-sulfate-folic-acid.
  - None of these medicines is QT-prolonging, and none is in `qt-prolonging`.

### 2. Problems not fixed

- **clinic-map.json** (not my file): the row "caltrate / calcium carbonate 600mg" still maps to `calcium-carbonate-colecalciferol`. It must be remapped to `calcium-carbonate`. Until then, that row shows only the calcium + vitamin D products.
- **Batch Z `vitamin` group:** its member vitamin-b-complex is still valid. The source is still used, and the 4 shared actives are vitamins.
- **Imidazole antifungals** (vitamin D SmPCs 4.5): there is no rule. AG's `imidazole-antifungal` group has only skin, mouth and vaginal products, which the engine never matches to a systemic rule. Add a rule if a systemic imidazole joins the master list.
- **Cardiac glycosides, bisphosphonates, orlistat, colestyramine, levodopa and other medicines** named in 4.5: there is no master-list member, so there are no rules.
- **Proxy-product excipients:** the excipient rules that remain (colecalciferol almond oil caution; calcium/colecalciferol sucrose and soya; ascorbic acid lactose) come from UK proxy products, not the clinic product. Their text now says so. Folic acid 5 mg and ferrous sulfate/folic acid are exact products, so their excipient rules stay as they are.
- **Current licensing:**
  - The ferrous sulfate/folic acid SmPC (MHRA Products, revised 2017) and the colecalciferol 2740 IU/ml drops SmPC (revised 2015) are old texts.
  - Both are still listed (MHRA Products and emc). I found no sign that either has been withdrawn.

### 3. Per-medicine assessment

- **colecalciferol**: good. Four UK SmPCs (no 2000 IU/ml drop exists in the UK); the strength difference is stated. Rules are faithful; conflicts are shown.
- **calcium-carbonate-colecalciferol**: good after the clean-up. Two proxy products: 600 mg + 400 IU (the clinic's has 200 IU) and 300 mg + 200 IU. Notes say so. The calcium-only content is gone.
- **ferrous-sulfate-folic-acid**: good. An exact product; pregnancy and breastfeeding rules were added.
- **folic-acid**: good. An exact product. The two do-not-give rules now carry their qualifiers; pregnancy and breastfeeding rules were added.
- **ascorbic-acid**: good. The UK 500 mg SmPC is used for a 1000 mg tablet (same active); this is stated. The excipient rules are qualified.
- **vitamin-b-complex**: acceptable as a **partial** match. I kept it rather than converting it, because:
  - four of the five actives are the same substances;
  - the UK statements (hypersensitivity to those four, pyridoxine in breastfeeding, pregnancy caution, levodopa) are about shared actives;
  - the missing calcium pantothenate and the dose difference are stated plainly.
  
  If the integrator wants a strict same-actives rule, convert it to no-uk-product.
- **iron-polymaltose-b-complex**: no UK product; converted. No rules.
- **calcium-glubionate**: acceptable only as calcium-class information. The note, dose scoping and excipient-rule removal now stop tablet facts being applied to the syrup.

## Batch AG (hydrocortisone-topical, fusidic-acid, fusidic-acid-hydrocortisone, fusidic-acid-betamethasone, miconazole-hydrocortisone, mometasone-miconazole, isoconazole-diflucortolone)

Independent second check, 2026-10-17. I re-read in full sections 2 and 4.1 to 4.9 (and 5.1) of all six SmPCs the batch uses: emc-12908, emc-102471, emc-5510, emc-5511, emc-983 and emc-1557. I also re-read the three MHRA Drug Safety Updates, the SPS breastfeeding pages, the BUMPS topical corticosteroid leaflet and NICE NG153 and NG190, and the clinic-map rows for all seven medicines. I re-ran the product searches for the two no-uk-product medicines on emc and on the MHRA products index.

After the edits:
- all 388 quotes in the 7 medicine files and the AG groups are FOUND (lib/text.mjs `quoteFound`, the same test as `--check`);
- `validate()` reports 0 schema errors in the whole KB, and `test-engine.mjs` passes (39 tests);
- the display text (label, strengths, note, t, tag, concern, consequence, action, className, name, section notes) has no brand, manufacturer or emc id. The availability notes name the website "emc", which is not a brand.

**Converted to no-uk-product:** none. mometasone-miconazole and isoconazole-diflucortolone stay no-uk-product (confirmed).

### 1. Changes

| File | Item / rule | Before | After | Reason | Supporting quote |
|---|---|---|---|---|---|
| miconazole-hydrocortisone.json | rule `age:lt10` (contraindicated) | Concern "Child under 10 years" | Concern "Child under 10 years, unless prescribed by a doctor". The consequence says the exclusion does not apply when a doctor prescribes it, and that the SmPC gives no separate child dose. The action adds caution on large areas or under nappies and avoiding long-term use. Level kept at `contraindicated`, because the statement is in 4.3. | Coordinator: keep contraindicated only if it is in 4.3, and the concern must say "unless prescribed by a doctor". The "do not give in" list shows the concern. | emc-1557 "Children under 10 years of age, unless prescribed by a doctor" (4.3); "Long term continuous topical corticosteroid therapy should be avoided. Adrenal suppression can occur even without occlusion." |
| miconazole-hydrocortisone.json | rule `interaction:vitamin-k-antagonist` | Consequence "inhibits CYP2C9 … even from topical products"; 2 quotes | The consequence follows the SmPC (CYP3A4/2C9 for systemic miconazole; topical absorption is limited) and the MHRA warning. Mechanism, MHRA and stop-if-bleeding quotes added. Level kept at `caution`. | Faithfulness: the SmPC wording is "systemic"/"limited", and parts of the old text had no quote | emc-1557 "Miconazole administered systemically is known to inhibit CYP3A4/2C9, which can lead to prolonged effects of warfarin or other vitamin K antagonists."; DSU "Miconazole, including the topical gel formulation, can enhance the anticoagulant effect of warfarin" |
| miconazole-hydrocortisone.json | rules `condition:viral-skin-infection`, `condition:cutaneous-tuberculosis` | Consequence "The corticosteroid may worsen …" | "Listed in section 4.3 of the UK SmPC (…)" | **Unsupported reason.** The SmPC gives no reason. | emc-1557 "Tubercular or viral infections of the skin or those caused by Gram-negative bacteria." |
| miconazole-hydrocortisone.json | rule `allergy:ingredients` | Severe-reaction consequence had no quote | Quote added | Unsourced phrase | emc-1557 "Severe hypersensitivity reactions, including anaphylaxis and angioedema, have been reported during treatment with … and other miconazole topical formulations" |
| miconazole-hydrocortisone.json | rules `pregnancy` (avoid), `breastfeeding` (caution) | Consequences (placenta, animal data, unknown milk transfer) had no quotes | Quotes added. Levels kept: "preferable to avoid" is `avoid`; "Caution is recommended" is `caution`. | Unsourced phrases | emc-1557 "Corticosteroids are known to cross the placenta and consequently can affect the foetus"; "could result in sufficient systemic absorption to produce detectable quantities of hydrocortisone and miconazole in breast milk in humans" |
| miconazole-hydrocortisone.json | formulation note; counselling "condoms" item | Excipient and latex statements had no quotes | Quotes added | Unsourced phrases | emc-1557 "This medicine contains 2 mg/g of Benzoic acid (E210) which may cause local irritation."; "…may damage the latex." |
| hydrocortisone-topical.json | rules `condition:skin-infection-untreated`, `viral-skin-infection`, `varicella`, `cutaneous-tuberculosis` | Consequence "A corticosteroid (alone) may worsen or mask the infection" | Each says which SmPC lists it in 4.3. The skin-infection action adds the prescription SmPC advice (antimicrobial therapy; stop the steroid if infection spreads). Levels kept at `contraindicated`. | **Unsupported reason.** Neither SmPC says "worsen or mask". | emc-12908 "Skin lesions caused by infection with viruses (e.g. herpes simplex, chicken pox), fungi (e.g. candidiasis, tinea) or bacteria (e.g. impetigo)."; "Any spread of infection requires withdrawal of topical corticosteroid therapy, and systemic administration of antimicrobial agents." |
| hydrocortisone-topical.json | rules `pregnancy:p`, `breastfeeding:p`, `breastfeeding:sps` | Consequences (limited data, animal toxicity, excretion in milk, negligible milk levels) had no quotes | Quotes added. Levels kept. | Unsourced phrases | emc-102471 "Corticosteroids are excreted in human milk."; SPS "negligible concentrations in the breast milk, and therefore pose no significant risk to the breastfed infant" |
| hydrocortisone-topical.json | formulation `hydrocortisone-topical-cream-p` note | The under-10 and face/eyes/ano-genital claims had no quote | Quotes added | Unsourced note | emc-102471 "The product should not be used on the eyes or face (for example, in rosacea or perioral dermatoses), the ano-genital area" |
| hydrocortisone-topical.json | cautions "prolonged use" item; adverseCommon item | Mixed the two SmPCs without saying which said what ("blurred vision is uncommon" applied to both) | Each statement now names its SmPC: blurred vision is uncommon in the pharmacy-sale SmPC and "not known" in the prescription SmPC | When sources differ, name which says what | emc-12908 "Eye disorders Not known (cannot be estimated from the available data): Vision, blurred"; emc-102471 "Eye Disorders Uncommon Vision, blurred" |
| fusidic-acid-hydrocortisone.json, fusidic-acid-betamethasone.json | rules `skin-infection-untreated`, `viral-skin-infection`, `cutaneous-tuberculosis`, `cutaneous-syphilis`, `systemic-fungal-infection` | Consequences "may worsen or mask"; viral concern "Viral skin infection" with no qualifier | The consequences use the SmPC reason ("due to the content of corticosteroid"; it may increase susceptibility to infection, aggravate existing infection or activate latent infection), with a quote. The viral concern is now "Viral skin infection, untreated or uncontrolled". | **Missing qualifier** on a do-not-give item, and unsupported wording | emc-983 "Due to the content of corticosteroid, Fucibet® is contraindicated in the following conditions: Systemic fungal infections."; emc-5511/emc-983 "Primary skin infections caused by fungi, virus or bacteria, either untreated or uncontrolled by appropriate treatment" |
| fusidic-acid-hydrocortisone.json, fusidic-acid-betamethasone.json | rules `rosacea`, `perioral-dermatitis` | "topical steroids can cause or worsen rosacea" (no quote; "worsen" not in source) | "Contraindicated because of the corticosteroid content; also listed as a class skin effect", with 4.8 class-effect quotes | Unsupported wording | emc-5511 "skin striae, telangiectasia, rosacea, erythema"; emc-983 "Dermatological undesirable class effects of potent corticosteroids include" |
| fusidic-acid-hydrocortisone.json, fusidic-acid-betamethasone.json | pregnancy and breastfeeding rules and items; betamethasone paediatric item | Consequences (more than 1000 outcomes, limited data, negligible exposure, similar safety profile in children) had no quotes | Quotes added. Levels kept (Fucidin H `caution`; fusidic acid/betamethasone `avoid` "should not be used … unless clearly necessary"). | Unsourced phrases | emc-5511 "A large amount of data on pregnant women (more than 1000 pregnancy outcomes) indicates no malformative nor feto/neonatal toxicity of corticosteroids."; emc-983 "There are no or limited amount of data from the use of topical betamethasone valerate in pregnant women." |
| fusidic-acid.json | NEW rule `pregnancy` (info) | No pregnancy rule | Can be used in pregnancy; systemic exposure is negligible | Brief: pregnancy statements must be rules | emc-5510 "Topical Fucidin can be used during pregnancy." |
| fusidic-acid.json | restrictions item NICE NG153 | "hydrogen peroxide 1% is the first topical choice" (no population) | Adds NICE's population: localised non-bullous impetigo, not systemically unwell or at high risk. "Consider" wording, with a quote. | **Missing qualifier** | nice-ng153 "Consider hydrogen peroxide 1% cream for people with localised non-bullous impetigo who are not systemically unwell or at high risk of complications" |
| fusidic-acid.json | rule `breastfeeding:breast` | The "no effect on infant" consequence had no quote | Quote added | Unsourced phrase | emc-5510 "No effects on the breast-fed new-born/infant are anticipated…" |
| mometasone-miconazole.json, isoconazole-diflucortolone.json, sources/AG.json | `groups`; AG groups `topical-corticosteroid` and `imidazole-antifungal` | Members of topical-corticosteroid (both) and imidazole-antifungal (mometasone/miconazole; its quote came from the miconazole-only cream SmPC) | `groups: []`; memberships removed from AG.json | No-uk-product medicines leave groups (same policy as iron polymaltose). Nothing is lost: no rule uses these memberships, and allergy matching still works through the `miconazole` ingredient. | Not applicable |
| mometasone-miconazole.json, isoconazole-diflucortolone.json | `availability.note` | Original search record | Second-check search results appended | Confirms the no-uk-product status independently | emc search "isoconazole" / "diflucortolone" / "mometasone miconazole": no products; the emc "mometasone" search lists no product with miconazole; MHRA products index (SPC + PIL, product name and content): isoconazole 0, mometasone + miconazole 0, diflucortolone only 10 single-ingredient 2020 documents |
| mometasone-miconazole.json | breastfeeding item | "(high potency)" had no quote | Quote added | Unsourced phrase | SPS "Mometasone is considered high potency when applied as a cream or ointment." |
| sources/AG.json | `notes` | — | Audit summary appended | Record | Not applicable |

**Counts:** 0 conversions (2 confirmed); 1 rule added; 0 rules removed; 0 levels changed; 21 rule texts corrected (concern, consequence or action: missing qualifiers or unsupported reasons); 7 section items or notes corrected or given missing quotes; 3 group memberships removed; about 40 supporting quotes added.

**Checked and left unchanged (correct):**
- **Product match:**
  - Fusidic acid 2% cream, fusidic acid 2%/hydrocortisone acetate 1% cream, fusidic acid 2%/betamethasone 0.1% (valerate) cream and miconazole nitrate 2%/hydrocortisone 1% cream are the same actives, strengths and route as the clinic products.
  - Hydrocortisone 1% cream uses two current UK SmPCs (prescription hydrocortisone; pharmacy-sale hydrocortisone acetate). They are kept as separate formulations, so their different 4.3 lists, dosing and age limits stay separate.
  - All six SmPCs are current: emc pages dated 2025–2026, revision dates 2025–2026.
- **Levels:**
  - Every 4.3 item is `contraindicated`.
  - Fucidin H 4.4 "not recommended" items are `avoid`: atrophic skin, cutaneous ulcer, acne, perianal or genital pruritus.
  - Children are `caution`: "used with care", stated as under 18 years in the consequence.
  - Pharmacy-sale hydrocortisone under 10 is `avoid` (4.2 "should not be used … without medical advice").
  - Prescription hydrocortisone in children is a `dose` (duration limit), stated as under 18 years.
- **Interactions:**
  - All five SmPCs other than miconazole/hydrocortisone say no interaction studies were done and interactions are minimal or none, so they have no rules.
  - Miconazole/hydrocortisone with group `vitamin-k-antagonist` (warfarin) is correct. The miconazole–hydrocortisone CYP3A4 note is about its own ingredients, so it has no rule.
  - No topical product is in a systemic group (`corticosteroid`, `azole-antifungal`, `cyp3a4-inhibitor`, `qt-prolonging`). None prolongs QT.
- **Groups:**
  - `topical-corticosteroid`: hydrocortisone-topical, fusidic-acid-hydrocortisone, fusidic-acid-betamethasone and miconazole-hydrocortisone, each quoted from its own SmPC.
  - `imidazole-antifungal`: miconazole, miconazole-hydrocortisone and clotrimazole. Batch AC defines the same group (miconazole only), and the two merge.

### 2. Problems not fixed

- **No-uk-product sections that still have items.** mometasone-miconazole (cautions, interactions, pregnancy, breastfeeding) and isoconazole-diflucortolone (cautions, pregnancy, breastfeeding) keep sourced, class-wide UK items: MHRA topical steroid advice, the MHRA miconazole–warfarin DSU, BUMPS and SPS. Each is tagged "not a product label".
  - SCHEMA says every section of a no-uk-product medicine should be `not-available`. I kept these items because each is a UK regulator or UK specialist statement about the ingredient or class, not a product label.
  - **Integrator decision:** strip them to `not-available` if the schema is to be applied strictly.
- **Warfarin with mometasone/miconazole gives no alert.** The MHRA DSU applies to all miconazole products, but a no-uk-product medicine has `rules: []`. The warfarin rule `other: "miconazole"` also does not reach it, because the engine ignores ingredient matches for skin products.
  - The integrator could use `tool.json` `componentsOf` (`use: ["miconazole"]`). This is only safe if the miconazole rules that are not scoped to a formulation are skin-appropriate. Its oral gel rules are formulation-scoped, but please check.
- **Gliclazide (another batch).** gliclazide.json lists cutaneous-corticosteroid rules by id for hydrocortisone-topical, fusidic-acid-betamethasone, fusidic-acid-hydrocortisone, miconazole-hydrocortisone, mometasone-miconazole and betamethasone-miconazole-gentamicin.
  - It omits isoconazole-diflucortolone. That is consistent only if no-uk-product medicines are excluded, and then mometasone-miconazole is an inconsistent inclusion.
  - Its owner should align this.
- **4.3 items with no engine rule.** These cannot be expressed: no matching condition or kind exists.
  - Pharmacy-sale hydrocortisone: face/eyes, ano-genital area, occlusion, large areas.
  - Miconazole/hydrocortisone: large areas, more than 7 days, face/eyes/mucous membranes, Gram-negative skin infection, and ano-genital area, ringworm or secondary infection "unless prescribed by a doctor".
  - They are shown in the contraindications section text.
- **Elderly.** The miconazole/hydrocortisone elderly advice ("sparingly and for short periods") has no age, so it is a dosing item, not a rule.

### 3. Per-medicine assessment

- **hydrocortisone-topical**: good. Two current UK licences are kept apart by formulation. The 4.3 rules are faithful to each, and the reasons are now sourced. The clinic product's licence status (prescription or pharmacy) is unknown, so both are shown.
- **fusidic-acid**: good. An exact product. There is only a hypersensitivity contraindication, and NICE course lengths are given with their population. A pregnancy rule was added.
- **fusidic-acid-hydrocortisone**: good. An exact product. Every 4.3 and 4.4 "not recommended" item is a rule. Consequences are now from the source.
- **fusidic-acid-betamethasone**: good. Same composition as the clinic product. Potent (strong) labelling is correct. Pregnancy is `avoid`; BUMPS class advice is shown separately (betamethasone is not named in the leaflet).
- **miconazole-hydrocortisone**: good, with one limit: the only UK SmPC is a pharmacy-sale pack. Its "unless prescribed by a doctor" exclusions are now explicit in the concern text, and the warfarin rule is faithful to the SmPC and MHRA.
- **mometasone-miconazole**: no UK product (confirmed). No rules. Class-wide items kept (see the unfixed problems).
- **isoconazole-diflucortolone**: no UK product (confirmed). No rules. Class-wide items kept.
