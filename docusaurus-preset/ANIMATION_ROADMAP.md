# Animation roadmap — wave 6 (planned, not yet implemented)

Waves 1–5 of the animated-atomics programme are shipped (see
`MISSING_COMPONENTS.md` for the per-component coverage). This file
holds the designs for the two remaining L-size items from the
animation audit, plus the small registry debts the audit surfaced.
Nothing in this file is implemented; it is the working spec for the
next animation PR.

Rules carried over from the shipped waves, binding for wave 6 too:

- Tokens only; no images, no hardcoded colours.
- One KNVB-orange accent per component, maximum.
- Every loop is seamless (opacity-swap resets, no visible rewind).
- `running={false}` and `prefers-reduced-motion` render the
  meaningful end state, not a blank.
- Timelines ride the `--am-dur`-style custom-property convention so
  a consumer can retune duration without touching keyframes.

## 1 · Pipeline — the document travels the flow (L)

**Component:** `src/components/Pipeline/Pipeline.jsx` +
`Pipeline.module.css` (React, in the preset).

**Audit finding on the claimed dotted-line animation — VERIFIED, it
exists.** `Pipeline.module.css` draws the full-width dotted flow line
as `.steps::before` (a `repeating-linear-gradient` dash pattern) and
animates it with `flow-shift` (0.9s linear infinite,
`background-position 0 → 10px`, lines 39–67). The stacked mobile
layout (`max-width: 1100px`) switches to a vertical line with its own
`flow-shift-vert` twin, and `prefers-reduced-motion: reduce` disables
both. So the base "the line flows" motion is real and shipping; what
wave 6 adds is the *payload* making the journey, not the line itself.

**Design — a document hex rides the line:**

- A small terracotta document hex (pointy-top, ~10×11, the same
  vocabulary as the AppMock `.doc` atoms) spawns at the left end-box
  (the `IconList` "Sources" column), travels the dotted line
  left-to-right, and pauses ~400ms at each step hex's equator.
- At each pause the step hex answers: a 1.06 scale pulse plus a brief
  ring in the step's own family colour (mint for the OpenConnector
  step, workspace-blue for the platform hex, terracotta for
  OpenCatalogi — never a new orange). The pill inside the hex, when
  present, bumps with it.
- Past the last step the document fades into the right end-box
  ("Consumers"), whose list items tick top-to-bottom with a 120ms
  stagger (each item's icon tile flashes its border cobalt→mint→rest)
  — the "everyone downstream can see it now" beat.
- Loop length: `--pl-dur`, default 9s. The traveller is hidden at
  0%/100% (opacity swap), so the loop is seamless; the dotted line's
  independent 0.9s `flow-shift` keeps running underneath and needs no
  synchronisation.
- The vertical (stacked) layout re-routes the traveller top-to-bottom
  along the vertical line; same beats.
- Static / reduced-motion: the traveller is hidden, every step hex at
  rest, the consumer list fully ticked — the delivered end state.
  (`flow-shift` is already disabled by the existing media query.)
- Implementation note: the traveller must be a sibling of `.steps`
  positioned against the same `top: 85px` midline calc the line uses;
  the hexes' `z-index: 1` will occlude it while it passes "through"
  a hex, which is exactly the right reading.

## 2 · PlatformDiagram — the platform assembles (L, cross-repo)

**Component:** the preset's `PlatformDiagram/PlatformDiagram.jsx` is
a typed wrapper around the bespoke `<platform-diagram>` web component
that lives **in the design-system repo, not the preset**:
`preview/components/_lib/platform-diagram.js` +
`platform-diagram.css`. The animation therefore lands cross-repo: the
keyframes and progress logic go into `_lib/platform-diagram.{js,css}`
(runtime CSS is injected by the web component), while the preset
wrapper only grows a `running` prop it forwards as an attribute.

**Today:** the component already reveals on scroll via the
`--pd-list-progress` / `--pd-hex-progress` custom properties — a
one-shot entrance, not a loop.

**Design — assembly loop:**

- Beat 1, the workspace: the centre workspace slab draws in (scaleY
  from the baseline) and its topbar dots pop left-to-right.
- Beat 2, the corner hexes: the four app hexes fly in from their
  compass corners (translate + fade, 90ms stagger), each with a
  1.05 settle-bounce as it docks.
- Beat 3, the flows: the connecting flow lines draw (stroke-dash
  reveal) from workspace to each hex in the same order the hexes
  landed.
- Beat 4, the lists: each side list's rows land with the shipped
  `.sbLive`-style stagger; the workspace pill flashes mint once when
  the last row is in — "the platform is complete".
- Hold ~2.5s assembled, then a soft opacity-cascade reset (the shipped
  waves' convention; no rewind).
- Loop length: `--pd-dur`, default 12s. When a `running="false"`
  attribute (or `prefers-reduced-motion`) is set, the diagram renders
  fully assembled — identical to today's post-scroll-reveal state, so
  the existing scroll-progress path can stay as the reduced-motion
  fallback.
- Cross-repo sequencing: land the web-component change in
  `preview/components/_lib/` first (the kit page
  `preview/components/platform-overview.html` is the specimen), then
  bump the copy the preset consumes, then add the wrapper prop +
  render test in the preset. Two PRs, one per repo.

## 3 · Pointer — flow-canvas run animation (spec lives elsewhere)

The FlowMock atomic (shipped, wave 3) is the marketing abstraction of
the flow editor. The *product* counterpart — the run-line animation on
the real flow canvas — is specified in the **nextcloud-vue** repo
(spec merged; `CnFlowCanvas` run-animation spec). Do not re-specify it
here: when that lands, FlowMock should stay visually consistent with
it (mint run-line, ~600ms approval hold, single orange halo at the
approval node), but the preset carries no implementation work for it.

## 4 · SidebarMock icon-registry stand-ins (S, debt)

The audit flagged two tab icons that ship as stand-ins because the
`IntegrationIcon` registry has no dedicated glyph:

- `docudesk-signatures` — the Signatures tab renders the **mail**
  icon. Needs a signature glyph (pen-stroke over a baseline, in the
  registry's stroke style).
- `docudesk-pii-map` — the PII-map tab renders the **keycloak** icon.
  Needs a PII/redaction glyph (masked-text bar or eye-off).

Add both to `IntegrationIcon/registry.js`, switch the two tab
definitions in `SidebarMock.jsx`, and extend the SidebarMock render
test to pin the new names. Until then the stand-ins are acceptable at
mock abstraction level but must not leak into product UI.
