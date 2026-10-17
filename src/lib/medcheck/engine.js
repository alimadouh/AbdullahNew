// UK Medication Safety Checker engine (pure, no DOM).
// assess(kb, selection, patient) -> { findings, cumulative, missing, checks, counts }
// Every finding comes from a sourced rule in kb.rules, except "same active ingredient" which the tool detects itself
// (labelled as such). Unknown patient data is never treated as "absent": rules that need it go to `missing`.

export const LEVELS = ['contraindicated', 'avoid', 'dose', 'caution', 'monitor', 'info']
export const LEVEL_LABEL = {
  contraindicated: 'Contraindicated',
  avoid: 'Avoid / not recommended',
  dose: 'Dose adjustment',
  caution: 'Caution',
  monitor: 'Monitor',
  info: 'Note',
}
// condition ids whose source wording has no number, linked to the kidney value entered (NICE NG203 GFR categories)
const RENAL_LINK = { 'renal-impairment': [60, 'GFR below 60 meets the CKD definition', 'ckdDefinition'], 'severe-renal-impairment': [30, 'GFR 15 to 29 is a "severe reduction" (G4), below 15 is kidney failure (G5)', 'ckd'] }
export const rank = (l) => (LEVELS.includes(l) ? LEVELS.indexOf(l) : LEVELS.length)
const top = (levels) => levels.slice().sort((a, b) => rank(a) - rank(b))[0]

export const REACTION_GROUPS = [
  { id: 'immediate-severe', name: 'Anaphylaxis / angioedema' },
  { id: 'immediate', name: 'Urticaria / bronchospasm' },
  { id: 'delayed', name: 'Delayed non-severe rash' },
  { id: 'severe-cutaneous', name: 'SJS / TEN / DRESS' },
  { id: 'intolerance', name: 'Side effect / intolerance (not allergy)' },
  { id: 'unknown', name: 'Reaction not known' },
]
export const HEPATIC_LEVELS = [
  { id: 'none', name: 'No hepatic impairment' },
  { id: 'mild', name: 'Mild (Child-Pugh A)' },
  { id: 'moderate', name: 'Moderate (Child-Pugh B)' },
  { id: 'severe', name: 'Severe (Child-Pugh C)' },
  { id: 'unknown-severity', name: 'Impaired, severity not known' },
]

export const EFFECT_LABEL = {
  bleeding: 'Bleeding risk',
  hyperkalaemia: 'Hyperkalaemia',
  'serotonin-syndrome': 'Serotonin syndrome',
  'qt-prolongation': 'QT prolongation',
  'cns-respiratory-depression': 'CNS / respiratory depression',
  hypotension: 'Hypotension',
  myopathy: 'Myopathy / rhabdomyolysis',
  nephrotoxicity: 'Kidney injury',
  hypoglycaemia: 'Hypoglycaemia',
  'seizure-threshold': 'Lowered seizure threshold',
  hepatotoxicity: 'Liver toxicity',
  'bone-marrow-suppression': 'Bone marrow suppression',
  hyponatraemia: 'Hyponatraemia',
  'reduced-absorption': 'Reduced absorption',
}

// Cockcroft-Gault creatinine clearance, serum creatinine in micromol/L, actual body weight.
// CrCl (mL/min) = (140 - age) x weight(kg) x F / creatinine, F = 1.23 (male) or 1.04 (female).
// Reproduces the SPS worked example: 80-year-old man, 60 kg, 120 micromol/L -> 37 mL/min.
export function cockcroftGault({ ageYears, weightKg, sex, creatinine }) {
  if (![ageYears, weightKg, creatinine].every((x) => Number.isFinite(x) && x > 0) || !['male', 'female'].includes(sex)) return null
  const f = sex === 'male' ? 1.23 : 1.04
  return { value: ((140 - ageYears) * weightKg * f) / creatinine, factor: f }
}

export function indexKb(kb) {
  const med = new Map(kb.medicines.map((m) => [m.id, m]))
  const groupsOf = new Map(kb.medicines.map((m) => [m.id, new Set(m.groups ?? [])]))
  const groupMembers = new Map(Object.values(kb.groups ?? {}).map((g) => [g.id, new Set(g.members ?? [])]))
  const src = kb.sources ?? {}
  return { kb, med, groupsOf, groupMembers, src }
}

// Does reference x ('medId' | 'ingredientId' | 'group:id') cover medicine m?
function covers(ix, x, m) {
  if (!x || !m) return false
  if (x.startsWith('group:')) return ix.groupsOf.get(m.id)?.has(x.slice(6)) || ix.groupMembers.get(x.slice(6))?.has(m.id) || false
  return x === m.id || (m.ingredients ?? []).includes(x)
}

// Expand an allergen reference to a set of tokens (group ids + medicine ids + ingredient ids) for overlap tests.
function allergenTokens(ix, x) {
  const out = new Set([x])
  if (x.startsWith('group:')) {
    const g = x.slice(6)
    // members' ids, plus the ingredient of single-ingredient members only (clavulanic acid is not a penicillin)
    for (const m of ix.kb.medicines) if (covers(ix, x, m)) { out.add(m.id); if ((m.ingredients ?? []).length === 1) out.add(m.ingredients[0]) }
    out.add(`group:${g}`)
  } else {
    const m = ix.med.get(x)
    if (m) for (const i of m.ingredients ?? []) out.add(i)
  }
  return out
}

