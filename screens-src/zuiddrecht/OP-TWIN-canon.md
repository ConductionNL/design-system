# OpenProject twin: shell and primitives canon

The contract for every `Op*` board. Geometry is measured from our Nextcloud boards (`DqKop`, `AppZijbalk`, `DqZijbalk`, `DqPostvak`, `DqTaak`, `DqBerichtVersturen`). Colour, type and radius come from the active design system through `var(--sc-*)`: under `?ds=openproject` the Cunningham example theme sets them. Use the literals from `token-rules.md` and nothing near them. Where the measured OpenProject size differs (header 55 px, row 40 px, button 34 px, nav 245 px), our Nextcloud size wins, because both products must be identical.

## Top bar (`OpHeader.dc.html`, measured from `DqKop.dc.html`)

| part | value |
|---|---|
| height | 68 px, full width, `background: #3669a5` (primary), white ink, no bottom border |
| brand block | 237 px wide, logo `data-sc-logo="logo-wit"` 26 px high, 1 px divider, app name 18 px weight 700 |
| app switcher | 40 x 40 button, grid icon 20 px, `aria-label="All apps"`, popover 640 px wide at left 160 px, top 70 px |
| search | `flex: 0 1 560px`, 44 px high, padding 0 14px 0 42px, 1 px white border, `background: rgba(255,255,255,0.12)`, radius `var(--sc-radius-lg, 10px)`, 15 px text |
| icon buttons | 44 x 44, icon 22 px, radius `var(--sc-radius, 8px)`; notification badge 9 px dot `#cc0000` with 2 px white ring |
| account | 48 px high button, avatar 38 px round `#ffffff` on `#234a78`, name 15 px weight 700, role 13 px, chevron 16 px |

## Navigation (`OpNav.dc.html`, measured from `AppZijbalk.dc.html` and `DqZijbalk.dc.html`)

| part | value |
|---|---|
| width | 264 px (`flex: 0 0 264px` in the board), `background: #ffffff`, `border-right: 1px solid #e4e6ea`, padding 20px 14px, column gap 20 px |
| primary action | first in the column, 42 px high, radius `var(--sc-radius, 8px)`, `background: var(--sc-action, #3669a5)`, 1 px border `var(--sc-action-deep, #234a78)`, 15 px weight 600, icon 18 px |
| project switcher | second, min-height 44 px, padding 4px 10px, `background: #f5f6f8`, 28 px square initials on `#234a78`, label 12 px `#5e6168` over name 14 px weight 600, chevron 16 px |
| item | min-height 42 px, padding 0 10px, gap 12 px, radius `var(--sc-radius, 8px)`, 15 px weight 500, icon 20 px stroke 1.75 |
| active item | `background: #eaf0f7; color: #234a78; font-weight: 600`, `aria-current="page"` |
| group title | 12 px weight 600, uppercase, letter-spacing 0.06em, `#5e6168`, padding 0 10px 6px |
| count badge | 22 px high pill, min-width 22 px, 12 px weight 700, `#cc0000` on white only for counts that need attention; `#eaf0f7`/`#234a78` otherwise |

## Table (measured from `DqPostvak.dc.html`)

| part | value |
|---|---|
| frame | `background: #ffffff; border: 1px solid #e4e6ea; border-radius: var(--sc-radius-lg, 10px)`, overflow hidden |
| header row | `background: #fafbfc`, th padding 12px 16px, 14 px weight 600 `#5e6168`, line-height 20 px: 44 px high; sort caret 14 px `#c4c7cb` |
| row | td padding 14px 16px, 14 px line-height 20 px: 48 px high for one line; `border-top: 1px solid #eef0f3`; no zebra |
| row title | 15 px weight 600 `#1b1c1d`; secondary line 14 px `#5e6168` |
| selection | checkbox 18 px, `accent-color: #3669a5` |
| footer | padding 12px 16px, `border-top: 1px solid #eef0f3`, 14 px `#5e6168`, pagination 34 px |
| work package id | `color: var(--sc-link, #3669a5)`, weight 600 |

## Button (measured from `DqPostvak.dc.html` and `DqZijbalk.dc.html`)

| kind | value |
|---|---|
| primary (the one main action) | 40 px high, padding 0 14px, radius `var(--sc-radius, 8px)`, `background: var(--sc-action, #3669a5)`, border 1 px `var(--sc-action-deep, #234a78)`, white 14 px weight 600, icon 16 px |
| secondary | 40 px high, padding 0 14px, `border: 1px solid #c4c7cb; background: #ffffff; color: #1b1c1d`, 14 px weight 600 |
| compact (in a row) | 34 px high, otherwise secondary |
| icon only | 40 x 40, `aria-label`, icon 20 px |
| filter chip | 38 px high pill (`border-radius: 19px`), pressed: `background: #1b1c1d; color: #ffffff`; with a count pill 12 px |

