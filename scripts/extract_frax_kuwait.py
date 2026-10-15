"""Extract the FRAX Kuwait paper charts (fraxplus.org/paper-charts, (c) University of Sheffield)
into src/data/fraxKuwait.json.  Usage: python scripts/extract_frax_kuwait.py <folder with Chart_KWT_*.pdf>"""
import json, re, sys
from pathlib import Path
import fitz

LABELS = {'Number of', 'CRFs', 'BMI (kg/m²)', 'BMD T-score (femoral neck)'}
VAL = re.compile(r'^([\d.]+)(?: \(([\d.]+)-([\d.]+)\))?$')

def parse(pdf, kind):
    n = 7 if kind == 'bmi' else 11
    text = '\n'.join(p.get_text() for p in fitz.open(pdf))
    blocks = re.split(r'Age = (\d+) years', text)[1:]
    ages, tables, xs = [], [], None
    for age, body in zip(blocks[0::2], blocks[1::2]):
        lines = [l.strip() for l in body.split('\n') if l.strip() and l.strip() not in LABELS]
        x = [float(v) for v in lines[:n]]
        assert xs is None or xs == x, (pdf, age, x)
        xs = x
        rows, i = [], n
        for crf in range(7):
            assert lines[i] == str(crf), (pdf, age, crf, lines[i])
            cells = []
            for v in lines[i + 1:i + 1 + n]:
                m = VAL.match(v)
                assert m, (pdf, age, crf, v)
                cells.append([float(m.group(1))] + ([float(m.group(2)), float(m.group(3))] if m.group(2) else []))
            rows.append(cells)
            i += 1 + n
        ages.append(int(age)); tables.append(rows)
    return {'ages': ages, 'x': xs, 'rows': tables}

src = Path(sys.argv[1])
out = {}
for sex, s in (('female', 'wom'), ('male', 'men')):
    for outcome, o in (('mof', 'ost'), ('hip', 'hip')):
        for kind in ('bmi', 'bmd'):
            out.setdefault(sex, {}).setdefault(outcome, {})[kind] = parse(src / f'Chart_KWT_{o}_{s}_{kind}.pdf', kind)
meta = {'source': 'FRAX Kuwait paper charts, fraxplus.org/paper-charts, (c) University of Sheffield',
        'note': 'Value = [mean] or [mean, low, high]; rows[ageIndex][crfCount 0-6][xIndex]; bmd charts use BMI 24'}
dest = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'fraxKuwait.json'
dest.write_text(json.dumps({'meta': meta, **out}, separators=(',', ':')), encoding='utf-8')
print('wrote', dest, dest.stat().st_size, 'bytes')
for sex in out:
    for oc in out[sex]:
        for k, t in out[sex][oc].items():
            print(sex, oc, k, 'ages', t['ages'], 'x', t['x'][0], '..', t['x'][-1], 'tables', len(t['rows']))