function sourcesOf(ix, rule) {
  const out = []
  for (const r of rule.src ?? []) {
    const have = out.find((x) => x.id === r.s)
    if (have) { have.quote += ` … ${r.q}`; continue }
    const s = ix.src[r.s]
    out.push({ id: r.s, quote: r.q, ...(s ? { title: s.title, url: s.url, publisher: s.publisher, type: s.type, version: s.version } : { title: 'Unknown source', missing: true }) })
  }
  return out
}
// Skin, eye, ear, nose, mouth and vaginal products: a systemic interaction written for another medicine (matched only by a
// shared ingredient or a group) is not applied to them. A rule that names the medicine itself still applies.
// whole words only: "subcutaneous" and "intradermal" injections are systemic, not local
const LOCAL_ROUTE = /\b(topical|cutaneous|skin|dermal|eye|eyes|ocular|ophthalmic|ear|ears|otic|aural|auricular|nasal|nose|vaginal|oromucosal|buccal|mouth|dental|gingival|scalp|shampoo)\b/i
export const isLocal = (f) => !!f && !f.systemic && LOCAL_ROUTE.test(`${f.route ?? ''}`) // systemic: true = given locally for a whole-body effect (e.g. progesterone pessary)
const applies = (rule, item) => !rule.formulations?.length || rule.formulations.includes(item.formId)
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.trunc(n * 100) / 100))

export function renalRange(r) {
  const { measure, min, max, maxInclusive } = r.renal
  const unit = measure === 'eGFR' ? ' mL/min/1.73 m²' : ' mL/min'
  if (min != null && max != null) return `${measure} ${min}–${maxInclusive ? max : `<${max}`}${unit}`.replace('–<', ' to <')
  if (max != null) return `${measure} ${maxInclusive ? '≤' : '<'}${max}${unit}`
  return `${measure} ≥${min}${unit}`
}
const inRange = (v, { min, max, maxInclusive }) => (min == null || v >= min) && (max == null || (maxInclusive ? v <= max : v < max))

export function ruleScope(kb, rule) {
  const names = (ids) => ids.map((x) => nameOfRef(kb, x)).join(', ')
  switch (rule.kind) {
    case 'renal': return renalRange(rule)
    case 'hepatic': return rule.hepatic.includes('any') ? 'Any hepatic impairment' : `Hepatic impairment: ${rule.hepatic.join(', ')}`
    case 'age': return ageText(rule.age)
    case 'pregnancy': return rule.trimesters?.length && rule.trimesters.length < 3 ? `Pregnancy, trimester ${rule.trimesters.join(' & ')}` : 'Pregnancy'
    case 'breastfeeding': return 'Breastfeeding'
    case 'condition': return kb.conditions?.find((c) => c.id === rule.condition)?.name ?? rule.condition
    case 'allergy': return `Allergy to ${names(rule.allergen)}${rule.reactions?.length ? ` (${rule.reactions.map((r) => REACTION_GROUPS.find((x) => x.id === r)?.name ?? r).join(', ')})` : ''}`
    case 'interaction': return `With ${nameOfRef(kb, rule.other)}`
    default: return ''
  }
}
export function ageText({ minYears, maxYears }) {
  if (!minYears) minYears = null
  const y = (n) => (n < 2 ? `${Math.round(n * 12)} months` : `${fmt(n)} years`)
  if (minYears != null && maxYears != null) return `Age ${y(minYears)} to under ${y(maxYears)}`
  if (maxYears != null) return `Age under ${y(maxYears)}`
  return `Age ${y(minYears)} and over`
}
export function nameOfRef(kb, x) {
  if (!x) return ''
  if (x.startsWith('group:')) return kb.groups?.[x.slice(6)]?.name ?? x.slice(6)
  return kb.medicines.find((m) => m.id === x)?.name ?? kb.ingredientNames?.[x] ?? x
}

function finding(ix, rule, items, factor, extra = {}) {
  const viaComponent = items.find((i) => i.m && i.m.id !== rule.med && (i.m.components?.use ?? []).includes(rule.med))
  if (viaComponent) extra = { ...extra, provisional: [extra.provisional, `${viaComponent.m.name} has no UK combination product; this comes from the UK information for ${ix.med.get(rule.med)?.name ?? rule.med}.`].filter(Boolean).join(' ') }
  return {
    key: `${rule.id}|${items.map((i) => i.key).sort().join('+')}`,
    ruleIds: [rule.id],
    kind: rule.kind,
    level: rule.level,
    concern: rule.concern,
    items: items.map((i) => i.key),
    meds: items.map((i) => i.label),
    factor,
    effect: rule.effect ?? null,
    statements: [{ ruleId: rule.id, title: rule.concern, level: rule.level, about: ix.med.get(rule.med)?.name ?? nameOfRef(ix.kb, rule.med), consequence: rule.consequence, action: rule.action, sourceWording: rule.sourceWording, sources: sourcesOf(ix, rule), verified: rule.v !== false, provisional: extra.provisional ?? null }],
    provisional: extra.provisional ?? null,
    verified: rule.v !== false,
  }
}

