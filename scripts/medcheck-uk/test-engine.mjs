// Logic tests for src/lib/medcheck/engine.js using a small SYNTHETIC knowledge base (not clinical data).
//   node scripts/medcheck-uk/test-engine.mjs
import assert from 'node:assert/strict'
import { assess, cockcroftGault, calcDose } from '../../src/lib/medcheck/engine.js'

const S = [{ s: 'x', q: 'q' }]
const kb = {
  sources: { x: { id: 'x', title: 'Test SmPC', url: 'https://www.medicines.org.uk/emc/product/1/smpc' } },
  groups: { pen: { id: 'pen', name: 'Penicillins', members: ['amox', 'coamox'] }, nsaid: { id: 'nsaid', name: 'NSAIDs', members: ['ibu', 'nap'] } },
  ingredientNames: { amoxicillin: 'Amoxicillin', clav: 'Clavulanic acid', para: 'Paracetamol', cod: 'Codeine' },
  conditions: [{ id: 'mono', name: 'Mononucleosis' }, { id: 'ulcer', name: 'Peptic ulcer' }],
  medicines: [
    { id: 'amox', name: 'Amoxicillin', ingredients: ['amoxicillin'], groups: ['pen'], formulations: [{ id: 'amox-cap', label: 'Capsules' }, { id: 'amox-susp', label: 'Oral suspension' }], sections: { paediatric: { items: [{ t: 'kids', calc: { mgPerKg: 25, per: 'day', dividedInto: 3, maxMg: 3000, maxPer: 'day' }, src: S }] } } },
    { id: 'coamox', name: 'Co-amoxiclav', ingredients: ['amoxicillin', 'clav'], groups: ['pen'], formulations: [{ id: 'ca-tab', label: 'Tablets' }], sections: {} },
    { id: 'warf', name: 'Warfarin', ingredients: ['warf'], groups: [], formulations: [{ id: 'w', label: 'Tablets' }], sections: {} },
    { id: 'ibu', name: 'Ibuprofen', ingredients: ['ibu'], groups: ['nsaid'], formulations: [{ id: 'i', label: 'Tablets' }], sections: {} },
    { id: 'nap', name: 'Naproxen', ingredients: ['nap'], groups: ['nsaid'], formulations: [{ id: 'n', label: 'Tablets' }], sections: {} },
    { id: 'clop', name: 'Clopidogrel', ingredients: ['clop'], groups: [], formulations: [{ id: 'c', label: 'Tablets' }], sections: {} },
    { id: 'para', name: 'Paracetamol', ingredients: ['para'], groups: [], formulations: [{ id: 'p', label: 'Tablets' }], sections: {} },
    { id: 'cocod', name: 'Co-codamol', ingredients: ['cod', 'para'], groups: [], formulations: [{ id: 'cc', label: 'Tablets' }], sections: {} },
    { id: 'met', name: 'Metformin', ingredients: ['met'], groups: [], formulations: [{ id: 'm', label: 'Tablets' }], sections: {} },
    { id: 'dabig', name: 'CrClDrug', ingredients: ['d'], groups: [], formulations: [{ id: 'd', label: 'Tablets' }], sections: {} },
  ],
  rules: [
    { id: 'w-nsaid', kind: 'interaction', level: 'avoid', med: 'warf', other: 'group:nsaid', effect: 'bleeding', concern: 'Bleeding', consequence: 'c', action: 'Avoid', src: S },
    { id: 'ibu-w', kind: 'interaction', level: 'caution', med: 'ibu', other: 'warf', effect: 'bleeding', concern: 'Bleeding', consequence: 'c', action: 'Caution', src: S },
    { id: 'w-clop', kind: 'interaction', level: 'caution', med: 'warf', other: 'clop', effect: 'bleeding', concern: 'Bleeding', consequence: 'c', action: 'x', src: S },
    { id: 'clop-nsaid', kind: 'interaction', level: 'caution', med: 'clop', other: 'group:nsaid', effect: 'bleeding', concern: 'Bleeding', consequence: 'c', action: 'x', src: S },
    { id: 'nsaid-nsaid', kind: 'interaction', level: 'avoid', med: 'group:nsaid', other: 'group:nsaid', concern: 'Two NSAIDs', consequence: 'c', action: 'Avoid', src: S },
    { id: 'amox-allergy-pen', kind: 'allergy', level: 'contraindicated', med: 'amox', allergen: ['group:pen'], concern: 'Penicillin allergy', consequence: 'c', action: 'Do not use', src: S },
    { id: 'amox-allergy-bl', kind: 'allergy', level: 'contraindicated', med: 'amox', allergen: ['group:ceph'], reactions: ['immediate-severe'], concern: 'Severe beta-lactam', consequence: 'c', action: 'Do not use', src: S },
    { id: 'amox-mono', kind: 'condition', level: 'avoid', med: 'amox', condition: 'mono', concern: 'Rash', consequence: 'c', action: 'Avoid', src: S },
    { id: 'met-renal', kind: 'renal', level: 'contraindicated', med: 'met', renal: { measure: 'GFR', max: 30 }, concern: 'Renal', consequence: 'c', action: 'Do not use', src: S },
    { id: 'met-renal2', kind: 'renal', level: 'dose', med: 'met', renal: { measure: 'GFR', min: 30, max: 45 }, concern: 'Renal dose', consequence: 'c', action: 'Max 1000 mg', src: S },
    { id: 'd-renal', kind: 'renal', level: 'contraindicated', med: 'dabig', renal: { measure: 'CrCl', max: 30 }, concern: 'Renal', consequence: 'c', action: 'Do not use', src: S },
    { id: 'w-preg', kind: 'pregnancy', level: 'contraindicated', med: 'warf', trimesters: [1, 3], concern: 'Pregnancy', consequence: 'c', action: 'x', src: S },
    { id: 'w-hep', kind: 'hepatic', level: 'contraindicated', med: 'warf', hepatic: ['severe'], concern: 'Liver', consequence: 'c', action: 'x', src: S },
    { id: 'cocod-age', kind: 'age', level: 'contraindicated', med: 'cocod', age: { maxYears: 12 }, concern: 'Child', consequence: 'c', action: 'x', src: S },
    { id: 'cocod-osa', kind: 'condition', level: 'contraindicated', med: 'cocod', condition: 'mono', age: { maxYears: 18 }, concern: 'OSA child', consequence: 'c', action: 'x', src: S },
    { id: 'met-ri', kind: 'condition', level: 'avoid', med: 'met', condition: 'renal-impairment', concern: 'Renal impairment (no number)', consequence: 'c', action: 'x', src: S },
    { id: 'amox-susp-only', kind: 'condition', level: 'caution', med: 'amox', formulations: ['amox-susp'], condition: 'ulcer', concern: 'Susp only', consequence: 'c', action: 'x', src: S },
  ],
}
const sel = (...ids) => ids.map((x, i) => { const [medId, formId] = x.split(':'); return { key: `k${i}`, medId, formId } })
const levels = (r) => r.findings.filter((f) => f.kind !== 'condition').map((f) => `${f.kind}:${f.level}`)
let n = 0
const t = (name, fn) => { fn(); n++; console.log('ok', name) }

