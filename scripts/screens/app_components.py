#!/usr/bin/env python3
"""Build preview/screens/app-components.json: which nextcloud-vue components the live app renders
on the page behind each drawn board.

    python3 scripts/screens/app_components.py                    # every app with a checkout
    python3 scripts/screens/app_components.py --app dossiq       # one app
    python3 scripts/screens/app_components.py --apps-dir ~/work  # checkouts live elsewhere

Where the data comes from:

- `preview/screens/build-status.json` names the live route of every board (`boards[<Name>].route`).
- The app's manifest decides what that route renders: `src/manifest.json` plus the fragments in
  `src/manifest.d/*.json` (pages and menu are concatenated, ADR-037). The route is matched
  against `pages[].route` (`:param` matches one path segment; the most literal match wins).
- nextcloud-vue, read from the checkout next to this repo (`../nextcloud-vue`):
  - `src/components/CnPageRenderer/pageTypes.js` maps `pages[].type` to the page component.
  - The page component's registered `components: {}` are the children it can mount. Which of
    them the page really mounts depends on its config, so `CHILD_RULES` below keeps one
    predicate per child (a view mode, `config.quickFilters`, `config.lifecycleActions`, ...).
    A child without a rule is mounted; dialogs and modals only when the board draws a dialog.
  - Widget types resolve in the order the library uses: the app's own registry
    (`src/registry.js`), then the dashboard catalogue (`registerDashboardWidget('type', {
    renderer })`), then `BUILT_IN_WIDGETS`, then the type aliases.
  - A page-level `widgets[]` entry for the body slot makes CnPageRenderer mount CnWidgetGrid
    instead of the typed page component; only `config.widgets` reaches the typed component.
- `type: "custom"` pages, slots, `actionsComponent`, `sidebarComponent` and sidebar tabs with a
  `component` name an entry in the app's `src/registry.js`. That entry's `.vue` file is read for
  the Cn components it imports from `@conduction/nextcloud-vue`, two levels of local imports deep.
- `/settings/admin/<app>` routes render the app's `src/settings.js` root, read the same way.

Apps are found through `APP_DIRS`: the checkout directory names an app may live under (the
workspace still uses the old names for some). Every board of an app in build-status.json gets an
entry, also when the route is missing or matches no page; then `page` is null and `reason` says why.

Reads build-status.json and screens.json, never writes them. Idempotent.
"""
import argparse
import datetime
import json
import pathlib
import re
import subprocess
import sys
from collections import OrderedDict

REPO = pathlib.Path(__file__).resolve().parents[2]
SCREENS = REPO / 'preview' / 'screens'
OUT = SCREENS / 'app-components.json'
VUE_GH = 'https://github.com/ConductionNL/nextcloud-vue/blob/development/'

# app id -> checkout directory names, first match wins
APP_DIRS = {
    'dossiq': ['dossiq', 'procest'],
    'pipelinq': ['pipelinq'],
    'decidiq': ['decidiq', 'decidesk'],
    'portaliq': ['portaliq'],
    'humaniq': ['humaniq', 'hrmq'],
    'thematiq': ['thematiq', 'nldesign'],
    'shillinq': ['shillinq'],
    'planninq': ['planninq', 'planix'],
    'learniq': ['learniq', 'scholiq'],
    'keepiq': ['keepiq', 'doriath'],
    'filinq': ['filinq', 'docudesk'],
    'integriq': ['integriq', 'openconnector'],
    'stackiq': ['stackiq', 'softwarecatalog'],
    'buildiq': ['buildiq', 'openbuild'],
}
VUE_DIRS = ['nextcloud-vue']

# Children a page component registers but never mounts on its own: state, primitives, editors.
SKIP_CHILDREN = {'CnIcon', 'CnEmptyContent', 'CnWidgetIcon', 'CnWidgetRefItem', 'CnTranslatedBadge',
                 'CnLockedBanner', 'CnLeafMountHost', 'CnContextMenu', 'CnWidgetStyleEditorModal',
                 'CnRelationLinkModal', 'CnQuickEditDialog', 'CnSavedViewPresentationDialog',
                 'CnSavedViewShareDialog', 'CnSaveViewDialog', 'CnAdvancedFormDialog',
                 'CnSettingsWidgetMount'}
