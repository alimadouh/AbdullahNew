# Audit: batches Z and AA

Independent second check of the clinic-expansion batches Z and AA, 2026-10-17. Batch Z and batch AA were checked in parallel. Each section below has its own change table, unfixed problems and per-medicine assessment.

**Medicines converted to no-uk-product:** carminative (Z). potassium-sodium-hydrogen-citrate (Z) stays no-uk-product; the MHRA products index was rechecked.

## Batch Z (aluminium-magnesium-hydroxide, alginate-antacid, oral-rehydration-salts, carminative, sodium-bicarbonate-potassium-citrate, potassium-sodium-hydrogen-citrate)

Independent second check, 2026-10-17. I re-read in full sections 2 and 4.1 to 4.9 of all nine remaining batch Z SmPCs: emc-13356, emc-5550, emc-5609, emc-113, emc-5329, emc-4856, emc-2771, emc-13698 and emc-4922. I also re-checked the clinic map rows for these six medicines.

After the edits:
- all 407 quotes in the six medicine files, the Z groups and the new `vitamin` group are FOUND (lib/text.mjs `quoteFound`, the same test as `--check`);
- `validate()` reports 0 schema errors in the whole KB;
- a display-text scan of label, strengths, note, t, tag, concern, consequence, action, className, name and section notes finds no brand, manufacturer or emc id.

### 1. Changes

