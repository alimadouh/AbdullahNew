# Cross-batch group audit (2026-10-17)

Scope: group membership, rules that point at groups, dose- and route-specific over-firing, duplicate condition ids.
New cross-batch memberships live in `sources/XB.json`. Every new or changed quote was checked FOUND
(`lib/text.mjs quoteFound`), and `verify.mjs` then found all 23,061 quotes (0 schema errors, 0 warnings).

Tags: **[STATED]** = the brief asked for it. **[INFERRED]** = follows from a stated policy. **[MY RECOMMENDATION]** = my judgement, open to review.

## Result checks
- `validate`: 0 errors.
- `verify.mjs`: 643 sources, 23,061/23,061 quotes found, 0 warnings. This includes the check that each medicine-file group has a sourced member entry.
- `build.mjs`: 235 medicines, 4,900 rules, 0 unverified.
- `test-scenarios.mjs`: 54 passed, 0 failed. `test-engine.mjs`: 40 passed.

## 1. `corticosteroid` (systemic only)
- The membership was already correct: only prednisolone and dexamethasone. No inhaled, nasal, skin, eye or ear product is a member. No change.
- I checked all 41 rules with `other: group:corticosteroid`.
  - Rules whose source clearly includes inhaled steroids already have companion rules on `group:inhaled-corticosteroid`. These are:
    - clarithromycin ("systemic and inhaled corticosteroids that are primarily metabolised by CYP3A");
    - budesonide nasal ("inhaled or systemic");
    - fluticasone furoate nasal ("other forms of corticosteroid");
    - the metformin-containing products ("systemic and local routes").
  - All other rules are systemic in meaning ("oral corticosteroids", "Systemic corticosteroids", fluoroquinolone tendon rules, hypokalaemia rules). They are kept.
- Change **[INFERRED]**: `clarithromycin:interaction:inhaled-corticosteroid` now has `otherExcept: ["beclometasone-nasal"]`.
  - Reason: the clarithromycin quote covers only steroids "primarily metabolised by CYP3A". The beclometasone SmPC says "Beclometasone is less dependent on CYP3A metabolism than some other corticosteroids" (emc-6977, quote added to the rule).
  - Beclometasone keeps its own rule `beclometasone-nasal:interaction:strong-cyp3a4-inhibitors` (caution), which still fires with clarithromycin.

## 2. `qt-prolonging`
The policy: a member must be on the SPS list, or its own UK SmPC must state QT prolongation at therapeutic doses. SPS exclusions win.

**Current 12 members, all kept:**

| Member | Basis |
|---|---|
| azithromycin | SPS (macrolides) and its SmPC |
| clarithromycin | SPS (macrolides) and its SmPC |
| ciprofloxacin | SPS and its SmPC |
| levofloxacin | SPS and its SmPC |
| moxifloxacin | SPS and its SmPC |
| fluconazole | SPS (triazoles) and its SmPC |
| escitalopram | SPS and its SmPC |
| amitriptyline | SPS (TCAs), and its SmPC 4.8 lists "Common … electrocardiogram QT prolonged" |
| domperidone | SPS and its SmPC |
| metoclopramide | SPS |
| ondansetron | SPS and its SmPC |
| hydroxychloroquine | Not on the SPS list. Its own SmPC says it "has the potential to prolong the QTc interval" |

**Kept out:**
- sertraline and fluoxetine. SPS: "Fluoxetine, paroxetine and sertraline have no effect on QTc at licensed doses".
- Inhaled beta-2 agonists. SPS: inhaler risk is low, and the interaction risk is considered low.
- desloratadine. This was already decided in batch S.
- mirtazapine **[MY RECOMMENDATION]**.
  - Its SmPC says QT reports were mostly "in association with overdose or in patients with other risk factors".
  - Its QTc trial found prolongation "below the threshold for clinically meaningful prolongation".
