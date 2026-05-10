/**
 * mock-scene.variants.jsx — kit catalogue for the MockScene
 * component. Three example scenes show common assembly patterns.
 */

import React from 'react';
import MockScene from '../../docusaurus-preset/src/components/MockScene/MockScene.jsx';
import SidebarMock from '../../docusaurus-preset/src/components/SidebarMock/SidebarMock.jsx';
import WidgetMock from '../../docusaurus-preset/src/components/WidgetMock/WidgetMock.jsx';

const SCENES = [
  {
    num: '01',
    title: 'OpenRegister surfaces everywhere',
    desc: 'A typed register at the centre with the Metadata sidebar pulled out. Mail brings the row into the inbox, Files brings it into the folder tree, the activity sparkline tracks who is reading and writing it.',
    sidebar: <SidebarMock kind="openregister-metadata" />,
    widgets: [
      { node: <WidgetMock kind="nextcloud-mail" />,        pos: 'top-left' },
      { node: <WidgetMock kind="nextcloud-files" />,       pos: 'top-right' },
      { node: <WidgetMock kind="openregister-activity" />, pos: 'bottom-right' },
      { node: <WidgetMock kind="nextcloud-calendar" />,    pos: 'bottom-left' },
    ],
  },
  {
    num: '02',
    title: 'Procest, with documentation in arm\'s reach',
    desc: 'A case at the centre with the xWiki tab pulled out, so the case-handling protocol reads next to the live case. Werkvoorraad widget shows the queue around it, due-today shows what crosses today\'s deadline, the case timeline traces stage progress.',
    sidebar: <SidebarMock kind="procest-xwiki" />,
    widgets: [
      { node: <WidgetMock kind="procest-werkvoorraad" />, pos: 'top-left' },
      { node: <WidgetMock kind="procest-due-today" />,    pos: 'middle-right' },
      { node: <WidgetMock kind="nextcloud-calendar" />,   pos: 'bottom-left' },
    ],
  },
  {
    num: '03',
    title: 'Document workshop, signed and shipped',
    desc: 'A document at the centre with the Signatures tab open: signers and their status. Anonymise drop on the side, pending list keeping the document moving, a recent-runs widget showing the OpenConnector job that delivered the rendered file to the recipient.',
    sidebar: <SidebarMock kind="docudesk-signatures" />,
    widgets: [
      { node: <WidgetMock kind="docudesk-anonymise" />,    pos: 'top-left' },
      { node: <WidgetMock kind="docudesk-pending-sign" />, pos: 'top-right' },
      { node: <WidgetMock kind="openconnector-runs" />,    pos: 'bottom-right' },
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
          <MockScene sidebar={scene.sidebar} widgets={scene.widgets} />
        </div>
      ))}
    </div>
  );
}
