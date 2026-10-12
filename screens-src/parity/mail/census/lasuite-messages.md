# Code census: La Suite Messages (`lasuite-messages`)

repo: https://github.com/suitenumerique/messages at commit 536aa80 (12 October 2026, no release tag)
licence: MIT (LICENSE, Direction Interministérielle du Numérique)
grade: source-read on 2026-10-12, 332 rows (323 yes, 9 partial). Rows marked "also driven 2026-10-12" were also seen in the browser.

## Routes and menu (from source)
- `/` landing and sign-in; `/mailbox/$id` list; `/mailbox/$id/thread/$threadId` reading; `/mailbox/$id/new`; `/mailbox/$id/draft/$draftId` (draft in its own tab). `src/frontend/src/routes/`
- `/domain`, `/domain/$id` (mailboxes), `/domain/$id/dns`, `/domain/$id/signatures`: the domain administration area.
- Sidebar: Inbox (Unread, Starred, Mentioned, Assigned to me, Unassigned), Drafts, Outbox, Sent, Archives, Spam, Trash, then the label tree. `features/layouts/components/mailbox-panel/components/mailbox-list/index.tsx:66`
- Mailbox settings is one modal with tabs: General, Access sharing, Message templates, Auto-replies, Signatures, Imports, Integrations. `mailbox-settings/modal-mailbox-settings/index.tsx:230`
- There are no real folders. Every "folder" is a filter over conversation flags.

## Entities by area
- Identity and tenancy: User, MailDomain, MailDomainAccess, Mailbox, MailboxAccess. `src/backend/core/models.py:189`
- Mail: Thread, ThreadAccess, Message, MessageRecipient, Contact, Label, Attachment, Blob, MailboxBlob, InboundMessage.
- Collaboration: ThreadEvent (comment, assign, unassign), UserEvent (mention, assign).
- Configuration: MessageTemplate (message, signature, auto-reply), Channel (mta, widget, api_key, webhook, caldav, import, push), DKIMKey.

## Modules and plugins that ship
- `src/backend`: Django + DRF API, Celery workers (delivery, import, export, search indexing, push, storage offload, garbage collection).
- `src/frontend`: React client, BlockNote editor, Capacitor shells for iOS and Android.
- `src/mta-in`: inbound SMTP front end, two implementations (Postfix + milter, and an aiosmtpd one).
- `src/mpa`: rspamd spam engine. `src/socks-proxy`: outbound IP proxy. `src/jmap-email`: MIME to JMAP parser library. `src/keycloak`: identity provider image and theme.

## Integrations and external surfaces
- Identity: OIDC sign-in, Keycloak user and group sync, password and 2FA reset, external entitlements service (DeployCenter).
- Search: OpenSearch. Storage: PostgreSQL blobs, optional S3 tier. Calendar: CalDAV (RSVP, add event, conflicts).
- Files: the suite's Drive. AI: any OpenAI-compatible endpoint. DNS: Scaleway. Push: APNs, FCM, Web Push.

## API surface
- One versioned REST API under `/api/<version>/`, about 30 viewsets, OpenAPI file checked in (`core/api/openapi.json`).
- Service-to-service endpoints behind scoped API keys: provisioning, metrics, raw email submit. Public endpoints: config, widget delivery.

## Permission model
- Mailbox roles viewer, editor, sender, admin. Conversation roles viewer, editor, held by a mailbox, not a person. Domain role admin. `core/enums.py:17`, `docs/permissions.md`
- Read and starred state are per mailbox-to-conversation access. Archive, trash and spam are shared state.

## What stands out
1. A conversation is shared between mailboxes, with its own role, instead of being copied. `core/api/viewsets/thread_access.py:72`
2. Internal comments, mentions and assignment live in the conversation timeline, with "Assigned to me" and "Unassigned" views. `core/services/thread_events.py:317`
3. Webhooks are steps in the inbound pipeline and can answer back: mark spam, add labels, assign, prepare a reply draft. `core/mda/dispatch_webhooks.py:361`
4. Every inbound source (SMTP, website form, import, API) is a "channel"; an import is a resumable, cancellable channel that can delete what it created. `core/services/importer/channel.py:530`
5. Read state is a timestamp, so "mark unread from here" works on a message inside a conversation. `core/api/viewsets/flag.py:63`
6. Reading safety is layered: sanitiser, script-less frame, image proxy, link-mismatch warning, attachment type sniffing. `thread-message-body.tsx:459`, `core/api/viewsets/blob.py:345`
7. Push notifications carry only ids, never content; the client fetches the message itself. `src/frontend/public/sw.js:6`
8. Search operators are accepted in English, French and Dutch. `core/services/search/parse.py:43`

## Not settled by reading
- Whether the native apps are published, and whether the installable web app works offline (no offline cache found).
- The calendar path end to end: how a user gets a CalDAV connection when no server-wide default is set.
- AI summary and auto-labelling quality and timing; both flags are off by default.
- Whether a user can switch to a dark colour scheme (variants exist, no toggle found).
- IMAP server auto-detection, and how attachments travel on forward.
- "Simple redirect" mailboxes are shown as "Coming soon" and were left out.
- Permanent delete of a conversation has an endpoint; no screen path was found beyond trash.
- Delivery behaviour under load: throttling, retry timing, deferral of inbound mail.