DIALOG_RE = re.compile(r'(Dialog|Modal|Wizard)$')
# Widgets a dashboard page registers for its typed branches; they are reached through widget types.
WIDGET_ONLY_CHILDREN = {'CnChartWidget', 'CnStatsBlockWidget', 'CnTileWidget'}

# Sidebar tab types CnObjectSidebar renders itself.
SIDEBAR_TABS = {'audit': 'CnAuditTrailTab', 'audit-trail': 'CnAuditTrailTab', 'files': 'CnFilesTab', 'notes': 'CnNotesTab',
                'tags': 'CnTagsTab', 'tasks': 'CnTasksTab'}

INDEX_MODE_CHILD = {'table': 'CnDataTable', 'cards': 'CnCardGrid', 'board': 'CnBoardView', 'map': 'CnMapWidget',
                    'calendar': 'CnObjectCalendar', 'dateAxis': 'CnDateAxisView', 'list': 'CnObjectList'}


def _any(cfg, *keys):
    return any(cfg.get(k) for k in keys)


# (page type, child) -> predicate(config, page, ctx). ctx has 'mode' (index view mode) and 'kind'.
CHILD_RULES = {
    ('index', 'CnDataTable'): lambda c, p, x: x['mode'] == 'table',
    ('index', 'CnCardGrid'): lambda c, p, x: x['mode'] == 'cards',
    ('index', 'CnBoardView'): lambda c, p, x: x['mode'] == 'board',
    ('index', 'CnMapWidget'): lambda c, p, x: x['mode'] == 'map',
    ('index', 'CnObjectCalendar'): lambda c, p, x: x['mode'] == 'calendar',
    ('index', 'CnDateAxisView'): lambda c, p, x: x['mode'] == 'dateAxis',
    ('index', 'CnObjectList'): lambda c, p, x: x['mode'] == 'list',
    ('index', 'CnFolderSidebar'): lambda c, p, x: bool(c.get('folderSidebar')),
    ('index', 'CnIndexSidebar'): lambda c, p, x: bool(c.get('sidebar')) and c.get('sidebar') is not False,
    ('index', 'CnQuickFilterBar'): lambda c, p, x: bool(c.get('quickFilters')),
    ('index', 'CnRowActions'): lambda c, p, x: bool(c.get('actions')),
    ('index', 'CnActionButtons'): lambda c, p, x: _any(c, 'headerActions', 'headerButtons'),
    ('index', 'CnFollowToggle'): lambda c, p, x: bool(c.get('follow')),
    ('index', 'CnIndexPageWidgets'): lambda c, p, x: bool(c.get('widgets')),
    ('index', 'CnSavedViewsControl'): lambda c, p, x: bool(c.get('allowSavedViews')),
    ('index', 'CnPagination'): lambda c, p, x: x['mode'] in ('table', 'cards', 'list'),
    ('index', 'CnMassCopyDialog'): lambda c, p, x: x['kind'] == 'dialog' and bool(c.get('bulkActions')),
    ('index', 'CnMassDeleteDialog'): lambda c, p, x: x['kind'] == 'dialog' and bool(c.get('bulkActions')),
    ('index', 'CnMassExportDialog'): lambda c, p, x: x['kind'] == 'dialog' and bool(c.get('bulkActions')),
    ('index', 'CnMassImportDialog'): lambda c, p, x: x['kind'] == 'dialog' and bool(c.get('bulkActions')),
    ('detail', 'CnDashboardGrid'): lambda c, p, x: _any(c, 'layout', 'widgets'),
    ('detail', 'CnDetailWidgetHost'): lambda c, p, x: bool(c.get('widgets')),
    ('detail', 'CnNextStepCard'): lambda c, p, x: bool(c.get('nextStep')),
    ('detail', 'CnRelatedCollections'): lambda c, p, x: bool(c.get('relatedCollections')),
    ('detail', 'CnLifecycleActions'): lambda c, p, x: bool(c.get('lifecycleActions')),
    ('detail', 'CnActionsMenu'): lambda c, p, x: _any(c, 'actions', 'lifecycleActions', 'quickActions'),
    ('detail', 'CnActionButtons'): lambda c, p, x: _any(c, 'headerActions', 'quickActions'),
    ('detail', 'CnBodySections'): lambda c, p, x: _any(c, 'sections', 'bodySections'),
    ('detail', 'CnSummaryAggregates'): lambda c, p, x: bool(c.get('summaryAggregates')),
    ('detail', 'CnFollowToggle'): lambda c, p, x: bool(c.get('follow')),
    ('detail', 'CnDetailHeaderChips'): lambda c, p, x: _any(c, 'typePill', 'statusPill', 'headerMeta'),
    ('detail', 'CnStatusBadge'): lambda c, p, x: _any(c, 'statusPill', 'statusField'),
    ('detail', 'CnBreadcrumbs'): lambda c, p, x: bool(c.get('breadcrumb')),
    ('detail', 'CnSegmentedControl'): lambda c, p, x: bool(c.get('views')),
    ('dashboard', 'CnDashboardGrid'): lambda c, p, x: _any(c, 'widgets', 'layout', 'views', 'userWidgets'),
    ('dashboard', 'CnWidgetRenderer'): lambda c, p, x: _any(c, 'widgets', 'views', 'userWidgets'),
    ('dashboard', 'CnWidgetWrapper'): lambda c, p, x: _any(c, 'widgets', 'views', 'userWidgets'),
    ('dashboard', 'CnKpiGrid'): lambda c, p, x: bool(c.get('kpiRow')),
    ('dashboard', 'CnHeaderTrail'): lambda c, p, x: bool(c.get('breadcrumb')),
    ('dashboard', 'CnSegmentedControl'): lambda c, p, x: bool(c.get('views')),
    ('dashboard', 'CnActionButtons'): lambda c, p, x: bool(c.get('headerActions')),
    ('dashboard', 'CnActionsMenu'): lambda c, p, x: bool(c.get('showActionsMenu')),
    ('dashboard', 'CnBodySections'): lambda c, p, x: bool(c.get('sections')),
    ('dashboard', 'CnDateRangePicker'): lambda c, p, x: bool(c.get('dateRange')),
}


