# UK Medication Safety Checker: data contract

There is one JSON file per medicine, saved as `scripts/medcheck-uk/medicines/<id>.json`.
Each research batch adds its sources to `scripts/medcheck-uk/sources/<batch>.json`.
`build.mjs` merges these files into `public/medcheck/kb.json`. `verify.mjs` then checks every quote against the live source text.

## Source policy (strict)

**Allowed sources (UK only)**
- **UK Summary of Product Characteristics (SmPC).**
  - emc: `https://www.medicines.org.uk/emc/product/<n>/smpc`
  - MHRA products: `https://products.mhra.gov.uk/`
- **MHRA.** Drug Safety Update and other gov.uk MHRA guidance (`https://www.gov.uk/drug-safety-update/...`).
- **NICE.** Guidance on `https://www.nice.org.uk/guidance/...`. CKS is geo-blocked; do not use it.
- **NHS Specialist Pharmacy Service** (`https://www.sps.nhs.uk/...`).
  - Breastfeeding safety pages.
  - Renal pages.
  - Monitoring pages: "Suggestions for drug monitoring in adults in primary care" and the individual medicine monitoring pages.
- **UKTIS / BUMPS.**
  - BUMPS leaflets: `https://www.medicinesinpregnancy.org/...`
  - UKTIS monograph summaries: only the publicly visible part of the page.

**Not allowed**
- BNF/BNFC. They return "BNF is only available in the UK" (HTTP 403) from this location. Do **not** try to get around this with a VPN, proxy, cache, archive or mirror. Record BNF as `not-accessed`.
- Any non-UK source: FDA, DailyMed, US labels, Medscape, Drugs.com, Lexicomp, UpToDate, LactMed directly, EMA-only text, Wikipedia, or anything else from outside the UK.
- Pharmacy shops, NHS trust formularies, patient forums, and AI summaries.

**Evidence rules**
- **Never use memory or search snippets as evidence.** Every statement needs a verbatim quote taken from the fetched page text.
- **How to get page text.** Use `node scripts/medcheck-uk/fetchtext.mjs <url> [--grep re | --section a b | --check "quote"]`. Set `MEDCHECK_CACHE` to the shared cache folder given in your task.
- **Check every quote before you save it.** Run `--check "<quote>"`. A quote that is NOT FOUND must be fixed or dropped.
- **Quote length.**
  - 1 to 300 characters.
  - The shortest exact span that proves the statement.
  - Use several short quotes rather than one long one.
  - Never paste whole sections. The KB is public and SmPC/BNF text is copyright, so the statement `t` is our own concise wording.
- **Statement wording (`t`).**
  - Keep the source's meaning **and strength**: "contraindicated", "avoid", "not recommended", "use with caution" and "monitor" are different things.
  - Do not add facts that are not in the quotes.
  - Keep units exactly as the source gives them: mg, micrograms (never "mcg" unless the source says so), mL/min, mL/min/1.73 m², µmol/L.
  - Say which renal measure the source uses. If it says creatinine clearance, write `CrCl`. If it says eGFR, write `eGFR`. If it only says "GFR" or "renal function", keep that wording.
- **When sources disagree.** If two UK sources differ (for example, two SmPCs or SmPC vs SPS), keep both as separate items. Name which source says what. Do not merge them into one rule.
- **When nothing is found.** If a section has nothing in the sources you accessed, set `"status": "not-stated"` with a short note naming the sources checked. Never fill a gap from memory.

## Medicine file

```jsonc
{
  "id": "co-amoxiclav",                         // kebab-case, unique
  "name": "Co-amoxiclav",                       // UK generic (BAN/rINN) name, used everywhere in the UI
  "ingredients": ["amoxicillin", "clavulanic-acid"], // active ingredient ids (duplicate detection across medicines)
  "className": "Penicillin with beta-lactamase inhibitor",  // short, from source wording where possible
  "groups": ["penicillin", "beta-lactam", "antibacterial"], // ids from vocab.json "groups" (add new ones in your batch file)
  "searchTerms": ["amoxicillin clavulanic acid", "amoxicillin/clavulanate"], // other GENERIC spellings only (no brands)
  "formulations": [
    {
      "id": "co-amoxiclav-tab",                 // unique
      "label": "Tablets",                       // e.g. "Tablets", "Modified-release tablets", "Oral suspension"
      "route": "oral",
      "strengths": "250 mg/125 mg, 500 mg/125 mg",     // as on the SmPC
      "release": "immediate",                   // immediate | modified | gastro-resistant | n/a
      "systemic": true,                         // optional: a local route (vaginal, nasal…) used for a whole-body effect, e.g. progesterone pessaries
      "note": "Strengths are not interchangeable: the clavulanic acid content differs.", // optional, needs src
      "src": [{ "s": "emc-12345", "q": "..." }],
      "sourceIds": ["emc-12345"]                // the SmPC(s) for THIS formulation
    }
  ],
  "brandPrescribing": null,  // or { "t": "...", "src": [...] } ONLY if a UK source says to prescribe by brand
  "bnf": { "status": "not-accessed", "note": "BNF/BNFC is only available in the UK; not accessed." },
  "sections": { /* see below */ },
  "rules": [ /* engine rules, see below */ ]
}
```

