/**
 * Brand Navbar swizzle.
 *
 * Replaces Docusaurus's default Infima navbar with the Conduction
 * top-navbar pattern: brand wordmark + nav links + locale + chrome.
 * Navigation items come from themeConfig.navbar.items (configured by
 * the consuming site); the chrome (typography, spacing, brand citation)
 * stays locked in this component.
 *
 * Brand wordmark switches based on pathname so a single Conduction hub
 * can host vanity sub-brand entry points:
 *
 *   /connext, /nl/connext           → "Con<Next>" with next-blue accent
 *   /commonground, /nl/commonground → "Common <Ground>" with cg-yellow accent
 *   anything else                   → navbar.title (e.g. "Conduction")
 *
 * The home link follows the brand: clicking the wordmark while on a
 * sub-brand section keeps you in that section. Outside a sub-brand
 * section it goes to the site root.
 *
 * Item types the brand navbar recognises (sites declare them in
 * docusaurus.config.js → themeConfig.navbar.items):
 *
 *   { type: 'doc', label, to }                       internal doc link
 *   { type: 'link', label, to | href }               internal/external link
 *   { type: 'localeDropdown' }                       Docusaurus locale switcher
 *   { type: 'custom-github', href }                  icon-only GitHub mark
 *   { type: 'custom-apiDocs', label?, to }           icon + "API Documentation"
 *   { type: 'custom-versionPill', prefix? }          "Stable · v{x.y.z}" pill
 *                                                    reads customFields.appVersion;
 *                                                    hidden when no version
 *
 * The `custom-` prefix is required so Docusaurus's themeConfig schema
 * validator passes (`@docusaurus/theme-classic` rejects unknown bare
 * type names). The swizzle below accepts both the prefixed and the
 * bare names so 2.7.0-beta.1 sites that wired the bare names keep
 * working after the upgrade.
 *
 * The pill prefix defaults to "Stable" but can be overridden per site
 * (e.g. prefix="Beta" while on a pre-1.0 release line).
 *
 * Below 996px the link row and the right-hand chrome collapse into a
 * hamburger that opens a full-screen drawer holding the same items —
 * section links stacked, locale switcher, CTAs as full-width buttons.
 * Every item type renders in both places, so a site that adds an item
 * to themeConfig gets it on mobile without further wiring.
 *
 * Mirrors preview/components/top-navbar.html in the design-system kit.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useThemeConfig} from '@docusaurus/theme-common';
import {translate} from '@docusaurus/Translate';
import LocaleDropdownNavbarItem from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import ThemedImage from '@theme/ThemedImage';
import {brandFor, productWordmark, deriveStability} from '../brand.jsx';
import {ICONS} from '../../components/primitives/icons';
import styles from './styles.module.css';

/**
 * Width at which the navbar swaps the inline link row for the
 * hamburger + drawer. Kept in sync by hand with the `@media` block in
 * styles.module.css — the JS needs it too, to close a drawer that is
 * still open when the viewport grows back past the breakpoint (a
 * tablet rotating to landscape, a desktop window being widened), which
 * would otherwise leave a full-screen overlay stuck over a desktop
 * layout with no visible way out.
 */
const MOBILE_BREAKPOINT = 996;

/**
 * Brand-specific navbar item types live under the `custom-` prefix
 * because Docusaurus's themeConfig validator (Joi schema in
 * @docusaurus/theme-classic) rejects unknown top-level types. The
 * `custom-` namespace is the documented escape hatch: items prefixed
 * with `custom-` bypass schema validation and are passed through to
 * the theme as-is. The brand Navbar then dispatches on them below.
 *
 * Sites may also use the bare names (`github`, `apiDocs`,
 * `versionPill`) — they render identically here but Docusaurus will
 * reject the config at load time. Accept both forms so the migration
 * from 2.7.0-beta.1 to .beta.2 doesn't break sites that already
 * configured the bare names.
 */
function typeIs(item, kind) {
  return item.type === kind || item.type === 'custom-' + kind;
}

/** Shared active-route test for internal links (navbar row + drawer). */
function isActiveRoute(to, location) {
  return !!to && (location?.pathname === to ||
                  location?.pathname?.startsWith(to + '/'));
}

/**
 * Render a single navbar item. The brand navbar supports a small
 * subset of Docusaurus item types plus the three brand-specific types
 * (github, apiDocs, versionPill); everything else falls back to a
 * plain link for forward-compatibility.
 */
