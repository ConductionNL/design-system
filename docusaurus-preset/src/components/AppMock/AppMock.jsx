/**
 * <AppMock />
 *
 * Token-built abstract representation of a Conduction app's canonical
 * view. Used wherever a marketing surface needs to *show* an app without
 * embedding a real screenshot. Reference for the level of abstraction:
 * honeycomb.io/technologies/* — recognisable as the product, never
 * literal.
 *
 * The mock paints with design tokens only (no images, no real text,
 * one orange accent max per variant). When you add a new app, follow
 * SKILL.md "App glyphs" and "Status palette" — same mint = stable,
 * KNVB orange = beta, mint hex = primary action confirmation.
 *
 * Usage:
 *
 *   <AppMock app="mydash" />
 *   <AppMock app="openregister" caption />
 *   <AppMock app="decidesk" size="sm" />
 *
 * Props:
 *   - app:     'mydash' | 'opencatalogi' | 'openconnector' |
 *              'openregister' | 'procest' | 'decidesk'  (required)
 *   - size:    'sm' | 'md' (default)                    — frame width
 *   - caption: boolean — adds a small app-name caption below the frame
 *   - className: string
 */

import React from 'react';
import styles from './AppMock.module.css';

import MyDashMock from './variants/MyDashMock.jsx';
import OpenCatalogiMock from './variants/OpenCatalogiMock.jsx';
import OpenConnectorMock from './variants/OpenConnectorMock.jsx';
import OpenRegisterMock from './variants/OpenRegisterMock.jsx';
import ProcestMock from './variants/ProcestMock.jsx';
import DeciDeskMock from './variants/DeciDeskMock.jsx';

const VARIANTS = {
  mydash:        {Component: MyDashMock,        label: 'MyDash'},
  opencatalogi:  {Component: OpenCatalogiMock,  label: 'OpenCatalogi'},
  openconnector: {Component: OpenConnectorMock, label: 'OpenConnector'},
  openregister:  {Component: OpenRegisterMock,  label: 'OpenRegister'},
  procest:       {Component: ProcestMock,       label: 'Procest'},
  decidesk:      {Component: DeciDeskMock,      label: 'DeciDesk'},
};

export default function AppMock({app, size = 'md', caption = false, className}) {
  const variant = VARIANTS[app];
  if (!variant) {
    return (
      <div className={[styles.frame, styles[`size-${size}`], className].filter(Boolean).join(' ')}>
        <div className={styles.empty}>Unknown app: {app}</div>
      </div>
    );
  }
  const {Component, label} = variant;
  return (
    <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
      <div className={[styles.frame, styles[`size-${size}`]].filter(Boolean).join(' ')}>
        <Component />
      </div>
      {caption && <figcaption className={styles.caption}>{label}</figcaption>}
    </figure>
  );
}
