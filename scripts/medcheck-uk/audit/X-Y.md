# Audit: batches X and Y

Batch X: hyoscine-butylbromide, dicycloverine, mebeverine, otilonium, pinaverium, chlordiazepoxide-clidinium, simeticone.
Batch Y: lactulose, macrogol, senna, bisacodyl, ispaghula-senna, loperamide, racecadotril.

Independent second check, 2026-10-17.

How it was checked:
- Every SmPC used was re-read in full, sections 2 to 5.1. That covers emc 1775, 3884, 891, 100975, 100976, 4666, 8896, 4929 and 6612; emc 5525, 1025, 52, 11848, 11140, 11240, 11689, 361, 102511, 558 and 13499; and the two MHRA racecadotril SPCs.
- The SPS antispasmodic, heartburn and laxative breastfeeding pages were read in full.
- The BUMPS hyoscine, mebeverine, constipation and loperamide leaflets were read in full.
- The clinic-linked SmPCs that were not used were also read: emc 8946, 102499, 13858, 1728 and 11548.
- After the edits, every quote in these 14 medicine files and in the X/Y group members was found (765/765). The schema check shows 0 errors and 0 warnings for these ids.

Level policy: anything inside SmPC 4.3 is `contraindicated`, even when the verb is "should not". "Must not be administered" in 4.4 is also `contraindicated`, as the SCHEMA mapping says.

## 1. Changes

All quotes below are FOUND (`fetchtext --check`).