function NavItem({item, location, appVersion}) {
  if (item.type === 'localeDropdown') {
    /* The globe sits beside Docusaurus' own dropdown rather than inside
       it: LocaleDropdownNavbarItem renders its own markup and takes no
       icon, and the mark belongs to the control as a whole. `.localeWrapper`
       lays the two out as one chip. */
    return (
      <div className={styles.localeWrapper}>
        <span className={styles.localeGlobe} aria-hidden="true">{ICONS.globe}</span>
        <LocaleDropdownNavbarItem mobile={false} {...item} />
      </div>
    );
  }

  /* GitHub: icon-only link with an accessible label. The aria-label
     gives screen-readers + browser tooltips a name without rendering
     a visible text label in the navbar. */
  if (typeIs(item, 'github')) {
    return (
      <a
        href={item.href || 'https://codeberg.org/Conduction'}
        className={styles.iconLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item['aria-label'] || translate({id: 'preset.navbar.github.ariaLabel', message: 'GitHub repository', description: 'Default accessible label for the icon-only GitHub link in the navbar'})}
        title="GitHub"
      >
        <span className={styles.iconGlyph} aria-hidden="true">{ICONS.github}</span>
      </a>
    );
  }

  /* API Documentation: icon + label link. Target defaults to /api
     (the Redocusaurus mount point used by every Conduction docs site).
     Sites can override via `to` or `href`. */
  if (typeIs(item, 'apiDocs')) {
    const label = item.label || translate({id: 'preset.navbar.apiDocs.label', message: 'API Documentation', description: 'Default label for the API Documentation navbar link when the consuming site does not set one'});
    const to = item.to || '/api';
    const href = item.href;
    const isActive = !href && isActiveRoute(to, location);
    const className = `${styles.link} ${styles.iconLabelLink} ${isActive ? styles.linkActive : ''}`;
    const content = (
      <>
        <span className={styles.iconGlyph} aria-hidden="true">{ICONS.apiDocs}</span>
        {label}
      </>
    );
    if (href) {
      return <a href={href} className={className} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{content}</a>;
    }
    return <Link to={to} className={className}>{content}</Link>;
  }

  /* Version pill: code-typeface "{Stability} · v{version}" chip.
     Source is customFields.appVersion (set by createConfig() from
     appinfo/info.xml or package.json). The maturity prefix
     (Stable/Beta/RC/Alpha) is auto-derived from the SemVer string —
     `0.1.0` → Beta, `1.0.0-rc.2` → RC, `1.2.3` → Stable. Sites can
     still pass an explicit `prefix` to override. Hidden when no
     version is available so sites without an app version (Hydra,
     design-system itself) get a clean navbar instead of an empty
     pill. */
  if (typeIs(item, 'versionPill')) {
    if (!appVersion) return null;
    const prefix = item.prefix || deriveStability(appVersion);
    return (
      <span className={styles.versionPill} title={`${prefix} · v${appVersion}`}>
        {prefix} · v{appVersion}
      </span>
    );
  }

  /* External link, no React-router prefetch */
  if (item.href && !item.to) {
    const isCta = item.cta === true;
    return (
      <a
        href={item.href}
        className={isCta ? styles.cta : styles.ghost}
        target={item.href.startsWith('http') ? '_blank' : undefined}
        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {item.label}{isCta && ' →'}
      </a>
    );
  }

  /* Internal route */
  if (item.to) {
    const isCta = item.cta === true;
    const isActive = isActiveRoute(item.to, location);
    return (
      <Link
        to={item.to}
        className={
          isCta
            ? styles.cta
            : `${styles.link} ${isActive ? styles.linkActive : ''}`
        }
      >
        {item.label}{isCta && ' →'}
      </Link>
    );
  }

  return null;
}

/**
 * Drawer rendering of the same item. Every type the navbar row
 * understands has a stacked equivalent, so nothing silently disappears
 * on a phone:
 *
 *   section link   → full-width row, active state in orange
 *   cta / ghost    → full-width button at the foot of the panel
 *   localeDropdown → Docusaurus's own mobile (collapsible) dropdown
 *   github         → labelled row; an icon-only target reads as
 *                    decoration once it is out of the navbar's context
 *   apiDocs        → labelled row with its icon
 *   versionPill    → the pill, in the drawer's meta strip
 *
 * `onNavigate` closes the drawer. Internal <Link>s need it explicitly:
 * the route effect in Navbar() closes on a pathname change, but a link
 * to the page you are already on changes nothing to react to.
 */