// Merge findings that concern the same medicines + kind (+ condition/allergen) into one row with several sourced statements.
function mergeRows(list) {
  const rows = new Map()
  for (const f of list) {
    // one row per medicine pair for interactions (all sourced statements together); other kinds per concern
    const k = `${f.kind}|${f.items.slice().sort().join('+')}|${f.factor ?? ''}|${f.kind === 'interaction' ? '' : f.concern}`
    const r = rows.get(k)
    if (!r) { rows.set(k, { ...f, key: k, statements: [...f.statements], ruleIds: [...f.ruleIds], effects: f.effect ? [f.effect] : [] }); continue }
    if (f.effect && !r.effects.includes(f.effect)) r.effects.push(f.effect)
    for (const s of f.statements) if (!r.statements.some((x) => x.ruleId === s.ruleId)) r.statements.push(s)
    r.ruleIds.push(...f.ruleIds.filter((id) => !r.ruleIds.includes(id)))
    r.level = top([r.level, f.level])
    r.verified = r.verified && f.verified
    if (f.provisional && !(r.provisional ?? '').includes(f.provisional)) r.provisional = [r.provisional, f.provisional].filter(Boolean).join(' ')
  }
  for (const r of rows.values()) {
    r.statements.sort((a, b) => rank(a.level) - rank(b.level))
    if (r.kind === 'interaction') {
      const effects = [...new Set(r.effects ?? [r.effect].filter(Boolean))]
      r.concern = effects.length ? `Interaction: ${effects.map((e) => EFFECT_LABEL[e] ?? e).join(' · ')}` : `Interaction: ${r.statements[0].title ?? ''}`
    }
  }
  return [...rows.values()]
}

const isSet = (v) => v !== null && v !== undefined && v !== ''

