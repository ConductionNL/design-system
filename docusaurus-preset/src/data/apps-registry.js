/**
 * @conduction/docusaurus-preset/data/apps-registry
 *
 * URL-only registry of every public Conduction app. Single source of
 * truth for cross-linking between the three surfaces a visitor lands
 * on while learning about an app:
 *
 *   1. /apps/<slug>                  product detail page
 *   2. https://<slug>.conduction.nl  documentation site (each app's
 *      docs are served from its own per-app subdomain, built from the
 *      app's own repo)
 *   3. /academy?app=<slug>           academy posts filtered by app
 *
 * The registry is consumed by:
 *   - <AppCrossLinks/>          renders the three links per app.
 *   - <ProductFilter/>          renders the chip row on /academy.
 *   - sites/www/src/data/apps-catalog.js   the live Conduction.nl
 *     site adds icons, taglines, and category metadata on top of
 *     this registry, so display data and URLs stay in lockstep.
 *
 * Adding a new app: add an entry here. The url shape is conventional:
 *   - productHref:  /apps/<slug>
 *   - docsHref:     https://<slug>.conduction.nl
 *   - academyHref:  /academy?app=<slug>
 * Override any of the three when an app deviates from the convention
 * (none today; the convention holds).
 */

export const APPS_REGISTRY = {
  opencatalogi:    {slug: 'opencatalogi',    name: 'OpenCatalogi',     category: 'Data',        productHref: '/apps/opencatalogi',    docsHref: 'https://opencatalogi.conduction.nl',    academyHref: '/academy?app=opencatalogi'},
  openregister:    {slug: 'openregister',    name: 'OpenRegister',     category: 'Data',        productHref: '/apps/openregister',    docsHref: 'https://openregister.conduction.nl',    academyHref: '/academy?app=openregister'},
  openconnector:   {slug: 'openconnector',   name: 'Integriq',         category: 'Connectors',  productHref: '/apps/openconnector',   docsHref: 'https://openconnector.conduction.nl',   academyHref: '/academy?app=openconnector'},
  docudesk:        {slug: 'docudesk',        name: 'Filinq',           category: 'Documents',   productHref: '/apps/docudesk',        docsHref: 'https://docudesk.conduction.nl',        academyHref: '/academy?app=docudesk'},
  launchpad:       {slug: 'launchpad',       name: 'LaunchPad',        category: 'Dashboards',  productHref: '/apps/launchpad',       docsHref: 'https://launchpad.conduction.nl',       academyHref: '/academy?app=launchpad'},
  zaakafhandelapp: {slug: 'zaakafhandelapp', name: 'ZaakAfhandelApp',  category: 'Processes',   productHref: '/apps/zaakafhandelapp', docsHref: 'https://zaakafhandelapp.conduction.nl', academyHref: '/academy?app=zaakafhandelapp'},
  pipelinq:        {slug: 'pipelinq',        name: 'PipelinQ',         category: 'Processes',   productHref: '/apps/pipelinq',        docsHref: 'https://pipelinq.conduction.nl',        academyHref: '/academy?app=pipelinq'},
  procest:         {slug: 'procest',         name: 'Dossiq',           category: 'Processes',   productHref: '/apps/procest',         docsHref: 'https://procest.conduction.nl',         academyHref: '/academy?app=procest'},
  decidesk:        {slug: 'decidesk',        name: 'Decidiq',          category: 'Processes',   productHref: '/apps/decidesk',        docsHref: 'https://decidesk.conduction.nl',        academyHref: '/academy?app=decidesk'},
  softwarecatalog: {slug: 'softwarecatalog', name: 'Stackiq',          category: 'Data',        productHref: '/apps/softwarecatalog', docsHref: 'https://softwarecatalog.conduction.nl', academyHref: '/academy?app=softwarecatalog'},
  larpingapp:      {slug: 'larpingapp',      name: 'Larpinq',          category: 'Processes',   productHref: '/apps/larpingapp',      docsHref: 'https://larpingapp.conduction.nl',      academyHref: '/academy?app=larpingapp'},
  nldesign:        {slug: 'nldesign',        name: 'Thematiq',         category: 'Documents',   productHref: '/apps/nldesign',        docsHref: 'https://nldesign.conduction.nl',        academyHref: '/academy?app=nldesign'},
  shillinq:        {slug: 'shillinq',        name: 'Shillinq',         category: 'Processes',   productHref: '/apps/shillinq',        docsHref: 'https://shillinq.conduction.nl',        academyHref: '/academy?app=shillinq'},
  openbuild:       {slug: 'openbuild',       name: 'Buildiq',          category: 'Processes',   productHref: '/apps/openbuild',       docsHref: 'https://openbuild.conduction.nl',       academyHref: '/academy?app=openbuild'},
  doriath:         {slug: 'doriath',         name: 'Keepiq',           category: 'Connectors',  productHref: '/apps/doriath',         docsHref: 'https://doriath.conduction.nl',         academyHref: '/academy?app=doriath'},
  'app-versions':  {slug: 'app-versions',    name: 'Versioniq',        category: 'Data',        productHref: '/apps/app-versions',    docsHref: 'https://app-versions.conduction.nl',    academyHref: '/academy?app=app-versions'},
  hermiq:          {slug: 'hermiq',          name: 'Hermiq',           category: 'AI',          productHref: '/apps/hermiq',          docsHref: 'https://hermiq.conduction.nl',          academyHref: '/academy?app=hermiq'},
  hrmq:            {slug: 'hrmq',            name: 'Humaniq',          category: 'Processes',   productHref: '/apps/hrmq',            docsHref: 'https://hrmq.conduction.nl',            academyHref: '/academy?app=hrmq'},
  openanonymiser:  {slug: 'openanonymiser',  name: 'Anonymiq',         category: 'Documents',   productHref: '/apps/openanonymiser',  docsHref: 'https://openanonymiser.conduction.nl',  academyHref: '/academy?app=openanonymiser'},
  planix:          {slug: 'planix',          name: 'Planiq',           category: 'Processes',   productHref: '/apps/planix',          docsHref: 'https://planix.conduction.nl',          academyHref: '/academy?app=planix'},
  portaliq:        {slug: 'portaliq',        name: 'Portaliq',         category: 'Processes',   productHref: '/apps/portaliq',        docsHref: 'https://portaliq.conduction.nl',        academyHref: '/academy?app=portaliq'},
  scholiq:         {slug: 'scholiq',         name: 'Learniq',          category: 'Processes',   productHref: '/apps/scholiq',         docsHref: 'https://scholiq.conduction.nl',         academyHref: '/academy?app=scholiq'},
};