- venlafaxine **[MY RECOMMENDATION]**.
  - Its SmPC 5.1 says it "did not prolong the QT interval to any clinically relevant extent at a supra-therapeutic dose of 450 mg/day".
  - Postmarketing cases were "especially in overdose or in patients with other risk factors".
  - 4.8 does list "Electrocardiogram QT prolonged*". This is a borderline case for review. Adding it would make domperidone and escitalopram "contraindicated" with venlafaxine.
- metronidazole. Its SmPC: "QT prolongation has been reported, particularly when metronidazole was administered with drugs with the potential for prolonging the QT interval".
- loperamide. Its SmPC links QT prolongation only to overdose or very high doses.

**Rule fix [STATED]:** `domperidone:interaction:qt-prolonging` (contraindicated) now has `otherExcept: ["azithromycin"]`.
- The domperidone SmPC names azithromycin under "caution" in its own rule, `domperidone:interaction:azithromycin`.
- Diltiazem and verapamil are not group members, so no other exception is needed.

**Other checks:**
- I checked every other QT group rule against same-medicine specific rules. No other weaker specific advice is hidden by a group rule.
- Moxifloxacin's "contraindicated" with the whole group is source-faithful: SmPC 4.3 says "Moxifloxacin should not be used concurrently with other drugs that prolong the QT interval".

## 3. CYP3A4 groups
- `strong-cyp3a4-inhibitor` (clarithromycin, sourced) and `cyp3a4-inhibitor` (fluconazole, clarithromycin, verapamil, diltiazem) were already split. The "strong/potent" rules already target the strong group.
- I checked every `cyp3a4-inhibitor` and `cyp3a4-inducer` rule. No other rule says "strong/potent only" while targeting the broad group.
  - Pulmicort Respules (budesonide-nebuliser) 4.4 says CYP3A inhibitors in general should be avoided. 4.5 says "potent". The rule keeps the broad group, so fluconazole still fires "avoid" (see the sanity pairs).
- Removed **[INFERRED]**: `amlodipine-valsartan:interaction:strong-cyp3a4-inhibitor`.
  - It was an exact duplicate of `amlodipine-valsartan:interaction:cyp3a4-inhibitor`: same quotes, "strong or moderate" wording.
  - The broad rule and the specific clarithromycin rule remain.
- Mirtazapine already has a separate azole rule for fluconazole (`mirtazapine:interaction:azole`). No change.
- Inducers: no rule needed retargeting (the "potent" sildenafil PAH rule also quotes the general "CYP3A4 inducers" wording).

## 4. `sympathomimetic` and `decongestant`
**New group `decongestant` [STATED]** ("Sympathomimetic decongestants (nasal or oral)").

| Member | Quote |
|---|---|
| xylometazoline | emc-3008: "is a sympathomimetic agent with marked alpha-adrenergic activity…", "It constricts the nasal blood vessels, thereby decongesting the mucosa of the nose" |
| loratadine-pseudoephedrine, cetirizine-pseudoephedrine, paracetamol-pseudoephedrine-chlorphenamine (+caffeine) | emc-6199 (Sudafed): "…is a decongestant of the mucous membranes of the upper respiratory tract", "Pseudoephedrine has direct and indirect sympathomimetic activity" |

**`sympathomimetic` is now the broad group** ("Sympathomimetics (including decongestants and beta-2 agonists)"). It keeps the 5 decongestant members and adds:

| Member | Quote |
|---|---|
| salbutamol | emc-850: "Cardiovascular effects may be seen with sympathomimetic drugs, including salbutamol." |
| fluticasone-propionate-salmeterol | emc-7597: "Pharmacotherapeutic Group: Adrenergics in combination with corticosteroids…"; emc-100580: "high doses of beta2 sympathomimetics (such as … salbutamol, salmeterol and terbutaline)" |
| budesonide-formoterol | emc-1327: "Pharmacotherapeutic group: Drugs for obstructive airway diseases: Adrenergics, Inhalants."; "can impair cardiac tolerance towards β2 sympathomimetics" |
| fluticasone-propionate-formoterol | emc-7649: "…adrenergics in combination with corticosteroids…"; "the pharmacologically predictable sympathetic effects of formoterol may be potentiated" |
| fluticasone-furoate-umeclidinium-vilanterol | emc-8666: "muscarinic receptor antagonists and sympathomimetics, including umeclidinium and vilanterol, respectively" |
| salbutamol-budesonide | No-UK combination. It inherits the group through `componentsOf` (salbutamol). |