// selection: [{ key, medId, formId }]
// patient: { ageYears, sex, weightKg, pregnancy ('yes'|'no'|null), trimester (1|2|3|null), breastfeeding ('yes'|'no'|null),
//            egfr, crcl, hepatic (HEPATIC_LEVELS id | null), allergyStatus ('nkda'|'listed'|null), allergies [{allergen, reaction}],
//            conditions [ids], conditionsComplete (bool), medsComplete (bool) }
export function assess(kb, selection, patient = {}) {
  const ix = indexKb(kb)
  const p = { allergies: [], conditions: [], ...patient }
  const items = selection.map((s) => {
    const m = ix.med.get(s.medId)
    const f = m?.formulations.find((x) => x.id === s.formId) ?? m?.formulations[0]
    return m ? { ...s, m, f, formId: f?.id, label: f && m.formulations.length > 1 ? `${m.name} ${f.label.toLowerCase()}` : m?.name } : { ...s, m: null, label: s.medId }
  })
  const unknown = items.filter((i) => !i.m)
  const valid = items.filter((i) => i.m)
  const raw = []
  const missing = new Map() // field -> { field, label, why, impacts: [] }
  const needs = (field, label, why, impact) => {
    if (!missing.has(field)) missing.set(field, { field, label, why, impacts: [] })
    const e = missing.get(field)
    if (impact && !e.impacts.some((x) => x.ruleId === impact.ruleId && x.med === impact.med) && !e.impacts.some((x) => x.med === impact.med && x.scope === impact.scope && x.level === impact.level && x.concern === impact.concern)) e.impacts.push(impact)
  }
  const checks = {}
  const errors = []
  const run = (area, fn) => { try { fn() } catch (e) { errors.push(area); checks[area] = { status: 'failed', note: String(e?.message ?? e) } } }

  // a rule's own medicine (`med`) matches only that medicine or a group it belongs to, never by shared ingredient
  // (amoxicillin's rules must not fire for co-amoxiclav); `other` and allergens do match by ingredient.
  const ownerMatch = (x, m) => (x.startsWith('group:') ? covers(ix, x, m) : x === m.id || (m.components?.use ?? []).includes(x))
  // a form with no UK product has no rules of its own (shown as not checked)
  const rulesFor = (item, kind) => (item.f?.availability === 'no-uk-product' ? [] : kb.rules.filter((r) => r.kind === kind && ownerMatch(r.med, item.m) && applies(r, item)))
  const impactOf = (item, r) => ({ ruleId: r.id, med: item.label, level: r.level, scope: ruleScope(kb, r), concern: r.kind === 'interaction' ? r.concern : '' })
  // Secondary age limit on a non-age rule: 'skip' when the patient is outside it, a note when age is unknown.
  const ageGate = (it, r) => {
    if (!r.age || r.kind === 'age') return null
    if (Number.isFinite(p.ageYears)) return (r.age.minYears == null || p.ageYears >= r.age.minYears) && (r.age.maxYears == null || p.ageYears < r.age.maxYears) ? null : 'skip'
    needs('age', 'Age', 'Age limits cannot be checked.', impactOf(it, r))
    return `Age not recorded; this applies to ${ageText(r.age).toLowerCase()}`
  }

  // 1. Same active ingredient selected more than once (tool-detected) + sourced duplication rules.
  run('duplication', () => {
    const byIng = new Map()
    // same ingredient counts as a duplicate only within the same kind of use: systemic with systemic,
    // or the same local route (eye drops with dexamethasone are not a duplicate of dexamethasone tablets)
    const useOf = (it) => (isLocal(it.f) ? `local:${String(it.f?.route ?? '').toLowerCase()}` : 'systemic')
    for (const it of valid) for (const ing of it.m.ingredients) { const k = `${ing}|${useOf(it)}`; if (!byIng.has(k)) byIng.set(k, []); byIng.get(k).push(it) }
    let n = 0
    for (const [key, its] of byIng) {
      const ing = key.split('|')[0]
      if (its.length < 2) continue
      n++
      const about = (r, it) => (r.other ? r.other === ing || ix.med.get(r.other)?.ingredients?.includes(ing) || r.other.startsWith('group:') : it.m.ingredients.length === 1)
      const srcRules = its.flatMap((it) => rulesFor(it, 'duplication').filter((r) => about(r, it) && (!r.other || its.some((o) => o !== it && covers(ix, r.other, o.m)))))
      const name = kb.ingredientNames?.[ing] ?? ing
      if (srcRules.length) {
        for (const r of srcRules) raw.push(finding(ix, r, its, `Same ingredient: ${name}`))
      } else {
        raw.push({ key: `dup|${key}`, ruleIds: [], kind: 'duplication', level: 'caution', concern: `Same active ingredient (${name}) in ${its.length} entries`, items: its.map((i) => i.key), meds: its.map((i) => i.label), factor: null, effect: null, toolCheck: true, verified: true,
          statements: [{ ruleId: null, level: 'caution', about: 'Tool check', consequence: `${name} is counted more than once.`, action: `Check this is intended and add up the total ${name} dose against its maximum.`, sourceWording: null, sources: [], verified: true }] })
      }
    }
    checks.duplication = { status: valid.length < 2 ? 'na' : n ? 'issues' : 'clear', count: n }
  })

  // 2. Interactions between every pair of selected entries (both directions; sourced rules only).
  run('interactions', () => {
    let n = 0
    for (let a = 0; a < valid.length; a++) for (let b = 0; b < valid.length; b++) {
      if (a === b) continue
      const A = valid[a], B = valid[b]
      if (A.medId === B.medId) continue // same medicine twice: handled by duplication
      for (const r of rulesFor(A, 'interaction')) if (covers(ix, r.other, B.m) && (!r.otherFormulations?.length || r.otherFormulations.includes(B.formId)) && !(r.otherExcept ?? []).includes(B.m.id) && !(r.other !== B.m.id && isLocal(B.f))) {
        const gate = ageGate(A, r)
        if (gate === 'skip') continue
        raw.push(finding(ix, r, [A, B], null, { provisional: gate })); n++
      }
    }
    const distinct = new Set(valid.map((i) => i.medId)).size
    checks.interactions = { status: distinct < 2 ? 'na' : n ? 'issues' : 'clear', distinct, complete: !!p.medsComplete }
    if (!p.medsComplete && valid.length) {
      // rule-based: which other medicines in this database interact with the selection
      const sel = new Set(valid.map((i) => i.medId))
      const others = new Map()
      for (const it of valid) {
        for (const r of rulesFor(it, 'interaction')) for (const m of kb.medicines) if (!sel.has(m.id) && covers(ix, r.other, m)) others.set(m.id, top([others.get(m.id) ?? 'info', r.level]))
        for (const r of kb.rules) if (r.kind === 'interaction' && !sel.has(r.med) && covers(ix, r.other, it.m)) for (const m of kb.medicines) if (!sel.has(m.id) && ownerMatch(r.med, m)) others.set(m.id, top([others.get(m.id) ?? 'info', r.level]))
      }
      const list = [...others].sort((x, y) => rank(x[1]) - rank(y[1])).map(([id, level]) => ({ ruleId: `other:${id}`, med: ix.med.get(id).name, level, scope: 'Interacts with the selection', concern: '' }))
      needs('medsComplete', 'Full medicine list (including OTC and herbal)', 'Interactions are only checked between the medicines entered.', null)
      missing.get('medsComplete').impacts.push(...list)
    }
  })

  // 3. Allergies
  run('allergy', () => {
    const relevant = valid.flatMap((it) => rulesFor(it, 'allergy').map((r) => [it, r]))
    const listed = p.allergies.filter((a) => a?.allergen)
    if (p.allergyStatus == null || (p.allergyStatus === 'listed' && !listed.length)) {
      checks.allergy = { status: 'missing', note: p.allergyStatus === 'listed' ? 'No allergen entered' : undefined }
      for (const [it, r] of relevant) needs('allergy', 'Allergy history and reaction type', 'Hypersensitivity contraindications and cross-reactivity cannot be checked.', impactOf(it, r))
      return
    }
    if (p.allergyStatus === 'nkda') { checks.allergy = { status: 'clear', note: 'No known drug allergies recorded' }; return }
    let n = 0
    for (const al of p.allergies) {
      if (!al?.allergen) continue
      const tokA = allergenTokens(ix, al.allergen)
      for (const [it, r] of relevant) {
        const hit = r.allergen.some((x) => [...allergenTokens(ix, x)].some((t) => tokA.has(t)))
        if (!hit) continue
        const factor = `Allergy: ${nameOfRef(kb, al.allergen)} (${REACTION_GROUPS.find((x) => x.id === al.reaction)?.name ?? 'reaction not recorded'})`
        if (al.reaction === 'intolerance' && !(r.reactions ?? []).includes('intolerance')) continue
        if (r.reactions?.length && al.reaction && al.reaction !== 'unknown' && !r.reactions.includes(al.reaction)) continue
        const notes = []
        if (r.reactions?.length && (!al.reaction || al.reaction === 'unknown')) notes.push('Reaction type not recorded; the source limits this to: ' + r.reactions.map((x) => REACTION_GROUPS.find((g) => g.id === x)?.name ?? x).join(', ') + '.')
        // allergy recorded to a combination product: the match may be through a component that was not the cause
        const allergenMed = ix.med.get(al.allergen)
        if (allergenMed && allergenMed.ingredients.length > 1 && it.medId !== allergenMed.id) {
          const ruleTok = new Set(r.allergen.flatMap((x) => [...allergenTokens(ix, x)]))
          if (!ruleTok.has(allergenMed.id)) notes.push(`The allergy is recorded to ${allergenMed.name}, which contains ${allergenMed.ingredients.map((i) => kb.ingredientNames?.[i] ?? i).join(' and ')}; it is not known which component caused it.`)
        }
        const provisional = notes.length ? notes.join(' ') : null
        raw.push(finding(ix, r, [it], factor, { provisional })); n++
      }
      // allergy to a selected medicine with no matching sourced rule: still flag it (tool check)
      for (const it of valid) {
        const direct = [it.medId, ...it.m.ingredients].some((t) => tokA.has(t))
        if (direct && al.reaction !== 'intolerance' && !raw.some((f) => f.kind === 'allergy' && f.items.includes(it.key))) {
          raw.push({ key: `allergy-direct|${it.key}|${al.allergen}`, ruleIds: [], kind: 'allergy', level: 'caution', concern: `Recorded allergy to ${nameOfRef(kb, al.allergen)}`, items: [it.key], meds: [it.label], factor: `Allergy: ${nameOfRef(kb, al.allergen)}`, effect: null, toolCheck: true, verified: true,
            statements: [{ ruleId: null, level: 'caution', about: 'Tool check', consequence: 'The patient has a recorded allergy that matches this medicine.', action: 'Review the allergy history before prescribing. No sourced rule for this allergen is loaded.', sources: [], verified: true }] })
          n++
        }
      }
    }
    checks.allergy = { status: n ? 'issues' : relevant.length ? 'clear' : 'clear-norules', count: n, note: `${listed.length} allerg${listed.length === 1 ? 'y' : 'ies'} recorded` }
  })

  // 4. Diseases / conditions
  run('conditions', () => {
    let n = 0
    // a specific condition also counts as the broader ones it is a kind of (kb.conditionImplies, transitive)
    const have = new Set(p.conditions)
    for (let grew = true; grew;) { grew = false; for (const c of [...have]) for (const q of kb.conditionImplies?.[c] ?? []) if (!have.has(q)) { have.add(q); grew = true } }
    for (const it of valid) for (const r of rulesFor(it, 'condition')) {
      // some condition rules also carry an age limit (both must match)
      const gate = ageGate(it, r)
      if (gate === 'skip') continue
      const provisional = gate
      if (!have.has(r.condition) && RENAL_LINK[r.condition]) continue // checked under kidney function
      if (have.has(r.condition)) { raw.push(finding(ix, r, [it], kb.conditions?.find((c) => c.id === r.condition)?.name ?? r.condition, { provisional })); n++ }
      else if (!p.conditionsComplete) needs('conditions', 'Diagnoses not yet excluded', 'Only the diagnoses entered were checked. These diagnoses would change the advice:', impactOf(it, r))
    }
    checks.conditions = { status: n ? 'issues' : p.conditionsComplete ? 'clear' : p.conditions.length ? 'partial' : 'missing', count: n, entered: p.conditions.length }
  })

  // 5. Pregnancy
  run('pregnancy', () => {
    const rel = valid.flatMap((it) => rulesFor(it, 'pregnancy').map((r) => [it, r]))
    if (p.sex === 'male') { checks.pregnancy = { status: 'na' }; return }
    if (p.pregnancy === 'no') { checks.pregnancy = { status: rel.length ? 'clear' : 'clear-norules', note: 'Not pregnant' }; return }
    if (p.pregnancy !== 'yes') {
      checks.pregnancy = { status: rel.length ? 'missing' : 'clear-norules' }
      for (const [it, r] of rel) needs('pregnancy', 'Pregnancy status', 'Pregnancy restrictions cannot be checked.', impactOf(it, r))
      return
    }
    let n = 0
    for (const [it, r] of rel) {
      if (r.trimesters?.length && p.trimester && !r.trimesters.includes(p.trimester)) continue
      const provisional = r.trimesters?.length && r.trimesters.length < 3 && !p.trimester ? `Trimester not given; this applies to trimester ${r.trimesters.join(' & ')}` : null
      if (provisional) needs('trimester', 'Trimester', 'Some pregnancy advice depends on the trimester.', impactOf(it, r))
      raw.push(finding(ix, r, [it], p.trimester ? `Pregnant (trimester ${p.trimester})` : 'Pregnant', { provisional })); n++
    }
    checks.pregnancy = { status: n ? 'issues' : rel.length ? 'clear' : 'clear-norules', count: n }
  })

  // 6. Breastfeeding
  run('breastfeeding', () => {
    const rel = valid.flatMap((it) => rulesFor(it, 'breastfeeding').map((r) => [it, r]))
    if (p.sex === 'male') { checks.breastfeeding = { status: 'na' }; return }
    if (p.breastfeeding === 'no') { checks.breastfeeding = { status: rel.length ? 'clear' : 'clear-norules', note: 'Not breastfeeding' }; return }
    if (p.breastfeeding !== 'yes') {
      checks.breastfeeding = { status: rel.length ? 'missing' : 'clear-norules' }
      for (const [it, r] of rel) needs('breastfeeding', 'Breastfeeding status', 'Breastfeeding advice cannot be checked.', impactOf(it, r))
      return
    }
    let n = 0
    for (const [it, r] of rel) { raw.push(finding(ix, r, [it], 'Breastfeeding')); n++ }
    checks.breastfeeding = { status: n ? 'issues' : rel.length ? 'clear' : 'clear-norules', count: n }
  })

  // 7. Kidney function (eGFR vs CrCl kept apart; using the other measure is marked provisional)
  run('renal', () => {
    const rel = valid.flatMap((it) => rulesFor(it, 'renal').map((r) => [it, r]))
    const ticked = new Set(p.conditions)
    for (let grew = true; grew;) { grew = false; for (const c of [...ticked]) for (const q of kb.conditionImplies?.[c] ?? []) if (!ticked.has(q)) { ticked.add(q); grew = true } }
    const linked = valid.flatMap((it) => rulesFor(it, 'condition').filter((r) => RENAL_LINK[r.condition] && !ticked.has(r.condition)).map((r) => [it, r]))
    const hasE = Number.isFinite(p.egfr), hasC = Number.isFinite(p.crcl)
    if (!hasE && !hasC) {
      checks.renal = { status: rel.length || linked.length ? 'missing' : 'clear-norules' }
      for (const [it, r] of [...rel, ...linked]) if (ageGate(it, r) !== 'skip') needs('renal', 'Kidney function (eGFR or creatinine clearance)', 'Kidney thresholds cannot be checked.', impactOf(it, r))
      return
    }
    let n = 0
    // the source names renal impairment without a number: link it to the values entered (NICE NG203 GFR categories)
    for (const [it, r] of linked) {
      const gate = ageGate(it, r)
      if (gate === 'skip') continue
      const [lim, what, quoteKey] = RENAL_LINK[r.condition]
      const below = [hasE && p.egfr < lim && `eGFR ${fmt(p.egfr)}`, hasC && p.crcl < lim && `CrCl ${fmt(p.crcl)}`].filter(Boolean)
      if (!below.length) continue
      const name = kb.conditions?.find((c) => c.id === r.condition)?.name ?? r.condition
      const f = finding(ix, r, [it], `${below.join(' and ')} (below ${lim})`, { provisional: [gate, `The source gives no number for "${name}". It is flagged because ${below.join(' and ')} is below ${lim} (NICE NG203: ${what}). Confirm with clinical judgement.`].filter(Boolean).join(' ') })
      if (kb.toolSources?.[quoteKey]) f.statements[0].sources.push({ id: `tool-${quoteKey}`, ...kb.toolSources[quoteKey] })
      raw.push(f); n++
    }
    for (const [it, r] of rel) {
      const gate = ageGate(it, r)
      if (gate === 'skip') continue
      const m = r.renal.measure
      let v = null, used = null, provisional = null
      if (m === 'CrCl') { if (hasC) { v = p.crcl; used = 'CrCl' } else { v = p.egfr; used = 'eGFR'; provisional = 'The source uses creatinine clearance (CrCl); only eGFR was given. Calculate CrCl (Cockcroft-Gault) to confirm.' } }
      else if (m === 'eGFR') { if (hasE) { v = p.egfr; used = 'eGFR' } else { v = p.crcl; used = 'CrCl'; provisional = 'The source uses eGFR; only creatinine clearance was given.' } }
      else { v = hasE ? p.egfr : p.crcl; used = hasE ? 'eGFR' : 'CrCl'; provisional = m === 'GFR' ? `The source says "GFR"; ${used} was used.` : null }
      if (!inRange(v, r.renal)) {
        if (provisional && m === 'CrCl') needs('crcl', 'Creatinine clearance (Cockcroft-Gault)', 'These rules use CrCl, not eGFR:', impactOf(it, r))
        continue
      }
      if (provisional && m === 'CrCl') needs('crcl', 'Creatinine clearance (Cockcroft-Gault)', 'These rules use CrCl, not eGFR:', impactOf(it, r))
      raw.push(finding(ix, r, [it], `${used} ${fmt(v)}${used === 'eGFR' ? ' mL/min/1.73 m²' : ' mL/min'} (rule: ${renalRange(r)})`, { provisional: [provisional, gate].filter(Boolean).join(' ') || null })); n++
    }
    checks.renal = { status: n ? 'issues' : rel.length || linked.length ? 'clear' : 'clear-norules', count: n, note: [hasE && `eGFR ${fmt(p.egfr)}`, hasC && `CrCl ${fmt(p.crcl)}`].filter(Boolean).join(', ') }
  })

  // 8. Hepatic impairment
  run('hepatic', () => {
    const rel = valid.flatMap((it) => rulesFor(it, 'hepatic').map((r) => [it, r]))
    if (!p.hepatic) {
      checks.hepatic = { status: rel.length ? 'missing' : 'clear-norules' }
      for (const [it, r] of rel) needs('hepatic', 'Liver function / hepatic impairment', 'Hepatic restrictions cannot be checked.', impactOf(it, r))
      return
    }
    if (p.hepatic === 'none') { checks.hepatic = { status: rel.length ? 'clear' : 'clear-norules', note: 'No hepatic impairment' }; return }
    let n = 0
    for (const [it, r] of rel) {
      const gate = ageGate(it, r)
      if (gate === 'skip') continue
      const any = r.hepatic.includes('any')
      if (p.hepatic === 'unknown-severity') {
        const sev = any ? null : `Severity not known; this applies to ${r.hepatic.join('/')} impairment.`
        if (sev) needs('hepatic-severity', 'Severity of hepatic impairment', 'Some hepatic advice depends on severity:', impactOf(it, r))
        raw.push(finding(ix, r, [it], 'Hepatic impairment (severity not known)', { provisional: [sev, gate].filter(Boolean).join(' ') || null })); n++
      } else if (any || r.hepatic.includes(p.hepatic)) { raw.push(finding(ix, r, [it], `Hepatic impairment: ${p.hepatic}`, { provisional: gate })); n++ }
    }
    checks.hepatic = { status: n ? 'issues' : rel.length ? 'clear' : 'clear-norules', count: n }
  })

  // 9. Age
  run('age', () => {
    const rel = valid.flatMap((it) => rulesFor(it, 'age').map((r) => [it, r]))
    if (!Number.isFinite(p.ageYears)) {
      checks.age = { status: rel.length ? 'missing' : 'clear-norules' }
      for (const [it, r] of rel) needs('age', 'Age', 'Age limits cannot be checked.', impactOf(it, r))
      return
    }
    let n = 0
    for (const [it, r] of rel) if ((r.age.minYears == null || p.ageYears >= r.age.minYears) && (r.age.maxYears == null || p.ageYears < r.age.maxYears)) { raw.push(finding(ix, r, [it], `Age ${fmt(p.ageYears)} years (rule: ${ageText(r.age)})`)); n++ }
    checks.age = { status: n ? 'issues' : rel.length ? 'clear' : 'clear-norules', count: n }
  })

  // weight is needed for weight-based child doses shown in the tables
  if (!Number.isFinite(p.weightKg)) for (const it of valid) {
    const calcs = Object.values(it.m.sections ?? {}).flatMap((s) => s.items ?? []).filter((x) => x.calc && (!x.formulations || x.formulations.includes(it.formId)))
    if (calcs.length && (!Number.isFinite(p.ageYears) || p.ageYears < 18)) needs('weight', 'Body weight', 'Weight-based doses cannot be calculated.', { ruleId: `calc:${it.key}`, med: it.label, level: 'dose', scope: 'Weight-based dose (mg/kg)', concern: '' })
  }

  const findings = mergeRows(raw)
  if (checks.interactions?.status === 'issues') checks.interactions.count = findings.filter((f) => f.kind === 'interaction').length
  findings.sort((a, b) => rank(a.level) - rank(b.level) || (a.toolCheck ? 1 : 0) - (b.toolCheck ? 1 : 0) || a.concern.localeCompare(b.concern))

  // cumulative effects: 2+ distinct medicines in findings sharing an effect tag
  const byEffect = new Map()
  for (const f of findings) for (const eff of f.effects?.length ? f.effects : [f.effect].filter(Boolean)) { if (!byEffect.has(eff)) byEffect.set(eff, { effect: eff, label: EFFECT_LABEL[eff] ?? eff, meds: new Set(), level: f.level, count: 0 }); const e = byEffect.get(eff); f.meds.forEach((m) => e.meds.add(m)); e.level = top([e.level, f.level]); e.count++ }
  const cumulative = [...byEffect.values()].filter((e) => e.meds.size >= 3 || e.count >= 2).map((e) => ({ ...e, meds: [...e.meds] })).sort((a, b) => rank(a.level) - rank(b.level))

  const missingList = [...missing.values()].map((m) => ({ ...m, impacts: m.impacts.sort((a, b) => rank(a.level) - rank(b.level)), topLevel: m.impacts.length ? top(m.impacts.map((x) => x.level)) : 'info' })).sort((a, b) => rank(a.topLevel) - rank(b.topLevel))

  const counts = Object.fromEntries(LEVELS.map((l) => [l, findings.filter((f) => f.level === l).length]))
  const unchecked = valid.filter((i) => i.m.availability?.status === 'no-uk-product' || i.f?.availability === 'no-uk-product').map((i) => {
    const c = i.m.components
    if (!c?.use?.length) return i.label
    const names = c.use.map((x) => ix.med.get(x)?.name ?? x).join(', ')
    return `${i.label} (checked using the UK information for ${names}${c.missing?.length ? `; not checked: ${c.missing.join(', ')}` : ''})`
  })
  return { findings, cumulative, missing: missingList, checks, counts, unknown: unknown.map((u) => u.medId), unchecked, errors, unverifiedRules: kb.rules.filter((r) => r.v === false).length }
}

