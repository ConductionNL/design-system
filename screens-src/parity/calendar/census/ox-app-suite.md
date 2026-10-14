# Code census: ox-app-suite (mail)

repo: https://gitlab.open-xchange.com/oss/appsuite/core/ui at 8.41.0 (branch stable-8.41, commit 0164848, 2025-08-08), read 2026-10-14, source-read, nothing booted. Frontend only; the middleware (IMAP, Sieve, scheduling, categorisation) is a separate repo and was not read.
licence: AGPL-3.0 (`LICENSE`), except `src/pe/` which is OX Proprietary Software (`src/pe/LICENSE`): mail quota display, upsell, add-to-portal and the what's-new dialog live there.
Re-read note: an earlier pass started on the 7.10 tree (c4051ea); no 7.10 rows survive, every row was written and line-checked against 8.41.

## Routes and menu (from source)
- One app, `io.ox/mail` (`src/io.ox/mail/main.js:2145`): folder tree, message list, reading pane; phone layout swaps these as pages (`main.js:102`). Compose opens as a floating window that can be minimised (`compose/main.js:402`).
- Mail toolbar and context menu: reply, reply all, forward, delete, archive, spam, move, copy, flag or colour, categories, print, save as file or PDF, view source, reminder, rule from mail (`src/io.ox/mail/toolbar.js`, `contextmenu.js:27`).
- Settings page `io.ox/mail` has ten sections: layout, reading, inbox categories, signatures, compose and reply, aliases, templates, rules, folders, advanced (`src/io.ox/mail/settings/pane.js:88-138`). Accounts, security (external images), notifications are separate core pages.
- Folder menu for mail: new folder, rename, move, delete, mark all read, move all, clean up, archive old mail, empty, share and permissions, manage deputies, favourites (`src/io.ox/core/folder/contextmenu.js`).

## Entities by area
- Accounts: primary plus external IMAP/POP3 accounts with SMTP, standard folder mapping, unified mailbox flag (`src/io.ox/mail/accounts/view-form.js`).
- Messages and threads from the server; drafts are server-side composition spaces (`src/io.ox/mail/compose/api.js:209`).
- Per-user data in settings: signatures, templates (snippets), custom sender names, trusted senders, inbox category list, Sieve rules, vacation notice, auto forward.
- Shared categories with colour and icon across mail, contacts, calendar and tasks (`src/io.ox/core/categories`).

## Modules and plugins that ship
- Mail filter editor over Sieve with 16 condition types and 10 action groups (file into, copy, redirect, reject, discard, keep, mark, keywords, colour, encrypt), apply-to-folder, vacation notice and auto forward (`src/io.ox/mail/mailfilter`).
- Inbox categories (tabbed inbox) with server-side training (`src/io.ox/mail/categories`).
- Signature designer (Vue wizard, templates, social links), off by default (`src/io.ox/mail/settings/signatures/signature-designer`).
- Scheduled send, undo send, templates, statistics, attachment download links ("Drive Mail"), image resize.
- Invitation box for iTIP mail comes from the calendar module (`src/io.ox/calendar/invitations/register.js:1046`); person card with recent mail from `src/plugins/halo`.
- Feature toggles decide much of the surface: 40 named toggles with requirements (`src/io.ox/core/feature.js:42-127`).

## Integrations and external surfaces
- Drive: attach from, save to, all attachments as a virtual Drive folder, attachments as expiring links. Calendar and tasks: invite, add .ics, task reminder, side panel.
- OAuth mail accounts (Google named in the UI), Exchange ActiveSync and IMAP/SMTP device onboarding with QR codes, browser mailto handler, PWA app badge.
- PGP encryption is only marked in the list; the Guard plugin that encrypts and decrypts is not in this tree (`src/io.ox/guard` holds one authorizer file).

## API surface
- The UI calls the OX HTTP API modules `mail`, `mail/compose`, `mailfilter/v2`, `account`, about 30 distinct actions (for example `threadedAll`, `archive_folder`, `export_PDF`, `zip_messages`, `receipt_ack`) from `src/io.ox/mail/api.js`. No OpenAPI file in this repo. Plugins extend every screen through extension points.

## Permission model
- Capabilities gate features per user: `webmail`, `multiple_mail_accounts`, `mailfilter_v2`, `archive_emails`, `spam`, `deputy`, `scheduled_mail`, `mail_categories`, `guard-mail`, `mail_export_pdf`.
- Mail folders can be shared with internal users by IMAP ACL roles viewer, reviewer, author, administrator plus detailed rights; primary account only (`src/io.ox/core/folder/api.js:239`, `src/io.ox/files/share/permissions.js:62`).
- Deputies get viewer, editor or author on the inbox and optionally send-on-behalf (`src/io.ox/core/deputy/dialog.js:121-128`).
- Admins lock settings with the protected flag; many defaults are admin-only settings.

