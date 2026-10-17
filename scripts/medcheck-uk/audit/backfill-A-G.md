# Audit: back-fill of the original 34 medicines (batches A to G)

Independent second check, 2026-10-17.

**Scope**
- Only the changes made today (git diff against HEAD) to the 34 original medicine files and `sources/A.json` to `sources/G.json`.
- About 171 new interaction rules, one replaced rule (levothyroxine/metformin to levothyroxine/antidiabetic) and new group memberships (cns-depressant, nephrotoxic, hepatotoxic, qt-prolonging, cyp2d6-inhibitor).

**Method**
- Every new rule was listed with its quotes (scratch script comparing HEAD and working copy).
- All new quotes were re-checked with the `quoteFound` function used by `verify.mjs`: all FOUND before edits; every quote added in this audit was checked with `fetchtext.mjs --check`.
- SmPC section 4.5 (and 4.3 where relevant) was re-read in full for each source behind a new rule.
- Group members were listed with their routes to check over-firing (local products, dose-specific aspirin, corticosteroid group content).
- `validate()` was run for every edited file.

## 1. Changes

| File | Item / rule | Before | After | Reason | Quote |
|---|---|---|---|---|---|
| ibuprofen.json | `ibuprofen:allergy:nsaid-susp`, `ibuprofen:allergy:nsaid-tab` | allergen `group:nsaid` | allergen `group:nsaid`, `aspirin` | 4.3 names aspirin; aspirin is not in group:nsaid, so an aspirin allergy did not trigger the rule | "after taking ibuprofen, aspirin or other non-steroidal anti-inflammatory drugs (NSAIDs)" (emc-4560); "after taking ibuprofen, aspirin or other NSAIDs" (emc-6713) |
| naproxen.json | `naproxen:allergy:nsaid` | allergen `group:nsaid` | allergen `group:nsaid`, `aspirin` | same | "should not be given to patients in whom aspirin or other non-steroidal anti-inflammatory/analgesic drugs induce the syndrome of asthma..." (emc-13238) |
| ibuprofen.json | `ibuprofen:interaction:cyp2c9-inhibitor` (info) | no otherExcept | `otherExcept: ["fluconazole"]` | fluconazole has its own, stronger rule (`ibuprofen:interaction:fluconazole`, dose); the info rule duplicated it with weaker advice | "Reduction of the ibuprofen dose should be considered when potent CYP2C9 inhibitors are administered concomitantly, particularly when high-dose ibuprofen is administered with either voriconazole or fluconazole." |
| naproxen.json | `naproxen:interaction:aspirin` | avoid, any aspirin | avoid, `otherFormulations: ["aspirin-analgesic"]`; wording now "two or more NSAIDs" | the "avoid" sentence sits under "Other analgesics"; low-dose aspirin gets separate advice in the same section | "Other analgesics including cyclooxygenase-2 selective inhibitors: Avoid concomitant use of two or more NSAIDs (including aspirin)" |
| naproxen.json | `naproxen:interaction:aspirin-low-dose` (new) | none | monitor, `otherFormulations: ["aspirin-75-tab","aspirin-75-gr"]` | low-dose aspirin advice from the same 4.5: possible block of antiplatelet effect (relevance unknown) and "observe for overdosage"; bleeding stays with the existing antiplatelet rule | "concomitant naproxen usage for more than one day consecutively may inhibit the effect of low-dose acetylsalicylic acid on platelet activity..."; "patients simultaneously receiving hydantoins, anticoagulants, other NSAIDs, aspirin or a highly protein-bound sulfonamide should be observed for signs of overdosage of these drugs" |
| lisinopril.json | `lisinopril:interaction:aspirin-anti-inflammatory` (new) | missing | caution, `other: aspirin`, `otherFormulations: ["aspirin-analgesic"]`, effect nephrotoxicity | back-fill missed aspirin; SmPC applies the NSAID advice to aspirin 3 g/day or more and allows cardiologic doses | "Non-steroidal anti-inflammatory medicinal products (NSAIDs) including acetylsalicylic acid ≥ 3 g/day"; "The combination should be administered with caution, especially in the elderly."; "Zestril may be used concomitantly with acetylsalicylic acid (at cardiologic doses)" |

