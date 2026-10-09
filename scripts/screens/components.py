#!/usr/bin/env python3
"""Build preview/screens/components.json: which components each screen is built from.

    python3 scripts/screens/components.py                 # catalogue plus mapping
    python3 scripts/screens/components.py --report        # also print the lane report to stdout

Two parts.

1. Catalogue. Every component of the two libraries the screens are built from, read at
   origin/development of the local checkouts next to this repo (read only, `git show`):
   - nextcloud-vue (`../nextcloud-vue`): every `Cn*` folder in `src/components/`, the `Cn*`
     sub-components inside those folders, `src/dialogs/Cn*` and the public site components in
     `src/public/components/`. The purpose sentence is the first paragraph of the component's
     docs page (`docs/components/cn-<name>.md`), else its docblock.
   - portaliq (`../portaliq`): the site widgets in `src/site/widgets/*` and the site components in
     `src/site/components/**` (the citizen and school website screens are built from these, not
     from nextcloud-vue). Keys are prefixed `portaliq:`.
2. Mapping. For every board in screens.json, pattern detection on the board's own source
   (`screens-src/<set>/<Name>.dc.html`, with its `dc-import` parts mapped through IMPORTS) decides
   which components the drawn screen uses. What the rules cannot see is corrected per board in
   `screens-src/components-overrides.json`:

       { "boards": { "dossiq/DqZaken": { "add": ["CnSavedViewsControl"], "remove": ["CnCard"],
                                          "patterns": ["index-list"], "note": "why" } } }

   `add` and `remove` take component keys, `set` replaces the list entirely, `patterns` replaces
   the detected patterns, `note` is shown with the screen.

Reads screens.json, never writes it. Idempotent: the output is rewritten from the sources.
"""
import argparse
import datetime
import fnmatch
import json
import pathlib
import re
import subprocess
import sys
from collections import Counter, defaultdict

REPO = pathlib.Path(__file__).resolve().parents[2]
APPS_EXTRA = REPO.parent
SCREENS = REPO / 'preview' / 'screens'
SRC = REPO / 'screens-src'
OVERRIDES = SRC / 'components-overrides.json'
OUT = SCREENS / 'components.json'

VUE_DIR = 'nextcloud-vue'
VUE_GH = 'https://github.com/ConductionNL/nextcloud-vue/blob/development/'
VUE_DOCS = 'https://nextcloud-vue.conduction.nl/docs/components/'
PQ_DIR = 'portaliq'
PQ_GH = 'https://github.com/ConductionNL/portaliq/blob/development/'
REF = 'origin/development'
PQ = 'portaliq:'

FAMILIES = ['list', 'detail', 'dialog', 'dashboard', 'nav', 'form', 'kanban', 'chrome', 'widget',
            'site-widget', 'other']


# ---------------------------------------------------------------------------------------------
# git helpers (read only, other repositories)
# ---------------------------------------------------------------------------------------------

class Tree:
    """Read files of a checkout at a ref without touching its working tree."""

    def __init__(self, path):
        self.path = path
        self.ref = REF
        if not self._ok(['git', 'rev-parse', '--verify', '-q', REF]):
            self.ref = 'HEAD'
        self.sha = self._run(['git', 'rev-parse', self.ref]).strip()
        self.files = self._run(['git', 'ls-tree', '-r', '--name-only', self.ref]).splitlines()
        self._cache = {}

    def _run(self, cmd):
        return subprocess.run(cmd, cwd=self.path, capture_output=True, text=True, check=True).stdout

    def _ok(self, cmd):
        return subprocess.run(cmd, cwd=self.path, capture_output=True).returncode == 0

    def show(self, rel):
        if rel not in self._cache:
            try:
                self._cache[rel] = self._run(['git', 'show', f'{self.ref}:{rel}'])
            except subprocess.CalledProcessError:
                self._cache[rel] = ''
        return self._cache[rel]


def kebab(name):
    return re.sub(r'(?<=[a-z0-9])(?=[A-Z])', '-', name).lower()


def clean_md(text):
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'[*_`]', '', text)
    text = re.sub(r'\s*(—|–| -- )\s*', ', ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\s+,', ',', text)
    return re.sub(r'^(Cn\w+|[A-Z]\w+), (?=[a-z])', '', text)


def first_sentence(text, limit=240):
    text = clean_md(text)
    m = re.match(r'(.+?[.!?])(\s|$)', text)
    out = m.group(1) if m else text
    if len(out) > limit:
        out = out[:limit].rsplit(' ', 1)[0] + '...'
    return out


def docs_intro(md, name):
    """First prose paragraph after `# Name` in a docs page."""
    lines = md.splitlines()
    try:
        start = next(i for i, ln in enumerate(lines) if ln.strip() == f'# {name}')
    except StopIteration:
        start = 0
    para = []
    for ln in lines[start + 1:]:
        s = ln.strip()
        if not s:
            if para:
                break
            continue
        if s.startswith(('#', '```', 'import ', '<', '!', '|', '>', '---', ':::')) or s.startswith('**Wraps'):
            if para:
                break
            continue
        para.append(s)
    return ' '.join(para)


def vue_docblock(src, name):
    """The docblock directly above `export default`, else the first one naming the component."""
    script = src.split('<script', 1)[-1]
    blocks = [b for b in re.finditer(r'/\*\*(.*?)\*/', script, re.S) if 'SPDX' not in b.group(1)]
    pick = None
    exp = script.find('export default')
    for b in blocks:
        if exp >= 0 and b.end() <= exp and not script[b.end():exp].strip().startswith(('const', 'let', 'function', 'import')):
            pick = b
    if pick is None:
        pick = next((b for b in blocks if name in b.group(1)), None)
    if pick is None:
        return ''
    body = []
    for ln in pick.group(1).splitlines():
        s = re.sub(r'^\s*\*\s?', '', ln).rstrip()
        if s.strip().startswith('@'):
            break
        body.append(s)
    text = ' '.join(x.strip() for x in body).strip()
    return text


# Families for nextcloud-vue components, first match wins.
FAMILY_RULES = [
    (r'WidgetForm$|FormRenderer$|WidgetEditCog|WidgetStyleEditor|WidgetVisibility|NcDashboardWidgetForm', 'widget'),
    (r'^CnSite', 'site-widget'),
    (r'Kanban|BoardView', 'kanban'),
    (r'Dialog$|Modal$|Wizard|^CnCopyDialog|^CnSupportDialog', 'dialog'),
    (r'^Cn(AppNav|Breadcrumbs|FolderTree|FolderSidebar|TreeView|TreeNode|MenuTree|PageTree|IndexSidebar|NavCardGrid|CommandPalette|Tabs$|Tab$)', 'nav'),
    (r'^Cn(AppRoot|AppLoading|PageHeader|BrandStripe|BuildiqEditButton|UserActionMenu|DependencyMissing|TenantBadge|Walkthrough|LockedBanner|LockIndicator|FeaturesAndRoadmap|AiCompanion|AiFloatingButton|PresenceAvatars|FederationStatus|OfflineQueue|PageRenderer|LeafMountHost)', 'chrome'),
    (r'^Cn(DataTable|IndexPage|Pagination|FacetSidebar|FilterBar|QuickFilterBar|ActionsBar|MassActionBar|RowActions|ObjectList$|ObjectRow|CardGrid|Card$|ItemCard|SavedViews|CellRenderer|FkResolveCell|ColumnFilter|DataMatrix|SummaryAggregates|ContextMenu|ActionsMenu|ActionButtons|SearchPage|StorePage|LinkCardsPage|CapabilityTable)', 'list'),
    (r'^Cn(Dashboard|KpiGrid|StatsBlock|StatsPanel|DashTile|StatWidget|ChartWidget|GaugeWidget|DeltaWidget|WidgetGrid|WidgetWrapper|WidgetRenderer|WidgetCardGrid|ReportsPage|SpendAnalytics|StackedBar|GuardianHome)', 'dashboard'),
    (r'Widget', 'widget'),
    (r'^Cn(DetailPage|DetailCard|DetailGrid|DetailWidgetHost|ObjectSidebar|AuditTrail|VersionHistory|TimelineStages|TimelineView|NextStepCard|NotesCard|NoteCard|TasksCard|TagsCard|FilesCard|RelatedFiles|RelatedCollections|LifecycleActions|ObjectCard|ObjectAccessTab|ObjectMetadata|StatusBadge|ProgressBar|JsonViewer|RelationshipGraph|ReferencePreview|BodySections|FilesTab|NotesTab|TagsTab|TasksTab|AuditTrailTab|ConversationThread|ChatPage|DocumentReviewList|StructuredDocReview|TranslatedBadge|VersionInfoCard|IntegrationTab|FeaturesTab|RoadmapTab|RoadmapItem)', 'detail'),
    (r'^Cn(Settings|AdminSettings|AdminActionCard|ConfigurationCard|RegisterMapping|NotificationMatrix|NotificationPreferences|LeafDependencySettings|Credentials|ThemePreview)', 'form'),
    (r'Field|Picker|Select|Editor|FormBuilder|FormPage|Create$|ColorPicker|DateRange|Cron|Signature|ChoiceCards|SegmentedControl|Helper|FormWidgetBase|PropertyValueCell|Tab$', 'form'),
    (r'^Cn(FileManager|FilesBrowser|FilesPage|FlowsPage|FlowDetail|Flow|GraphCanvas|MapPage|LogsPage|WikiPage|ObjectCalendar|DateAxisView|IntegrationCard)', 'detail'),
]