// Weight-based dose (explicit arithmetic). Returns null if not computable.
export function calcDose(calc, weightKg, ageYears) {
  if (!calc || !Number.isFinite(weightKg) || weightKg <= 0) return null
  const notes = []
  if (calc.weightMaxKg != null && weightKg > calc.weightMaxKg) notes.push(`The source gives this for weight up to ${calc.weightMaxKg} kg; the patient weighs ${fmt(weightKg)} kg.`)
  if (!Number.isFinite(ageYears) && (calc.ageMinYears != null || calc.ageMaxYears != null)) notes.push(`Age not recorded: the source gives this for ${ageText({ minYears: calc.ageMinYears, maxYears: calc.ageMaxYears }).toLowerCase()}.`)
  if (Number.isFinite(ageYears) && ((calc.ageMinYears != null && ageYears < calc.ageMinYears) || (calc.ageMaxYears != null && ageYears >= calc.ageMaxYears))) notes.push(`The source gives this for ${ageText({ minYears: calc.ageMinYears, maxYears: calc.ageMaxYears }).toLowerCase()}.`)
  let total = calc.mgPerKg * weightKg
  const steps = [`${calc.mgPerKg} mg/kg × ${fmt(weightKg)} kg = ${fmt(total)} mg${calc.per === 'day' ? '/day' : ' per dose'}`]
  let capped = false
  if (calc.maxMg != null && (calc.maxPer ?? calc.per) === calc.per && total > calc.maxMg) { total = calc.maxMg; capped = true; steps.push(`capped at the stated maximum ${calc.maxMg} mg${calc.per === 'day' ? '/day' : ' per dose'}`) }
  let perDose = null
  if (calc.per === 'day' && calc.dividedInto) { perDose = total / calc.dividedInto; steps.push(`÷ ${calc.dividedInto} doses = ${fmt(perDose)} mg per dose`) }
  return { total, perDose, capped, steps, notes, of: calc.of }
}

