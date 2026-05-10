/**
 * mock-scene.variants.jsx — kit catalogue for the MockScene component.
 *
 * Each scene is hand-positioned via the items[] API: every widget and
 * sidebar carries its own x / y / size, and items can overlap. No
 * tilt, no enforced background, no central-anchor pattern. The
 * scenes below show the range:
 *
 *   01 — multi-app surface: one sidebar centred but two widgets
 *        overlap its left edge, two more lift off its right edge,
 *        showing a single object lit across Mail, Files, Activity,
 *        Calendar.
 *   02 — paired sidebars: case sidebar plus run-detail sidebar both
 *        in the same scene at different sizes, with two widgets
 *        wedged between them.
 *   03 — wide-canvas LLM-flow: anonymise widget, signatures sidebar,
 *        run-detail sidebar, runs widget; reads as data flowing
 *        left-to-right.
 */

import React from 'react';
import MockScene from '../../docusaurus-preset/src/components/MockScene/MockScene.jsx';

// Item geometry per size (px). Used below to plan overlaps explicitly.
//   widget sm: 220 x 176     md: 300 x 240     lg: 380 x 304
//   sidebar sm: 240 x 320    md: 300 x 400     lg: 360 x 480
// Positions are tuned so each junction reads as a small overlay
// (10-25 px overlap), not adjacency.

const SCENES = [
  {
    num: '01',
    title: 'OpenRegister surfaces everywhere',
    desc: 'A typed register at the centre with the Metadata sidebar pulled out. Mail and Files overlap its left edge, Activity and Calendar overlap its right edge. One register row, lit on every workspace surface.',
    width: 800,
    height: 420,
    items: [
      // Sidebar lays down first (z=0); widgets stack on top (z=1+).
      { type: 'sidebar', kind: 'openregister-metadata',  x: 200, y: 10,  size: 'md' },
      { type: 'widget',  kind: 'nextcloud-mail',         x: 0,   y: 50,  size: 'sm' },
      { type: 'widget',  kind: 'nextcloud-files',        x: 0,   y: 230, size: 'sm' },
      { type: 'widget',  kind: 'openregister-activity',  x: 480, y: 50,  size: 'md' },
      { type: 'widget',  kind: 'nextcloud-calendar',     x: 480, y: 230, size: 'sm' },
    ],
  },
  {
    num: '02',
    title: 'Procest, two sidebars in one scene',
    desc: 'The case sidebar with xWiki open and the OpenConnector run-detail sidebar stand side by side, with the werkvoorraad and due-today widgets wedged between them. Two sidebars in one frame is fine; the API does not enforce a centre.',
    width: 920,
    height: 440,
    items: [
      { type: 'sidebar', kind: 'procest-xwiki',            x: 0,   y: 20,  size: 'md' },
      { type: 'widget',  kind: 'procest-werkvoorraad',     x: 280, y: 0,   size: 'md' },
      { type: 'widget',  kind: 'procest-due-today',        x: 280, y: 250, size: 'md' },
      { type: 'sidebar', kind: 'openconnector-run-detail', x: 560, y: 20,  size: 'md' },
    ],
  },
  {
    num: '03',
    title: 'Document workshop, mixed sizes left to right',
    desc: 'A document flowing through DocuDesk: drop a file in (sm), signatures sidebar tracks who has signed (md), pending list keeps it moving (sm), the run-detail sidebar (sm) shows OpenConnector delivering it, and the recent-runs widget (sm) closes the loop.',
    width: 1100,
    height: 440,
    items: [
      { type: 'widget',  kind: 'docudesk-anonymise',       x: 0,    y: 80,  size: 'sm' },
      { type: 'sidebar', kind: 'docudesk-signatures',      x: 200,  y: 10,  size: 'md' },
      { type: 'widget',  kind: 'docudesk-pending-sign',    x: 480,  y: 80,  size: 'sm' },
      { type: 'sidebar', kind: 'openconnector-run-detail', x: 680,  y: 50,  size: 'sm' },
      { type: 'widget',  kind: 'openconnector-runs',       x: 900,  y: 130, size: 'sm' },
    ],
  },
];

export default function SceneCatalogue() {
  return (
    <div className="scene-wrap">
      {SCENES.map(scene => (
        <div className="scene-block" key={scene.num}>
          <div className="head">
            <span className="num">{scene.num}</span>
            <h3>{scene.title}</h3>
            <span className="tag">SCENE</span>
          </div>
          <p>{scene.desc}</p>
          <MockScene items={scene.items} width={scene.width} height={scene.height} />
        </div>
      ))}
    </div>
  );
}