# Hand-written purpose sentences where neither the docs page nor a docblock gives one.
PURPOSE_FALLBACK = {
    'CnActionsMenu': 'The shared overflow menu: Refresh, Documentation and Request a feature, plus the page\'s own items in its slot.',
    'CnActionButtons': 'Renders a page\'s declared header actions as buttons (create form, toggle, API call, navigate); CnDetailPage and CnDashboardPage mount it.',
    'CnFilesWidgetDeleteDialog': 'Confirms deleting one file from the files widget.',
    'CnFlowPublishDialog': 'Publishes the current version of a flow.',
    'CnFlowSettingsModal': 'Edits the settings of a flow.',
    'CnFlowStepPickerModal': 'Picks a step to add to a flow, from a searchable list.',
    'NcSelectTags': 'A Nextcloud system-tag multiselect, a thin wrapper over NcSelect for picking tags.',
    'portaliq:BrandHeader': 'The site header: the organisation logo, the site name, the search field and the sign-in link.',
    'portaliq:SiteMenu': 'The site\'s main navigation bar under the header.',
    'portaliq:FooterColumns': 'The site footer: link columns, contact details and the legal links.',
    'portaliq:ResidentMenu': 'The signed-in resident\'s menu (Mijn omgeving navigation): overview, cases, messages, tasks, details.',
    'portaliq:HeroBlock': 'The hero band at the top of a site page: title, lead, calls to action and an optional aside list or search.',
    'portaliq:WidgetGrid': 'The grid that lays out the blocks of a site page or a Mijn page.',
    'portaliq:AccountArea': 'The signed-in account area of the site header: name, acting-for and sign out.',
    'portaliq:SiteNotices': 'The site-wide notices band (maintenance, outage) above the page.',
    'portaliq:SiteNavigationBlock': 'A navigation block of a site page: a section\'s pages as a link list.',
    'portaliq:FormBlock': 'A multi-step form on a site page, rendered from the form definition.',
    'portaliq:MarkdownBlock': 'A rich text block of a content page.',
    'portaliq:FederatedSearchBlock': 'The site search: one query over pages, products, publications and news, with result groups.',
    'portaliq:PublicationDetailBlock': 'The detail of one published document (Woo publication): metadata, files and related items.',
    'portaliq:IntakeCatalogueBlock': 'The catalogue of request forms a resident can start, grouped by subject.',
    'portaliq:IntakeFormBlock': 'An intake form for a request, a report or a complaint.',
    'portaliq:IntakeStatusBlock': 'The status of a submitted intake, with its reference and next steps.',
    'portaliq:WaysIn': 'The sign-in ways of a portal (DigiD, eHerkenning, eIDAS, account), each as a link.',
    'portaliq:WayInLink': 'One sign-in way as a button-like link.',
    'portaliq:IdleWarningDialog': 'The dialog that warns a signed-in resident that the session is about to expire.',
    'portaliq:SaveToDossier': 'Saves the current item to one of the resident\'s dossiers.',
    'portaliq:SharedDossierPage': 'A dossier shared with a guest through a link: its items, read only.',
    'portaliq:SiteEditButton': 'The edit button an editor sees on a site page, opening the page editor.',
    'portaliq:BranchSwitcher': 'Switches between the branches (locations) of an organisation on the site.',
    'portaliq:ContributionsBlock': 'Lists the items an app contributes to the Mijn omgeving for the resident.',
    'portaliq:SaveSearch': 'Saves the current search so the resident gets notified of new results.',
    'portaliq:CalendarBlock': 'An agenda block: upcoming dates as date tiles with title and meta.',
    'portaliq:CollectionTable': 'A table of the resident\'s records from one collection, with columns, sorting and paging.',
    'portaliq:DetailCard': 'A card with the fields of one record as a description list.',
    'portaliq:ItemList': 'A list of records from one collection, as rows with a title, meta and a link.',
    'portaliq:KpiCards': 'Figure cards from one record row: label, value, unit and an optional highlight.',
    'portaliq:NewsBlock': 'A news block: the latest items with date, title and an optional lead item with image.',
    'portaliq:RichTextBlock': 'A rich text block fed from a record field.',
    'portaliq:SlotHost': 'Hosts a block contributed by another app in a named slot of a site page.',
    'portaliq:TimelineList': 'A dated list of events for one record, newest first.',
    'portaliq:CaseCard': 'A case as a folder-shaped card: title, status, reference, last change and the next step.',
    'portaliq:CasesBlock': 'The resident\'s cases as case cards with a link to all cases.',
    'portaliq:ContactTimeline': 'The contact history with the organisation: messages, calls and visits as a timeline.',
    'portaliq:DocumentsBlock': 'The documents of a case or of the resident, with type, date and download.',
    'portaliq:InboxBlock': 'The latest messages in the resident\'s inbox, unread first.',
    'portaliq:TasksBlock': 'The resident\'s open tasks with their deadline and a link to finish each one.',
    'portaliq:ProcessSteps': 'The steps of a case or a request as a vertical stepper with the current step marked.',
    'portaliq:QuickTiles': 'A row of tiles that each open a page or a site route (quick tasks).',
    'portaliq:GreetingBlock': 'The greeting at the top of the Mijn omgeving with the resident\'s name and a short status.',
    'portaliq:MijnHome': 'The Mijn omgeving home page: greeting, quick tiles, tasks, cases and messages.',
    'portaliq:TimetableDay': 'One school day of a timetable: lessons as rows with time, subject, room and teacher.',
    'portaliq:GradeBars': 'Grades as horizontal bars per subject.',
    'portaliq:MarkChips': 'Recent marks as small chips with the subject and the mark.',
    'portaliq:ProgressCards': 'Progress per item (module, course, training) as cards with a progress bar.',
    'portaliq:SegmentedFigure': 'A figure split into coloured segments, such as attendance or credits.',
    'portaliq:CalendarTiles': 'Upcoming dates as compact calendar tiles.',
    'portaliq:DateTile': 'One date as a day and month tile.',
    'portaliq:DateRows': 'Dates as rows with a date tile, title and meta.',
    'portaliq:DescriptionList': 'Label and value pairs of a record.',
    'portaliq:ActingForBar': 'The bar that shows on whose behalf the resident acts (a child, a company), with a switch.',
    'portaliq:RecordSwitcher': 'Switches between the records the resident may see, such as the children of a parent.',
    'portaliq:StepsBlock': 'A numbered how-it-works list of steps.',
    'portaliq:TimelineBlock': 'A dated timeline of events of a record.',
    'portaliq:EmptyState': 'The empty state of a Mijn block: icon, one line and an optional action.',
    'portaliq:ActionRow': 'One row with a label, meta and an action link, used in Mijn blocks.',
    'portaliq:FileItem': 'One file with its type icon, name, size and download.',
    'portaliq:DataBadge': 'A small badge with a status or a count.',
    'portaliq:LoadError': 'The error state of a Mijn block when its data could not load.',
    'portaliq:Skeleton': 'The loading placeholder of a Mijn block.',
    'portaliq:FormProgress': 'The progress of a multi-step form: the steps with the current one marked.',
    'portaliq:ReviewList': 'The review step of a form: every answer with a change link.',
    'portaliq:ErrorSummary': 'The error summary at the top of a form step, linking to each field in error.',
    'portaliq:FieldShell': 'The shell of a form field: label, optional marker, description, error and input.',
    'portaliq:FileUpload': 'A file upload field with a drop zone and the list of uploaded files.',
    'portaliq:ChoiceCards': 'Radio or checkbox choices drawn as cards.',
    'portaliq:CountStepper': 'A number field with minus and plus buttons.',
    'portaliq:DateChoices': 'A choice of dates and time slots for an appointment.',
    'portaliq:DateInputGroup': 'A date field as three inputs: day, month and year.',
    'portaliq:LabelSuffix': 'The "(optional)" suffix of a field label.',
    'portaliq:CitizenCase': 'The case page for a resident: status, steps, documents, messages and actions.',
    'portaliq:CaseField': 'One field of a resident\'s case shown on the case page.',
    'portaliq:AddressList': 'The resident\'s addresses as a list with the registered one marked.',
    'portaliq:ContactPrompt': 'A prompt to contact the organisation, with the ways to reach it.',
    'portaliq:InvitationCodeForm': 'The form to redeem an invitation code for an account.',
    'portaliq:ActingForSwitcher': 'Switches on whose behalf the resident acts (authorisation, a company, a child).',
    'portaliq:InstallBanner': 'A banner that offers to install the portal as an app on the device.',
    'portaliq:HeaderTools': 'The tools in the site header: language, search and the sign-in or account button.',
    'portaliq:SignInPage': 'The sign-in page with the portal\'s sign-in ways.',
    'portaliq:ActionBlock': 'A block of actions a resident can take on a record.',
    'portaliq:ActionButton': 'One action of a record as a button.',
    'portaliq:AttachedActions': 'The actions attached to a record, rendered as buttons.',
    'portaliq:ProposalQueue': 'The queue of change proposals a resident made, with their state.',
    'portaliq:ProposeChangeForm': 'The form to propose a change to a record (a case, a detail).',
    'portaliq:RowActionDialog': 'The dialog of a row action on a Mijn table.',
    'portaliq:SchemaField': 'One form field rendered from a JSON schema property.',
    'portaliq:SchemaForm': 'A form rendered from a JSON schema.',
    'portaliq:BusyStatus': 'The busy indicator of the inbox while messages load or send.',
    'portaliq:MessageLanguagePicker': 'Picks the language a message is shown in.',
    'portaliq:NewsItem': 'One news item in the inbox.',
    'portaliq:NewsletterArchive': 'The archive of newsletters a resident received.',
    'portaliq:NotificationSettings': 'The resident\'s notification settings: which messages by which channel.',
    'portaliq:TranslatedText': 'A message text with its machine translation and the original.',
    'portaliq:TimedTaskItem': 'One timed task with its deadline countdown.',
    'portaliq:TimedTaskView': 'The page of one timed task.',
    'portaliq:DeclineDialog': 'The dialog to decline a request or an invitation, with a reason.',
    'portaliq:RowActionConfirm': 'The confirmation of a row action on a Mijn table.',
    'portaliq:SigningDialog': 'The dialog to sign a document.',
    'portaliq:WithdrawCaseConfirm': 'The confirmation to withdraw a case.',
    'portaliq:GuestActionPage': 'The page a guest opens through a link to do one action without an account.',
    'portaliq:PlaceholderPage': 'A placeholder page for a route that is not built yet.',
    'portaliq:ContributionPage': 'A Mijn page contributed by another app, built from its blocks.',
    'portaliq:AccessRequestsPage': 'The page with access requests to the resident\'s data and their decisions.',
    'portaliq:AccountPage': 'The resident\'s account page: sign-in ways, contact details and preferences.',
    'portaliq:MyCasesPage': 'The resident\'s cases page: case cards or a table, with filters.',
    'portaliq:RegisteredDetailsPage': 'The resident\'s registered personal details (from the BRP) with a way to report a mistake.',
    'portaliq:InboxPage': 'The inbox page: messages, news and tasks in one list.',
    'portaliq:MessagesPage': 'The messages page: the resident\'s conversations with the organisation.',
    'portaliq:NewsPage': 'The news page of the Mijn omgeving.',
    'portaliq:TasksPage': 'The tasks page: everything the resident still has to do.',
}