# ---------------------------------------------------------------------------------------------
# checkouts
# ---------------------------------------------------------------------------------------------

def find_dir(base, names):
    for n in names:
        p = base / n
        if p.is_dir():
            return p
    return None


def git_info(path):
    def run(cmd):
        r = subprocess.run(cmd, cwd=path, capture_output=True, text=True)
        return r.stdout.strip() if r.returncode == 0 else None
    return {'path': str(path), 'ref': run(['git', 'branch', '--show-current']) or 'HEAD',
            'sha': run(['git', 'rev-parse', 'HEAD'])}


def read(path):
    try:
        return path.read_text(encoding='utf-8')
    except OSError:
        return ''


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


# ---------------------------------------------------------------------------------------------
# nextcloud-vue: page types, widget catalogue, component children
# ---------------------------------------------------------------------------------------------

class Vue:
    """What the library renders for a page type, a widget type, and inside a page component."""

    def __init__(self, root):
        self.root = root
        self.src = root / 'src'
        self.page_types = self._page_types()
        self.widgets = self._widget_catalogue()
        self.aliases = self._aliases()
        self._children = {}

    def _page_types(self):
        s = read(self.src / 'components' / 'CnPageRenderer' / 'pageTypes.js')
        out = {}
        for m in re.finditer(r"^\s*'?([\w-]+)'?:\s*defineAsyncComponent\(\(\) => import\('([^']+)'\)", s, re.M):
            out[m.group(1)] = pathlib.Path(m.group(2)).stem
        return out

    def _imports(self, text):
        """identifier -> file stem for default imports of .vue files."""
        return {m.group(1): pathlib.Path(m.group(2)).stem
                for m in re.finditer(r"^import\s+(\w+)\s+from\s+'([^']+\.vue)'", text, re.M)}

    def _widget_catalogue(self):
        out = {}
        files = list((self.src / 'components').rglob('*.js'))
        for f in files:
            s = read(f)
            if 'registerDashboardWidget(' not in s and 'BUILT_IN_WIDGETS' not in s:
                continue
            imports = self._imports(s)
            for m in re.finditer(r"registerDashboardWidget\(\s*'([\w-]+)'\s*,\s*\{(.*?)\n\}\)", s, re.S):
                r = re.search(r'\brenderer:\s*(\w+)', m.group(2))
                if r and r.group(1) in imports:
                    out.setdefault(m.group(1), imports[r.group(1)])
            if f.name == 'builtInWidgets.js':
                for m in re.finditer(r"^\s*'([\w-]+)':\s*(Cn\w+),", s, re.M):
                    out.setdefault(m.group(1), imports.get(m.group(2), m.group(2)))
        return out

    def _aliases(self):
        s = read(self.src / 'utils' / 'widgetTypeAliases.js')
        return dict(re.findall(r"^\s*'([\w-]+)':\s*'([\w-]+)',", s, re.M))

    def component_file(self, name):
        p = self.src / 'components' / name / (name + '.vue')
        if p.is_file():
            return p
        hits = list((self.src / 'components').glob('*/' + name + '.vue')) + list((self.src / 'dialogs').glob(name + '.vue'))
        return hits[0] if hits else None

    def children(self, name):
        """Cn components a library component registers in its `components: {}` block."""
        if name in self._children:
            return self._children[name]
        f = self.component_file(name)
        names = []
        if f:
            s = read(f)
            m = re.search(r'\n\tcomponents: \{(.*?)\n\t\},', s, re.S)
            if m:
                names = sorted(set(re.findall(r'\b(Cn[A-Za-z0-9]+)\b', m.group(1))) - {name})
        self._children[name] = names
        return names

    def source_url(self, name):
        f = self.component_file(name)
        return VUE_GH + str(f.relative_to(self.root)) if f else None

    def widget_renderer(self, wtype):
        if wtype in self.widgets:
            return self.widgets[wtype]
        alias = self.aliases.get(wtype)
        if alias and alias in self.widgets:
            return self.widgets[alias]
        return None