**Rule retargets:**

| Rule | Was | Now | Reason |
|---|---|---|---|
| `xylometazoline:interaction:sympathomimetic` (contraindicated) | sympathomimetic | **decongestant** | Source: "other sympathomimetic decongestants" [STATED] |
| `amitriptyline:interaction:sympathomimetic` (avoid) | sympathomimetic | **decongestant** | SmPC names adrenaline, ephedrine, isoprenaline, noradrenaline, phenylephrine and phenylpropanolamine "(e.g. as contained in local and general anaesthetics and nasal decongestants)" (quote added). Inhaled salbutamol is not named [INFERRED] |
| `bisoprolol:interaction:sympathomimetic` (caution) | sympathomimetic | **beta2-agonist** | Source: "β-Sympathomimetic agents (e.g. isoprenaline, dobutamine): Combination with bisoprolol may reduce the effect of both agents." under "Combinations to be used with caution" [INFERRED] |

Notes on the bisoprolol rule:
- The SmPC's separate alpha-and-beta sentence ("e.g. noradrenaline, adrenaline") was dropped from this rule. It names no medicine in the database, and no UK quote calls pseudoephedrine or xylometazoline an alpha-and-beta agonist.
- So bisoprolol + pseudoephedrine products no longer fire. Pseudoephedrine's own beta-blocker contraindication is in the UK Sudafed SmPC, but the clinic combinations are no-UK products (no rules allowed). This is a known gap, already noted by batch S.

**Rules kept on the broad group** (source says "sympathomimetics" or "adrenergic drugs" broadly, so they now reach the beta-2 inhalers):
- metformin, vildagliptin, vildagliptin-metformin, repaglinide, glimepiride and the insulins (hyperglycaemia);
- levothyroxine (cardiac effects);
- ACE inhibitors, captopril, methyldopa (blood pressure);
- atenolol, atenolol-bendroflumethiazide, propranolol ("e.g. adrenaline");
- salbutamol nebuliser ("large doses of other sympathomimetic drugs");
- potassium citrate (excretion);
- Flutiform ("additional adrenergic drugs … by any route").

**New exception [MY RECOMMENDATION]:** `fluticasone-propionate-formoterol:interaction:sympathomimetic` now has `otherExcept: ["salbutamol", "salbutamol-budesonide"]`.
- A new info rule `…:interaction:saba-reliever` quotes the same SmPC: "If asthma symptoms arise in the period between doses, an inhaled, short-acting β2 agonist should be taken for immediate relief."
- Gliclazide's beta-2 statement is for IV salbutamol and terbutaline only, so no inhaler rule was added.

## 5. Aspirin dose
Rules from other medicines whose source limits them to anti-inflammatory or analgesic doses were already scoped to `aspirin-analgesic`: allopurinol, candesartan, levothyroxine, lisinopril, naproxen, telmisartan, telmisartan-HCT, valsartan, valsartan-HCT and methotrexate.

Fixes:
- **`mefenamic-acid:interaction:aspirin`** (avoid) → `otherFormulations: ["aspirin-analgesic"]` [INFERRED].
  - The sentence sits under "Other analgesics including cyclooxygenase-2 selective inhibitors" (quote added), the same as naproxen.
  - The low-dose content moved to a new rule `mefenamic-acid:interaction:aspirin-low-dose` (caution, 75 mg forms), with the existing low-dose quotes plus "Combination therapy with protective agents (e.g. misoprostol or proton pump inhibitors) should be considered…".
- **`diclofenac:interaction:aspirin-gr`** (avoid) → `otherFormulations: ["aspirin-analgesic"]` [INFERRED].
  - "Avoid concomitant use of two or more NSAIDs (including aspirin)" is listed with other NSAIDs. The same SmPC gives low-dose aspirin its own advice (gastroprotection).
  - That low-dose quote moved into `diclofenac:interaction:aspirin` (caution, all systemic forms).