PQ_FAMILY = {
    'BrandHeader': 'chrome', 'SiteMenu': 'nav', 'FooterColumns': 'chrome', 'ResidentMenu': 'nav',
    'HeaderTools': 'chrome', 'AccountArea': 'chrome', 'SiteNotices': 'chrome', 'BranchSwitcher': 'nav',
    'ActingForBar': 'chrome', 'ActingForSwitcher': 'chrome', 'RecordSwitcher': 'nav', 'SiteEditButton': 'chrome',
    'IdleWarningDialog': 'dialog', 'DeclineDialog': 'dialog', 'RowActionConfirm': 'dialog',
    'SigningDialog': 'dialog', 'WithdrawCaseConfirm': 'dialog', 'RowActionDialog': 'dialog',
}


def vue_family(name):
    for pat, fam in FAMILY_RULES:
        if re.search(pat, name):
            return fam
    return 'other'


def catalogue_vue(tree):
    comps = {}
    files = tree.files
    docs = {f.rsplit('/', 1)[1][:-3]: f for f in files if f.startswith('docs/components/') and f.endswith('.md')
            and '/_generated/' not in f}
    entries = []
    for f in files:
        m = re.fullmatch(r'src/components/(\w+)/(\w+)\.vue', f)
        if m and (m.group(2).startswith('Cn') or m.group(2) == m.group(1)):
            entries.append((m.group(2), f, 'component' if m.group(1) == m.group(2) else 'subcomponent', m.group(1)))
            continue
        m = re.fullmatch(r'src/(dialogs|public/components)/(Cn\w+)\.vue', f)
        if m:
            entries.append((m.group(2), f, 'dialog' if m.group(1) == 'dialogs' else 'public', None))
    for name, f, kind, parent in sorted(entries):
        if name in comps:
            continue
        doc = docs.get(kebab(name)) or docs.get(kebab(name).replace('cn-', 'cn-', 1))
        purpose = ''
        if doc:
            purpose = docs_intro(tree.show(doc), name)
        if not purpose:
            purpose = vue_docblock(tree.show(f), name)
        if not purpose and kind == 'component':
            local = f'src/components/{name}/{name}.md'
            if local in files:
                purpose = docs_intro(tree.show(local), name)
        purpose = first_sentence(purpose) if purpose else PURPOSE_FALLBACK.get(name, '')
        if name in PURPOSE_FALLBACK:
            purpose = PURPOSE_FALLBACK[name]
        if not purpose:
            m2 = re.fullmatch(r'Cn(\w+?)(Create|Picker)', name)
            if m2:
                thing = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', m2.group(1)).lower()
                purpose = (f'Creates a new {thing} and links it to the open object (integration).'
                           if m2.group(2) == 'Create' else
                           f'Picks an existing {thing} to link to the open object (integration).')
        if not purpose and parent and parent != name:
            purpose = f'Part of {parent}: {first_sentence(name[2:] if name.startswith("Cn") else name)}.'
        fam = vue_family(name)
        if parent and fam == 'other':
            fam = vue_family(parent)
        comps[name] = {
            'name': name,
            'purpose': purpose,
            'source': VUE_GH + f,
            'docs': (VUE_DOCS + kebab(name)) if doc else '',
            'family': fam,
            'library': 'nextcloud-vue',
            'kind': kind,
            'screens': [],
        }
        if parent and parent != name:
            comps[name]['partOf'] = parent
    return comps


def catalogue_portaliq(tree):
    comps = {}
    for f in tree.files:
        m = re.fullmatch(r'src/site/widgets/(\w+)/(\w+)\.vue', f)
        kind = None
        if m and m.group(2).lower() == m.group(1).lower():
            kind = 'site-widget'
        elif re.fullmatch(r'src/site/(components|modals|pages)/(?:[\w-]+/)?\w+\.vue', f):
            kind = 'site-component'
        if not kind:
            continue
        name = f.rsplit('/', 1)[1][:-4]
        key = PQ + name
        if key in comps:
            continue
        src = tree.show(f)
        purpose = vue_docblock(src, name)
        nlds = label = ''
        if kind == 'site-widget':
            meta = tree.show(f.rsplit('/', 1)[0] + '/meta.js')
            nlds = (re.search(r"nlds:\s*'([^']*)'", meta) or [None, ''])[1]
            label = (re.search(r"label:\s*'([^']*)'", meta) or [None, ''])[1]
        purpose = first_sentence(purpose) if purpose else ''
        internal = re.search(r'slice \w|\.jsx|hydra|\bT\d\d\b|\(see |registered over|PageView|design D\d', purpose)
        if key in PURPOSE_FALLBACK and (not purpose or len(purpose) < 25 or internal):
            purpose = PURPOSE_FALLBACK[key]
        if not purpose and kind == 'site-widget':
            parts = [x.strip() for x in nlds.split(',') if x.strip()] or [name]
            names = parts[0] if len(parts) == 1 else ', '.join(parts[:-1]) + ' and ' + parts[-1]
            purpose = f'Site block "{label}": the NL Design System {names} on a site page.'
        if not purpose:
            purpose = PURPOSE_FALLBACK.get(key, '')
        sub = f.split('/')[2]
        fam = PQ_FAMILY.get(name, 'dialog' if sub == 'modals' else 'site-widget')
        entry = {
            'name': name,
            'purpose': purpose,
            'source': PQ_GH + f,
            'docs': '',
            'family': fam,
            'library': 'portaliq',
            'kind': kind,
            'screens': [],
        }
        if nlds:
            entry['nlds'] = nlds
        comps[key] = entry
    return comps


