# Audit: batch G (ferrous sulfate, calcium carbonate, magnesium glycerophosphate, potassium chloride)

Independent second check, 2026-10-17. All 17 batch G sources were re-fetched and read in full (SmPC 4.1 to 4.9, 5.1/5.2 where relevant, 6.1). Section 4.5 of the other master-list SmPCs in the shared cache was scanned for iron, calcium, magnesium, potassium, antacid, mineral and multivalent-cation statements (both directions).

After the edits, `verify.mjs` reports **4226/4226 quotes found, 0 schema errors**. A scratch build (not written to `public/`) gave 0 unverified rules. Scenario runs confirmed that the new rules fire as intended.

## 1. Changes

| File | Item / rule id | Before | After | Reason | Supporting quote |
|---|---|---|---|---|---|
| ferrous-sulfate.json | rule `ferrous-sulfate:condition:ibd` | Attributed to the Wockhardt SmPC only; one source | Attributed to Wockhardt **and** Sun (4.4); Sun quote added; action notes that Sun 4.3 also lists regional enteritis/UC as contraindications | Incomplete attribution. The Sun SmPC both cautions (4.4) and contraindicates (4.3). | emc-2623: "Caution is advised when prescribing iron preparations to individuals with history of peptic ulcer, and inflammatory bowel disease, including regional enteritis and ulcerative colitis." |
| ferrous-sulfate.json | rule `ferrous-sulfate:condition:peptic-ulcer-history` | No attribution; Wockhardt quote only | Attributed to Wockhardt and Sun; Sun quote added; action explains that the condition id covers active and past ulcer | Attribution. The condition id cannot tell active from past ulcer (see section 2). | same quote, emc-2623 and emc-3130 |
| ferrous-sulfate.json | rule `ferrous-sulfate:condition:peptic-ulcer-active` | "Do not use if the ulcer is active" | Adds that this is Wockhardt/Sun 4.3, that Sandoz only cautions in existing GI disease, and that a past ulcer needs caution only | Conflict between SmPCs made explicit | emc-4231: "existing gastrointestinal disease" (4.4) |
| ferrous-sulfate.json | rule `ferrous-sulfate:condition:swallowing` | No attribution; elderly not mentioned | Attributed to Sun and Sandoz; action adds elderly patients | The source names elderly patients in the same sentence | emc-2623: "Elderly patients and patients who have difficulties swallowing should only be treated with iron sulfate tablets after a careful evaluation…" |
| ferrous-sulfate.json | rule `ferrous-sulfate:condition:sugar-intolerance` | Sandoz quote only | Wockhardt quote added | Both sucrose products say it | emc-3130: "Patients with rare hereditary problems of fructose intolerance" |
| ferrous-sulfate.json | NEW rule `ferrous-sulfate:condition:hfi` (avoid) | None | Rule on condition `hereditary-fructose-intolerance` (the batch E id), attributed to Wockhardt/Sandoz; notes that Sun has no such statement | **Missing rule.** The KB has two overlapping condition ids. A patient recorded under the batch E id got no warning. | emc-4231 / emc-3130 (as above) |
| calcium-carbonate.json | NEW rule `calcium-carbonate:condition:hypercalciuria` (caution) + new condition `hypercalciuria` | None | Severe hypercalciuria is a relative contraindication; mild needs careful supervision; reduce or stop if urinary Ca > 7.5 mmol/24 h | **Missing rule** for a 4.3 relative contraindication | emc-1295: "Relative contra-indications are osteoporosis due to prolonged immobilisation, renal stones, severe hypercalciuria." |
| calcium-carbonate.json | NEW rule `calcium-carbonate:condition:hfi` (avoid) | None | Rule on `hereditary-fructose-intolerance` | **Missing rule** (duplicate condition ids, as above) | emc-1295: "Patients with rare hereditary problems of fructose intolerance, glucose-galactose malabsorption or sucrase-isomaltase insufficiency should not take this medicine." |
| calcium-carbonate.json | rule `calcium-carbonate:interaction:corticosteroids` | sourceWording "This should be taken in to account" was not in the quoted span | Quote added | Unsupported sourceWording | emc-1295: "This should be taken in to account when patients are receiving concomitant therapy." |
| calcium-carbonate.json | rule `calcium-carbonate:interaction:hydroxychloroquine` | Action did not say the HCQ SmPC names only "antacids" | Action explains that the link rests on Adcal 5.1 ("widely used as an antacid") | Transparency about the antacid-group inference | emc-1764: "antacids may reduce absorption of hydroxychloroquine…"; emc-1295: "Calcium carbonate is also widely used as an antacid." |
| magnesium-glycerophosphate.json | rule `…:condition:phenylketonuria` | level `avoid` | level `contraindicated` | **Wrong level.** The statement is listed in SmPC section 4.3 (Contraindications). | emc-2678 4.3: "Neomag should not be administered to patients with phenylketonuria as Neomag tablets contain Aspartame." |
| magnesium-glycerophosphate.json | rule `…:condition:hyperphosphataemia` | level `avoid` | level `contraindicated` | **Wrong level.** Listed in SmPC 4.3. | emc-2678 4.3: "Neomag should not be administered to patients with hyperphosphataemia as Neomag tablets contain phosphate." |
| magnesium-glycerophosphate.json | `renal` section | No SPS general renal dose statement | Item added: SPS says lower doses may be needed in renal impairment | Completeness. It qualifies SPS's "no oral dose adjustment in CKD 1–3". | sps-hypomagnesaemia: "Lower doses may be required in renal impairment due to the risk of hypermagnesaemia." |
| potassium-chloride.json | rule `potassium-chloride:condition:sugar-intolerance` | "Should not take these products" for all three sugar disorders | Action separates the products: Sando-K (sucrose) covers all three disorders; Kay-Cee-L (sorbitol) covers HFI only | **Wrong scope.** The excipient warning differs by formulation. | mhra-pl39307-0145-spc: "Patients with hereditary fructose intolerance (HFI) should not take/be given this medicine." |
| potassium-chloride.json | NEW rule `potassium-chloride:condition:hfi` (avoid) | None | Rule on `hereditary-fructose-intolerance` (both products) | **Missing rule** (duplicate condition ids) | emc-959 / Kay-Cee-L quotes above |
| potassium-chloride.json | NEW rule `potassium-chloride:condition:severe-renal-failure:kay-cee-l` (contraindicated, `formulations: [syrup]`) | Only "severe renal impairment **with oliguria**" was encoded | Kay-Cee-L 4.3 also contraindicates "advanced, severe renal failure" without needing oliguria. Encoded on condition `severe-renal-impairment` (batch A), which the engine links to GFR < 30 as a provisional flag. | **Missing contraindication.** Kay-Cee-L's wording is "A or B"; only B was encoded. | mhra-pl39307-0145-spc: "Advanced, severe renal failure or impaired renal function with oliguria" |
| potassium-chloride.json | NEW rule `potassium-chloride:condition:fhpp` (info) + new condition `familial-hyperkalaemic-periodic-paralysis` + cautions item | None | Kay-Cee-L 4.8 statement | Missing safety statement | "Ingestion of potassium chloride may induce hyperkalaemia in patients with familial hyperkalaemic periodic paralysis." |
| potassium-chloride.json | NEW rule `potassium-chloride:age:neonate:kay-cee-l` (info, syrup, age < 0.077 y ≈ 4 weeks) | Only in the paediatric section text | Age rule | Formulation- and age-specific excipient warnings should reach the safety panel | "Benzoate salt may increase jaundice … in newborn babies (up to 4 weeks old)."; "…may induce serious adverse effects in neonates." |
| potassium-chloride.json | rule `potassium-chloride:interaction:spironolactone` | Action: "should not be given routinely" | Adds that this is in Aldactone section 4.3, plus the severe heart failure limit (avoid oral K if serum K > 3.5 mEq/L) | Completeness; level kept at `avoid` because "not routinely" is qualified | emc-1619: "Avoid using oral potassium supplements in patients with serum potassium >3.5 mEq/L." |
| potassium-chloride.json | NEW rule `potassium-chloride:interaction:co-trimoxazole` (caution, hyperkalaemia) + interactions item | None. The notes said "no co-trimoxazole rule". | Rule citing the co-trimoxazole SmPC (caution with any other drugs that can cause hyperkalaemia; co-trimoxazole may cause clinically relevant hyperkalaemia) and Kay-Cee-L 4.4 (caution with medicines that raise plasma K) | **Missing interaction** (both directions now sourced) | emc-6999: "Hyperkalaemia: caution should be exercised in patients taking any other drugs that can cause hyperkalaemia"; Kay-Cee-L: "Potassium supplements should be used with caution in patients who are receiving medications that may increase plasma potassium levels." |
| potassium-chloride.json | NEW rule `potassium-chloride:interaction:iron:sando-k` (caution, `formulations: [eff-tab]`) + interactions item | None | Sando-K contains potassium bicarbonate; the Wockhardt/Sun iron SmPCs name bicarbonate-containing compounds (separate by ≥ 2 h) | **Missing interaction** (literal application of the iron SmPC wording) | emc-959: "Each tablet contains 600 mg potassium chloride and 400 mg potassium bicarbonate."; emc-3130: "Compounds containing calcium, magnesium …, bicarbonates, carbonates, oxalates or phosphates may impair the absorption of iron." |
| sources/G.json | `conditions` | — | Added `hypercalciuria` and `familial-hyperkalaemic-periodic-paralysis` | Needed by the new rules | — |
| sources/G.json | `notes` | Said "no co-trimoxazole rule" | Audit summary appended; that note corrected | Keep the integrator informed | — |

