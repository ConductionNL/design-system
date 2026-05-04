/**
 * @conduction/docusaurus-preset/data
 *
 * Build-time access to the ConductionNL app-download stats. The JSON
 * itself is refreshed every weekday by .github/workflows/app-downloads.yml
 * and committed to design-system/data/app-downloads.json.
 *
 * Usage in MDX:
 *
 *   import {totalDownloads, downloadsForApp} from '@conduction/docusaurus-preset/data';
 *
 *   <StatsStrip stats={[
 *     {value: totalDownloads.toLocaleString('en'), label: 'app store downloads'},
 *     ...
 *   ]} />
 *
 *   <DetailHero appId="openregister" ... />   // looks up downloads automatically
 */

import data from '../../../data/app-downloads.json';

export default data;

export const totalDownloads = data.totals.downloads;
export const appsTotal = data.totals.apps_total;
export const appsInStore = data.totals.apps_in_store;
export const generatedAt = data.generated_at;

const byId = new Map(data.apps.map((a) => [a.id, a]));

export function appStats(appId) {
  return byId.get(appId) || null;
}

export function downloadsForApp(appId) {
  const app = byId.get(appId);
  return app && app.github ? app.github.downloads : 0;
}

export function formatDownloads(n, locale = 'en') {
  return Number(n || 0).toLocaleString(locale);
}
