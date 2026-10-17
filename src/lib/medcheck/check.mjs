// Medication safety checking engine.
//
// Pure and deterministic: check(kb, input) depends only on its arguments. It
// has no clinical knowledge of its own. Every alert comes from a curated rule
// in the knowledge base (kb), or from the product catalog for duplicate
// ingredients. Missing data is never reported as "safe". It is reported as
// "unable to assess" or "insufficient information".

export const SEVERITY_ORDER = ['contraindicated', 'avoid', 'dose-adjust', 'monitor', 'caution', 'info'];
export const SEVERITY_LABEL = {
  contraindicated: 'Contraindicated',
  avoid: 'Avoid / not recommended',
  'dose-adjust': 'Dose adjustment',
  monitor: 'Monitor',
  caution: 'Use with caution',
  info: 'Information',
};
const LOCAL_ROUTES = new Set(['ophthalmic', 'otic', 'topical', 'vaginal', 'nasal', 'inhalation']);
// Used inside sentences: "No documented <phrase> concern found ...".
const FACTOR_PHRASE = {
  pregnancy: 'pregnancy',
  breastfeeding: 'breastfeeding',
  renal: 'kidney-impairment',
  hepatic: 'liver-impairment',
  g6pd: 'G6PD-deficiency',
  conditions: 'condition-related',
  age: 'age-related',
  allergy: 'allergy',
};

const sevRank = (s) => (SEVERITY_ORDER.includes(s) ? SEVERITY_ORDER.indexOf(s) : SEVERITY_ORDER.length);
const mostSevere = (list) => list.slice().sort((a, b) => sevRank(a) - sevRank(b))[0] ?? null;
const pairKey = (a, b) => [a, b].sort().join('|');
const subset = (small, big) => small.every((x) => big.includes(x));

// ---------- knowledge-base indexes ----------

function indexKb(kb) {
  const docs = kb.docs;
  const ingredientName = (id) => kb.ingredients[id]?.name ?? id;
  const className = (id) => kb.classes[id]?.name ?? id;
  const classMembers = (id) => kb.classes[id]?.members ?? {};
  const isMember = (ingredient, cls) => Boolean(classMembers(cls)[ingredient]);
  const docsCovering = (ingredient, itemIngredients) =>
    Object.values(docs).filter((d) => d.ingredients.includes(ingredient) && subset(d.ingredients, itemIngredients));
  return { docs, ingredientName, className, classMembers, isMember, docsCovering };
}

function sourceRef(kb, rule) {
  const d = kb.docs[rule.docId];
  return {
    ruleId: rule.id,
    docId: rule.docId,
    title: d.title,
    publisher: d.publisher,
    url: d.url,
    setId: d.setId ?? null,
    version: d.version ?? null,
    effectiveTime: d.effectiveTime ?? null,
    retrievedAt: d.retrievedAt,
    section: rule.section,
    quote: rule.quote,
    actionQuote: rule.actionQuote ?? null,
    severity: rule.severity,
    sourceSeverityText: rule.sourceSeverityText,
    evidence: rule.evidence ?? null,
    summary: rule.summary,
    reviewStatus: rule.status,
    sourceChangedSinceCuration: Boolean(d.stale),
  };
}

// Several rules can support one alert. Severity is the most severe one, and
// "conflict" is true when different documents grade it differently. Both stay
// visible; the engine never silently picks one.
function buildAlert(kb, base, rules) {
  const sources = rules.map((r) => sourceRef(kb, r));
  const severity = mostSevere(rules.map((r) => r.severity));
  const byDoc = new Map();
  for (const r of rules) {
    const s = byDoc.get(r.docId) ?? new Set();
    s.add(r.severity);
    byDoc.set(r.docId, s);
  }
  const docTopSeverities = new Set([...byDoc.values()].map((set) => mostSevere([...set])));
  const evidence = rules.map((r) => r.evidence).filter(Boolean);
  return {
    ...base,
    severity,
    severityLabel: SEVERITY_LABEL[severity] ?? 'Not graded by source',
    evidence: evidence.length ? evidence : null,
    conflict: docTopSeverities.size > 1,
    reviewStatus: rules.every((r) => r.status === 'approved') ? 'approved' : 'pending-review',
    sources,
  };
}

// ---------- item resolution ----------

