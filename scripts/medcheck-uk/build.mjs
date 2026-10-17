// Builds public/medcheck/kb.json from the research files + verify-report.json.
// Items/rules whose quotes were not found are kept but marked v:false (shown as "Unverified" in the tool).
//   node scripts/medcheck-uk/build.mjs
import fs from 'fs'
import path from 'path'
import { loadAll, validate, allQuotes, SECTION_KEYS, ROOT } from './lib/load.mjs'

const data = loadAll()
const { errs } = validate(data)
if (errs.length) { console.log(errs.slice(0, 40).join('\n')); console.log(`${errs.length} schema errors: fix before building`); process.exit(1) }

const repPath = path.join(ROOT, 'verify-report.json')
if (!fs.existsSync(repPath)) { console.log('run verify.mjs first'); process.exit(1) }
const rep = JSON.parse(fs.readFileSync(repPath, 'utf8'))
const checkedDate = rep.checkedAt.slice(0, 10)
const qOk = (r) => rep.quotes[`${r.s}\u0000${r.q}`] === true && rep.sourceStatus[r.s]?.ok
const allOk = (src) => !!src?.length && src.every(qOk)

const INGREDIENT_NAMES = {
  paracetamol: 'Paracetamol', codeine: 'Codeine', tramadol: 'Tramadol', ibuprofen: 'Ibuprofen', naproxen: 'Naproxen', amlodipine: 'Amlodipine', lisinopril: 'Lisinopril',
  spironolactone: 'Spironolactone', 'isosorbide-mononitrate': 'Isosorbide mononitrate', sildenafil: 'Sildenafil', atorvastatin: 'Atorvastatin', simvastatin: 'Simvastatin',
  clopidogrel: 'Clopidogrel', warfarin: 'Warfarin', phytomenadione: 'Phytomenadione (vitamin K1)', metformin: 'Metformin', levothyroxine: 'Levothyroxine', omeprazole: 'Omeprazole',
  sertraline: 'Sertraline', hypericum: "St John's wort", amoxicillin: 'Amoxicillin', 'clavulanic-acid': 'Clavulanic acid', clarithromycin: 'Clarithromycin', ciprofloxacin: 'Ciprofloxacin',
  trimethoprim: 'Trimethoprim', sulfamethoxazole: 'Sulfamethoxazole', dapsone: 'Dapsone', hydroxychloroquine: 'Hydroxychloroquine', methotrexate: 'Methotrexate', iron: 'Iron',
  calcium: 'Calcium', magnesium: 'Magnesium', potassium: 'Potassium', colecalciferol: 'Colecalciferol (vitamin D3)',
}

// group membership = medicine's own list + sourced member entries (sourced flag kept for audit)
const groups = {}
for (const g of Object.values(data.groups)) groups[g.id] = { id: g.id, name: g.name, members: [] }
for (const g of Object.values(data.groups)) for (const mem of g.members) if (!groups[g.id].members.includes(mem.med)) groups[g.id].members.push(mem.med)
const medicines = data.medicines.map((m) => {
  const memberOf = Object.values(groups).filter((g) => g.members.includes(m.id)).map((g) => g.id)
  const sections = {}
  for (const k of SECTION_KEYS) {
    const s = m.sections[k]
    if (!s.items) { sections[k] = { status: s.status ?? 'not-stated', note: s.note ?? '' }; continue }
    const items = s.items.map((it) => ({ ...it, v: allOk(it.src) }))
    const unverified = items.filter((x) => !x.v).length
    sections[k] = { items, unverified, verifiedAt: unverified ? null : checkedDate }
  }
  const { file, rules, ...rest } = m
  return {
    ...rest,
    groups: [...new Set([...(m.groups ?? []), ...memberOf])],
    formulations: m.formulations.map((f) => ({ ...f, v: !f.src?.length || allOk(f.src) })),
    brandPrescribing: m.brandPrescribing ? { ...m.brandPrescribing, v: allOk(m.brandPrescribing.src) } : null,
    sections,
    sourceIds: [...new Set([...allQuotes({ medicines: [m], groups: {} })].map((x) => x.ref.s))],
  }
})
const rules = data.medicines.flatMap((m) => (m.rules ?? []).map((r) => ({ ...r, v: allOk(r.src) })))

