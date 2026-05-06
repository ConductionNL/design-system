/**
 * <cn-hex-prism> — the 3D isometric prism primitive.
 *
 * The atomic unit for ConNext platform diagrams. A pointy-top hexagon
 * extruded ~30° in isometric view, three faces tinted from one family
 * palette: top = family-100 (lit), left = family-300, right = family-500,
 * ink = family-700. Six families ship: cobalt (workspace only), coral,
 * lavender, gold, mint, gray.
 *
 * Slots
 *   default   — label text (the prism's name)
 *   icon      — icon SVG / image, sits above the label on the top face
 *   kicker    — small uppercase line under the label (e.g. "DATA · STABLE")
 *   pills     — optional pill stack floating on the top face
 *
 * Attributes
 *   family    cobalt | coral | lavender | gold | mint | gray   (default: coral)
 *   size      sm | md | lg | xl  or any CSS length             (default: md = 144px)
 *   state     coming                                             (optional)
 *
 * Geometry: SVG viewBox 240×252, paths inscribed for a pointy-top hex
 * extruded by R*0.45 (depth vector). All three faces drawn as polygons,
 * face edges drawn as 1.25-stroke polylines at 18% opacity for subtle
 * faceting. The label-content layer sits in the upper portion so the
 * text hits the top face only, not the side faces.
 */

const SIZES = { sm: 96, md: 144, lg: 192, xl: 240 };

const FAMILIES = {
  cobalt:   { top: 'var(--c-cobalt-100)',   left: 'var(--c-cobalt-400)',   right: 'var(--c-cobalt-700)',   ink: '#fff' },
  coral:    { top: 'var(--c-coral-100)',    left: 'var(--c-coral-300)',    right: 'var(--c-coral-500)',    ink: 'var(--c-coral-700)' },
  lavender: { top: 'var(--c-lavender-100)', left: 'var(--c-lavender-300)', right: 'var(--c-lavender-500)', ink: 'var(--c-lavender-700)' },
  gold:     { top: 'var(--c-gold-100)',     left: 'var(--c-gold-300)',     right: 'var(--c-gold-500)',     ink: 'var(--c-gold-700)' },
  mint:     { top: 'var(--c-mint-100)',     left: 'var(--c-mint-300)',     right: 'var(--c-mint-500)',     ink: 'var(--c-mint-700)' },
  gray:     { top: 'var(--c-gray-100)',     left: 'var(--c-gray-300)',     right: 'var(--c-gray-500)',     ink: 'var(--c-gray-700)' },
};

class CnHexPrism extends HTMLElement {
  static get observedAttributes() {
    return ['family', 'size', 'state'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { this.render(); }
  attributeChangedCallback() { if (this.shadowRoot) this.render(); }

  render() {
    const familyKey = this.getAttribute('family') || 'coral';
    const sizeAttr = this.getAttribute('size') || 'md';
    const state = this.getAttribute('state');

    const f = FAMILIES[familyKey] || FAMILIES.coral;
    const sizePx = SIZES[sizeAttr] ? `${SIZES[sizeAttr]}px` : sizeAttr;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --face-top:   ${f.top};
          --face-left:  ${f.left};
          --face-right: ${f.right};
          --ink:        ${f.ink};

          display: inline-block;
          width: ${sizePx};
          position: relative;
          font-family: var(--conduction-typography-font-family-body, system-ui, sans-serif);
          color: var(--ink);
        }

        svg.shape { display: block; width: 100%; height: auto; overflow: visible; }
        svg.shape .face-top   { fill: var(--face-top); }
        svg.shape .face-left  { fill: var(--face-left); }
        svg.shape .face-right { fill: var(--face-right); }
        svg.shape .face-edge  { stroke: var(--ink); stroke-width: 1.25; fill: none; opacity: 0.18; }

        .content {
          position: absolute;
          inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding-bottom: 18%; /* push content onto top face only */
          color: var(--ink);
          text-align: center;
          pointer-events: none;
        }
        ::slotted([slot="icon"]) {
          width: 22%;
          height: auto;
          margin-bottom: 4%;
          color: currentColor;
          fill: currentColor;
        }
        .label {
          font-size: calc(${sizePx} * 0.10);
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }
        ::slotted([slot="kicker"]) {
          font-family: var(--conduction-typography-font-family-code, ui-monospace, monospace);
          font-size: calc(${sizePx} * 0.066);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 2%;
          opacity: 0.78;
          color: currentColor;
        }
        ::slotted([slot="pills"]) {
          display: flex; flex-direction: column;
          gap: 4px; margin-top: 4%;
          align-items: center;
        }

        ${state === 'coming' ? `
          .badge {
            position: absolute;
            top: 12%; right: 6%;
            background: var(--c-cobalt-700);
            color: white;
            font-family: var(--conduction-typography-font-family-code, ui-monospace, monospace);
            font-size: calc(${sizePx} * 0.05);
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 3px 7px;
            border-radius: 999px;
            pointer-events: none;
          }
        ` : ''}
      </style>

      <svg class="shape" viewBox="0 0 240 252" aria-hidden="true">
        <!-- left face -->
        <polygon class="face-left"  points="120,84 60,118 60,212 120,246"/>
        <!-- right face -->
        <polygon class="face-right" points="120,84 180,118 180,212 120,246"/>
        <!-- top face (drawn last so it sits on top of the side faces at the seam) -->
        <polygon class="face-top"   points="120,6 180,40 180,118 120,152 60,118 60,40"/>
        <!-- subtle face edges, point down + center vertical -->
        <polyline class="face-edge" points="120,84 60,118 120,152 180,118 120,84"/>
        <polyline class="face-edge" points="120,152 120,246"/>
      </svg>
      <div class="content">
        <slot name="icon"></slot>
        <span class="label"><slot></slot></span>
        <slot name="kicker"></slot>
        <slot name="pills"></slot>
      </div>
      ${state === 'coming' ? `<div class="badge">Coming</div>` : ''}
    `;
  }
}

if (!customElements.get('cn-hex-prism')) {
  customElements.define('cn-hex-prism', CnHexPrism);
}

export { CnHexPrism };