# ---------------------------------------------------------------------------------------------
# the app: manifest, registry, component files
# ---------------------------------------------------------------------------------------------

class App:
    def __init__(self, app_id, root):
        self.id = app_id
        self.root = root
        self.src = root / 'src'
        self.manifest = self._manifest()
        self.pages = self.manifest.get('pages') or []
        self.registry = self._registry()
        self.admin_root = self._admin_root()
        self._cn_cache = {}

    def _manifest(self):
        base = load_json(self.src / 'manifest.json') if (self.src / 'manifest.json').is_file() else {}
        pages = list(base.get('pages') or [])
        frags = []
        d = self.src / 'manifest.d'
        if d.is_dir():
            for f in sorted(d.glob('*.json')):
                frag = load_json(f)
                for p in frag.get('pages') or []:
                    p = dict(p)
                    p['_fragment'] = 'src/manifest.d/' + f.name
                    pages.append(p)
                frags.append('src/manifest.d/' + f.name)
        base['pages'] = pages
        base['_fragments'] = frags
        return base

    def _registry(self):
        """registry key -> {'file': path, 'name': component identifier}."""
        s = read(self.src / 'registry.js')
        imports = {m.group(1): m.group(2) for m in re.finditer(r"^import\s+(\w+)\s+from\s+'(\./[^']+\.vue)'", s, re.M)}
        out = {}
        body = s.split('const registry = {', 1)[-1]
        for m in re.finditer(r"^\t'?([\w-]+)'?:\s*\{\n(.*?)\n\t\},?$", body, re.M | re.S):
            r = re.search(r'\b(?:component|renderer):\s*(\w+)', m.group(2))
            if r and r.group(1) in imports:
                out[m.group(1)] = {'name': r.group(1), 'file': (self.src / imports[r.group(1)]).resolve()}
        return out

    def _admin_root(self):
        s = read(self.src / 'settings.js')
        m = re.search(r"^import\s+(\w+)\s+from\s+'(\./[^']+\.vue)'", s, re.M)
        return {'name': m.group(1), 'file': (self.src / m.group(2)).resolve()} if m else None

    def cn_imports(self, file, depth=2):
        """Cn components a .vue file imports from nextcloud-vue, following local .vue imports."""
        key = (str(file), depth)
        if key in self._cn_cache:
            return self._cn_cache[key]
        cn, local = [], []
        s = read(file)
        for m in re.finditer(r"^import\s+\{([^}]*)\}\s+from\s+'@conduction/nextcloud-vue[^']*'", s, re.M):
            cn += re.findall(r'\b(Cn[A-Za-z0-9]+)\b', m.group(1))
        for m in re.finditer(r"^import\s+(Cn\w+)\s+from\s+'[^']*nextcloud-vue[^']*'", s, re.M):
            cn.append(m.group(1))
        if depth > 0:
            for m in re.finditer(r"^import\s+(\w+)\s+from\s+'(\.{1,2}/[^']+\.vue)'", s, re.M):
                sub = (file.parent / m.group(2)).resolve()
                if sub.is_file():
                    local.append(m.group(1))
                    c2, l2 = self.cn_imports(sub, depth - 1)
                    cn += c2
                    local += l2
        res = (list(OrderedDict.fromkeys(cn)), list(OrderedDict.fromkeys(local)))
        self._cn_cache[key] = res
        return res

    def rel(self, file):
        try:
            return str(file.relative_to(self.root))
        except ValueError:
            return str(file)


