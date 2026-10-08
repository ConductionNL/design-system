#!/usr/bin/env python3
"""Build the screens gallery data from screens-src/ into preview/screens/.

    python3 scripts/screens/build.py                 # index, every board, every thumbnail
    python3 scripts/screens/build.py --index-only    # only preview/screens/screens.json
    python3 scripts/screens/build.py --only Home --only wilgenboom-Home
    python3 scripts/screens/build.py --no-thumbs     # flatten only
    python3 scripts/screens/build.py --jobs 4        # parallel thumbnails (default 3)

Writes preview/screens/boards/<Name>.html, thumbs/<Name>.webp, assets/<set>/*.svg and screens.json.
Idempotent: every output is rewritten from the sources. Needs python3, node, Pillow and Chrome.
"""
import argparse
import concurrent.futures as cf
import datetime
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from flatten import Flattener  # noqa: E402

REPO = pathlib.Path(__file__).resolve().parents[2]
SRC = REPO / 'screens-src'
OUT = REPO / 'preview' / 'screens'
HEIGHTS = pathlib.Path(__file__).parent / 'heights.json'
CHROME = os.environ.get('CHROME', '/opt/google/chrome/chrome')
THUMB_W = 480
THUMB_MAX = 60_000
SCHOOLS = [
    ('wilgenboom', 'Basisschool De Wilgenboom'),
    ('vaartveld', 'Vaartveld College'),
    ('esdoornveen', 'Esdoornveen, mbo college'),
    ('warmtepompacademie', 'Warmtepompacademie'),
]
DESIGN_SYSTEMS = ['conduction', 'zuiddrecht'] + [s for s, _ in SCHOOLS]
# row key -> app id (stable, used in screen ids like portaliq/MijnZaken)
ROW_APP = {
    'rowHuisstijl': 'huisstijl', 'rowWerkplek': 'werkplek', 'rowSite': 'portaliq', 'rowMijn': 'portaliq',
    'rowBeheer': 'portaliq', 'rowDossiq': 'dossiq', 'rowPipelinq': 'pipelinq', 'rowAlgemeen': 'pipelinq',
    'rowAnalyse': 'analyse', 'rowOpencatalogi': 'opencatalogi', 'rowLearniq': 'learniq',
    'rowLearniqRollen': 'learniq', 'rowDecidiq': 'decidiq', 'rowThematiq': 'thematiq', 'rowBuildiq': 'buildiq',
    'rowKeepiq': 'keepiq', 'rowOnderdelen2': 'werkplek',
}


def load(path):
    return json.loads(path.read_text())


def note_parts(text):
    """'Capabilities: a, b.\\nWat je ziet: ...' -> ('a, b', 'Wat je ziet: ...')"""
    caps, rest = '', []
    for line in (text or '').splitlines():
        m = re.match(r'\s*Capabilities?:\s*(.*)', line)
        if m and not caps:
            caps = m.group(1).strip().rstrip('.')
        elif line.strip():
            rest.append(line.strip())
    return caps, '\n'.join(rest)