function resolveItems(kb, items, unable) {
  const products = new Map(kb.products.map((p) => [p.id, p]));
  const resolved = [];
  for (const item of items) {
    const product = item.productId ? products.get(item.productId) : null;
    const label = product ? product.name : (item.text || '').trim() || 'Unnamed entry';
    if (!product) {
      unable.push({ id: `unrecognised:${item.key}`, reason: 'unrecognised', items: [item.key], message: `"${label}" is not recognised in the catalog, so it has not been checked against anything.` });
      continue;
    }
    if (product.verification.status === 'unverified' || !product.ingredients.length) {
      unable.push({ id: `unverified:${item.key}`, reason: 'ingredients-unverified', items: [item.key], message: `The active ingredients of "${label}" have not been verified for this product (${product.verification.method}). It has not been checked.` });
      continue;
    }
    const routes = product.routes ?? [];
    if (routes.length && routes.every((r) => LOCAL_ROUTES.has(r))) {
      unable.push({ id: `route:${item.key}`, reason: 'route-not-covered', items: [item.key], message: `"${label}" is a ${routes.join('/')} product. The checked sources describe systemic use, so it has not been checked.` });
      continue;
    }
    resolved.push({ key: item.key, label, product, ingredients: product.ingredients });
  }
  return resolved;
}

// ---------- checks ----------

function checkDuplicates(kb, ix, items, alerts) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      for (const ing of a.ingredients.filter((x) => b.ingredients.includes(x))) {
        alerts.push({
          id: `duplicate:${pairKey(a.key, b.key)}:${ing}`,
          category: 'duplicate',
          items: [a.key, b.key],
          ingredients: [ing],
          title: `${a.label} + ${b.label}`,
          explanation: `Both contain the same active ingredient: ${ix.ingredientName(ing)}.`,
          severity: null,
          severityLabel: 'Not graded (catalog match)',
          evidence: null,
          conflict: false,
          reviewStatus: 'catalog',
          sources: [{ title: 'Product catalog ingredient mapping', detail: [a, b].map((x) => `${x.label}: ${x.product.verification.method}`).join(' · ') }],
          note: 'Check whether both products are intended, and the combined total amount of this ingredient.',
        });
      }
    }
  }
}

function interactionRulesBetween(kb, ix, x, y) {
  // Rules whose subject is in item x and whose object matches item y.
  return kb.rules.filter((r) => {
    if (r.type !== 'interaction' || !subset(r.subject.ingredients, x.ingredients)) return false;
    if (r.object.ingredient) return y.ingredients.includes(r.object.ingredient) && !x.ingredients.includes(r.object.ingredient);
    if (r.object.class) return y.ingredients.some((ing) => ix.isMember(ing, r.object.class));
    return false;
  });
}

function checkInteractions(kb, ix, items, alerts, clear, unable) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const rules = [...interactionRulesBetween(kb, ix, a, b), ...interactionRulesBetween(kb, ix, b, a)];
      const key = pairKey(a.key, b.key);
      if (rules.length) {
        alerts.push(buildAlert(kb, {
          id: `interaction:${key}`,
          category: 'interaction',
          items: [a.key, b.key],
          title: `${a.label} + ${b.label}`,
          explanation: [...new Set(rules.map((r) => r.summary))].join(' '),
        }, rules));
        continue;
      }
      // No rule. Say "no documented interaction" only if both sides' sources were checked for each other.
      const gaps = [];
      const checked = new Set();
      const caveats = [];
      for (const ia of a.ingredients) {
        for (const ib of b.ingredients) {
          // Same ingredient on both sides is a duplicate. If either product already contains both
          // ingredients (a combination), that pairing is part of the product itself, not this pair.
          if (ia === ib || a.ingredients.includes(ib) || b.ingredients.includes(ia)) continue;
          for (const [x, ing, other, otherItem] of [[a, ia, ib, b], [b, ib, ia, a]]) {
            const docs = ix.docsCovering(ing, x.ingredients).filter((d) => d.curation.interactionsScannedAgainst.includes(other));
            if (!docs.length) gaps.push(`${ix.ingredientName(ing)} (${x.label}) has no curated source checked against ${ix.ingredientName(other)} (${otherItem.label})`);
            for (const d of docs) {
              checked.add(d.title);
              for (const m of d.curation.unresolvedMentions ?? []) caveats.push({ doc: d.title, text: m.text });
            }
          }
        }
      }
      if (gaps.length) {
        unable.push({ id: `interaction-gap:${key}`, reason: 'insufficient-information', items: [a.key, b.key], message: `Insufficient information for ${a.label} + ${b.label}: ${gaps.join('; ')}.` });
      } else if (checked.size) {
        clear.push({
          id: `interaction-clear:${key}`,
          category: 'interaction',
          items: [a.key, b.key],
          message: `No documented interaction found in the checked sources for ${a.label} + ${b.label}.`,
          checkedSources: [...checked],
          caveats: dedupeCaveats(caveats),
        });
      }
    }
  }
}