# ---------------------------------------------------------------------------------------------
# Mapping: board -> components
# ---------------------------------------------------------------------------------------------

# Shared parts a board pulls in with <dc-import name="...">, and what each one is built from.
IMPORTS = {
    'AppZijbalk': ['CnAppNav'],
    'DqZijbalk': ['CnAppNav'],
    'DqKop': [],            # the Nextcloud top bar: Nextcloud core, not a library component
    'WerkKop': [],          # the same top bar in the school sets
    'Kop': [PQ + 'BrandHeader', PQ + 'SiteMenu'],
    'Voet': [PQ + 'FooterColumns'],
    'MijnMenu': [PQ + 'ResidentMenu'],
}
WORKPLACE_IMPORTS = {'AppZijbalk', 'DqZijbalk', 'DqKop', 'WerkKop'}
SITE_IMPORTS = {'Kop', 'Voet', 'MijnMenu'}

# Boards that document a shared part, a token set or an analysis instead of drawing a screen.
PART_BOARDS = {
    'Kop': ([PQ + 'BrandHeader', PQ + 'SiteMenu', PQ + 'HeaderTools'], ['site-chrome'], 'The shared site header part.'),
    'Voet': ([PQ + 'FooterColumns'], ['site-chrome'], 'The shared site footer part.'),
    'MijnMenu': ([PQ + 'ResidentMenu'], ['site-chrome'], 'The shared menu of the signed-in area.'),
    'AppZijbalk': (['CnAppNav'], ['chrome'], 'The shared app sidebar part.'),
    'DqZijbalk': (['CnAppNav'], ['chrome'], 'The shared dossiq sidebar part.'),
    'DqKop': ([], ['chrome'], 'The Nextcloud top bar: drawn by Nextcloud itself, no library component.'),
    'WerkKop': ([], ['chrome'], 'The Nextcloud top bar: drawn by Nextcloud itself, no library component.'),
    'Main': ([], ['tokens'], 'A brand and token board: colours, type and logos, no screen.'),
    'DqTokens': ([], ['tokens'], 'A token board: the workplace tokens, no screen.'),
    'LqTokens': ([], ['tokens'], 'A token board: the workplace tokens, no screen.'),
    'Nodig': ([], ['analysis'], 'An analysis board: what the school needs, no screen.'),
    'Acties': ([], ['analysis'], 'An analysis board, no screen.'),
    'Vereenvoudiging': ([], ['analysis'], 'An analysis board, no screen.'),
    'Gaps': ([], ['analysis'], 'An analysis board, no screen.'),
}

SITE_ROWS = {'rowSite', 'rowMijn', 'rowHuisstijl'}
SCHOOL_SETS = {'wilgenboom', 'vaartveld', 'esdoornveen', 'warmtepompacademie'}
SCHOOL_APP_BOARDS = re.compile(r'^(Lq|Nc|Lp|AppZijbalk|WerkKop)')


def norm(html):
    """The board's markup with svg bodies collapsed, so text and attribute searches stay cheap."""
    return re.sub(r'<svg\b.*?</svg>', '<svg/>', html, flags=re.S)


def split_board(src):
    markup = src.split('<x-dc>', 1)[1].split('</x-dc>', 1)[0] if '<x-dc>' in src else src
    markup = re.sub(r'<helmet>.*?</helmet>', '', markup, flags=re.S)
    script = src.split('</x-dc>', 1)[1] if '</x-dc>' in src else ''
    return norm(markup), script


def text_of(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html))


class Hits:
    """Collected components with the reason and a confidence per component."""

    RANK = {'high': 3, 'medium': 2, 'low': 1}

    def __init__(self):
        self.items = {}
        self.patterns = []

    def add(self, key, why, conf='medium'):
        old = self.items.get(key)
        if old is None or self.RANK[conf] > self.RANK[old[1]]:
            self.items[key] = (why, conf)

    def pattern(self, name):
        if name not in self.patterns:
            self.patterns.append(name)


def rx(pattern, text, flags=re.I):
    return re.search(pattern, text, flags) is not None


def count(pattern, text, flags=re.I):
    return len(re.findall(pattern, text, flags))


def dialog_part(markup):
    """Markup from the first role=dialog element onwards (the dimmed page sits before it)."""
    i = markup.find('role="dialog"')
    if i < 0:
        i = markup.find('role="alertdialog"')
    if i < 0:
        return ''
    return markup[markup.rfind('<', 0, i):]


def detect_dialog(h, dlg, title):
    t = text_of(dlg)
    head = t[:400]
    widths = [int(w) for w in re.findall(r'max-width:\s*(\d+)px', dlg[:600])]
    width = widths[0] if widths else None
    h.pattern('dialog')
    steps = rx(r'(stap|step) \d+ (van|of) \d+', t) or count(r'aria-current="step"', dlg) > 0
    many = rx(r'\b(\d+|alle|all) (geselecteerde|selected|items|zaken|publicaties|publications|records|objecten|objects|rijen|rows)\b', head)
    red = rx(r'#a30000|#c9302c|#b00020|var\(--color-error', dlg)
    if steps:
        h.pattern('wizard')
        if rx(r'export|download', head):
            h.add('CnExportWizard', 'dialog with steps that exports', 'high')
        else:
            h.add('CnWizardDialog', 'dialog with numbered steps', 'high')
    if rx(r'verwijder|delete|remove|wissen|intrekken', head) and red:
        h.add('CnMassDeleteDialog' if many else 'CnDeleteDialog', 'red destructive dialog', 'high')
    elif rx(r'kopi[eë]r|copy|dupliceer|duplicate', head):
        h.add('CnMassCopyDialog' if many else 'CnCopyDialog', 'copy dialog', 'high')
    elif rx(r'import|upload|inlezen', head) and not steps:
        h.add('CnMassImportDialog', 'import or upload dialog', 'medium')
    elif rx(r'exporteren|export|downloaden', head) and not steps:
        h.add('CnMassExportDialog', 'export dialog', 'medium')
    elif rx(r'weergave opslaan|save (the |current )?view', head):
        h.add('CnSaveViewDialog', 'save view dialog', 'high')
    elif not steps:
        fields = count(r'<(input|select|textarea)\b', dlg) - count(r'type="(checkbox|radio|hidden)"', dlg)
        if 'role="tablist"' in dlg:
            h.add('CnTabbedFormDialog', 'dialog with tabs and fields', 'medium')
        elif fields >= 1:
            h.add('CnFormDialog', f'dialog with {fields} field(s)', 'medium')
        else:
            h.add('CnConfirmDialog', 'dialog without fields: a confirmation or a read-only step', 'low')
    if width:
        h.pattern(f'dialog-{width}')
    if rx(r'type="file"|sleep (een |de |je |uw )?bestand|drag (a |the )?file|drop', dlg):
        h.add('CnFileField', 'file field in the dialog', 'medium')
    if '<table' in dlg:
        h.add('CnDataTable', 'table inside the dialog', 'medium')
    if rx(r'handteken|signature', head):
        h.add('CnSignatureCapture', 'signature in the dialog', 'low')