# ---------------------------------------------------------------------------------------------
# route -> page
# ---------------------------------------------------------------------------------------------

def split_route(route):
    """'/apps/dossiq/cases?x=1#frag' -> ('/cases', {'x': '1'}, 'frag')."""
    frag = ''
    if '#' in route:
        route, frag = route.split('#', 1)
    query = {}
    if '?' in route:
        route, qs = route.split('?', 1)
        for part in qs.split('&'):
            if '=' in part:
                k, v = part.split('=', 1)
                query[k] = v
            elif part:
                query[part] = ''
    route = re.sub(r'^/index\.php', '', route)
    route = re.sub(r'^/apps/[^/]+', '', route) or '/'
    if len(route) > 1:
        route = route.rstrip('/')
    return route, query, frag


def route_regex(pattern):
    parts = []
    for seg in pattern.strip('/').split('/'):
        if not seg:
            continue
        parts.append('[^/]+' if seg.startswith(':') else re.escape(seg))
    return re.compile('^/' + '/'.join(parts) + '$') if parts else re.compile('^/$')


def match_page(pages, path):
    best, score = None, -1
    for p in pages:
        r = p.get('route')
        if not isinstance(r, str) or not route_regex(r).match(path):
            continue
        literal = sum(len(s) for s in r.split('/') if s and not s.startswith(':'))
        if literal > score:
            best, score = p, literal
    return best


# ---------------------------------------------------------------------------------------------
# what a page renders
# ---------------------------------------------------------------------------------------------

def iter_widgets(page):
    """Every widget definition a page carries, with where it sits."""
    cfg = page.get('config') or {}
    for w in page.get('widgets') or []:
        yield w, 'page widgets'
    for w in cfg.get('widgets') or []:
        yield w, 'config.widgets'
    for w in cfg.get('kpiRow') or []:
        if isinstance(w, dict):
            yield w, 'config.kpiRow'
    for uw in cfg.get('userWidgets') or []:
        if isinstance(uw, dict) and isinstance(uw.get('widget'), dict):
            yield uw['widget'], 'config.userWidgets'
    for v in cfg.get('views') or []:
        for w in (v.get('widgets') or []) if isinstance(v, dict) else []:
            yield w, 'config.views.' + str(v.get('id', '?'))
    sidebar = cfg.get('sidebar')
    if isinstance(sidebar, dict):
        for tab in sidebar.get('tabs') or []:
            if not isinstance(tab, dict):
                continue
            for w in tab.get('widgets') or []:
                yield w, 'sidebar tab ' + str(tab.get('id', '?'))
            if tab.get('type'):
                yield {'type': '__tab', 'tab': tab['type'], 'id': tab.get('id')}, 'sidebar tab ' + str(tab.get('id', '?'))
            if tab.get('component'):
                yield {'type': '__component', 'component': tab['component'], 'id': tab.get('id')}, 'sidebar tab ' + str(tab.get('id', '?'))
    # nested widgets (tabs, container, sections)
    for w, where in list(iter_widgets_nested(page)):
        yield w, where