def build_index():
    """screens.json from the rows files and canvases. Heights are the measured canvas heights."""
    z = SRC / 'zuiddrecht'
    canvases = [load(z / 'canvas1.json'), load(z / 'canvas2.json')]
    boards_meta = {**canvases[0]['boards'], **canvases[1]['boards']}
    notes = {**canvases[0].get('notes', {}), **canvases[1].get('notes', {})}
    caprows = {**load(z / 'capability-rows.json'), **load(z / 'capability-rows-extra.json')}
    rows = load(z / 'rows1.json')['rows'] + load(z / 'rows2.json')['rows']
    # One registration file per app (screens-src/zuiddrecht/apps/<app>.json) so parallel work on
    # different apps never edits the same file: {"rows": [[key, title, columns]], "boards": {...}, "notes": {...}}
    row_app = dict(ROW_APP)
    for frag in sorted((z / 'apps').glob('*.json')):
        f = load(frag)
        boards_meta.update(f.get('boards', {}))
        notes.update(f.get('notes', {}))
        for row in f.get('rows', []):
            row_app[row[0]] = frag.stem
            rows.append(row)

    index = {'generated': datetime.date.today().isoformat(), 'designSystems': DESIGN_SYSTEMS, 'sets': [], 'boards': {}}
    zset = {'id': 'zuiddrecht', 'title': 'Zuiddrecht', 'themable': True, 'rows': []}
    for key, title, columns in rows:
        app = row_app.get(key, key.removeprefix('row').lower())
        names = [b[:-8] for col in columns for b in col]
        zset['rows'].append({'id': key, 'app': app, 'title': title, 'boards': names})
        for name in names:
            if name in index['boards']:
                continue  # a shared component copied into a second row keeps its first row
            meta = boards_meta.get(name + '.dc.html', {})
            caps, note = note_parts(notes.get('cap_' + name, {}).get('text', ''))
            if name in caprows and caprows[name]:
                _, c2, n2 = (caprows[name][0] + ['', '', ''])[:3]
                caps = caps or c2
                note = note or (f'Wat je ziet: {n2}' if n2 else '')
            index['boards'][name] = {
                'id': f'{app}/{name}', 'app': app, 'title': meta.get('title', name),
                'w': meta.get('w', 1440), 'h': meta.get('h', 1200), 'set': 'zuiddrecht', 'row': key,
                'file': f'boards/{name}.html', 'thumb': f'thumbs/{name}.webp', 'caps': caps, 'note': note,
                'src': f'zuiddrecht/{name}.dc.html',
            }
    index['sets'].append(zset)

    taken = set(index['boards'])
    school_names = {s: [b[:-8] for b in load(SRC / s / 'canvas.json')['order']] for s, _ in SCHOOLS}
    for s, title in SCHOOLS:
        canvas = load(SRC / s / 'canvas.json')
        others = set().union(*(set(v) for k, v in school_names.items() if k != s))
        keys = []
        for name in school_names[s]:
            key = f'{s}-{name}' if (name in taken or name in others) else name
            keys.append(key)
            meta = canvas['boards'].get(name + '.dc.html', {})
            caps, note = note_parts(canvas.get('notes', {}).get('cap_' + name, {}).get('text', ''))
            index['boards'][key] = {
                'id': f'{s}/{name}', 'app': s, 'title': meta.get('title', name),
                'w': meta.get('w', 1440), 'h': meta.get('h', 1200), 'set': s, 'row': s,
                'file': f'boards/{key}.html', 'thumb': f'thumbs/{key}.webp', 'caps': caps, 'note': note,
                'src': f'{s}/{name}.dc.html',
            }
        index['sets'].append({'id': s, 'title': title, 'themable': False,
                              'rows': [{'id': s, 'app': s, 'title': title, 'boards': keys}]})
    return index


def apply_heights(index):
    """Measured heights (heights.json, written by the measure step) override the canvas heights."""
    if HEIGHTS.exists():
        for k, h in load(HEIGHTS).items():
            if k in index['boards']:
                index['boards'][k]['h'] = h


def write_index(index):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'screens.json').write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n')


def copy_assets():
    for d in sorted(p for p in SRC.iterdir() if (p / 'logos').is_dir()):
        dest = OUT / 'assets' / d.name
        dest.mkdir(parents=True, exist_ok=True)
        for f in (d / 'logos').glob('*.svg'):
            (dest / f.name).write_bytes(f.read_bytes())


def flatteners(index):
    """One Flattener per set, with board-name -> output-key mapping for internal links."""
    out = {}
    for s in ['zuiddrecht'] + [s for s, _ in SCHOOLS]:
        src = SRC / s
        blobs = load(src / 'blobs.json')
        keymap = {b['src'].split('/')[1][:-8]: k for k, b in index['boards'].items() if b['set'] == s}
        out[s] = Flattener(src, blobs, f'../assets/{s}/', tokenize=(s == 'zuiddrecht'),
                           link_name=lambda n, m=keymap: m.get(n, n))
    return out


THEME_HEAD = '<link rel="stylesheet" href="../screens.css">\n<script src="../theme.js" defer></script>\n'


def flatten_one(fl, key, board):
    name = board['src'].split('/')[1][:-8]
    extra = THEME_HEAD if board['set'] == 'zuiddrecht' else ''
    html = fl.document(name, board['title'], board['w'], extra_head=extra)
    (OUT / board['file']).write_text(html)


MEASURE = ('<script>addEventListener("load",()=>setTimeout(()=>{const b=document.querySelector(".sc-board");'
           'let m=0;for(const e of b.querySelectorAll("*")){const q=e.getBoundingClientRect();'
           'if(q.height>0&&q.bottom>m)m=q.bottom}'
           'document.body.setAttribute("data-sc-height",Math.ceil(Math.max(b.scrollHeight,m)))},300))</script>')


def measure_one(board):
    """The rendered height in Chrome at the board width: content, or the drawn frame (root min-height) if taller."""
    html = OUT / board['file']
    with tempfile.TemporaryDirectory() as tmp:
        probe = html.with_name(f'.measure-{os.getpid()}-{html.name}')
        probe.write_text(html.read_text().replace('</body>', MEASURE + '</body>'))
        try:
            r = subprocess.run(['timeout', '60', CHROME, '--headless=new', '--no-sandbox', '--disable-gpu',
                                f'--user-data-dir={tmp}/profile', '--no-first-run', f'--window-size={board["w"]},900',
                                '--virtual-time-budget=5000', '--dump-dom', probe.as_uri()],
                               capture_output=True, text=True)
        finally:
            probe.unlink(missing_ok=True)
    m = re.search(r'data-sc-height="(\d+)"', r.stdout)
    if not m:
        raise RuntimeError('could not measure height')
    return int(m.group(1))