def detect_workplace(h, markup, script, name, title):
    page, dlg = markup, dialog_part(markup)
    if dlg:
        page = markup[:markup.find(dlg)]
    t = text_of(page)
    tl = title.lower()

    # chrome
    if 'aria-label="buildiq"' in markup:
        h.add('CnBuildiqEditButton', 'the orange buildiq square', 'high')
    if rx(r'aria-label="(Kruimelpad|Breadcrumbs?)"', page):
        h.add('CnBreadcrumbs', 'breadcrumb nav', 'high')
    if rx(r'kijkt nu ook|kijken nu ook|is also viewing|also looking|Wie er nog meer kijkt|aria-label="(Aanwezig|Present)', page):
        h.add('CnPresenceAvatars', 'who else has the record open', 'high')
    if rx(r'vergrendeld door|locked by|is vergrendeld', page):
        h.add('CnLockedBanner', 'locked banner', 'medium')
    if rx(r'aria-haspopup="menu"[^>]*>\s*(<svg/>)?\s*(Meer|More)\b|>\s*(Meer|More)\s*<svg/>\s*</button>', page):
        h.add('CnActionsMenu', 'labelled Meer menu in the header', 'medium')

    # index lists
    has_table = '<table' in page or 'role="grid"' in page or 'role="table"' in page
    view_switch = rx(r'aria-label="(Weergave|View as|View|Weergave kiezen)"', page)
    pagination = rx(r'aria-label="(Paginering|Pagination|Paginanavigatie)"', page)
    if view_switch:
        h.add('CnActionsBar', 'the view switch and count of the index toolbar', 'high')
    if has_table:
        h.add('CnDataTable', 'table', 'high')
    if pagination:
        h.add('CnPagination', 'numbered pagination', 'high')
    if rx(r'Alles wissen|Clear all|Filters wissen', page) or rx(r'<button[^>]*>\s*(<svg/>)?\s*(Filter|Filteren|Filters)\b', page):
        h.add('CnFilterBar', 'search field, Filter button and active filter chips', 'medium')
    if rx(r'<aside[^>]*>(?:(?!</aside>).)*(Filter|Filteren|Facet)', page, re.S | re.I) and count(r'type="checkbox"', page) >= 4:
        h.add('CnFacetSidebar', 'side panel with filter groups', 'low')
    if count(r'aria-pressed="(true|false|\{\{)', page) >= 2 and (view_switch or has_table or pagination):
        h.add('CnQuickFilterBar', 'saved-view chips above the list', 'medium')
    if rx(r'\d+ (geselecteerd|selected)|selectie:|Acties voor de selectie|aria-label="(Selection|Selectie)"', page):
        h.add('CnMassActionBar', 'bulk band for selected rows', 'medium')
    if rx(r'aria-label="(Acties voor|Actions for|Meer acties voor|More actions for)', page):
        h.add('CnRowActions', 'one ... menu per row', 'high')
    if count(r'border-radius:\s*(999|99|100|20|12)px[^"]*"[^>]*>[^<]{2,30}</span>', page) >= 3 or rx(r'class="[^"]*(pill|badge|status)', page):
        h.add('CnStatusBadge', 'status pills', 'low')
    is_index = (has_table and (pagination or view_switch)) or (view_switch and pagination)
    tablist_any = 'role="tablist"' in page and not is_index
    dash_title = rx(r'dashboard|: vandaag|: today|mijn werkdag|my day|^[^:]*: overzicht$', tl)
    cards = rx(r'minmax\((2[4-9]\d|3[0-4]\d)px', page)
    kanban = rx(r'repeat\(\d+, minmax\(2\d\dpx, 1fr\)\)|grid-auto-columns:\s*minmax\(2\d\dpx|grid-auto-flow:\s*column', page) \
        or (rx(r'bordweergave|board view|\bbord\b|kanban|pipeline, board|per (fase|status|stage)', tl) and not rx(r'dashboard', tl))
    if kanban:
        h.add('CnBoardView', 'columns of cards per stage', 'high' if rx(r'bord|board|kanban', tl) else 'medium')
        h.pattern('kanban')
    elif cards and not has_table and not tablist_any and not dash_title:
        h.add('CnCardGrid', 'grid of cards', 'medium')
        h.add('CnObjectCard', 'cards in the grid', 'low')
        h.pattern('card-list')
    if is_index or (cards and (view_switch or pagination)):
        h.add('CnIndexPage', 'toolbar, list and footer of an index page', 'medium')
        h.pattern('index-list')
    if rx(r'role="img"[^>]*aria-label="(Kaart|Map)', page) or rx(r'\b(op de kaart|on the map|kaartweergave|map view)\b', tl):
        if rx(r'kaart|map', tl):
            h.add('CnMapPage', 'map page', 'medium')
            h.pattern('map')
        else:
            h.add('CnMapWidget', 'map in a card', 'medium')

    # detail pages
    tablist = re.search(r'role="tablist"', page)
    side = rx(r'<aside\b', page) or rx(r'flex:\s*0 0 (28\d|29\d|30\d|31\d|32\d)px', page)
    dls = count(r'<dl\b', page)
    stepper = rx(r'<ol[^>]*aria-label="(Voortgang|Progress|Stappen|Steps|Fases|Stages)', page) or rx(r'aria-label="Stappen van', page)
    if stepper:
        h.add('CnTimelineStages', 'stage stepper', 'high')
    if rx(r'Wat nu\?|What next\?|What now\?|Volgende stap', page):
        h.add('CnNextStepCard', 'the Wat nu? card', 'high')
    is_detail = tablist and (dls or side) and not is_index
    if is_detail or (dls >= 2 and side and not is_index):
        h.add('CnDetailPage', 'header, tabs or side column with record fields', 'medium' if tablist else 'low')
        h.pattern('detail')
    if tablist and not is_index:
        h.add('CnTabs', 'folder tabs', 'high')
    elif tablist and is_index:
        h.add('CnTabs', 'folder tabs above the index toolbar', 'medium')
    if dls:
        h.add('CnDetailGrid', 'label and value pairs', 'medium')
    if side and (dls or count(r'<section\b', page) >= 2):
        h.add('CnDetailCard', 'side column of small cards', 'medium')
    if rx(r'>\s*(Historie|History|Geschiedenis|Logboek|Activity|Activiteit)\s*<', page) or rx(r"label:\s*'(Historie|History)'", script):
        h.add('CnAuditTrailCard', 'Historie tab or card', 'low')
    if rx(r'<h[23][^>]*>\s*(Notities|Notes|Aantekeningen)\b', page):
        h.add('CnNotesCard', 'notes section', 'medium')
    if rx(r'<h[23][^>]*>\s*(Taken|Tasks|Open taken)\b', page) and not is_index:
        h.add('CnTasksCard', 'tasks section', 'low')
    if rx(r'<h[23][^>]*>\s*(Tags|Labels)\b', page):
        h.add('CnTagsCard', 'tags section', 'low')
    if rx(r'<h[23][^>]*>\s*(Gerelateerd|Gekoppeld|Related|Koppelingen|Linked)\b', page):
        h.add('CnRelatedCollections', 'related records section', 'low')
    if rx(r'<h[23][^>]*>\s*(Versies|Versions|Versiegeschiedenis|Version history)\b', page) or rx(r'versie herstellen|restore version', tl):
        h.add('CnVersionHistory', 'versions section', 'medium')
    if rx(r'role="progressbar"|<progress\b', page):
        h.add('CnProgressBar', 'progress bar', 'medium')
    if rx(r'\b(\d+) van (\d+) (klaar|gedaan|beoordeeld|af)\b|\b\d+ of \d+ (done|complete)', page) and not rx(r'role="progressbar"', page):
        h.add('CnProgressBar', 'progress count with a bar', 'low')

    # conversation, files, forms
    if rx(r'<textarea[^>]*(placeholder="[^"]*(antwoord|reply|bericht|message|typ)|aria-label="[^"]*(antwoord|reply|bericht|message))', page) \
            and rx(r'(Versturen|Verstuur|Send|Antwoorden|Reply)\s*</button>', page):
        if rx(r'gesprek|chat|conversation|berichten|messages', tl) and not tablist:
            h.add('CnChatPage', 'conversation page', 'medium')
        h.add('CnConversationThread', 'messages with an answer box', 'medium')
    if rx(r'type="file"|Sleep (een |de |je |uw )?bestand|Sleep bestanden|Drag (and drop )?files?|Drop files', page):
        h.add('CnFileField', 'file drop zone or file input', 'medium')
    if rx(r'<h[23][^>]*>\s*(Documenten|Bestanden|Bijlagen|Files|Documents|Attachments)\b', page) and (has_table or count(r'\.(pdf|docx|xlsx|odt|png|jpg)\b', page) >= 2):
        h.add('CnFilesCard', 'files section', 'low')
    if rx(r'role="tree"', page):
        h.add('CnTreeView', 'tree', 'medium')
    if rx(r'font-family:\s*[^;"]*(mono|Courier|Consolas)', page) and rx(r'[{\[]\s*&quot;|"\w+":|<pre\b|<code\b', page):
        h.add('CnJsonViewer', 'code or JSON view', 'low')
    if rx(r'aria-label="(Opmaak|Formatting|Tekstopmaak)"', page) or rx(r'markdown', page):
        h.add('CnMarkdownEditor', 'text editor with a formatting toolbar', 'low')
    if rx(r'type="color"|aria-label="[^"]*(kleur kiezen|pick a colou?r)', page):
        h.add('CnColorPicker', 'colour picker', 'medium')
    if rx(r'\bcron\b', page):
        h.add('CnCronField', 'schedule field', 'low')
    if rx(r'handtekening|aria-label="[^"]*(signature|handtekening)', page) and rx(r'<canvas|Teken hier|Teken uw|Draw here|Typ uw naam|Type your name', page):
        h.add('CnSignatureCapture', 'signature', 'low')
    if rx(r'role="radiogroup"', page) and rx(r'border:\s*\d+px solid', page):
        h.add('CnChoiceCards', 'options as cards', 'low')
    if rx(r'aria-label="(Periode|Period|Bereik|Range)"', page) or (count(r'aria-pressed="', page) >= 2 and not (view_switch or has_table)):
        h.add('CnSegmentedControl', 'segmented switch', 'medium')

    # dashboards and reports
    big_values = count(r'font-size:\s*(2[6-9]|3\d)px;[^"]*font-weight:\s*(6|7|8)00[^"]*"[^>]*>[^<]{1,14}<', page) \
        + count(r'font-weight:\s*(6|7|8)00;[^"]*font-size:\s*(2[6-9]|3\d)px[^"]*"[^>]*>[^<]{1,14}<', page)
    kpi_grid = rx(r'minmax\((1[6-9]\d|2[0-2]\d)px, 1fr\)', page)
    if big_values >= 3 or (kpi_grid and big_values >= 2):
        h.add('CnKpiGrid', f'{big_values} KPI figures in a grid', 'medium')
        h.add('CnStatsBlock', 'KPI tiles: label, value, note', 'medium')
        h.pattern('kpi')
    if rx(r'<(polyline|path)[^>]*stroke', markup) and rx(r'(grafiek|chart|trend|per dag|per week|per maand|per day|per month)', page):
        h.add('CnChartWidget', 'chart', 'medium')
    elif rx(r'aria-label="[^"]*(grafiek|chart|staafdiagram|per dag|per day)', page):
        h.add('CnChartWidget', 'chart', 'medium')
    if rx(r'\b(dashboard|vandaag|today|overzicht|mijn werkdag|my day|start)\b', tl) and (big_values >= 2 or kpi_grid):
        h.add('CnDashboardPage', 'dashboard page', 'medium')
        h.add('CnDashboardGrid', 'grid of dashboard widgets', 'low')
        h.pattern('dashboard')
    if rx(r'\b(rapport|report)', tl):
        h.pattern('report')
        if rx(r'\b(rapporten|reports)\b', tl) and not rx(r',', tl.split(':')[-1]):
            h.add('CnReportsPage', 'list of reports', 'medium')
    if rx(r'kalender|calendar|agenda\b|rooster|planbord', tl) and not dlg:
        h.add('CnObjectCalendar', 'calendar page', 'low')
        h.pattern('calendar')
    if rx(r'Deze week|This week|Vorige week|Next week', page) and rx(r'\b(ma|maandag|mon|monday)\b', page) and rx(r'\b(di|dinsdag|tue|tuesday)\b', page):
        h.add('CnObjectCalendar', 'calendar or timetable grid', 'low')
        h.pattern('calendar')

    if dash_title:
        sections = re.findall(r'<section[^>]*aria-labelledby[^>]*>(.*?)</section>', page, re.S)
        lists = [x for x in sections if '<sc-for' in x or count(r'<li\b', x) >= 2]
        if lists:
            h.add('CnObjectListWidget', f'{len(lists)} list widget(s) on the dashboard', 'low')
            h.add('CnWidgetWrapper', 'titled widget cards', 'low')
        if count(r'<strong[^>]*>\s*\d[\d.,%]*\s*</strong>', page) >= 2 and 'CnKpiGrid' not in h.items:
            h.add('CnStatWidget', 'figures with a label', 'low')
        if not h.patterns or 'dashboard' not in h.patterns:
            h.add('CnDashboardPage', 'dashboard page (title)', 'medium')
            h.pattern('dashboard')
    if rx(r'>\s*(Vandaag eerst|Today first|First today)\s*<', page):
        h.add('CnNextStepCard', 'the Vandaag eerst card', 'medium')
    if not is_index and not tablist_any and count(r'<ul[^>]*aria-label="[^"]*"[^>]*>\s*<sc-for', page) and not dash_title:
        h.add('CnObjectList', 'list of record rows', 'low')
        h.add('CnObjectRow', 'record rows', 'low')

    # settings and admin
    admin = rx(r'(Beheerinstellingen|Administration settings|Admin settings)\s*(</a>|</span>|<span aria-hidden)', page) or rx(r'admin settings|beheerinstellingen|administration|\bbeheer\b', tl.split(':')[-1])
    settings = admin or rx(r'Persoonlijke instellingen|Personal settings', page) or rx(r'\b(instellingen|settings)\b', tl)
    if settings:
        if admin:
            h.add('CnAdminSettingsShell', 'admin settings chrome', 'medium')
        else:
            h.add('CnSettingsPage', 'settings page', 'low')
        if count(r'<section\b', page) >= 2:
            h.add('CnSettingsSection', 'settings sections', 'low')
        h.pattern('settings')
        if rx(r'(Versie|Version) \d+\.\d+', page):
            h.add('CnVersionInfoCard', 'version card', 'low')
    if rx(r'\b(installatie|setup wizard|eerste keer|first run|aan de slag)\b', tl):
        h.add('CnSetupWizard', 'setup wizard', 'medium')
        h.pattern('wizard')
    if rx(r'\b(store|app store|winkel)\b', tl):
        h.add('CnStorePage', 'store page', 'medium')
    if rx(r'\b(rapportages|reports|rapporten)\b', tl) and not rx(r'(rapport|report),', tl):
        h.add('CnReportsPage', 'list of reports', 'medium')
    if rx(r'^[^:]*: flows\b', tl):
        h.add('CnFlowsPage', 'flow list', 'medium')
    if rx(r'flow editor|flow run|canvas|flow bewerken|stroom', tl):
        h.add('CnFlowDetail', 'flow canvas', 'medium')
        h.add('CnGraphCanvas', 'node and edge canvas', 'medium')
        if rx(r'\brun\b|uitvoering', tl):
            h.add('CnRunDetailSidebar', 'run details beside the canvas', 'low')
    if rx(r'\b(integraties|integrations|koppelingen)\b', tl) and not admin:
        h.add('CnIntegrationCard', 'integration cards', 'low')
    if rx(r'\b(features|roadmap)\b', tl):
        h.add('CnFeaturesAndRoadmapPage', 'features and roadmap', 'medium')
    if rx(r'\b(logboek|logs?|audit)\b', tl) and has_table:
        h.add('CnLogsPage', 'log page', 'low')
    if rx(r'\b(zoeken|search)\b', tl) and rx(r'type="search"', page):
        h.add('CnSearchPage', 'search page', 'low')
        h.pattern('search')
    if rx(r'\b(help|hulp|uitleg)\b', tl) and not has_table:
        h.add('CnWikiPage', 'help article', 'low')
    if rx(r'\b(ai-assistent|ai assistant|companion)\b', tl):
        h.add('CnAiCompanion', 'AI assistant', 'medium')
        h.add('CnAiChatPanel', 'AI chat panel', 'medium')
    if rx(r'\bflows?\b', tl) and rx(r'(knoop|node|stap|step)', page) and rx(r'<(line|path)[^>]*stroke', markup):
        h.add('CnFlowDetail', 'flow canvas', 'low')
        h.add('CnGraphCanvas', 'node and edge canvas', 'low')
    if rx(r'walkthrough|rondleiding', tl):
        h.add('CnWalkthrough', 'walkthrough', 'low')
    if rx(r'Ctrl\+K|⌘K|Cmd\+K', page):
        h.add('CnCommandPalette', 'command palette', 'low')
    if rx(r'role="(note|alert)"|role="status"', page) and not dlg:
        h.add('CnNoteCard', 'callout card', 'low')

    # page header fallback: the h1 row when nothing page-level carries it
    if '<h1' in page and not any(k in h.items for k in ('CnIndexPage', 'CnDetailPage', 'CnDashboardPage', 'CnAdminSettingsShell', 'CnSettingsPage', 'CnReportsPage', 'CnMapPage', 'CnChatPage')):
        h.add('CnPageHeader', 'h1 header row', 'low')
    if '<form' in page and count(r'<(input|select|textarea)\b', page) >= 4 and not settings and rx(r'\b(nieuw|new|bewerken|edit|formulier|form|aanmaken|create)\b', tl) and not dlg:
        h.add('CnFormPage', 'full-page form', 'low')
        h.pattern('form')

    head = page.split('aria-label="buildiq"', 1)[0]
    head = head[head.rfind('<h1'):] if '<h1' in head else ''
    if head and count(r'<button\b', head) >= 1 and ('CnDetailPage' in h.items or 'CnDashboardPage' in h.items):
        h.add('CnActionButtons', 'header action buttons left of buildiq', 'medium')

    if 'CnAdminSettingsShell' in h.items and 'CnDetailPage' in h.items:
        # settings sections in tabs with a side card are an admin settings page, not a record
        h.items.pop('CnDetailPage')
        h.patterns = [p for p in h.patterns if p != 'detail']

    if dlg:
        detect_dialog(h, dlg, title)