## Input and select (measured from `DqPostvak.dc.html` and `DqBerichtVersturen.dc.html`)

| part | value |
|---|---|
| input | 40 px high, padding 0 12px, `border: 1px solid #c4c7cb`, radius `var(--sc-radius-lg, 10px)`, `background: #ffffff`, 15 px text (14 px in a toolbar) |
| search input | the same with a 18 px glass at left 12px and padding-left 38px |
| select | the same height and border, `appearance: none`, padding-right 36px, chevron 16 px at right 12px |
| label | 14 px weight 600, 6 px above the field |
| switch | 42 x 24, knob 18 px, on: `#3669a5` |
| radio | 18 px circle, `border: 1px solid #c4c7cb`, selected: 2 px ring `#3669a5` with a 8 px dot |
| textarea | the input with padding 9px 12px and a 21 px line, minimum three lines |

## Dialog (measured from `DqBerichtVersturen.dc.html`)

| part | value |
|---|---|
| panel | max-width 640 px, `background: #ffffff`, radius `var(--sc-radius-lg, 10px)`, shadow `0 16px 48px rgba(27,28,29,0.28)`, backdrop `rgba(27,28,29,0.45)` |
| header | padding 20px 24px, eyebrow 13 px uppercase `#234a78`, title 20 px weight 700 |
| body | padding 0 24px 8px, fields 16 px apart |
| footer | padding 16px 24px, `border-top: 1px solid #eef0f3`, buttons right, cancel secondary then primary |

## Tabs (measured from `DqTaak.dc.html`)

| part | value |
|---|---|
| tab | min-height 34 px, padding 8px 12px, 14 px, `border: 1px solid #c4c7cb; border-bottom: none`, radius `var(--sc-radius, 8px) var(--sc-radius, 8px) 0 0`, `background: #eef0f3`, margin-bottom -1px |
| active tab | `background: #ffffff; border-bottom: 1px solid #ffffff; font-weight: 700`, `aria-selected="true"` |
| strip | `border-bottom: 1px solid #c4c7cb`, gap 4 px, panel below on white |

## Badge, status and type (from `DqPostvak.dc.html` and `token-rules.md`)

| part | value |
|---|---|
| badge (chip) | padding 3px 10px, radius `var(--sc-radius, 8px)`, 13 px weight 600, `#eaf0f7`/`#234a78`; neutral `#f0f1f3`/`#3d4047` |
| status dot | 10 px filled circle with a 2 px ring, then the name in 14 px: new `#c3fae8`/`#7bf4cc`, in development `#66d9e8`/`#21c8de`, in review `#d3f9d8`/`#8ff09c`, on hold `#ffc078`/`#ff9d2e`, needs clarification `#fcc2d7`/`#f977a6`, closed `#dee2e6`/`#adb5bd` |
| status button | 32 px high, padding 0 10px, filled with the status colour, `#1b1c1d` text 14 px weight 600, caret 16 px |
| type | uppercase 12 px weight 700, letter-spacing 0.04em: EPIC `#005b77`, FEATURE `#538b28`, BUG `#ab0000`, TASK `#08a5df`, MILESTONE `#35c53f` |

## Type scale (from `DqPostvak.dc.html`, `DqKop.dc.html`, `token-rules.md`)

| role | value |
|---|---|
| body | 14 px, line-height 21 px, `#1b1c1d`; muted `#5e6168`; secondary `#3d4047` |
| page title | 28 px weight 700, line-height 1.2 |
| section title | 20 px weight 700 |
| widget title | 16 px weight 700 |
| row title | 15 px weight 600 |
| eyebrow | 12 or 13 px weight 600 or 700, uppercase, letter-spacing 0.06em, `#5e6168` |
| small | 12 or 13 px `#5e6168` |
| font | `font-family: 'Fira Sans', system-ui, sans-serif` (the build swaps it per design system) |

## Page frame

Board root: `display: flex; flex-direction: column; background: #f5f6f8`. Header 68 px, then a row with the nav at 264 px and `main` with padding 24px 28px, column gap 20 px, max-width 1240 px. Never more than three things side by side. Icons: inline SVG, 16 or 20 px, `fill="none" stroke="currentColor" stroke-width="1.75"`.