### Medicines with no UK product information

Some clinic products are not licensed in the UK (no emc / MHRA SmPC, PIL or THR). For those:
- set `"availability": { "status": "no-uk-product", "note": "what was searched (emc, MHRA products, NICE/SPS) and found nothing" }`;
- write formulations from the clinic product only (label + route, no `src`);
- set every section to `{ "status": "not-available", "note": "No UK product information found." }`;
- write `"rules": []`.

Never fill such a medicine from another country's label. The tool shows it as "not checked: no UK source".

If only a *different* UK product with the same active ingredient exists (for example a different strength or route), you may use it. Say so clearly in `formulations[].note`, and include only the content that applies to the clinic's form.

All other medicines use `"availability": { "status": "uk" }` (or omit it).

If only ONE clinic form has no UK product (e.g. an ointment when only a cream exists), keep the medicine and mark that formulation `"availability": "no-uk-product"` with a `note`; no item or rule may be scoped to it. The tool then shows that form as "not checked".

### `sections`: fixed keys, always present

Each key holds either `{ "items": [Item, ...] }` or `{ "status": "not-stated", "note": "..." }`.

| key | content |
|---|---|
| `indications` | licensed indications (UK SmPC 4.1) |
| `restrictions` | prescribing restrictions: specialist-only, shared care, licensing limits, brand-specific prescribing |
| `dosing` | adult dose **per indication**: dose, frequency, duration, max dose, titration. One item per indication/population. Never a single universal dose. |
| `paediatric` | age/weight limits and child dosing (SmPC 4.2 paediatric). Say if not licensed below an age. |
| `contraindications` | absolute contraindications (SmPC 4.3) |
| `cautions` | important warnings and precautions and the conditions involved (SmPC 4.4) |
| `interactions` | clinically significant interactions: other drug or group, effect, required action (SmPC 4.5) |
| `renal` | renal impairment: exact thresholds, which measure (eGFR or CrCl), adjustment |
| `hepatic` | hepatic impairment: severity (Child-Pugh if stated), adjustment |
| `pregnancy` | pregnancy (SmPC 4.6, UKTIS/BUMPS) |
| `breastfeeding` | breastfeeding (SmPC 4.6, SPS) |
| `reproductive` | fertility, contraception, men/women of childbearing potential (or not-stated) |
| `adverseCommon` | common/very common adverse effects (SmPC 4.8 frequency) |
| `adverseSerious` | serious adverse effects needing urgent action, and what to do |
| `monitoring` | baseline checks, ongoing monitoring, stop/review criteria. Use `tag`: `baseline`, `ongoing`, `stop` |
| `administration` | how to take/give (with food, timing, swallow whole, etc.) |
| `counselling` | practical patient counselling points |

**Item:**

```jsonc
{
  "t": "Adults: 500 mg/125 mg three times daily.",  // concise statement in our words
  "tag": "Mild to moderate infections",             // optional label: indication, population, baseline/ongoing/stop, trimester...
  "formulations": ["co-amoxiclav-tab"],              // optional: only applies to these formulations
  "detail": false,                                   // true = less urgent, shown under "More"
  "src": [{ "s": "emc-12345", "q": "verbatim quote from that page" }],
  "calc": { /* optional structured weight-based dose, see below */ }
}
```

**`calc`** (only when the source gives an explicit mg/kg dose):

```jsonc
{
  "mgPerKg": 25,
  "per": "day",                // "dose" or "day"
  "dividedInto": 3,            // number of doses/day when per = day (optional)
  "maxMg": 3000,               // max mg per `maxPer` (optional, only if stated)
  "maxPer": "day",
  "ageMinYears": 0.25,
  "ageMaxYears": 12,           // optional bounds stated by the source
  "weightMaxKg": 40,
  "of": "amoxicillin"          // which ingredient the mg refers to
}
```

## Engine rules (`rules`)

Rules drive the combined safety panel. Make a rule for every:
- contraindication;
- condition-related warning;
- allergy or cross-reactivity statement;
- pregnancy or breastfeeding restriction;
- renal or hepatic threshold;
- age limit;
- clinically significant interaction with another medicine **in the master list** or a group.

Each rule must be backed by verbatim quotes.

