/**
 * @conduction/docusaurus-preset/components
 *
 * Public React components for use in MDX, JSX pages, and theme
 * swizzles. Each component mirrors a section in the design-system
 * kit (preview/components/<name>.html) so the visual is the source
 * of truth and the React code follows.
 *
 * Usage in MDX:
 *
 *   import { Hero, StatsStrip, CtaBanner } from '@conduction/docusaurus-preset/components';
 *
 *   <Hero
 *     eyebrow="Twelve open-source apps · one Nextcloud"
 *     title="Install your stack."
 *     subtitle="In two minutes."
 *     primaryCta={{label: "Install from Nextcloud app store"}}
 *   />
 *
 *   <StatsStrip stats={[{value: '24', label: 'apps'}, ...]} />
 *
 *   <CtaBanner title="Ready to install?" />
 */

export {default as Hero} from './Hero/Hero.jsx';
export {default as StatsStrip} from './StatsStrip/StatsStrip.jsx';
export {default as CtaBanner} from './CtaBanner/CtaBanner.jsx';
export {default as PlatformOverview} from './PlatformOverview/PlatformOverview.jsx';
export {default as AppsPreview, AppCard} from './AppsPreview/AppsPreview.jsx';
