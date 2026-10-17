# UK Medication Safety Checker: data and checks

The tool lives at Tools → Pharmacology → Medication Safety Checker (`src/components/MedCheckTool.jsx`). Its pieces:
- **Engine:** `src/lib/medcheck/engine.js`
- **Interface:** `src/components/medcheck/`
- **Data:** `public/medcheck/kb.json`, built from this folder

## Sources
**UK sources only:**
- UK SmPCs (emc, or the MHRA products site)
- MHRA Drug Safety Updates
- NICE
- NHS Specialist Pharmacy Service (SPS)
- UKTIS/BUMPS
- RCOphth (hydroxychloroquine only)

**BNF/BNFC were not accessed.** From outside the UK, bnf.nice.org.uk returns "BNF is only available in the UK". No content is claimed to be checked against them.

**Not used:** non-UK sources, pharmacy websites, and AI summaries. The full policy is in `SCHEMA.md`.

## Files
- **`vocab.json`:** master list of the 235 medicines (the original 34 plus every medicine in the site's Clinic list), plus groups, effects and the starting condition list.
- **`clinic-map.json`:** each Clinic row → its checker medicine (or why it is excluded, e.g. devices).
- **`medicines/<id>.json`:**
  - one file per medicine, holding its table sections and its engine rules;
  - every statement has verbatim quotes, as `src: [{ s: sourceId, q: quote }]`.
- **`sources/<batch>.json`:** source registry, sourced group memberships, extra conditions, and notes on conflicts between sources.
- **`tool.json`:** sources for logic the tool applies itself, plus the condition "is a kind of" map:
  - NICE NG203 GFR categories for the kidney link;
  - MHRA and SPS guidance on when to use Cockcroft-Gault CrCl.
- **`audit/*.md`:** independent second-check logs (one per batch or pair of batches, plus `backfill-A-G.md` and `groups-cross-batch.md`). Each lists every correction, with its quote.
- **Output:** `public/medcheck/kb.json` (rules, loaded first) and `public/medcheck/kb-details.json` (the medicine tables, loaded when opened).

## Commands (run from the repo root)
```
export MEDCHECK_CACHE=<a temp folder>
node scripts/medcheck-uk/verify.mjs --fresh      # re-downloads every source; checks every quote verbatim + schema
node scripts/medcheck-uk/build.mjs               # writes public/medcheck/kb.json (items/rules with unmatched quotes are marked unverified)
node scripts/medcheck-uk/test-engine.mjs         # engine logic on synthetic data
node scripts/medcheck-uk/test-scenarios.mjs      # real-data clinical scenarios (add --quotes to print the source wording)
npx vite --port 5181 &  python -I scripts/medcheck-uk/test-ui.py http://localhost:5181   # browser tests, desktop + mobile
node scripts/medcheck-uk/fetchtext.mjs <url> --check "quote"   # research helper
```

## What "verified" means here
Every quote was found word for word on the source page when `verify.mjs` was last run. The date is in `verify-report.json`.

It does **not** mean:
- that a pharmacist or doctor has clinically validated the rules;
- that interaction coverage is complete. Coverage is only what these UK sources say about the 235 medicines in this list.
- that every Clinic product is covered: products with no UK product information are shown as "not checked" (combinations are checked through any UK-licensed ingredients, clearly labelled).