| sertraline.json + sources/D.json | groups: `qt-prolonging` | member → removed (group array and D.json membership; D notes rewritten). `cyp2d6-inhibitor` kept | QT policy. SPS says there is no QTc effect at licensed doses. The SmPC thorough QTc study used 400 mg/day, twice the maximum dose | SPS: "Fluoxetine, paroxetine and sertraline have no effect on QTc at licensed doses"; emc-1070: "treated with 400 mg/day, twice the maximum recommended daily dose" |
| metformin.json | `metformin:condition:metabolic-acidosis` (new) | missing → contraindicated | SmPC 4.3; same condition id as the metformin combination files | emc-987: "Any type of acute metabolic acidosis (such as lactic acidosis, diabetic ketoacidosis)." |
| metformin.json | `metformin:condition:acute-alcohol-intoxication` (new) | missing → contraindicated (condition `acute-alcoholism`) | SmPC 4.3 | emc-987 / emc-6298: "Hepatic insufficiency, acute alcohol intoxication, alcoholism" |
| metformin.json | `metformin:interaction:verapamil` | had an emc-6298 "Caution is therefore advised" quote → quote removed; action now "If needed, metformin dose adjustment may be considered." Level stays caution | The removed caution sentence is about OCT2 inhibitors (raised metformin levels). Verapamil is an OCT1 inhibitor (reduced effect) | emc-987: "If needed, dose adjustment of metformin may be considered as OCT inhibitors/inducers may alter the efficacy of metformin." |
| levothyroxine.json | `levothyroxine:interaction:aspirin` | all aspirin → `otherFormulations: ["aspirin-analgesic"]` | The source means anti-inflammatory aspirin | emc-435: "False low plasma concentrations have been observed with concurrent anti-inflammatory treatment such as phenylbutazone or acetylsalicylic acid" |
| simvastatin.json | `simvastatin:interaction:fluconazole` and `...:fluconazole:emc-10668` (display text) | brand and manufacturer names → generic wording ("10 mg to 40 mg SmPC"; conflict stated). Levels unchanged (caution / contraindicated) | Generic names only in display text. The 80 mg SmPC 4.4/4.5 says "is contraindicated" but its 4.3 does not list fluconazole, and it also lists fluconazole under caution. The conflict is kept as two rules | emc-10668: "Therefore, combination with itraconazole, ketoconazole, fluconazole, ... is contraindicated" |
| st-johns-wort.json | `...:antiepileptic`, `...:antiepileptic:kira` | consequence claimed an MHRA seizure report without a quote → quote added | Faithfulness | mhra-dsu-sjw-antiepileptics: "resulted in an increase in the frequency and severity of the patient's seizures" |
| methotrexate.json | `methotrexate:interaction:aspirin` | monitor on all aspirin → monitor, `otherFormulations: ["aspirin-75-tab","aspirin-75-gr"]`, reworded for antiplatelet aspirin | SPS treats antiplatelet aspirin and analgesic aspirin differently | sps-mtx-interactions: "Aspirin given as an antiplatelet can be continued in people taking methotrexate." |
| methotrexate.json | `methotrexate:interaction:aspirin-analgesic` (new) | missing → caution, `otherFormulations: ["aspirin-analgesic"]` | Analgesic aspirin is handled like an NSAID | sps-mtx-interactions: "Use NSAIDs in combination with methotrexate with caution on the advice of the specialist"; "avoid buying NSAIDs over-the-counter (e.g. oral ibuprofen or analgesic doses of aspirin)" |
| methotrexate.json | `methotrexate:interaction:nephrotoxic` (avoid) | now also hit ibuprofen and naproxen (new nephrotoxic members) → `otherExcept: ["ibuprofen","naproxen"]` | These NSAIDs have their own methotrexate/NSAID caution rule; the group "avoid" contradicted it | as above |
| co-trimoxazole.json | `co-trimoxazole:interaction:arb` | action "monitor potassium" had no quote → quote added | Faithfulness | emc-6999: "Close monitoring of serum potassium is warranted in patients at risk of hyperkalaemia" |

