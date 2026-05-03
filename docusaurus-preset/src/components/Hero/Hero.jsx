/**
 * <Hero />
 *
 * Two-column landing hero. Left column: optional eyebrow, headline,
 * lede paragraph, CTA cluster with optional inline meta. Right column:
 * children (typically a cn-platform diagram, but anything fits).
 *
 * Mirrors preview/components/hero.html in the design-system kit.
 *
 * Usage in MDX:
 *
 *   <Hero
 *     eyebrow="Open-source · MIT · No lock-in"
 *     title={<>Make <span className="next-blue">Nextcloud</span> your workspace.</>}
 *     lede="ConNext brings data, processes, AI, and integrations to your Nextcloud."
 *     primaryCta={{ label: "Install from Nextcloud app store", href: "/install" }}
 *     secondaryCta={{ label: "Get a demo via a partner", href: "/partners" }}
 *     meta={{ primary: "2-minute install", secondary: "requires admin on your instance" }}
 *   >
 *     <cn-platform ground>...</cn-platform>
 *   </Hero>
 */

import React, {useEffect} from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import styles from './Hero.module.css';

export default function Hero({
  eyebrow,
  title,
  lede,
  primaryCta,
  secondaryCta,
  meta,
  children,
}) {
  const isBrowser = useIsBrowser();

  /* Lazy-register the diagrams web components on the client so any
     <cn-*> elements passed as children render. The import is no-op
     once registered (customElements.define guards). */
  useEffect(() => {
    if (isBrowser) {
      import('@conduction/diagrams').catch(() => {
        /* package may not be installed in non-Conduction sites; that's OK */
      });
    }
  }, [isBrowser]);

  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        {eyebrow && (
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowHex} aria-hidden="true"></span>
            {eyebrow}
          </div>
        )}
        {title && <h1 className={styles.title}>{title}</h1>}
        {lede && <p className={styles.lede}>{lede}</p>}

        {(primaryCta || secondaryCta || meta) && (
          <div className={styles.ctas}>
            {primaryCta && (
              <a href={primaryCta.href || '#'} className={`${styles.btn} ${styles.btnPrimary}`}>
                {primaryCta.label}
              </a>
            )}
            {secondaryCta && (
              <a href={secondaryCta.href || '#'} className={`${styles.btn} ${styles.btnSecondary}`}>
                {secondaryCta.label} →
              </a>
            )}
            {meta && (
              <div className={styles.meta}>
                {meta.primary && <strong>{meta.primary}</strong>}
                {meta.secondary && <span>{meta.secondary}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.visual}>
        {children}
      </div>
    </section>
  );
}
