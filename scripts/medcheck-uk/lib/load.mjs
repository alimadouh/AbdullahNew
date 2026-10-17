// Loads the research files (medicines/*.json, sources/*.json, vocab.json) and validates them against SCHEMA.md.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))

export const SECTION_KEYS = ['indications', 'restrictions', 'dosing', 'paediatric', 'contraindications', 'cautions', 'interactions', 'renal', 'hepatic', 'pregnancy', 'breastfeeding', 'reproductive', 'adverseCommon', 'adverseSerious', 'monitoring', 'administration', 'counselling']
export const LEVELS = ['contraindicated', 'avoid', 'dose', 'caution', 'monitor', 'info']
export const KINDS = ['interaction', 'condition', 'allergy', 'pregnancy', 'breastfeeding', 'renal', 'hepatic', 'age', 'duplication']
export const REACTIONS = ['immediate-severe', 'immediate', 'delayed', 'severe-cutaneous', 'intolerance', 'unknown']
export const HEPATIC = ['any', 'mild', 'moderate', 'severe']
// UK-only source policy: allowed hosts (and, for gov.uk, MHRA content only).
const ALLOWED = [/^(www\.)?medicines\.org\.uk$/, /^products\.mhra\.gov\.uk$/, /^(www\.)?gov\.uk$/, /^(www\.)?nice\.org\.uk$/, /^(www\.)?sps\.nhs\.uk$/, /^(www\.)?medicinesinpregnancy\.org$/, /^(www\.)?uktis\.org$/, /^(www\.)?rcophth\.ac\.uk$/, /^assets\.publishing\.service\.gov\.uk$/, /^cms\.mhra\.gov\.uk$/, /^mhraproducts4853\.blob\.core\.windows\.net$/]

export function allowedUrl(url) {
  try { const u = new URL(url); return ALLOWED.some((re) => re.test(u.hostname)) } catch { return false }
}

const canon = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/#.*$/, '').replace(/\/$/, '')

export function loadAll() {
  const vocab = readJson(path.join(ROOT, 'vocab.json'))
  const medDir = path.join(ROOT, 'medicines'), srcDir = path.join(ROOT, 'sources')
  const medicines = fs.readdirSync(medDir).filter((f) => f.endsWith('.json')).sort().map((f) => ({ file: f, ...readJson(path.join(medDir, f)) }))
  const batches = fs.readdirSync(srcDir).filter((f) => f.endsWith('.json')).sort().map((f) => ({ file: f, ...readJson(path.join(srcDir, f)) }))
  const sources = {}, groups = {}, conditions = {}
  for (const g of vocab.groups) groups[g.id] = { id: g.id, name: g.name, members: [] }
  for (const c of vocab.conditions) conditions[c.id] = { id: c.id, name: c.name }
  const problems = []
  const tool = readJson(path.join(ROOT, 'tool.json'))
  batches.push({ file: 'tool.json', sources: tool.sources })
  for (const b of batches) {
    for (const s of b.sources ?? []) {
      if (sources[s.id] && canon(sources[s.id].url) !== canon(s.url)) problems.push(`source id ${s.id} defined twice with different urls (${b.file})`)
      sources[s.id] = { ...s, batch: b.file }
    }
    for (const g of b.groups ?? []) {
      groups[g.id] ??= { id: g.id, name: g.name, members: [] }
      for (const m of g.members ?? []) groups[g.id].members.push({ ...m, batch: b.file })
    }
    for (const c of b.conditions ?? []) conditions[c.id] ??= { id: c.id, name: c.name }
  }
  return { vocab, medicines, batches, sources, groups, conditions, problems, tool }
}

// Every quote reference in the data, with where it lives (for verification + reports).
export function* allQuotes({ medicines, groups, tool }) {
  for (const [k, r] of Object.entries(tool?.quotes ?? {})) yield { where: `tool ${k}`, ref: r }
  for (const m of medicines) {
    for (const f of m.formulations ?? []) for (const r of f.src ?? []) yield { where: `${m.id} formulation ${f.id}`, ref: r }
    for (const r of m.brandPrescribing?.src ?? []) yield { where: `${m.id} brandPrescribing`, ref: r }
    for (const k of SECTION_KEYS) for (const [i, it] of (m.sections?.[k]?.items ?? []).entries()) for (const r of it.src ?? []) yield { where: `${m.id} ${k}[${i}]`, ref: r }
    for (const rule of m.rules ?? []) for (const r of rule.src ?? []) yield { where: `${m.id} rule ${rule.id}`, ref: r }
  }
  for (const g of Object.values(groups)) for (const mem of g.members) for (const r of mem.src ?? []) yield { where: `group ${g.id} member ${mem.med}`, ref: r }
}

