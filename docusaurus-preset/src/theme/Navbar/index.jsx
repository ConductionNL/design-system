/**
 * Brand Navbar swizzle.
 *
 * Replaces Docusaurus's default Infima navbar with the Conduction
 * top-navbar pattern: brand wordmark + nav links + Partners + Install.
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
 * Mirrors preview/components/top-navbar.html in the design-system kit.
 */

import React from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import {useThemeConfig} from '@docusaurus/theme-common';
import LocaleDropdownNavbarItem from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import {brandFor} from '../brand.jsx';
import styles from './styles.module.css';

/**
 * Render a single navbar item. The brand top-navbar supports a small
 * subset of Docusaurus item types (link, locale dropdown, optional
 * primary CTA via items[].cta = true). Everything else falls back to
 * a plain link for forward-compatibility.
 */
function NavItem({item, location}) {
  if (item.type === 'localeDropdown') {
    return (
      <div className={styles.localeWrapper}>
        <LocaleDropdownNavbarItem mobile={false} {...item} />
      </div>
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
    const isActive = location?.pathname === item.to ||
                     location?.pathname?.startsWith(item.to + '/');
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

export default function Navbar() {
  const {navbar} = useThemeConfig();
  const location = useLocation();
  const items = navbar.items || [];
  const brand = brandFor(location.pathname, navbar.title);
  const wordmark = brand ? brand.wordmark : navbar.title;
  /* Path-match: keep the visitor in the sub-brand section on logo click.
     Title-match (the site's primary brand IS a sub-brand): logo goes to
     site root since the section IS the site. */
  const homeHref = brand?.source === 'path' ? brand.home : '/';

  /* Split into "left links" (regular nav) and "right CTAs" (locale,
     external links, install button). The brand pattern groups them
     this way; consumers control order via item.position. */
  const leftItems = items.filter(i => i.position !== 'right' && i.type !== 'localeDropdown');
  const rightItems = items.filter(i => i.position === 'right' || i.type === 'localeDropdown');

  return (
    <nav className={styles.nav} role="navigation" aria-label="Main">
      <div className={styles.left}>
        <Link to={homeHref} className={styles.wordmark}>
          {wordmark}
        </Link>
        <div className={styles.links}>
          {leftItems.map((item, i) => (
            <NavItem key={i} item={item} location={location} />
          ))}
        </div>
      </div>
      <div className={styles.ctas}>
        {rightItems.map((item, i) => (
          <NavItem key={i} item={item} location={location} />
        ))}
      </div>
    </nav>
  );
}
