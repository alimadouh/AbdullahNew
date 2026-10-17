# Browser tests for the UK Medication Safety Checker (run against the Vite dev server).
import sys
sys.stdout.reconfigure(encoding="utf-8")
#   (start: npx vite --port 5181)  python -I scripts/medcheck-uk/test-ui.py http://localhost:5173 [shots_dir]
import sys, json, os
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.environ.get('TEMP', '/tmp'), 'medcheck_ui_shots')
os.makedirs(SHOTS, exist_ok=True)
fails, passes = [], 0

def check(name, cond, info=''):
    global passes
    if cond: passes += 1; print('ok  ', name)
    else: fails.append(name); print('FAIL', name, info)

def add_med(pg, q, pick_text=None):
    pg.fill('#mc-search', q)
    pg.wait_for_selector('#mc-search-results li[role=option]', timeout=5000)
    opts = pg.locator('#mc-search-results li[role=option]')
    if pick_text:
        opts.filter(has_text=pick_text).first.dispatch_event('mousedown')
    else:
        opts.first.dispatch_event('mousedown')
    pg.wait_for_timeout(150)

def findings(pg):
    # desktop table rows (visible at >= md)
    rows = pg.locator('#mc-safety table tbody tr')
    return [rows.nth(i).inner_text() for i in range(rows.count())]