export function validate(data) {
  const { vocab, medicines, sources, groups, conditions } = data
  const errs = [...data.problems], warns = []
  const medIds = new Set(medicines.map((m) => m.id))
  const masterIds = new Set(vocab.medicines.map((m) => m.id))
  for (const id of masterIds) if (!medIds.has(id)) warns.push(`master medicine ${id} has no file yet`)
  const refOk = (x) => (x.startsWith('group:') ? !!groups[x.slice(6)] : masterIds.has(x) || vocab.ingredients.includes(x))
  const ruleIds = new Set()
  for (const s of Object.values(sources)) if (!allowedUrl(s.url)) errs.push(`source ${s.id} url not on the UK allow-list: ${s.url}`)
  for (const m of medicines) {
    const at = (msg) => `${m.file}: ${msg}`
    if (!m.id || !m.name) errs.push(at('missing id/name'))
    if (!masterIds.has(m.id)) errs.push(at(`id ${m.id} not in vocab master list`))
    if (!Array.isArray(m.ingredients) || !m.ingredients.length) errs.push(at('ingredients missing'))
    for (const g of m.groups ?? []) if (!groups[g]) errs.push(at(`group ${g} not defined`))
    if (!m.formulations?.length) errs.push(at('no formulations'))
    const fIds = new Set((m.formulations ?? []).map((f) => f.id))
    for (const k of SECTION_KEYS) {
      const s = m.sections?.[k]
      if (!s) { errs.push(at(`section ${k} missing`)); continue }
      if (!s.items && s.status !== 'not-stated') errs.push(at(`section ${k} has neither items nor status not-stated`))
      for (const [i, it] of (s.items ?? []).entries()) {
        if (!it.t) errs.push(at(`${k}[${i}] empty t`))
        if (!it.src?.length) errs.push(at(`${k}[${i}] has no src`))
        for (const f of it.formulations ?? []) if (!fIds.has(f)) errs.push(at(`${k}[${i}] unknown formulation ${f}`))
      }
    }
    for (const r of m.rules ?? []) {
      const rt = (msg) => at(`rule ${r.id}: ${msg}`)
      if (!r.id) errs.push(at('rule without id'))
      if (ruleIds.has(r.id)) errs.push(rt('duplicate id')); ruleIds.add(r.id)
      if (!KINDS.includes(r.kind)) errs.push(rt(`bad kind ${r.kind}`))
      if (!LEVELS.includes(r.level)) errs.push(rt(`bad level ${r.level}`))
      if (!r.med || !refOk(r.med)) errs.push(rt(`bad med ${r.med}`))
      if (!r.src?.length) errs.push(rt('no src'))
      if (!r.concern || !r.action) errs.push(rt('concern/action missing'))
      for (const f of r.formulations ?? []) if (!fIds.has(f)) errs.push(rt(`unknown formulation ${f}`))
      if (r.kind === 'interaction' && (!r.other || !refOk(r.other))) errs.push(rt(`bad other ${r.other}`))
      if (r.kind === 'condition' && !conditions[r.condition]) errs.push(rt(`unknown condition ${r.condition}`))
      if (r.kind === 'allergy') {
        if (!r.allergen?.length || !r.allergen.every(refOk)) errs.push(rt(`bad allergen ${r.allergen}`))
        for (const x of r.reactions ?? []) if (!REACTIONS.includes(x)) errs.push(rt(`bad reaction ${x}`))
      }
      if (r.kind === 'pregnancy') for (const t of r.trimesters ?? []) if (![1, 2, 3].includes(t)) errs.push(rt(`bad trimester ${t}`))
      if (r.kind === 'renal') {
        const rn = r.renal
        if (!rn || !['CrCl', 'eGFR', 'GFR'].includes(rn.measure) || (rn.min == null && rn.max == null)) errs.push(rt('bad renal'))
      }
      if (r.kind === 'hepatic' && (!r.hepatic?.length || !r.hepatic.every((h) => HEPATIC.includes(h)))) errs.push(rt('bad hepatic'))
      if (r.kind === 'age' && (!r.age || (r.age.minYears == null && r.age.maxYears == null))) errs.push(rt('bad age'))
      if (r.effect && !vocab.effects.includes(r.effect)) errs.push(rt(`unknown effect ${r.effect}`))
    }
  }
  for (const g of Object.values(groups)) for (const mem of g.members) if (!masterIds.has(mem.med)) errs.push(`group ${g.id}: member ${mem.med} not in master list`)
  for (const { where, ref } of allQuotes(data)) {
    if (!sources[ref.s]) errs.push(`${where}: unknown source id ${ref.s}`)
    if (!ref.q || ref.q.length > 300) errs.push(`${where}: quote missing or longer than 300 chars`)
  }
  return { errs, warns }
}