| File | Item / rule id | Before | After | Reason | Supporting quote |
|---|---|---|---|---|---|
| carminative.json | whole file | Filled from the UK gripe water SmPC emc-3611 (dill seed oil + sodium bicarbonate): 10 rules and all sections | `availability: no-uk-product`; every section not-available; `rules: []`; formulation has no `src`; strengths "As on the clinic product label"; "gripe water" and "dill seed oil" removed from searchTerms | **Wrong product.** The clinic product ("Carminative pediatric mixture") has no stated actives, and the clinic map links only the same gripe water guess. A matching active cannot be shown, and a doctor would read its sodium bicarbonate, age and renal rules as applying. | Not applicable (the rule is that no matching UK source exists) |
| potassium-sodium-hydrogen-citrate.json | `availability.note` | "MHRA could not be checked" | Records the MHRA recheck. The products search index was searched by text and with an exact substance-name filter: no product. The emc search for "potassium sodium hydrogen citrate" returns only oral rehydration sachets (disodium hydrogen citrate) | Coordinator asked for a single MHRA retry | Not applicable |
| sodium-bicarbonate-potassium-citrate.json | formulation `note` | Covers potassium citrate only; sodium bicarbonate "not covered" | Also says that it does NOT cover the sodium bicarbonate (sodium load) or the citric acid. It says the UK products' doses, excipients and sodium statements do not apply to the clinic product. It tells the user to use the clinic label for the dose. | Honest scope for a partial match | emc-13698 "Potassium Citrate 3.0 g"; emc-4922 "Potassium Citrate 1.5g/5ml." |
| sodium-bicarbonate-potassium-citrate.json | cautions item "Sodium: … essentially sodium-free" | Present | **Removed** | **Misleading.** It is a UK potassium-citrate-only statement, applied to a product that contains sodium bicarbonate. | emc-13698 "less than 1mmol sodium (23 mg) per sachet" (UK product only) |
| sodium-bicarbonate-potassium-citrate.json | `dosing` (2 items) | 3 g sachet three times daily for 2 days; 10 ml three times daily | `not-stated`, with a note: the UK products have different contents, so use the clinic label | A dose of a different (single-active) product does not apply to the clinic combination | Not applicable |
| sodium-bicarbonate-potassium-citrate.json | `paediatric` items | Doses (5 ml for ages 1–6, adult dose over 6) | Age statements only, each labelled as applying to the UK potassium citrate product, with no doses | Same reason | emc-13698 "Not recommended for children under six years of age."; emc-4922 "Children 1 - 6 years: 5ml." |
| sodium-bicarbonate-potassium-citrate.json | rules `condition:pku`, `condition:sugar-intolerance`, `condition:diabetes` + cautions "Excipients" item | Present (caution / avoid / info) | **Removed** | These come from the UK products' excipients (aspartame, sucrose). The clinic product's excipients are unknown. | emc-13698 aspartame; emc-4922 sucrose 1.1 g/5 ml |
| sodium-bicarbonate-potassium-citrate.json | cautions "Potassium content", administration, counselling | Used the UK 3 g sachet / 200 ml / 6-sachet course as if it were the clinic product | Rewritten and scoped to the UK potassium citrate products. The 27.8 mmol K+ figure is kept only as the UK sachet value, with "check the clinic product's potassium content". | Honest scope | emc-13698 "Hyperkalaemia may occur on prolonged high dosage."; "Intended for short term treatment." |
| sodium-bicarbonate-potassium-citrate.json | rules `age:under-6`, `condition:hyperkalaemia`, `condition:ventricular-arrhythmia`, `condition:addisons` | Concern/action did not say that these are potassium citrate product statements | Concern/action now name the UK potassium citrate SmPC and say it covers the potassium citrate content. Levels unchanged. | Scope | emc-4922 "Contraindicated in hyperkalaemia, renal dysfunction, ventricular arrhythmics and Addison's Disease." |
| oral-rehydration-salts.json | `ors-sachet` strengths + note | UK composition shown as if it were the clinic sachet's | Strengths are labelled "UK product". A note says the clinic lists trisodium citrate while the UK sachet uses disodium hydrogen citrate, so the content may differ. | Different citrate salt (minor, but must be visible) | emc-2771 "Glucose Sodium chloride Potassium chloride Disodium hydrogen citrate 3.56g 0.47g 0.30g 0.53g" |
| oral-rehydration-salts.json | dosing "1-2 sachets…", paediatric "one sachet…", cautions "Reconstitute only…" and "Sodium content" | Applied to both formulations, including the ready-to-drink solution | `formulations: ["ors-sachet"]` | Sachet-specific statements must not apply to the ready-made solution | emc-2771 "Children: One sachet dissolved in 200ml of water after every loose motion." |
| oral-rehydration-salts.json | rule `condition:intestinal-obstruction` | Action "Do not use (stated in SmPC 4.3 as a condition where treatment is inappropriate)" | Action adds that the SmPC otherwise lists no known contraindications. Level kept at `contraindicated` (the statement is in 4.3). | Faithfulness | emc-2771 "There are no known contraindications to Dioralyte." / "treatment with Dioralyte will be inappropriate e.g. intestinal obstruction requiring surgical intervention." |
| aluminium-magnesium-hydroxide.json | NEW rule `interaction:vitamins` (avoid, reduced-absorption, `other: group:vitamin`) + interactions item updated | None | Antacids inhibit vitamin absorption and should not be taken at the same time. The simeticone-containing SmPC also lists vitamins (stagger doses by ≥ 2 h). | **Missing interaction** from SmPC 4.5 of both products | emc-13356 "Antacids inhibit the absorption of tetracyclines and vitamins and should not be taken concomitantly."; emc-5550 "tetracyclines, and vitamins" |
| aluminium-magnesium-hydroxide.json | rule `interaction:clindamycin` | No `otherFormulations` | `otherFormulations: ["clindamycin-cap"]` | **Over-firing.** The exact id would hit clindamycin vaginal cream and ovules, because the engine still applies exact-id rules to local products. | Not applicable |
| aluminium-magnesium-hydroxide.json | NEW rule `breastfeeding:any` (info) | No breastfeeding rule | SPS: can be used; no infant monitoring usually needed | Brief: breastfeeding statements must be rules | sps-heartburn-breastfeeding "Aluminium hydroxide can be used during breastfeeding." |
| alginate-antacid.json | NEW rules `pregnancy:any` (info) and `breastfeeding:any` (info) | None | Can be used if clinically needed (SmPCs); SPS: alginates can be used | Brief: pregnancy/breastfeeding statements must be rules | emc-5609 "the medicinal product may be used during pregnancy, if clinically needed."; emc-113 "Gaviscon can be used during breast-feeding." |
| sources/Z.json | `groups` | — | NEW group `vitamin`, with members sourced from their own SmPC 5.1: ascorbic-acid, folic-acid, vitamin-b-complex, colecalciferol, calcium-carbonate-colecalciferol. The source ids belong to other batches. | Needed by the new rule. Membership is sourced. | emc-101277 "Pharmacotherapeutic group: Vitamins"; emc-14604 "Folic acid is a member of the vitamin B group"; mhra-pl20416-0410-spc "ATC code of Vitamin B complex is A11EA"; emc-6861 "Pharmacotherapeutic group: Vitamin D and analogues"; emc-2766 "Pharmacotherapeutic group: Calcium, combination with vitamin D" |
| sources/Z.json | `sources`, `conditions`, `notes` | emc-3611 source; conditions `alkalosis`, `hypochloraemia` | emc-3611 and these two conditions removed (grep confirmed that nothing else uses them; `hypocalcaemia` is kept for denosumab); audit summary appended to notes | Follows the carminative conversion | Not applicable |

