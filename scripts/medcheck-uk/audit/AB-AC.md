# Audit: batches AB and AC

Independent second check, 2026-10-17. Batch AB was audited directly and batch AC by a parallel checker; both followed the same brief. Edits were confined to the 12 medicine files, sources/AB.json and sources/AC.json.

## Batch AB (metronidazole, tinidazole, clindamycin, moxifloxacin, levofloxacin, mebendazole)

Every SmPC used by AB was re-read from the shared cache: sections 4.1 to 4.6 in full, plus 4.8 where an item depends on it. That is emc 12348, 13521, 13016, 101002, 1210, 1080, 6771, 12153, 975 and 976, and the MHRA clindamycin 100 mg pessary SPC. The SPS metronidazole breastfeeding page and the SPS QT list were also re-read. After the edits, all 638 AB quotes (medicine files plus AB group members) are FOUND and the schema check shows 0 errors for AB.

### AB changes

| # | File | Item / rule | Before → after | Reason | Supporting quote (all FOUND) |
|---|---|---|---|---|---|
| 1 | metronidazole.json | rules `cockayne-500mg-smpc`, `epilepsy-500mg-smpc`, `pregnancy:first-trimester-500mg-smpc`, `breastfeeding:high-dose-500mg-smpc` | no formulation scope → `formulations: ["metronidazole-tab"]`; concern now says "tablets: one UK SmPC, 500 mg tablets" and states the subgroup ("only when treating trichomoniasis or BV", "only after single high-dose therapy") | The stricter 500 mg tablet SmPC fired for the oral suspension too. The suspension has its own SmPC (emc 101002), which does not list these in 4.3. | emc-13016 "Pregnancy - metronidazole should not be used in the first trimester in patients with trichomoniasis or bacterial vaginosis"; "Breast feeding should be discontinued for 12-24 hours when single high dose (e.g. 2g) therapy is used"; "Patients with Cockayne syndrome (see section 4.8)" |
| 2 | metronidazole.json | contraindications[1], cautions[3], pregnancy[1], breastfeeding[1] | unscoped → tablet only; contraindications[1] text names the tablet scope | Same as #1 | as #1 |
| 3 | metronidazole.json | `metronidazole:hepatic:severe` | level dose → info; action rewritten; encephalopathy quote removed from this rule | The SmPCs give no action for advanced hepatic insufficiency itself. The one-third dose is for hepatic encephalopathy, which has its own `dose` rule. | emc-13521 "Substantial impairment of metronidazole clearance may occur in the presence of advanced hepatic insufficiency." |
| 4 | metronidazole.json | `metronidazole:condition:hepatic-encephalopathy` | effect `hepatotoxicity` → none | Wrong cumulative tag. The risk is drug accumulation adding to encephalopathy, not liver injury. | emc-101002 "Significant cumulation may occur in patients with hepatic encephalopathy" |
| 5 | metronidazole.json | `metronidazole:breastfeeding:sps` | quote added | `sourceWording` "Use with caution" was not backed by a quote | sps-bf-metronidazole "Use with caution Short courses of oral metronidazole, can be used during breastfeeding, but infant monitoring is required." |
| 6 | metronidazole.json | paediatric[2] | text and quote | "Not more than 2000 mg per dose" was unquoted. The tablet SmPC prints "2000 mg/kg dose"; the suspension SmPC says 2000mg/dose. Both are now stated. | emc-101002 "15 - 30mg/kg/day divided in 2 - 3 doses not to exceed 2000mg/dose" |
| 7 | clindamycin.json | formulation `clindamycin-vag-ovule` note | quote added | "Roughly 7 times more than the cream" was not quoted | mhra-pl35533-0315-spc "systemic absorption of the suppository was approximately 7-fold greater than that following dosing of the vaginal cream" |
| 8 | clindamycin.json | cautions[2] (inflammatory bowel disease) | "Vaginal forms: caution" → pessary caution; cream contraindicated in 4.3 (its 4.4 also says caution) | Misleading for the cream. Its 4.3 contraindicates a history of IBD. | emc-1080 "This medicine is also contraindicated in individuals with a history of inflammatory bowel disease"; mhra-pl35533-0315-spc "Caution is advised in patients when prescribing Clindamycin 100 mg Pessaries to individuals with Inflammatory Bowel Disease…" |
| 9 | clindamycin.json | `clindamycin:pregnancy:vaginal-second-third` | pessary quote added | The rule covers the ovule but quoted only the cream | mhra-pl35533-0315-spc "Clindamycin 100 mg Pessaries may be used to treat pregnant women if clearly necessary during the second and third trimester of pregnancy." |
| 10 | moxifloxacin.json | `moxifloxacin:interaction:iron` | other `group:iron-preparation` → ingredient `iron` | The SmPC says "agents containing iron". The group misses iron-polymaltose-b-complex, and that file (now no-uk-product) no longer has its own quinolone rule. | emc-6771 "…sucralfate and agents containing iron or zinc) and administration of moxifloxacin." |
| 11 | levofloxacin.json | `levofloxacin:interaction:iron` | other `group:iron-preparation` → ingredient `iron` | Same as #10. The SmPC says "preparations containing divalent or trivalent cations such as iron salts". | emc-12153 "It is recommended that preparations containing divalent or trivalent cations such as iron salts" |
| 12 | mebendazole.json | `mebendazole:age:1-to-2` | caution → avoid; action and consequence rewritten; quote added | Wrong level. Section 4.4 opens with "Not recommended" for under 2 years. The stronger statement sets the level; "only if benefit justifies risk" stays in the action. | emc-975 "Not recommended in the treatment of children under 2 years" |
| 13 | mebendazole.json | paediatric[0] | "not recommended under 2 years" added with quote | Same as #12 | as #12 |
| 14 | mebendazole.json | new `mebendazole:hepatic:any` | — → info | Missing hepatic rule. The SmPC states higher levels but gives no dose advice. | emc-975 "Impaired hepatic function, impaired metabolism, or impaired biliary elimination may lead to higher plasma levels of mebendazole." |
| 15 | sources/AB.json | notes | audit addendum appended | Records #1 to #14 and the tinidazole confirmation | — |

