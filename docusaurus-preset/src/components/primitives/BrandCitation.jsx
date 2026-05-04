/**
 * Brand-citation primitives: <NextBlue/>, <CgYellow/>, <KnvbOrange/>
 *
 * Three thin wrappers around the brand-citation classes from
 * css/brand.css. They render an inline <span> with the right colour
 * for the brand they cite, so consumers don't have to remember the
 * global class name (or which colour goes with which brand).
 *
 * The classes still ship as plain global CSS in brand.css so the
 * preview pages and any plain HTML can use them directly. These
 * components are the type-checked, autocompletable React surface.
 *
 * Usage in MDX:
 *
 *   import {NextBlue, CgYellow, KnvbOrange} from '@conduction/docusaurus-preset/components';
 *
 *   Twelve apps · one <NextBlue>Nextcloud</NextBlue> workspace.
 *   Built on <CgYellow>Common Ground</CgYellow> with one <KnvbOrange>orange</KnvbOrange> accent.
 *
 * Per huisstijl:
 *   - <NextBlue>  cites Nextcloud (the platform); colour --c-nextcloud-blue
 *   - <CgYellow>  cites Common Ground; colour --c-commonground-yellow
 *   - <KnvbOrange> KNVB-orange highlight; colour --c-orange-knvb
 *
 * One orange per screen: KnvbOrange should be reserved for highlights,
 * never primary fills, per the design-system rule.
 */

import React from 'react';

export function NextBlue({as: Tag = 'span', children, className, ...rest}) {
  return (
    <Tag className={['next-blue', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}

export function CgYellow({as: Tag = 'span', children, className, ...rest}) {
  return (
    <Tag className={['cg-yellow', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}

export function KnvbOrange({as: Tag = 'span', children, className, ...rest}) {
  return (
    <Tag className={['knvb-orange', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}