```jsonc
{
  "id": "co-amoxiclav:allergy:beta-lactam",   // unique, prefix with medicine id
  "kind": "interaction | condition | allergy | pregnancy | breastfeeding | renal | hepatic | age | duplication",
  "level": "contraindicated | avoid | dose | caution | monitor | info",
  "med": "co-amoxiclav",                       // this medicine's id (or "group:<id>" when the source states it for a group)
  "formulations": ["..."],                     // optional
  // kind-specific fields:
  "other": "warfarin" | "group:nsaid",         // interaction: other medicine id or group
  "otherFormulations": ["aspirin-analgesic"],  // optional: only when the OTHER medicine is one of these formulation ids (e.g. dose-dependent interactions)
  "otherExcept": ["azithromycin"],              // optional: group rule does NOT apply to these medicine ids (the source gives them their own, different advice in a separate rule)
  "condition": "infectious-mononucleosis",     // condition: id from vocab.json conditions (or add new in your batch file)
  "allergen": ["group:beta-lactam"],           // allergy: medicine ids, ingredient ids or groups the patient is allergic to
  "reactions": ["immediate-severe"],           // allergy: reaction groups this applies to (omit = any reaction)
  "trimesters": [1, 2, 3],                     // pregnancy: omit = whole pregnancy
  "renal": { "measure": "CrCl" | "eGFR" | "GFR", "min": 10, "max": 30, "maxInclusive": false },  // applies when min <= value < max (value <= max if maxInclusive, e.g. source says "≤30"); omit min or max for open ranges; units: CrCl mL/min, eGFR mL/min/1.73 m²
  "hepatic": ["any" | "mild" | "moderate" | "severe"],
  "age": { "minYears": 0, "maxYears": 12 },    // kind age: applies when minYears <= age < maxYears.
                                               // On condition/renal/hepatic/interaction rules an `age` is an EXTRA limit (both must match),
                                               // e.g. a child-only renal threshold. Not applied to breastfeeding (infant age is different).
  "effect": "bleeding",                        // optional cumulative-effect tag from vocab.json effects
  "concern": "Severe immediate beta-lactam allergy",       // short title
  "consequence": "Risk of anaphylaxis (cross-reactivity).", // clinical consequence, from the source
  "action": "Do not use.",                                  // recommended action, from the source; keep its strength
  "sourceWording": "is contraindicated",                    // the key strength phrase, verbatim
  "src": [{ "s": "emc-12345", "q": "verbatim quote" }]
}
```

### Level mapping (keep the source's strength)

| level | when to use |
|---|---|
| `contraindicated` | The source says "contraindicated", "must not be used/given/taken" or "is not to be used". |
| `avoid` | The source says "avoid", "should not be used/given/combined", "not recommended", or "do not use concomitantly". This is not contraindicated. |
| `dose` | A dose reduction, dose limit, dose interval change or maximum dose is required. |
| `caution` | "Use with caution", "consider risk/benefit", "specialist advice" or "careful". |
| `monitor` | Monitoring is required ("monitor INR", "check potassium", "observe"). |
| `info` | Clinically relevant, but no action is stated. |

If a statement contains two strengths (for example "avoid; if used, monitor INR closely"), use the stronger one for `level`. Keep the rest in `action`.

### Interactions

- Record interactions only when **the sources you fetched** state them. Usually that is the SmPC section 4.5 of either medicine.
- The other side must be a medicine in the master list or a group. Groups are defined in `vocab.json` and in batch files.
- If the SmPC names a group (for example "NSAIDs" or "potassium-sparing diuretics"), use `group:<id>`. Say which master-list medicines belong to that group in your batch file `groups` (`members` + quote).
- Membership must also be sourced. A medicine belongs to a group only if its own SmPC or a UK source puts it there (for example, its class in section 5.1 or 4.5).
- `effect` tags let the UI add up cumulative risks:
  - `bleeding`
  - `hyperkalaemia`
  - `serotonin-syndrome`
  - `qt-prolongation`
  - `cns-respiratory-depression`
  - `hypotension`
  - `myopathy`
  - `nephrotoxicity`
  - `hypoglycaemia`
  - `seizure-threshold`
  - `hepatotoxicity`
  - `bone-marrow-suppression`
  - `hyponatraemia`
  - `reduced-absorption`

### Allergy rules

- **Own-ingredient rule.** Add one `allergy` rule with `allergen: ["<own ingredient ids>"]` from the SmPC 4.3 hypersensitivity line.
- **Cross-reactivity rules.** Add these only when stated, for example "patients allergic to other beta-lactams" or "sulfonamides".
- **Reaction groups** (for `reactions`): `immediate-severe` (anaphylaxis, angioedema), `immediate` (urticaria, bronchospasm), `delayed` (non-severe rash), `severe-cutaneous` (SJS/TEN/DRESS), `intolerance`, `unknown`.

## Batch file `sources/<batch>.json`

```jsonc
{
  "sources": [
    {
      "id": "emc-12345",
      "type": "smpc | mhra | nice | sps | uktis | bumps | rcophth",
      "publisher": "Accord-UK Ltd (via emc)",
      "title": "Co-amoxiclav 500 mg/125 mg film-coated tablets - SmPC",
      "url": "https://www.medicines.org.uk/emc/product/12345/smpc",
      "version": "Last updated on emc: 12 Mar 2025",   // as shown on the page, if shown
      "accessed": "2026-10-17"
    }
  ],
  "groups": [ { "id": "penicillin", "name": "Penicillins", "members": [ { "med": "amoxicillin", "src": [{ "s": "...", "q": "..." }] } ] } ],
  "conditions": [ { "id": "infectious-mononucleosis", "name": "Infectious mononucleosis (glandular fever)" } ],
  "notes": "anything the integrator must know: conflicts between sources, items left unverified, etc."
}
```
