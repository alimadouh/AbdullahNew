# Audit B: amlodipine, lisinopril, spironolactone, isosorbide mononitrate, sildenafil

Independent second check, 2026-10-17. All 10 SmPCs in `sources/B.json` were re-read in full (4.1 to 4.9). The SPS spironolactone and ACE inhibitor monitoring pages were also re-read. Every new or changed quote was checked with `fetchtext.mjs --check` (all FOUND). Final `verify.mjs` run: all quotes found, 0 schema errors, 0 warnings. Engine behaviour was checked with an in-memory knowledge base (no `kb.json` written), for example child + eGFR 25 on lisinopril, child + eGFR 45 on each spironolactone form, ISMN + sildenafil, and recent MI on ISMN/amlodipine.

Change types used below: **missing rule**, **missing item**, **wrong scope** (rule fires for a wider group than the source names), **wrong boundary**, **unsupported text** (statement not backed by its quotes), **wording** (faithfulness).

## 1. Changes

### Amlodipine (`medicines/amlodipine.json`)

| Item / rule | Before → after | Reason | Supporting quote (emc-2743 unless stated) |
|---|---|---|---|
| `adverseSerious[1]` | "myocardial infarction" in `t` had no quote → quote added | unsupported text | "Very rare Myocardial infarction" |
| `interactions` (new item) | none → dantrolene / malignant hyperthermia item | missing item | "it is recommended that the co-administration of calcium channel blockers such as amlodipine be avoided in patients susceptible to malignant hyperthermia and in the management of malignant hyperthermia" |
| `interactions` (new item, detail) | none → mTOR inhibitors may have higher exposure | missing item | "With concomitant use of mTOR inhibitors, amlodipine may increase exposure of mTOR inhibitors." |
| `amlodipine:condition:post-mi-unstable-hf` | condition `recent-myocardial-infarction` → new `unstable-heart-failure-post-mi`. The 4.3 lead-in quote was also added. | wrong scope. The old rule showed "Contraindicated" for every recent MI. The SmPC contraindicates only haemodynamically unstable HF after acute MI. | "haemodynamically unstable heart failure after acute myocardial infarction" |
| `amlodipine:condition:malignant-hyperthermia` (new) | none → `avoid`, new condition `malignant-hyperthermia-susceptibility` | missing rule | as the dantrolene quote above ("be avoided") |

### Lisinopril (`medicines/lisinopril.json`)