const usedConditions = new Set(rules.filter((r) => r.kind === 'condition').map((r) => r.condition))
// keep the implication map only for conditions that exist; check every id
const conditionImplies = {}
for (const [c, ps] of Object.entries(data.tool.conditionImplies ?? {})) {
  for (const x of [c, ...ps]) if (!data.conditions[x]) { console.log(`conditionImplies: unknown condition ${x}`); process.exit(1) }
  conditionImplies[c] = ps
  usedConditions.add(c)
}
const conditions = Object.values(data.conditions).filter((c) => usedConditions.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))

const allergenIds = new Set()
for (const r of rules) if (r.kind === 'allergy') for (const a of r.allergen) allergenIds.add(a)
const allergens = [
  ...[...allergenIds].filter((a) => a.startsWith('group:')).map((a) => ({ id: a, name: groups[a.slice(6)]?.name ?? a, kind: 'group' })),
  ...medicines.map((m) => ({ id: m.id, name: m.name, kind: 'medicine' })),
  ...[...new Set(medicines.flatMap((m) => m.ingredients))].filter((i) => !medicines.some((m) => m.id === i)).map((i) => ({ id: i, name: INGREDIENT_NAMES[i] ?? i, kind: 'ingredient' })),
].sort((a, b) => a.name.localeCompare(b.name))

const usedSources = new Set([...allQuotes(data)].map((x) => x.ref.s))
const sources = Object.fromEntries(Object.values(data.sources).filter((s) => usedSources.has(s.id)).map((s) => [s.id, { id: s.id, type: s.type, publisher: s.publisher, title: s.title, url: s.url, version: s.version ?? null, accessed: s.accessed ?? null, checked: rep.sourceStatus[s.id]?.ok ? checkedDate : null }]))

const kb = {
  format: 'uk-medcheck-1',
  builtAt: new Date().toISOString(),
  verification: { checkedAt: rep.checkedAt, quotesTotal: rep.quotesTotal, quotesFound: rep.quotesFound, unverifiedRules: rules.filter((r) => !r.v).length },
  bnf: { status: 'not-accessed', note: 'BNF and BNFC are only available in the UK (bnf.nice.org.uk returns "BNF is only available in the UK"). They were not accessed, so no content here is checked against them.' },
  scope: {
    medicines: medicines.length,
    interactionsFrom: 'UK SmPC section 4.5 (and MHRA/SPS where cited) for the medicines in this database only.',
  },
  ingredientNames: INGREDIENT_NAMES,
  toolSources: Object.fromEntries(Object.entries(data.tool.quotes).map(([k, r]) => { const s = data.sources[r.s]; return [k, { title: s.title, url: s.url, type: s.type, publisher: s.publisher, quote: r.q, verified: qOk(r) }] })),
  groups: Object.fromEntries(Object.entries(groups).filter(([, g]) => g.members.length || rules.some((r) => [r.med, r.other, ...(r.allergen ?? [])].includes(`group:${g.id}`)))),
  conditions,
  conditionImplies,
  allergens,
  sources,
  medicines: medicines.sort((a, b) => a.name.localeCompare(b.name)),
  rules,
}
const out = path.resolve(ROOT, '../../public/medcheck/kb.json')
fs.writeFileSync(out, JSON.stringify(kb))
console.log(`kb.json: ${medicines.length} medicines, ${rules.length} rules (${kb.verification.unverifiedRules} unverified), ${Object.keys(sources).length} sources, ${conditions.length} conditions, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`)