def detect_site(h, markup, script, name, title):
    page, dlg = markup, dialog_part(markup)
    if dlg:
        page = markup[:markup.find(dlg)]
    t = text_of(page)
    tl = title.lower()
    mijn = 'MijnMenu' in markup or rx(r'signed-in="\{\{ true \}\}"', markup)
    h.pattern('site-mijn' if mijn else 'site')
    if mijn and rx(r'signed-in="\{\{ true \}\}"', markup):
        h.add(PQ + 'AccountArea', 'signed-in header', 'medium')

    if rx(r'<strong>\s*(Let op|Storing|Melding|Onderhoud|Note|Warning)\b', page) and rx(r'<p\b', page):
        h.add(PQ + 'NlBanner', 'notification banner', 'medium')
    if rx(r'<section[^>]*>\s*<img\b', page) or (rx(r'<h1', page) and rx(r'<img src="/_blob', page[:4000]) and count(r'<a href', page[:4000]) >= 2):
        h.add(PQ + 'HeroBlock', 'hero band with image, title and calls to action', 'medium')
    if rx(r'>\s*(Direct regelen|Snel regelen|Regel het direct|Veelgevraagd|Populair)\s*<', page):
        h.add(PQ + 'NlQuickTasks' if not mijn else PQ + 'QuickTiles', 'quick tasks', 'high')
    elif mijn and count(r'<a href[^>]*>\s*<span[^>]*>\s*<svg/>', page) >= 4:
        h.add(PQ + 'QuickTiles', 'tiles with icons', 'low')
    if rx(r'<h2[^>]*>\s*[^<]*(Nieuws|News)\b', page):
        h.add(PQ + ('NewsBlock' if mijn else 'NlNewsList'), 'news section', 'high')
    if rx(r'<h2[^>]*>\s*[^<]*(agenda|kalender|Deze maand|Binnenkort|Komende|Afspraken)\b', page) or (rx(r'\{\{ a\.day \}\}|\{\{ \w+\.month \}\}', page)):
        h.add(PQ + ('CalendarBlock' if mijn else 'NlEventList'), 'agenda with date tiles', 'medium')
    if count(r'<h3[^>]*>[^<]*</h3>\s*<ul', page) >= 2 or rx(r'\{\{ c\.links \}\}', page):
        h.add(PQ + 'NlLinkColumns', 'columns of links under headings', 'medium')
    elif count(r'<ul[^>]*>\s*(<sc-for[^>]*>\s*)?<li[^>]*>\s*<a\b', page) >= 1 and not mijn:
        h.add(PQ + 'NlLinkList', 'list of links', 'low')
    if rx(r'Inloggen met (DigiD|eHerkenning)|Log in with DigiD', page):
        if rx(r'inloggen|sign in|log in', tl):
            h.add(PQ + 'SignInPage', 'sign-in page', 'high')
            h.add(PQ + 'WaysIn', 'sign-in ways', 'medium')
        else:
            h.add(PQ + 'NlSignIn', 'sign-in call to action', 'medium')
    if rx(r'role="search"', page) or rx(r'type="search"', page):
        if rx(r'\bzoek|\bsearch|resultat|treffers', tl):
            h.add(PQ + 'FederatedSearchBlock', 'site search with results', 'medium')
            h.pattern('search')
        else:
            h.add('CnSiteSearch', 'search box', 'low')
    if rx(r'<details\b', page):
        h.add(PQ + 'NlAccordion', 'accordion', 'high')
    if '<table' in page:
        h.add(PQ + ('CollectionTable' if mijn else 'NlTable'), 'table', 'medium')
    if rx(r'aria-label="(Paginering|Pagination|Paginanavigatie)"', page):
        h.add(PQ + 'NlCatalogue', 'page number navigation', 'low')
    if rx(r'<blockquote\b', page):
        h.add(PQ + 'NlQuote', 'quote', 'high')
    if rx(r'<video\b|youtube|aria-label="Video', page):
        h.add(PQ + 'NlVideo', 'video', 'medium')
    if rx(r'role="tablist"', page) and not mijn:
        h.add(PQ + 'NlTabs', 'tabs', 'medium')
    if rx(r'<h1', page) and rx(r'(Welkom|Goedemorgen|Goedemiddag|Goedenavond|Hallo|Welcome|Good morning)', page):
        h.add(PQ + 'GreetingBlock', 'greeting', 'medium')

    # Mijn blocks
    if rx(r'class="[^"]*zd-case\b', page) or rx(r'Zaaknummer \{\{', page):
        h.add(PQ + 'CaseCard', 'folder-shaped case cards', 'high')
        if rx(r'mijn zaken|zaken', tl):
            h.add(PQ + 'MyCasesPage', 'cases page', 'medium')
        else:
            h.add(PQ + 'CasesBlock', 'cases block', 'medium')
    if rx(r'<h2[^>]*>\s*[^<]*(Taken|Mijn taken|Te doen|Wat u nog moet doen|To do)\b', page):
        h.add(PQ + 'TasksBlock', 'tasks block', 'medium')
    if rx(r'<h2[^>]*>\s*[^<]*(Berichten|Inbox|Postvak|Messages)\b', page):
        h.add(PQ + 'InboxBlock', 'messages block', 'medium')
    if rx(r'<h2[^>]*>\s*[^<]*(Documenten|Bestanden|Bijlagen|Documents)\b', page):
        h.add(PQ + 'DocumentsBlock', 'documents block', 'medium')
    if rx(r'<(ol|nav)[^>]*aria-label="(Voortgang|Stappen|Progress|Status)', page) or rx(r'<h2[^>]*>\s*[^<]*(Voortgang|Zo verloopt|Stappen)\b', page):
        if rx(r'(stap|step) \d+ (van|of) \d+', t):
            h.add(PQ + 'FormProgress', 'form steps', 'high')
        else:
            h.add(PQ + 'ProcessSteps', 'process steps', 'medium')
    if rx(r'<h2[^>]*>\s*[^<]*(Contactmomenten|Contact met|Contacthistorie|Tijdlijn|Geschiedenis|Historie)\b', page):
        h.add(PQ + ('ContactTimeline' if rx(r'contact', page[:0] + tl + ' ' + t[:3000]) else 'TimelineBlock'), 'timeline', 'low')
    if rx(r'<dl\b', page):
        h.add(PQ + 'DescriptionList', 'label and value pairs', 'medium')
    if rx(r'namens|acting for|op naam van', t) and rx(r'<select|wissel|switch', page) and mijn:
        h.add(PQ + 'ActingForBar', 'acting-for bar', 'low')
    if rx(r'rooster|timetable', tl) and rx(r'\b\d{1,2}[.:]\d{2}\b', page):
        h.add(PQ + 'TimetableDay', 'timetable of the day', 'medium')
    if mijn and rx(r'\b(cijfers|grades|cijferlijst)\b', tl):
        h.add(PQ + 'MarkChips', 'recent marks', 'low')
    if rx(r'role="progressbar"|<progress\b', page):
        h.add(PQ + ('ProgressCards' if mijn else 'NlProgressBar'), 'progress bars', 'medium')
    if rx(r'\bKind afwezig|Ziekmelding|absent\b', tl):
        pass

    sub = tl.split(':')[-1].strip()
    if mijn:
        for pat, key in ((r'^berichten$|^inbox', 'InboxPage'), (r'^mijn taken', 'TasksPage'),
                         (r'^mijn gegevens', 'RegisteredDetailsPage'), (r'^mijn account', 'AccountPage'),
                         (r'^uw zaak$', 'CitizenCase'), (r'gesprek', 'MessagesPage')):
            if rx(pat, sub):
                h.add(PQ + key, f'the {sub} page', 'medium')

    # forms
    fields = count(r'<(input|select|textarea)\b', page) - count(r'type="(hidden|search)"', page)
    form = '<form' in page or fields >= 3
    if form and fields >= 1 and not rx(r'\bzoek|\bsearch', tl):
        h.add(PQ + 'FieldShell', 'form fields', 'medium')
        if rx(r'(stap|step) \d+ (van|of) \d+', t) or rx(r'aria-label="(Stappen|Voortgang|Steps|Formulierstappen)', page):
            h.add(PQ + 'FormProgress', 'form steps', 'high')
            h.add(PQ + 'FormBlock', 'multi-step form', 'medium')
            h.pattern('site-form')
        elif fields >= 3:
            h.add(PQ + 'FormBlock', 'form', 'low')
            h.pattern('site-form')
    if rx(r'niet verplicht|optional\)', page):
        h.add(PQ + 'LabelSuffix', '(niet verplicht) suffix', 'high')
    if rx(r'>\s*(Wijzig|Wijzigen|Aanpassen|Change)\s*(<span[^>]*>[^<]*</span>)?\s*</a>', page) and rx(r'<dl\b', page) and rx(r'controle|check|overzicht|samenvatting|review', tl + t[:2000]):
        h.add(PQ + 'ReviewList', 'answers with change links', 'high')
    if rx(r'Er (is|zijn) (iets|\d+ fout)|There (is|are) a problem|role="alert"[^>]*>(?:(?!</div>).)*<a href="#', page, re.S | re.I):
        h.add(PQ + 'ErrorSummary', 'error summary', 'medium')
    if rx(r'type="file"|Sleep (een |de |uw )?bestand|Bestand kiezen|Bestanden toevoegen', page):
        h.add(PQ + 'FileUpload', 'file upload', 'high')
    if rx(r'>\s*Dag\s*<.*>\s*Maand\s*<.*>\s*Jaar\s*<', page, re.S):
        h.add(PQ + 'DateInputGroup', 'date as day, month, year', 'high')
    if count(r'type="radio"', page) >= 2 and rx(r'border:\s*\d+px solid', page):
        h.add(PQ + 'ChoiceCards', 'radio options as cards', 'low')
    if rx(r'aria-label="[^"]*(minder|verlagen|fewer|decrease)"', page) and rx(r'aria-label="[^"]*(meer|verhogen|more|increase)"', page):
        h.add(PQ + 'CountStepper', 'count stepper', 'medium')
    if rx(r'kies een (dag|datum|tijd)|beschikbare tijden|tijdslot', t):
        h.add(PQ + 'DateChoices', 'date and time choices', 'medium')

    if dlg:
        h.pattern('dialog')
        dt = text_of(dlg)[:400]
        if rx(r'sessie|session|verloopt|expires', dt):
            h.add(PQ + 'IdleWarningDialog', 'session expiry dialog', 'high')
        elif rx(r'intrekken|withdraw', dt):
            h.add(PQ + 'WithdrawCaseConfirm', 'withdraw confirmation', 'high')
        elif rx(r'onderteken|sign', dt):
            h.add(PQ + 'SigningDialog', 'signing dialog', 'medium')
        elif rx(r'weiger|afwijzen|decline', dt):
            h.add(PQ + 'DeclineDialog', 'decline dialog', 'medium')
        else:
            h.add(PQ + 'NlDialog', 'dialog', 'low')