**Checked and left unchanged (correct):**
- **Aluminium/magnesium hydroxide:**
  - 4.3 kidney failure, severe debility and hypophosphataemia are `contraindicated`.
  - Under-12 `avoid` comes from one SmPC (4.2 "should not be used"), and the conflicting child dose in the simeticone SmPC is shown.
  - Tetracyclines are `avoid`.
  - The other named absorption interactions are `caution` with ≥ 2 h (4 h for fluoroquinolones).
  - Glucocorticoids are mapped to oral dexamethasone and prednisolone. Ear and eye combinations are excluded by the engine's local-route check.
  - HFI is `avoid`.
  - Salicylate and citrate rules are `info`.
- **Alginate antacid:**
  - Double-strength suspension renal 4.3 is `contraindicated`, scoped to that formulation.
  - Sodium and calcium figures were checked against all four SmPCs.
  - PKU: `avoid` for standard tablets ("should not be given"), `caution` for double-strength ("may be harmful").
  - The 2-hour separation rules are `caution` ("should be considered").
- **Oral rehydration salts:** 4.4 "not for self-treatment" conditions are `caution`; the under-2 rule is `caution`; pregnancy and breastfeeding are `caution` ("medical supervision is recommended").
- **Group memberships:**
  - antacid: aluminium-magnesium-hydroxide and alginate-antacid;
  - polyvalent-cation: both;
  - magnesium-preparation: aluminium-magnesium-hydroxide;
  - calcium-preparation: alginate-antacid;
  - potassium-supplement: sodium-bicarbonate-potassium-citrate.
  
  Each has a composition quote.

### 2. Problems not fixed here

1. **Sodium bicarbonate/potassium citrate/citric acid is a partial match.** I kept it rather than converting it.
   - The UK potassium citrate SmPCs describe one of the clinic product's stated actives, with the same salt and route. The potassium and urine-alkalinising content rules (contraindications, hyperkalaemia interactions, the nitrofurantoin and tetracycline effects) therefore apply.
   - Nothing covers the sodium bicarbonate. No UK SmPC was found for sodium bicarbonate as a urinary alkaliniser in this combination.
   - **The integrator should confirm the clinic product's real composition.** If it contains no potassium citrate, this entry must become no-uk-product.
2. **Aluminium/magnesium hydroxide strength.** The clinic product (405 mg + 100 mg per 5 ml) has a different Al:Mg ratio from both UK products (220 + 195 mg and 175 + 200 mg per 5 ml). The formulation note says that UK volumes do not apply. Rules about the actives stand.
3. **Ready-to-drink oral rehydration solution.** Its content still comes from the UK sachet SmPC. The note says the composition may differ. No UK SmPC exists for a ready-made solution.
4. **Not mapped (no master-list medicine):**
   - aluminium/magnesium hydroxide 4.5: H2 antagonists, bisphosphonates, chloroquine, chlorpromazine/phenothiazines, digoxin, ketoconazole, metoprolol, isoniazid, rifampicin, penicillamine, quinidine, integrase inhibitors, polystyrene sulphonate;
   - alginate 4.5: H2-antihistamines, digoxin, ketoconazole, neuroleptics, penicillamine, chloroquine, bisphosphonates, estramustine.
   - Chloroquine was not mapped to hydroxychloroquine, because they are different medicines.
