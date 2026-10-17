# Audit of batch C: atorvastatin, simvastatin, clopidogrel, warfarin, phytomenadione

Second checker, 2026-10-17. I read every batch C source in full: SmPC 4.1 to 4.9, plus 5.1 for class and 6.1 for excipients. The SmPCs are emc 1059, 5240, 7789, 10668, 5935, 2803, 14333, 9755 and 9754. I also read every MHRA, SPS and BUMPS page in `sources/C.json`.

For the reverse direction, I fetched the full text of all 151 sources in batches A, B, D, E, F and G. I searched them for warfarin/coumarin/vitamin K antagonist, statin/HMG-CoA, clopidogrel/antiplatelet and phytomenadione/vitamin K.

After the edits, `verify.mjs` reports: quotes 4532/4532 found, schema errors 0. An earlier run showed two batch-B/F sources with HTTP 429; this was temporary rate limiting, and they passed on re-run.

## 1. Changes

| File | Item / rule id | Before → after | Reason | Supporting quote |
|---|---|---|---|---|
| warfarin.json | `warfarin:interaction:antibacterial` | Rule on `group:antibacterial` (monitor) → **removed** | **Group sweep.** The SmPC names only "broad spectrum antibiotics". The group also includes dapsone (no warfarin statement in its SmPC), trimethoprim and others. The named antibiotics already have sourced rules on their own side: amoxicillin, co-amoxiclav, clarithromycin, ciprofloxacin and co-trimoxazole at monitor, and trimethoprim at info. The item text is kept. | emc-2803: "Broad spectrum antibiotics may potentiate the effect of warfarin by reducing the gut flora which produce vitamin K." |
| warfarin.json | `warfarin:interaction:trimethoprim` (new) | — → monitor, other `trimethoprim` (also covers co-trimoxazole through its ingredient) | **Missing rule.** Without it, the only trimethoprim–warfarin finding was the trimethoprim side at info. | mhra-tmp-tab-teva: "Trimethoprim may potentiate the anticoagulant effect of warfarin and other coumarins." + emc-2803 "Any change to medication … warrants increased monitoring of the INR." + SPS "INR test performed after 3 to 5 days" |
| warfarin.json | `warfarin:condition:surgery` | contraindicated → **caution**; action rewritten (stop 3 days before if severe bleeding risk; INR <2.5 otherwise; dental extraction: no need to stop) | **Wrong level.** The 4.3 contraindication is "within 72 h of major surgery with risk of severe bleeding". It is not "planned surgery". The old rule flagged a planned tooth extraction as contraindicated. | emc-2803: "For surgery where there is no risk of severe bleeding, surgery can be performed with an INR of <2.5." / "Warfarin need not be stopped before routine dental surgery, eg, tooth extraction." |
| warfarin.json + sources/C.json | `warfarin:condition:post-major-surgery-72h` (new), condition `post-major-surgery-72h` (new) | — → contraindicated | 4.3 contraindication now expressed exactly | emc-2803 / emc-14333: "Within 72 hours of major surgery with risk of severe bleeding" |
| warfarin.json | `warfarin:condition:alcohol` (new) | — → monitor (condition `alcohol-dependence`) | **Missing rule.** Alcohol is an INR-relevant factor in SmPC 4.5 and SPS. | emc-2803: "Acute ingestion of a large amount of alcohol may inhibit the metabolism of warfarin and increase INR." SPS: "Consider more frequent monitoring, for example every 1 to 2 weeks…" / "excessive alcohol consumption" |
| warfarin.json | interactions item "Antibiotics" | t now says no specific antibiotic is named | Avoids implying the statement covers named agents | as above |
| warfarin.json | formulation strengths | "…; other strengths exist" → "0.5 mg (Marevan); 5 mg (Strides generic)" | Unsourced claim removed | emc-2803 / emc-14333 composition lines |
| warfarin.json | indications item | added missing quote for TIA | t named TIA without a supporting quote | emc-2803: "Transient attacks of cerebral ischaemia." |
| atorvastatin.json | `atorvastatin:pregnancy` → `atorvastatin:pregnancy:smpc` | BUMPS quote removed from the contraindicated rule; congenital-anomaly quote added (it supports the consequence text) | **Source conflation.** SmPC says contraindicated; BUMPS says "usually avoided". These are different strengths, so they need separate rules (SCHEMA). | emc-1059: "Lipitor is contraindicated during pregnancy" / "Rare reports of congenital anomalies following intrauterine exposure to HMG-CoA reductase inhibitors have been received." |
| atorvastatin.json | `atorvastatin:pregnancy:bumps` (new) | — → avoid | Separate BUMPS rule | bumps-statins: "Statins are usually avoided in pregnancy if possible…" |
| atorvastatin.json + sources/C.json | `atorvastatin:condition:phenylketonuria` (new, `formulations: [atorvastatin-chew]`), condition `phenylketonuria` (new), cautions item + formulation note | — → caution | **Missing warning.** The chewable tablet contains aspartame. The batch had not captured this. | emc-5240: "Lipitor chewable tablet contains aspartame which is a source of phenylalanine. May be harmful for people with phenylketonuria." |
| atorvastatin.json | `atorvastatin:age:over-70` (new) | — → monitor (`minYears: 70`) | **Missing rule.** 4.4 risk factor for baseline CK. Simvastatin already had the equivalent ≥65 rule. | emc-1059: "In elderly (age > 70 years), the necessity of such measurement should be considered" |
| atorvastatin.json | formulation strengths (both) | "10, 20, 40, 80 mg" / "10, 20 mg" → "10 mg (strength covered by the SmPC used)" | **Unsupported numbers.** The cited SmPCs are the 10 mg products only. | emc-1059 / emc-5240 composition lines |
| atorvastatin.json | chewable formulation src | added composition quote | supports strength | emc-5240: "Each chewable tablet contains 10 mg atorvastatin…" |
| atorvastatin.json, simvastatin.json | `…:condition:hypothyroidism` | SPS advice added to action and src | Source says more than "measure CK" | SPS statins monitoring: "Manage hypothyroidism adequately before starting a statin." |
| simvastatin.json | `simvastatin:interaction:clarithromycin` | First SmPC quote replaced | **Truncated quote.** The quote stopped before "is contraindicated", so the SmPC quote alone did not prove the level. | emc-7789: "Combination with … clarithromycin, telithromycin, nefazodone and medicinal products containing cobicistat is contraindicated" |
| simvastatin.json | `simvastatin:pregnancy` → `simvastatin:pregnancy:smpc` + new `simvastatin:pregnancy:bumps` (avoid); BUMPS item gains its "usually avoided" quote | Same split as atorvastatin | **Source conflation** | emc-7789 / bumps-statins |
| simvastatin.json | `simvastatin:hepatic:any` (new) | — → caution | **Missing rule.** The hepatic section existed but there was no hepatic rule, so hepatic impairment never fired for simvastatin. | SPS liver: "The use of statins is cautioned in patients with a history of liver disease" / "…statins can be used with caution after assessing individual risks and benefits" |
| simvastatin.json | `simvastatin:age:10-17` (new) | — → dose (10 to <18 y) | **Missing paediatric dose cap** | emc-7789: "The recommended dosing range is 10-40 mg/day; the maximum recommended dose is 40 mg/day." |
| clopidogrel.json | `clopidogrel:pregnancy:smpc` | caution → **avoid**; BUMPS quote moved out | **Wrong level and conflation.** "Preferable not to use … as a precautionary measure" recommends against use, so it is avoid, not caution. BUMPS (permissive) was mixed into the same rule. | emc-5935: "it is preferable not to use clopidogrel during pregnancy as a precautionary measure" |
| clopidogrel.json | `clopidogrel:pregnancy:bumps` (new) | — → caution | Separate BUMPS rule (benefit > risk; PPH at term; LMWH switch) | bumps-clopidogrel: "Clopidogrel will only be recommended in pregnancy if the benefits … outweigh any possible risks…" |
| clopidogrel.json | `clopidogrel:condition:gi-lesions` | action now states that active bleeding (e.g. bleeding peptic ulcer) is contraindicated | The condition id covers "active or history". The caution level alone understated active bleeding. The contraindication also fires through `active-bleeding`. | emc-5935: "Active pathological bleeding such as peptic ulcer or intracranial hemorrhage." |
| phytomenadione.json | paediatric item "Children: warfarin reversal" | weight limits added | **Omitted condition.** The paediatric ampoule suits the 30 micrograms/kg dose only above 13 kg, and the 250–300 micrograms/kg dose only above 1.6 kg. | emc-9754: "…only suitable for the administration of doses of 30 micrograms/kg in children weighing over 13 kg" |
| sources/C.json | sources, conditions, notes | added `mhra-tmp-tab-teva` (same id and URL as batch F), conditions `phenylketonuria` and `post-major-surgery-72h`, audit note; group-dependency note corrected | bookkeeping | — |

