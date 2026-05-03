/**
 * <CtaBanner />
 *
 * Cobalt-900 marketing panel with a centred title, lede, and a
 * primary + secondary CTA pair. Used at the bottom of marketing
 * pages ("Ready to install?", "Pick an app. Install it. Done.").
 *
 * Mirrors the cta-banner section in preview/pages/landing.html and
 * the .cta-banner mock in preview/components.html.
 *
 * Usage in MDX:
 *
 *   <CtaBanner
 *     title="Pick an app. Install it. Done."
 *     lede={<>Drop OpenCatalogi into your <span className="next-blue">Nextcloud</span> in two minutes.</>}
 *     primaryCta={{ label: "Install from app store", href: "/apps" }}
 *     secondaryCta={{ label: "Get a demo via a partner", href: "/partners" }}
 *   />
 */

import React, {useEffect} from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import styles from './CtaBanner.module.css';

export default function CtaBanner({
  title,
  lede,
  primaryCta,
  secondaryCta,
}) {
  const isBrowser = useIsBrowser();

  /* Hydrate the conduction-bg honeycomb pattern on the client. The
     module is loaded site-side via a <link>+<script> in <Head>; here
     we just ask the existing hydrator to scan for any new mounts. */
  useEffect(() => {
    if (isBrowser && typeof window !== 'undefined' && window.ConductionBg?.hydrate) {
      window.ConductionBg.hydrate();
    }
  }, [isBrowser]);

  return (
    <section className={styles.section}>
      <div className={styles.banner}>
        <div className={styles.bg} aria-hidden="true">
          <div className="conduction-bg" />
        </div>
        {title && <h2 className={styles.title}>{title}</h2>}
        {lede && <p className={styles.lede}>{lede}</p>}

        {(primaryCta || secondaryCta) && (
          <div className={styles.actions}>
            {primaryCta && (
              <a href={primaryCta.href || '#'} className={styles.primary}>
                {primaryCta.label}
              </a>
            )}
            {secondaryCta && (
              <a href={secondaryCta.href || '#'} className={styles.secondary}>
                {secondaryCta.label}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