- **Aspirin's own rules** [INFERRED]. The 75 mg tablet SmPC (emc-102206) says the renal risk with ACE inhibitors, ARBs and CCBs applies "in combination with high-dose ASA".
  - `aspirin:interaction:arb` and `aspirin:interaction:ccb` were scoped to `aspirin-75-tab`. They are now scoped to `aspirin-analgesic`.
  - `aspirin:interaction:ace-inhibitor` was split:
    - the gastro-resistant 75 mg SmPC statement (emc-2614, not dose-limited) stays on `aspirin-75-gr`;
    - the high-dose statement is a new rule, `aspirin:interaction:ace-inhibitor-high-dose`, on `aspirin-analgesic`.
- **Gap filled [INFERRED]:** new rule `lisinopril-hydrochlorothiazide:interaction:aspirin-anti-inflammatory` (info, `aspirin-analgesic`).
  - Its SmPC says "acetylsalicylic acid >3 g/day". Before, only `group:nsaid` was targeted, which never reaches aspirin.

## 6. Diclofenac forms
- `fluconazole:interaction:diclofenac` → `otherFormulations: ["diclofenac-k-tab", "diclofenac-gr-tab", "diclofenac-mr-tab", "diclofenac-supp"]` [STATED].
- No other rule names diclofenac directly. The `group:nsaid` rules already skip the gels (local route).
- I scanned all direct-id rules whose other medicine has local forms. Each remaining one is intended:
  - warfarin–miconazole: the SmPC wording covers all forms, and each miconazole form has its own rule;
  - Flutiform–xylometazoline: "by any route";
  - the gliclazide skin-steroid rules (item 14);
  - povidone-iodine–silver;
  - vaginal progesterone–estriol.

## 7. Duplicate or overlapping conditions (`tool.json` `conditionImplies`)
I added only strict "is a kind of" links:

| Child | Implies |
|---|---|
| pancreatitis | pancreatitis-history, biliary-tract-disease-pancreatitis [STATED] |
| phaeochromocytoma-untreated | phaeochromocytoma [STATED] |
| hocm | aortic-stenosis [STATED] |
| raised-serum-creatinine | renal-impairment [STATED] |
| moderate-severe-renal-impairment | renal-impairment |
| end-stage-renal-disease | severe-renal-impairment |
| type-1-diabetes, diabetes-vascular-involvement | diabetes |
| uncontrolled-hypertension, pregnancy-induced-hypertension | hypertension |
| uncontrolled-heart-failure | heart-failure |
| av-block-1st-degree, av-block-2nd-3rd | cardiac-conduction-disturbance |
| ventricular-arrhythmia, accessory-pathway-af | cardiac-arrhythmia |
| cardiac-arrhythmia | cardiac-disease |
| acute-mi-complicated | recent-myocardial-infarction |
| prinzmetal-angina | ischaemic-heart-disease |
| recent-stroke, haemorrhagic-stroke | cerebrovascular-disease |
| angle-closure-glaucoma | glaucoma |
| copd | pulmonary-disease |
| severe-asthma-or-copd | copd-respiratory-depression |
| addisons-disease | adrenal-insufficiency |
| thyrotoxicosis, hypothyroidism | thyroid-dysfunction |
| hiv-aids | immunodeficiency, serious-infection |
| recent-kidney-transplant | solid-organ-transplant |
| childbearing-potential-no-contraception | childbearing-potential |
| megacolon | toxic-megacolon ("Toxic megacolon / megacolon") |
| ocular-herpes-simplex | herpes-oronasal-ocular, ocular-viral-infection |
| chloramphenicol-myelosuppression-history | bone-marrow-depression-history |

`hereditary-fructose-intolerance` was already linked.