| # | File | Item / rule | Before → after | Reason | Quote |
|---|---|---|---|---|---|
| 1 | hyoscine-butylbromide.json | formulation `hyoscine-butylbromide-syrup` note + new `src` | "No UK oral liquid … was found" (no src) → states that the MHRA refused UK marketing authorisations for a 5 mg/5 ml oral solution in 2025 (bioequivalence not demonstrated); tablet-data caveat kept | New UK evidence that confirms and strengthens the form gap. Tablet doses stay scoped to the tablet. | mhra-par-hyoscine-oral-solution-2025: "the MHRA have refused to grant marketing authorisations for Hyoscine Butylbromide 5mg/5ml Oral Solution"; "Bioequivalence of the proposed medicinal products to their reference medicinal products was not demonstrated."; "The procedure was finalised on 06 June 2025." |
| 2 | sources/X.json | new source `mhra-par-hyoscine-oral-solution-2025` | — → MHRA PAR (PL 20117/0458-0459) | Source for #1 | — |
| 3 | hyoscine-butylbromide.json | restrictions[0] | red-flag list (nausea, weight loss, urinary symptoms, fever, travel) not backed by a quote → quote added | Statement not fully sourced | emc-3884: "if you are feeling sick or vomiting if you have lost your appetite or lost weight if you have difficulty or pain passing urine if you have a fever if you have recently travelled abroad" |
| 4 | dicycloverine.json | `dicycloverine:pregnancy` | consequence not quoted → two quotes added | Consequence was not sourced in the rule | emc-100976: "have not shown that dicycloverine hydrochloride increases the risk of foetal abnormalities if administered during the first trimester of pregnancy"; "Since the risk of teratogenicity cannot be excluded with absolute certainty for any product" |
| 5 | simeticone.json | `simeticone:interaction:levothyroxine` consequence | general "absorption may be impaired if given at the same time" → says the infant SmPC limits this to infants treated for thyroid disorders, and the adult capsule SmPC reports no interactions; capsule quote added. Level stays info. | Missing population qualifier | emc-6612: "Absorption of levothyroxine may be impaired if Dentinox Infant Colic Drops are given concurrently to infants treated for thyroid disorders."; emc-4929: "other forms of interaction None reported." |
| 6 | lactulose.json | adverseSerious[1] | "adjust dose to two or three formed stools" not quoted → quote added | Unsourced part | emc-5525: "Dosage should then be adjusted to obtain two or three formed stools per day." |
| 7 | macrogol.json | adverseSerious[1]; breastfeeding[1] | stop/measure-electrolytes and SPS infant-monitoring parts not quoted → quotes added | Unsourced parts | emc-1025: "Movicol should be stopped immediately and electrolytes measured"; sps-laxatives-breastfeeding: "As a precaution monitor the infant for diarrhoea, vomiting or irritability." |
| 8 | senna.json | dosing[0] | "1-2 tablets at night … Maximum 30 mg a day" → adds that the 12-plus SmPC allows a higher dose under medical guidance, up to 30 mg a day | Missing qualifier. 30 mg is twice the usual 1-2 tablet (7.5-15 mg) dose and applies only under medical guidance. | emc-11848: "A higher dose may be prescribed under medical guidance." |
| 9 | senna.json, ispaghula-senna.json, bisacodyl.json | `<med>:interaction:corticosteroids` (other `group:corticosteroid`) → `<med>:interaction:prednisolone` + `<med>:interaction:dexamethasone` | group → the two systemic corticosteroids by id; concern now says "systemic corticosteroid"; levels unchanged (caution, caution, info) | Over-firing. group:corticosteroid includes nebulised budesonide and a beclometasone inhaler (inhalation routes are not filtered by `isLocal`). The SmPC sentence is about hypokalaemia from "adrenocorticosteroids". `otherFormulations` cannot be used with a group, because the validator requires a medicine id. | emc-11848 / emc-102511 / emc-11689: "Concomitant use with other medicinal products inducing hypokalaemia (e.g. diuretics, adrenocorticosteroids and liquorice root) may enhance electrolyte imbalance." / "The concomitant use of diuretics or adreno-corticosteroids may increase the risk of electrolyte imbalance if excessive doses of DULCOLAX are taken." |
| 10 | senna.json, ispaghula-senna.json | corticosteroid rules (#9); `ispaghula-senna:interaction:diuretics` | action "must consult a doctor" had no quote → 4.4 quote added | Action not sourced | emc-11848: "…diuretics, adrenocorticosteroids or liquorice root, have to consult a doctor before taking senna leaf preparations concomitantly."; emc-102511: same sentence ("…before taking Manevac concomitantly.") |
| 11 | bisacodyl.json | `bisacodyl:interaction:diuretics`, corticosteroid rules | action "Avoid excessive bisacodyl doses" → "No specific action stated in the SmPC; the risk applies when excessive bisacodyl doses are taken." | The action was invented; the SmPC states only the effect (level info) | as #9 |
| 12 | bisacodyl.json | `bisacodyl:breastfeeding` → split into `bisacodyl:breastfeeding` (SmPC, caution) + new `bisacodyl:breastfeeding:sps` (info) | one rule mixing SmPC and SPS → two rules | SCHEMA: sources that differ are kept as separate rules | emc-11689: "…during breast feeding unless the expected benefit is thought to outweigh any possible risk and only on medical advice."; sps: "Bisacodyl can be used during breastfeeding."; "Bisacodyl is poorly absorbed from both oral or rectal formulations"; "As a precaution monitor the infant for diarrhoea or irritability." |
| 13 | bisacodyl.json | `bisacodyl:pregnancy` | consequence not quoted → quote added | Unsourced consequence | emc-11689: "Long experience has shown no evidence of undesirable or damaging effects during pregnancy." |
| 14 | bisacodyl.json | adverseSerious[1]; breastfeeding[1] | "dehydration" and SPS monitoring not quoted → quotes added | Unsourced parts | emc-11689: "Rare: dehydration."; sps as #12 |
| 15 | loperamide.json | `loperamide:condition:dysentery` → scoped to `loperamide-cap` + new `loperamide:condition:dysentery-pom` (`loperamide-cap-pom`) | one unscoped contraindicated rule mixing both SmPCs → two formulation-scoped rules, both contraindicated (both sentences are in 4.3); the POM rule says "not to be used alone" | The two SmPCs word this differently. The POM qualifier "alone" was hidden in the action text. | emc-558: "This medicine is contraindicated:" + "in patients with acute dysentery, which is characterised by blood in stools and high fever."; emc-13499: "Loperamide hydrochloride should not be used alone in acute dysentery, which is characterised by blood in stools and elevated body temperatures." |
| 16 | loperamide.json | `loperamide:pregnancy` → split into SmPC (avoid) + new `loperamide:pregnancy:bumps` (caution) | one avoid rule mixing SmPC and BUMPS → two rules | The sources have different strengths; SCHEMA says keep them separate | emc-558: "Safety in human pregnancy has not been established"; "…it is not advisable to administer this medicine in pregnancy, especially during the first trimester."; bumps-loperamide: "loperamide is only recommended during pregnancy if there is no suitable alternative, as there is not enough information to say it is safe for the baby."; "It is unclear if there is any risk." |
| 17 | ispaghula-senna.json | formulation note | "UK product with the same ingredients as the clinic product" → the clinic record names ispaghula husk + senna; the UK product is ispaghula seed + husk + senna fruit, so check the composition and strengths against it | The "same ingredients" claim was not supported by any UK source. The clinic product's own composition is not in a UK source. | emc-102511 composition quote (unchanged) |
| 18 | sources/X.json, sources/Y.json | notes | audit addenda appended | Integrator information | — |

Counts:
- 5 scope/over-firing or source-merge corrections: #9 (3 medicines), #15, #16.
- 1 invented action removed (#11).
- 6 rules added net:
  - bisacodyl:breastfeeding:sps
  - loperamide:pregnancy:bumps
  - loperamide:condition:dysentery-pom
  - 3 group corticosteroid rules replaced by 6 medicine-id rules
- 12 missing quotes added (#3, #4, #6, #7, #10, #13, #14).
- 3 wording/qualifier fixes (#5, #8, #17).
- 1 new source plus its formulation note (#1, #2).
- 0 level changes on existing rules apart from these.
- 0 medicines converted to no-uk-product.

## 2. Coordinator points: confirmed

- **Otilonium, pinaverium, chlordiazepoxide-clidinium: no-uk-product confirmed.**
  - emc search returns "No search results" for otilonium, pinaverium and clidinium.
  - The MHRA products search index (the one products.mhra.gov.uk uses) returns 0 documents for each.
  - The clinic's emc link for the combination (emc 1728) is a different product and was correctly not used.
  - All three files follow the SCHEMA no-uk-product form: availability note, every section not-available, `rules: []`, no `src` on formulations.
- **Hyoscine syrup.**
  - There is no UK oral liquid. emc lists 10 hyoscine butylbromide products: tablets and injection only.
  - The MHRA index has only the refusal PAR for a 5 mg/5 ml solution (#1).
  - All dosing, paediatric and administration items are scoped to `hyoscine-butylbromide-tab`. The IBS-only under-12 age rule and the sucrose rule are also tablet-scoped.
  - The syrup gets contraindications, cautions, interactions, pregnancy and breastfeeding from the tablet SmPCs. This is the same active ingredient by the same route, and the note says so.
- **Dicycloverine 50 mg.**
  - It is not a UK strength. UK tablets are 10 mg and 20 mg only.
  - The formulation note states this, and the doses come from the 10/20 mg SmPCs.
  - The oral solution (emc 8946) was correctly not used.
- **Simeticone tablet.**
  - The only UK simeticone-only SPC in the MHRA index is the 100 mg capsule (emc 4929). Other simeticone products are combinations, such as emc 13858, which is calcium/magnesium carbonate + simeticone and was correctly not used.
  - The dosing item says there is no UK dose for the clinic tablet strengths.
- **Loperamide.**
  - The MHRA DSU cardiac advice is present: cautions, monitoring, counselling and the drug-abuse / opioid-dependence condition rules.
  - The capsule age limits are split by product: OTC capsule contraindicated under 12 with a 12 mg/day maximum; POM capsule contraindicated under 9, with a 9-12 years dose rule and a 16 mg/day maximum.
- **Loperamide outside group:opioid: reasonable.**
  - The SmPC calls it "an opioid with low bioavailability and limited potential to penetrate the blood brain barrier at therapeutic doses".
  - Its QT/QRS effects are stated for overdose only, so it is also correctly not in qt-prolonging (QT policy).
  - Rules that name loperamide do exist: amoxicillin, co-amoxiclav, ciprofloxacin, clarithromycin and desmopressin (all `other: "loperamide"`), plus ispaghula-senna (peristalsis inhibitor, backed by the loperamide SmPC mechanism quote).
  - Loperamide's own `group:opioid` rule (info, "similar pharmacological properties") is present.
- **Ispaghula-senna via Manevac.** It contains the clinic's two named actives (ispaghula husk, senna) plus ispaghula seed. It is licensed and current (emc, updated Aug 2026; MHRA PL 60682/0018-0019). The note has been made explicit (#17).
- **Racecadotril via MHRA SPCs.** PL 39418/0001 (10 mg) and /0002 (30 mg) are current in the MHRA index; the text was revised 03/06/2024. Re-read in full: the 4.3 rules and the 4.4 "must not" rules are correctly contraindicated, and the ACE inhibitor / ARB / gliptin rules are correctly avoid.

## 3. Problems not fixed (for the integrator or other batches)

1. **Loperamide 4.5 interactions are not mapped to master-list medicines (kept as text only).** The SmPC names quinidine, ritonavir, itraconazole, ketoconazole and gemfibrozil, none of which is in the master list. Mapping these to group:cyp3a4-inhibitor (for example clarithromycin or fluconazole) would extrapolate beyond the source. The clarithromycin SmPC already carries its own loperamide rule.
2. **Senna, ispaghula-senna and bisacodyl hypokalaemia interaction.**
   - Cardiac glycosides and antiarrhythmics are not in the master list.
   - The senna/ispaghula-senna QT rule (`group:qt-prolonging`, caution) carries `effect: qt-prolongation`, although the mechanism is laxative-induced hypokalaemia; I kept it. The integrator may prefer no effect tag, so senna is not counted as a QT contributor.
3. **Simeticone–levothyroxine.** The only UK statement is in an infant suspension SmPC. The rule now states that population, but it still fires for adults (info level). No age limit was added, because the SmPC gives no age boundary for "infants".
4. **Hyoscine group mapping.** "Beta-adrenergic agents" is mapped to group:beta2-agonist, and "tri- and tetracyclic antidepressants" to group:tricyclic-antidepressant (amitriptyline only).
   - Mirtazapine is not called tetracyclic in any UK source read, so it was not added.
   - Antipsychotics, quinidine, amantadine and disopyramide have no master-list members.
5. **Orphenadrine-paracetamol** (another batch) is described as an anticholinergic but is no-uk-product. It is correctly outside group:anticholinergic and has no rules.
6. **Other batches' errors.** The global schema check shows 73 errors in other batches' files. None are in X/Y files.

## 4. Per-medicine assessment

- **Hyoscine butylbromide: good.**
  - The 4.3 list is complete and contraindicated. The 4.4 cautions are expressed as conditions.
  - SmPC/BUMPS/SPS conflicts are kept separate.
  - Syrup handling is safe: no tablet doses are applied to it, and the MHRA refusal is now documented.
  - One restriction quote was incomplete (fixed).
- **Dicycloverine: good.**
  - Faithful to three UK SmPCs. There are no 4.3 items beyond hypersensitivity, so glaucoma and prostatic hypertrophy are correctly caution only.
  - The SPS "not recommended" for breastfeeding is kept separate.
  - The 50 mg gap is clearly noted. One rule had unquoted consequence text (fixed).
- **Mebeverine: good.** Faithful to the 200 mg MR capsule SmPC. The under-18 avoid rule and the SmPC/SPS and SmPC/BUMPS conflicts are handled correctly. Leaving it out of the anticholinergic group is supported by 5.1. No changes.
- **Otilonium, pinaverium, chlordiazepoxide-clidinium: correct no-uk-product entries.** No changes.
- **Simeticone: acceptable.** The capsule SmPC is a reasonable UK proxy and is clearly labelled. The levothyroxine rule needed its population qualifier (fixed).
- **Lactulose: good.** All 4.3 rules are present, and the excipient (galactose/fructose) rules are avoid (4.4). One unquoted phrase (fixed).
- **Macrogol: good.**
  - The adult and paediatric sachets are properly separated (age, cardiac and renal impaction rules).
  - The MHRA thickener DSU is included.
  - Two unquoted phrases (fixed).
- **Senna: good.**
  - The two pack licences (12-plus vs adult-only) are correctly split.
  - The SmPC contraindications for pregnancy/lactation and the BUMPS/SPS views are kept separate.
  - Fixes: the corticosteroid over-firing and the missing "under medical guidance" qualifier on the 30 mg maximum.
- **Bisacodyl: good after fixes.**
  - The tablet packs and the suppository are correctly scoped.
  - The 4.3 suppository items are contraindicated.
  - Fixes: the mixed SmPC/SPS breastfeeding rule, the invented "avoid excessive doses" action, and the corticosteroid over-firing.
- **Ispaghula-senna: good, with a product-match caveat.** The 4.3 list is fully expressed and the interactions are well mapped. The composition match to the clinic product needs local confirmation (#17).
- **Loperamide: good after fixes.**
  - MHRA cardiac advice and the product-specific age and maximum-dose limits are correct.
  - Fixes: the dysentery wording and the pregnancy rule, both of which merged two sources.
- **Racecadotril: good.**
  - Faithful to both MHRA SPCs, with correct weight-band dosing and `calc` (1.5 mg/kg per dose).
  - DRESS, angioedema and bradykinin interaction rules are present.
  - No changes.
