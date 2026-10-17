// Medication safety checker page logic, from laborya mid web/app.js (presentation only; clinical logic in check.mjs).
// Changed only to run inside the PCIS tool page: scoped to one root element, ids prefixed mc-,
// and every listener removed on unmount.
import { check, profile } from './check.mjs';

export function mountMedCheck(root, kb) {
  const ac = new AbortController();
  const on = (el, ev, fn, opt) => el.addEventListener(ev, fn, { ...(typeof opt === 'boolean' ? { capture: opt } : opt), signal: ac.signal });
  const $ = (id) => root.querySelector(`#mc-${id}`);

  // Tools page: presentation only. All clinical logic lives in engine/check.mjs
  // and in the curated knowledge base (kb.json). Nothing entered here is stored or sent.

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const state = { items: [], next: 1 };
  const CATEGORY = { interaction: 'Interaction', contraindication: 'Contraindication', precaution: 'Precaution', allergy: 'Allergy concern', duplicate: 'Duplicate ingredient' };
  const VERIFY_TAG = { verified: '', 'name-stated': 'name-stated', unverified: 'ingredients unverified' };

  // ---------- setup ----------
  // Demo-build banner removed (owner request)
  // Footer (disclaimer + knowledge-base line) removed (owner request)
  // Brands are also found by their verified ingredient names (searching "simvastatin" lists Zocor).
  const products = kb.products.map((p) => ({
    ...p,
    ingredientHay: p.ingredients.flatMap((i) => [kb.ingredients[i]?.name, ...(kb.ingredients[i]?.synonyms ?? [])]).filter(Boolean).join(' | ').toLowerCase(),
  }));
  const ingName = (id) => kb.ingredients[id]?.name ?? id;

  // Escapes a label and bolds the typed letters where they start a word ("an" -> <mark>An</mark>aprox).
  function highlight(label, q) {
    if (!q) return esc(label);
    const m = new RegExp(`(^|[^a-z0-9])(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i').exec(label);
    if (!m) return esc(label);
    const start = m.index + m[1].length;
    return esc(label.slice(0, start)) + `<mark>${esc(label.slice(start, start + q.length))}</mark>` + esc(label.slice(start + q.length));
  }
  const wordStart = (text, q) => new RegExp(`(^|[^a-z0-9])${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text);

  // ---------- generic autocomplete ----------
  // search(q) returns { options, total }. The list opens from the first letter (or on focus when showOnFocus).
  function autocomplete(input, list, search, onPick, { allowFreeText = false, showOnFocus = false } = {}) {
    let options = [];
    let active = -1;
    const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const res = !q && !showOnFocus ? { options: [], total: 0 } : search(q);
      options = res.options;
      list.innerHTML = options.map((o, i) => `<li role="option" data-i="${i}" aria-selected="${i === active}"><span class="nm">${highlight(o.label, q)}</span><span class="tags">${o.tags ?? ''}</span></li>`).join('')
        + (res.total > options.length ? `<li class="more" aria-disabled="true">Showing ${options.length} of ${res.total}. Keep typing to narrow the list.</li>` : '')
        + (q && !options.length && allowFreeText ? '<li class="more" aria-disabled="true">No match. Press Enter to add it as "not recognised".</li>' : '');
      list.hidden = !list.innerHTML;
      input.setAttribute('aria-expanded', String(!list.hidden));
      list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    };
    on(input, 'input', () => { active = -1; render(); });
    on(input, 'focus', () => { if (showOnFocus || input.value.trim()) render(); });
    input.refreshList = () => { if (!list.hidden) render(); };
    on(input, 'keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!options.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        render();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0) onPick(options[active].value);
        else if (options.length === 1) onPick(options[0].value);
        else if (allowFreeText && input.value.trim()) onPick({ freeText: input.value.trim() });
        else return;
        input.value = '';
        close();
      } else if (e.key === 'Escape') close();
    });
    on(list, 'mousedown', (e) => {
      const li = e.target.closest('li[data-i]');
      if (!li) return;
      e.preventDefault();
      onPick(options[Number(li.dataset.i)].value);
      input.value = '';
      close();
    });
    on(input, 'blur', () => setTimeout(close, 120));
  }

  const kindRank = { generic: 0, supplement: 0, 'generic-combination': 1, brand: 2, 'kuwait-listing': 3 };
  const MAX_SHOWN = 300;
  // Order: names that start with the typed letters (A-Z), then names with a later word starting with them,
  // then brands found through their ingredient name (e.g. "simva" also lists Zocor).
  // With nothing typed, the list shows every generic medicine and supplement A-Z.
  autocomplete($('med-search'), $('med-results'), (q) => {
    const market = $('country').value;
    const ranked = [];
    for (const p of products) {
      if (market !== 'all' && p.country !== market) continue;
      const name = p.name.toLowerCase();
      let tier;
      if (!q) tier = p.country === 'any' ? 0 : null;
      else if (name.startsWith(q) || (p.country !== 'KW' && p.searchTerms.some((t) => t.toLowerCase().startsWith(q)))) tier = 0;
      // Kuwait listing text includes the manufacturer ("... and Medical Appliances"), so a later-word
      // match there only counts once 4+ letters are typed.
      else if ((p.country !== 'KW' || q.length >= 4) && wordStart(name, q)) tier = 1;
      else if (wordStart(p.ingredientHay, q)) tier = 2;
      else tier = null;
      if (tier !== null) ranked.push({ p, tier });
    }
    ranked.sort((a, b) => a.tier - b.tier || kindRank[a.p.kind] - kindRank[b.p.kind] || a.p.name.localeCompare(b.p.name));
    return { total: ranked.length, options: ranked.slice(0, MAX_SHOWN).map(({ p }) => ({
        value: p,
        label: p.name,
        tags: [
          p.country === 'KW' ? '<span class="tag kw">Kuwait</span>' : p.country === 'US' ? '<span class="tag">US brand</span>' : `<span class="tag">${p.kind === 'supplement' ? 'supplement' : 'generic'}</span>`,
          VERIFY_TAG[p.verification.status] ? `<span class="tag warn">${VERIFY_TAG[p.verification.status]}</span>` : '',
        ].join(''),
      })) };
  }, (v) => {
    if (v.freeText) state.items.push({ key: `m${state.next++}`, text: v.freeText });
    else state.items.push({ key: `m${state.next++}`, productId: v.id });
    update();
  }, { allowFreeText: true, showOnFocus: true });
  on($('country'), 'change', () => { $('med-search').focus(); $('med-search').refreshList(); });

  const itemLabel = (key) => {
    const it = state.items.find((i) => i.key === key);
    if (!it) return key;
    return it.productId ? kb.products.find((p) => p.id === it.productId)?.name ?? it.productId : it.text;
  };

  // ---------- render ----------
  function renderEntries() {
    $('med-empty').hidden = state.items.length > 0;
    $('med-list').innerHTML = state.items.map((it) => {
      const p = it.productId ? kb.products.find((x) => x.id === it.productId) : null;
      const sub = p
        ? `${p.ingredients.length ? p.ingredients.map(ingName).join(' + ') : 'ingredients not verified'}${p.country === 'KW' ? ' · Kuwait listing' : p.country === 'US' ? ' · US brand' : ''}${p.verification.status === 'name-stated' ? ' · ingredient taken from product name' : ''}`
        : 'not recognised: will not be checked';
      return `<li data-key="${it.key}"><span class="nm">${esc(p ? p.name : it.text)}<span class="sub">${esc(sub)}</span></span><button class="x" data-remove="${it.key}" aria-label="Remove ${esc(p ? p.name : it.text)}">×</button></li>`;
    }).join('');
  }

  on(root, 'click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (!t.dataset.remove) return;
    state.items = state.items.filter((i) => i.key !== t.dataset.remove);
    update();
  });

  function involves(a) {
    const parts = (a.items ?? []).map((k) => `<span class="inv">${esc(itemLabel(k))}</span>`);
    if (a.factor) parts.push(`<span class="inv factor">${esc(a.factor.label)}</span>`);
    return parts.join('<span class="plus">+</span>');
  }

  function refHtml(s) {
    if (!s.quote && s.detail) return `<div class="ref"><b>${esc(s.title)}</b><div class="meta">${esc(s.detail)}</div></div>`;
    const meta = [
      s.publisher, s.section && `Section: ${s.section}`,
      s.setId && `Set ID ${s.setId}${s.version ? ` v${s.version}` : ''}`,
      s.effectiveTime && `Revision ${fmtDate(s.effectiveTime)}`,
      s.retrievedAt && `Retrieved ${s.retrievedAt}`,
      s.sourceSeverityText && `Source wording: "${s.sourceSeverityText}"`,
    ].filter(Boolean).join(' · ');
    return `<div class="ref"><b>${esc(s.title)}</b>${s.reviewStatus && s.reviewStatus !== 'approved' ? ' <span class="tag draft">not yet clinically reviewed</span>' : ''}${s.sourceChangedSinceCuration ? ' <span class="tag warn">source updated since curation</span>' : ''}
      <blockquote>${esc(s.quote)}</blockquote><div class="meta">${esc(meta)}</div>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : ''}</div>`;
  }

  const fmtDate = (t) => (/^\d{8}$/.test(String(t)) ? `${String(t).slice(0, 4)}-${String(t).slice(4, 6)}-${String(t).slice(6)}` : t);

  function alertHtml(a) {
    const actions = [...new Set((a.sources ?? []).map((s) => s.actionQuote).filter(Boolean))];
    const evidence = (a.evidence ?? []).map((e) => `${e.scheme}: ${e.text}`).join('; ');
    const sevs = [...new Set((a.sources ?? []).filter((s) => s.severity).map((s) => `${s.title}: ${s.severity}`))];
    const keys = [...(a.items ?? []), a.factor?.id].filter(Boolean).join(' ');
    // Show only the first sentence; the full text is under "Details"
    const text = String(a.explanation ?? '');
    const cut = text.search(/\.\s+(?=[A-Z])/);
    const first = cut > 0 ? text.slice(0, cut + 1) : text;
    const rest = cut > 0 ? text.slice(cut + 1).trim() : '';
    return `<article class="alert sev-${a.severity ?? 'none'}" data-keys="${esc(keys)}">
      <div class="alert-head"><span class="cat">${CATEGORY[a.category]}</span><span class="sev">${esc(a.severityLabel)}</span>${a.reviewStatus === 'pending-review' ? '<span class="tag draft">draft rule</span>' : ''}</div>
      <div class="involves">${involves(a)}</div>
      <p>${esc(first)}</p>
      ${actions.slice(0, 1).map((q) => `<div class="action"><span class="lbl">Action</span>${esc(q)}</div>`).join('')}
      <details class="refs"><summary>Details</summary>
        ${rest ? `<p>${esc(rest)}</p>` : ''}
        ${a.note ? `<p class="note">${esc(a.note)}</p>` : ''}
        ${a.conflict ? `<div class="conflict">Sources grade this differently: ${esc(sevs.join(' · '))}</div>` : ''}
        ${actions.slice(1).map((q) => `<div class="action"><span class="lbl">Action</span>${esc(q)}</div>`).join('')}
        <p class="meta">Evidence: ${esc(evidence || 'not graded')}</p>
        ${(a.sources ?? []).map(refHtml).join('')}
      </details>
    </article>`;
  }

  const SHORT = { contraindicated: 'Contraindicated', avoid: 'Avoid', 'dose-adjust': 'Dose adjust', monitor: 'Monitor', caution: 'Caution', info: 'Info' };
  // Sections the reader opened or closed keep that state while the list changes.
  const openState = {};

  function unableHtml(list, title) {
    return list.length ? `<div class="unable-box"><h3>${title}</h3><ul>${list.map((u) => `<li data-keys="${esc((u.items ?? []).join(' '))}">${esc(u.message)}</li>`).join('')}</ul></div>` : '';
  }

  function clearHtml(list, summary) {
    if (!list.length) return '';
    const li = (c) => `<li>${esc(c.message)}<span class="meta">Checked: ${esc(c.checkedSources.join('; '))}</span>${c.caveats?.length ? `<span class="meta">Also mentions drug groups not mapped yet: ${esc([...new Set(c.caveats.map((x) => x.text))].join('; '))}</span>` : ''}</li>`;
    return `<details class="clear-wrap"><summary>${esc(summary)} (${list.length})</summary><ul class="clear-list">${list.map(li).join('')}</ul></details>`;
  }

  // Medicines down the side, levels (trimester, kidney stage ...) across the top.
  function gridHtml(grid) {
    if (!grid?.rows.length) return '';
    const cell = (c) => c.status === 'alert'
      ? `<td class="cell sev-${c.severity ?? 'none'}" title="${esc(c.severityLabel)}"><span class="sev">${esc(SHORT[c.severity] ?? 'Not graded')}${c.partial ? '*' : ''}</span></td>`
      : c.status === 'none' ? '<td class="cell none">None documented</td>' : '<td class="cell nodata">Insufficient information</td>';
    const partial = grid.rows.some((r) => r.cells.some((c) => c.partial));
    return `<div class="grid-wrap"><table class="fgrid"><thead><tr><th>Medicine</th>${grid.columns.map((c) => `<th>${esc(c.name)}</th>`).join('')}</tr></thead>
      <tbody>${grid.rows.map((r) => `<tr data-keys="${esc(r.item)}"><th>${esc(r.label)}</th>${r.cells.map(cell).join('')}</tr>`).join('')}</tbody></table></div>
      ${partial ? '<p class="meta">* The source threshold covers only part of this range, or is stated as creatinine clearance. The card below gives the exact value.</p>' : ''}`;
  }

  function sectionHtml(sec) {
    const badge = sec.alerts.length
      ? `<span class="sev">${esc(SHORT[sec.severity] ?? 'Not graded')}</span><span class="count">${sec.alerts.length} alert${sec.alerts.length === 1 ? '' : 's'}</span>`
      : sec.unable.length ? '<span class="tag warn">insufficient information</span>' : '<span class="tag ok">nothing documented</span>';
    const open = openState[sec.group] ?? Boolean(sec.alerts.length);
    return `<details class="fsec sev-${sec.alerts.length ? sec.severity ?? 'none' : 'quiet'}" data-group="${sec.group}"${open ? ' open' : ''}>
      <summary><span class="ftitle">${esc(sec.title)}</span>${badge}</summary>
      <div class="fbody">
        ${gridHtml(sec.grid)}
        ${sec.alerts.map(alertHtml).join('')}
        ${unableHtml(sec.unable, 'Insufficient information')}
        ${clearHtml(sec.clear, 'Nothing documented')}
      </div>
    </details>`;
  }

  function renderResults(res, prof) {
    const nEntered = state.items.length;
    const nAlerts = res.alerts.length + prof.sections.reduce((n, s) => n + s.alerts.length, 0);
    const nUnable = res.unable.length + prof.sections.reduce((n, s) => n + s.unable.length, 0);
    $('summary').innerHTML = nEntered
      ? `<div class="stat a"><b>${nAlerts}</b>alert${nAlerts === 1 ? '' : 's'}</div><div class="stat u"><b>${nUnable}</b>unable to assess</div><div class="stat"><b>${res.counts.itemsChecked}/${nEntered}</b>entries checked</div>`
      : '';
    if (!nEntered) {
      $('between').innerHTML = '<p class="placeholder">Add medicines to start.</p>';
      $('profile').innerHTML = '';
      return;
    }
    $('between').innerHTML = `<h3 class="block-h">Interactions</h3>
      ${state.items.length < 2 ? '<p class="placeholder small">Add another medicine to check interactions.</p>' : ''}
      ${res.alerts.map(alertHtml).join('')}
      ${unableHtml(res.unable, 'Unable to assess')}
      ${clearHtml(res.clear, 'No interaction found')}`;
    $('profile').innerHTML = res.counts.itemsChecked
      ? `<h3 class="block-h">Patient factors</h3>${prof.sections.map(sectionHtml).join('')}`
      : '';
  }

  on($('profile'), 'toggle', (e) => {
    if (e.target.matches?.('details.fsec')) openState[e.target.dataset.group] = e.target.open;
  }, true);

  // Highlight the exact entries an alert refers to.
  const resultsPanel = root.querySelector('.results');
  for (const ev of ['mouseover', 'focusin']) {
    on(resultsPanel, ev, (e) => {
      const card = e.target.closest('[data-keys]');
      root.querySelectorAll('.hl').forEach((x) => x.classList.remove('hl'));
      if (!card) return;
      for (const k of card.dataset.keys.split(' ')) root.querySelectorAll(`[data-key="${k}"]`).forEach((x) => x.classList.add('hl'));
    });
  }
  on(resultsPanel, 'mouseleave', () => root.querySelectorAll('.hl').forEach((x) => x.classList.remove('hl')));

  function update() {
    renderEntries();
    renderResults(check(kb, { items: state.items, patient: {} }), profile(kb, { items: state.items }));
  }
  update();
  return () => ac.abort();
}
