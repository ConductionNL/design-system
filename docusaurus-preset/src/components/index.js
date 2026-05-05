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

/* Atomic primitives, also exported as their own subpath for direct
   `import {HexBullet} from '@conduction/docusaurus-preset/components/primitives';`
   imports if a site only needs the atoms. */
export * from './primitives';

export {default as Hero} from './Hero/Hero.jsx';
export {default as StatsStrip} from './StatsStrip/StatsStrip.jsx';
export {default as CtaBanner} from './CtaBanner/CtaBanner.jsx';
export {default as PlatformOverview} from './PlatformOverview/PlatformOverview.jsx';
export {default as AppsPreview, AppCard} from './AppsPreview/AppsPreview.jsx';

/* Card-family components (Batch 2). Each pairs with a *Grid sibling
   that handles the surrounding layout, so callers can drop a row
   of cards in MDX with a single import. */
export {default as SolutionCard, SolutionGrid} from './SolutionCard/SolutionCard.jsx';
export {default as PartnerCard, PartnerGrid, BecomePartner} from './PartnerCard/PartnerCard.jsx';
export {default as Clients, DEFAULT_CLIENTS, DEFAULT_PARTNERS} from './Clients/Clients.jsx';
export {default as ReferenceCard, ReferenceGrid} from './ReferenceCard/ReferenceCard.jsx';
export {default as PairCard, PairRow} from './PairCard/PairCard.jsx';
export {default as FeatureList, FeatureItem} from './FeatureList/FeatureList.jsx';
export {default as HowSteps, HowStep} from './HowSteps/HowSteps.jsx';
export {default as EmployeeCard, TeamGrid} from './EmployeeCard/EmployeeCard.jsx';
export {default as DetailHero} from './DetailHero/DetailHero.jsx';
export {default as ConductionBg} from './ConductionBg/ConductionBg.jsx';
export {default as PlatformDiagram} from './PlatformDiagram/PlatformDiagram.jsx';
export {default as HexRain} from './HexRain/HexRain.jsx';
export {default as Pipeline, PipelineStep, IconList} from './Pipeline/Pipeline.jsx';
export {default as FacetedFilters, FilterChip} from './FacetedFilters/FacetedFilters.jsx';
export {default as CookieCli} from './CookieCli/CookieCli.jsx';
export {default as GameModal} from './GameModal/GameModal.jsx';

/* Diagram-set web-component React wrappers (cn-hex, cn-hex-prism,
   cn-platform, cn-domain-tree, cn-pipeline, cn-side-box, cn-honeycomb-bg).
   Type-checked, autocompletable React surface for the framework-agnostic
   diagram set in @conduction/diagrams. The bare web components still
   work in plain HTML; the wrappers are the React-friendly version. */
export {Hex, HexPrism, Platform, DomainTree, DiagramPipeline, SideBox, HoneycombBg} from './Diagrams/Diagrams.jsx';
export {default as ComposeBlock} from './ComposeBlock/ComposeBlock.jsx';
export {default as AppsGrid} from './AppsGrid/AppsGrid.jsx';
export {default as AppMock} from './AppMock/AppMock.jsx';
export {default as HexNetwork} from './HexNetwork/HexNetwork.jsx';
export {default as Showcase} from './Showcase/Showcase.jsx';
export {default as RotatingCards} from './RotatingCards/RotatingCards.jsx';
export {default as HexBackground} from './HexBackground/HexBackground.jsx';
export {default as AgentTrace} from './AgentTrace/AgentTrace.jsx';
export {default as FeatureGrid, FeatureGridGroup, FeatureItem as FeatureGridItem} from './FeatureGrid/FeatureGrid.jsx';