Changes by type:

| Type | Count |
|---|---|
| Wrong level | 2 (warfarin planned surgery; clopidogrel pregnancy) |
| Group sweep | 1 (warfarin `group:antibacterial`) |
| Missing rules | 10 |
| Source conflation split | 3 |
| Weak or truncated quote | 3 (simvastatin–clarithromycin; warfarin indication; clopidogrel GI lesions) |
| Unsupported number | 3 (strength fields) |
| Omitted condition | 1 (phytomenadione weight limits) |
| Enrichment | 2 (SPS hypothyroidism advice on both statins) |

## 2. Checked and left as is (deliberately)

- **Atorvastatin + clarithromycin (avoid):** level matches the SmPC ("should be avoided if possible"). The 20 mg cap in the action is attributed to SPS (2024) and MHRA DSU (2008). In the Lipitor SmPC itself, Table 1 is merged-cell. In flat text the lopinavir/ritonavir recommendation ("lower maintenance doses … At atorvastatin doses exceeding 20 mg, clinical monitoring") sits next to the clarithromycin row. The SmPC therefore gives no explicit 20 mg maximum for clarithromycin; it says "lower starting and maximum doses … should be considered". The clarithromycin SmPC (batch E) adds "lowest registered dose of the statin". These are kept as attributed statements, not merged.
- **Simvastatin + amlodipine (dose, max 20 mg/day):** matches the Zocor SmPC, MHRA 2012 and the amlodipine SmPC. The MHRA 2008 article's simvastatin caps (diltiazem 40 mg) are superseded and are not used. Simvastatin + clarithromycin is contraindicated (SmPC 4.3, SPS and the clarithromycin SmPC).
- **Simvastatin renal:** `CrCl < 30` (dose, SmPC) and `eGFR < 30` (caution, SPS) are both kept, with separate measures. Both use `max: 30` without maxInclusive, which is correct for "<30" / "less than 30".
- **Statin breastfeeding** (SmPC contraindicated vs SPS caution) and **clopidogrel breastfeeding** (SmPC avoid vs SPS caution): already separate rules at the right levels.
- **Warfarin `group:nsaid` (avoid), `group:ssri` (avoid), clopidogrel (avoid), statins (monitor), omeprazole/paracetamol (monitor):** levels match Marevan 4.5. NSAID members (ibuprofen, naproxen) and SSRI member (sertraline) are correct.
- **Warfarin `group:oral-antidiabetic` (metformin) and `group:diuretic` (spironolactone), monitor:** sourced only by the class words in Marevan ("diuretics, oral anti-diabetic agents"). The Strides SmPC omits them, and neither the metformin nor the spironolactone SmPC mentions warfarin. The rules are kept because they match the Marevan wording and the concern says "Marevan SmPC only", but this is a weak, class-level basis.
- **Warfarin `group:corticosteroid`:** has no members in the master list, so it never fires. This is harmless.
- **Clopidogrel + ciprofloxacin (avoid):** sourced only from MHRA DSU April 2010 ("CYP2C19 inhibitors include … ciprofloxacin"). The current Plavix SmPC list of strong or moderate CYP2C19 inhibitors does not include ciprofloxacin and calls the clinical relevance uncertain. The ciprofloxacin SmPC (batch E) says nothing about clopidogrel or CYP2C19. The level is kept because it is the strength of the only UK source that names the pair; the action already says it is not in the current SmPC.
- **Reverse-direction interactions present only on the other side, which the engine evaluates both ways:** warfarin with clarithromycin, ciprofloxacin, amoxicillin, co-amoxiclav, levothyroxine (dose) and tramadol (both sides). St John's wort with atorvastatin, simvastatin and warfarin is avoid/contraindicated on the SJW side from the THR SmPCs. Sildenafil (Revatio, PAH) with VKA is on the sildenafil side only. Methotrexate with statins is on the methotrexate side only.