def thumb_one(key, board):
    from PIL import Image
    html = OUT / board['file']
    with tempfile.TemporaryDirectory() as tmp:
        png = pathlib.Path(tmp) / 'shot.png'
        subprocess.run(['timeout', '90', CHROME, '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
                        f'--user-data-dir={tmp}/profile', '--no-first-run', '--mute-audio',
                        f'--window-size={board["w"]},{board["h"]}', '--virtual-time-budget=5000',
                        f'--screenshot={png}', html.as_uri()], capture_output=True)
        if not png.exists():
            raise RuntimeError('no screenshot')
        img = Image.open(png).convert('RGB')
    h = round(img.height * THUMB_W / img.width)
    img = img.resize((THUMB_W, h), Image.LANCZOS)
    dest = OUT / board['thumb']
    for q in (80, 70, 60, 50, 40):
        img.save(dest, 'WEBP', quality=q, method=6)
        if dest.stat().st_size <= THUMB_MAX:
            break
    return dest.stat().st_size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', action='append', default=[], help='board key (repeatable)')
    ap.add_argument('--index-only', action='store_true')
    ap.add_argument('--no-thumbs', action='store_true')
    ap.add_argument('--no-measure', action='store_true', help='keep the stored or canvas heights')
    ap.add_argument('--resume', action='store_true', help='keep thumbnails whose board height did not change')
    ap.add_argument('--jobs', type=int, default=3)
    a = ap.parse_args()

    index = build_index()
    apply_heights(index)
    write_index(index)
    print(f'screens.json: {len(index["boards"])} boards in {sum(len(s["rows"]) for s in index["sets"])} rows')
    if a.index_only:
        return
    copy_assets()
    (OUT / 'boards').mkdir(exist_ok=True)
    (OUT / 'thumbs').mkdir(exist_ok=True)
    keys = a.only or list(index['boards'])
    unknown = [k for k in keys if k not in index['boards']]
    if unknown:
        sys.exit(f'unknown board(s): {", ".join(unknown)}')

    fls = flatteners(index)
    failed = {}

    def flat(k):
        b = index['boards'][k]
        flatten_one(fls[b['set']], k, b)

    with cf.ThreadPoolExecutor(max_workers=max(1, a.jobs)) as pool:
        for k, err in zip(keys, pool.map(lambda k: _try(flat, k), keys)):
            if err:
                failed[k] = 'flatten: ' + err
    print(f'flattened {len(keys) - len(failed)} of {len(keys)}')

    # real heights, written back to screens.json (the canvas heights are the fallback)
    before = {}
    if not a.no_measure:
        heights = load(HEIGHTS) if HEIGHTS.exists() else {}
        before = dict(heights)
        todo = [k for k in keys if k not in failed]

        def meas(k):
            heights[k] = measure_one(index['boards'][k])
        with cf.ThreadPoolExecutor(max_workers=max(1, a.jobs)) as pool:
            for k, err in zip(todo, pool.map(lambda k: _try(meas, k), todo)):
                if err:
                    print(f'measure {k}: {err}; keeping the canvas height', file=sys.stderr)
        HEIGHTS.write_text(json.dumps(dict(sorted(heights.items())), indent=0) + '\n')
        apply_heights(index)
        write_index(index)

    if not a.no_thumbs:
        todo = [k for k in keys if k not in failed]
        if a.resume:
            todo = [k for k in todo if not (OUT / index['boards'][k]['thumb']).exists()
                    or before.get(k) != index['boards'][k]['h']]
        with cf.ThreadPoolExecutor(max_workers=max(1, a.jobs)) as pool:
            for k, err in zip(todo, pool.map(lambda k: _try(thumb_one, k, index['boards'][k]), todo)):
                if err:
                    failed[k] = 'thumb: ' + err
        print(f'thumbnails {len(todo) - sum(1 for k in todo if k in failed)} of {len(todo)}')

    for k, err in failed.items():
        print(f'FAILED {k}: {err}', file=sys.stderr)
    sys.exit(1 if failed else 0)


def _try(fn, *args):
    try:
        fn(*args)
        return None
    except Exception as e:  # report and continue with the other boards
        return str(e)[-300:]


if __name__ == '__main__':
    main()