function dedupeCaveats(list) {
  const seen = new Set();
  return list.filter((c) => {
    const k = `${c.doc}|${c.text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Which selected patient factors exist, as [group, matcher, label] triples.
function selectedFactors(kb, patient = {}) {
  const out = [];
  if (patient.pregnancy?.pregnant) {
    const t = patient.pregnancy.trimester ?? null;
    out.push({
      group: 'pregnancy', id: 'pregnancy',
      label: t ? `Pregnancy (trimester ${t})` : 'Pregnancy (trimester not specified)',
      match: (o) => {
        if (o.factor !== 'pregnancy') return false;
        if (!o.trimesters || !t) return true;
        return o.trimesters.includes(t);
      },
      note: (o) => (o.trimesters && !t ? `Source statement applies to trimester ${o.trimesters.join(', ')}; trimester was not entered.` : null),
    });
  }
  if (patient.breastfeeding) out.push({ group: 'breastfeeding', id: 'breastfeeding', label: 'Breastfeeding', match: (o) => o.factor === 'breastfeeding' });
  if (patient.renal?.level || Number.isFinite(patient.renal?.egfr)) {
    const egfr = Number.isFinite(patient.renal.egfr) ? patient.renal.egfr : null;
    const level = patient.renal.level || levelForEgfr(kb, egfr);
    const range = egfr != null ? [egfr, egfr] : rangeForLevel(kb, level);
    out.push({
      group: 'renal', id: 'renal',
      label: `Kidney impairment: ${egfr != null ? `eGFR ${egfr}` : kb.factors.renal.levels.find((l) => l.id === level)?.name ?? level}`,
      match: (o) => {
        if (o.factor !== 'renal') return false;
        if (o.egfrMin != null || o.egfrMax != null) {
          const lo = o.egfrMin ?? -Infinity, hi = o.egfrMax ?? Infinity;
          return range[1] >= lo && range[0] <= hi;
        }
        return o.levels.includes(level);
      },
      note: (o) => {
        if (o.egfrMin == null && o.egfrMax == null) {
          return o.crclMin != null || o.crclMax != null ? 'The source states this threshold as creatinine clearance (CrCl), which was not entered; the category match is approximate.' : null;
        }
        if (egfr != null) return null;
        const lo = o.egfrMin ?? -Infinity, hi = o.egfrMax ?? Infinity;
        return range[0] >= lo && range[1] <= hi ? null : `The source threshold (eGFR ${o.egfrMin ?? ''}${o.egfrMin != null && o.egfrMax != null ? '–' : o.egfrMax != null ? '≤' : '+'}${o.egfrMax ?? ''}) covers only part of the selected category; enter the exact eGFR to confirm.`;
      },
    });
  }
  if (patient.hepatic?.level) {
    out.push({ group: 'hepatic', id: 'hepatic', label: `Liver impairment: ${kb.factors.hepatic.levels.find((l) => l.id === patient.hepatic.level)?.name ?? patient.hepatic.level}`, match: (o) => o.factor === 'hepatic' && o.levels.includes(patient.hepatic.level) });
  }
  if (patient.g6pdDeficient) out.push({ group: 'g6pd', id: 'g6pd', label: 'G6PD deficiency', match: (o) => o.factor === 'g6pd' });
  if (patient.ageBand) {
    out.push({ group: 'age', id: `age:${patient.ageBand}`, label: kb.factors.ageBands.find((b) => b.id === patient.ageBand)?.name ?? patient.ageBand, match: (o) => o.factor === 'age' && o.bands.includes(patient.ageBand), quietIfClear: patient.ageBand === 'adult' });
  }
  for (const c of patient.conditions ?? []) {
    out.push({ group: 'conditions', id: `condition:${c}`, label: kb.conditions[c]?.name ?? c, match: (o) => o.factor === 'condition' && o.condition === c });
  }
  return out;
}

function levelForEgfr(kb, egfr) {
  return kb.factors.renal.levels.find((l) => egfr >= l.egfrMin && egfr <= l.egfrMax)?.id ?? null;
}
function rangeForLevel(kb, level) {
  const l = kb.factors.renal.levels.find((x) => x.id === level);
  return l ? [l.egfrMin, l.egfrMax] : [-Infinity, Infinity];
}

function factorCurated(ix, group, ingredient, item) {
  return ix.docsCovering(ingredient, item.ingredients).filter((d) =>
    d.curation.factorsCurated.includes(group) && (d.curation.factorScope?.[group] ?? d.ingredients).includes(ingredient));
}

function guidelineDocsFor(kb, group, ingredient) {
  // Guidelines (e.g. CPIC) cover ingredients through factorScope rather than their own ingredient list.
  return Object.values(kb.docs).filter((d) => d.curation.factorsCurated.includes(group) && d.curation.factorScope?.[group]?.includes(ingredient));
}

function checkPatientFactors(kb, ix, items, patient, alerts, clear, unable) {
  for (const f of selectedFactors(kb, patient)) {
    for (const item of items) {
      const rules = kb.rules.filter((r) => r.type === 'patient-factor' && subset(r.subject.ingredients, item.ingredients) && f.match(r.object));
      if (rules.length) {
        const severity = mostSevere(rules.map((r) => r.severity));
        const notes = [...new Set(rules.map((r) => f.note?.(r.object)).filter(Boolean))];
        alerts.push(buildAlert(kb, {
          id: `factor:${f.id}:${item.key}`,
          category: severity === 'contraindicated' ? 'contraindication' : 'precaution',
          items: [item.key],
          factor: { group: f.group, id: f.id, label: f.label },
          title: `${item.label} + ${f.label}`,
          explanation: [...new Set(rules.map((r) => r.summary))].join(' '),
          note: notes.join(' ') || null,
        }, rules));
        continue;
      }
      const missing = [];
      const checked = new Set();
      for (const ing of item.ingredients) {
        const docs = [...factorCurated(ix, f.group, ing, item), ...guidelineDocsFor(kb, f.group, ing)];
        if (!docs.length) missing.push(ix.ingredientName(ing));
        docs.forEach((d) => checked.add(d.title));
      }
      if (missing.length) {
        unable.push({ id: `factor-gap:${f.id}:${item.key}`, reason: 'insufficient-information', items: [item.key], factor: { group: f.group, id: f.id, label: f.label }, message: `Insufficient information: ${f.label} has not been curated for ${missing.join(', ')} (${item.label}).` });
      } else if (!f.quietIfClear) {
        clear.push({ id: `factor-clear:${f.id}:${item.key}`, category: 'patient-factor', items: [item.key], factor: { group: f.group, id: f.id, label: f.label }, message: `No documented ${FACTOR_PHRASE[f.group]} concern found in the checked sources for ${item.label}${f.group === 'conditions' ? ` (${f.label})` : ''}.`, checkedSources: [...checked] });
      }
    }
  }
}

function checkAllergies(kb, ix, items, patient, alerts, clear, unable) {
  const reactions = Object.fromEntries((kb.factors.allergyReactions ?? []).map((r) => [r.id, r]));
  for (const allergy of patient.allergies ?? []) {
    const reaction = reactions[allergy.reaction] ?? reactions.unknown;
    const allergen = allergy.allergen;
    if (!allergen || (!allergen.ingredient && !allergen.class)) {
      unable.push({ id: `allergy-unrecognised:${allergy.key}`, reason: 'unrecognised', allergy: allergy.key, message: `Allergy "${allergy.text || 'unnamed'}" is not recognised, so no product has been checked against it.` });
      continue;
    }
    const allergenName = allergen.ingredient ? ix.ingredientName(allergen.ingredient) : ix.className(allergen.class);
    // The patient's allergen expands to the ingredients and classes it covers.
    const allergenIngredients = allergen.ingredient ? [allergen.ingredient] : Object.keys(ix.classMembers(allergen.class));
    for (const item of items) {
      const direct = item.ingredients.filter((ing) => allergenIngredients.includes(ing));
      const rules = kb.rules.filter((r) => {
        if (r.type !== 'allergy' || !subset(r.subject.ingredients, item.ingredients)) return false;
        if (r.object.allergen.ingredient) {
          if (!(allergen.ingredient === r.object.allergen.ingredient || allergenIngredients.includes(r.object.allergen.ingredient))) return false;
        } else if (r.object.allergen.class) {
          const cls = r.object.allergen.class;
          if (!(allergen.class === cls || (allergen.ingredient && ix.isMember(allergen.ingredient, cls)))) return false;
        }
        return !r.object.reactions || allergy.reaction === 'unknown' || r.object.reactions.includes(allergy.reaction);
      });
      const base = {
        id: `allergy:${allergy.key}:${item.key}`,
        category: 'allergy',
        items: [item.key],
        factor: { group: 'allergy', id: `allergy:${allergy.key}`, label: `Allergy: ${allergenName} (${reaction.name})` },
        title: `${item.label} + recorded allergy to ${allergenName}`,
        reaction: reaction.id,
        note: reaction.group === 'intolerance' ? 'This entry was recorded as a side effect or intolerance, not an allergic reaction.' : null,
      };
      if (direct.length) {
        const membership = allergen.class ? direct.map((ing) => ix.classMembers(allergen.class)[ing]).flat() : [];
        const explanation = allergen.ingredient
          ? `${item.label} contains ${allergenName}, which is recorded as an allergy.`
          : `${item.label} contains ${direct.map(ix.ingredientName).join(', ')}, which the source below places in the class ${allergenName}.`;
        if (rules.length) {
          alerts.push(buildAlert(kb, { ...base, explanation: `${explanation} ${[...new Set(rules.map((r) => r.summary))].join(' ')}`, membership }, rules));
        } else {
          alerts.push({ ...base, explanation, membership, severity: null, severityLabel: 'Not graded by source', evidence: null, conflict: false, reviewStatus: 'catalog', sources: membership.length ? membership.map((m) => ({ title: m.title, url: m.url, section: m.section, quote: m.quote })) : [{ title: 'Product catalog ingredient mapping', detail: item.product.verification.method }] });
        }
        continue;
      }
      if (rules.length) {
        alerts.push(buildAlert(kb, { ...base, explanation: [...new Set(rules.map((r) => r.summary))].join(' ') }, rules));
        continue;
      }
      const missing = item.ingredients.filter((ing) => !factorCurated(ix, 'allergy', ing, item).length);
      if (missing.length) {
        unable.push({ id: `allergy-gap:${allergy.key}:${item.key}`, reason: 'insufficient-information', items: [item.key], allergy: allergy.key, message: `Insufficient information: allergy and cross-sensitivity statements have not been curated for ${missing.map(ix.ingredientName).join(', ')} (${item.label}).` });
      } else {
        clear.push({ id: `allergy-clear:${allergy.key}:${item.key}`, category: 'allergy', items: [item.key], allergy: allergy.key, message: `No documented allergy or cross-sensitivity concern found in the checked sources between ${allergenName} and ${item.label}.`, checkedSources: [...new Set(item.ingredients.flatMap((ing) => factorCurated(ix, 'allergy', ing, item).map((d) => d.title)))] });
      }
    }
  }
}

// ---------- medicine profile (nothing about the patient has to be entered) ----------
// For every entered medicine, lists what its sources say about each patient
// factor. Rules are grouped by what they apply to (trimester, kidney level,
// condition, ...), so the reader sees which situations are affected.

const PROFILE_SECTIONS = [
  { group: 'g6pd', factor: 'g6pd', title: 'G6PD deficiency' },
  { group: 'pregnancy', factor: 'pregnancy', title: 'Pregnancy' },
  { group: 'conditions', factor: 'condition', title: 'Chronic conditions' },
  { group: 'renal', factor: 'renal', title: 'Kidney impairment' },
  { group: 'hepatic', factor: 'hepatic', title: 'Liver impairment' },
  { group: 'breastfeeding', factor: 'breastfeeding', title: 'Breastfeeding' },
  { group: 'age', factor: 'age', title: 'Age' },
  { group: 'allergy', factor: 'allergy', title: 'Allergies & cross-sensitivity' },
];
const TRIMESTERS = [{ id: 1, name: 'First trimester' }, { id: 2, name: 'Second trimester' }, { id: 3, name: 'Third trimester' }];

// Grid columns for factors that come in levels. covers(o, col): does the rule object apply to that column?
function profileColumns(kb, group) {
  if (group === 'pregnancy') return { columns: TRIMESTERS, covers: (o, c) => !o.trimesters || o.trimesters.includes(c.id) };
  if (group === 'renal') return { columns: kb.factors.renal.levels, covers: (o, c) => o.levels.includes(c.id) };
  if (group === 'hepatic') return { columns: kb.factors.hepatic.levels, covers: (o, c) => o.levels.includes(c.id) };
  if (group === 'age') return { columns: kb.factors.ageBands.filter((b) => b.id !== 'adult'), covers: (o, c) => o.bands.includes(c.id) };
  return null;
}

const range = (name, min, max, unit = '') => (min != null && max != null ? `${name} ${min}–${max}${unit}` : max != null ? `${name} ≤${max}${unit}` : `${name} ≥${min}${unit}`);
const listNames = (ids, all) => ids.map((id) => all.find((x) => x.id === id)?.name ?? id).join(', ');

function appliesTo(kb, ix, o) {
  switch (o.factor) {
    case 'pregnancy':
      return o.trimesters ? listNames(o.trimesters, TRIMESTERS) : 'Pregnancy (the source names no specific trimester)';
    case 'renal': {
      if (o.egfrMin != null || o.egfrMax != null) return range('eGFR', o.egfrMin, o.egfrMax);
      if (o.crclMin != null || o.crclMax != null) return range('Creatinine clearance', o.crclMin, o.crclMax, ' mL/min');
      return o.levels.length === kb.factors.renal.levels.length ? 'Any degree of kidney impairment' : listNames(o.levels, kb.factors.renal.levels);
    }
    case 'hepatic':
      return o.levels.length === kb.factors.hepatic.levels.length ? 'Any degree of liver impairment' : listNames(o.levels, kb.factors.hepatic.levels);
    case 'age': return listNames(o.bands, kb.factors.ageBands);
    case 'condition': return kb.conditions[o.condition]?.name ?? o.condition;
    case 'allergy': {
      const name = o.allergen.ingredient ? ix.ingredientName(o.allergen.ingredient) : ix.className(o.allergen.class);
      const reactions = o.reactions ? ` (${listNames(o.reactions, kb.factors.allergyReactions)})` : '';
      return `Allergy to ${name}${reactions}`;
    }
    case 'g6pd': return 'G6PD deficiency';
    case 'breastfeeding': return 'Breastfeeding';
    default: return o.factor;
  }
}

// Rules that apply to the same situation for the same medicine become one card.
// Allergy statements are merged into one card per medicine.
const cardKey = (o) => (o.factor === 'allergy' ? 'allergy' : o.factor === 'pregnancy' ? `t:${(o.trimesters ?? []).join(',')}` : JSON.stringify(o));

export function profile(kb, input) {
  const ix = indexKb(kb);
  const items = resolveItems(kb, input.items ?? [], []);
  const sections = [];
  for (const sec of PROFILE_SECTIONS) {
    const grid = profileColumns(kb, sec.group);
    const alerts = [], clear = [], unable = [], rows = [];
    for (const item of items) {
      const rules = kb.rules.filter((r) => r.type !== 'interaction' && r.object.factor === sec.factor && subset(r.subject.ingredients, item.ingredients));
      const missing = [];
      const checked = new Set();
      for (const ing of item.ingredients) {
        const docs = [...factorCurated(ix, sec.group, ing, item), ...guidelineDocsFor(kb, sec.group, ing)];
        if (!docs.length) missing.push(ix.ingredientName(ing));
        docs.forEach((d) => checked.add(d.title));
      }
      const groups = new Map();
      for (const r of rules) groups.set(cardKey(r.object), [...(groups.get(cardKey(r.object)) ?? []), r]);
      for (const [key, rs] of groups) {
        const label = [...new Set(rs.map((r) => appliesTo(kb, ix, r.object)))].join('; ');
        const severity = mostSevere(rs.map((r) => r.severity));
        alerts.push(buildAlert(kb, {
          id: `profile:${sec.group}:${key}:${item.key}`,
          category: sec.group === 'allergy' ? 'allergy' : severity === 'contraindicated' ? 'contraindication' : 'precaution',
          items: [item.key],
          factor: { group: sec.group, id: `${sec.group}:${key}`, label },
          title: `${item.label} + ${label}`,
          explanation: [...new Set(rs.map((r) => r.summary))].join(' '),
          appliesTo: label,
        }, rs));
      }
      if (missing.length) {
        unable.push({ id: `profile-gap:${sec.group}:${item.key}`, reason: 'insufficient-information', items: [item.key], message: `Insufficient information: ${sec.title.toLowerCase()} has not been curated for ${missing.join(', ')} (${item.label}).` });
      } else if (!rules.length) {
        clear.push({ id: `profile-clear:${sec.group}:${item.key}`, category: 'patient-factor', items: [item.key], message: `No documented ${FACTOR_PHRASE[sec.group]} concern found in the checked sources for ${item.label}.`, checkedSources: [...checked] });
      }
      if (grid) {
        rows.push({
          item: item.key,
          label: item.label,
          cells: grid.columns.map((c) => {
            const hit = rules.filter((r) => grid.covers(r.object, c));
            if (hit.length) {
              const severity = mostSevere(hit.map((r) => r.severity));
              // Kidney thresholds can cover only part of a level (eGFR 30–45 inside 30–59), or be stated as CrCl.
              const partial = sec.group === 'renal' && hit.filter((r) => r.severity === severity).every((r) => {
                const o = r.object;
                if (o.egfrMin == null && o.egfrMax == null) return o.crclMin != null || o.crclMax != null;
                return (o.egfrMin ?? -Infinity) > c.egfrMin || (o.egfrMax ?? Infinity) < c.egfrMax;
              });
              return { status: 'alert', severity, severityLabel: SEVERITY_LABEL[severity] ?? 'Not graded by source', partial };
            }
            return { status: missing.length ? 'insufficient' : 'none' };
          }),
        });
      }
    }
    alerts.sort((x, y) => sevRank(x.severity) - sevRank(y.severity) || x.title.localeCompare(y.title));
    sections.push({
      group: sec.group,
      title: sec.title,
      grid: grid ? { columns: grid.columns.map((c) => ({ id: c.id, name: c.name })), rows } : null,
      alerts,
      clear,
      unable,
      severity: mostSevere(alerts.map((a) => a.severity).filter(Boolean)),
    });
  }
  return { kbVersion: kb.version, sections };
}

// ---------- entry point ----------

export function check(kb, input) {
  const ix = indexKb(kb);
  const alerts = [], clear = [], unable = [];
  const items = resolveItems(kb, input.items ?? [], unable);
  checkDuplicates(kb, ix, items, alerts);
  checkInteractions(kb, ix, items, alerts, clear, unable);
  checkPatientFactors(kb, ix, items, input.patient, alerts, clear, unable);
  checkAllergies(kb, ix, items, input.patient ?? {}, alerts, clear, unable);

  // Pairs with an unchecked item (unrecognised, unverified, route) are explicitly unassessed too.
  const skipped = (input.items ?? []).filter((it) => !items.some((r) => r.key === it.key));
  const products = new Map(kb.products.map((p) => [p.id, p]));
  const labelOf = (it) => products.get(it.productId)?.name ?? ((it.text || '').trim() || 'Unnamed entry');
  for (const s of skipped) {
    for (const other of input.items) {
      if (other.key === s.key) continue;
      if (skipped.some((x) => x.key === other.key) && other.key < s.key) continue;
      unable.push({ id: `pair-unassessed:${pairKey(s.key, other.key)}`, reason: 'item-not-checked', items: [s.key, other.key], message: `${labelOf(s)} + ${labelOf(other)}: not assessed, because ${labelOf(s)} could not be checked.` });
    }
  }

  alerts.sort((x, y) => sevRank(x.severity) - sevRank(y.severity) || x.id.localeCompare(y.id));
  return {
    kbVersion: kb.version,
    kbMode: kb.mode,
    alerts,
    clear,
    unable,
    counts: { alerts: alerts.length, clear: clear.length, unable: unable.length, itemsChecked: items.length, itemsEntered: (input.items ?? []).length },
  };
}