5. **For other batches:** the iron group includes iron-polymaltose-b-complex. The alginate and aluminium "iron salts" rules therefore reach a polymaltose complex. This group membership is owned by another batch; please confirm it is intended.

### 3. Per-medicine assessment

- **Aluminium hydroxide/magnesium hydroxide.** Sound after the fixes. Different strength and ratio from the clinic product, and the note says so. The interaction set is now complete for master-list medicines.
- **Sodium alginate/sodium bicarbonate/calcium carbonate.** Good. Four SmPCs are correctly split by formulation. The only gap was the missing pregnancy and breastfeeding rules, now added.
- **Oral rehydration salts.** Faithful to the single UK SmPC. Sachet-specific content is now scoped. The ready-made solution and the citrate salt differ from the UK product, which is disclosed.
- **Carminative (paediatric).** Converted to no-uk-product. The clinic actives are unknown, and the previous content was a guess.
- **Sodium bicarbonate/potassium citrate/citric acid.** A partial match, now honestly scoped to the potassium citrate content. Product-specific doses, excipients and the misleading "sodium-free" statement were removed. The clinic composition needs confirming.
- **Potassium sodium hydrogen citrate.** no-uk-product confirmed on emc and on the MHRA products index.


## Batch AA (cefixime, cefalexin, cefuroxime, azithromycin, doxycycline, nitrofurantoin)

Independent second check, 2026-10-17. I re-read sections 4.1 to 4.9 in full for all nine batch AA SmPCs: emc-15047, emc-9140, emc-9145, emc-3810, emc-1073, emc-3006, emc-13082, emc-13236 and emc-428. I also re-read the four BUMPS leaflets, the four SPS pages (QT, macrolides/statins, and the macrolide, tetracycline and nitrofurantoin breastfeeding pages) and the three MHRA DSUs. The clinic map rows for these six medicines were re-checked.

After the edits:
- all 598 quotes in the six medicine files and the AA groups are FOUND (lib/text.mjs `quoteFound`, the same test as `--check`);
- `validate()` gives 0 errors for AA. The 26 errors left in the whole KB belong to other batches (diclofenac, bisacodyl, senna);
- a display-text scan finds no brand, manufacturer or emc id;
- engine scenarios were run on a scratch build (not written to `public/`):
  - nitrofurantoin at eGFR 50: no flag;
  - nitrofurantoin at eGFR 40: contraindicated plus the 30 to 44 exception;
  - cefixime suspension at age 4: new info rule;
  - cefixime with an allergy to cefalexin: only the contraindicated cephalosporin rule;
  - cefuroxime with a penicillin SJS history: contraindicated;
  - azithromycin with methotrexate: hepatotoxic rule fires.

### 1. Changes