**Checked and left unchanged (correct):**
- Neomag renal rule: `GFR`, `max: 30`, not inclusive, for "GFR < 30 ml/min".
- Strengths and mmol per unit:
  - Fe 65 mg per 200 mg tablet;
  - Adcal 1500 mg = 600 mg Ca;
  - Neomag 4 mmol (97.2 mg) Mg;
  - Sando-K 12 mmol K+ (SPS; SmPC 2–4 tablets = 24–48 mmol);
  - Kay-Cee-L 1 mmol/mL.
- Sando-K serum-K dose bands, Kay-Cee-L mL/kg doses, Neomag adult and child doses, SPS Mg and K doses.
- Lisinopril `avoid` ("not recommended"); ACE-inhibitor and K-sparing group rules at `caution`; trimethoprim `monitor`.
- Pregnancy and breastfeeding levels for all four medicines.
- Separation intervals, both directions:
  - iron–levothyroxine: ≥ 2 h (iron SmPCs) and 4–5 h (Eltroxin);
  - iron–ciprofloxacin: ≥ 2 h and 1–2 h before / ≥ 4 h after;
  - iron–calcium: ≥ 2 h (Wockhardt/Sun), 1 h before / 2 h after (Sandoz), ≥ 4 h (Adcal);
  - iron–magnesium: ≥ 2 h and 3–4 h;
  - calcium–levothyroxine, calcium–quinolone: ≥ 4 h (Adcal) and 4–5 h (Eltroxin);
  - hydroxychloroquine–antacid: 4 h; magnesium–aminoquinoline: 3–4 h.

