# Code census: nextcloud-calendar

repo: https://github.com/nextcloud/calendar at tag v6.6.2 (1b34383d4cb89ae1f2312caad20677e5c7797285), source-read on 2026-10-12, nothing booted
licence: AGPL-3.0-or-later (COPYING, appinfo/info.xml)
rows: 254 in nextcloud-calendar.json (248 yes, 6 partial)

## Routes and menu (from source)
- appinfo/routes.php: `/` and `/{view}/{timeRange}` (day, week, month, year, list), `/new`, `/edit/{objectId}`; `/appointments/{userId}`, `/appointment/{token}` plus slots, book and confirm; `/p/{token}` and `/embed/{token}` public pages; attendee and group autocompletion; `/v1/config/{key}`; `/v1/public/sendmail`; resource `/v1/appointment_configs`.
- Attribute routes: `/object/{uid}` (lib/Controller/ObjectController.php:41), `/proposal/{token}` public voting page (lib/Controller/ProposalPublicController.php:34), `/proposal/view/{id}` (lib/Controller/ViewController.php:58), OCS `/calendar/proposal/*` (lib/Controller/ProposalController.php:69).
- Sidebar (src/views/Calendar.vue:21): filter box, date picker, new event, today, view menu, calendar list, meeting proposals, appointment schedules, trash bin, settings. One navigation entry (appinfo/info.xml).
- Seven bundles (rspack.config.js:59): main, reference, contacts-menu, three appointment pages, proposal-public.

## Entities by area
- Own tables (lib/Db): AppointmentConfig, Booking, ProposalDetails, ProposalDate, ProposalParticipant, ProposalVote. Nine migrations in lib/Migration.
- Everything else (calendars, events, tasks, shares, trash bin, free/busy, rooms, delegation, reminders, invitations) is server CalDAV, reached from the browser through src/services/caldavService.js.

## Modules and plugins that ship
- Appointments (lib/Service/Appointments): slot generation, conflict and daily limit filters, mail, calendar writer.
- Meeting proposals (lib/Service/Proposal/ProposalService.php): polls with votes, mail, tentative holds, conversion to an event.
- Dashboard widget, link preview provider, profile action, contacts menu action, notifier, user migrator, one daily background job.

## Integrations and external surfaces
- Talk (rooms on events, proposals and bookings), Files (attachments), Contacts (attendees, groups, birthdays), Teams/Circles, Tasks, Deck, notify_push, user_migration.
- Holiday calendars downloaded from thunderbird.net; admin-suggested public calendars. No e-signing, forms, BPM or identity integration.

## API surface
- 29 routes and one resource in routes.php plus 11 attribute routes; no OpenAPI file. Appointment config REST and proposal OCS are internal; four endpoints are public and rate limited (booking, confirm, proposal fetch and response).
- No occ commands. Capability `calendar.webui` (lib/AppInfo/Capabilities.php:17).

## Permission model
- No roles of its own. Sharing is read or read-write per calendar to user, group, team or federated user; public read-only link; delegation as viewer or editor over all calendars (server CalDAV proxy groups).
- No admin settings screen: administration is ten or so app config keys (lib/Service/CalendarInitialStateService.php:44-78).

## Workflow model
- Booking: pending booking, emailed confirmation link valid 24 hours, then event written (lib/Service/Appointments/BookingService.php:32, :89).
- Proposal: create, vote, convert to event (lib/Service/Proposal/ProposalService.php:307).

## Case detail composition (from source)
- Event popover (src/views/EditSimple.vue): calendar, title, time, all day, repeat, location, Talk, attendees, response buttons, reminders.
- Full editor (src/views/EditFull.vue): adds description, attachments, status, visibility, free/busy, categories, colour, forwarding, attendees with find-a-time, rooms and resources.

## Dashboard composition (from source)
- One widget: events of the next 14 days, calendar colour dot, "more" button (lib/Dashboard/CalendarWidget.php:123).

## What stands out
1. Meeting polls are built in: candidate times picked over participants' busy times, public yes/no/maybe voting, tentative holds, one click to an event (src/views/Proposal/ProposalEditor.vue:120; lib/Service/Proposal/ProposalService.php:617).
2. Appointment booking has real planning controls: buffers written as "Prepare for" and "Follow up for" events, daily cap, notice, horizon, conflict calendars (lib/Service/Appointments/BookingCalendarWriter.php:201).
3. Bookings need email confirmation within 24 hours and can get a Talk room each (lib/Service/Appointments/BookingService.php:32; lib/Listener/AppointmentBookedListener.php:56).
4. Room picker filters by building, floor, capacity and features and shows live availability (src/components/Editor/Resources/RoomSelectionModal.vue:299).
5. Delegation of all calendars as viewer or editor, with the delegator set as organiser on new events (src/components/AppNavigation/Settings/SettingsDelegationSection.vue:117; src/mixins/EditorMixin.js:574).
6. A pasted calendar link renders as a live calendar in other apps (lib/Reference/ReferenceProvider.php:59; src/reference.js:8).
7. Undated tasks sit in a side list and get a due date by dragging onto the grid (src/components/CalendarGrid.vue:374).
8. Invitation forwarding can be closed per event, and attendees answer per occurrence or per series (src/views/EditFull.vue:465; src/components/Editor/InvitationResponseButtons.vue:119).

## Not settled by reading
- Everything marked "server CalDAV": invitation mail, reminder delivery, trash bin retention, free/busy answers, room backends, federation and delegation depend on the server version and its settings.
- Unified search of events lives in the server dav app, not here; the in-app box only filters the loaded range.
- `showResources` is read into the store (src/store/settings.js:398) but nothing reads it back, so whether the flag hides rooms is unproven.
- src/components/Editor/IllustrationHeader.vue and FreeBusy/RoomAvailabilityList.vue are mounted nowhere; location and photo autocompletion routes have no caller in src. Left out.
- Needs a running instance: whether dragging a dated task moves its due date, several public tokens in one URL, phone and narrow-screen behaviour beyond the popover fallback.