| File | Item / rule id | Before | After | Reason | Supporting quote |
|---|---|---|---|---|---|
| nitrofurantoin.json | rule `nitrofurantoin:condition:renal-impairment` (contraindicated) | Blanket contraindication on condition `renal-impairment` | **Replaced** by `nitrofurantoin:condition:raised-serum-creatinine` (contraindicated, one SmPC). The action points to the eGFR rule. | **False contraindication.** The engine links `renal-impairment` to GFR < 60, so nitrofurantoin was "contraindicated" at eGFR 45–59. Both SmPC 4.3 sections qualify renal dysfunction with eGFR < 45, and that is already a renal rule. The separate 4.3 item "increased serum creatinine" had no rule. | emc-428 4.3: "Patients suffering from renal dysfunction with an eGFR below 45 ml/minute."; emc-13236 4.3: "for patients with renal impairment (eGFR below 45 ml/min) or with an increased serum creatinine" |
| nitrofurantoin.json | rules `renal:egfr-under-45`, `renal:egfr-30-44-exception` (concern) | "eGFR less than 45" / "eGFR 30 to 44" with no unit | Unit added: mL/min/1.73 m² (MHRA), with a note that both SmPCs print "ml/min". Thresholds unchanged: eGFR, max 45 exclusive; 30 ≤ eGFR < 45. | Unit wording (coordinator note) | mhra-dsu-nitrofurantoin-egfr-2014: "eGFR) of less than 45 ml/min/1.73m2"; emc-428: "eGFR between 30-44 ml/min" |
| nitrofurantoin.json | contraindications item 1 | "eGFR below 45 ml/min" | Says that both SmPCs print ml/min and MHRA gives ml/min/1.73 m² | Unit wording | as above |
| nitrofurantoin.json | formulation note | Did not mention the clinic product | Adds "The clinic product's crystal form is not stated" (both UK SmPCs are for macrocrystalline capsules) | Right-product transparency | emc-13236 "100 mg of nitrofurantoin (in macrocrystalline form)" |
| nitrofurantoin.json, azithromycin.json, sources/AA.json | group `hepatotoxic` | Neither was a member; AA notes said the group had no members | Both added. The members entry in AA.json is sourced, and the id is added to `groups` in each file, as batch E did for clarithromycin. | **Group consistency.** Batch E admits clarithromycin, ciprofloxacin and co-amoxiclav on SmPC reports of fatal hepatic failure or necrosis. Azithromycin and nitrofurantoin have the same kind of 4.4 "Hepatotoxicity" warning. The methotrexate (avoid), duloxetine and hydroxychloroquine hepatotoxic rules now reach them. | emc-1073: "Cases of fulminant hepatitis potentially leading to life-threatening liver failure have been reported with azithromycin."; emc-428: "…chronic active hepatitis, and hepatic necrosis, occur rarely. Fatalities have been reported." |
| cefuroxime.json | rule `cefuroxime:allergy:beta-lactam-severe` | `reactions` included `severe-cutaneous` with no explanation | Kept, and the action now says: the SmPC's example is anaphylaxis; counting SJS/TEN/DRESS to another beta-lactam as "severe hypersensitivity" is the tool's interpretation, not SmPC wording | **Honesty.** Removing it would leave a penicillin SJS/TEN history with no rule at all, because the non-severe caution rule covers only `immediate` and `delayed`. | emc-3810 4.3: "History of severe hypersensitivity (e.g. anaphylactic reaction) to any other type of betalactam antibacterial agent (penicillins, monobactams and carbapenems)." |
| cefuroxime.json | interactions item 0 | "Medicines that reduce gastric acidity (e.g. PPIs, antacids)" | "(this tool applies this to PPIs and antacids)" | The SmPC names no examples. The mapping is ours. | emc-3810: "Drugs which reduce gastric acidity may result in a lower bioavailability of cefuroxime axetil…" |
| cefixime.json, cefalexin.json | rules `…:allergy:penicillin` (caution) | `allergen: [group:penicillin, group:beta-lactam]` | `allergen: [group:penicillin]` | `group:beta-lactam` also contains the cephalosporins. An allergy to another cephalosporin therefore also raised a row labelled "Penicillin hypersensitivity: caution", next to the correct contraindication. The SmPCs name penicillins only. A recorded "beta-lactam" allergy still matches through the group's penicillin members. | emc-15047: "…with caution to patients with a history of hypersensitivity to penicillin…"; emc-9140: "Cefalexin should be given cautiously to penicillin-sensitive patients." |
| cefixime.json | NEW rule `cefixime:age:susp-under-10` (info, suspension, 0.5 to < 10 years) | None. The suspension had no flag for children, its main users. | Info: the only UK SmPC (200 mg tablets) does not recommend the tablets under 10 years and gives no dose; no UK suspension SmPC exists; the dose cannot be checked | Prevents a silent result for a paediatric suspension with no UK dosing source (coordinator: "check dosing isn't misapplied") | emc-15047: "Suprax Tablets 200 mg are not recommended for use in children under 10 years old." |
| cefixime.json | rule `cefixime:renal:crcl-under-20` (action) | "Do not exceed 200 mg once daily." | Adds: "The clinic 400 mg capsule cannot give a dose at or under this limit." | Prevents misapplying the dose to the capsule (arithmetic, no new fact) | emc-15047: "…a dose of 200 mg once daily should not be exceeded." |
| cefixime.json | dosing item 0 | Adult dose shown without its source form | Prefixed "UK tablet SmPC (applied to cefixime in general)" | Scope of the substitute SmPC | as quoted in the item |
| doxycycline.json | adverseSerious item 0 | Said SJS/TEN/DRESS and "stop immediately" with only an anaphylaxis quote | Two quotes added (the SCARs list; stop immediately) | Unsupported statement | emc-13082: "If serious skin reactions occur, doxycycline should be discontinued immediately" |
| doxycycline.json | NEW paediatric item (Rocky Mountain spotted fever) | Child dose for this infection missing | Under 45 kg 2.2 mg/kg twice a day; 45 kg or more, adult dose; minimum course 5–7 days | Completeness (SmPC 4.2) | emc-13082: "Children: weighing less than 45 kg: 2.2 mg/kg body weight given twice a day." |
| sources/AA.json | `groups`, `conditions`, `notes` | — | Added the `hepatotoxic` members, the new condition `raised-serum-creatinine` and an audit summary in notes | Needed by the changes above | — |