def iter_widgets_nested(page):
    cfg = page.get('config') or {}
    stack = [(w, 'config.widgets') for w in cfg.get('widgets') or []]
    while stack:
        w, where = stack.pop()
        if not isinstance(w, dict):
            continue
        content = w.get('content') if isinstance(w.get('content'), dict) else {}
        for key in ('widgets', 'tabs', 'sections', 'items'):
            for child in content.get(key) or []:
                if isinstance(child, dict):
                    for grand in child.get('widgets') or []:
                        yield grand, where + ' > ' + str(w.get('id', w.get('type')))
                        stack.append((grand, where))
                    if child.get('type') and (child.get('content') or child.get('widgetId')):
                        yield child, where + ' > ' + str(w.get('id', w.get('type')))


class Resolver:
    def __init__(self, vue, app):
        self.vue = vue
        self.app = app

    def render(self, page, query, frag, kind):
        comps = OrderedDict()   # Cn name -> how it gets there
        local = OrderedDict()   # app component -> how
        unresolved = []

        def add(name, via):
            if name and name not in comps:
                comps[name] = via

        def add_app(entry, via):
            """An app component from the registry: itself plus the Cn components it imports."""
            if not entry:
                return
            f = entry['file']
            label = entry['name']
            if label not in local:
                local[label] = via + ' (' + self.app.rel(f) + ')'
            cn, sub = self.app.cn_imports(f)
            for c in cn:
                add(c, via + ' via ' + label)
            for s in sub:
                local.setdefault(s, 'inside ' + label)

        cfg = page.get('config') or {}
        ptype = page.get('type')
        add('CnAppNav', 'app chrome (CnAppRoot)')
        if frag == 'user-settings':
            add('CnUserSettingsDialog', 'opened by #user-settings (CnAppRoot)')

        body_widgets = [w for w in page.get('widgets') or [] if isinstance(w, dict) and (w.get('slot') or 'body') == 'body']
        if ptype == 'custom':
            add_app(self.app.registry.get(page.get('component')), 'custom page component ' + str(page.get('component')))
            if page.get('component') and page.get('component') not in self.app.registry:
                unresolved.append('custom page component ' + str(page.get('component')) + ' is not in src/registry.js')
        elif body_widgets:
            add('CnWidgetGrid', 'page-level widgets[] for the body slot (CnPageRenderer skips the typed page component)')
        else:
            pc = self.vue.page_types.get(ptype)
            if pc:
                add(pc, 'page type ' + str(ptype))
                mode = self.index_mode(cfg, query)
                ctx = {'mode': mode, 'kind': kind}
                for child in self.vue.children(pc):
                    if child in SKIP_CHILDREN or child in WIDGET_ONLY_CHILDREN:
                        continue
                    rule = CHILD_RULES.get((ptype, child))
                    if rule is not None:
                        ok = bool(rule(cfg, page, ctx))
                        why = 'from its config' if ok else None
                    elif DIALOG_RE.search(child):
                        ok = kind == 'dialog'
                        why = 'a dialog of ' + pc
                    else:
                        ok = True
                        why = 'mounted by ' + pc
                    if ok:
                        add(child, why if why != 'from its config' else 'mounted by ' + pc + ' from its config')
                if ptype == 'index' and mode:
                    comps[pc] = 'page type index, view mode ' + mode
            elif ptype:
                unresolved.append('page type ' + str(ptype) + ' has no component in pageTypes.js')

        sidebar = cfg.get('sidebar')
        if isinstance(sidebar, dict) and sidebar.get('enabled', True) and ptype == 'detail':
            add('CnObjectSidebar', 'config.sidebar (CnAppRoot)')
            if (sidebar.get('tabs') or []):
                add('CnTabs', 'config.sidebar.tabs')

        for w, where in iter_widgets(page):
            if not isinstance(w, dict):
                continue
            wtype = w.get('type')
            wid = str(w.get('id') or w.get('widgetId') or '?')
            if wtype == '__tab':
                tab = SIDEBAR_TABS.get(w.get('tab'))
                if tab and self.vue.component_file(tab):
                    add(tab, where + ' type ' + str(w.get('tab')) + ' (CnObjectSidebar)')
                continue
            if wtype == '__component':
                add_app(self.app.registry.get(w.get('component')), where + ' component ' + str(w.get('component')))
                continue
            if not wtype:
                continue
            if wtype == 'custom':
                slots = page.get('slots') or {}
                slot = slots.get(wid) or slots.get('widget-' + wid)
                if slot and slot in self.app.registry:
                    add_app(self.app.registry[slot], 'custom widget ' + wid + ' through slot ' + slot)
                elif wtype in self.app.registry:
                    add_app(self.app.registry[wtype], 'custom widget ' + wid)
                else:
                    unresolved.append('custom widget ' + wid + ' (' + where + ') names no slot or registry entry')
                continue
            if wtype in self.app.registry:
                add_app(self.app.registry[wtype], 'widget ' + wtype + ' ' + wid + ' (app registry)')
                continue
            if wtype == 'integration':
                add('CnIntegrationWidget', 'widget integration ' + wid)
                continue
            r = self.vue.widget_renderer(wtype)
            if not r and where.startswith('sidebar tab') and wtype in SIDEBAR_TABS:
                r = SIDEBAR_TABS[wtype]
            if r:
                add(r, 'widget ' + wtype + ' (' + where + ')')
            else:
                unresolved.append('widget type ' + wtype + ' (' + wid + ', ' + where + ') resolves nowhere')

        for slot, name in (page.get('slots') or {}).items():
            if isinstance(name, str):
                add_app(self.app.registry.get(name), 'slot ' + slot + ' ' + name)
                if name not in self.app.registry:
                    unresolved.append('slot ' + slot + ' names ' + name + ', not in src/registry.js')
        for key in ('actionsComponent', 'sidebarComponent'):
            name = page.get(key)
            if name:
                add_app(self.app.registry.get(name), key + ' ' + name)
                if name not in self.app.registry:
                    unresolved.append(key + ' names ' + name + ', not in src/registry.js')
        return comps, local, unresolved

    def render_admin(self, query):
        comps, local = OrderedDict(), OrderedDict()
        root = self.app.admin_root
        if not root:
            return comps, local, ['no src/settings.js admin root']
        local[root['name']] = 'admin settings root (' + self.app.rel(root['file']) + ')'
        cn, sub = self.app.cn_imports(root['file'])
        for c in cn:
            comps[c] = 'imported by ' + root['name']
        for c in self.vue.children('CnAdminSettingsShell') if 'CnAdminSettingsShell' in cn else []:
            if c not in SKIP_CHILDREN and not DIALOG_RE.search(c):
                comps.setdefault(c, 'mounted by CnAdminSettingsShell')
        for s in sub:
            local.setdefault(s, 'inside ' + root['name'])
        return comps, local, []

    @staticmethod
    def index_mode(cfg, query):
        modes = cfg.get('viewModes') if isinstance(cfg.get('viewModes'), list) else None
        q = query.get('_view') or query.get('view')
        if q and (not modes or q in modes or q in INDEX_MODE_CHILD):
            return q
        if cfg.get('defaultView') in INDEX_MODE_CHILD:
            return cfg['defaultView']
        if modes:
            return modes[0]
        return 'table'