## 2. Rules checked and kept (batches A and B)

- **Paracetamol**: metoclopramide, domperidone (info, absorption speed); carbamazepine (info, hepatotoxicity mainly in overdose; 4.9 risk factor); tricyclics (info, one SmPC only, named in concern). Faithful.
- **Co-codamol**: MAOI contraindicated (30/500, 4.3) and avoid (8/500, 4.5), correctly split by formulation; antihistamines, anticholinergics, tricyclics info; benzodiazepines caution (group has no master-list members yet). Faithful.
- **Codeine**: tricyclics info, MAOI avoid, sedating antihistamines info, metoclopramide/domperidone info, benzodiazepines caution (MHRA). Faithful.
- **Tramadol**: MAOI contraindicated (4.3); SNRI, tricyclic, mirtazapine seizure caution (same level as the existing SSRI seizure rule); carbamazepine info; benzodiazepines and H1-antihistamines caution (lowest dose, shortest time, which the SmPC applies to all CNS depressants); anticholinergics info; 5-HT3 antagonists info. Faithful.
- **Ibuprofen**: aspirin avoid for all aspirin doses (correct: the SmPC "not generally recommended" sentence covers low-dose aspirin, which it then discusses); ARB and beta-blocker caution; sulfonylurea caution; fluconazole dose; aminoglycoside caution (group empty). Faithful.
- **Naproxen**: ARB monitor (renal); sulfonylurea monitor. Faithful.
- **Amlodipine**: the new azole rule and the existing CYP3A4-inhibitor, clarithromycin and inducer rules are all `monitor`, which matches "Clinical monitoring and dose adjustment may thus be required" and "blood pressure should be monitored and dose regulation considered". Azole group members: fluconazole (oral) and miconazole (oromucosal, cutaneous, vaginal); the engine does not apply this group rule to the local miconazole products. Fluconazole and clarithromycin each match two rules with the same advice (duplicate display only).
- **Lisinopril**: ARB avoid (SmPC 4.4 "not recommended" + MHRA; "should not be used concomitantly in patients with diabetic nephropathy" kept in action); vildagliptin, vildagliptin/metformin, racecadotril caution (angioedema); insulin monitor; tricyclics and sympathomimetics info. Faithful.
- **Spironolactone**: ARB caution is correct (the SmPC "should not routinely be used" sentence names ACE inhibitors only; MHRA says caution for ACEi or ARB). Diuretics dose (about 50% reduction, suspension SmPC) and dilution hyponatraemia info; aspirin info (natriuretic effect; source gives no dose, so not limited by formulation). Faithful.
- **Isosorbide mononitrate**: beta-blockers, ARBs, tricyclics, MAOIs info (hypotension). Faithful.
- **Sildenafil**: alpha-blockers dose for the ED tablet (consider 25 mg start) and caution for PAH products. Faithful.
- **Group memberships (A)**: cns-depressant for codeine, co-codamol, tramadol (own SmPC 4.5 wording); nephrotoxic for ibuprofen and naproxen (own SmPC 4.4/4.8: renal papillary necrosis, renal failure). Kept.
- `group:corticosteroid` holds only prednisolone and dexamethasone (oral), so the ibuprofen and naproxen corticosteroid rules do not reach inhaled or nasal steroids. No rule in batches A/B names diclofenac.

## 3. Rules checked and kept (batches C to G)