**Checked and left unchanged (correct):**
- **Cefixime:**
  - CrCl < 20 rule (`max: 20`, exclusive; "less than 20 ml/min");
  - pregnancy and breastfeeding `avoid` ("should not be used … unless considered essential");
  - BUMPS cephalosporin leaflet (names cefixime);
  - warfarin `caution`;
  - capsule under-10 `avoid` (it is labelled as an inference from the tablet SmPC).
- **Cefalexin:**
  - cephalosporin allergy `contraindicated`;
  - markedly impaired renal function → `severe-renal-impairment`, `dose`, with dialysis ≤ 500 mg/day;
  - loop diuretics, other cephalosporins and metformin `info` (no action stated);
  - suspension sucrose `avoid`.
  - Both SmPCs match the clinic capsule (250 mg) and syrup (250 mg/5 mL).
- **Cefuroxime:**
  - renal bands are `CrCl` as the SmPC table says ("Creatinine clearance … ml/min/1.73 m2"): 10–29 = `min 10, max 30`; < 10 = `max 10`;
  - warfarin, PPI and antacid rules `info` (no action stated);
  - paediatric `calc` (10 mg/kg max 125 mg; 15 mg/kg max 250 mg; otitis media from 2 years stated in the text);
  - pregnancy and breastfeeding `caution`.
- **Azithromycin:**
  - `qt-prolonging` membership is supported by both its own SmPC 4.4 and SPS. SPS lists macrolides and says they raise QTc by < 5 ms; it does not say they do not prolong QT;
  - SmPC `caution` and SPS `avoid` QT/electrolyte rules are kept separate;
  - hydroxychloroquine `caution` (MHRA "carefully consider");
  - statins `caution`, with SPS "can be given concomitantly";
  - warfarin `monitor`;
  - GFR < 10 `caution` (measure "GFR", as written);
  - Child-Pugh C `caution`;
  - suspension paediatric calcs and maxima (500 mg/day; 1500 mg single-dose otitis media);
  - antacids: no rule. The current SmPC lists no clinically relevant change.
- **Doxycycline:**
  - SmPC 4.3 pregnancy and breastfeeding `contraindicated`, kept alongside the BUMPS and SPS rules (the conflict is shown);
  - under 8 years `avoid` (4.2 "should not be used");
  - 8 to < 12 years `caution`;
  - penicillin `avoid` ("advisable to avoid");
  - warfarin `dose`;
  - carbamazepine `dose`.
  - **Separation wording:** "Separate the doses as much as possible (no interval in hours is given by the SmPC)". This is exact; the SmPC says only "Dosages should be maximally separated".
  - **Tetracycline group membership** is sourced from SmPC 5.1 ("Pharmacotherapeutic Group: Tetracyclines"). It matches the antacid, iron, calcium, magnesium, amoxicillin, methotrexate and glimepiride rules that use `group:tetracycline`.
  - **`doxycycline:interaction:hepatotoxic` (caution)** is faithful to "those receiving potentially hepatotoxic drugs". The group now has 7 sourced members.
