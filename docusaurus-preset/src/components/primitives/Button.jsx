/**
 * <Button />
 *
 * Three brand variants (primary / secondary / ghost) used across hero,
 * cta-banner, top-navbar, game-modal, and per-page CTA rows.
 *
 * Renders as <a> when href is provided, <button> otherwise. Inherits
 * the brand transition (140ms ease) and KNVB-orange focus ring from
 * brand.css.
 *
 * Variants:
 *   - primary:    cobalt fill, white text
 *   - secondary:  white bg, cobalt-200 border, cobalt text
 *   - ghost:      plain text + arrow
 *   - on-dark:    primary variant inverted for use inside cobalt CTA panels
 *
 * Usage:
 *
 *   <Button href="/apps">Install</Button>
 *   <Button variant="secondary" href="/partners">Get a demo</Button>
 *   <Button variant="ghost" href="https://github.com/...">View on GitHub →</Button>
 */

import React from 'react';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  href,
  size = 'md',
  className,
  children,
  ...rest
}) {
  const composed = [
    styles.btn,
    styles['v-' + variant],
    styles['s-' + size],
    className,
  ].filter(Boolean).join(' ');

  if (href) {
    return <a href={href} className={composed} {...rest}>{children}</a>;
  }
  return <button type="button" className={composed} {...rest}>{children}</button>;
}
