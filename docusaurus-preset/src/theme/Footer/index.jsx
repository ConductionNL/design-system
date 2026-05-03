/**
 * Brand Footer swizzle.
 *
 * Replaces Docusaurus's default footer with the Conduction footer
 * pattern: cobalt-900 panel, brand block (wordmark + tagline + triad +
 * socials + contact), four-column link grid (Apps · Solutions ·
 * Resources · Conduction), copyright row with KvK + BTW + EUPL.
 *
 * v1 ships the structural footer only. The full canal-and-skyline
 * scene from preview/components/footer.html (boats, swimmer, mini-
 * game, animated water) lives in its own module; we'll port that as
 * a separate <CanalScene /> component once the chrome is solid.
 *
 * Mirrors preview/components/footer.html (link grid + brand tells).
 */

import React from 'react';
import Link from '@docusaurus/Link';
import {useThemeConfig} from '@docusaurus/theme-common';
import styles from './styles.module.css';

function FooterLink({label, href, to}) {
  if (href) {
    const external = href.startsWith('http');
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={styles.link}
      >
        {label}
      </a>
    );
  }
  return <Link to={to} className={styles.link}>{label}</Link>;
}

export default function Footer() {
  const {footer} = useThemeConfig();
  if (!footer) return null;

  const {links = [], copyright} = footer;

  return (
    <footer className={styles.footer} aria-label="Site footer">
      <div className={styles.container}>

        <div className={styles.grid}>

          {/* Brand block, always rendered first */}
          <div className={styles.brand}>
            <div className={styles.wordmark}>
              Con<span className="next-blue">Next</span>
            </div>
            <p className={styles.tagline}>
              Open-source apps for <span className="next-blue">Nextcloud</span>.
              Built and maintained by Conduction in Amsterdam, released under EUPL-1.2.
            </p>
            <div className={styles.triad}>
              <span className={styles.triadHex} aria-hidden="true"></span>
              Conduction · ConNext · <span className="next-blue">Nextcloud</span>
            </div>
            <div className={styles.socials}>
              <a
                href="https://github.com/ConductionNL"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/company/conduction"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                LinkedIn
              </a>
              <a href="mailto:info@conduction.nl" className={styles.socialLink}>
                info@conduction.nl
              </a>
              <a
                href="https://maps.google.com/?q=Lauriergracht+14h+Amsterdam"
                aria-label="Lauriergracht 14h, Amsterdam, open in Google Maps"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                Lauriergracht 14h · Amsterdam
              </a>
            </div>
          </div>

          {/* Link columns from themeConfig.footer.links */}
          {links.map((column, i) => (
            <div key={i} className={styles.column}>
              {column.title && <h4 className={styles.columnTitle}>{column.title}</h4>}
              <ul className={styles.columnList}>
                {(column.items || []).map((item, j) => (
                  <li key={j}>
                    <FooterLink {...item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Copyright row with the Conduction tells */}
        {copyright && (
          <div className={styles.copyright}>
            {copyright}
          </div>
        )}

      </div>
    </footer>
  );
}
