#!/usr/bin/env python3
"""Build preview/screens/capabilities.json and add repository and capability fields to screens.json.

    python3 scripts/screens/capabilities.py             # git fetch each app checkout, then build
    python3 scripts/screens/capabilities.py --no-fetch  # use what the checkouts already have

Reads, per app, from the local checkout at origin/development (falls back to the checkout's HEAD
when that ref is missing or the fetch failed, and says so):
  openspec/specs/<name>/spec.md, openspec/changes/<name>/proposal.md,
  openspec/parity/capabilities.json, openspec/parity/gap-decisions.json
and from this repo preview/screens/screens.json (boards[*].caps).

Run it after build.py: build.py rewrites screens.json without the fields this script adds.
Idempotent: both outputs are rewritten from the sources on every run.
"""
import argparse
import datetime
import json
import pathlib
import re
import subprocess
import sys

REPO = pathlib.Path(__file__).resolve().parents[2]
APPS_EXTRA = REPO.parent
SCREENS = REPO / 'preview' / 'screens'
DS_REPO = 'ConductionNL/design-system'
VUE_REPO = 'ConductionNL/nextcloud-vue'

# app id, local dir, GitHub repo
APPS = [
    ('portaliq', 'portaliq', 'ConductionNL/portaliq'),
    ('dossiq', 'procest', 'ConductionNL/dossiq'),
    ('pipelinq', 'pipelinq', 'ConductionNL/pipelinq'),
    ('opencatalogi', 'opencatalogi', 'ConductionNL/opencatalogi'),
    ('learniq', 'scholiq', 'ConductionNL/scholiq'),
    ('decidiq', 'decidesk', 'ConductionNL/decidiq'),
    ('thematiq', 'nldesign', 'ConductionNL/nldesign'),
    ('buildiq', 'openbuild', 'ConductionNL/buildiq'),
    ('keepiq', 'doriath', 'ConductionNL/doriath'),
    ('launchpad', 'launchpad', 'ConductionNL/launchpad'),
    ('openregister', 'openregister', 'ConductionNL/openregister'),
    # apps without boards on the design canvas: their capabilities are listed, without screens
    ('integriq', 'openconnector', 'ConductionNL/integriq'),
    ('filinq', 'docudesk', 'ConductionNL/filinq'),
    ('stackiq', 'softwarecatalog', 'ConductionNL/stackiq'),
    ('humaniq', 'hrmq', 'ConductionNL/humaniq'),
    ('shillinq', 'shillinq', 'ConductionNL/shillinq'),
    ('planninq', 'planix', 'ConductionNL/planninq'),
    ('larpinq', 'larpingapp', 'ConductionNL/larpinq'),
    ('hermiq', 'hermiq', 'ConductionNL/hermiq'),
    ('versioniq', 'app-versions', 'ConductionNL/versioniq'),
]
APP_IDS = [a for a, _, _ in APPS]
SCHOOLS = ['wilgenboom', 'vaartveld', 'esdoornveen', 'warmtepompacademie']
# school boards that belong to the learning app rather than the school website
SCHOOL_APP_BOARDS = re.compile(r'^(Lq|Nc|Lp|AppZijbalk|WerkKop)')
STATE_ORDER = ['built', 'building', 'specified', 'decided-no']
NO_FEATURE = '_none'  # the group per app for capabilities no feature claims
NONE_TOKENS = {'', 'geen spec genoemd', 'geen', 'geen spec'}


def log(msg):
    print(msg, file=sys.stderr)


