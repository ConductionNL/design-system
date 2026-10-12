# Code census: nextcloud-mail

repo: https://github.com/nextcloud/mail at tag v5.12.4 (6c7bbed), read 2026-10-12, source-read, nothing booted
licence: AGPL v3 (`COPYING`; file headers mix AGPL-3.0-only and AGPL-3.0-or-later; `appinfo/info.xml:38` says `agpl`)

## Routes and menu (from source)
- One navigation entry, "Mail" (`appinfo/info.xml:106`). One admin settings section (`lib/Settings/AdminSettings.php:28`, mounted by `src/main-settings.js:26`).
- Six client routes, all but setup rendering one view (`src/router.js:19`): `/`, `/mailto`, `/box/:filter?/:mailboxId`, `/box/.../thread/:threadId/:draftId?`, `/outbox`, `/setup`.
- Sidebar: combined inbox and priority inbox, then per account its folders, then outbox and settings (`src/components/Navigation.vue:14`, `:84`).
- Account settings modal sections: aliases, certificates, writing mode, signature, default folders, trash deletion, autoresponder, calendar, classification, filters, quick actions, Sieve script, mail server, Sieve server, folder search (`src/components/AccountSettings.vue:12-134`).
- App settings modal: general, appearance, text blocks, privacy, security, S/MIME, Mailvelope, assistance, shortcuts (`src/components/AppSettingsMenu.vue:9-290`).

## Entities by area (`lib/Db`)
- Accounts: MailAccount, Alias, Provisioning, Delegation, SmimeCertificate.
- Mail cache: Mailbox, Message, Recipient, Tag, MessageTags, MessageSnooze, MessageRetention.
- Outgoing: LocalMessage (drafts and outbox), LocalAttachment.
- Personal data: CollectedAddress, TrustedSender, InternalAddress, TextBlock, TextBlockShare, Actions and ActionStep (quick actions).

## Modules and plugins that ship
- Classification: a locally trained importance model (`lib/Service/Classification`).
- AiIntegrations: summaries, suggested replies, follow-up detection, event drafting (`lib/Service/AiIntegrations`).
- Sieve: filter builder, raw script editor, autoresponder (`lib/Service/MailFilter`, `lib/Service/OutOfOffice`).
- Provisioning: accounts from a per-domain template (`lib/Service/Provisioning/Manager.php`).
- PhishingDetection: six checks per message (`lib/Service/PhishingDetection`).
- S/MIME on the server, PGP only through the Mailvelope extension (`lib/Service/SmimeService.php`, `src/crypto/mailvelope.js`).
- Seven registered background jobs plus per-account sync, training, quota and follow-up jobs (`appinfo/info.xml:58`, `lib/BackgroundJob`).
- 22 command line commands (`appinfo/info.xml:79`).

## Integrations and external surfaces
- Protocols: IMAP, SMTP, ManageSieve, OAuth for Google and Microsoft. JMAP is started but not wired (`lib/Protocol/ProtocolFactory.php:35`).
- Platform: unified search, two dashboard widgets, mail provider for other apps, notifications, setup checks, user migration, Context Chat (`lib/AppInfo/Application.php:161-185`).
- Calendar and tasks over CalDAV from the browser, Contacts, Files and share links, Viewer, smart picker, absence settings.
- Outside services: Mozilla ISPDB and MX lookup for setup, Gravatar and favicons for pictures, KItinerary for bookings.

## API surface
- 107 named routes and 14 resource sets in `appinfo/routes.php`, internal to the web client.
- Public OCS surface is small: list accounts, send a message, get a message, its raw source or an attachment, list folders and their messages (`appinfo/routes.php:550`, `lib/Controller/MessageApiController.php:103`, `lib/Controller/MailboxesApiController.php:52`).

## Permission model
- Two levels: any signed-in user owns their accounts; the admin settings controller is the only one without user-level endpoints (`lib/Controller/SettingsController.php`).
- Delegation gives another user full use of one account: read, send, delete. There is no read-only or per-folder level (`lib/Service/DelegationService.php:48`, `src/components/DelegationModal.vue:19`).
- Folder rights reported by the mail server are respected, not managed (`src/util/acl.js:11`).
- No public pages.

## What stands out
1. The importance model is trained on the server from the user's own reading, replying and sending history, with no outside service (`lib/Service/Classification/ImportanceClassifier.php:203`).
2. Sending always passes through an outbox, which gives undo, send later and retry one shared path (`src/store/outboxStore.js:175`, `lib/BackgroundJob/OutboxWorkerJob.php:24`).
3. Quick actions chain steps (tag, move, mark, delete) into one click, defined per account (`src/components/quickActions/Settings.vue:30`).
4. Filters are built visually and compiled to Sieve, and the raw script stays editable beside them (`lib/Service/MailFilter/FilterBuilder.php:27`, `src/components/SieveFilterForm.vue:20`).
5. Phishing checks compare link text with link target and the sender name with the address book (`lib/Service/PhishingDetection/PhishingDetectionService.php:66-82`).
6. The unsubscribe button appears only after the sender's domain signature validates (`src/components/ThreadEnvelope.vue:120`).
7. Delegated actions are written to the log with both user names (`lib/Service/DelegationService.php:186`).
8. Bookings in mail become cards that can be added to a calendar (`src/components/itinerary/FlightReservation.vue:135`).

## Not settled by reading
- Whether the phone layout is usable beyond the one switch found (`src/components/MailboxThread.vue:14`); rated partial.
- Screen reader coverage: labels exist, quality unknown; rated partial.
- How shared and other users' folders from the mail server appear in the sidebar (`lib/Db/Mailbox.php:56` has a `shared` field; no screen use traced).
- Whether the `app.mail.transport` setting still changes sending; only a health check reads it, so no row was written.
- Which assistance features appear with a given text provider; all are gated on an admin switch plus provider availability (`lib/Controller/PageController.php:317-338`).