## 2. Problems found but not fixable here

1. **Ferrous sulfate: one formulation, three conflicting SmPCs.**
   - The conflicts cover children, IBD/PNH, haemolytic anaemia and pregnancy.
   - Rules cannot be scoped to a manufacturer, because all three SmPCs describe the same "200 mg tablet" and the prescriber cannot know which brand will be dispensed.
   - Every rule names its SmPC. Where SmPCs conflict, both rules fire and the stricter one sets the row level.
   - Splitting into three brand-level formulations would be needed for true scoping. I did not do this because it would invite false reassurance.
2. **The condition `peptic-ulcer-gi-bleeding` (vocab) merges active and past ulcer.**
   - So the ferrous sulfate "active peptic ulcer" contraindication also fires for a past ulcer. This over-warns.
   - Splitting the condition needs a vocab change, which is outside batch G.
3. **Duplicate sugar-intolerance condition ids:** `hereditary-fructose-intolerance` (batch E) and `hereditary-sugar-intolerance` (batch G). I handled this with parallel rules. The integrator should merge the two ids.
4. **Separation-interval levels differ between batches.**
   - Batch F's `hydroxychloroquine:interaction:antacid` uses `dose`. Batch G, D and E use `caution` for the same kind of timing advice.
   - The merged calcium carbonate + HCQ row therefore shows "Dose adjustment". This needs harmonising in SCHEMA.
