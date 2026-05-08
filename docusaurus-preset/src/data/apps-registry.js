/**
 * @conduction/docusaurus-preset/data/apps-registry
 *
 * URL-only registry of every public Conduction app. Single source of
 * truth for cross-linking between the three surfaces a visitor lands
 * on while learning about an app:
 *
 *   1. /apps/<slug>                  product detail page
 *   2. https://docs.conduction.nl/<slug>     documentation site (lives
 *      in the app's own repo, served from a per-app subfolder under
 *      the central docs.conduction.nl Docusaurus install)
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
 *   - docsHref:     https://docs.conduction.nl/<slug>
 *   - academyHref:  /academy?app=<slug>
 * Override any of the three when an app deviates from the convention
 * (none today; the convention holds).
 */

export const APPS_REGISTRY = {
  opencatalogi:    {slug: 'opencatalogi',    name: 'OpenCatalogi',     productHref: '/apps/opencatalogi',    docsHref: 'https://docs.conduction.nl/opencatalogi',    academyHref: '/academy?app=opencatalogi'},
  openregister:    {slug: 'openregister',    name: 'OpenRegister',     productHref: '/apps/openregister',    docsHref: 'https://docs.conduction.nl/openregister',    academyHref: '/academy?app=openregister'},
  openconnector:   {slug: 'openconnector',   name: 'OpenConnector',    productHref: '/apps/openconnector',   docsHref: 'https://docs.conduction.nl/openconnector',   academyHref: '/academy?app=openconnector'},
  docudesk:        {slug: 'docudesk',        name: 'DocuDesk',         productHref: '/apps/docudesk',        docsHref: 'https://docs.conduction.nl/docudesk',        academyHref: '/academy?app=docudesk'},
  mydash:          {slug: 'mydash',          name: 'MyDash',           productHref: '/apps/mydash',          docsHref: 'https://docs.conduction.nl/mydash',          academyHref: '/academy?app=mydash'},
  openwoo:         {slug: 'openwoo',         name: 'OpenWoo',          productHref: '/apps/openwoo',         docsHref: 'https://docs.conduction.nl/openwoo',         academyHref: '/academy?app=openwoo'},
  zaakafhandelapp: {slug: 'zaakafhandelapp', name: 'ZaakAfhandelApp',  productHref: '/apps/zaakafhandelapp', docsHref: 'https://docs.conduction.nl/zaakafhandelapp', academyHref: '/academy?app=zaakafhandelapp'},
  pipelinq:        {slug: 'pipelinq',        name: 'PipelinQ',         productHref: '/apps/pipelinq',        docsHref: 'https://docs.conduction.nl/pipelinq',        academyHref: '/academy?app=pipelinq'},
  procest:         {slug: 'procest',         name: 'Procest',          productHref: '/apps/procest',         docsHref: 'https://docs.conduction.nl/procest',         academyHref: '/academy?app=procest'},
  decidesk:        {slug: 'decidesk',        name: 'DeciDesk',         productHref: '/apps/decidesk',        docsHref: 'https://docs.conduction.nl/decidesk',        academyHref: '/academy?app=decidesk'},
  softwarecatalog: {slug: 'softwarecatalog', name: 'SoftwareCatalog',  productHref: '/apps/softwarecatalog', docsHref: 'https://docs.conduction.nl/softwarecatalog', academyHref: '/academy?app=softwarecatalog'},
  larpingapp:      {slug: 'larpingapp',      name: 'LarpingApp',       productHref: '/apps/larpingapp',      docsHref: 'https://docs.conduction.nl/larpingapp',      academyHref: '/academy?app=larpingapp'},
  nldesign:        {slug: 'nldesign',        name: 'NLDesign',         productHref: '/apps/nldesign',        docsHref: 'https://docs.conduction.nl/nldesign',        academyHref: '/academy?app=nldesign'},
};

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
