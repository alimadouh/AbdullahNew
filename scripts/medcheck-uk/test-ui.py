# Browser tests for the Medication Safety Checker (medicines-only page).
#   (start: npx vite --port 5181)  python -I scripts/medcheck-uk/test-ui.py http://localhost:5181 [shots_dir]
import sys, os
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5181'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.environ.get('TEMP', '/tmp'), 'medcheck_ui_shots')
os.makedirs(SHOTS, exist_ok=True)
fails, passes = [], 0

def check(name, cond, info=''):
    global passes
    if cond: passes += 1; print('ok  ', name)
    else: fails.append(name); print('FAIL', name, info)

def add_med(pg, q):
    pg.fill('#mc-search', q)
    pg.wait_for_selector('#mc-search-results li[role=option]', timeout=5000)
    pg.locator('#mc-search-results li[role=option]').first.dispatch_event('mousedown')
    pg.wait_for_timeout(150)

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    for vw, tag in [((1440, 1000), 'desktop'), ((390, 844), 'mobile')]:
        ctx = b.new_context(viewport={'width': vw[0], 'height': vw[1]})
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        pg.goto(BASE + '/?section=tools&tool=medcheck', wait_until='networkidle')
        pg.wait_for_selector('#mc-search', timeout=20000)
        kb = pg.evaluate("fetch('/medcheck/kb.json').then(r=>r.json())")
        check(f'{tag}: kb loads', len(kb['medicines']) >= 30)
        check(f'{tag}: medicines only (no patient form, no country selector, no patient button)',
              pg.locator('#mc-age').count() == 0 and pg.locator('#mc-country').count() == 0 and pg.locator('text=Check against a patient').count() == 0)
        check(f'{tag}: empty state', 'Add medicines to see' in pg.content())

        add_med(pg, 'warfarin'); add_med(pg, 'ibuprofen')
        q = pg.inner_text('#mc-quick')
        check(f'{tag}: one box names the interacting pair', 'Warfarin sodium + Ibuprofen' in q, q[:300])
        check(f'{tag}: title lists do-not-give conditions', 'do not give in' in q and 'haemorrhagic stroke' in q.lower() and 'pregnancy' in q.lower())
        check(f'{tag}: interaction line says what it is and what to do', 'bleeding risk' in q.lower() and 'avoid' in q.lower())
        check(f'{tag}: never says "safe"', ' safe' not in q.lower())
        check(f'{tag}: medicine tables folded by default', pg.locator('article').count() == 0)
        pg.click('#mc-show-details'); pg.wait_for_timeout(150)
        check(f'{tag}: details open: two tables below the box', pg.locator('article').count() == 2 and pg.locator('#mc-quick').bounding_box()['y'] < pg.locator('article').first.bounding_box()['y'])
        boxes = [pg.locator('article').nth(i).bounding_box() for i in range(2)]
        if tag == 'desktop': check('desktop: tables side by side', abs(boxes[0]['y'] - boxes[1]['y']) < 5)
        else: check('mobile: tables stacked', boxes[1]['y'] > boxes[0]['y'] + boxes[0]['height'] - 5)
        # G6PD-type disease at the top
        add_med(pg, 'dapsone')
        check(f'{tag}: dapsone G6PD contraindication in the title', 'g6pd' in pg.inner_text('#mc-quick').lower())
        # removing a medicine updates the box
        pg.locator('button[aria-label="Remove Ibuprofen"]').first.click(); pg.wait_for_timeout(150)
        q = pg.inner_text('#mc-quick')
        check(f'{tag}: removing a medicine updates the box', 'Ibuprofen' not in q and 'No interaction found' in q, q[:200])
        # duplicate ingredient
        pg.click('text=Clear all'); add_med(pg, 'paracetamol'); add_med(pg, 'co-codamol')
        check(f'{tag}: duplicate paracetamol shown', 'paracetamol' in pg.inner_text('#mc-quick').lower() and 'co-codamol' in pg.inner_text('#mc-quick').lower())
        # contraindicated combination
        pg.click('text=Clear all'); add_med(pg, 'sildenafil'); add_med(pg, 'isosorbide')
        check(f'{tag}: sildenafil + nitrate shown as contraindicated', 'Contraindicated' in pg.inner_text('#mc-quick'))
        if tag == 'mobile':
            w = pg.evaluate('document.documentElement.scrollWidth')
            check('mobile: no horizontal page scroll', w <= 392, w)
        if pg.get_attribute('#mc-show-details', 'aria-expanded') != 'true': pg.click('#mc-show-details'); pg.wait_for_timeout(100)
        pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); pg.wait_for_timeout(400)
        check(f'{tag}: sticky summary bar when the box scrolls away', pg.locator('div[role=status] >> text=Summary').count() >= 1)
        pg.screenshot(path=os.path.join(SHOTS, f'{tag}.png'), full_page=True)
        pg.evaluate("document.documentElement.classList.add('dark')"); pg.wait_for_timeout(100)
        check(f'{tag}: no page errors', not errs, errs[:3])
        ctx.close()
    b.close()
print(f'\n{passes} passed, {len(fails)} failed')
if fails: print('FAILED:', fails); sys.exit(1)