- **Atorvastatin**: diltiazem, verapamil and fluconazole (dose), fibrates (dose), ezetimibe (caution), carbamazepine (info) match SmPC 4.4/4.5.
- **Simvastatin**: verapamil and diltiazem (20 mg maximum), fenofibrate (caution) match. The fluconazole conflict between the two SmPCs is kept as two rules (see table).
- **Clopidogrel**: aspirin caution; fluoxetine, fluconazole, carbamazepine avoid ("should be discouraged"; the SmPC itself lists carbamazepine as a CYP2C19 inhibitor); repaglinide caution; rosuvastatin info. Faithful.
- **Warfarin**: 9 new rules are faithful. The aspirin rule covers all doses because the SmPC also covers low-dose aspirin. The miconazole rule uses the exact id with no route limit, because the SmPC names miconazole without a route. It therefore also fires for the miconazole cream and vaginal product.
- **Metformin**: ARBs, sympathomimetics, inhaled corticosteroids, insulin and secretagogue rules are faithful. Local nasal products are not reached by these group rules.
- **Levothyroxine**: the antidiabetic group rule (replaces the metformin-only rule), tricyclics, sympathomimetics, beta-blockers, carbamazepine and corticosteroids are faithful.
- **Omeprazole**: CYP3A4 and CYP2C19 inhibitor info and carbamazepine info are faithful.
- **Sertraline**: the 8 new interaction rules (info/caution) are faithful. The cyp2d6-inhibitor membership is sourced ("mild-moderate inhibitor of CYP 2D6").
- **St John's wort**: the paired avoid (THR) and contraindicated (other THR) rules follow the existing pattern.
- **Amoxicillin / co-amoxiclav**: allopurinol, tetracycline and loperamide rules are faithful.
- **Clarithromycin**: domperidone contraindicated (4.3); verapamil, diltiazem, carbamazepine, insulin and inhaled corticosteroids are faithful. The inhaled-corticosteroid rule also reaches the beclometasone inhaler; this is kept, because that SmPC itself advises caution with strong CYP3A inhibitors.
- **Ciprofloxacin**: duloxetine, insulin and loperamide rules are faithful. The tramadol and SSRI avoid rules are correctly attributed to the suspension SmPC.
- **Trimethoprim**, **co-trimoxazole**: ARB, repaglinide, sulfonylurea and antiepileptic rules are faithful.
- **Hydroxychloroquine**: the large diff is mostly reformatting. The 5 new rules (insulin and GLP-1 dose, antiepileptics, hepatotoxic and nephrotoxic caution) are faithful.
- **Methotrexate**: the other 9 new rules are faithful.
- **Ferrous sulfate, calcium carbonate, magnesium glycerophosphate, potassium chloride**: the spacing, dose and caution rules are faithful.
- **Phytomenadione, dapsone**: no changes today.
- **Group memberships**: all are sourced from each medicine's own SmPC, so all are kept.
  - Hepatotoxic:
    - co-amoxiclav: "Hepatic events may be severe ... deaths have been reported".
    - clarithromycin: "fatal hepatic failure".
    - ciprofloxacin: "hepatic necrosis and life-threatening hepatic failure".
    - co-trimoxazole: "fulminant hepatic necrosis".
    - methotrexate: "Methotrexate is hepatotoxic".
  - Nephrotoxic:
    - methotrexate: "renal damage that may lead to acute renal failure".
- **Coordinator items**:
  - `group:corticosteroid` holds only oral prednisolone and dexamethasone, so the systemic-steroid group rules cannot reach inhaled or nasal products.
  - No rule in the 34 files names diclofenac.
  - The aspirin rules are now dose-limited where the source is dose-specific: naproxen, lisinopril, levothyroxine, methotrexate.

## 4. Problems not fixed

- **Warfarin + miconazole.** The rule fires for the cream and vaginal products too, because the warfarin SmPC gives no route.
- **St John's wort.** Rules without `:kira` have no formulation limit. This is an older pattern, not new today. The interaction tables in the THR leaflets extract as garbled text, so the exact row alignment for tricyclics and SNRIs cannot be confirmed.
- **Duplicate findings with the same advice.**
  - amlodipine + fluconazole: azole and CYP3A4 rules.
  - amlodipine + clarithromycin: specific and CYP3A4 rules.
  - ibuprofen and naproxen + aspirin: aspirin and antiplatelet rules.
  - methotrexate + ciprofloxacin / co-trimoxazole: specific and hepatotoxic-group rules.
  - These duplicates are display clutter only.
