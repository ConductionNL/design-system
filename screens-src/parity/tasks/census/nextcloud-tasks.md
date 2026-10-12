# Code census: nextcloud-tasks

repo: https://github.com/nextcloud/tasks at tag v0.18.1 (appinfo/info.xml:8), read 2026-10-12, nothing booted
licence: AGPL-3.0-or-later (LICENSE; file headers say version 3 or any later version)
rows: 108 in `nextcloud-tasks.json`, 107 yes and 1 partial

## Routes and menu (from source)
- Pages: `/collections/:collectionId`, `/calendars/:calendarId`, each with a task detail route below it (src/router.js:40-83).
- Navigation: six smart collections, the task lists, Add list, trash bin, settings (src/views/AppNavigation.vue:20-88).
- List header: new task field, tag filter, sort menu (src/components/HeaderBar.vue:26-47).
- Task details: start, due, all day, repeat, list picker on top; Details tab (classification, status, completion date, priority, percentage, location, URL, tags, reminders) and Notes tab (src/views/AppSidebar.vue:36-281).

## Entities by area
- No tables of its own. A task is a VTODO and a list is a calendar on server CalDAV (src/models/task.js, src/store/calendars.js).
- Extra task properties the app writes: `x-apple-sort-order`, `x-pinned`, `x-oc-hidesubtasks`, `x-oc-hidecompletedsubtasks`, `related-to` for the parent (src/models/task.js:108-163, 482).
- Server side keeps only user preferences: default list, sort order and direction, show completed, all day, last route, visibility per collection (lib/Service/SettingsService.php:67-72, lib/Service/CollectionsService.php:103).

## Modules and plugins that ship
- One dashboard widget (lib/Dashboard/TasksWidget.php), one Talk message action (src/talk.js:42). No background jobs, no commands, no admin settings.

## Integrations and external surfaces
- CalDAV is the whole data layer, so any CalDAV client sees the same tasks.
- Calendar app: "Show in Calendar" link on tasks with a due date (src/views/AppSidebar.vue:100).
- Deck: tasks from a board list link back to their card (src/views/AppSidebar.vue:109).
- Unified search field filters the open view (src/App.vue:71).

## API surface
- Four JSON routes for collections and settings (appinfo/routes.php:44-47); everything else goes straight to the server's CalDAV endpoint from the browser. No OpenAPI file.

## Permission model
- None of its own. Sharing, read-only lists and the trash bin are server CalDAV features with a screen here (src/components/AppNavigation/CalendarShare.vue:87, src/components/AppNavigation/Trashbin.vue:94).
- Per task a classification decides what people a list is shared with can see; restricted tasks are locked for them (src/views/AppSidebar.vue:173, src/store/tasks.js:1992).

## Workflow model
- Four statuses tied to the percentage: needs action, in process, completed, cancelled (src/store/tasks.js:1484). Completion and cancellation cascade between parent and subtasks (src/store/tasks.js:1259-1265, 1497).

## What stands out
1. Subtasks to any depth, made by dragging or typing, with completion that cascades both ways (src/components/TaskDragContainer.vue:251, src/store/tasks.js:1265).
2. Paste an indented list and get tasks with subtasks (src/utils/textToTask.js:21, src/components/CreateMultipleTasksDialog.vue:24).
3. Full repetition editor: weekdays, day of month, "first Monday", months, end on date or after a count; completing an occurrence moves the task on (src/components/AppSidebar/RecurrenceItem.vue:50, src/store/tasks.js:1761).
4. Smart collections that also take drops: drag a task onto Today, Week, Important or Completed to change it (src/views/AppNavigation.vue:315).
5. Ten sort orders including manual, each reversible, with the manual order stored in the task for other clients (src/components/SortorderDropdown.vue:101-156, src/models/task.js:163).
6. Reminders relative to start or due or at a fixed time, with a prompt about what to do with them when the date goes (src/components/AppSidebar/Alarm/AlarmListNew.vue:19, AlarmRelationDeletionModal.vue:5).
7. Every task shows its own sync state and offers a refresh when the server copy changed (src/components/TaskStatusDisplay.vue:33, src/store/tasks.js:1128).
8. Deletes are a seven-second countdown with undo, backed by the server trash bin with restore of parents and subtasks (src/store/tasks.js:1059, src/store/calendars.js:727).

## Not settled by reading
- Whether a reminder set here reaches the user: the app writes a display alarm (src/components/AppSidebar/Alarm/AlarmList.vue:114) and the server decides what to do with alarms on tasks.
- Whether sharing with teams works: the store accepts a circle (src/store/calendars.js:926) but the sharee search only builds users and groups (src/components/AppNavigation/CalendarShare.vue:161).
- Behaviour on a phone and without a connection; nothing in the source keeps tasks offline.
- How large lists perform; completed tasks are loaded on request for that reason (src/components/LoadCompletedButton.vue:63).
- Assignment, comments and attachments have no screen in this app; whether tasks carrying those from other clients display anything was not seen.