Not linked, because the relation is not strict:
- pancreatitis-history → pancreatitis (past is not current);
- porphyria-cutanea-tarda → porphyria (that id means acute porphyria);
- severe-peripheral-arterial-disease (it includes Raynaud's);
- tachyarrhythmia, pre-eclampsia, varicella.

## 8. Empty or odd groups
**Filled:**
- **`aminoglycoside`** [INFERRED]. Members: gentamicin-drops (emc-4218: "known allergy to gentamicin and other aminoglycosides") and neomycin-polymyxin-dexamethasone-eye (emc-841: "an aminoglycoside (neomycin)"). Four no-UK clinic combinations were added the same way batch T did: gentamicin-dexamethasone-ear, betamethasone-miconazole-gentamicin, neomycin-polymyxin-prednisolone-ear and triamcinolone-nystatin-neomycin.
  - Effect: allergy cross-reactivity rules now reach these products. Other medicines' systemic aminoglycoside rules still skip them (local route).
- **`benzodiazepine`** [INFERRED]. Member: chlordiazepoxide-clidinium (no-UK), from the UK Librium 5 mg SmPC (new source emc-1728): "chlordiazepoxide is a long-acting benzodiazepine".
  - The opioid and CNS-depressant benzodiazepine warnings now reach it.
  - Clidinium has no UK source, so it is not added to `anticholinergic`.
- **`hepatotoxic`**: see item 12.

**`anticholinergic` split [STATED]:**
- The new group `inhaled-antimuscarinic` holds tiotropium (emc-407), ipratropium (emc-3818) and the triple inhaler (emc-8666). The hyoscine SmPC also names tiotropium and ipratropium.
- These three were removed from `anticholinergic`: from the member entries in U.json, V.json and X.json, and from the medicine-file `groups`.
- `anticholinergic` now holds amitriptyline, hyoscine butylbromide and dicycloverine.
- Companion rules on the new group, added only where the UK source covers inhaled antimuscarinics for that interaction:
  - `ipratropium:interaction:inhaled-antimuscarinic` (avoid, "other anticholinergic drugs");
  - `tiotropium:interaction:inhaled-antimuscarinic` (avoid, "other anticholinergic containing drugs");
  - `hyoscine-butylbromide:interaction:inhaled-antimuscarinic` (info, "other anticholinergics (e.g. tiotropium, ipratropium…)").
- These rules now reach only systemic anticholinergics: amitriptyline (avoid), co-codamol, tramadol, metoclopramide, GTN and the thiazide combinations.
  - GTN's "drugs that cause dry mouth (eg anticholinergic, antimuscarinics…)" could arguably include inhalers. I left it systemic and flag it for review.

**Already filled before this pass:** `beta2-agonist`, `antidiabetic`, `insulin`, `diuretic`, `antihistamine`. Their members were checked and are sourced.

**Still empty** (no master-list medicine has a UK source for them):
- `carbapenem`, `monobactam`, `maoi`;
- `ototoxic`. Furosemide and the aminoglycoside drops have their own explicit rules. No UK quote calls furosemide "ototoxic" as a class.

## 9. Sanity pairs (before → after)
Each row shows the top level, then the rule ids that fired.

| Pair | Before | After |
|---|---|---|
| domperidone + azithromycin | contraindicated (`domperidone:…qt-prolonging`, `domperidone:…azithromycin`, `azithromycin:…qt-prolonging`) | **caution** (`domperidone:…azithromycin`, `azithromycin:…qt-prolonging`) |
| sertraline + escitalopram | caution (sertraline QT; serotonergic) | unchanged. Escitalopram's QT contraindication correctly does not fire, because sertraline is not a member |
| clarithromycin + simvastatin | contraindicated | unchanged |
| fluconazole + budesonide-nebuliser (neb) | avoid (`budesonide-nebuliser:…cyp3a4-inhibitors`, from the SmPC 4.4 general CYP3A wording) | unchanged |
| warfarin + miconazole oral gel | contraindicated | unchanged |
| warfarin + miconazole cream | caution | unchanged |
| telmisartan + aspirin 75 mg | monitor (`aspirin:…antihypertensive`) + info (`aspirin:…arb`, high-dose only) | **monitor only** |
| telmisartan + aspirin-analgesic | caution + monitor | caution (`telmisartan:…aspirin`, `aspirin:…arb`) + monitor |
| metformin + salbutamol | none | **monitor** (`metformin:…sympathomimetic`) |
| levothyroxine + salbutamol | none | **caution** (`levothyroxine:…sympathomimetic`) |
| bisoprolol + salbutamol | none | **caution** (beta-sympathomimetic rule) |
| bisoprolol + loratadine-pseudoephedrine | caution | none (see item 4) |
| xylometazoline + salbutamol | none | none |
| amitriptyline + salbutamol | none | none |
| amitriptyline + tiotropium | avoid (amitriptyline rule + tiotropium rule) | avoid (tiotropium's own rule only) |
| ipratropium + tiotropium | avoid | avoid (now through the inhaled-antimuscarinic rules) |
| hyoscine + tiotropium | avoid + info | avoid + info (inhaled rule) |
| Flutiform + salbutamol | none | **info** (SABA reliever) |
| fluconazole + diclofenac gel | monitor | **none** |
| fluconazole + diclofenac tablet | caution + monitor | unchanged |
| methotrexate + hydroxychloroquine | caution ×2 (HCQ's own rules) | caution ×2 + **info** (Metoject: no added toxicity). The methotrexate hepatotoxic "avoid" does not fire |
| clarithromycin + beclometasone inhaler | caution ×2 | caution (beclometasone's own strong-CYP3A rule) |
| mefenamic acid + aspirin 75 mg | avoid (mefenamic "avoid two NSAIDs" + aspirin's own NSAID rule) | avoid from **aspirin's own** 75 mg SmPC rule only; mefenamic now gives low-dose caution |
| diclofenac GR + aspirin 75 mg | avoid (incl. `aspirin-gr`) | avoid from aspirin's own rule; the diclofenac "two NSAIDs" rule no longer fires for 75 mg |
| gentamicin-drops + ibuprofen | avoid | avoid (kept: see item 11) |

## 10. Progesterone pessary
`progesterone-pess` (route "vaginal or rectal") now has `"systemic": true` [STATED]. Group and ingredient rules now reach it, for example carbamazepine, furosemide, glimepiride and insulin glargine with `group:progestogen`.

## 11. Local drop products with "nephrotoxic/ototoxic" rules
No change in level; this was already handled by the batch audits [STATED check].
- In both SmPCs the "avoid" wording is the product's own section 4.5 text: Genticin drops emc-6552, Maxitrol emc-841. So the source strength is kept.
- The rules already state the context:
  - Genticin: "it is likely that systemic absorption following topical administration does not constitute a comparable risk";
  - Maxitrol: "these effects have not been reported following topical ocular use of this product".
- Neither SmPC lowers the level itself, so `info` is not used.
- `ototoxic` has no members, so only the nephrotoxic rules fire (ibuprofen, naproxen, methotrexate).

## 12. `hepatotoxic`
Criterion: the medicine's own SmPC section 4.4 warns of serious or fatal liver injury. This matches the existing members (azithromycin, nitrofurantoin, clarithromycin, ciprofloxacin, co-amoxiclav, methotrexate, co-trimoxazole).

**Added:**

| Member | Quote |
|---|---|
| hydroxychloroquine [STATED] | emc-1764: "fulminant hepatic failure (including fatal cases) have been reported during use of Hydroxychloroquine" |
| celecoxib | emc-2945: "hepatic failure (some with fatal outcome or requiring liver transplant), have been reported with celecoxib" |
| fluconazole | emc-1065: "Diflucan has been associated with rare cases of serious hepatic toxicity including fatalities" |
| moxifloxacin | emc-6771: "Cases of fulminant hepatitis potentially leading to liver failure (including fatal cases) have been reported with moxifloxacin" |
| methyldopa | emc-100084: "Rare cases of fatal hepatic necrosis have been reported." |
| naproxen | emc-13238: "Severe hepatic reactions, including jaundice and hepatitis (some cases of hepatitis have been fatal) have been reported with this drug" |
| duloxetine | emc-12320: "Cases of liver injury, including severe elevations of liver enzymes (>10 times upper limit of normal), hepatitis and jaundice have been reported with duloxetine" |

**Methotrexate rule:** `methotrexate:interaction:hepatotoxic` (avoid) now has `otherExcept: ["hydroxychloroquine", "naproxen", "celecoxib"]`.
- Hydroxychloroquine [STATED]: a new info rule `methotrexate:interaction:hydroxychloroquine` quotes the Metoject PEN SmPC (emc-5443): "An increase in the toxic effects of methotrexate is, in general, not to be expected when Metoject PEN is administered simultaneously with other antirheumatic medicinal products (e.g. … hydroxychloroquine …)". This is also noted in `sources/F.json` notes.
- Naproxen and celecoxib [INFERRED]: they are covered by `methotrexate:interaction:nsaid` (SPS: caution on specialist advice), the same as the existing nephrotoxic exception.

**Not added [MY RECOMMENDATION]** (please review):
- ACE inhibitors (captopril, lisinopril, perindopril and their combinations). 4.4 has a class statement ("ACE inhibitors have been associated with a syndrome … fulminant hepatic necrosis and (sometimes) death"). Adding them would make methotrexate "avoid" with every ACE inhibitor.
- These have serious liver injury only in the 4.8 table: diclofenac, etoricoxib, atorvastatin, sertraline, glimepiride, lisinopril-HCT, doxycycline, oseltamivir, trimethoprim ("hepatic necrosis may be fatal").
- omeprazole: only in pre-existing liver disease.
- metronidazole: only in Cockayne syndrome or with other antibiotics.
- paracetamol: only in overdose or with enzyme inducers.
- empagliflozin: causal relationship not established.

## 13. `componentsOf` for mometasone-miconazole
Not added [STATED].
- Miconazole has 28 form-scoped rules (gel, cream, pessary). The only unscoped one is its own-ingredient allergy rule.
- The combination's cream form id would match none of the cream rules, but the UI would still say "checked using the UK information for miconazole". That would be misleading.

## 14. Gliclazide skin corticosteroid rules
Checked; the rules are aligned.
- Gliclazide has per-product monitor rules for all 8 master-list cutaneous steroid products:
  - UK: hydrocortisone-topical, fusidic-acid-hydrocortisone, fusidic-acid-betamethasone, miconazole-hydrocortisone;
  - no-UK: mometasone-miconazole, isoconazole-diflucortolone, betamethasone-miconazole-gentamicin, triamcinolone-nystatin-neomycin.
- They must stay per-product: `group:topical-corticosteroid` matches are skipped for skin products (local route).
- The gliclazide source also names rectal steroids. The only rectal clinic product ("anti-haemorrhoid") has unknown ingredients, so there is no rule.
- Ear, eye and nasal steroids are not "cutaneous".

## Files changed
**`sources/`:**
- XB.json (new: groups decongestant, sympathomimetic additions, inhaled-antimuscarinic, hepatotoxic additions, aminoglycoside, benzodiazepine; source emc-1728);
- U.json, V.json, X.json (anticholinergic members removed);
- U.json, T.json, F.json (notes).

**Other config:**
- `vocab.json`: group names for sympathomimetic and anticholinergic only;
- `tool.json`: conditionImplies.

**`medicines/`:**
- amitriptyline, xylometazoline, bisoprolol, fluticasone-propionate-formoterol;
- tiotropium, ipratropium, fluticasone-furoate-umeclidinium-vilanterol, hyoscine-butylbromide;
- domperidone, clarithromycin, amlodipine-valsartan;
- fluconazole, aspirin, mefenamic-acid, diclofenac, lisinopril-hydrochlorothiazide;
- methotrexate, progesterone.

**Generated:** `verify-report.json` and `public/medcheck/kb.json`, rebuilt by verify.mjs and build.mjs.