/**
 * Map an apps-catalog category to a schema.org applicationCategory.
 * Used by <DetailHero> when emitting SoftwareApplication JSON-LD for
 * AI crawlers. Defaults to BusinessApplication for any unknown
 * category, since every Conduction app fits BusinessApplication in
 * the absence of better signal.
 */
export const SCHEMA_APPLICATION_CATEGORY = {
  Data:        'BusinessApplication',
  Processes:   'BusinessApplication',
  Connectors:  'DeveloperApplication',
  Documents:   'BusinessApplication',
  Dashboards:  'BusinessApplication',
  AI:          'BusinessApplication',
};

/** Resolve an appId to its schema.org applicationCategory. */
export function applicationCategoryFor(slug) {
  const entry = APPS_REGISTRY[slug];
  if (!entry) return 'BusinessApplication';
  return SCHEMA_APPLICATION_CATEGORY[entry.category] || 'BusinessApplication';
}

export const APP_SLUGS = Object.keys(APPS_REGISTRY);

/** Build a label map keyed by slug, suitable for <ContentTypeFilter labels=…/>. */
export const APP_LABELS = APP_SLUGS.reduce((acc, slug) => {
  acc[slug] = APPS_REGISTRY[slug].name;
  return acc;
}, {});

/** Resolve a slug to its registry entry; returns undefined for unknown slugs. */
export function getApp(slug) {
  return APPS_REGISTRY[slug];
}

/** Resolve an array of slugs, dropping any that aren't in the registry. */
export function getApps(slugs = []) {
  return slugs.map(getApp).filter(Boolean);
}

/**
 * Resolve a display-name (e.g. "OpenCatalogi", "Filinq", "LaunchPad")
 * to its product page href, or undefined when the name is not in the
 * registry. Used by partner cards / sidecards to turn the apps-shipped
 * chip row into a clickable link list. Names like "Nextcloud" that
 * aren't ours fall through and the consumer renders a plain span.
 *
 * Match is case-insensitive on both name and slug so consumers can
 * pass either form ("OpenCatalogi", "opencatalogi", or "OpenCATALOGI")
 * without each adding their own normalisation.
 */
export function appHrefByName(name) {
  if (!name) return undefined;
  const target = String(name).toLowerCase();
  for (const slug of APP_SLUGS) {
    const entry = APPS_REGISTRY[slug];
    if (slug === target || entry.name.toLowerCase() === target) {
      return entry.productHref;
    }
  }
  return undefined;
}
