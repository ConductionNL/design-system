# OpenProject twin: shell and primitives canon

The contract for every `Op*` board. Geometry is measured from our Nextcloud boards (`DqKop`, `AppZijbalk`, `DqZijbalk`, `DqPostvak`, `DqTaak`, `DqBerichtVersturen`). Colour, type and radius come from the active design system through `var(--sc-*)`: under `?ds=openproject` the Cunningham example theme sets them. Use the literals from `token-rules.md` and nothing near them. Where the measured OpenProject size differs (header 55 px, row 40 px, button 34 px, nav 245 px), our Nextcloud size wins, because both products must be identical.

Decided 15 October 2026, after the plugin was built: OpenProject follows Nextcloud. The top bar is the Zuiddrecht workplace bar (`DqKop`), the sign-in page is the Zuiddrecht login board (`NcLogin`), the account menu is Nextcloud's dropdown, and the sizes are Nextcloud's: primary button 48 px (was 40), table row 44 px (was 48), body text 15 px (was 14). The header row stays 44 px.

## Top bar (`OpHeader.dc.html`, the Zuiddrecht workplace bar `DqKop.dc.html` plus quick add)

Decided 15 October 2026: OpenProject's top bar is the dossiq bar, not a primary-filled bar of its own. `OpHeader` copies `DqKop` part for part, with the icons `DqKop` uses, and adds one button the dossiq bar lacks: quick add, a round plus before the bell, which the plugin kept.

| part | value |
|---|---|
| bar | min-height 68 px, full width, `background: #ffffff`, `border-bottom: 1px solid #e4e6ea`, padding 0 20px 0 14px, ink `#1b1c1d`, column gap 16 px |
| brand block | 237 px wide link, emblem 34 px high (`emblem` blob, as `DqKop`), two lines: "Gemeente Zuiddrecht" 13 px `#5e6168` above the product or module name 18 px weight 700 (the `app` attribute); then a 1 px divider `#e4e6ea` 28 px high |
| all apps | 40 x 40 button, `background: #f5f6f8`, radius 8 px, grid icon 20 px, `aria-label="All apps"`, `aria-haspopup="menu"`; pressed: `background: #eaf0f7`. Opens the complete list (see Global menu) |
| search | `flex: 0 1 560px; min-width: 240px`, 44 px high, padding 0 14px 0 42px, `border: 1px solid #e4e6ea`, `border-radius: 22px`, `background: #f5f6f8`, 15 px text, glass 18 px `#5e6168` at left 14 px |
| quick add | 44 x 44 round button (`border-radius: 22px`), transparent, plus icon 22 px stroke 1.75, `aria-label="Quick add"`, `aria-haspopup="menu"`; first in the right group, before the bell |
| icon buttons | 44 x 44 round, transparent, icon 22 px `#1b1c1d`; notifications with a 9 px dot `#cc0000` with a 2 px white ring; then contacts; then a 1 px divider with 6 px margins |
| account | 48 px high button, `border-radius: 24px`, padding 0 8px 0 4px, avatar 38 px round `#eaf0f7`/`#234a78` initials 14 px weight 700, name 15 px weight 700 over role 13 px `#5e6168`, chevron 16 px; `aria-haspopup="menu"`, `aria-expanded`; pressed: `background: #f5f6f8` |
| narrow (`row="collapsed"`, below 1240 px) | the account button keeps the avatar and chevron and drops the name and role; the search shrinks to its 240 px minimum. The bar is `flex-wrap: nowrap` (the one place it differs from `DqKop`, which wraps its search under the brand block at this width; at 1440 both are identical) |
| hover and focus | icon buttons and list entries `background: #f5f6f8`; focus `outline: 2px solid #3669a5; outline-offset: -2px` |
| attributes | `app` (second line of the brand block), `placeholder`, `user`, `role`, `initials`, `unread`, `apps` ("open"), `account` ("open"), `current` (the current entry in the open list, falls back to `app`), `row` ("collapsed" only; a custom icon row no longer exists and is ignored), `admin` ("true" shows Manage apps), `nested` (internal) |

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
| row | td padding 12px 16px, 15 px line-height 20 px: 44 px high for one line (decided 15 October 2026, was 48); `border-top: 1px solid #eef0f3`; no zebra. Cell wrappers are `display: flex`, not `inline-flex`, so the baseline does not add height; an avatar in a row is 20 px; a compact 34 px button sits in a cell with padding 5px 16px. A row with two lines (name over email, type over subject) is as tall as its two lines |
| row title | 15 px weight 600 `#1b1c1d`; secondary line 14 px `#5e6168` |
| selection | checkbox 18 px, `accent-color: #3669a5` |
| footer | padding 12px 16px, `border-top: 1px solid #eef0f3`, 14 px `#5e6168`, pagination 34 px |
| work package id | `color: var(--sc-link, #3669a5)`, weight 600 |