- **Nitrofurantoin:**
  - G6PD, acute porphyria, under 3 months, at term (labour/delivery, with the qualifier in the concern) and the previous lung/liver reaction rules are `contraindicated` (4.3);
  - quinolones `avoid` ("not recommended");
  - breastfeeding G6PD-infant `avoid`, with the qualifier in the concern.

### 2. Problems not fixed here

1. **Cefixime has no UK SmPC for the clinic forms.** The only UK product is the 200 mg film-coated tablet.
   - The clinic forms are a 100 mg/5 mL suspension and a 400 mg capsule.
   - All content comes from the tablet SmPC, and this is disclosed in both formulation notes.
   - There is no paediatric suspension dose from any UK source. The new info rule makes this visible.
2. **Doxycycline is not added to `hepatotoxic`.** Its 4.8 list includes "Hepatic failure, hepatitis, hepatotoxicity", but 4.4 says only "Abnormal hepatic function has been reported rarely".
   - Adding it would make methotrexate + doxycycline an `avoid`.
   - Left for the integrator. There is no written membership criterion for `hepatotoxic` across batches, and one should be set.
3. **The new condition `raised-serum-creatinine` is not linked to anything.** Integrator: consider adding it to `tool.json` `conditionImplies` (for example, implying `renal-impairment`) if the UI should prompt for eGFR.
4. **"Medicinal products that inhibit peristalsis should not be given" (cefuroxime and azithromycin 4.4).** This applies only once C. difficile colitis is present. There is no condition id for it, and a loperamide rule would fire on every co-prescription, so it was not encoded. It is shown in the cautions text.
5. **Not mapped (no master-list medicine):**
   - probenecid;
   - typhoid vaccine;
   - magnesium trisilicate (nitrofurantoin);
   - ergot derivatives;
   - digoxin, colchicine, ciclosporin and dabigatran (azithromycin);
   - isotretinoin/retinoids, methoxyflurane, barbiturates and phenytoin (doxycycline);
   - aminoglycosides (cefalexin): only topical gentamicin products exist, and the local-route check would ignore them anyway.
6. **Urinary alkalinisers (nitrofurantoin).** The rule targets the sodium bicarbonate/potassium citrate product. `potassium-sodium-hydrogen-citrate` is also an alkaliniser, but it has no UK source to prove that, so no rule targets it.
7. **SPS cephalosporin breastfeeding page.** It returns 404 (re-checked). Cephalosporin breastfeeding rules therefore rest on the SmPCs only.

### 3. Per-medicine assessment

- **Cefixime.** Same active ingredient and route, but a different form and strength. The tablet SmPC is used and this is disclosed. The renal limit and the missing child dosing are now explicit. Usable with care for the capsule. For the suspension, it provides allergy, renal, interaction and pregnancy rules only, not a paediatric dose.
- **Cefalexin.** Good. Both UK SmPCs match the clinic forms exactly. Allergy labelling is cleaned up.
- **Cefuroxime.** Good. It matches the clinic 250 mg tablet. The cross-allergy reaction filter is now honest. Renal bands and the paediatric calcs are correct.
- **Azithromycin.** Good and thorough. Capsule and suspension SmPCs match the clinic forms. QT handling follows both the SmPC and SPS. The hepatotoxic membership has been added for consistency.
- **Doxycycline.** Good. The 100 mg capsule SmPC matches the clinic capsule. The SmPC and UKTIS/SPS conflicts on pregnancy and breastfeeding are clearly separated. Two small completeness fixes.
- **Nitrofurantoin.** Good after the fix. The false contraindication at eGFR 45–59 was the most serious problem in this batch. Renal thresholds, units and the 30–44 exception now match MHRA and both SmPCs.
