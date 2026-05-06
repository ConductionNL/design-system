/**
 * <FAQ /> + <FAQItem />
 *
 * FAQ accordion ported from preview/pages/support.html (.faq, .faq details).
 * Native <details>/<summary> for keyboard, screen-reader, and no-JS support.
 * One question expands at a time on click; users can have several open.
 *
 * Usage:
 *
 *   <FAQ title="FAQ.">
 *     <FAQItem question="If the apps are free, what does support cost?" defaultOpen>
 *       Whatever the partner you pick charges. Conduction sets no minimum…
 *     </FAQItem>
 *     <FAQItem question="Why doesn't Conduction sell support directly?">
 *       Two reasons. First…
 *     </FAQItem>
 *   </FAQ>
 */

import React from 'react';
import styles from './FAQ.module.css';

export function FAQItem({question, defaultOpen, children, className}) {
  return (
    <details className={[styles.item, className].filter(Boolean).join(' ')} open={defaultOpen || undefined}>
      <summary className={styles.summary}>{question}</summary>
      {/* div not p: MDX wraps inline children in its own <p>, which would
          be invalid nested inside another <p>. */}
      <div className={styles.body}>{children}</div>
    </details>
  );
}

export default function FAQ({title = 'FAQ.', children, className}) {
  const composed = [styles.faq, className].filter(Boolean).join(' ');
  return (
    <section className={composed}>
      {title && <h2 className={styles.heading}>{title}</h2>}
      {children}
    </section>
  );
}