## Button (measured from `DqPostvak.dc.html` and `DqZijbalk.dc.html`)

| kind | value |
|---|---|
| primary (the one main action) | 48 px high (decided 15 October 2026, was 40), padding 0 16px, radius `var(--sc-radius, 8px)`, `background: var(--sc-action, #3669a5)`, border 1 px `var(--sc-action-deep, #234a78)`, white 15 px weight 600, icon 16 px |
| secondary | 40 px high, padding 0 14px, `border: 1px solid #c4c7cb; background: #ffffff; color: #1b1c1d`, 14 px weight 600; beside a primary (a toolbar, a dialog footer) it takes the primary's 48 px, padding 0 16px and 15 px text, so the row lines up |
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
| body | 15 px, line-height 22 px (decided 15 October 2026, was 14 px / 21 px), `#1b1c1d`; muted `#5e6168`; secondary `#3d4047`. Table cells 15 px on a 20 px line; labels, breadcrumbs and toolbar text stay 14 px |
| page title | 28 px weight 700, line-height 1.2 |
| section title | 20 px weight 700 |
| widget title | 16 px weight 700 |
| row title | 15 px weight 600 |
| eyebrow | 12 or 13 px weight 600 or 700, uppercase, letter-spacing 0.06em, `#5e6168` |
| small | 12 or 13 px `#5e6168` |
| font | `font-family: 'Fira Sans', system-ui, sans-serif` (the build swaps it per design system) |

## Page frame

Board root: `display: flex; flex-direction: column; background: #f5f6f8`. Header 68 px (white, 1 px line under it), then a row with the nav at 264 px and `main` with padding 24px 28px, column gap 20 px, max-width 1240 px. Never more than three things side by side. Icons: inline SVG, 16 or 20 px, `fill="none" stroke="currentColor" stroke-width="1.75"`.

## Navigation, folded (`MlNav`, `ClNav`, `TbNav` with `folded="true"`)

Since 16 October the mail, calendar and tasks boards share the top bar: `MlHeader` is an include of `OpHeader` (68 px, the dossiq bar plus quick add) that passes `app`, `placeholder`, `user`, `role`, `initials` and `alerts` (as `unread`) through. They keep their own navigations (`MlNav`, `ClNav`, `TbNav`, the admin navigations), 264 px wide as the Navigation section says, so the bar's divider sits on the navigation's edge; item sizes inside them are their own (padding 16px 12px, items 40 px). The 400 px work package panel (`WpPanel`) stays on the right. The controls inside those boards follow this canon. This section describes the folded state of those three navigations.

Owner's rule for the top-left block (13 October, for `MlHeader`; taken up by `OpHeader` on 15 October through the dossiq bar): the block is exactly as wide as the navigation, its divider sits on the navigation's edge, and it carries two lines as dossiq's `DqKop` does: the environment name small above, the app name bold below. On an OpenProject page the second line is the project name, unless the project name already stands in the left menu; then it names the active module (for example Projects).

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

## Global menu (`OpHeader`, the list behind the all apps button)

Since 15 October 2026 the bar carries no row of app icons: that was OpenProject's own positioning, and the bar is now the dossiq bar. Where you are is said by the brand block's second line (`app`); the complete list of apps and modules sits behind the 40 x 40 all apps button after the brand block, where Nextcloud and dossiq keep it (`AppMenu`). `current` marks the current entry in the list and falls back to `app`.

| part | value |
|---|---|
| open list (`apps="open"`) | 800 px wide at `left: 160px; top: 72px` (as `AppMenu`), arrow 20 px wide centred under the all apps button (x 296), padding 18px 20px 16px, radius `var(--sc-radius-lg, 10px)`, border `#e4e6ea`, shadow `0 8px 24px rgba(27,28,29,0.12)`, z-index 30; heading 16 px weight 700 "All apps", no subtitle; the groups stack 16 px apart, Nextcloud then OpenProject, each with a 12 px eyebrow title shown only when there is more than one group, and each group's entries flow in a grid of three columns (`repeat(3, minmax(0, 1fr))`, gap 4px 12px), as the plugin ships it; entry 44 px min-height, padding 4px 10px, 36 px icon tile `#eaf0f7`/`#234a78`, name 14 px weight 600 over one line 12 px `#5e6168` (short enough not to wrap in a 240 px column); current entry `background: #eaf0f7` with the icon tile inverted `#234a78`/`#ffffff`, `aria-current="page"`; footer after a 1 px `#eef0f3` line: keyboard hint 13 px, "Manage apps" only with `admin="true"` |
| board page | the `OpHeader` board shows the closed bar, then (after a caption) the bar with the list open, then the bar with the account menu open; the two open copies are nested imports with `nested="true"` inside `.op-hd-demo`, shown only by the rule `.sc-board[data-board="OpHeader"] > .op-hd > .op-hd-demo { display: block }`, so every include stays the plain 68 px bar; board height 1176 px (`heights.json` must follow) |
| status notice | does not fit in the bar. It stays under the bar at the right, as `MlSettingsAutoReply` draws it (`MlImportExport` keeps its "Import running" strip inline in the Imports section instead): 36 px high pill at `top: 76px; right: 20px`, `#ffffff` on a 1 px `#e4e6ea` border, 13 px weight 600 `#234a78`, 16 px icon, `role="status"` |