def open_tool(pg):
    pg.goto(BASE + '/?section=tools&tool=medcheck', wait_until='networkidle')
    pg.wait_for_selector('#mc-search', timeout=20000)

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    for vw, tag in [((1440, 1000), 'desktop'), ((390, 844), 'mobile')]:
        ctx = b.new_context(viewport={'width': vw[0], 'height': vw[1]})
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        open_tool(pg)
        kb = pg.evaluate("fetch('/medcheck/kb.json').then(r=>r.json())")
        names = {m['id']: m['name'] for m in kb['medicines']}
        check(f'{tag}: kb loads with medicines', len(names) >= 30, len(names))
        check(f'{tag}: no country selector', pg.locator('#mc-country').count() == 0 and 'Kuwait' not in pg.inner_text('main') if pg.locator('main').count() else True)
        # empty state
        check(f'{tag}: empty state asks for medicines', 'Add medicines to see' in pg.content())
        # default view: medicines only, patient form folded away; interactions + when-not-to-give at the top
        check(f'{tag}: patient form hidden by default', pg.locator('#mc-age').count() == 0 and pg.locator('#mc-show-patient').count() == 1)
        add_med(pg, 'warfarin'); add_med(pg, 'ibuprofen')
        q = pg.inner_text('#mc-quick')
        check(f'{tag}: quick panel shows the interaction', 'Warfarin sodium + Ibuprofen' in q, q[:300])
        check(f'{tag}: quick panel lists when not to give', 'When not to give' in q and 'Haemorrhagic stroke' in q and 'Pregnancy' in q)
        y_quick = pg.locator('#mc-quick').bounding_box()['y']; y_card = pg.locator('article').first.bounding_box()['y']
        check(f'{tag}: quick panel above the medicine tables', y_quick < y_card)
        pg.click('text=Clear all'); pg.wait_for_timeout(100)
        pg.click('#mc-show-patient'); pg.wait_for_selector('#mc-age')

        if tag == 'desktop':
            # warfarin + ibuprofen -> interaction, both cards, panel above cards
            add_med(pg, 'warfarin'); add_med(pg, 'ibuprofen')
            t = pg.inner_text('#mc-safety')
            check('desktop: warfarin+ibuprofen interaction shown', 'Warfarin' in t and 'Ibuprofen' in t and len(findings(pg)) >= 1, t[:400])
            check('desktop: two medicine cards', pg.locator('article').count() == 2)
            y_panel = pg.locator('#mc-safety').bounding_box()['y']; y_card = pg.locator('article').first.bounding_box()['y']
            check('desktop: safety panel above cards', y_panel < y_card)
            boxes = [pg.locator('article').nth(i).bounding_box() for i in range(2)]
            check('desktop: cards side by side', abs(boxes[0]['y'] - boxes[1]['y']) < 5 and boxes[0]['x'] != boxes[1]['x'])
            check('desktop: never says "safe" as a verdict', 'is safe' not in t.lower() and 'safe to' not in t.lower())
            check('desktop: what could change section present', 'What could change this assessment?' in t)
            check('desktop: renal not assessed listed', 'Kidney function' in t)
            pg.screenshot(path=os.path.join(SHOTS, 'desktop_warf_ibu.png'), full_page=True)
            # remove ibuprofen -> interaction disappears
            pg.locator('button[aria-label="Remove Ibuprofen"]').first.click(); pg.wait_for_timeout(150)
            check('desktop: removing a medicine updates findings', not any('Ibuprofen' in r for r in findings(pg)))
            check('desktop: one card after removal', pg.locator('article').count() == 1)
            # duplicate ingredient: paracetamol + co-codamol
            pg.click('text=Clear all'); add_med(pg, 'paracetamol'); add_med(pg, 'co-codamol')
            check('desktop: duplicate paracetamol detected', any('Same active ingredient' in r or 'paracetamol' in r.lower() and 'same' in r.lower() for r in findings(pg)), findings(pg))
            # patient context: metformin + eGFR
            pg.click('text=Clear all'); add_med(pg, 'metformin')
            before = pg.inner_text('#mc-safety')
            pg.fill('#mc-egfr', '20'); pg.wait_for_timeout(150)
            after = pg.inner_text('#mc-safety')
            check('desktop: eGFR 20 creates a renal finding for metformin', len(findings(pg)) >= 1 and 'eGFR 20' in after, after[:500])
            pg.fill('#mc-egfr', ''); pg.wait_for_timeout(100)
            check('desktop: clearing eGFR returns to not assessed', 'Kidney function' in pg.inner_text('#mc-safety') and len(findings(pg)) == 0)
            # pregnancy: warfarin + pregnant
            pg.click('text=Clear all'); add_med(pg, 'warfarin')
            pg.locator('#mc-preg button', has_text='Yes').click(); pg.wait_for_timeout(150)
            check('desktop: warfarin in pregnancy flagged', any('preg' in r.lower() for r in findings(pg)), findings(pg))
            # male hides pregnancy
            pg.select_option('#mc-sex', 'male'); pg.wait_for_timeout(100)
            check('desktop: male hides pregnancy inputs', pg.locator('#mc-preg').count() == 0)
            # allergy: amoxicillin + penicillin allergy
            pg.click('text=Clear all'); add_med(pg, 'amoxicillin')
            pg.locator('#mc-allergy-status button', has_text='Has allergies').click()
            pg.fill('#mc-allergen', 'penicillin'); pg.wait_for_timeout(150)
            opt = pg.locator('ul[role=listbox] li', has_text='Penicillin').first
            if opt.count(): opt.dispatch_event('mousedown'); pg.wait_for_timeout(150)
            check('desktop: penicillin allergy flags amoxicillin', any('Amoxicillin' in r and ('allerg' in r.lower() or 'hypersens' in r.lower()) for r in findings(pg)), findings(pg))
            # NKDA vs not recorded
            pg.locator('#mc-allergy-status button', has_text='None known').click(); pg.wait_for_timeout(100)
            t = pg.inner_text('#mc-safety')
            check('desktop: NKDA shows allergies checked', 'No known drug allergies' in t)
            # invalid numbers are rejected and treated as not recorded
            pg.click('text=Clear all'); add_med(pg, 'metformin')
            pg.fill('#mc-egfr', '-5'); pg.wait_for_timeout(150)
            t = pg.inner_text('#mc-safety')
            check('desktop: negative eGFR shows an error and is not used', pg.locator('#mc-egfr[aria-invalid=true]').count() == 1 and len(findings(pg)) == 0 and 'Kidney function' in t)
            pg.fill('#mc-egfr', '')
            # CrCl calculator: Use, then auto-update when weight changes, then Clear all resets it
            pg.fill('#mc-age', '80'); pg.fill('#mc-weight', '60'); pg.select_option('#mc-sex', 'male')
            pg.click('button[title^="Calculate creatinine clearance"]'); pg.fill('#mc-creat', '120'); pg.wait_for_timeout(100)
            pg.locator('button', has_text='Use').first.click(); pg.wait_for_timeout(150)
            v1 = pg.input_value('#mc-crcl')
            check('desktop: CrCl calculator reproduces SPS example (~36.9 mL/min)', v1.startswith('36.9'), v1)
            pg.fill('#mc-weight', '70'); pg.wait_for_timeout(150)
            v2 = pg.input_value('#mc-crcl')
            check('desktop: calculated CrCl updates when weight changes', v2 != v1 and v2.startswith('43'), v2)
            pg.click('text=Clear all'); pg.wait_for_timeout(150)
            check('desktop: Clear all empties CrCl and the calculator', pg.input_value('#mc-crcl') == '' and pg.locator('#mc-creat').count() == 0)
            # sticky bar
            add_med(pg, 'clarithromycin'); pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); pg.wait_for_timeout(400)
            check('desktop: sticky findings bar when panel scrolled away', pg.locator('div[role=status] >> text=Findings').count() >= 1)
        else:
            add_med(pg, 'warfarin'); add_med(pg, 'clarithromycin')
            pg.wait_for_timeout(200)
            cards = pg.locator('#mc-safety ul.md\\:hidden > li')
            check('mobile: findings shown as cards', cards.count() >= 1, cards.count())
            boxes = [pg.locator('article').nth(i).bounding_box() for i in range(2)]
            check('mobile: medicine cards stacked', boxes[1]['y'] > boxes[0]['y'] + boxes[0]['height'] - 5)
            w = pg.evaluate('document.documentElement.scrollWidth')
            check('mobile: no horizontal page scroll', w <= 392, w)
            pg.screenshot(path=os.path.join(SHOTS, 'mobile_warf_clari.png'), full_page=True)
            pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); pg.wait_for_timeout(400)
            check('mobile: sticky findings bar visible at bottom', pg.locator('div[role=status] >> text=Findings').count() >= 1)
            pg.screenshot(path=os.path.join(SHOTS, 'mobile_bottom.png'))
        # dark mode render
        pg.evaluate("document.documentElement.classList.add('dark')"); pg.wait_for_timeout(100)
        pg.screenshot(path=os.path.join(SHOTS, f'{tag}_dark.png'), full_page=False)
        check(f'{tag}: no page errors', not errs, errs[:3])
        ctx.close()
    b.close()
print(f'\n{passes} passed, {len(fails)} failed')
if fails: print('FAILED:', fails); sys.exit(1)