# ---------------------------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--apps-dir', type=pathlib.Path, default=REPO.parent, help='directory with the app and nextcloud-vue checkouts')
    ap.add_argument('--app', action='append', help='app id to read (repeatable); default: every app with a checkout')
    ap.add_argument('--out', type=pathlib.Path, default=OUT)
    args = ap.parse_args()

    vue_dir = find_dir(args.apps_dir, VUE_DIRS)
    if not vue_dir:
        sys.exit('nextcloud-vue checkout not found under ' + str(args.apps_dir))
    vue = Vue(vue_dir)
    if not vue.page_types:
        sys.exit('no page types read from ' + str(vue_dir))

    status = load_json(SCREENS / 'build-status.json') if (SCREENS / 'build-status.json').is_file() else {'boards': {}}
    screens = load_json(SCREENS / 'screens.json') if (SCREENS / 'screens.json').is_file() else {'boards': {}}
    ids = {name: (b.get('id') or name) for name, b in (screens.get('boards') or {}).items()}

    wanted = args.app or sorted({b.get('app') for b in status['boards'].values() if b.get('app')})
    out_screens = {}
    apps_out = {}
    sources = {'nextcloud-vue': git_info(vue_dir)}
    for app_id in wanted:
        root = find_dir(args.apps_dir, APP_DIRS.get(app_id, [app_id]))
        if not root or not (root / 'src' / 'manifest.json').is_file():
            print('skip %s: no checkout with src/manifest.json under %s' % (app_id, args.apps_dir), file=sys.stderr)
            continue
        app = App(app_id, root)
        sources[app_id] = git_info(root)
        sources[app_id]['manifest'] = ['src/manifest.json'] + app.manifest['_fragments']
        res = Resolver(vue, app)
        counts = {'boards': 0, 'resolved': 0, 'noRoute': 0, 'noPage': 0}
        for name, row in sorted(status['boards'].items()):
            if row.get('app') != app_id:
                continue
            counts['boards'] += 1
            entry = {'board': name, 'app': app_id, 'kind': row.get('kind'), 'route': row.get('route'),
                     'page': None, 'components': [], 'via': {}, 'appComponents': {}, 'unresolved': [], 'reason': None}
            route = row.get('route')
            if not route:
                entry['reason'] = 'no route'
                counts['noRoute'] += 1
            else:
                path, query, frag = split_route(route)
                if route.startswith('/settings/admin/'):
                    comps, local, unresolved = res.render_admin(query)
                    entry['page'] = {'id': 'admin-settings', 'type': 'admin-settings',
                                     'component': app.admin_root['name'] if app.admin_root else None,
                                     'source': 'src/settings.js'}
                    counts['resolved'] += 1
                else:
                    page = match_page(app.pages, path)
                    if not page:
                        entry['reason'] = 'no page matches ' + path
                        counts['noPage'] += 1
                        comps, local, unresolved = OrderedDict(), OrderedDict(), []
                    else:
                        comps, local, unresolved = res.render(page, query, frag, row.get('kind'))
                        pc = vue.page_types.get(page.get('type'))
                        entry['page'] = {'id': page.get('id'), 'type': page.get('type'), 'route': page.get('route'),
                                         'component': page.get('component') if page.get('type') == 'custom' else pc,
                                         'source': page.get('_fragment', 'src/manifest.json')}
                        if query:
                            entry['query'] = query
                        counts['resolved'] += 1
                entry['components'] = list(comps.keys())
                entry['via'] = dict(comps)
                entry['appComponents'] = dict(local)
                entry['unresolved'] = unresolved
            out_screens[ids.get(name, app_id + '/' + name)] = entry
        apps_out[app_id] = counts
        print('%s: %d boards, %d resolved, %d without route, %d without page' % (
            app_id, counts['boards'], counts['resolved'], counts['noRoute'], counts['noPage']))

    # reverse index: component -> screens that render it in the app
    by_comp = {}
    for sid, e in out_screens.items():
        for c in e['components']:
            by_comp.setdefault(c, []).append(sid)
    components = {c: {'name': c, 'source': vue.source_url(c), 'screens': sorted(v)} for c, v in sorted(by_comp.items())}

    out = {
        'generated': datetime.date.today().isoformat(),
        'sources': sources,
        'how': 'Each board\'s live route (build-status.json) is matched to a page in the app manifest; the page type, its '
               'config and its widgets are mapped to nextcloud-vue components through pageTypes.js, the page component\'s '
               'registered children and the widget catalogue (scripts/screens/app_components.py).',
        'pageTypes': vue.page_types,
        'apps': apps_out,
        'components': components,
        'screens': out_screens,
    }
    args.out.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print('wrote', args.out, '(%d screens, %d components)' % (len(out_screens), len(components)))


if __name__ == '__main__':
    main()
