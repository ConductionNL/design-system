# Code census: notion-calendar

repo: none, closed source. Read from public pages only on 12 October 2026: https://www.notion.com/product/calendar and the 14 articles listed at https://www.notion.com/help/category/notion-calendar/all
licence: proprietary hosted service
grade: docs-only. No sign-up, no trial, no login. rows: 148 in notion-calendar.json (131 yes, 17 partial)

## Routes and menu (from the pages)
- Left sidebar: connected accounts with their calendars, Notion workspaces with their databases, teammates, Scheduling.
- Right context panel for the selected event. Command menu on cmd/ctrl K. Menu bar calendar on desktop.
- Settings tabs: General, Profile, Notifications, Menu bar, Conferencing, one per calendar account, one per Notion workspace (help/notion-calendar-settings).

## Entities by area
- Calendar accounts (Google, iCloud, Outlook), calendars, events with types Event, Focus time, Out of office, Birthday.
- Scheduling links (one-off, recurring), availability slots, blocks between calendars.
- Notion workspaces, databases, database views, pages, AI meeting notes. Time zones (primary, secondary).

## Modules and plugins that ship
- Scheduling links, blocking, time zones, teammate calendars, Notion database views, menu bar, mobile widgets.

## Integrations and external surfaces
- Calendar providers: Google Calendar, Apple iCloud, Microsoft Outlook and Microsoft 365. It has no calendar store of its own.
- Conferencing: Google Meet, Zoom (connected), Microsoft Teams on Outlook calendars, custom fixed links.
- Notion: pages on events, databases as calendars, AI meeting notes, Upcoming events widget in Notion Home.

## API surface
- Only a local `cron://` URL scheme that opens the desktop app at an event (help/notion-calendar-connections, "Notion Calendar API"). No web API described.

## Permission model
- Sign-in through one linked Notion account. Access to calendars follows the provider; database access follows Notion (view to show, edit to change).
- Admin control sits outside the product: Google Workspace and Microsoft 365 admins allow or block it.

## Workflow model
- None described beyond booking, rescheduling and cancelling through scheduling links.

## Case detail composition (from the pages)
- Event panel: title, type, time, participants and rooms, conferencing, location, docs and links, AI meeting notes, busy or free, public or private, calendar, RSVP with note.

## Dashboard composition (from the pages)
- Menu bar with next events and countdown; home and lock screen widgets; Upcoming events widget in Notion Home.

## What stands out
1. Blocking: an event or a whole calendar is mirrored as a busy block on another calendar, with or without details (help/blocking, "Block an event or an entire calendar").
2. Notion databases show up as calendars; dragging an item rewrites its date in the database (help/use-notion-calendar-with-notion, "Manage a Notion database in Notion Calendar").
3. Time zones are columns you add, rename, reorder and "travel" to with one key (help/time-zones, "Travel to a time zone").
4. One scheduling link keeps taking bookings until slots run out, and bookers reschedule or cancel from a link in the event (help/availability-blocking-and-time-zones, "Rescheduling and cancelling").
5. Menu bar calendar with countdown, join button and system-wide shortcuts (help/notion-calendar-settings, "Menu bar settings").
6. Bulk edit: select several events, recolour, block or drag them together (help/manage-your-calendars-and-events, "Bulk edit events").
7. RSVP with a note that is mailed to the other participants (help/manage-your-calendars-and-events, "RSVP to events").
8. Drag a teammate onto the grid for a one-to-one with conferencing added (help/notion-calendar-for-teams, "Create 1:1 meetings with drag and drop").

## Not settled by reading
- Recurrence: the pages speak only of Outlook series. How repeating events are created or edited on Google and iCloud is not written down.
- Search and the agenda, schedule and list views are named only as things missing on mobile.
- Reminders per event are not described; default reminders are delegated to Google Calendar settings.
- Two collapsed sections on the getting started guide ("Sign in with Apple iCloud", "Set your preferred meeting type") are not in the page source.
- Team features are stated for Google Workspace accounts only; Outlook parity and Outlook on mobile are open.
- The pages state limits themselves: no travel time, no FaceTime, no subscribing to a calendar from inside the product, no import or export. No accessibility statement found on these pages.
- The security page still announces a SOC 2 attestation "in May 2024", so parts of the help centre may be stale.