class Checkout:
    """Reads files from one app checkout at a fixed ref with a single git cat-file process."""

    def __init__(self, app, dirname, repo, fetch, base=APPS_EXTRA):
        self.app, self.dir, self.repo = app, base / dirname, repo
        self.warning = None
        if fetch:
            r = subprocess.run(['git', '-C', str(self.dir), 'fetch', '-q', 'origin', 'development'],
                               capture_output=True, text=True, timeout=300)
            if r.returncode != 0:
                self.warning = f'fetch failed ({r.stderr.strip()[:120]})'
        self.ref = 'origin/development'
        if subprocess.run(['git', '-C', str(self.dir), 'rev-parse', '-q', '--verify', self.ref + '^{commit}'],
                          capture_output=True).returncode != 0:
            self.ref = 'HEAD'
            self.warning = (self.warning + '; ' if self.warning else '') + 'origin/development missing'
        if self.warning:
            self.warning += f', read {self.ref} instead'
            log(f'{app}: {self.warning}')
        self.sha = subprocess.run(['git', '-C', str(self.dir), 'rev-parse', '--short', self.ref],
                                  capture_output=True, text=True).stdout.strip()
        self.files = subprocess.run(['git', '-C', str(self.dir), 'ls-tree', '-r', '--name-only', self.ref, 'openspec/'],
                                    capture_output=True, text=True).stdout.splitlines()
        self.proc = subprocess.Popen(['git', '-C', str(self.dir), 'cat-file', '--batch'],
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE)

    def read(self, path):
        self.proc.stdin.write(f'{self.ref}:{path}\n'.encode())
        self.proc.stdin.flush()
        header = self.proc.stdout.readline().decode().split()
        if len(header) < 3 or header[1] == 'missing':
            return None
        size = int(header[2])
        data = self.proc.stdout.read(size)
        self.proc.stdout.read(1)
        return data.decode('utf-8', 'replace')

    def json(self, path):
        text = self.read(path)
        return json.loads(text) if text else None

    def close(self):
        self.proc.stdin.close()
        self.proc.wait()


def first_heading(text):
    for line in text.splitlines():
        m = re.match(r'#\s+(.+)', line)
        if m:
            return m.group(1).strip()
    return ''


def purpose_sentence(text):
    m = re.search(r'^##\s+Purpose\s*\n+(.+?)(?:\n\s*\n|\n#)', text, re.S | re.M)
    if not m:
        return ''
    para = ' '.join(m.group(1).split())
    sentence = re.split(r'(?<=[.!?])\s', para, maxsplit=1)[0]
    return sentence if len(sentence) <= 160 else sentence[:157].rstrip() + '...'


def spec_title(name, text):
    head = re.sub(r'\s*(Specification|Spec)\s*$', '', first_heading(text), flags=re.I).strip()
    head = re.sub(r'^(Spec(ification)?|Capability)\s*:\s*', '', head, flags=re.I).strip()
    if not head or head.lower() == name.lower():
        return purpose_sentence(text) or name
    return head


def change_title(name, text):
    head = re.sub(r'^(Proposal|Change)\s*:\s*', '', first_heading(text), flags=re.I).strip()
    return head or name


def load_app(co):
    specs, changes = {}, {}
    for f in co.files:
        m = re.fullmatch(r'openspec/specs/([^/]+)/spec\.md', f)
        if m:
            text = co.read(f) or ''
            pm = re.search(r'^##\s+Purpose\s*$(.*?)(?=^##\s)', text, re.S | re.M)
            specs[m.group(1)] = {'title': spec_title(m.group(1), text),
                                 'requirements': len(re.findall(r'^###\s+Requirement', text, re.M)),
                                 'named': set(re.findall(r'`([A-Za-z0-9][\w.-]*)`', pm.group(1))) if pm else set()}
        m = re.fullmatch(r'openspec/changes/([^/]+)/proposal\.md', f)
        if m and m.group(1) != 'archive':
            changes[m.group(1)] = change_title(m.group(1), co.read(f) or '')
    parity = co.json('openspec/parity/capabilities.json') or {}
    decisions = co.json('openspec/parity/gap-decisions.json') or []
    if isinstance(decisions, dict):
        decisions = decisions.get('decisions', [])
    latest = {}
    for d in decisions:
        row = d.get('row')
        if row and (row not in latest or str(d.get('decidedOn', '')) >= str(latest[row].get('decidedOn', ''))):
            latest[row] = d
    systems = [s['key'] if isinstance(s, dict) else s for s in parity.get('systems', [])]
    names = {s['key']: s.get('name') or s['key'] for s in parity.get('systems', []) if isinstance(s, dict)}
    overlay = co.json('openspec/features.overlay.json') or []
    return {'specs': specs, 'changes': changes, 'rows': parity.get('capabilities', []),
            'systems': systems, 'systemNames': names,
            'areas': {a.get('key'): a for a in parity.get('areas', []) if isinstance(a, dict)},
            'features': [f for f in parity.get('features', []) if isinstance(f, dict) and f.get('slug')],
            'specScreens': parity.get('specScreens') if isinstance(parity.get('specScreens'), dict) else {},
            'overlay': {o['slug']: o for o in overlay if isinstance(o, dict) and o.get('slug')} if isinstance(overlay, list) else {},
            'decisions': latest}