function DrawerItem({item, location, appVersion, onNavigate}) {
  if (item.type === 'localeDropdown') {
    /* Docusaurus's mobile dropdown renders an <li> and relies on
       Infima's `menu__*` classes, so it needs a <ul class="menu__list">
       to sit in. `onClick` is forwarded to the locale entries so
       picking a language closes the drawer. */
    return (
      <ul className={`menu__list ${styles.drawerLocale}`}>
        <LocaleDropdownNavbarItem mobile {...item} onClick={onNavigate} />
      </ul>
    );
  }

  if (typeIs(item, 'versionPill')) {
    if (!appVersion) return null;
    const prefix = item.prefix || deriveStability(appVersion);
    return <span className={styles.versionPill}>{prefix} · v{appVersion}</span>;
  }

  if (typeIs(item, 'github')) {
    return (
      <a
        href={item.href || 'https://codeberg.org/Conduction'}
        className={styles.drawerMetaLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
      >
        <span className={styles.iconGlyph} aria-hidden="true">{ICONS.github}</span>
        GitHub
      </a>
    );
  }

  if (typeIs(item, 'apiDocs')) {
    const label = item.label || translate({id: 'preset.navbar.apiDocs.label', message: 'API Documentation', description: 'Default label for the API Documentation navbar link when the consuming site does not set one'});
    const to = item.to || '/api';
    const href = item.href;
    const content = (
      <>
        <span className={styles.iconGlyph} aria-hidden="true">{ICONS.apiDocs}</span>
        {label}
      </>
    );
    if (href) {
      return (
        <a
          href={href}
          className={styles.drawerLink}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          onClick={onNavigate}
        >
          {content}
        </a>
      );
    }
    return (
      <Link to={to} className={styles.drawerLink} onClick={onNavigate}>
        {content}
      </Link>
    );
  }

  const isCta = item.cta === true;

  /* External link, no React-router prefetch */
  if (item.href && !item.to) {
    return (
      <a
        href={item.href}
        className={isCta ? styles.drawerCta : styles.drawerLink}
        target={item.href.startsWith('http') ? '_blank' : undefined}
        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        onClick={onNavigate}
      >
        {item.label}{isCta && ' →'}
      </a>
    );
  }

  /* Internal route */
  if (item.to) {
    const isActive = isActiveRoute(item.to, location);
    return (
      <Link
        to={item.to}
        className={
          isCta
            ? styles.drawerCta
            : `${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`
        }
        aria-current={isActive && !isCta ? 'page' : undefined}
        onClick={onNavigate}
      >
        {item.label}{isCta && ' →'}
      </Link>
    );
  }

  return null;
}

export default function Navbar() {
  const {navbar} = useThemeConfig();
  const {siteConfig} = useDocusaurusContext();
  const appVersion = siteConfig?.customFields?.appVersion;
  const location = useLocation();
  const items = navbar.items || [];
  const brand = brandFor(location.pathname, navbar.title);

  /* Mobile drawer. Below the desktop breakpoint the whole primary
     navigation moves into a drawer, rather than being allowed to
     overflow the bar: at 390px the inline bar needs about 571px, so
     the trailing items used to land off-screen with no way to reach
     them (the site clips horizontal overflow, so they were not even
     scrollable). Everything goes in, links and CTAs both, because the
     bar has to fit an unknown number of items on an unknown wordmark
     length. */
  /* Drawer state. Starts closed on server and client alike so the
     first client render matches the SSR'd HTML; anything derived from
     `window` here would hydrate-mismatch. */
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef(null);
  const drawerRef = useRef(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  /* Close on route change. A <Link> inside the drawer swaps the page
     underneath without unmounting the navbar, so without this the
     panel would stay parked over the page the visitor just asked for. */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* While open: lock the page behind the panel, close on Escape, and
     keep Tab inside it. The overlay is opaque and full-screen, so a
     focus ring wandering onto the page behind would be invisible — a
     keyboard visitor would be tabbing through links they cannot see. */
  useEffect(() => {
    if (!menuOpen) return undefined;

    const {body} = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        burgerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    /* Grow past the breakpoint with the panel open (rotation, a
       widened desktop window) and the hamburger that opened it is gone
       — drop the overlay rather than trapping the visitor under it. */
    const media = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT + 1}px)`);
    const onMediaChange = (event) => { if (event.matches) closeMenu(); };

    document.addEventListener('keydown', onKeyDown);
    media.addEventListener('change', onMediaChange);
    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      media.removeEventListener('change', onMediaChange);
    };
  }, [menuOpen, closeMenu]);

  /* Wordmark resolution order:
     1. ConNext / Common Ground sub-brand → custom JSX (Con<Next>, …)
     2. Conduction product app (Open*, Docu*, My*, …) → prefix-light
        treatment: cobalt-400 prefix + blue-cobalt rest, matching the
        preview/apps.html convention.
     3. Plain text title (single-word wordmark or unrecognised prefix). */
  let wordmark;
  if (brand) {
    wordmark = brand.wordmark;
  } else {
    const split = productWordmark(navbar.title, navbar.brandPrefix);
    wordmark = split ? (
      <>
        <span className={styles.wordmarkPrefix}>{split.prefix}</span>{split.rest}
      </>
    ) : navbar.title;
  }

  /* Path-match: keep the visitor in the sub-brand section on logo click.
     Title-match (the site's primary brand IS a sub-brand): logo goes to
     site root since the section IS the site. */
  const homeHref = brand?.source === 'path' ? brand.home : '/';

  /* App icon. The brand rule is that every product navbar shows the
     app's hex-glyph next to the wordmark. The icon is sourced from
     navbar.logo (createConfig defaults it to img/logo.svg, which every
     Conduction docs site ships under static/img/). Sites can opt the
     icon out by passing `logo: null` in their navbar config.

     `useBaseUrl` resolves the src against the site's configured
     baseUrl — without it, a relative `img/app-logo.svg` resolves
     against the current page's path, so the icon 404s on every
     sub-route (e.g. /docs/intro/img/app-logo.svg). */
  const logoSrcRaw = navbar.logo?.src;
  const logoSrcDarkRaw = navbar.logo?.srcDark;
  const logoSrc = useBaseUrl(logoSrcRaw || '');
  const logoSrcDark = useBaseUrl(logoSrcDarkRaw || logoSrcRaw || '');
  const logoAlt = navbar.logo?.alt || translate(
    {id: 'preset.navbar.logoAlt', message: '{title} avatar', description: 'Default alt text for the navbar logo. {title} is the site title.'},
    {title: navbar.title},
  );

  /* Split into "left links" (regular nav) and "right CTAs" (locale,
     external links, install button, GitHub icon, version pill).
     Items default to the left unless they explicitly carry
     position="right" — but the three brand-specific item types
     (github, apiDocs, versionPill) live on the right by convention,
     mirroring the docs-shell mock. */
  const RIGHT_TYPES = new Set([
    'localeDropdown',
    'github', 'custom-github',
    'apiDocs', 'custom-apiDocs',
    'versionPill', 'custom-versionPill',
  ]);
  const leftItems = items.filter(i => i.position !== 'right' && !RIGHT_TYPES.has(i.type));
  const rightItems = items.filter(i => i.position === 'right' || RIGHT_TYPES.has(i.type));

  /* The drawer orders the right-hand chrome differently from the
     navbar row: "actions" (the Install CTA, external links, API docs)
     become full-width buttons under the thumb, while "meta" (locale
     switcher, version pill, GitHub) drops into a quieter strip below
     them. Same items, priority suited to a phone. */
  const META_TYPES = new Set([
    'localeDropdown',
    'github', 'custom-github',
    'versionPill', 'custom-versionPill',
  ]);
  /* Only a CTA belongs in the actions block. Partners, API docs and anything
     else on the right of the bar is a destination, not another way to do the
     thing Install does — sitting them side by side as two full-width buttons
     read as a choice between equals. They join the links above instead, and
     the actions block holds the one thing the drawer wants you to do. */
  const drawerActions = rightItems.filter(i => !META_TYPES.has(i.type) && i.cta === true);
  const drawerExtraLinks = rightItems.filter(i => !META_TYPES.has(i.type) && i.cta !== true);
  const drawerMeta = rightItems.filter(i => META_TYPES.has(i.type));

  /* `logo.srcDark` is Docusaurus' own convention and createConfig() has
     always set it, but this swizzle only ever read `src` — so the dark
     wordmark every site declared has never rendered. ThemedImage follows
     data-theme rather than the OS, so it also holds on a site with a
     colour-mode toggle, and it emits both sources during SSR with one
     hidden by class (see the :only-of-type note in the stylesheet, which
     keeps that hiding from being overridden). */
  const logo = logoSrcRaw ? (
    logoSrcDarkRaw ? (
      <ThemedImage
        sources={{light: logoSrc, dark: logoSrcDark}}
        alt={logoAlt}
        className={styles.wordmarkIcon}
        width="32"
        height="32"
      />
    ) : (
      <img
        src={logoSrc}
        alt={logoAlt}
        className={styles.wordmarkIcon}
        width="32"
        height="32"
      />
    )
  ) : null;

  return (
    /* `navbar` (Docusaurus's framework class) is added alongside the
       brand styles.nav so the internal scroll-anchor offset query
       `document.querySelector('.navbar').clientHeight` resolves. The
       previous JS-only class swizzle made every doc page crash with
       "Cannot read properties of null (reading 'clientHeight')" the
       moment Docusaurus ran its anchor logic on a heading scroll. */
    <>
      <nav className={`navbar ${styles.nav}`} role="navigation" aria-label="Main">
        <div className={styles.left}>
          <Link to={homeHref} className={styles.wordmark}>
            {logo}
            <span className={styles.wordmarkText}>{wordmark}</span>
          </Link>
          <div className={styles.links}>
            {leftItems.map((item, i) => (
              <NavItem key={i} item={item} location={location} appVersion={appVersion} />
            ))}
          </div>
        </div>
        <div className={styles.ctas}>
          {rightItems.map((item, i) => (
            <NavItem key={i} item={item} location={location} appVersion={appVersion} />
          ))}
        </div>
        <button
          ref={burgerRef}
          type="button"
          className={styles.burger}
          aria-label={translate({id: 'preset.navbar.menu.open', message: 'Open menu', description: 'Accessible label for the button that opens the mobile navigation drawer'})}
          aria-expanded={menuOpen}
          aria-controls="conduction-navbar-drawer"
          onClick={() => setMenuOpen(true)}
        >
          <span className={styles.burgerGlyph} aria-hidden="true">{ICONS.menu}</span>
        </button>
      </nav>

      {menuOpen && (
        /* Sibling of <nav>, not a child: the nav is a sticky, z-indexed
           stacking context, and a fixed overlay nested inside it would
           be confined to that context — layered against the navbar's
           own neighbours instead of over the whole page. */
        <div
          id="conduction-navbar-drawer"
          ref={drawerRef}
          className={styles.drawer}
          role="dialog"
          aria-modal="true"
          aria-label={translate({id: 'preset.navbar.menu.label', message: 'Site menu', description: 'Accessible label for the mobile navigation drawer'})}
        >
          <div className={styles.drawerHeader}>
            <Link to={homeHref} className={styles.wordmark} onClick={closeMenu}>
              {logo}
              <span className={styles.wordmarkText}>{wordmark}</span>
            </Link>
            {/* Focus lands here on open: the first stop inside the
                panel, and the way straight back out for anyone who
                opened it by accident. */}
            <button
              type="button"
              className={styles.burger}
              aria-label={translate({id: 'preset.navbar.menu.close', message: 'Close menu', description: 'Accessible label for the button that closes the mobile navigation drawer'})}
              onClick={() => { closeMenu(); burgerRef.current?.focus(); }}
              autoFocus
            >
              <span className={styles.burgerGlyph} aria-hidden="true">{ICONS.close}</span>
            </button>
          </div>

          <div className={styles.drawerBody}>
            {(leftItems.length > 0 || drawerExtraLinks.length > 0) && (
              <div className={styles.drawerLinks}>
                {leftItems.map((item, i) => (
                  <DrawerItem key={`l${i}`} item={item} location={location} appVersion={appVersion} onNavigate={closeMenu} />
                ))}
                {drawerExtraLinks.map((item, i) => (
                  <DrawerItem key={`r${i}`} item={item} location={location} appVersion={appVersion} onNavigate={closeMenu} />
                ))}
              </div>
            )}

            {drawerActions.length > 0 && (
              <div className={styles.drawerActions}>
                {drawerActions.map((item, i) => (
                  <DrawerItem key={i} item={item} location={location} appVersion={appVersion} onNavigate={closeMenu} />
                ))}
              </div>
            )}

            {drawerMeta.length > 0 && (
              <div className={styles.drawerMeta}>
                {drawerMeta.map((item, i) => (
                  <DrawerItem key={i} item={item} location={location} appVersion={appVersion} onNavigate={closeMenu} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