## What stands out
1. Undo after delete, move and archive, and undo send, both run through server-side undo tokens (`src/io.ox/mail/api.js:50`, `src/io.ox/mail/MailSendProgressView.js:269`).
2. Moving mail offers to create a rule so future mail from that sender follows (`src/io.ox/mail/actions/copyMove.js:91`).
3. Attachments can be taken from the selected or recently read mail when composing (`src/io.ox/mail/compose/uploadMenuView.js:168`).
4. Rules can be applied straight to an existing folder, not only to new mail (`src/io.ox/mail/mailfilter/settings/filter.js:496`).
5. Deputy model with graded rights and send-on-behalf, with the "on behalf of" line shown in compose and reading (`src/io.ox/core/deputy/dialog.js:128`, `src/io.ox/mail/compose/extensions.js:315`).
6. Search box takes translated keywords (from:, year:, file:) and can search attachment names when the IMAP server supports it (`src/io.ox/mail/search.js:46`, `:85`).
7. Sender authenticity has six admin levels (none to all) and drives warnings, a "via" domain hint and link blocking (`src/io.ox/mail/util.js:488-541`).
8. Keyboard shortcut presets mimic Gmail or Outlook.com (`src/io.ox/shortcuts/profile.js:171`).

## Not settled by reading
- Server behaviour behind the calls: Sieve support per deployment, categorisation quality, scheduled send delivery, authenticity checks. Rated from the UI path only.
- Which feature toggles a typical deployment enables (scheduleSend, templates, categories and signatureDesigner are off by default).
- XRechnung invoice preview: only the hook was traced (`src/io.ox/mail/main.js:467`); the viewer part is elsewhere.
- Cross-context folder sharing (`crossContextPermissions`) and date recognition in mail text: flags found, paths not followed to the end.
- Screen reader quality beyond the labels and live regions found; the automated axe suite exists (`e2e/tests/a11y/mail_test.js`).
- No AI, summary or translation code is in this tree (feature `ai` defaults to false); assistance therefore has no rows.
# Code census: ox-app-suite (calendar)

repo: https://gitlab.open-xchange.com/oss/appsuite/core/ui at 8.41.0, branch stable-8.41, commit 0164848 (2025-08-08), source-read on 2026-10-14, nothing booted
licence: AGPL-3.0-or-later (package.json); `src/pe/` (Zoom, portal widgets, personal data export) is under the OX Proprietary Software License (src/pe/LICENSE)
rows: 265 in ox-app-suite.calendar.json (262 yes, 3 partial). Frontend only: the chronos middleware is not in this tree.

## Routes and menu (from source)
- App `io.ox/calendar` plus `io.ox/calendar/detail` (src/io.ox/calendar/register.js). Six layouts: day, workweek, week, month, year, list (src/io.ox/calendar/main.js:496).
- Toolbar: New appointment, Today, layout dropdown, previous and next (src/io.ox/calendar/perspective.js:410). Secondary menu: Scheduling, Subscribe to Google calendar, Subscribe to shared calendars, Import from URL (iCal), Import file (src/io.ox/calendar/actions.js:657).
- Folder tree: My, Public, Shared, Hidden calendars, Resources (src/io.ox/core/folder/extensions.js:600). Context menu: colour, reminders, rename, share, deputies, export, import, properties, refresh, show only this (src/io.ox/core/folder/contextmenu-extensions.js).
- Calendar side panel next to every app (src/io.ox/calendar/sidepanel/index.js:41), meeting countdown overlay (src/io.ox/calendar/countdown/main.js).

## Entities by area
- Event (chronos): summary, location, description, start and end with time zones, all day, rrule and exceptions, class (public, confidential, private), transp, color, categories, attachments, alarms, attendees with role and partStat, organizer, attendeePrivileges (src/io.ox/calendar/edit/extensions.js).
- Calendar folders with providers: chronos, birthdays, ical feed, google, resource calendars, the virtual `cal://0/allPublic` (src/io.ox/core/folder/api.js:506).
- Resource with booking mode (book directly or ask delegates) and delegates (src/plugins/administration/resources/settings/view-edit.js:105).

## Modules and plugins that ship
- Scheduling view (freetime), conflicts dialog, iTIP handling inside mail (invitations), recurrence editor, alarms editor.
- Countdown, side panel, resource calendars and groups, managed resources, forward invitation, categories, Jitsi, Zoom (pe), portal widget (pe), shortcuts with Gmail and Outlook profiles, first-start wizard page for working time.

## Integrations and external surfaces
- Video: Jitsi reservation manager and Zoom create meetings; join buttons recognise Zoom, Teams, Meet, Skype, FaceTime, Jitsi (src/io.ox/conference/extensions.js:63).
- Subscriptions: iCal feed with login, Google via OAuth, cross-deployment shared folders. CalDAV URL per calendar and client onboarding wizard (src/io.ox/onboarding/clients/config.js:97).
- Mail: invitations rendered with actions, appointments from mail, optional date recognition (features/recognizeDates). Contacts: invite, distribution lists. No e-signing, forms or BPM.