## Navigation, folded (`MlNav`, `ClNav`, `TbNav` with `folded="true"`)

Since 13 October (Round 7) the mail, calendar and tasks boards no longer use `OpHeader` and `OpNav` for their shell: after the first user test they returned to their own 55 px top bar (`MlHeader`) and 245 px navigation of 12 October, with a separate 400 px work package panel (`WpPanel`) on the right. The controls inside those boards still follow this canon. This section describes the folded state of those three navigations.

| part | value |
|---|---|
| width | 64 px (`flex: 0 0 64px` in the board), same background and `border-right` as the open navigation, padding 8px 0 16px, items centred in a column with a 2 px gap |
| open control | first in the rail, 40 x 40 icon button, panel icon 20 px stroke 1.75, `#5e6168` on transparent, `aria-label` "Open folders", "Open calendars" or "Open views", `aria-expanded="false"`; the open column folds with the same icon |
| primary action | second, 42 x 42 icon button with the canon primary colours (`var(--sc-action, #3669a5)`, border `var(--sc-action-deep, #234a78)`), icon 20 px, `aria-label` with the full name; calendar and tasks show the short label "New" in 10 px under it |
| item | 56 x 48, radius `var(--sc-radius, 8px)`, icon 20 px stroke 1.75 over a 10 px label (line-height 12 px), `#3d4047`, `aria-label` with the full name and the count |
| active item | `background: #eaf0f7; color: #234a78; font-weight: 600`, `aria-current="page"` (`aria-current="date"` for today in the calendar) |
| badge | 16 px pill at the top right of the item, min-width 16 px, 10 px weight 700, `#3669a5` on white ink; only where a count matters |
| when it folds | when a conversation, an event or a card is open (level 1) and while a right panel is open (level 2); a navigation that is already folded stays folded on the next board |
| how it opens again | the open control at the top of the rail; hovering a rail shows the full column over the content without moving the layout. Never more than three things side by side: the rails, the content and one right panel, so an open navigation closes any second right panel |

## Navigation, nested (`OpNav` with `open="…"` and `current="…"`)

OpenProject's third level (saved queries, boards, wiki pages, settings pages) is not a second sidebar. The project menu stays; the module you are in expands in place and lists its own pages under its item, as nested items do in Nextcloud's app navigation. Without `open` the menu renders exactly as before.

| part | value |
|---|---|
| attributes | `open` names the module whose list is shown (none by default), `current` names the child that is the current page; `items` (optional) overrides the children, `A\|B\|C` flat or `Group: A\|B; Other: C` grouped. The children of Work packages, Boards, Wiki and Project settings are built in |
| parent row | the level one item (42 px, 15 px) as a link with `flex: 1 1 auto; padding-right: 4px`, then a 32 x 36 toggle button, `aria-expanded="true"` or `"false"`, `aria-controls` the list id, `aria-label` "Collapse work packages" or "Expand boards", chevron 16 px stroke 1.75 `#5e6168`: down (`m6 9 6 6 6-6`) when open, right (`m9 18 6-6-6-6`) when closed. Every module with a list of its own shows the toggle as soon as `open` is set |
| parent that contains the current page | `color: #234a78; font-weight: 600`, no background, `aria-current="false"`; the module itself is `aria-current="page"` with the active pair only when none of its children is current |
| nested list | a `ul` inside the parent's `li`, `margin: 2px 0 6px 20px; padding-left: 10px; border-left: 2px solid #e4e6ea`, column gap 2 px; level two text starts at 42 px from the item edge, aligned with the level one label. 4 px between the parent row and the list, 8 px between the list and the next level one item |
| level two item | min-height 36 px, padding 0 10px, radius `var(--sc-radius, 8px)`, 14 px weight 500 `#1b1c1d`, no icon |
| current child | `background: #eaf0f7; color: #234a78; font-weight: 600`, `aria-current="page"` |
| group label in the list | 12 px weight 600, uppercase, letter-spacing 0.06em, `#5e6168`, padding 4px 10px 4px for the first, 8px 10px 4px after that (saved queries: Default, Favourites, Public, Private) |
| new action | last row, 36 px, 14 px weight 500 `#5e6168`, 16 px plus icon, gap 8 px, transparent button: "Save this view", "New board", "New page"; a module without one (Project settings) has no row |
| long list | more than 8 children: the first 6, then a "Show all 14" row, 36 px, 14 px weight 600 `var(--sc-link, #3669a5)`, `aria-expanded="false"`; never an inner scrollbar |
| board height | when the open list makes the navigation taller than the 932 px row, the board's `min-height` and `$preview` height grow to fit (Work packages 1360, Boards 1040, Wiki 1100, Project settings 1140), never clipped |