def spec_rows_of(app, d, caps):
    """spec name -> ids of the matrix rows that link it (spec list, built.spec, built.change, Purpose)."""
    out = {}
    for r in d['rows']:
        built = r.get('built') if isinstance(r.get('built'), dict) else {}
        names = {x['name'] for x in (caps.get(f'{app}/{r["id"]}') or {}).get('specs', [])}
        for v in (built.get('spec'), built.get('change')):
            if isinstance(v, str) and '/' not in v.strip().replace('openspec/specs/', ''):
                v = re.sub(r'^openspec/specs/|/spec\.md$', '', v.strip())
                names.add(v)
                names.add(re.sub(r'^\d{4}-\d{2}-\d{2}-', '', v))
        for n in names:
            if n in d['specs']:
                out.setdefault(n, set()).add(r['id'])
    for name, s in d['specs'].items():
        if (caps.get(f'{app}/{name}') or {}).get('matrixRows'):
            out.setdefault(name, set()).update(caps[f'{app}/{name}']['matrixRows'])
    return out


def screen_missing(c):
    """A capability of an app that should be on a screen and is not: no board, no reason, not decided against."""
    return (c['kind'] in ('matrix', 'spec') and not c['screens'] and not c.get('screenReason')
            and c['status'] != 'decided-no')


def humanise(text):
    text = re.sub(r'[-_]+', ' ', str(text)).strip()
    return text[:1].upper() + text[1:]


def build_features(app, d, caps):
    """Group every capability of one app under one feature.

    The matrix's own `features` list is the authority. Until an app has one, a row's `feature`
    value is the group (titled from the overlay or the spec it names), and a row without one
    falls under its area. Specs go to the feature that lists them, else to the feature most of
    their matrix rows are in. What is left goes to NO_FEATURE.
    """
    declared = {f['slug']: f for f in d['features']}
    out = {}

    def ensure(slug, title, title_nl=None, area=None, overlay=None, specs=None, derived=True):
        key = f'{app}/{slug}'
        if key not in out:
            out[key] = {'app': app, 'slug': slug, 'title': title, 'titleNl': title_nl or title, 'area': area,
                        'areaTitle': (d['areas'].get(area) or {}).get('name') if area else None,
                        'areaTitleNl': (d['areas'].get(area) or {}).get('name_nl') if area else None,
                        'overlay': overlay, 'specs': list(specs or []), 'derived': derived, 'caps': []}
        return key

    for f in d['features']:
        ensure(f['slug'], f.get('title') or humanise(f['slug']), f.get('title_nl'), f.get('area'),
               f.get('overlay'), [s for s in f.get('specs') or [] if isinstance(s, str)], derived=False)

    spec_owner = {}
    for key, f in out.items():
        for s in f['specs']:
            spec_owner.setdefault(s, key)

    spec_rows = spec_rows_of(app, d, caps)

    row_feature = {}
    for r in d['rows']:
        fv = r.get('feature') if isinstance(r.get('feature'), str) and r.get('feature').strip() else None
        if fv and fv in declared:
            key = f'{app}/{fv}'
        elif fv and not declared:
            ov = d['overlay'].get(fv)
            if ov:
                key = ensure(fv, ov.get('title') or humanise(fv), ov.get('title_nl'), r.get('area'), fv)
            elif fv in d['specs']:
                key = ensure(fv, d['specs'][fv]['title'], None, r.get('area'), None, [fv])
            else:
                key = ensure(slug(fv), humanise(fv), None, r.get('area'))
        elif not declared and r.get('area'):
            a = d['areas'].get(r['area']) or {}
            key = ensure('area-' + r['area'], a.get('name') or humanise(r['area']), a.get('name_nl'), r['area'])
        else:
            key = ensure(NO_FEATURE, 'Not tied to a feature', 'Niet aan een feature gekoppeld')
        row_feature[r['id']] = key

    for ck, c in caps.items():
        if c['app'] != app:
            continue
        if c['kind'] == 'matrix':
            key = row_feature.get(c['id'])
        elif c['kind'] == 'spec':
            key = spec_owner.get(c['id'])
            if not key:
                linked = set(c.get('matrixRows', [])) | spec_rows.get(c['id'], set())
                votes = [row_feature[r] for r in sorted(linked) if r in row_feature]
                key = max(set(votes), key=votes.count) if votes else None
        else:
            key = None
        if not key:
            key = ensure(NO_FEATURE, 'Not tied to a feature', 'Niet aan een feature gekoppeld')
        c['feature'] = key
        out[key]['caps'].append(ck)
    for f in out.values():
        if f['area'] is None:  # the area most of its rows are in
            areas = [caps[k]['area'] for k in f['caps'] if caps[k].get('area')]
            if areas:
                f['area'] = max(set(areas), key=areas.count)
                a = d['areas'].get(f['area']) or {}
                f['areaTitle'], f['areaTitleNl'] = a.get('name'), a.get('name_nl')
    return {k: v for k, v in out.items() if v['caps']}