| Item / rule | Before → after | Reason | Supporting quote (emc-7611 unless stated) |
|---|---|---|---|
| `lisinopril:renal:child-gfr-under-30` (new) | was text only → renal rule `GFR` max 30 + `age` max 18, `avoid` | missing rule (the researcher's flag; the engine now supports `age` on renal rules) | "Zestril is not recommended in children below the age of 6, or in children with severe renal impairment (GFR < 30ml/min/1.73m2)" |
| `cautions` (new item) + `lisinopril:condition:angioedema-history-other` (new, `info`) | none → item + rule, new condition `angioedema-history-other` | missing rule. Angioedema not caused by an ACE inhibitor was not covered; hereditary/idiopathic angioedema and previous ACE inhibitor angioedema were already contraindicated. | "Patients with a history of angioedema unrelated to ACE inhibitor therapy may be at increased risk of angioedema while receiving an ACE inhibitor" |
| `lisinopril:condition:diabetes` (new, `monitor`) | none → rule | missing rule. Glycaemic monitoring is needed with insulin too; insulin is not in the master list, so the interaction rule alone misses it. | "In diabetic patients treated with oral antidiabetic agents or insulin, glycaemic control should be closely monitored during the first month of treatment with an ACE inhibitor" |
| `lisinopril:condition:ischaemic-heart-disease`, `...:cerebrovascular-disease` (new, `monitor`) | none → 2 rules | missing rule | "Similar considerations apply to patients with ischaemic heart or cerebrovascular disease in whom an excessive fall in blood pressure could result in a myocardial infarction or cerebrovascular accident." |
| `lisinopril:condition:surgery-planned` (new, `info`) | none → rule | missing rule | "If hypotension occurs and is considered to be due to this mechanism, it can be corrected by volume expansion." |
| `lisinopril:condition:recent-kidney-transplant` (new, `avoid`) | none → rule, new condition `recent-kidney-transplant` | missing rule | "Treatment with Zestril is therefore not recommended." |
| `lisinopril:interaction:methotrexate` (new, `caution`) | none → rule (effect bone-marrow-suppression) | missing rule. Zestril 4.4 requires "extreme caution" with immunosuppressant therapy. Methotrexate's immunosuppressive effect is sourced from its own UK SmPC (emc-511, a batch F source). | "Zestril should be used with extreme caution in patients with collagen vascular disease, immunosuppressant therapy…"; emc-511: "The immunosuppressive effect of methotrexate should be taken into account" |

### Spironolactone (`medicines/spironolactone.json`)

| Item / rule | Before → after | Reason | Supporting quote |
|---|---|---|---|
| `spironolactone:renal:child-gfr-under-60-susp` (new) | was text only → renal `GFR` max 60 + `age` max 18, `contraindicated`, suspension only | missing rule (the researcher's flag) | emc-100453: "Spironolactone is contraindicated in paediatric patients with moderate (GFR 30 - < 60 ml/min) to severe (GFR < 30 ml/min) renal impairment" |
| `spironolactone:condition:child-renal-impairment-tab` (new) | was text only → condition `renal-impairment` + `age` max 18, `contraindicated`, tablets only. The tablet SmPC gives no number, so the engine links the rule to GFR < 60 with a provisional note. | missing rule | emc-1619: "Spironolactone is contraindicated in paediatric patients with moderate to severe renal impairment." |
| `spironolactone:condition:severe-renal-impairment-sps` (new) | none → condition `severe-renal-impairment`, `contraindicated`. Before this, the adult tablet "significant renal compromise" contraindication had no rule that fired on a kidney value. | missing rule | SPS: "contraindicated in severe renal impairment or acute renal insufficiency" |
| `spironolactone:renal:gfr-60-90-susp` | `{min 60, max 90}` → adds `maxInclusive: true` | wrong boundary (the source range "60 - 90" includes 90) | emc-100453: "(glomerular filtration rate (GFR) 60 - 90 ml/min)" |
| `spironolactone:interaction:nsaid` | quoted only the SPS line "Avoid NSAIDs unless prescribed" plus reduced diuretic effect → adds the SmPC "may lead to severe hyperkalaemia" quotes. Action reworded to say the SPS line is patient advice. Level kept at `avoid`. | wording. The SPS line is advice to patients, and the hyperkalaemia statement it rested on was missing. | emc-1619: "…nonsteroidal anti-inflammatory drugs… may lead to severe hyperkalaemia." |
| `spironolactone:hepatic:severe-tab` | the only quote sits under "Elderly" in 4.2 → adds a general 4.4 quote | context | emc-1619: "Fluid and electrolyte status should be regularly monitored particularly in the elderly, in those with significant renal and hepatic impairment." |
| `cautions[5]` | "contains 400 mg sucrose" → adds that the listed sugar intolerances "should not take" it | missing item | emc-100453: "Patients with rare hereditary problems of fructose intolerance, glucose-galactose malabsorption or sucrase-isomaltase insufficiency should not take this medicine." |
| `spironolactone:condition:sugar-intolerance-susp` (new, `avoid`) | none → rule, suspension only | missing rule | as above |
| `spironolactone:condition:no-contraception-susp` (new, `avoid`) | was text only (`reproductive`) → rule, suspension only | missing rule | emc-100453: "Qaialdo is not recommended during pregnancy and in women of childbearing potential not using contraception." |

### Isosorbide mononitrate (`medicines/isosorbide-mononitrate.json`)

| Item / rule | Before → after | Reason | Supporting quote |
|---|---|---|---|
| `contraindications[2]` | list left out toxic pulmonary oedema → added (immediate-release) | missing item | emc-2698: "…closed angle glaucoma, toxic pulmonary oedema or hypovolaemia." |
| `isosorbide-mononitrate:condition:acute-mi-low-filling` | condition `recent-myocardial-infarction` (`contraindicated`) → `low-cardiac-filling-pressure` (new condition). Quotes now cover "low cardiac filling pressures" in both SmPCs. | wrong scope. The old rule made ISMN "Contraindicated" after any recent MI, but the SmPCs make recent MI a caution. Only acute MI with low filling pressure is in 4.3. | emc-2698: "should not be used in cases of acute myocardial infarction with low filling pressures"; "…low cardiac filling pressures…" |
| `isosorbide-mononitrate:condition:recent-mi` (new, `caution`, IR + Elantan LA) | none → rule | missing rule (it replaces the over-broad contraindication) | emc-9214: "The capsules should be used with caution in patients who have a recent history of myocardial infarction" |
| `isosorbide-mononitrate:condition:toxic-pulmonary-oedema` (new, `contraindicated`, IR) | none → rule, new condition | missing rule (SmPC 4.3) | emc-2698 quote as above |
| `isosorbide-mononitrate:condition:pulmonary-disease-cap` (new, `caution`, Elantan LA) | none → rule | missing rule | emc-9214: "Caution should be exercised in patients with hypoxaemia and ventilation/perfusion imbalance due to lung disease or ischaemic heart failure." |
| `isosorbide-mononitrate:condition:renal-impairment-ir` (new, `dose`, IR) | text only → condition rule (no number, so the engine links it to GFR < 60 provisionally) | missing rule | emc-2698: "Dosage should be reduced in patients with renal or hepatic impairment." |
| `isosorbide-mononitrate:condition:severe-renal` (new, `caution`, IR + Elantan LA) | text only → rule | missing rule | emc-9214: "…severe liver or severe renal disease." |
| `cautions[5]` | "Contains lactose and sucrose" (consequence missing) → "should not take" for the named intolerances; Elantan quotes added; no longer `detail` | unsupported text / missing item | emc-9214: "Due to the presence of sucrose, patients with rare hereditary problems of fructose intolerance… should not take this medicine." |
| `...:condition:sugar-intolerance`, `...:condition:galactose-intolerance` (new, `avoid`, IR + Elantan LA) | none → 2 rules, new condition `galactose-intolerance-lactase-deficiency` | missing rule | emc-2698: "patients with rare hereditary problems of galactose or fructose intolerance, total lactase deficiency… should not take this medicine." |

### Sildenafil (`medicines/sildenafil.json`)

| Item / rule | Before → after | Reason | Supporting quote |
|---|---|---|---|
| `cautions[8]` | suspension only: "contains sorbitol and sodium benzoate" → all forms: lactose in Viagra/Revatio tablets and sorbitol (HFI) in the suspension, with "should not take" | missing item | emc-7980: "VIAGRA should not be administered to men with rare hereditary problems of galactose intolerance…"; emc-2850: "Patients with rare hereditary fructose intolerance (HFI) should not take this medicinal product." |
| `cautions` (new item, PAH) | none → vasodilator caution (hypotension, fluid depletion, severe LV outflow obstruction, autonomic dysfunction) | missing item | emc-181: "for example patients with hypotension, patients with fluid depletion, severe left ventricular outflow obstruction or autonomic dysfunction" |
| `sildenafil:condition:aortic-stenosis` | Viagra quote only → Revatio quote added (the rule is unscoped) | missing source support for the PAH products | as above |
| `sildenafil:condition:fluid-depletion-pah` (new, `caution`, PAH) | none → rule | missing rule | as above |
| `sildenafil:condition:no-contraception-pah` (new, `avoid`, PAH) | text only (`reproductive`) → rule | missing rule | emc-181/emc-2850: "Revatio is not recommended for women of childbearing potential unless also using appropriate contraceptive measures." |
| `sildenafil:condition:galactose-intolerance-tab` (new, `avoid`, ED + PAH tablets) | none → rule | missing rule | emc-181: "Patients with rare hereditary problems of galactose intolerance, total lactase deficiency or glucose-galactose malabsorption should not take this medicine." |
| `sildenafil:condition:fructose-intolerance-susp` (new, `avoid`, PAH suspension) | none → rule | missing rule | emc-2850 HFI quote as above |

### `sources/B.json`

| Change | Reason |
|---|---|
| 7 new conditions: `malignant-hyperthermia-susceptibility`, `unstable-heart-failure-post-mi`, `angioedema-history-other`, `recent-kidney-transplant`, `low-cardiac-filling-pressure`, `toxic-pulmonary-oedema`, `galactose-intolerance-lactase-deficiency` | needed by the new or corrected rules |
| `notes`: the "ENGINE LIMITS … cannot be age-limited" sentence was replaced by a description of the new age-limited rules; an audit note was added on vocabulary overlap and the cross-batch citation of emc-511 | the old note is out of date |

**Counts:** 25 new rules, all missing rules (amlodipine 1, lisinopril 8, spironolactone 5, ISMN 7, sildenafil 4). One of them, the ISMN recent-MI caution, takes over from the over-broad contraindication. Also: 2 wrong-scope condition mappings fixed, 1 wrong boundary, 1 wording fix on a rule, 2 rules given extra or context quotes, 9 section items added or corrected (2 of them unsupported text) and 7 new conditions. No wrong levels were found that needed changing (see section 3). No dose numbers or units were wrong.

## 2. Problems found but not fixable (or left by judgement)

- **Sildenafil PAH contraindication with "the most potent CYP3A4 inhibitors" (ketoconazole, itraconazole, ritonavir).** I agree with the researcher. This must not be a `group:strong-cyp3a4-inhibitor` rule. Other batches put clarithromycin in that group, but Revatio places clarithromycin in a middle tier (20 mg once daily, `sildenafil:interaction:clarithromycin-pah`, `dose`). None of the three named medicines is in the master list, so the contraindication stays in sections only. Coding clarithromycin directly is correct.
- **Lab-value thresholds the engine cannot test.** The engine has no input for potassium or creatinine values. These stay in sections:
  - Lisinopril acute-MI creatinine limits (177 and 265 micromol/L).
  - Spironolactone creatinine limits: ≤2.5 mg/dL = ≤221 micromol/L to start; >4 mg/dL = >353 micromol/L to stop. The tablet and suspension figures match after conversion.
  - Potassium cut-offs: tablets (any hyperkalaemia, start only if ≤5.0 mEq/L, stop >5 mEq/L), suspension (>5.5 mEq/L), SPS (>5.0 / >5.5 / >6 mmol/L). mEq/L equals mmol/L for potassium.
  - The `hyperkalaemia` condition is yes/no, so every hyperkalaemia rule fires when it is set.
- **Interacting medicines not in the master list.** These are in sections only: sacubitril/valsartan, aliskiren, ARBs, lithium, riociguat, ritonavir, alpha-blockers, dantrolene, mTOR inhibitors, tacrolimus, ciclosporin, heparin, digoxin, eplerenone, abiraterone, mitotane, carbenoxolone, allopurinol and procainamide.
- **"Children" read as under 18 years** for the new age-limited rules. Zestril's paediatric dosing covers 6–16 years; Qaialdo covers neonates to 18 years.
- **No numbers in the source**, so these are not encoded:
  - ISMN immediate-release "reduce dose in renal/hepatic impairment" gives no amount.
  - Imdur "special care" for older people with marked hepatic or renal insufficiency does not define "older".
  - Spironolactone "caution in hypertensive children with mild renal insufficiency" gives no threshold.
  - Lisinopril "lower dose or longer interval in children with decreased renal function" gives no threshold.
- **Indication-based limits** (lisinopril not recommended in children except for hypertension; sildenafil PAH not recommended in other forms of PAH) cannot be expressed. They are in sections.
- **Spironolactone + NSAIDs is kept at `avoid`, a judgement call.** SPS's "Avoid NSAIDs unless prescribed" is patient advice; the SmPC itself only warns of severe hyperkalaemia. The action text now says this, so a prescriber is not misled.
- **`spironolactone:interaction:potassium-sparing` never fires.** The only master-list member of `potassium-sparing-diuretic` is spironolactone, and the engine skips a medicine paired with itself. It is harmless and kept for completeness.
- **`sildenafil:age:neonate-pphn` uses `maxYears: 1`.** "Neonate" is not defined in the SmPC, so the rule is broader than neonates. Its concern text limits it to PPHN.
- **The amlodipine contraindication now uses a specific condition**, `unstable-heart-failure-post-mi`. It fires only when that diagnosis is entered. Otherwise it shows under "diagnoses not yet excluded". This was chosen over showing "Contraindicated" for every recent MI.
- **Vocabulary overlap for the integrator.** `hereditary-fructose-intolerance` (batch E) and `hereditary-sugar-intolerance` (batch G) overlap. Batch B uses the first for the sorbitol (HFI-only) statement and the second for the sucrose statements. A patient recorded under only one of them misses the other's rules.
- **Single-strength SmPCs.** Amlodipine (Mylan 5 mg) and ISMN (Dexcel 20 mg IR, Imdur 60 mg, Elantan LA 25 mg) were each checked against one product SmPC. Other UK generics may word things differently.
- **ISMN alcohol** ("alcohol should be avoided") is a counselling item only, because alcohol is not a medicine in the list. The closest condition, `alcohol-dependence`, means something different.
- **Multiple system atrophy / autonomic failure** (sildenafil caution) and **hypothermia or malnutrition** (ISMN caution) have no condition id. They are in sections.
- **BNF/BNFC** were not accessed (geo-blocked). UKTIS monographs and NICE were not used.

## 3. Points from the original researcher: verdicts

- **"Should not be used" in SmPC 4.3, coded `contraindicated`** (ISMN IR and Elantan LA 4.3 lists; Viagra "men for whom sexual activity is inadvisable"). **Agree.** The brief counts a statement listed in section 4.3 as a contraindication. Imdur's "relative contraindications" are correctly `caution`.
- **Sildenafil–clarithromycin coded directly.** **Agree** (see section 2).
- **Child-only renal limits.** **Now encoded**: lisinopril, spironolactone suspension and spironolactone tablets.
- **Spironolactone tablet vs suspension.** Checked: indications (essential hypertension is suspension only), potassium and creatinine thresholds and units, GFR bands, and pregnancy wording ("should not be used unless benefit justifies risk" vs "not recommended", both `avoid`). These were already formulation-scoped correctly. One boundary was fixed and the suspension-only sucrose and contraception rules were added.
- **Nitrate + PDE5 contraindication.** Present in both directions (`isosorbide-mononitrate:interaction:pde5`, `sildenafil:interaction:nitrate`), sourced from all four relevant SmPCs.
- **ACE inhibitor + potassium-sparing diuretics / potassium supplements / trimethoprim / co-trimoxazole.** Present at `avoid` ("not recommended"). The spironolactone side has 2 rules (SmPC `avoid`, MHRA `caution`).
- **ACE inhibitor in pregnancy.** Trimester 1 is `avoid`, trimesters 2–3 are `contraindicated`, and there is an MHRA whole-pregnancy rule at `avoid`. Correct.
- **Aliskiren / dual RAAS blockade.** Not relevant to the master list; in sections only.

## 4. Overall assessment

- **Amlodipine.** Accurate. Doses, contraindications, hepatic advice and pregnancy and breastfeeding levels match the SmPC, SPS and BUMPS. The interaction with simvastatin (20 mg cap) is correct and agrees with MHRA. Before audit it was missing the malignant hyperthermia/dantrolene advice and over-applied the post-MI contraindication. It is now complete for the master list, within the limits above.
- **Lisinopril.** Accurate. The CrCl dosing table, heart failure and AMI titration, pregnancy by trimester and the 3 conflicting breastfeeding sources (SmPC/MHRA `avoid`, SPS `caution`) were all correct. Gaps were condition rules (diabetes, ischaemic heart or cerebrovascular disease, other angioedema history, surgery, recent kidney transplant), the paediatric GFR limit and the immunosuppressant (methotrexate) caution. These are now added.
- **Spironolactone.** The most complex file. It was carefully done and the formulation scoping was correct. Before audit, no rule fired on a kidney value for adult tablets (the SmPC gives no number). The paediatric renal contraindications were text only. That is now fixed through the SPS "severe renal impairment" rule and the age-limited rules. The remaining weakness is the potassium and creatinine thresholds, which the engine cannot test.
- **Isosorbide mononitrate.** Accurate in sections. The three SmPCs differ, and those differences were well scoped. The main error was a wrong-scope contraindication that flagged every recent MI. Several 4.3 and 4.4 items had no rule (toxic pulmonary oedema, low filling pressure, renal statements, excipients). These are now added. Renal and hepatic advice stays vague because the sources are vague.
- **Sildenafil.** Accurate. The ED and PAH products are kept apart correctly. The nitrate and riociguat contraindications, the CYP3A4 tiers (clarithromycin handled correctly), renal (CrCl < 30, ED only) and hepatic (Child-Pugh C contraindicated) rules are right. Gaps were the PAH contraception advice, excipient rules and the PAH fluid-depletion caution. These are now added.