def classify(board, markup):
    name = board['file'].rsplit('/', 1)[1][:-5]
    name = name.split('-', 1)[1] if board['set'] in SCHOOL_SETS and '-' in name else name
    imports = re.findall(r'<dc-import name="([^"]+)"', markup)
    if name in PART_BOARDS:
        return 'part', name, imports
    if set(imports) & SITE_IMPORTS:
        return 'site', name, imports
    if set(imports) & WORKPLACE_IMPORTS:
        return 'workplace', name, imports
    if board['set'] in SCHOOL_SETS:
        return ('workplace' if SCHOOL_APP_BOARDS.match(name) else 'site'), name, imports
    if board.get('row') in SITE_ROWS:
        return 'site', name, imports
    return 'workplace', name, imports


def map_board(board, src):
    markup, script = split_board(src)
    kind, name, imports = classify(board, markup)
    h = Hits()
    if kind == 'part':
        comps, pats, note = PART_BOARDS[name]
        for c in comps:
            h.add(c, 'shared part', 'high')
        for p in pats:
            h.pattern(p)
        return kind, h, note
    for imp in imports:
        for c in IMPORTS.get(imp, []):
            h.add(c, f'imports {imp}', 'high')
    if kind == 'site':
        detect_site(h, markup, script, name, board.get('title', ''))
        # school and Mijn boards drawn inside the workplace frame still carry buildiq
        if 'aria-label="buildiq"' in markup:
            h.add('CnBuildiqEditButton', 'the orange buildiq square', 'high')
    else:
        detect_workplace(h, markup, script, name, board.get('title', ''))
    return kind, h, ''