5. **The calcium carbonate entry is based on Adcal 1500 mg only.**
   - It does not cover Adcal-D3, Calcichew-D3 or antacid products, yet the generic name "Calcium carbonate" will be chosen for all of them.
   - The SmPC contraindication "severe renal failure untreated by renal dialysis" has no number, and dialysis status is not captured. So eGFR alone does not trigger it; the user must tick the condition. Linking it to GFR < 30 would wrongly flag dialysis patients, who use Adcal as a phosphate binder.
6. **The antacid group membership of calcium carbonate was kept.**
   - The basis is Adcal 5.1 ("also widely used as an antacid").
   - Ciprofloxacin (calcium-containing antacids) and Eltroxin (antacids, calcium salts) clearly cover it. Hydroxychloroquine and naproxen say only "antacids", so their rules apply to calcium carbonate through that class link, not by name.
7. **Trimethoprim rule matches co-trimoxazole.** The rule `potassium-chloride:interaction:trimethoprim` (`other: "trimethoprim"`) also matches co-trimoxazole through the shared ingredient (engine behaviour). Its quote comes from the trimethoprim-only SmPC. A co-trimoxazole-specific rule now exists as well.
8. **The Kay-Cee-L "advanced, severe renal failure" contraindication has no number.**
   - The engine flags it provisionally at GFR < 30. "Advanced" may mean a lower GFR, so this may over-call at CKD G4.
   - Sando-K contraindicates only severe impairment *with oliguria*. Below 60, its generic "renal impairment" caution fires.
9. **The ferrous sulfate first-trimester rule (`avoid`) will fire even with proven iron deficiency.**
   - The source wording is "should be avoided if possible … requires definite evidence of iron deficiency" (Wockhardt; Sun says "evidence").
   - The level follows the SCHEMA mapping; the action text gives the exception. The Sandoz SmPC "recommended in pregnancy" rule fires alongside it.
10. **Gaps the engine or sources cannot cover.**
    - The Sandoz "< 22 kg" weight limit cannot be machine-checked; only the age < 6 limit is encoded.
    - "Children" in the Wockhardt/Sun SmPCs has no defined age; < 18 is used.
    - The Sun tablet contains aspartame (0.04 mg), but its SmPC has no phenylketonuria statement, so there is no rule.
    - Elderly aspiration risk (Sun/Sandoz) has no age threshold in the source and is carried in the action text only.
11. **Sources not found:**
    - SPS breastfeeding pages for oral iron, magnesium glycerophosphate and potassium chloride;
    - BUMPS/UKTIS leaflets for these supplements;
    - a UK source naming magnesium + levothyroxine (so no rule);
    - a UK SmPC for modified-release KCl tablets (not covered).
12. **BNF/BNFC not accessed** (geo-blocked).

## 3. Overall assessment

- **Ferrous sulfate: accurate, mostly complete.**
  - All three SmPCs' 4.3 items are encoded where expressible (parenteral iron is not on the master list) and attributed. Attribution gaps are now fixed.
  - The main limitation is structural (point 1 above): conflicting brand SmPCs share one formulation, and the vocab merges active and past ulcer.
  - Interactions with every relevant master-list medicine (levothyroxine, ciprofloxacin, calcium, magnesium, Sando-K bicarbonate) are present in both directions with each source's own interval.
- **Calcium carbonate: accurate for Adcal 1500 mg; complete after adding hypercalciuria and HFI.**
  - The scope is narrow (calcium-only product).
  - The severe-renal-failure contraindication cannot fire from eGFR alone.
  - The antacid-class interactions rest on a sourced but indirect group link.
- **Magnesium glycerophosphate: accurate and complete for Neomag.**
  - Two level errors fixed (PKU and hyperphosphataemia raised to contraindicated, as they sit in 4.3).
  - The GFR < 30 rule is correctly encoded as "GFR", strictly below 30.
  - SPS renal advice is recorded beside it without merging.
- **Potassium chloride: doses, mmol content and the main interactions (ACE inhibitor/lisinopril, spironolactone, trimethoprim) were correct.**
  - Before this audit it missed the Kay-Cee-L "advanced, severe renal failure" contraindication, the co-trimoxazole interaction, and the formulation split of the sugar-intolerance warning. All are now added.
  - Residual risk: renal contraindications have no numbers in either SmPC, so the engine's GFR link is provisional.
