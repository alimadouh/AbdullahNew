// Scenario tests against the REAL built data (public/medcheck/kb.json).
// Each case states what the UK source says; the test checks the tool finds it at (at least) that level.
// For each finding the source quote is printed so the case can be re-checked by a person.
//   node scripts/medcheck-uk/test-scenarios.mjs [--quotes]
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { assess, rank } from '../../src/lib/medcheck/engine.js'

const kb = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/medcheck/kb.json'), 'utf8'))
const details = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/medcheck/kb-details.json'), 'utf8'))
for (const m of kb.medicines) m.sections = details.sections[m.id]
const showQuotes = process.argv.includes('--quotes')
const med = (id) => kb.medicines.find((m) => m.id === id)
const sel = (...xs) => xs.map((x, i) => { const [medId, formHint] = x.split(':'); const m = med(medId); if (!m) throw new Error(`no medicine ${medId}`); const f = formHint ? m.formulations.find((f) => f.id.includes(formHint) || f.label.toLowerCase().includes(formHint)) : m.formulations[0]; if (!f) throw new Error(`no formulation ${formHint} for ${medId}`); return { key: `k${i}`, medId, formId: f.id } })
let pass = 0, fail = 0
const atLeast = (lvl, want) => rank(lvl) <= rank(want)

function expectFinding(name, selection, patient, { kind, meds = [], level, text }) {
  const r = assess(kb, selection, patient)
  const hit = r.findings.find((f) => (!kind || f.kind === kind) && meds.every((m) => f.meds.some((x) => x.toLowerCase().includes(m))) && (!text || JSON.stringify(f).toLowerCase().includes(text)))
  const ok = hit && (!level || atLeast(hit.level, level))
  if (ok) pass++; else fail++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${hit ? ` -> ${hit.level}: ${hit.concern}` : ' -> no matching finding'}`)
  if (!ok) console.log('     findings:', r.findings.map((f) => `${f.kind}/${f.level}/${f.meds.join('+')}/${f.concern}`).join(' | ') || 'none')
  if (hit && (showQuotes || !ok)) for (const s of hit.statements) for (const q of s.sources) console.log(`     [${s.level}] ${q.title}: "${q.quote}"`)
  return r
}
function expectNo(name, selection, patient, pred) {
  const r = assess(kb, selection, patient)
  const bad = r.findings.filter(pred)
  if (!bad.length) pass++; else fail++
  console.log(`${bad.length ? 'FAIL' : 'ok  '} ${name}${bad.length ? ' -> ' + bad.map((f) => `${f.level}: ${f.concern}`).join('; ') : ''}`)
}
function expectTrue(name, cond, info = '') { if (cond) pass++; else fail++; console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : ' ' + info}`) }

