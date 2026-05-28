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
//
// Positioning rules of thumb for a scene that reads as playful, not
// gridded:
//   - never repeat an x or y across two items (every offset reads as
//     intentional)
//   - vary the size mix per scene; the same size four times reads as
//     a contact sheet
//   - let widgets cross the sidebar edge by 15-30 px; that's the
//     overlap that says "the data is the same data"
//   - sprinkle z-index so one or two widgets render in front of the
//     sidebar instead of all on the same plane

const SCENES = [
  {
    num: '01',
    title: 'OpenRegister surfaces everywhere',
    desc: 'A typed register at the centre with the Metadata sidebar pulled out. Mail and Files lift in from the upper-left and lower-left, Activity charts overlap the sidebar from the right, the calendar grid slides in below. One register row, lit on every workspace surface.',
    width: 920,
    height: 460,
    items: [
      // Sidebar at z=1; widgets z=0 sit behind it (so the sidebar
      // reads as the focal point), z=2+ sit in front of it.
      { type: 'sidebar', kind: 'openregister-metadata',  x: 250, y: 30,  size: 'md', z: 1 },
      { type: 'widget',  kind: 'nextcloud-mail',         x: 30,  y: 0,   size: 'sm', z: 2 },
      { type: 'widget',  kind: 'openregister-activity',  x: 540, y: 60,  size: 'md', z: 0 },
      { type: 'widget',  kind: 'nextcloud-files',        x: 0,   y: 250, size: 'sm', z: 2 },
      { type: 'widget',  kind: 'nextcloud-calendar',     x: 580, y: 280, size: 'sm', z: 2 },
    ],
  },
  {
    num: '02',
    title: 'Procest, two sidebars in one scene',
    desc: 'The case sidebar with xWiki open and the OpenConnector run-detail sidebar stand side by side, the werkvoorraad and due-today widgets staggered between them. Two sidebars in one frame is fine; the API does not enforce a centre.',
    width: 980,
    height: 480,
    items: [
      { type: 'sidebar', kind: 'procest-xwiki',            x: 0,   y: 60,  size: 'md', z: 1 },
      { type: 'widget',  kind: 'procest-werkvoorraad',     x: 250, y: 0,   size: 'md', z: 2 },
      { type: 'sidebar', kind: 'openconnector-run-detail', x: 690, y: 50,  size: 'sm', z: 1 },
      { type: 'widget',  kind: 'procest-due-today',        x: 320, y: 240, size: 'sm', z: 2 },
      { type: 'widget',  kind: 'decidesk-actions',         x: 560, y: 260, size: 'sm', z: 2 },
    ],
  },
  {
    num: '03',
    title: 'Document workshop, mixed sizes left to right',
    desc: 'A document flowing through DocuDesk: drop a file in (sm), the signatures sidebar tracks who has signed (md), pending list keeps it moving (sm), the run-detail sidebar (sm) shows OpenConnector delivering it, the recent-runs widget (sm) closes the loop. Each junction overlaps by ~20px so the eye reads continuity.',
    width: 1180,
    height: 460,
    items: [
      { type: 'widget',  kind: 'docudesk-anonymise',       x: 0,    y: 100, size: 'sm', z: 2 },
      { type: 'sidebar', kind: 'docudesk-signatures',      x: 200,  y: 0,   size: 'md', z: 1 },
      { type: 'widget',  kind: 'docudesk-pending-sign',    x: 470,  y: 60,  size: 'sm', z: 2 },
      { type: 'widget',  kind: 'opencatalogi-publications',x: 460,  y: 270, size: 'sm', z: 0 },
      { type: 'sidebar', kind: 'openconnector-run-detail', x: 690,  y: 30,  size: 'sm', z: 1 },
      { type: 'widget',  kind: 'openconnector-runs',       x: 920,  y: 160, size: 'sm', z: 2 },
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
