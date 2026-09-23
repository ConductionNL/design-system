/**
 * The brand syntax theme for code blocks.
 *
 * Why this file exists. brand.css has always declared what a Conduction
 * code block looks like:
 *
 *   --ifm-pre-background: var(--c-cobalt-900);
 *   --ifm-pre-color:      var(--c-cobalt-100);
 *
 * and no site has ever rendered it. Docusaurus falls back to Prism's
 * palenight, and prism-react-renderer paints the block's own background
 * (#292d3e) and writes every token colour as an INLINE style. Inline
 * styles beat stylesheets, so the Infima variables above were dead the
 * whole time. Nobody noticed because palenight is also a dark block, so
 * it looked deliberate.
 *
 * Two things follow from that, and both are why this is a theme object
 * rather than more CSS:
 *
 *   1. A `.token.comment { color: ... }` rule cannot win. Measured on
 *      /demo/ 2026-09-23: adding one changed nothing at all.
 *   2. The fix has to name every token type, because whatever this object
 *      does not set, palenight is no longer there to set either.
 *
 * The colours are the kit's own `-300` ramp, which exists precisely for
 * dark grounds (tokens.css pairs coral-300 with coral-950, forest-300
 * with forest-950, and so on). Measured against cobalt-900, every one of
 * them clears AA for body text, so no token here is a compromise:
 *
 *   cobalt-100  plain          13.85:1
 *   gold-300    number         10.92:1
 *   coral-300   keyword        10.13:1
 *   cobalt-200  punctuation     9.99:1
 *   mint-300    string          9.79:1
 *   workspace-300 function      8.61:1
 *   lavender-300 class          8.20:1
 *   red-300     deleted         7.41:1
 *   cobalt-300  comment         5.91:1
 *
 * The comment is the dimmest on purpose: a comment should read as
 * subordinate to the code, and 5.91:1 is still comfortably past the
 * 4.5:1 SC 1.4.3 asks. It is the one value here chosen for hierarchy
 * rather than for maximum contrast.
 *
 * One theme, not a light/dark pair. The kit declares a single
 * --ifm-pre-background, a dark block on a light page as much as on a
 * dark one, so both Docusaurus slots get this object.
 *
 * Hex literals rather than var(--c-*) are unavoidable: this object is
 * serialised into inline styles at build time, where CSS custom
 * properties do not resolve. Each one is annotated with the token it
 * mirrors, and they must be kept in step with tokens.css by hand.
 */

const COBALT_900 = '#0A172F'; /* --c-cobalt-900, the block ground */
const COBALT_100 = '#DCE3F0'; /* --c-cobalt-100, plain code */
const COBALT_200 = '#B6C2DD'; /* --c-cobalt-200, punctuation */
const COBALT_300 = '#8095BD'; /* --c-cobalt-300, comments */
const CORAL_300 = '#FAB29C'; /* --c-coral-300, keywords */
const MINT_300 = '#87CFA8'; /* --c-mint-300, strings */
const GOLD_300 = '#ECC668'; /* --c-gold-300, numbers */
const LAVENDER_300 = '#B7A7E3'; /* --c-lavender-300, class names */
const WORKSPACE_300 = '#67BEEA'; /* --c-workspaceblue-300, functions */
const RED_300 = '#EF8A92'; /* --c-red-300, deletions */

const prismTheme = {
  plain: {
    color: COBALT_100,
    backgroundColor: COBALT_900,
  },
  styles: [
    {
      types: ['comment', 'prolog', 'cdata'],
      style: {color: COBALT_300, fontStyle: 'italic'},
    },
    {
      types: ['punctuation', 'operator', 'entity'],
      style: {color: COBALT_200},
    },
    {
      types: ['keyword', 'atrule', 'rule', 'important', 'selector'],
      style: {color: CORAL_300},
    },
    {
      types: ['string', 'char', 'attr-value', 'regex', 'url'],
      style: {color: MINT_300},
    },
    {
      types: ['number', 'boolean', 'constant', 'symbol'],
      style: {color: GOLD_300},
    },
    {
      types: ['function', 'function-name', 'method'],
      style: {color: WORKSPACE_300},
    },
    {
      types: ['class-name', 'maybe-class-name', 'builtin', 'namespace'],
      style: {color: LAVENDER_300},
    },
    {
      /* A YAML/JSON key, an HTML attribute, a CSS property. These carry
         most of the meaning in the config snippets this site is full of,
         so they get the brightest non-plain colour. */
      types: ['property', 'tag', 'attr-name', 'key'],
      style: {color: GOLD_300},
    },
    {
      types: ['variable', 'parameter'],
      style: {color: COBALT_100},
    },
    {
      types: ['deleted'],
      style: {color: RED_300},
    },
    {
      types: ['inserted'],
      style: {color: MINT_300},
    },
    {
      /* Prism marks the whole line, so this has to stay a colour change
         and not a background one, or it would repaint the ground the
         rest of this file is measured against. */
      types: ['doctype', 'doc-comment'],
      style: {color: COBALT_300, fontStyle: 'italic'},
    },
  ],
};

module.exports = {prismTheme};