// --- contraindicated / avoid combinations
expectFinding('sildenafil (ED) + isosorbide mononitrate: contraindicated', sel('sildenafil', 'isosorbide-mononitrate'), {}, { kind: 'interaction', meds: ['sildenafil', 'isosorbide'], level: 'contraindicated' })
expectFinding('simvastatin + clarithromycin: contraindicated', sel('simvastatin', 'clarithromycin'), {}, { kind: 'interaction', meds: ['simvastatin', 'clarithromycin'], level: 'contraindicated' })
expectFinding('methotrexate + trimethoprim: at least avoid', sel('methotrexate', 'trimethoprim'), {}, { kind: 'interaction', meds: ['methotrexate', 'trimethoprim'], level: 'avoid' })
expectFinding('methotrexate + co-trimoxazole: at least avoid', sel('methotrexate', 'co-trimoxazole'), {}, { kind: 'interaction', meds: ['methotrexate', 'co-trimoxazole'], level: 'avoid' })
expectFinding('clopidogrel + omeprazole: at least avoid', sel('clopidogrel', 'omeprazole'), {}, { kind: 'interaction', meds: ['clopidogrel', 'omeprazole'], level: 'avoid' })
expectFinding('warfarin + ibuprofen: bleeding interaction', sel('warfarin', 'ibuprofen'), {}, { kind: 'interaction', meds: ['warfarin', 'ibuprofen'], level: 'caution' })
expectFinding('sertraline + tramadol: serotonin syndrome', sel('sertraline', 'tramadol'), {}, { kind: 'interaction', meds: ['sertraline', 'tramadol'], text: 'serotonin' })
expectFinding('hydroxychloroquine + clarithromycin: QT / cardiac risk', sel('hydroxychloroquine', 'clarithromycin'), {}, { kind: 'interaction', meds: ['hydroxychloroquine', 'clarithromycin'] })
expectFinding('ciprofloxacin + calcium carbonate: reduced absorption', sel('ciprofloxacin', 'calcium-carbonate'), {}, { kind: 'interaction', meds: ['ciprofloxacin', 'calcium'], text: 'absor' })
expectFinding('levothyroxine + ferrous sulfate: separate doses', sel('levothyroxine', 'ferrous-sulfate'), {}, { kind: 'interaction', meds: ['levothyroxine', 'ferrous'] })
expectFinding('lisinopril + potassium chloride: hyperkalaemia', sel('lisinopril', 'potassium-chloride'), {}, { kind: 'interaction', meds: ['lisinopril', 'potassium'], text: 'potassium' })
expectFinding('ibuprofen + naproxen: two NSAIDs', sel('ibuprofen', 'naproxen'), {}, { kind: 'interaction', meds: ['ibuprofen', 'naproxen'], level: 'avoid' })
{
  const r = assess(kb, sel('lisinopril', 'spironolactone', 'potassium-chloride'), {})
  expectTrue('cumulative hyperkalaemia with lisinopril + spironolactone + potassium', r.cumulative.some((c) => c.effect === 'hyperkalaemia' && c.meds.length === 3), JSON.stringify(r.cumulative))
  const r2 = assess(kb, sel('warfarin', 'ibuprofen', 'clopidogrel'), {})
  expectTrue('cumulative bleeding with warfarin + ibuprofen + clopidogrel', r2.cumulative.some((c) => c.effect === 'bleeding' && c.meds.length === 3), JSON.stringify(r2.cumulative))
}
// --- duplicates
expectFinding('co-codamol + paracetamol: duplicate paracetamol', sel('co-codamol', 'paracetamol'), {}, { kind: 'duplication', meds: ['co-codamol', 'paracetamol'] })
expectFinding('co-trimoxazole + trimethoprim: duplicate trimethoprim', sel('co-trimoxazole', 'trimethoprim'), {}, { kind: 'duplication' })
expectFinding('codeine + co-codamol: duplicate codeine', sel('codeine', 'co-codamol'), {}, { kind: 'duplication' })
// --- patient factors
expectFinding('metformin, eGFR 25: contraindicated', sel('metformin'), { egfr: 25 }, { kind: 'renal', meds: ['metformin'], level: 'contraindicated' })
expectFinding('naproxen, CrCl 20: contraindicated', sel('naproxen'), { crcl: 20 }, { kind: 'renal', meds: ['naproxen'], level: 'contraindicated' })
expectFinding('lisinopril, pregnant trimester 2: contraindicated', sel('lisinopril'), { pregnancy: 'yes', trimester: 2 }, { kind: 'pregnancy', meds: ['lisinopril'], level: 'contraindicated' })
expectFinding('warfarin, pregnant trimester 1: contraindicated', sel('warfarin'), { pregnancy: 'yes', trimester: 1 }, { kind: 'pregnancy', meds: ['warfarin'], level: 'contraindicated' })
expectFinding('methotrexate, pregnant: contraindicated', sel('methotrexate'), { pregnancy: 'yes', trimester: 1 }, { kind: 'pregnancy', meds: ['methotrexate'], level: 'contraindicated' })
// SmPC (pain): codeine "should not be used" under 12 -> avoid; contraindicated under 12 only for cough. Keep the source strength.
expectFinding('codeine, age 10: at least avoid', sel('codeine'), { ageYears: 10 }, { kind: 'age', meds: ['codeine'], level: 'avoid' })
expectFinding('codeine, breastfeeding: contraindicated', sel('codeine'), { breastfeeding: 'yes' }, { kind: 'breastfeeding', meds: ['codeine'], level: 'contraindicated' })
expectFinding('amoxicillin, penicillin allergy: contraindicated', sel('amoxicillin'), { allergyStatus: 'listed', allergies: [{ allergen: 'group:penicillin', reaction: 'immediate-severe' }] }, { kind: 'allergy', meds: ['amoxicillin'], level: 'contraindicated' })
expectFinding('co-amoxiclav, allergy to amoxicillin (rash): flagged', sel('co-amoxiclav'), { allergyStatus: 'listed', allergies: [{ allergen: 'amoxicillin', reaction: 'delayed' }] }, { kind: 'allergy', meds: ['co-amoxiclav'] })
expectFinding('amoxicillin, infectious mononucleosis: flagged', sel('amoxicillin'), { conditions: ['infectious-mononucleosis'] }, { kind: 'condition', meds: ['amoxicillin'] })
expectFinding('dapsone, G6PD deficiency: flagged', sel('dapsone'), { conditions: ['g6pd-deficiency'] }, { kind: 'condition', meds: ['dapsone'] })
expectFinding('ibuprofen, active peptic ulcer/GI bleeding: contraindicated', sel('ibuprofen'), { conditions: ['peptic-ulcer-gi-bleeding'] }, { kind: 'condition', meds: ['ibuprofen'], level: 'contraindicated' })
expectFinding('warfarin, haemorrhagic stroke: contraindicated', sel('warfarin'), { conditions: ['haemorrhagic-stroke'] }, { kind: 'condition', meds: ['warfarin'], level: 'contraindicated' })
expectFinding('clarithromycin, severe hepatic impairment: flagged', sel('clarithromycin'), { hepatic: 'severe' }, { kind: 'hepatic', meds: ['clarithromycin'] })
// --- formulation handling
{
  const ed = assess(kb, sel('sildenafil:ed', 'isosorbide-mononitrate'), {}).findings.find((f) => f.kind === 'interaction')
  const pah = assess(kb, sel('sildenafil:pah', 'isosorbide-mononitrate'), {}).findings.find((f) => f.kind === 'interaction')
  expectTrue('sildenafil: both ED and PAH formulations flag nitrates', ed && pah, `${ed?.level} / ${pah?.level}`)
}
// --- negative / boundary checks
expectNo('metformin, eGFR 90: no renal finding', sel('metformin'), { egfr: 90 }, (f) => f.kind === 'renal' && rank(f.level) <= rank('dose'))
expectNo('codeine, age 30: no age contraindication', sel('codeine'), { ageYears: 30 }, (f) => f.kind === 'age' && f.level === 'contraindicated')
expectNo('male patient: no pregnancy findings', sel('warfarin', 'lisinopril', 'methotrexate'), { sex: 'male', pregnancy: 'yes' }, (f) => f.kind === 'pregnancy')
expectNo('amoxicillin alone: no interaction findings', sel('amoxicillin'), {}, (f) => f.kind === 'interaction')
{
  const r = assess(kb, sel('amoxicillin'), {})
  expectTrue('incomplete data: allergy/renal/pregnancy not assessed, never clear', r.checks.allergy.status === 'missing' && ['missing', 'clear-norules'].includes(r.checks.renal.status) && r.checks.pregnancy.status === 'missing', JSON.stringify(r.checks))
  const fields = r.missing.map((m) => m.field)
  expectTrue('incomplete data: what-could-change lists allergy and kidney', fields.includes('allergy') && fields.includes('renal'), fields.join(','))
}

