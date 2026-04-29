/*
 * <platform-diagram> — declarative kernel + corner-hexes + lists + flows.
 *
 * Authoring shape:
 *   <platform-diagram>
 *     <pd-kernel logo="..." role="Workspace" alt="Nextcloud"></pd-kernel>
 *     <pd-list position="top" family="nextcloud">
 *       <pd-item name="Files" desc="Sync, share, and version any file.">
 *         <svg viewBox="0 0 24 24"><path d="..."/></svg>
 *       </pd-item>
 *       ...
 *     </pd-list>
 *     <pd-list position="top-left" family="core" label="Technical Core">
 *       <pd-item name="OpenRegister" meta="Data" desc="..."> <svg .../></pd-item>
 *       ...
 *     </pd-list>
 *     <pd-list position="bottom-center" family="builder" label="App Builder" badge="COMING SOON">
 *       ...
 *     </pd-list>
 *     <pd-flow from="top-left:left" to="bottom-left:left" shape="c-bracket-left"></pd-flow>
 *     <pd-flow from="bottom-center:left" to="bottom-left:bottom" shape="l-h"></pd-flow>
 *   </platform-diagram>
 *
 * Positions: top, top-left, top-right, bottom-left, bottom-right, bottom-center.
 *   "top" renders only a list (no hex tag) — used for the Nextcloud-workspace
 *   functions list. The other five render a hex tag plus the list.
 *
 * Flow shapes (orthogonal segments only):
 *   straight       direct line — use only when from/to share an axis.
 *   l-h            L-bend, horizontal first then vertical.
 *   l-v            L-bend, vertical first then horizontal.
 *   c-bracket-left out left, parallel, back in right (use when both anchors
 *                  are on the same vertical column, going around).
 *   c-bracket-right out right.
 *   c-bracket-top   out top.
 *   c-bracket-bottom out bottom.
 *
 * Anchor format on `from`/`to`: "<position>:<side>" where side is one of
 *   left | right | top | bottom (the four hex side midpoints / peaks).
 *
 * The whole component is light-DOM by design — it renders into its own
 * children, which means CSS scopes via `platform-diagram` selectors and the
 * structure ports directly to React/Docusaurus by capitalising tag names.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  // Maps the public position name to the legacy class used by the CSS layout.
  // Keeping these stable means the diagram-overview page can opt to use the
  // legacy class names if it ever wants to bypass the component.
  const POSITION_CLASS = {
    'top':           'nextcloud-workspace',
    'top-left':      'tech-core',
    'top-right':     'ai',
    'bottom-left':   'workplace',
    'bottom-right':  'integrated',
    'bottom-center': 'app-builder',
  };

  // Hex centres in kernel-relative coords (px).
  // Derived from the layout in platform-diagram.css — keep in sync if the
  // hex placement ever changes.
  const HEX_CENTRES = {
    'top-left':      { cx: -204, cy: -104 },
    'top-right':     { cx:  204, cy: -104 },
    'bottom-left':   { cx: -204, cy:  104 },
    'bottom-right':  { cx:  204, cy:  104 },
    'bottom-center': { cx:    0, cy:  232 },
  };

  // Hex side midpoints / peaks (160×185 pointy-top hex).
  const HEX_SIDES = {
    left:   { dx: -80,   dy:    0 },
    right:  { dx:  80,   dy:    0 },
    top:    { dx:   0,   dy: -92.5 },
    bottom: { dx:   0,   dy:  92.5 },
  };

  function anchor(spec) {
    if (!spec || !spec.includes(':')) return null;
    const [position, side] = spec.split(':');
    const c = HEX_CENTRES[position];
    const s = HEX_SIDES[side];
    if (!c || !s) {
      console.warn('[platform-diagram] unknown anchor:', spec);
      return null;
    }
    return { x: c.cx + s.dx, y: c.cy + s.dy };
  }

  function pathFor(shape, a, b) {
    switch (shape) {
      case 'l-h':
      case 'l-bend':
      case 'l-bend-h':
        return `M ${a.x} ${a.y} L ${b.x} ${a.y} L ${b.x} ${b.y}`;
      case 'l-v':
      case 'l-bend-v':
        return `M ${a.x} ${a.y} L ${a.x} ${b.y} L ${b.x} ${b.y}`;
      case 'c-bracket-left': {
        const x = Math.min(a.x, b.x) - 36;
        return `M ${a.x} ${a.y} L ${x} ${a.y} L ${x} ${b.y} L ${b.x} ${b.y}`;
      }
      case 'c-bracket-right': {
        const x = Math.max(a.x, b.x) + 36;
        return `M ${a.x} ${a.y} L ${x} ${a.y} L ${x} ${b.y} L ${b.x} ${b.y}`;
      }
      case 'c-bracket-top': {
        const y = Math.min(a.y, b.y) - 36;
        return `M ${a.x} ${a.y} L ${a.x} ${y} L ${b.x} ${y} L ${b.x} ${b.y}`;
      }
      case 'c-bracket-bottom': {
        const y = Math.max(a.y, b.y) + 36;
        return `M ${a.x} ${a.y} L ${a.x} ${y} L ${b.x} ${y} L ${b.x} ${b.y}`;
      }
      case 'straight':
      default:
        return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    }
  }

  // Parses a <pd-list> (or any source element) into a config object. Reads
  // its <pd-item> children eagerly so we can blow the source tree away after.
  function parseList(el) {
    const items = [];
    for (const itemEl of el.querySelectorAll(':scope > pd-item')) {
      // The item's icon is the first <svg> child. We snapshot a clone now so
      // the original is safe to remove when we replace the host's innerHTML.
      const svg = itemEl.querySelector(':scope > svg');
      items.push({
        name:       itemEl.getAttribute('name') || '',
        meta:       itemEl.getAttribute('meta') || '',
        desc:       itemEl.getAttribute('desc') || '',
        brand:      itemEl.hasAttribute('brand') || itemEl.hasAttribute('brand-color'),
        brandColor: itemEl.getAttribute('brand-color') || '',
        glyph:      svg ? svg.cloneNode(true) : null,
      });
    }
    return {
      position: el.getAttribute('position'),
      family:   el.getAttribute('family') || '',
      label:    el.getAttribute('label') || '',
      badge:    el.getAttribute('badge') || '',
      items,
    };
  }

  function renderList(list) {
    const wrap = document.createElement('div');
    const positionClass = POSITION_CLASS[list.position] || list.position;
    const familyClass   = list.family ? `fam-${list.family}` : '';
    wrap.className = `box-wrap ${positionClass} ${familyClass}`.trim();

    if (list.badge) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = list.badge;
      wrap.appendChild(badge);
    }

    const box = document.createElement('div');
    box.className = 'box';

    for (const item of list.items) {
      const row = document.createElement('div');
      row.className = 'row';

      const glyph = document.createElement('span');
      glyph.className = 'glyph' + (item.brand ? ' brand' : '');
      if (item.brandColor) glyph.style.color = item.brandColor;
      if (item.glyph) glyph.appendChild(item.glyph);
      row.appendChild(glyph);

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = item.name;
      row.appendChild(name);

      if (item.meta) {
        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = item.meta;
        row.appendChild(meta);
      }

      if (item.desc) {
        const desc = document.createElement('div');
        desc.className = 'desc';
        desc.textContent = item.desc;
        row.appendChild(desc);
      }

      box.appendChild(row);
    }

    wrap.appendChild(box);
    return wrap;
  }

  function renderHex(list) {
    if (!list.label || list.position === 'top') return null;
    const positionClass = POSITION_CLASS[list.position] || list.position;
    const familyClass   = list.family ? `fam-${list.family}` : '';
    const hex = document.createElement('div');
    hex.className = `kernel-corner-hex ${positionClass} ${familyClass}`.trim();
    // Allow newline in label to render a <br>; otherwise straight text.
    if (list.label.includes('\n')) {
      list.label.split('\n').forEach((line, i) => {
        if (i) hex.appendChild(document.createElement('br'));
        hex.appendChild(document.createTextNode(line));
      });
    } else {
      hex.textContent = list.label;
    }
    return hex;
  }

  function renderFlows(flows) {
    if (!flows.length) return null;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'flow-overlay');
    // Symmetric viewBox: x∈[-340,+340], y∈[-325,+325]. The SVG element is
    // centred in the kernel's grid cell, so SVG (0,0) lands exactly on the
    // kernel centre and path coords match the kernel-relative arithmetic.
    svg.setAttribute('viewBox', '-340 -325 680 650');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    for (const f of flows) {
      const a = anchor(f.from);
      const b = anchor(f.to);
      if (!a || !b) continue;
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('class', 'flow-line');
      path.setAttribute('d', pathFor(f.shape, a, b));
      if (f.color) path.setAttribute('stroke', f.color);
      svg.appendChild(path);
    }
    return svg;
  }

  class PlatformDiagram extends HTMLElement {
    connectedCallback() {
      if (this._rendered) return;
      this._rendered = true;
      this._build();
    }

    _build() {
      // 1. Read declarative config from the light-DOM children.
      let kernel = null;
      const lists = [];
      const flows = [];

      for (const child of [...this.children]) {
        const tag = child.tagName.toLowerCase();
        if (tag === 'pd-kernel') {
          kernel = {
            logo: child.getAttribute('logo') || '',
            role: child.getAttribute('role') || '',
            alt:  child.getAttribute('alt')  || '',
          };
        } else if (tag === 'pd-list') {
          lists.push(parseList(child));
        } else if (tag === 'pd-flow') {
          flows.push({
            from:  child.getAttribute('from'),
            to:    child.getAttribute('to'),
            shape: child.getAttribute('shape') || 'l-h',
            color: child.getAttribute('color') || '',
          });
        }
      }

      // 2. Replace the source tree with the rendered diagram.
      this.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'diagram-grid';

      if (kernel) {
        const k = document.createElement('div');
        k.className = 'kernel';
        const img = document.createElement('img');
        img.className = 'kernel-logo';
        if (kernel.logo) img.src = kernel.logo;
        img.alt = kernel.alt;
        k.appendChild(img);
        if (kernel.role) {
          const r = document.createElement('div');
          r.className = 'role';
          r.textContent = kernel.role;
          k.appendChild(r);
        }
        grid.appendChild(k);
      }

      // Lists first, then their corresponding hex tags (so DOM order matches
      // the original platform-overview layout: hex tags appear after lists).
      for (const list of lists) grid.appendChild(renderList(list));
      for (const list of lists) {
        const hex = renderHex(list);
        if (hex) grid.appendChild(hex);
      }

      const flowSvg = renderFlows(flows);
      if (flowSvg) grid.appendChild(flowSvg);

      this.appendChild(grid);
    }
  }

  if (!customElements.get('platform-diagram')) {
    customElements.define('platform-diagram', PlatformDiagram);
  }
})();