t('pair interaction merges both directions into one row, highest level, two statements', () => {
  const r = assess(kb, sel('warf', 'ibu'), {})
  const rows = r.findings.filter((f) => f.kind === 'interaction')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].level, 'avoid')
  assert.equal(rows[0].statements.length, 2)
  assert.deepEqual(rows[0].statements.map((s) => s.level), ['avoid', 'caution'])
})
t('group-vs-group rule finds two NSAIDs once (not self)', () => {
  const r = assess(kb, sel('ibu', 'nap'), {})
  assert.equal(r.findings.filter((f) => f.kind === 'interaction').length, 1)
  assert.equal(assess(kb, sel('ibu'), {}).findings.length, 0)
})
t('cumulative bleeding with three medicines', () => {
  const r = assess(kb, sel('warf', 'ibu', 'clop'), {})
  assert.equal(r.cumulative.length, 1)
  assert.equal(r.cumulative[0].effect, 'bleeding')
  assert.equal(r.cumulative[0].meds.length, 3)
})
t('removing a medicine removes its findings', () => {
  assert.ok(assess(kb, sel('warf', 'ibu'), {}).findings.length > 0)
  assert.equal(assess(kb, sel('warf'), {}).findings.filter((f) => f.kind === 'interaction').length, 0)
})
t('duplicate ingredient across paracetamol + co-codamol is tool-detected', () => {
  const r = assess(kb, sel('para', 'cocod'), {})
  const d = r.findings.find((f) => f.kind === 'duplication')
  assert.ok(d && d.toolCheck && d.meds.length === 2)
})
t('same medicine twice in two formulations is a duplicate, not an interaction', () => {
  const r = assess(kb, sel('amox:amox-cap', 'amox:amox-susp'), { allergyStatus: 'nkda' })
  assert.equal(r.findings.filter((f) => f.kind === 'duplication').length, 1)
  assert.equal(r.findings.filter((f) => f.kind === 'interaction').length, 0)
})
t('allergy not provided -> not assessed + missing, never clear', () => {
  const r = assess(kb, sel('amox'), {})
  assert.equal(r.checks.allergy.status, 'missing')
  assert.ok(r.missing.some((m) => m.field === 'allergy'))
})
t('NKDA -> allergy clear', () => {
  assert.equal(assess(kb, sel('amox'), { allergyStatus: 'nkda' }).checks.allergy.status, 'clear')
})
t('penicillin allergy matches via amoxicillin ingredient group; co-amoxiclav allergy matches amoxicillin rule', () => {
  const r = assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [{ allergen: 'group:pen', reaction: 'rash' }] })
  assert.ok(r.findings.some((f) => f.kind === 'allergy' && f.level === 'contraindicated'))
  const r2 = assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [{ allergen: 'coamox', reaction: 'delayed' }] })
  assert.ok(r2.findings.some((f) => f.kind === 'allergy'))
})
t('reaction filter: delayed reaction does not trigger immediate-severe-only rule; unknown reaction is provisional', () => {
  const del = assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [{ allergen: 'group:ceph', reaction: 'delayed' }] })
  assert.equal(del.findings.filter((f) => f.ruleIds.includes('amox-allergy-bl')).length, 0)
  const unk = assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [{ allergen: 'group:ceph', reaction: 'unknown' }] })
  const f = unk.findings.find((x) => x.ruleIds.includes('amox-allergy-bl'))
  assert.ok(f && f.provisional)
})
t('intolerance is not treated as allergy', () => {
  const r = assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [{ allergen: 'amox', reaction: 'intolerance' }] })
  assert.equal(r.findings.filter((f) => f.kind === 'allergy').length, 0)
})
t('conditions: entered -> finding; not entered & list incomplete -> missing; complete -> clear', () => {
  assert.ok(assess(kb, sel('amox'), { conditions: ['mono'] }).findings.some((f) => f.kind === 'condition'))
  const inc = assess(kb, sel('amox'), {})
  assert.equal(inc.checks.conditions.status, 'missing')
  assert.ok(inc.missing.find((m) => m.field === 'conditions').impacts.some((i) => i.ruleId === 'amox-mono'))
  const comp = assess(kb, sel('amox'), { conditionsComplete: true })
  assert.equal(comp.checks.conditions.status, 'clear')
  assert.ok(!comp.missing.some((m) => m.field === 'conditions'))
})
t('formulation-specific rule only fires for that formulation', () => {
  assert.equal(assess(kb, sel('amox:amox-cap'), { conditions: ['ulcer'] }).findings.length, 0)
  assert.equal(assess(kb, sel('amox:amox-susp'), { conditions: ['ulcer'] }).findings.length, 1)
})
t('renal: eGFR thresholds with min inclusive / max exclusive', () => {
  assert.deepEqual(levels(assess(kb, sel('met'), { egfr: 29 })), ['renal:contraindicated'])
  assert.deepEqual(levels(assess(kb, sel('met'), { egfr: 30 })), ['renal:dose'])
  assert.deepEqual(levels(assess(kb, sel('met'), { egfr: 45 })), [])
})
t('renal: missing -> not assessed with impacts listed', () => {
  const r = assess(kb, sel('met'), {})
  assert.equal(r.checks.renal.status, 'missing')
  assert.equal(r.missing.find((m) => m.field === 'renal').impacts.length, 3) // two numeric rules + the 'renal impairment' rule with no number
})
t('renal: CrCl rule with only eGFR is provisional and asks for CrCl', () => {
  const r = assess(kb, sel('dabig'), { egfr: 25 })
  assert.ok(r.findings[0].provisional)
  assert.ok(r.missing.some((m) => m.field === 'crcl'))
  const r2 = assess(kb, sel('dabig'), { egfr: 25, crcl: 35 })
  assert.equal(r2.findings.length, 0)
})
t('pregnancy: male -> n/a; not provided -> missing; trimester filter; unknown trimester provisional', () => {
  assert.equal(assess(kb, sel('warf'), { sex: 'male' }).checks.pregnancy.status, 'na')
  assert.equal(assess(kb, sel('warf'), {}).checks.pregnancy.status, 'missing')
  assert.equal(assess(kb, sel('warf'), { pregnancy: 'yes', trimester: 2 }).findings.filter((f) => f.kind === 'pregnancy').length, 0)
  assert.equal(assess(kb, sel('warf'), { pregnancy: 'yes', trimester: 1 }).findings.filter((f) => f.kind === 'pregnancy').length, 1)
  const u = assess(kb, sel('warf'), { pregnancy: 'yes' }).findings.find((f) => f.kind === 'pregnancy')
  assert.ok(u.provisional)
})
t('hepatic: severity filter and unknown severity provisional', () => {
  assert.equal(assess(kb, sel('warf'), { hepatic: 'mild' }).findings.filter((f) => f.kind === 'hepatic').length, 0)
  assert.equal(assess(kb, sel('warf'), { hepatic: 'severe' }).findings.filter((f) => f.kind === 'hepatic').length, 1)
  assert.ok(assess(kb, sel('warf'), { hepatic: 'unknown-severity' }).findings.find((f) => f.kind === 'hepatic').provisional)
  assert.equal(assess(kb, sel('warf'), {}).checks.hepatic.status, 'missing')
})
t('age: under 12 contraindicated, 12 not', () => {
  assert.equal(assess(kb, sel('cocod'), { ageYears: 11.9 }).findings.filter((f) => f.kind === 'age').length, 1)
  assert.equal(assess(kb, sel('cocod'), { ageYears: 12 }).findings.filter((f) => f.kind === 'age').length, 0)
})
t('medicine list not complete -> lists other database medicines that interact', () => {
  const r = assess(kb, sel('warf'), {})
  const m = r.missing.find((x) => x.field === 'medsComplete')
  assert.ok(m.impacts.some((i) => i.med === 'Ibuprofen') && m.impacts.some((i) => i.med === 'Clopidogrel'))
  assert.ok(!assess(kb, sel('warf'), { medsComplete: true }).missing.some((x) => x.field === 'medsComplete'))
})
t('weight needed for weight-based child dose', () => {
  assert.ok(assess(kb, sel('amox'), { ageYears: 5 }).missing.some((m) => m.field === 'weight'))
  assert.ok(!assess(kb, sel('amox'), { ageYears: 5, weightKg: 18 }).missing.some((m) => m.field === 'weight'))
})
t("a medicine's own rules do not fire for another medicine that shares an ingredient", () => {
  // amox-mono belongs to amoxicillin; co-amoxiclav contains amoxicillin but must not inherit it
  assert.equal(assess(kb, sel('coamox'), { conditions: ['mono'] }).findings.length, 0)
  assert.equal(assess(kb, sel('amox'), { conditions: ['mono'] }).findings.length, 1)
})
t('allergy to clavulanic acid alone does not match the penicillin group; co-amoxiclav allergy does', () => {
  assert.equal(assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [{ allergen: 'clav', reaction: 'delayed' }] }).findings.filter((f) => f.kind === 'allergy').length, 0)
  assert.ok(assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [{ allergen: 'coamox', reaction: 'delayed' }] }).findings.some((f) => f.kind === 'allergy'))
})
t('a specific condition triggers rules for the broader condition it implies', () => {
  const k2 = { ...kb, conditionImplies: { 'mono-severe': ['mono'] } }
  assert.equal(assess(k2, sel('amox'), { conditions: ['mono-severe'] }).findings.filter((f) => f.kind === 'condition').length, 1)
  assert.equal(assess(k2, sel('amox'), { conditions: ['ulcer'] }).findings.filter((f) => f.kind === 'condition').length, 0)
})
t('Cockcroft-Gault reproduces the SPS worked example (80 y man, 60 kg, 120 micromol/L -> 37 mL/min)', () => {
  assert.equal(Math.round(cockcroftGault({ ageYears: 80, weightKg: 60, sex: 'male', creatinine: 120 }).value), 37)
  assert.equal(cockcroftGault({ ageYears: 80, weightKg: 60, sex: null, creatinine: 120 }), null)
})
t('calcDose arithmetic and cap', () => {
  const d = calcDose({ mgPerKg: 25, per: 'day', dividedInto: 3, maxMg: 3000, maxPer: 'day' }, 18)
  assert.equal(d.total, 450); assert.equal(d.perDose, 150)
  const c = calcDose({ mgPerKg: 25, per: 'day', dividedInto: 3, maxMg: 3000, maxPer: 'day' }, 200)
  assert.equal(c.total, 3000); assert.ok(c.capped)
})
t('unknown medicine id is reported, not silently dropped', () => {
  assert.deepEqual(assess(kb, sel('nope'), {}).unknown, ['nope'])
})
t('a throwing check is reported as failed, not clear', () => {
  const bad = { ...kb, rules: [...kb.rules, { id: 'boom', kind: 'renal', level: 'dose', med: 'warf', renal: null, src: S }] }
  const r = assess(bad, sel('warf'), { egfr: 20 })
  assert.equal(r.checks.renal.status, 'failed')
  assert.ok(r.errors.includes('renal'))
})
t('condition rule with extra age limit: needs both; unknown age is provisional', () => {
  assert.equal(assess(kb, sel('cocod'), { conditions: ['mono'], ageYears: 30 }).findings.filter((f) => f.kind === 'condition').length, 0)
  assert.equal(assess(kb, sel('cocod'), { conditions: ['mono'], ageYears: 8 }).findings.filter((f) => f.kind === 'condition').length, 1)
  const u = assess(kb, sel('cocod'), { conditions: ['mono'] })
  assert.ok(u.findings.find((f) => f.kind === 'condition').provisional)
  assert.ok(u.missing.some((m) => m.field === 'age'))
})
t('renal-impairment condition without a number links to eGFR < 60 (provisional), not at 75', () => {
  const f = assess(kb, sel('met'), { egfr: 45 }).findings.find((x) => x.ruleIds.includes('met-ri'))
  assert.ok(f && f.provisional)
  assert.equal(assess(kb, sel('met'), { egfr: 75 }).findings.filter((x) => x.ruleIds.includes('met-ri')).length, 0)
})
t('"Has allergies" with no allergen entered is not assessed, not clear', () => {
  const r = assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [] })
  assert.equal(r.checks.allergy.status, 'missing')
  assert.ok(r.missing.some((m) => m.field === 'allergy'))
})
t('renal link: CrCl below the limit triggers even when eGFR is above it; counted under kidney function', () => {
  const r = assess(kb, sel('met'), { egfr: 75, crcl: 25 })
  assert.ok(r.findings.some((f) => f.ruleIds.includes('met-ri')))
  assert.equal(r.checks.renal.status, 'issues')
})
t('patient value entered but no rule of that kind: "no sourced rule", never a green clear', () => {
  assert.equal(assess(kb, sel('ibu'), { hepatic: 'severe' }).checks.hepatic.status, 'clear-norules')
  assert.equal(assess(kb, sel('ibu'), { egfr: 50 }).checks.renal.status, 'clear-norules')
})
t('finding keys are unique (allergy to a medicine and its group at once)', () => {
  const r = assess(kb, sel('amox'), { allergyStatus: 'listed', allergies: [{ allergen: 'amox', reaction: 'delayed' }, { allergen: 'group:pen', reaction: 'delayed' }] })
  const keys = r.findings.map((f) => f.key)
  assert.equal(new Set(keys).size, keys.length)
})
t('values are shown as entered, not rounded across a threshold', () => {
  const f = assess(kb, sel('met'), { egfr: 29.96 }).findings.find((x) => x.kind === 'renal')
  assert.ok(f.factor.includes('29.96'), f.factor)
})
t('same medicine twice: interactions "needs 2 or more medicines", not "none found"', () => {
  assert.equal(assess(kb, sel('warf', 'warf'), {}).checks.interactions.status, 'na')
})
console.log(`\n${n} engine tests passed`)