// --- regressions found by the independent audits
expectFinding('tramadol + ciprofloxacin: at least avoid (seizures)', sel('tramadol', 'ciprofloxacin'), {}, { kind: 'interaction', meds: ['tramadol', 'ciprofloxacin'], level: 'avoid' })
expectNo('warfarin + dapsone: no finding (dapsone SmPC says nothing about warfarin)', sel('warfarin', 'dapsone'), {}, (f) => f.kind === 'interaction')
expectNo('warfarin + planned surgery: not contraindicated (caution)', sel('warfarin'), { conditions: ['surgery-planned'] }, (f) => f.kind === 'condition' && f.level === 'contraindicated')
expectFinding('warfarin within 72 h of major surgery: contraindicated', sel('warfarin'), { conditions: ['post-major-surgery-72h'] }, { kind: 'condition', meds: ['warfarin'], level: 'contraindicated' })
expectNo('isosorbide mononitrate + recent MI alone: not contraindicated', sel('isosorbide-mononitrate'), { conditions: ['recent-myocardial-infarction'] }, (f) => f.kind === 'condition' && f.level === 'contraindicated')
expectNo("amoxicillin's own rules do not fire for co-amoxiclav (e.g. amoxicillin renal dose)", sel('co-amoxiclav'), { crcl: 20 }, (f) => f.statements.some((s) => s.about === 'Amoxicillin'))
{
  const r = assess(kb, sel('trimethoprim'), { allergyStatus: 'listed', allergies: [{ allergen: 'co-trimoxazole', reaction: 'delayed' }] })
  const f = r.findings.find((x) => x.kind === 'allergy')
  expectTrue('allergy to co-trimoxazole: trimethoprim flagged only as needs-confirmation', !f || !!f.provisional, JSON.stringify(f?.provisional))
  const r2 = assess(kb, sel('trimethoprim'), { allergyStatus: 'listed', allergies: [{ allergen: 'group:sulfonamide', reaction: 'delayed' }] })
  expectTrue('sulfonamide allergy does not contraindicate trimethoprim', !r2.findings.some((x) => x.kind === 'allergy' && x.level === 'contraindicated' && !x.provisional), r2.findings.map((x) => x.concern).join('; '))
}
expectFinding('severe heart failure implies heart failure rules (e.g. NSAIDs)', sel('ibuprofen'), { conditions: ['severe-heart-failure'] }, { kind: 'condition', meds: ['ibuprofen'], level: 'contraindicated' })
expectFinding('renal impairment without a number links to eGFR 40 (provisional)', sel('ibuprofen'), { egfr: 40 }, { kind: 'condition', meds: ['ibuprofen'], text: 'nice ng203' })
expectFinding('dapsone + sulfonamide group allergy: contraindicated', sel('dapsone'), { allergyStatus: 'listed', allergies: [{ allergen: 'group:sulfonamide', reaction: 'immediate-severe' }] }, { kind: 'allergy', meds: ['dapsone'], level: 'contraindicated' })
{
  // every allergy rule must be reachable from the allergen picker: picking each allergen it names must fire it
  const misses = []
  for (const r of kb.rules.filter((x) => x.kind === 'allergy' && !x.med.startsWith('group:'))) {
    const m = med(r.med); if (!m) continue
    for (const a of r.allergen) {
      if (!kb.allergens.some((x) => x.id === a)) continue
      const res = assess(kb, [{ key: 'k', medId: m.id, formId: (r.formulations?.[0] ?? m.formulations[0].id) }], { allergyStatus: 'listed', allergies: [{ allergen: a, reaction: r.reactions?.[0] ?? 'immediate-severe' }], ageYears: r.age ? (r.age.minYears ?? 0) + 0.5 : 40 })
      if (!res.findings.some((f) => f.ruleIds.includes(r.id))) misses.push(`${r.id} <- ${a}`)
    }
  }
  expectTrue('every allergy rule fires when its named allergen is picked', !misses.length, misses.join('; '))
}
// --- clinic expansion
expectFinding('clarithromycin + domperidone: contraindicated', sel('clarithromycin', 'domperidone'), {}, { kind: 'interaction', meds: ['clarithromycin', 'domperidone'], level: 'contraindicated' })
expectFinding('glyceryl trinitrate + sildenafil: contraindicated', sel('glyceryl-trinitrate', 'sildenafil'), {}, { kind: 'interaction', meds: ['glyceryl', 'sildenafil'], level: 'contraindicated' })
expectFinding('warfarin + metronidazole: flagged', sel('warfarin', 'metronidazole'), {}, { kind: 'interaction', meds: ['warfarin', 'metronidazole'], level: 'monitor' })
expectFinding('warfarin + miconazole oral gel: contraindicated (one UK SmPC)', sel('warfarin', 'miconazole:gel'), {}, { kind: 'interaction', meds: ['warfarin', 'miconazole'], level: 'contraindicated' })
expectFinding('fluoxetine + tramadol: serotonin syndrome', sel('fluoxetine', 'tramadol'), {}, { kind: 'interaction', meds: ['fluoxetine', 'tramadol'], text: 'serotonin' })
expectFinding('simvastatin + diltiazem: dose limit', sel('simvastatin', 'diltiazem'), {}, { kind: 'interaction', meds: ['simvastatin', 'diltiazem'], level: 'dose' })
expectFinding('ciprofloxacin + aluminium/magnesium antacid: separate doses', sel('ciprofloxacin', 'aluminium-magnesium-hydroxide'), {}, { kind: 'interaction', meds: ['ciprofloxacin', 'aluminium'] })
expectFinding('perindopril + spironolactone: hyperkalaemia', sel('perindopril', 'spironolactone'), {}, { kind: 'interaction', meds: ['perindopril', 'spironolactone'], text: 'potassium' })
expectNo('fluconazole + diclofenac GEL: no systemic interaction', sel('fluconazole', 'diclofenac:gel'), {}, (f) => f.kind === 'interaction')
expectNo('dexamethasone eye drops + dexamethasone tablets: not a duplicate', sel('neomycin-polymyxin-dexamethasone-eye', 'dexamethasone'), {}, (f) => f.kind === 'duplication')
{
  const r = assess(kb, sel('itopride', 'warfarin'), {})
  expectTrue('no-UK product is reported as not checked', r.unchecked.some((u) => /itopride/i.test(u)), JSON.stringify(r.unchecked))
  const r2 = assess(kb, sel('telmisartan-amlodipine', 'potassium-chloride'), {})
  expectTrue('no-UK combination is checked through its UK ingredients (telmisartan + potassium)', r2.findings.some((f) => f.kind === 'interaction') && r2.unchecked.some((u) => /checked using the UK information/.test(u)), JSON.stringify(r2.unchecked))
}
expectTrue('every clinic medicine is in the data', JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'clinic-map.json'), 'utf8')).every((r) => r.excluded || kb.medicines.some((m) => m.id === r.medicine)))
// --- integrity of the built data
expectTrue('every rule is verified (quote found)', kb.rules.every((r) => r.v), kb.rules.filter((r) => !r.v).map((r) => r.id).join(','))
expectTrue('no non-UK source URLs', Object.values(kb.sources).every((s) => /(medicines\.org\.uk|mhra\.gov\.uk|gov\.uk|nice\.org\.uk|sps\.nhs\.uk|medicinesinpregnancy\.org|uktis\.org|rcophth\.ac\.uk|blob\.core\.windows\.net)/.test(s.url)), Object.values(kb.sources).filter((s) => !/(medicines\.org\.uk|gov\.uk|nice\.org\.uk|sps\.nhs\.uk|medicinesinpregnancy\.org|uktis\.org|rcophth\.ac\.uk|blob\.core\.windows\.net)/.test(s.url)).map((s) => s.url).join(' '))
expectTrue('no FDA / DailyMed / US content left', !/dailymed|fda\.gov|nlm\.nih|\brxcui\b/i.test(JSON.stringify(kb)))
{
  const doses = ['dosing', 'paediatric'].flatMap((k) => med('methotrexate').sections[k].items ?? []).filter((i) => /\d\s*mg/.test(i.t))
  expectTrue('methotrexate: every line with a mg dose says weekly', doses.length > 0 && doses.every((i) => /week/i.test(i.t + (i.tag ?? ''))), doses.filter((i) => !/week/i.test(i.t + (i.tag ?? ''))).map((i) => i.t).join(' | '))
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exitCode = fail ? 1 : 0