## API surface
- Client calls 17 chronos actions and 4 chronos/alarm actions (new, update, delete, move, updateAttendee, updateAlarms, freeBusy, changeOrganizer, forward, needsAction, advancedSearch, snooze, ack and more; src/io.ox/calendar/api.js). No OpenAPI file in this tree.

## Permission model
- Folder permissions with Viewer, Editor, Author roles and public links (Share / Permissions); deputies for the default calendar; acting on behalf of shared-calendar owners; resource delegates approve bookings.
- Admin and server settings: participantBlacklist, availableAlarmTypes, chronos/allowChangeOfOrganizer, restrictAllowedAttendeeChanges, feature flags (src/io.ox/core/feature.js:45). Resource admin needs capability edit_resource.

## Workflow model
- iTIP state machine in mail: create, accept, tentative, decline, apply change, apply proposal, reject counter, accept or reject party crasher, request and send refresh (src/io.ox/calendar/invitations/register.js:117).
- Managed resources: ask-to-book requests land in the notification area for delegates.

## Case detail composition (from source)
- Detail popup: title, cancel and implicit-cancel notices, resource approval notice, date and recurrence, relative start time, location with map, participation buttons with comment, participants with counts, description, sent by, calendar, direct link, created, modified, attachments (src/io.ox/calendar/view-detail.js).

## What stands out
1. Meeting countdown overlay with join button, sound and desktop notification, meetings-only filter and lead time (src/io.ox/calendar/countdown/main.js:162; src/io.ox/settings/notifications/pane.js:205).
2. Managed resources: delegates approve booking requests from the detail view, mail and notification area (src/io.ox/calendar/view-detail.js:353; src/io.ox/core/notifications/calendar.js:201).
3. Forwarding an invitation sends new invitees to the organizer for approval, handled as party crashers (src/io.ox/calendar/actions/forward-invitation.js:106; src/io.ox/calendar/invitations/register.js:48).
4. Scheduling view with zoom levels, fine grid, week or month range, hidden non-working time, free/busy privacy per user (src/io.ox/calendar/freetime/timeView.js:114; src/io.ox/calendar/settings/pane.js:388).
5. Calendar side panel available inside every other app, with drag-to-create (src/io.ox/calendar/sidepanel/index.js:41; src/io.ox/calendar/sidepanel/lasso.js:23).
6. Implicit cancel: warns when all other attendees declined (src/io.ox/calendar/util.js:1530).
7. Auto-apply of iTIP changes from mail: never, known senders, always (src/io.ox/calendar/settings/pane.js:383).
8. Reminders as notification, sound, mail or SMS, several per appointment, snooze from the notification area (src/io.ox/backbone/mini-views/alarms.js:37; src/io.ox/core/notifications/calendar.js:325).

## Not settled by reading
- Server behaviour behind chronos: iTIP mail sending, reminder mail and SMS delivery, free/busy answers, conflict detection, resource auto-accept, cross-deployment sharing (FLD-1038 path), Google sync.
- Which features a real deployment turns on: categories and resourceCalendars default off, countdown user toggle defaults off, Zoom needs the proprietary pe/ code and switchboard.
- No screen to send a counter proposal was found; only receiving one is handled. Tasks are not drawn in the calendar, so `tasks-in-calendar` has no rows.
- Whether calendar folders can nest under other calendars (generic folder move) and what the client cache gives offline.
# Code census: ox-app-suite (tasks)

repo: https://gitlab.open-xchange.com/oss/appsuite/core/ui at 8.41.0, branch stable-8.41, commit 0164848 (2025-08-08), read 2026-10-14, nothing booted
licence: AGPL-3.0-or-later (package.json:4)
rows: 138 in `ox-app-suite.tasks.json`, 135 yes and 3 partial. Domain mapping: OX tasks are a list per folder, not a board, so "boards-and-lists" holds task lists (tasks folders) and the side panel; there are no subtasks or checklists, so that area has no rows.

## Routes and menu (from source)
- Apps: `io.ox/tasks` (list + detail, two panes) and `io.ox/tasks/detail` (task in its own window), both gated by capability `tasks` (src/io.ox/tasks/register.js:26-43). Editor is a floating window, `io.ox/tasks/edit` (src/io.ox/tasks/edit/main.js:41).
- Left: folder tree with My, Public, Shared and Hidden lists (src/io.ox/core/folder/extensions.js:607). Top: New task primary action, toolbar Edit, Due, Done, Undone, Delete, Export, Change confirmation, Print, Move (src/io.ox/tasks/toolbar.js:41-118). List options: sort by urgency, status, due date, subject, priority, order, show done (src/io.ox/tasks/main.js:756-767).
- Side panel "Tasks" next to every app, a Vue component (src/io.ox/tasks/sidepanel/index.js:35, sidepanel.vue).
- Search in the top bar with list scope, words and date range (src/io.ox/tasks/search.js:38-117).