## Global menu (`OpHeader`, the row of icons in the top bar)

Nextcloud's positioning: the apps and modules are icons in the bar, directly after the brand block; the complete list sits behind the nine-dot button at the end of the row. The product or app name is no longer printed as text in the bar: the logo names the product, the marked icon names the app. `app` stays an accepted attribute: it is the accessible name of the current item and picks the current icon when `current` is not given (`app="Mail"` marks Mail; `app="OpenProject"` marks Home). Without `row` the bar shows the default row.

| part | value |
|---|---|
| brand block | 264 px wide, 68 px high, `padding-left: 24px` (the sidebar's 14 px padding plus the item's 10 px, so the logo's left edge lines up with the menu's icons), logo 26 px high, a 1 px divider `rgba(255,255,255,0.35)` 28 px high as its last pixel, at x 264 on every board, the same width on boards without a sidebar; the block is a link `aria-label="Home"`; no name text |
| row | `nav aria-label="Global menu"`, starts 16 px right of the divider (x 280), tiles 4 px apart; default row Files, Mail, Calendar, Work packages, Boards, Gantt, Meetings, then the nine-dot button; a current item outside the row takes the last place |
| tile | link, min-width 44 px, 48 px high, padding 0 10px, radius `var(--sc-radius, 8px)`, white ink, icon 22 px stroke 1.75, `aria-label` with the name; label 11 px weight 600 under the icon, shown only on the current tile and on hover or focus (`:focus-visible` 2 px white outline inset) |
| current tile | `background: rgba(255,255,255,0.16)`, `box-shadow: inset 0 -3px 0 #ffffff` (white on the primary bar, 5.9 to 1), label always shown, `aria-current="page"`, `aria-label="Mail, current"` |
| nine-dot button | 44 x 44, icon 22 px, `aria-label="All apps and modules"`, `aria-haspopup="menu"`, `aria-expanded`; last in the row; pressed: `background: rgba(255,255,255,0.2)` |
| search | `flex: 0 1 460px; min-width: 320px`, otherwise as the top bar table; about 408 px at 1440 with the default row |
| collapsed (`row="collapsed"`, below 1240 px) | the row folds into the nine-dot button, which moves to x 280, directly after the divider; the current tile stays beside it (x 328). Between 1360 and 1240 px the account button drops the name and role and keeps the avatar and chevron; below 1240 the row collapses |
| open list (`apps="open"`) | 640 px wide at `left: 280px; top: 72px`, arrow 20 px wide under the nine-dot button, padding 18px 20px 16px, radius `var(--sc-radius-lg, 10px)`, border `#e4e6ea`, shadow `0 8px 24px rgba(27,28,29,0.12)`, z-index 30; heading 16 px weight 700 "All apps and modules" with the note "The first seven are in the bar" 13 px `#5e6168` at the right; two columns 20 px apart, titles Nextcloud and OpenProject (12 px eyebrow); entry 44 px min-height, padding 4px 10px, 36 px icon tile `#eaf0f7`/`#234a78`, name 14 px weight 600 over one line 12 px `#5e6168`; current entry `background: #eaf0f7` with the icon tile inverted `#234a78`/`#ffffff`, `aria-current="page"`; footer after a 1 px `#eef0f3` line: keyboard hint 13 px, "Manage apps" only with `admin="true"`. A filter field is added above the columns once the map has more than 14 entries; at 12 it is not needed |
| attributes | old: `app`, `placeholder`, `user`, `role`, `initials`, `unread`, `apps`, `current`; new, all optional: `row` ("" default, "collapsed", or `Files\|Mail\|Gantt`), `admin` ("true" shows Manage apps), `nested` (internal, see below) |
| board page | the `OpHeader` board shows the closed bar and, below a caption, the bar with the list open: the second copy is a nested import with `nested="true" apps="open"` inside `.op-hd-demo`, hidden by default and shown only by the rule `.sc-board[data-board="OpHeader"] > .op-hd > .op-hd-demo { display: block }`, so every include stays the plain 68 px bar; board height 702 px (`heights.json` must follow) |
| status notice | does not fit in the bar: with the default row and a 320 px search there is no calm slot left at 1440. It stays under the bar at the right, as `MlImportExport` and `MlSettingsAutoReply` draw it: 36 px high pill at `top: 76px; right: 20px`, `#ffffff` on a 1 px `#e4e6ea` border, 13 px weight 600 `#234a78`, 16 px icon, `role="status"` |