AB counts by type:
- Formulation scope added: 4 rules + 4 items (#1, #2).
- Wrong level: 2 (#3 dose → info, #12 caution → avoid).
- Wrong effect tag: 1 (#4).
- Group/target fix: 2 (#10, #11).
- Missing rule: 1 (#14).
- Unsupported or misleading text fixed: 6 (#5 to #9, #13).
- Notes: 1 (#15).

### AB flagged items checked (no change needed)

- **Tinidazole no-uk-product: confirmed.**
  - emc search for "tinidazole" and for the clinic trade name: "No search results".
  - The clinic-linked emc product 1066 returns 404.
  - MHRA Products search index (product name and full text, all document types) has no tinidazole product. The 212 full-text hits are other products that mention it.
  - The file follows SCHEMA: no-uk-product status, a note, all sections not-available, `rules: []`, and a formulation with no `src`. It is not in the nitroimidazole group.
- **Clindamycin 100 mg vaginal capsule (ovule) → UK 100 mg pessary SPC (PL 35533/0315): acceptable.**
  - Same salt (clindamycin phosphate), same 100 mg dose, same route and indication.
  - The SPC is current (MHRA index entry 2026-09-11).
  - The pessary is a semisolid suppository, not a soft capsule. The formulation note says this information comes from the pessary SPC.
- **Clindamycin systemic rules:** warfarin, CYP3A4 inducers and inhibitors, nephrotoxic drugs, and renal monitoring are all scoped to `clindamycin-cap`. The allergy rule correctly covers every form.
- **Metronidazole and the QT group:** metronidazole is correctly left out of `qt-prolonging`. SPS does not list it. Its SmPCs report QT prolongation "particularly when … administered with drugs with the potential for prolonging the QT interval" (frequency not known), which is not a statement that it prolongs QT at therapeutic doses. The QT interaction rule stays `info`, because the SmPC states no action.
- **Fluoroquinolone and QT groups:**
  - `fluoroquinolone` = ciprofloxacin, levofloxacin, moxifloxacin. The ear drops (ciprofloxacin-hydrocortisone-ear) are not a member, which is correct.
  - Moxifloxacin and levofloxacin both belong in `qt-prolonging`: the SPS list names both, the moxifloxacin SmPC 4.3 states QT prolongation, and the levofloxacin SmPC 4.8 lists "electrocardiogram QT prolonged".
  - `corticosteroid` holds only oral dexamethasone and prednisolone, so the fluoroquinolone "avoid corticosteroids" rules do not fire for inhaled or topical steroids.
- **Moxifloxacin 4.3 subgroup contraindications:** "clinically relevant heart failure with reduced LVEF", "clinically relevant bradycardia" and "uncorrected hypokalaemia" use the general conditions. The qualifier is in each concern.
- **Levofloxacin renal bands:** 50-20 → min 20, max 50, `maxInclusive` true (SmPC "≤50"); 19-10 → [10, 20); <10 → max 10. CrCl is the measure throughout. Correct.
- **Mebendazole + metronidazole:** the avoid rule sits only on mebendazole. The engine checks both directions, so it fires when both are selected.

### AB problems not fixed

- **Moxifloxacin, bradycardia:** 4.5 advises caution with "medication that is associated with clinically significant bradycardia". No sourced group exists. Mapping it to beta-blockers, verapamil or diltiazem would be inference, so there is no rule. The item text covers it.
- **Levofloxacin, seizure threshold:** "other agents which lower the seizure threshold" has no group. Only NSAIDs are coded.
- **Not in the master list, so no rule possible:**
  - metronidazole: lithium, ciclosporin/tacrolimus, phenytoin/phenobarbital, disulfiram, busulfan, 5-fluorouracil;
  - clindamycin: neuromuscular blockers;
  - mebendazole: cimetidine;
  - levofloxacin: probenecid/cimetidine.
- **Metronidazole suspension:** hydroxybenzoate (paraben) hypersensitivity in 4.3 has no allergen id.
- **Duplicate firing (cosmetic):** moxifloxacin and levofloxacin + aluminium-magnesium-hydroxide fire twice, once through `group:magnesium-preparation` and once by exact id. Both are `caution`.
- **Calcium conflict (for the integrator):**
  - Both quinolone SmPCs say calcium has no or minimal effect: moxifloxacin "calcium supplements" (no interaction) and levofloxacin "Calcium salts have a minimal effect".
  - The calcium-carbonate and calcium-carbonate-colecalciferol files (other batches) carry caution rules against `group:fluoroquinolone` from the calcium SmPCs.
  - Both views are UK-sourced, so they stay.

### AB per-medicine assessment

- **Metronidazole: good after fixes.**
  - Dosing, paediatric bands, interactions and the SmPC/SPS/BUMPS conflicts are faithful.
  - The main defect was the stricter 500 mg tablet SmPC contraindications also firing for the suspension. These are now tablet-only.
  - Residual: Cockayne syndrome shows two levels on the tablet (contraindicated from the 500 mg SmPC, avoid from the 200 mg SmPCs) and caution on the suspension. This is intentional (conflicting UK sources, kept apart).
- **Tinidazole: correct as no-uk-product.**
- **Clindamycin: good.** The capsule, cream and pessary-proxy content is correctly separated and scoped. The text fixes were minor.
- **Moxifloxacin: good.**
  - All 4.3 contraindications are rules: QT, electrolytes, bradycardia, HFrEF, arrhythmia, QT drugs, TCAs, Child-Pugh C, transaminases above 5×ULN, pregnancy, breastfeeding, under 18, quinolone tendon disease.
  - The MHRA 2024 restrictions are present. The only change was the iron target.
- **Levofloxacin: good.** The renal bands, all 4.3 items (including epilepsy), the QT cautions and the MHRA content were checked. The only change was the iron target.
- **Mebendazole: good after fixes.** The age 1-2 level was understated. A hepatic info rule was added.


## Batch AC (fluconazole, miconazole, aciclovir, oseltamivir, fenticonazole, nystatin)

Independent second check, 2026-10-17. I re-read in full, from the shared cache, SmPC sections 4.1 to 4.6 (and 4.8 where items cite it) of every AC source: emc 1065, 14746, 6597, 443, 14745, 5468, 1634, 2352, 5470, 1194, 9108, 408, 100765, the MHRA Products SPCs for miconazole vaginal cream and fenticonazole 600 mg, MHRA DSU 2016 and 2017, the SPS QT page (triazole section), and BUMPS fluconazole. I also read 4.5 of atorvastatin (emc 1059), clarithromycin (emc 7072) and domperidone (emc 3188) for the cross-references. After the edits, all 525 AC quotes are FOUND, and the schema check shows 0 errors overall and 0 for AC. An in-memory engine run confirms the corrected behaviour (scenarios below).

### AC 1. Changes

| # | File | Item / rule | Before → after | Reason | Quote (all FOUND) |
|---|---|---|---|---|---|
| 1 | miconazole.json | `miconazole:interaction:atorvastatin-gel` | contraindicated → **info**; concern, consequence, action and sourceWording rewritten | The contraindication was inferred by combining two SmPCs. No UK source names atorvastatin with miconazole. The atorvastatin SmPC lists potent inhibitors and moderate inhibitors (fluconazole), not miconazole. The rule now says only what the sources say. | emc-14746 "Miconazole can inhibit the metabolism of drugs metabolised by the CYP3A4 and CYP2C9 enzyme systems." + "This can result in an increase and/or prolongation of their effects, including adverse effects." + "HMG-CoA reductase inhibitors such as simvastatin and lovastatin"; emc-1059 "Atorvastatin is metabolised by cytochrome P450 3A4 (CYP3A4)" |
| 2 | miconazole.json | interactions item 0 (oral gel: contraindicated) | Was "(Atorvastatin is not named; its own SmPC says it is metabolised by CYP3A4.)". Now also says no UK source gives a level for the pair. | Matches #1 | same |
| 3 | miconazole.json | `miconazole:condition:swallowing` | Was a blanket contraindication for the condition `swallowing-difficulty`, which also covers adult dysphagia. Now has an extra age limit (under 2 years) and an infant-specific concern. | Subgroup contraindication: the 4.3 text is about infants. The 2-year limit follows the SmPC's choking population (stated in the action). | emc-14746 "In infants less than 4 months of age or in those whose swallowing reflex is not yet sufficiently developed"; "Particularly in infants and young children (aged 4 months - 2 years), caution is required, to ensure that the gel does not obstruct the throat." |
| 4 | fluconazole.json | `fluconazole:breastfeeding` | concern "Breastfeeding" → "Breastfeeding after repeated or high doses (a single 150 mg dose is compatible)" | Avoid level, but only after repeated or high doses. The clinic product is the 150 mg capsule. | emc-1065 "Breast-feeding may be maintained after a single dose of 150 mg fluconazole." / "Breast-feeding is not recommended after repeated use or after high dose fluconazole." |
| 5 | fluconazole.json | `fluconazole:interaction:simvastatin`, `:atorvastatin` | Quotes added | The action text ("stop the statin…", "a lower statin dose may be needed") had no quote in the simvastatin rule, and the lower-dose part had none in either rule | emc-1065 "HMG-CoA reductase inhibitors should be discontinued if a marked increase in creatine kinase is observed or myopathy/rhabdomyolysis is diagnosed or suspected." / "Lower doses of HMG-CoA reductase inhibitors may be necessary as instructed in the statins prescribing information." |
| 6 | fluconazole.json | new `fluconazole:interaction:hydrochlorothiazide` (info) + interactions item | — → info | Missing master-list interaction (4.5). It also matches the hydrochlorothiazide combinations by ingredient. | emc-1065 "coadministration of multiple-dose hydrochlorothiazide to healthy volunteers receiving fluconazole increased plasma concentration of fluconazole by 40%" / "An effect of this magnitude should not necessitate a change in the fluconazole dose regimen in subjects receiving concomitant diuretics." |
| 7 | aciclovir.json | new `aciclovir:age:neonate-cream` (avoid, cream only, age <0.0767 y) + cautions item | — → avoid | Missing 4.4 "do not use" statement. The concern states the qualifier (open wounds or large areas of broken skin). | emc-5468 "This medicine contains 400 mg of propylene glycol per gram of product." / "Do not use this medicine in neonates with open wounds or large areas of broken or damaged skin (such as burns)." |
| 8 | aciclovir.json | `aciclovir:pregnancy:smpc` | Cream SmPC quote added | The rule applies to all forms, but it only had the oral SmPC quote | emc-5468 "The use of Zovirax Cream should be considered only when the potential benefits outweigh the possibility of unknown risks however the systemic exposure to aciclovir from topical application of Zovirax Cream is very low." |
| 9 | oseltamivir.json | pregnancy item 0 + `oseltamivir:pregnancy` | Qualifier and quotes added | A source qualifier was missing: one study was not conclusive for major congenital heart defects. The rule's statement that influenza itself carries risk had no quote. | emc-1194 "the results for major congenital heart defects diagnosed within 12 months of birth were not conclusive." / "Influenza is associated with adverse pregnancy and foetal outcomes" |
| 10 | fenticonazole.json + sources/AC.json | groups; className | `["antifungal"]` → `["azole-antifungal","imidazole-antifungal","antifungal"]`; className "Antimycotic for vaginal use" → "Imidazole antifungal for vaginal use" | The SPC does state its class (5.3). The miconazole, clotrimazole and miconazole-hydrocortisone imidazole allergy rules and the fluconazole azole allergy rule now catch a fenticonazole allergy. It is a vaginal (local) product, so systemic group interaction rules skip it. | mhra-gynoxin-600 "Studies in reproductive toxicology revealed, as for other imidazole derivatives, an embryolethal effect at high dosages" |
| 11 | fenticonazole.json | `fenticonazole:condition:peanut-soya` + contraindications item 0 | Level kept (contraindicated). The concern, consequence and action now say the soya lecithin is an excipient of the UK 600 mg capsule, so check the excipients of the supplied product. | The clinic product (1000 mg vaginal tablet) is a different product, and its excipients are not known from a UK source. | mhra-gynoxin-600 "Gynoxin contains soya lecithin." / "This medicinal product should not be used in patients allergic to peanut or soya." |
| 12 | sources/AC.json | notes | "AUDIT 2026-10-17 (AC)" addendum; earlier "INFERRED RULES" and "fenticonazole not in azole groups" notes marked superseded | Record for integrator | — |

**Counts by type**
- Wrong level (inference removed): 1 (#1).
- Over-broad or subgroup contraindication or avoid qualified: 3 (#3, #4, #11).
- Missing rules: 2 (#6, #7).
- Missing qualifier or unsupported text fixed with quotes: 4 (#2, #5, #8, #9).
- Group membership: 1 medicine added to 2 groups (#10).
- New section items: 2 (#6, #7).

**Engine check (in-memory KB, no build):**
- Miconazole gel + atorvastatin: info.
- Miconazole gel + simvastatin: contraindicated.
- Miconazole gel + warfarin: contraindicated + caution.
- Miconazole cream or vaginal + warfarin: caution.
- Miconazole cream + simvastatin or gliclazide: none.
- Fluconazole + clarithromycin or domperidone: contraindicated.
- Aciclovir cream + methotrexate: none.
- Fenticonazole + warfarin or nifedipine: none.
- Fenticonazole allergy → miconazole and fluconazole: contraindicated.

### AC 2. Reviewed, no change

- **Miconazole oral gel and warfarin.**
  - Two rules are kept, both scoped to the oral gel:
    - contraindicated: sugar-free gel SmPC 4.3 lists warfarin; MHRA 2017 says over-the-counter gel must not be used with warfarin;
    - caution: prescription gel SmPC 4.4/4.5.
  - Each concern names its source subgroup. Cream and vaginal forms have caution rules from their own SmPCs.
  - Warfarin's own `warfarin:interaction:miconazole` (caution, no otherFormulations) also fires for cream and vaginal forms. That is consistent with those SmPCs, so it is not over-firing.
- **Substitutions.**
  - Miconazole 400 mg pessary → UK miconazole nitrate 20 mg/g vaginal cream (MHRA Products PL 00242/0015).
  - Fenticonazole 1000 mg vaginal tablet → UK fenticonazole nitrate 600 mg vaginal capsule (PL 04595/0008).
  - Both are the same active and the same vaginal route, and both are on MHRA Products. The formulation notes state that UK dosing does not apply. This is acceptable under SCHEMA "different strength or route" use.
- **Nystatin ointment.**
  - The emc search for "nystatin" returns only oral suspensions and combination products, so there is no UK nystatin-only skin product.
  - No item or rule is scoped to the ointment. All rules carry `formulations: ["nystatin-oral-susp"]`.
- **Routes.**
  - Miconazole gel is oromucosal, cream cutaneous, vaginal vaginal. Aciclovir cream is cutaneous. Fenticonazole is vaginal. All match the engine's LOCAL_ROUTE.
  - Nystatin suspension is oral (swallowed). It is not in any systemic interaction group, so this has no effect.
- **qt-cyp3a4-substrate.**
  - Members are clarithromycin and domperidone. QT prolongation and CYP3A4 metabolism are both quoted from their own SmPCs.
  - The clarithromycin CYP3A metabolism quote is indirect: CYP3A inducers induce its metabolism. It is acceptable.
  - The clarithromycin SmPC says that with fluconazole "No clarithromycin dose adjustment is necessary". This is a pharmacokinetic statement and does not conflict with the fluconazole 4.3 QT contraindication.
  - Candidates not evaluated: ondansetron, diltiazem, escitalopram, amitriptyline. Fluconazole + any `qt-prolonging` member still gets "avoid" (SPS "Do not co-prescribe").
- **Fluconazole renal and QT.**
  - Renal: CrCl ≤50 with `maxInclusive: true` matches the table. Single-dose exemption is in the action.
  - QT: SPS triazole wording "Do not co-prescribe…" → avoid is correct.
  - Other 4.5 items (theophylline, phenytoin, tacrolimus, etc.) are not master-list medicines. Prednisone is not prednisolone, so no rule.
- **Oseltamivir renal bands.**
  - The SmPC uses ">30 to 60", ">10 to 30" and "≤10". The schema has no exclusive minimum, so the rules overlap at exactly 30 and exactly 10.
  - The actions say which band applies, so this is acceptable. All three rules carry age ≥13.
- **Aciclovir scoping.**
  - Renal, nephrotoxic, excipient and hepatic rules are scoped to the tablets and suspension.
  - Allergy and pregnancy rules apply to all forms. Both the cream and oral SmPCs support them.

### AC 3. Problems not fixed (for the integrator / other batches)

1. **Other batches' `group:cyp3a4-inhibitor` rules now fire for fluconazole**, which is a sourced "moderate CYP3A4 inhibitor". Several fire at **avoid**:
   - budesonide-nebuliser
   - dexamethasone
   - prednisolone
   - fluticasone-propionate-salmeterol
   - fluticasone-propionate-formoterol
   - lercanidipine
   - mometasone-nasal
   - neomycin-polymyxin-dexamethasone-eye

   Their concerns cite "e.g. clarithromycin" or "potent" inhibitors. Each owner should confirm that the SmPC wording covers moderate inhibitors. If not, they should move the rule to `strong-cyp3a4-inhibitor`.
2. **The `dihydropyridine` group (batches B/L/N) lacks telmisartan-amlodipine and amlodipine-valsartan-hydrochlorothiazide.** So `miconazole:interaction:dihydropyridine-gel` / `-vaginal` do not fire for them.
3. **Group rules on `azole-antifungal` never fire for miconazole oral gel**, because its route is oromucosal (local). The gel's own explicit rules cover warfarin, sulfonylureas, dihydropyridines, verapamil, simvastatin, carbamazepine, sildenafil and QT/CYP3A4 drugs. They do not cover these rules from other medicines' SmPCs:
   - mirtazapine (azole, dose)
   - norethisterone (info)
   - nifedipine, amlodipine and perindopril-amlodipine (azole, monitor)

   The owners should decide whether their SmPC wording ("azole antifungals") is meant to cover oral gel. If so, they should add an explicit `other: "miconazole", otherFormulations: ["miconazole-oral-gel"]` rule.
4. **No per-formulation "no UK product" flag.** The engine cannot mark only the nystatin ointment as unchecked. It shows as "clear" (no rules) while the medicine is `availability: uk`. The miconazole 400 mg pessary and fenticonazole 1000 mg tablet use UK proxies for other forms of the same active, so their checks are proxy-based.
5. **Amitriptyline vs fluconazole level conflict** is already kept as two rules: amitriptyline SmPC avoid, fluconazole SmPC monitor. No action needed.

### AC 4. Per-medicine assessment

- **Fluconazole: good.**
  - The SmPC is complete and faithful. 4.3 is fully expressed (allergy, QT/CYP3A4 group; terfenadine is not in the master list).
  - Interactions with master-list medicines are complete after #6. Levels match the source.
  - Main residual risk: the QT/CYP3A4 group has only 2 members (conservative).
- **Miconazole: good after #1 and #3.**
  - Formulation scoping (gel, cream, vaginal) is careful. The warfarin conflict is shown honestly.
  - The vaginal content is a cream proxy for the clinic's 400 mg pessary, so dosing is not given for the pessary.
- **Aciclovir: good.**
  - Oral and cream are scoped correctly. Renal bands are correct (CrCl <10; 10–25 inclusive).
  - #7 adds the missing neonatal cream warning.
  - The hypoxia → `respiratory-failure` mapping is approximate. Its concern states "significant hypoxia (one 400 mg tablet SmPC)".
- **Oseltamivir: good.**
  - Renal bands and the age gate are correct. NICE restrictions are accurately summarised.
  - #9 adds the pregnancy qualifier.
- **Fenticonazole: acceptable (proxy product).**
  - All content comes from the UK 600 mg capsule SPC, while the clinic product is a 1000 mg tablet.
  - The excipient-based contraindication is now scoped in its text.
  - Group memberships were added from a sourced statement.
- **Nystatin: good for the oral suspension.**
  - The ointment is honestly unsourced, but it is shown with no checks (see problem 4).