## Entities by area
- Task (middleware tasks module, module id 4): title, note, start/end, full_time, alarm, recurrence, status 1-5, percent_completed, priority 0-3, private_flag, participants/users/confirmations, categories, target/actual duration and costs, currency, trip_meter, billing_information, companies, date_completed, attachments (src/io.ox/tasks/edit/view-template.js, src/io.ox/tasks/model.js:196-276).
- Task list = tasks folder with standard folder permissions (src/io.ox/core/folder/util.js:146).
- Settings `io.ox/tasks`: three email-notification flags, listViewLayout, viewOptions per folder, sidepanel/showUndoneOnly, currencies (src/io.ox/tasks/settings.js:23-28).

## Modules and plugins that ship
- Tasks app, detail window, editor, print template, side panel, search, notification adapters (reminder, invitation, overdue: src/io.ox/core/notifications/task.js), portal widget "My tasks" (src/pe/portal/plugins/tasks/register.js), mail "Remind me" action (src/io.ox/mail/actions/reminder.js).

## Integrations and external surfaces
- Mail: create a task from a mail, link back to the original mail, task invitations rendered inside mails, deep links to tasks.
- Categories shared across mail, calendar, contacts and tasks with a cross-app category browser.
- CalDAV URL for private task lists when capability `caldav` is present (src/io.ox/core/folder/actions/properties.js:67).
- iCalendar import and export; Drive for saving attachments.

## API surface
- The UI talks to the middleware HTTP API module `tasks`: all, list, get, search, new, update, confirm (src/io.ox/tasks/api.js:199-597). No OpenAPI file in this repo; the API lives in the middleware. Extension points (`io.ox/tasks/...`) let plugins add fields and actions.

## Permission model
- Capabilities: `tasks` (app), `delegate_tasks` (participants), `edit_public_folders` (public lists), `filestore` (attachments), `caldav`, `share_links`.
- Per-list folder permissions decide create/modify/delete; actions check them (src/io.ox/tasks/actions.js:70-81). Tasks cannot be moved into or out of shared lists (src/io.ox/tasks/actions/move.js:38). Private flag only in private lists.

## Workflow model
- Five statuses (not started, in progress, done, waiting, deferred) coupled to the percentage; done sets the completion date (src/io.ox/tasks/edit/view-template.js:355-419, src/io.ox/tasks/actions/doneUndone.js:46).

## What stands out
1. A tasks side panel beside any app, grouped by highest priority, overdue, scheduled, unscheduled and recently completed, with tick-off and an undone-only filter (src/io.ox/tasks/sidepanel/sidepanel.vue:37, src/io.ox/tasks/sidepanel/index.js:81).
2. Delegation with confirmation: participants accept, tentatively accept or decline with a comment, also straight from the notification area (src/io.ox/core/notifications/task.js:115-180).
3. Turn a mail into a task reminder in one dialog, with a link back to the mail in the task (src/io.ox/mail/actions/reminder.js:36-93, src/io.ox/tasks/util.js:228).
4. Business fields: estimated and actual duration and costs with currency, distance, billing information, companies (src/io.ox/tasks/edit/view-template.js:655-772).
5. Natural-language quick dates for due dates, reminders and snooze: this afternoon, tonight, this weekend, Monday in N weeks (src/io.ox/tasks/util.js:152-199).
6. Overdue tasks surface as notifications that can be closed as done (src/io.ox/core/notifications/task.js:184-239).
7. Urgency sort: overdue first, then due date, done last, with sort and done filter remembered per list (src/io.ox/tasks/util.js:327, src/io.ox/tasks/main.js:312-327).
8. Categories shared across apps, searchable by clicking a badge and found in a cross-app category browser (src/io.ox/tasks/main.js:648, src/io.ox/core/categories/browser/category-browser.vue:122).

## Not settled by reading
- Whether email notifications, reminders and recurrence behave as the settings say: the middleware sends the mails and computes reminders and occurrences.
- What a participant may edit on a delegated task, and whether participants' comments are shown anywhere in the detail view.
- Whether the unsaved-form restore after a reload works for tasks (failSave/failRestore hooks only).
- Deputies: the deputy dialog lists tasks permissions but only edits mail and calendar; not counted.
- CalDAV sync with external clients, and behaviour without a connection (nothing in the UI keeps tasks offline).
- The import option for tasks is labelled "Ignore existing events" (src/io.ox/core/import/import.js:152); whether it works for tasks was not seen.