def split_caps(caps, problems=None):
    """'a, b (remark, with comma), c' -> [(raw, 'a', []), (raw, 'b', ['remark, with comma']), ...]

    Some board notes were sorted after a naive comma split, which tore a remark apart:
    'x) (y), a (b, c' stands for 'a (b, x; y), c'. A fragment that closes a parenthesis it never
    opened is such a tail; its text joins the remark of the fragment that left one open.
    """
    if (caps or '').strip().lower().startswith('geen spec genoemd'):
        return []
    parsed, open_at, pending_tails = [], None, []
    for raw in (caps or '').split(','):
        raw = raw.strip().rstrip('.').strip()
        m = re.match(r'^([^()]*)\)(.*)$', raw)
        if m:  # closes a parenthesis it never opened: the tail of a remark
            tail = [m.group(1).strip()] + [n.strip() for n in re.findall(r'\(([^()]*)\)', m.group(2)) if n.strip()]
            if open_at is not None:  # well formed: 'b (x, y)' split into 'b (x' and 'y)'
                parsed[open_at][2][-1] += ', ' + '; '.join(tail)
                open_at = None
            else:  # torn and sorted: the opening fragment comes later
                pending_tails += tail
            continue
        head, unclosed = raw, None
        if raw.count('(') > raw.count(')'):
            i = raw.rfind('(')
            head, unclosed = raw[:i], raw[i + 1:].strip()
        notes = [n.strip() for n in re.findall(r'\(([^()]*)\)', head) if n.strip()]
        bare = re.sub(r'\([^()]*\)', '', head).strip()
        if bare.lower() in NONE_TOKENS or not bare:
            continue
        if unclosed is not None:
            notes.append(unclosed)
            if pending_tails:
                notes[-1] = '; '.join([notes[-1]] + pending_tails)
                pending_tails = []
                if problems is not None:
                    problems.append(caps)
            else:
                open_at = len(parsed)
        parsed.append((raw, bare, notes))
    if pending_tails and problems is not None:
        problems.append(caps)
    return parsed


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def board_repos(b, key):
    """(token app, primary repo, other repos) for one board."""
    app, name = b['app'], b['id'].split('/', 1)[1]
    repo_of = {a: r for a, _, r in APPS}
    if app in repo_of:
        return app, repo_of[app], []
    if app in ('huisstijl', 'analyse'):
        return None, DS_REPO, []
    if app == 'werkplek':
        if name.startswith('Lp'):
            return 'launchpad', repo_of['launchpad'], []
        if name.startswith('Nc'):
            return 'thematiq', repo_of['thematiq'], []
        return None, VUE_REPO, []
    if app in SCHOOLS:
        extra = [] if SCHOOL_APP_BOARDS.match(name) else [repo_of['portaliq']]
        return 'learniq', repo_of['learniq'], extra
    return None, DS_REPO, []


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--no-fetch', action='store_true', help='do not git fetch the app checkouts')
    ap.add_argument('--apps-dir', type=pathlib.Path, default=APPS_EXTRA,
                    help='directory that holds the app checkouts (default: the parent of this repo)')
    args = ap.parse_args()

    data, meta, warnings = {}, {}, []
    for app, dirname, repo in APPS:
        co = Checkout(app, dirname, repo, not args.no_fetch, args.apps_dir.resolve())
        data[app] = load_app(co)
        meta[app] = {'dir': dirname, 'repo': repo, 'ref': co.ref, 'sha': co.sha}
        if co.warning:
            warnings.append(f'{app}: {co.warning}')
        co.close()

    index = json.loads((SCREENS / 'screens.json').read_text())
    boards = index['boards']
    by_name = {}
    for key, b in boards.items():
        if b['set'] == 'zuiddrecht':
            by_name[key] = b['id']

    caps = {}
    spec_url = lambda app, name: f'https://github.com/{meta[app]["repo"]}/blob/development/openspec/specs/{name}/spec.md'

    def spec_ref(app, name):
        s = data[app]['specs'][name]
        return {'name': name, 'app': app, 'url': spec_url(app, name), 'requirements': s['requirements']}

    # 1. every spec and every matrix row of every app
    for app in APP_IDS:
        d = data[app]
        rows_by_feature = {}
        for r in d['rows']:
            st = (r.get('built') or {}).get('state') if isinstance(r.get('built'), dict) else None
            f = r.get('feature')
            if isinstance(f, str) and f in d['specs']:
                rows_by_feature.setdefault(f, []).append(st)
        row_ids = {r['id'] for r in d['rows']}
        named_by = {}  # row id -> specs whose Purpose names it in backticks
        for name, s in d['specs'].items():
            for rid in s['named'] & row_ids:
                named_by.setdefault(rid, []).append(name)
                st = next((r.get('built') or {}).get('state') for r in d['rows'] if r['id'] == rid)
                rows_by_feature.setdefault(name, []).append(st)
        for name, s in d['specs'].items():
            linked = [st for st in rows_by_feature.get(name, []) if st in STATE_ORDER]
            status = next((st for st in STATE_ORDER if st in linked), 'specified')
            caps[f'{app}/{name}'] = {
                'id': name, 'app': app, 'kind': 'spec', 'title': s['title'], 'area': None, 'status': status,
                'specs': [spec_ref(app, name)], 'systems': {}, 'screens': [], 'decision': None, 'notes': [],
                'source': 'openspec',
                'matrixRows': sorted({r['id'] for r in d['rows'] if r.get('feature') == name} | (s['named'] & row_ids)),
            }
        for r in d['rows']:
            built = r.get('built') if isinstance(r.get('built'), dict) else {}
            state = built.get('state')
            notes = []
            if state not in STATE_ORDER:
                notes.append(f'matrix built.state is {state!r}, shown as specified')
                state = 'specified'
            specs = []
            for f in [r.get('feature'), built.get('spec')] + sorted(named_by.get(r['id'], [])):
                if isinstance(f, str):
                    f = f.strip()
                    f = re.sub(r'^openspec/specs/|/spec\.md$', '', f)
                    if f in d['specs'] and f not in [x['name'] for x in specs]:
                        specs.append(spec_ref(app, f))
            screens, reason = [], None
            scr = r.get('screen') if isinstance(r.get('screen'), dict) else built.get('screen')  # dossiq keeps it in built
            bnames = scr.get('board') if isinstance(scr, dict) else None
            for bn in ([bnames] if isinstance(bnames, str) else bnames or []):
                if bn in by_name:
                    screens.append(by_name[bn])
                else:
                    notes.append(f'matrix screen board {bn} is not in the gallery')
            if not bnames and isinstance(scr, dict) and isinstance(scr.get('reason'), str) and scr['reason'].strip():
                reason = scr['reason'].strip()
            dec = d['decisions'].get(r['id'])
            area = r.get('area')
            caps[f'{app}/{r["id"]}'] = {
                'id': r['id'], 'app': app, 'kind': 'matrix', 'title': r.get('name') or r['id'],
                'area': area, 'areaTitle': (d['areas'].get(area) or {}).get('name'), 'status': state,
                'specs': specs,
                'systems': {k: r[k] for k in d['systems'] if k in r},
                'screens': screens,
                'decision': {k: dec.get(k) for k in ('decision', 'reason', 'change', 'decidedOn')} if dec else None,
                'notes': notes, 'source': 'parity', 'matrixScreens': list(screens),
                'screenReason': reason,
            }

    # 2. board tokens
    unresolved, cross, torn = [], [], []

    def resolve(token, home, extra_apps):
        order = ([home] if home else []) + [a for a in extra_apps if a != home]
        for kind, test in (('spec', lambda a: token in data[a]['specs']),
                           ('matrix', lambda a: f'{a}/{token}' in caps and caps[f'{a}/{token}']['kind'] == 'matrix'),
                           ('change', lambda a: token in data[a]['changes'])):
            for a in order:
                if test(a):
                    return kind, a, False
        # elsewhere in the fleet, only when exactly one app has it
        for kind, test in (('spec', lambda a: token in data[a]['specs']),
                           ('matrix', lambda a: f'{a}/{token}' in caps and caps[f'{a}/{token}']['kind'] == 'matrix'),
                           ('change', lambda a: token in data[a]['changes'])):
            hits = [a for a in APP_IDS if test(a)]
            if len(hits) == 1:
                return kind, hits[0], True
        return None, None, False

    for key, b in boards.items():
        home, repo, extra_repos = board_repos(b, key)
        extra_apps = ['portaliq'] if extra_repos else []
        cap_ids, board_specs = [], []
        for raw, bare, notes in split_caps(b.get('caps', ''), torn_here := []):
            first = re.split(r'[\s(]', bare, maxsplit=1)[0]
            kind, app, far = resolve(first, home, extra_apps)
            if kind:
                ck = f'{app}/{first}'
                if far:
                    cross.append(f'{b["id"]}: {first} -> {app}')
                if kind == 'change' and ck not in caps:
                    caps[ck] = {'id': first, 'app': app, 'kind': 'change', 'title': data[app]['changes'][first],
                                'area': None, 'status': 'in-flight', 'specs': [], 'systems': {}, 'screens': [],
                                'decision': None, 'notes': [], 'source': 'openspec',
                                'changeUrl': f'https://github.com/{meta[app]["repo"]}/tree/development/openspec/changes/{first}'}
            else:
                owner = home or {DS_REPO: 'design-system', VUE_REPO: 'nextcloud-vue'}[repo]
                if re.match(r'^(of|oi)-', first):
                    ext_id, title = first, bare
                    source = 'openforms' if first.startswith('of-') else 'openinwoner'
                    kind = 'external'
                elif re.match(r'^(NLDS|Den Haag)\b', bare):
                    ext_id, title = slug(bare), bare
                    source = 'nlds' if bare.startswith('NLDS') else 'board'
                    kind = 'external'
                else:
                    ext_id, title, source, kind = slug(bare) if ' ' in bare else first, bare, 'board', 'free'
                    unresolved.append(f'{b["id"]}: {raw}')
                ck = f'{owner}/{ext_id}'
                if ck not in caps:
                    caps[ck] = {'id': ext_id, 'app': owner, 'kind': kind, 'title': title, 'area': None,
                                'status': 'external', 'specs': [], 'systems': {}, 'screens': [], 'decision': None,
                                'notes': [], 'source': source}
            c = caps[ck]
            if b['id'] not in c['screens']:
                c['screens'].append(b['id'])
            for n in notes:
                if n not in c['notes']:
                    c['notes'].append(n)
            if ck not in cap_ids:
                cap_ids.append(ck)
        # matrix rows that name this board in their screen field come after the board's own tokens
        matrix_ids = sorted(k for k, c in caps.items() if c['kind'] == 'matrix' and b['id'] in c.get('matrixScreens', []))
        for ck in cap_ids:
            for s in caps[ck]['specs']:
                if s['url'] not in [x['url'] for x in board_specs]:
                    board_specs.append({'name': s['name'], 'url': s['url']})
        if torn_here:
            torn.append(b['id'])
        b['repo'] = repo
        b['repoUrl'] = f'https://github.com/{repo}'
        b['repos'] = [repo] + extra_repos
        b['src'] = b['src'] if b['src'].startswith('screens-src/') else 'screens-src/' + b['src']
        b['capIds'] = cap_ids
        b['matrixCapIds'] = [k for k in matrix_ids if k not in cap_ids]
        b['specs'] = board_specs

    # 3a. a spec is on the screens of the rows that link it, or on what the matrix's specScreens says
    for app in APP_IDS:
        d = data[app]
        linked = spec_rows_of(app, d, caps)
        for name in d['specs']:
            c = caps[f'{app}/{name}']
            rows = [caps[f'{app}/{rid}'] for rid in sorted(linked.get(name, ())) if f'{app}/{rid}' in caps]
            for rc in rows:
                for sid in rc.get('matrixScreens', []):
                    if sid not in c['screens']:
                        c['screens'].append(sid)
            own = d['specScreens'].get(name) if isinstance(d['specScreens'].get(name), dict) else {}
            bn = own.get('board')
            for b in ([bn] if isinstance(bn, str) else bn or []):
                if b in by_name and by_name[b] not in c['screens']:
                    c['screens'].append(by_name[b])
                elif b not in by_name:
                    c['notes'].append(f'specScreens board {b} is not in the gallery')
            c['screenReason'] = None
            if not c['screens']:
                if isinstance(own.get('reason'), str) and own['reason'].strip():
                    c['screenReason'] = own['reason'].strip()
                elif rows and all(rc.get('screenReason') for rc in rows):
                    c['screenReason'] = rows[0]['screenReason']

    # 3. statuses that depend on screens, sorting
    for c in caps.values():
        if c['kind'] in ('external', 'free'):
            c['status'] = 'designed' if c['screens'] else 'external'
        c['screens'] = sorted(set(c['screens']))
        c.pop('matrixScreens', None)

    # 4. features: every capability of an app sits under exactly one
    features = {}
    for app in APP_IDS:
        features.update(build_features(app, data[app], caps))
    for owner in ('design-system', 'nextcloud-vue'):
        mine = sorted(k for k, c in caps.items() if c['app'] == owner)
        if mine:
            key = f'{owner}/{NO_FEATURE}'
            features[key] = {'app': owner, 'slug': NO_FEATURE, 'title': 'Not tied to a feature',
                             'titleNl': 'Niet aan een feature gekoppeld', 'area': None, 'areaTitle': None,
                             'areaTitleNl': None, 'overlay': None, 'specs': [], 'derived': True, 'caps': mine}
            for k in mine:
                caps[k]['feature'] = key
    missing = [k for k, c in caps.items() if not c.get('feature')]
    if missing:
        sys.exit(f'capabilities without a feature: {missing[:10]}')

    # 5. apps block
    screens_per_app = {}
    for b in boards.values():
        home, _, _ = board_repos(b, None)
        screens_per_app[home or b['app']] = screens_per_app.get(home or b['app'], 0) + 1
    apps = {}
    for app, dirname, repo in APPS:
        d = data[app]
        mine = [c for c in caps.values() if c['app'] == app]
        states = {s: 0 for s in STATE_ORDER}
        for r in d['rows']:
            st = (r.get('built') or {}).get('state') if isinstance(r.get('built'), dict) else None
            states[st if st in STATE_ORDER else 'specified'] += 1
        apps[app] = {
            'title': app, 'repo': repo, 'repoUrl': f'https://github.com/{repo}', 'dir': dirname,
            'ref': meta[app]['ref'], 'sha': meta[app]['sha'],
            'specsUrl': f'https://github.com/{repo}/tree/development/openspec/specs',
            'specCount': len(d['specs']), 'changeCount': len(d['changes']),
            'parity': {'rows': len(d['rows']), 'systems': d['systems'], 'systemNames': d['systemNames'],
                       'states': states},
            'features': sum(1 for f in features.values() if f['app'] == app and f['slug'] != NO_FEATURE),
            'featuresDeclared': bool(d['features']),
            'screens': screens_per_app.get(app, 0),
            'capsWithScreen': sum(1 for c in mine if c['screens']),
            'capsWithoutScreen': sum(1 for c in mine if not c['screens']),
            'capsNoScreenReason': sum(1 for c in mine if not c['screens'] and c.get('screenReason')),
            'capsScreenMissing': sum(1 for c in mine if screen_missing(c)),
        }
    for owner, repo in (('design-system', DS_REPO), ('nextcloud-vue', VUE_REPO)):
        mine = [c for c in caps.values() if c['app'] == owner]
        apps[owner] = {'title': owner, 'repo': repo, 'repoUrl': f'https://github.com/{repo}', 'dir': None,
                       'specsUrl': None, 'specCount': 0, 'changeCount': 0, 'parity': None,
                       'features': 0, 'featuresDeclared': False,
                       'screens': sum(1 for b in boards.values() if board_repos(b, None)[1] == repo),
                       'capsWithScreen': sum(1 for c in mine if c['screens']),
                       'capsWithoutScreen': sum(1 for c in mine if not c['screens'])}

    out = {'generated': datetime.date.today().isoformat(), 'apps': apps,
           'features': dict(sorted(features.items())),
           'capabilities': dict(sorted(caps.items())), 'warnings': warnings}
    (SCREENS / 'capabilities.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
    (SCREENS / 'screens.json').write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n')

    # report
    print(f'capabilities.json: {len(caps)} capabilities in {len(features)} features; screens.json: {len(boards)} boards')
    rows_total = sum(len(data[a]['rows']) for a in APP_IDS)
    rows_out = sum(1 for c in caps.values() if c['kind'] == 'matrix')
    print(f'matrix rows: {rows_out} written of {rows_total} in the matrices')
    if rows_out != rows_total:
        sys.exit('matrix row count differs: a row id is duplicated or lost')
    undeclared = [a for a in APP_IDS if not data[a]['features']]
    print(f'apps without a features list in their matrix (grouped by feature value or area): {undeclared}')
    print(f'{"app":14} {"specs":>5} {"rows":>5} {"withScr":>7} {"noScr":>6} {"screens":>7} {"scrNoCap":>8}')
    for app, a in apps.items():
        no_cap = sum(1 for b in boards.values()
                     if (board_repos(b, None)[0] or {DS_REPO: 'design-system', VUE_REPO: 'nextcloud-vue'}.get(board_repos(b, None)[1])) == app
                     and not b['capIds'])
        print(f'{app:14} {a["specCount"]:>5} {(a["parity"] or {}).get("rows", 0):>5} {a["capsWithScreen"]:>7} '
              f'{a["capsWithoutScreen"]:>6} {a["screens"]:>7} {no_cap:>8}')
    print(f'{"app":14} {"onScreen":>8} {"reason":>6} {"missing":>7}   (matrix rows and specs, decided-no left out)')
    for app in APP_IDS:
        mine = [c for c in caps.values() if c['app'] == app and c['kind'] in ('matrix', 'spec')]
        print(f'{app:14} {sum(1 for c in mine if c["screens"]):>8} {sum(1 for c in mine if not c["screens"] and c.get("screenReason")):>6} '
              f'{sum(1 for c in mine if screen_missing(c)):>7}')
    print(f'free tokens: {len(unresolved)}')
    for u in unresolved[:10]:
        print('  ' + u)
    print(f'resolved in another app: {len(cross)}')
    for u in cross[:20]:
        print('  ' + u)
    print(f'boards with a torn caps note (remark rejoined): {len(torn)} {torn}')
    for w in warnings:
        print('warning: ' + w)


if __name__ == '__main__':
    main()