- **Antitussives and muscle relaxants.** Co-codamol and tramadol SmPCs name antitussives, and co-codamol names muscle relaxants. They are not linked to dextromethorphan-guaifenesin, orphenadrine-paracetamol or paracetamol-chlorzoxazone, because those files are no-uk-product with no sourced group membership.

## 5. Issues for other batches and the integrator

- **Hydroxychloroquine and the hepatotoxic group.** The hydroxychloroquine SmPC (emc-1764) describes "Serious cases of drug-induced liver injury (DILI) ... fulminant hepatic failure (including fatal cases)", so it qualifies for `hepatotoxic` under the membership policy. It was not added. Adding it makes `methotrexate:interaction:hepatotoxic` (avoid) fire on the common methotrexate + hydroxychloroquine combination. Integrator decision.
- **Local drops reaching NSAIDs.** `gentamicin-drops:interaction:nephrotoxic` and `neomycin-polymyxin-dexamethasone-eye:interaction:nephrotoxic` are local eye/ear drops at avoid level. Since ibuprofen and naproxen joined `nephrotoxic`, these rules now fire for them. Those batches should limit or reword the rules.
- **Sertraline removed from qt-prolonging.** Other medicines' QT-group rules (escitalopram, moxifloxacin, domperidone and others) no longer fire for sertraline. This is intended.

## 6. Per-medicine assessment

| Medicine | Assessment |
|---|---|
| Paracetamol | Accurate. |
| Co-codamol | Accurate; MAOI split by strength is correct. |
| Codeine | Accurate. |
| Tramadol | Accurate. |
| Ibuprofen | Accurate after adding aspirin to the allergy rules and the fluconazole exception. |
| Naproxen | Aspirin "avoid" over-fired on low-dose aspirin (fixed); allergy now covers aspirin. |
| Amlodipine | Accurate; CYP3A4 levels match the SmPC (monitor). |
| Lisinopril | Accurate; one missed aspirin (anti-inflammatory dose) rule added. |
| Spironolactone | Accurate; ARB caution (not avoid) is correct. |
| Isosorbide mononitrate | Accurate. |
| Sildenafil | Accurate. |
| Atorvastatin | Accurate. |
| Simvastatin | Accurate; brand text removed; source conflict kept. |
| Clopidogrel | Accurate. |
| Warfarin | Accurate; miconazole rule has no route limit (source gives none). |
| Phytomenadione | Unchanged. |
| Metformin | Two 4.3 rules were missing (added); one misattributed quote (fixed). |
| Levothyroxine | Aspirin rule over-fired on low-dose aspirin (fixed). |
| Omeprazole | Accurate. |
| Sertraline | QT membership broke policy (removed); interaction rules accurate. |
| St John's wort | Accurate apart from a missing MHRA quote (added). |
| Amoxicillin | Accurate. |
| Co-amoxiclav | Accurate; hepatotoxic membership sourced. |
| Clarithromycin | Accurate; hepatotoxic membership sourced. |
| Ciprofloxacin | Accurate; hepatotoxic membership sourced. |
| Trimethoprim | Accurate. |
| Co-trimoxazole | ARB rule needed a quote (added); hepatotoxic membership sourced. |
| Dapsone | Unchanged. |
| Hydroxychloroquine | Accurate (mostly reformatting); hepatotoxic membership question for the integrator. |
| Methotrexate | Aspirin split by dose; nephrotoxic group no longer contradicts the NSAID rule. |
| Ferrous sulfate | Accurate. |
| Calcium carbonate | Accurate. |
| Magnesium glycerophosphate | Accurate. |
| Potassium chloride | Accurate. |

**Result after edits**
- Every new or changed quote in the 34 files is FOUND (`quoteFound`).
- `validate()` gives 0 errors for the whole KB.
- `test-engine.mjs` passes 39/39.
- Nothing was committed.