// Patient-independent summary: for each selected medicine, the situations in which the sources say it must not be given
// (level contraindicated) and, separately, those to avoid. Used for the at-a-glance panel when no patient details are entered.
const CI_KINDS = ['condition', 'pregnancy', 'breastfeeding', 'renal', 'hepatic', 'age', 'allergy']
export function contraindications(kb, selection) {
  const ix = indexKb(kb)
  const ownerMatch = (x, m) => (x.startsWith('group:') ? covers(ix, x, m) : x === m.id || (m.components?.use ?? []).includes(x))
  return selection.map((s) => {
    const m = ix.med.get(s.medId)
    if (!m) return { key: s.key, label: s.medId, contraindicated: [], avoid: [] }
    const f = m.formulations.find((x) => x.id === s.formId) ?? m.formulations[0]
    const item = { formId: f.id }
    if (f.availability === 'no-uk-product') return { key: s.key, noUk: true, label: `${m.name} ${f.label.toLowerCase()}`, contraindicated: [], avoid: [] }
    const out = { contraindicated: new Map(), avoid: new Map() }
    for (const r of kb.rules) {
      if (!CI_KINDS.includes(r.kind) || !['contraindicated', 'avoid'].includes(r.level) || !ownerMatch(r.med, m) || !applies(r, item)) continue
      // conditions use the rule's own wording (keeps qualifiers such as "active", "for enuresis"); others the computed scope
      let scope = r.kind === 'condition' && r.concern ? r.concern : ruleScope(kb, r)
      if (r.age && r.kind !== 'age') scope += ` (${ageText(r.age).toLowerCase()})`
      const bucket = out[r.level]
      if (!bucket.has(scope)) bucket.set(scope, { scope, kind: r.kind, sources: [], ruleIds: [] })
      const e = bucket.get(scope)
      e.ruleIds.push(r.id)
      for (const src of sourcesOf(ix, r)) if (!e.sources.some((x) => x.id === src.id)) e.sources.push(src)
    }
    for (const sc of out.contraindicated.keys()) out.avoid.delete(sc) // listed once, at the stronger level
    const order = (a, b) => CI_KINDS.indexOf(a.kind) - CI_KINDS.indexOf(b.kind) || a.scope.localeCompare(b.scope)
    return { key: s.key, noUk: m.availability?.status === 'no-uk-product', label: m.formulations.length > 1 ? `${m.name} ${f.label.toLowerCase()}` : m.name, contraindicated: [...out.contraindicated.values()].sort(order), avoid: [...out.avoid.values()].sort(order) }
  })
}