## Account menu (`OpHeader` with `account="open"`)

A dropdown under the avatar, as Nextcloud draws it. No Zuiddrecht board draws the open account menu, so it follows the open app list in style and size.

| part | value |
|---|---|
| panel | 300 px wide at `right: 20px; top: 72px`, arrow 20 px wide under the avatar, padding 10 px, radius `var(--sc-radius-lg, 10px)`, border `#e4e6ea`, shadow `0 8px 24px rgba(27,28,29,0.12)`, z-index 30, `role="menu" aria-label="Account menu"` |
| head | avatar 48 px round `#eaf0f7`/`#234a78` 16 px weight 700, name 15 px weight 700 over role 13 px `#5e6168`, padding 6px 10px 10px |
| status | first item: 12 px dot `#538b28` in a 20 px slot, "Online" 15 px weight 500 over "Set status" 13 px `#5e6168` |
| items | 44 px min-height, padding 0 10px, radius `var(--sc-radius, 8px)`, icon 20 px stroke 1.75 `#5e6168`, text 15 px weight 500; Settings, Appearance and accessibility, Help, Manage apps (only with `admin="true"`), then after a 1 px `#eef0f3` line Log out (to `OpSignIn`); 1 px lines have 4 px margins |
| trigger | the account button gets `aria-expanded="true"` and `background: #f5f6f8` |

## Sign in (`OpSignIn.dc.html`, the Zuiddrecht login board `NcLogin.dc.html` without a top bar)

| part | value |
|---|---|
| page | `background: #f5f6f8`, min-height 1020 px, content centred with a 28 px gap, padding 48px 16px; the grey emblem (`emblem-grijs` blob) 720 px high at right -90 px, bottom -120 px, opacity 0.07; no top bar |
| logo | the wordmark (`logo` blob) 56 px high, `alt="Gemeente Zuiddrecht"` |
| card | max-width 420 px, `#ffffff`, `border: 1px solid #e4e6ea`, radius 12 px, shadow `0 2px 12px rgba(27,28,29,0.06)`; a 5 px bar on top in `#cc0000` 6, `#3669a5` 3, `#cc0000` 1; padding 32 px, column gap 18 px |
| copy | title 24 px weight 700 "Sign in to the workplace", line 15 px `#5e6168` "For employees of Gemeente Zuiddrecht. One account for Nextcloud and OpenProject." |
| single sign-on | primary link 48 px (the canon primary; `NcLogin` drew 46 before the 15 October sizes), `var(--sc-action, #3669a5)`, "Sign in with your municipal account"; then an "or" line |
| fields | labels 14 px weight 600, inputs 44 px, padding 0 12px, `border: 1px solid #c4c7cb` (`NcLogin` uses `#8a929e`, which is not a token literal), radius `var(--sc-radius, 8px)`, 15 px; User name or email, Password |
| secondary | "Sign in" 48 px, `border: 1px solid #c4c7cb; background: #ffffff`, 15 px weight 600; "Forgot password?" 14 px link centred under it |
| foot | 13 px `#5e6168` "Gemeente Zuiddrecht · OpenProject on the workplace" |

## Create work package (`OpCreateWorkPackage.dc.html`, the dialog)

What the plugin does now (15 October 2026): Type and Parent side by side, Subject, Description, Assignee and Priority side by side, Start date and Finish date side by side, then a disabled Nextcloud folder line. The dialog follows the Dialog table above; the footer is Cancel then Create work package, both 48 px.

| part | value |
|---|---|
| folder line | label "Nextcloud folder" 14 px weight 600 `#5e6168`; a disabled input 40 px with a 18 px folder icon at left 12 px, padding-left 38 px, `border: 1px solid #e4e6ea; background: #f0f1f3; color: #5e6168`, value "Northwind rollout Lyon / Work packages"; note 13 px `#5e6168` "Folders are linked through the project's file storage. Change it under Project settings, File storages.", linked with `aria-describedby` |