# ---------------------------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------------------------

def board_source(board):
    rel = board.get('src') or ''
    p = REPO / rel if rel else None
    if p and p.is_file():
        return p.read_text(encoding='utf-8')
    return ''


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--apps-dir', type=pathlib.Path, default=APPS_EXTRA)
    ap.add_argument('--report', action='store_true', help='print the lane report to stdout')
    ap.add_argument('--catalogue-only', action='store_true', help='write the catalogue with an empty mapping')
    args = ap.parse_args()

    vue = Tree(args.apps_dir / VUE_DIR)
    pq = Tree(args.apps_dir / PQ_DIR)
    comps = catalogue_vue(vue)
    comps.update(catalogue_portaliq(pq))

    screens_json = json.loads((SCREENS / 'screens.json').read_text(encoding='utf-8'))
    overrides = {}
    if OVERRIDES.is_file():
        overrides = json.loads(OVERRIDES.read_text(encoding='utf-8')).get('boards', {})

    screens = {}
    uncertain = []
    unknown = Counter()
    for key, board in screens_json['boards'].items():
        sid = board['id']
        entry = {'components': [], 'patterns': []}
        if args.catalogue_only:
            screens[sid] = entry
            continue
        src = board_source(board)
        if not src:
            entry['note'] = 'No board source found.'
            screens[sid] = entry
            continue
        kind, h, note = map_board(board, src)
        layers = [v for pat, v in overrides.items() if '*' in pat and fnmatch.fnmatchcase(sid, pat)]
        if sid in overrides:
            layers.append(overrides[sid])
        items = dict(h.items)
        patterns = list(h.patterns)
        for ov in layers:
            if 'set' in ov:
                items = {c: ('override', 'high') for c in ov['set']}
            for c in ov.get('remove', []):
                items.pop(c, None)
            for c in ov.get('add', []):
                items[c] = ('override', 'high')
            if 'patterns' in ov:
                patterns = list(ov['patterns'])
            if 'note' in ov:
                note = ov['note']
        valid = []
        for c in items:
            if c in comps:
                valid.append(c)
            else:
                unknown[c] += 1
        order = {f: i for i, f in enumerate(FAMILIES)}
        valid.sort(key=lambda c: (order.get(comps[c]['family'], 99), c))
        entry['components'] = valid
        entry['patterns'] = patterns
        entry['kind'] = kind
        low = [c for c in valid if items[c][1] == 'low']
        if low:
            entry['uncertain'] = low
        entry['why'] = {c: items[c][0] for c in valid}
        if not valid and not note:  # noqa: SIM102
            note = 'No component recognised on this board; add it in screens-src/components-overrides.json.'
        if note:
            entry['note'] = note
        for c in low:
            uncertain.append((sid, c, items[c][0]))
        screens[sid] = entry
        for c in valid:
            comps[c]['screens'].append(sid)

    if unknown:
        print('warning: components named by rules or overrides but not in the catalogue: '
              + ', '.join(f'{c} ({n})' for c, n in unknown.most_common()), file=sys.stderr)

    out = {
        'generated': datetime.date.today().isoformat(),
        'sources': {
            'nextcloud-vue': {'ref': vue.ref, 'sha': vue.sha},
            'portaliq': {'ref': pq.ref, 'sha': pq.sha},
        },
        'how': ('Catalogue read from nextcloud-vue and portaliq at origin/development. Mapping by pattern '
                'detection on each board source in screens-src (scripts/screens/components.py), corrected per '
                'board in screens-src/components-overrides.json.'),
        'families': FAMILIES,
        'components': dict(sorted(comps.items(), key=lambda kv: (kv[1]['library'] != 'nextcloud-vue', kv[0].lower()))),
        'screens': screens,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    used = {k: v for k, v in comps.items() if v['screens']}
    print(f'wrote {OUT.relative_to(REPO)}: {len(comps)} components, {len(used)} used, {len(screens)} screens',
          file=sys.stderr)

    if args.report:
        report(comps, screens, uncertain)


def report(comps, screens, uncertain):
    used = sorted(((len(v['screens']), k) for k, v in comps.items() if v['screens']), reverse=True)
    print(f'components used: {len(used)} of {len(comps)}')
    print('top 20 by screen count:')
    for n, k in used[:20]:
        print(f'  {n:4d}  {k}')
    empty = [s for s, e in screens.items() if not e['components']]
    print(f'screens with no component: {len(empty)}')
    for s in empty:
        print(f'  {s}: {screens[s].get("note", "")}')
    per = Counter(c for _, c, _ in uncertain)
    print('low-confidence assignments by component:')
    for c, n in per.most_common(25):
        print(f'  {n:4d}  {c}')


if __name__ == '__main__':
    main()