### Coordinator cross-checks (2026-10-17)

- **Engine: `med` now matches only the medicine itself.** No batch C rule relied on ingredient matching for `med`; all five medicines have a single ingredient. Ingredient matching on `other` still makes `warfarin:interaction:paracetamol` cover co-codamol and `warfarin:interaction:trimethoprim` cover co-trimoxazole. Both are intended: those products contain the named ingredient.
- **Warfarin group rules:**
  - `group:antibacterial` has been removed (see table).
  - `group:oral-antidiabetic` covers metformin only, and `group:diuretic` covers spironolactone only. Marevan names these classes ("diuretics, oral anti-diabetic agents") and no specific agents, so the class rules are kept. Both members belong to the named class.
  - `group:corticosteroid` has no members.
  - Clopidogrel's `group:opioid` (codeine, co-codamol, tramadol) matches the SmPC's "opioid agonists" and is set to info.
- **Timing interactions at `dose`:** none. The only `dose` rules are real dose changes:
  - simvastatin with amlodipine, max 20 mg;
  - simvastatin CrCl <30, doses above 10 mg carefully considered;
  - simvastatin age 10–17, max 40 mg;
  - warfarin in protein C deficiency, no loading dose.
  The bile-acid sequestrant spacing for simvastatin is a dosing item only.
