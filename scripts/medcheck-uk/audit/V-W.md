# Audit: batches V and W

Batch V: budesonide-nebuliser, ipratropium, montelukast, mometasone-nasal, fluticasone-furoate-nasal, beclometasone-nasal.
Batch W: pantoprazole, dexlansoprazole, domperidone, metoclopramide, ondansetron, itopride.

Independent second check, 2026-10-17.
- All 48 V and W sources were re-fetched. SmPC sections 4.1 to 4.7 were read in full for every SmPC used (emc-880, 881, 445, 10205, 3818, 8028, 198, 101340, 1663, 6439, 844, 6977, 14644, 3188, 101741, 6213, 5216). The MHRA, SPS and BUMPS pages were read where they are cited.
- After the edits, all 935 quotes in these 12 files and their group entries are FOUND. The schema check shows 0 errors for V/W. The 5 errors that remain belong to other batches (see section 3).
- A scratch build (written to the scratchpad, not `public/`) and engine scenario runs confirmed the new and changed rules fire as intended.

## 1. Changes

| File | Item / rule | Before | After | Reason | Supporting quote |
|---|---|---|---|---|---|
| budesonide-nebuliser.json | `groups` | `corticosteroid`, `inhaled-corticosteroid` | `inhaled-corticosteroid` only | Group consistency. Batch U keeps every inhaler out of `corticosteroid`, which other batches use for systemic-steroid effects (hyperglycaemia, tendon rupture, GI bleeding). Metformin and clarithromycin already have separate inhaled-corticosteroid rules, so membership of both groups made them fire twice. The nasal formulations are local. | emc-880: "Pharmacotherapeutic group: Other drugs for obstructive airway diseases, inhalants, glucocorticoids." |
| mometasone-nasal.json | `groups` | `corticosteroid` | `[]` | Brief rule 6: local products are never in systemic groups (nasal only). | n/a |
| fluticasone-furoate-nasal.json | `groups` | `corticosteroid` | `[]` | As above. | n/a |
| beclometasone-nasal.json | `groups` | `corticosteroid`, `inhaled-corticosteroid` | `inhaled-corticosteroid` only | Same reason as budesonide (nasal is local; inhaler follows batch U). | emc-6977: "Clenil Modulite is for inhalation use only." |
| sources/V.json | `groups` | `corticosteroid` group with 4 members | Group entry removed (it held only these 4 members) | Follows the membership changes. | n/a |
| budesonide-nebuliser.json | rule `…:interaction:aspirin` (info, other `aspirin`) | Fired for any aspirin | **Removed** | **Over-firing.** The SmPC limits this to analgesic or antipyretic doses (500 mg or more per dose). The only master-list aspirin is 75 mg (`aspirin-75-tab`, `aspirin-75-gr`). The interactions text now states the dose limit. | emc-445: "Association to be taken into account with analgesic or antipyretic doses (>=500 mg per dose and/or <3 g per day)." |
| budesonide-nebuliser.json | rule `…:interaction:corticosteroids` (concern) | "Other inhaled or systemic corticosteroids" | "Systemic corticosteroids given at the same time" | The group now holds only systemic steroids. | emc-445: "…concomitant administration of inhaled or systemic corticosteroid therapy." |
| budesonide-nebuliser.json | NEW rule `…:interaction:inhaled-corticosteroids` (info, prescription nasal spray only) | none | other `group:inhaled-corticosteroid` | The SmPC names inhaled steroids as well as systemic ones. | same emc-445 quote |
| budesonide-nebuliser.json | rule `…:interaction:cyp3a4-inhibitors` | Consequence (Cushing's, adrenal suppression) had no quote | Quote added | Unsupported wording | emc-445: "with risk of appearance of a Cushing's syndrome or even adrenal insufficiency" |
| budesonide-nebuliser.json | `cautions` (pharmacy nasal spray item) | "another corticosteroid" and "TB, chickenpox, measles" had no quote | 2 quotes added | Unsupported wording | emc-10205: "They currently have or have been exposed to someone who has tuberculosis, chicken pox or measles." |
| budesonide-nebuliser.json | `name` | "Budesonide (nebuliser suspension)" | "Budesonide (nebuliser suspension or nasal spray)" | The file also covers the clinic nasal spray. The old name showed as "Budesonide (nebuliser suspension) (nasal spray…)". | n/a |
| beclometasone-nasal.json | `name` | "Beclometasone dipropionate (nasal spray)" | "… (nasal spray or inhaler)" | Same reason (the file also covers the inhaler). | n/a |
| fluticasone-furoate-nasal.json | rule `…:interaction:corticosteroids` (concern) | "Other corticosteroids" | "Systemic corticosteroids given at the same time" | Follows the group change. | emc-6439: "…whenever other forms of corticosteroid treatment are prescribed concurrently." |
| fluticasone-furoate-nasal.json | NEW rule `…:interaction:inhaled-corticosteroids` (caution) | none | other `group:inhaled-corticosteroid` | "Other forms of corticosteroid" includes inhaled steroids. Without this rule, removing the group would have dropped the warning for inhalers. | same emc-6439 quote |
| ipratropium.json | rule `…:interaction:beta2-agonists-glaucoma` (caution) | other `group:beta2-agonist`; fired for every LABA/ICS inhaler in every patient | other `salbutamol`, `otherFormulations: ["salbutamol-neb-5mg-ml"]`; concern says it only matters with a history of narrow-angle glaucoma | **Over-firing.** The source is limited to *nebulised* beta2-agonists given at the same time. (Schema: `otherFormulations` needs a medicine id, so `salbutamol` is the only master-list nebulised beta2-agonist.) | emc-3818: "The risk of acute glaucoma in patients with a history of narrow-angle glaucoma … may be increased when nebulised ipratropium bromide and beta2-agonists are administered simultaneously." |
| montelukast.json | `paediatric` MHRA item | Teenage reactions stated without a quote | Quote added | Unsupported wording | mhra-dsu-montelukast-2024: "in older children (13 years old up to and including 17 years old) the most commonly reported were anxiety, suicidal ideation and depression" |
| pantoprazole.json | NEW rule `pantoprazole:interaction:cyp2c19-inhibitor` (caution) | none | other `group:cyp2c19-inhibitor` | **Missing 4.5 interaction** with a defined group | emc-14644: "Inhibitors of CYP2C19 such as fluvoxamine could increase the systemic exposure of pantoprazole." / "A dose reduction may be considered for patients treated long-term with high doses of pantoprazole, or those with hepatic impairment." |
| domperidone.json | `administration` (tablet) | "place the tablet on the tongue and let it disintegrate" | "Take before meals…"; states that the orodispersible method does not apply to a standard tablet | **Wrong formulation.** The clinic product is a standard 10 mg tablet. The proxy SmPC is for an orodispersible tablet. | emc-101741: "It is recommended to take Epzit 10 mg Orodispersible Tablets before meals." |
| domperidone.json | NEW rule `domperidone:condition:conduction-disturbance` (contraindicated) | Only the `qt-prolongation` condition was encoded | condition `cardiac-conduction-disturbance` | **Missing 4.3 item.** The SmPC says "cardiac conduction intervals, particularly QTc", which is wider than QT. | emc-3188: "Domperidone is contraindicated in patients with known existing prolongation of cardiac conduction intervals, particularly QTc" |
| domperidone.json | rule `domperidone:interaction:qt-prolonging` (action) | "Do not use together…" | Adds that the SmPC gives azithromycin as caution only, and diltiazem/verapamil as not recommended | The group rule merges these (both are in `qt-prolonging`) into a contraindicated row. That is stronger than the SmPC's specific wording (see section 2). | emc-3188: "Caution with … the following macrolides involved in QT-interval prolongation: azithromycin and roxithromycin" |
| metoclopramide.json | NEW rule `metoclopramide:condition:conduction-disturbance` (caution) | none | condition `cardiac-conduction-disturbance` | Missing 4.4 condition (only QT and bradycardia were encoded) | emc-6213: "to patients with cardiac conduction disturbances (including QT prolongation)…" |
| ondansetron.json | rule `ondansetron:interaction:beta-blocker` | level `caution`; "Use with caution." | level `info`; "no specific action stated" | **Level upgraded beyond the source.** The beta-blocker sentence states a risk but gives no action. The "caution" sentence covers QT-prolonging or electrolyte-disturbing drugs. | emc-5216: "…antiarrhythmics (such as amiodarone) and beta blockers (such as atenolol or timolol) may increase the risk of arrhythmias" |
| dexlansoprazole.json, itopride.json | `availability.note` | 503 noted | Adds the audit re-check (emc search re-run, MHRA retried once, still 503) | Coordinator asked for one retry | n/a |
| sources/V.json, sources/W.json | `notes` | n/a | Audit summary appended | Keep the integrator informed | n/a |

**Checked and left unchanged (correct):**
- **Product match:**
  - The 12 clinic products match their UK SmPCs in active ingredient, salt and route.
  - Domperidone 10 mg tablet: proxied by the 10 mg orodispersible SmPC (domperidone maleate, oral). emc still lists only the suspension and the orodispersible tablet. The proxy is stated in the formulation note.
  - Beclometasone 250 microgram inhaler: proxied by a different brand of standard-particle CFC-free 250 microgram pMDI. This is stated, and brand prescribing is set and sourced (MHRA 2008 plus SPS 2026, still current).
  - None of the products are withdrawn.
- **Local routes:**
  - Budesonide nasal formulations have route `nasal`; the nebuliser has `inhalation (nebulised)`.
  - Mometasone, fluticasone furoate and beclometasone nasal sprays are `nasal`.
  - So `isLocal` drops systemic group or ingredient matches for the nasal forms. Scenario runs confirmed this: nasal mometasone with ibuprofen or metformin gives no finding.
- **Nasal steroid CYP3A rules (as each SmPC states them):**
  - Budesonide and mometasone: `group:cyp3a4-inhibitor`, avoid. Both SmPCs say "CYP3A inhibitors … should be avoided unless the benefit outweighs".
  - Fluticasone furoate: `group:strong-cyp3a4-inhibitor`, avoid. The SmPC says "potent".
  - Beclometasone: `group:strong-cyp3a4-inhibitor`, caution. The SmPC says "strong … caution and appropriate monitoring".
- **Ipratropium:** in `anticholinergic`, sourced from emc-3818 5.1 ("Pharmacotherapeutic group: Anticholinergics ATC Code: R03BB01"). The avoid rule matches "chronic co-administration … is not recommended".
- **Renal:** metoclopramide CrCl ≤15 (`maxInclusive`) and 15-60 (`maxInclusive`) match the SmPC. Both match at exactly 15 because the SmPC's own boundaries overlap. Domperidone severe renal impairment is defined only by serum creatinine, so it stays a condition rule.
- **Doses and limits:**
  - Domperidone 30 mg/day, 1 week; metoclopramide 30 mg/day, 5 days; ondansetron 8 mg/day maximum in moderate/severe hepatic impairment.
  - Pantoprazole 20 mg/day maximum in severe hepatic impairment.
  - Ipratropium 1 mg/day maximum at 12 years and under; budesonide nebuliser doses.
  - Mometasone, fluticasone furoate and beclometasone nasal doses all match the SmPCs (units in micrograms).
- **MHRA restrictions:**
  - Domperidone: 2014 cardiac restriction, POM status, 2019 children, 2026 phaeochromocytoma contraindication (also in both SmPCs).
  - Metoclopramide: 2013, 5 days, 30 mg, contraindicated under 1 year.
  - Ondansetron: 2020 clefts; the IV QT DSU is not applied to oral doses.
  - Montelukast: 2019 and 2024. Stopping on neuropsychiatric symptoms comes from MHRA 2024 and the generic SmPC, and the originator wording is also shown.
- **QT group (policy check against SPS "Commonly used medicines associated with QT interval prolongation"):**
  - Domperidone: SPS and its SmPC say it prolongs QT.
  - Metoclopramide: listed by SPS ("associated with QT prolongation, reported predominantly with intravenous administration"). SPS does not say it is free of QT effect at licensed doses.
  - Ondansetron: its SmPC says "prolongs the QT interval in a dose-dependent manner". SPS calls the risk low but does not exclude it.
  - All three stay in the group. So domperidone with metoclopramide or ondansetron shows as contraindicated. The domperidone SmPC names dolasetron (a 5-HT3 antagonist) but not ondansetron or metoclopramide; SPS says "Do not prescribe domperidone in people … receiving other medications known to prolong QT interval".
- **Pregnancy and breastfeeding:** all conflicts between the SmPC and SPS/BUMPS are kept as separate statements. The rule level uses the SmPC strength (pantoprazole, metoclopramide, ondansetron, mometasone, beclometasone, montelukast).

## 2. Problems not fixed (need the integrator or another batch)

1. **Domperidone QT group rule versus the SmPC's lower levels.** The domperidone SmPC contraindicates "QT-prolonging drugs", but it names azithromycin as caution and diltiazem/verapamil as not recommended. Azithromycin and diltiazem are both in `qt-prolonging`, so the merged row shows contraindicated. The engine has no "except" field on group rules. Listing every other member formulation in `otherFormulations` would silently miss future members, so I did not do it. The action text now states the SmPC exceptions. The integrator should decide whether to add an exclusion field.
2. **Sertraline in `qt-prolonging` breaks the QT policy (batch D).** SPS says "Fluoxetine, paroxetine and sertraline have no effect on QTc at licensed doses". Scenario: domperidone with sertraline currently shows **contraindicated**. Remove sertraline from the group (`sources/D.json`).
3. **Other QT members to confirm (not on the SPS list, or SPS wording is weak):**
   - Amitriptyline (batch P): SPS says TCA QT effects with amitriptyline "appear to occur predominantly in overdose".
   - Diltiazem (batch N), hydroxychloroquine (batch F) and venlafaxine (batch Q) are not on the SPS page. Their membership must rest on their own SmPC saying QT prolongation occurs at therapeutic doses.
   - Each of these now triggers the domperidone contraindication.
4. **Unmappable domperidone and ondansetron statements:**
   - Domperidone: "Caution with bradycardia and hypokalaemia-inducing drugs".
   - Ondansetron: "drugs that … cause electrolyte abnormalities".
   - No sourced KB group means "bradycardia-inducing" or "hypokalaemia-inducing". Mapping these to beta-blockers or diuretics would rest on memory, so no rule was added. The text items keep the statements.
5. **The domperidone antacid/antisecretory timing rules are scoped to the suspension.** The suspension SmPC says "oral formulations of domperidone". The proxy orodispersible tablet SmPC lacks the line, so the tablet has no rule. This is a conservative scoping choice, left as written by the researcher.
6. **`salbutamol-budesonide` (batch U) has `groups: []`.** It is in neither `inhaled-corticosteroid` nor `beta2-agonist`, so group rules (for example clarithromycin, metformin, and the fluticasone furoate and budesonide inhaled-steroid rules added here) do not reach it.
7. **vocab.json still has the old names** for budesonide-nebuliser and beclometasone-nasal. The build uses the medicine file `name`, so this is cosmetic only.
8. **Pre-existing schema errors in other batches:**
   - `telmisartan.json`: `otherFormulations` with a group `other`.
   - `insulin-degludec.json`: unknown source `mhra-plgb04668-0410-spc` (4×).
9. **Mometasone duplication.** Ingredient `mometasone` is shared with the topical `mometasone-miconazole`, so the tool's duplicate-ingredient check will flag a nasal spray with a skin cream. This is engine behaviour; the integrator may want local-route duplicates excluded.

## 3. Per-medicine assessment

- **budesonide-nebuliser:**
  - Thorough and faithful.
  - The prescription and pharmacy nasal SmPCs are correctly kept apart with formulation-scoped rules.
  - Fixes: group consistency and the aspirin over-fire.
  - The nasal VKA rule is kept at monitor, but its consequence notes the SmPC refers to systemic and rectal glucocorticoids.
- **ipratropium:**
  - Accurate; the age 12-and-under dose rule and the home-nebuliser specialist rule are correct.
  - Fix: the beta2 rule over-fired on every inhaler.
- **montelukast:**
  - Accurate.
  - The conflict between the originator and generic SmPC on stopping is handled well.
  - No rule changes.
- **mometasone-nasal:**
  - Accurate; 4.3 contraindications are fully encoded.
  - The herpes rule uses a broader condition id, but its concern states the nasal qualifier.
  - Group fix only.
- **fluticasone-furoate-nasal:** Accurate. Group fix plus a parallel inhaled-steroid rule.
- **beclometasone-nasal:**
  - Accurate.
  - The inhaler proxy is clearly flagged and brand prescribing is correctly sourced.
  - The age cut-off of 16 for "not recommended for children" (250 microgram strength) is an inference, and its consequence text says so.
  - Group fix only.
- **pantoprazole:**
  - Accurate.
  - The H. pylori combination contraindications (renal, moderate/severe hepatic) are correctly qualified in their concern text.
  - Added the missing CYP2C19 inhibitor rule.
- **dexlansoprazole:** no-uk-product confirmed. emc shows no results for the ingredient or the trade name. MHRA products is still 503 after one retry, so it remains unchecked there.
- **domperidone:**
  - Very thorough; all 4.3 items and MHRA restrictions are present.
  - Fixed the orodispersible administration text and added the conduction contraindication.
  - The QT group over-reach is reported above.
- **metoclopramide:** Accurate and complete. One condition rule added.
- **ondansetron:**
  - Accurate.
  - The congenital long QT "avoid" rule uses the broad `qt-prolongation` condition, but its concern states the congenital qualifier.
  - One level corrected (beta-blocker).
- **itopride:** no-uk-product confirmed, as for dexlansoprazole.
