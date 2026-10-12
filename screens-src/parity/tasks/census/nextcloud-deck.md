# Code census: nextcloud-deck

repo: https://github.com/nextcloud/deck at tag v1.19.0 (appinfo/info.xml:22), read 2026-10-12, nothing booted
licence: AGPL-3.0-or-later (LICENSE, SPDX headers)
rows: 185 in `nextcloud-deck.json`, 181 yes and 4 partial

## Routes and menu (from source)
- Pages: `/`, `/upcoming`, `/board`, `/board/archived`, `/board/shared`, `/board/:id`, `/board/:id/details`, `/board/:id/card/:cardId/:tabId?` (src/router.js:31-151); `/card/{cardId}` redirects to the card (appinfo/routes.php:17).
- Navigation: Upcoming cards, All boards, Archived boards, Shared with you, Add board, Import board, settings (src/components/navigation/AppNavigation.vue:9-56).
- Board toolbar: add list, search, filter popover, kanban or Gantt, archived cards, compact mode, cover images, details (src/components/Controls.vue:39-279).

## Entities by area
- Board (title, colour, archived, deletedAt, per-user settings `notify-due` and `calendar`): lib/Db/Board.php, lib/Service/BoardService.php:393.
- Stack (order, done column): lib/Db/Stack.php, lib/Service/StackService.php:307.
- Card (title, description, start date, due date, done, archived, colour, order, dependent cards): lib/Db/Card.php, lib/Service/CardService.php:688.
- Label, Assignment (user, group, team, remote), Acl (edit, share, manage), Attachment (`file` in Files or legacy `deck_file`), Session: lib/Db/.
- Comments and activity are the platform's, keyed on the card: lib/Service/CommentService.php, lib/Activity/ActivityManager.php.

## Modules and plugins that ship
- Importers: Deck JSON, Trello JSON, Trello API (lib/Service/Importer/Systems/); other apps can add sources through an event.
- Four background jobs: purge deleted items, overdue notifications, description activity, session cleanup (appinfo/info.xml:47-52).
- Four occ commands: `deck:import`, `deck:export`, `deck:transfer-ownership`, `deck:calendar-toggle` (lib/Command/).

## Integrations and external surfaces
- CalDAV: every board is a read-only task list, cards are VTODO (lib/DAV/CalendarPlugin.php:37, lib/DAV/CalendarObject.php:58).
- Platform registrations: 2 search providers, 3 dashboard widgets, 4 reference providers, team resource provider, user migrator, share provider, full text search provider (lib/AppInfo/Application.php:110-193).
- Talk message action, Files sharing picker, projects (src/init-talk.js, src/init-collections.js).
- Federation: boards shared across servers through the cloud federation API (lib/Federation/).
- notify_push for live updates and presence (src/sessions.js:40).

## API surface
- 187-line route file: web routes, REST `/api/v1.0` and `/api/v1.1` (boards, stacks, cards, labels, attachments, import), and OCS (cards, stacks, comments, attachments, config, overview, search, sessions).
- Documented in docs/API.md and docs/API-Nextcloud.md; no OpenAPI file. ETag and If-Modified-Since for sync (lib/Controller/BoardApiController.php:48-59).

## Permission model
- Per board: owner plus participants of type user, group, team or remote, each with edit, share and manage flags; read is implied (lib/Db/Acl.php:31-39, lib/Service/PermissionService.php:171).
- Instance: board creation can be limited to groups (lib/Service/PermissionService.php:368). No roles beyond that, no per-card access.

## Workflow model
- Lists are the only states. One list per board can be the done column; a card dropped there is marked done and a card marked done is moved there (lib/Service/CardService.php:456, 569). No rules, no automation.

## What stands out
1. Gantt view with draggable bars, four scales and a list of undated cards, new in this line (src/components/board/GanttView.vue:16, 371).
2. Done column: done is a card property and a list role at once, kept in step both ways (lib/Service/StackService.php:307, lib/Service/CardService.php:569).
3. Dependent cards, with done toggles from the parent card (src/components/card/DependentCardsSelector.vue:15, lib/Service/CardService.php:688).
4. Attachments are plain files in the user's own storage, shared to the card by a share provider of its own (lib/Service/FilesAppService.php:189, lib/Sharing/DeckShareProvider.php:83).
5. Boards federate: share with a user on another server and work on cards there (lib/Federation/DeckFederationProvider.php:42, lib/Service/ExternalBoardService.php:113).
6. Search has a small query language (`title:`, `list:`, `tag:`, `assigned:`, `date:<…`) that works both in the board and on the server (src/stores/card.js:93, lib/Search/FilterStringParser.php:62).
7. Undo almost everywhere: boards, lists, cards and attachments are soft-deleted and purged after a configurable number of hours (lib/Service/ConfigService.php:255).
8. Per-board due reminder choice of all, assigned or off, per user (src/components/navigation/AppNavigationBoard.vue:102, lib/Service/ConfigService.php:191).

## Not settled by reading
- Whether every card action works on a federated board, or only the ones with a method in lib/Service/ExternalBoardService.php.
- Whether the "jump back to the card" hook in src/init-calendar.js fires in the current Tasks and Calendar apps.
- How the board behaves on a phone; the code has touch fixes but no offline mode.
- Whether activity mail is really sent for the three activity settings; that is the Activity app's work.
- A per-board `calendar` setting exists in the config API (lib/Service/BoardService.php:397) but no control for it was found in the board menu.