- **Renal boundaries:** every source says "less than 30" or "< 30". This is encoded as `max: 30` without maxInclusive, with the source's measure: atorvastatin SPS eGFR, simvastatin SmPC CrCl, and simvastatin SPS eGFR. No "≤" or range thresholds exist in batch C.

## 3. Problems found but not fixable

- **Dose caps that are not interactions with master-list medicines** stay as items only, because the other drug is not in the master list: atorvastatin with glecaprevir/pibrentasvir (contraindicated) and fusidic acid; simvastatin with gemfibrozil, ciclosporin, danazol, other potent CYP3A4 inhibitors, fusidic acid, verapamil, diltiazem and amiodarone; warfarin with fibrinolytics.
- **Risk factors with no matching condition id** can only be text: female sex, Asian ancestry, SLCO1B1 CC genotype, prior statin muscle toxicity, hereditary muscle disorder. The warfarin bleeding risk factors (anaemia, cerebrovascular disease, falls, malignancy) were not turned into rules; the SmPC gives no action beyond "may benefit from more frequent INR monitoring".
- **Clopidogrel thienopyridine cross-allergy:** ticlopidine and prasugrel are not in the master list, so only the own-ingredient allergy rule exists.
- **Age boundary for atorvastatin "> 70 years"** is encoded as `minYears: 70`, because the engine's lower bound is inclusive. A patient aged exactly 70 is flagged one year early, at monitor level only.
- **Formulations not covered** (no SmPC read): warfarin oral suspension and other tablet strengths, simvastatin oral suspension, clopidogrel 300 mg tablets, atorvastatin strengths other than 10 mg, Neokay, and generic phytomenadione.
- **SmPC vs SPS/BUMPS conflicts on breastfeeding and pregnancy** show as two rows. The top level is the SmPC's stricter one (contraindicated or avoid). That is faithful to the sources, but users will see apparently contradictory advice by design.

## 4. Overall assessment

- **Atorvastatin:** Accurate. Every 4.3 contraindication is encoded, except glecaprevir/pibrentasvir, which is not in the master list. The interaction levels match the source. Gaps were the chewable-tablet aspartame warning, the >70 CK point and the pregnancy source mixing; all three are now fixed. The clarithromycin 20 mg cap depends on SPS/MHRA wording, not the SmPC table.
- **Simvastatin:** Accurate on the high-risk points: the clarithromycin contraindication, the amlodipine 20 mg cap, and CrCl vs eGFR kept apart. It was missing a hepatic rule, so impairment never fired, and the adolescent 40 mg cap; both are now added. One key quote was truncated and has been fixed.
- **Clopidogrel:** Mostly accurate and complete for the master list: omeprazole, warfarin, NSAIDs, SSRIs, opioids, hepatic, renal, age and breastfeeding. The pregnancy level was understated and mixed with BUMPS; this is now fixed. The clopidogrel–ciprofloxacin rule rests on a 2010 MHRA list only (see section 2).
- **Warfarin:** This was the file with the most significant errors. A group rule swept in dapsone and every other antibacterial, and planned surgery was flagged as contraindicated. Both are fixed, and the 72-hour contraindication is now exact. The trimethoprim and alcohol rules were missing and are added. The other interactions are now sourced on at least one side. The class-level antidiabetic and diuretic rules have a weak basis (see section 2).
- **Phytomenadione:** Accurate. The contraindications (hypersensitivity; IM route for the 10 mg/ml product, stated as a formulation note), the mechanical-valve rule, the hepatic monitoring and the paediatric doses all match the SmPCs. The only fix was the omitted weight limits for the paediatric warfarin-reversal doses.

I make no claim beyond the SmPCs, MHRA, SPS and BUMPS pages listed. BNF/BNFC was not accessed.
