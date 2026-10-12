# Code census: apache-james

repo: https://github.com/apache/james-project at tag `james-project-3.9.1` (read 2026-10-12, source-read)
licence: Apache-2.0 (`LICENSE:1`)
James has no end-user screen. This census lists what a mail client and an administrator can do because the server offers it: 311 rows, 8 of them partial.

## Routes and menu (from source)
- No menu. Four entry surfaces: the JMAP HTTP routes (`/.well-known/jmap`, `/jmap/session`, `/jmap`, `/upload/{account}`, `/download/{account}/{blob}`, event source, web socket; `server/protocols/jmap-rfc-8621/src/main/scala/org/apache/james/jmap/routes/`), the wire protocols (IMAP, SMTP, LMTP, POP3, ManageSieve under `protocols/` and `server/protocols/protocols-*`), the administration REST interface (`server/protocols/webadmin/*/routes`), and two command line tools (`server/apps/cli`, `server/apps/webadmin-cli`).
- Mail flow is a configured chain: `sample-configuration/mailetcontainer.xml` names processors root, transport, local-delivery, relay, error, bounces.

## Entities by area
- Mail: Mailbox, Email, Thread, Keyword, Blob, Upload, EmailSubmission, Identity, VacationResponse, MDN, Quota, PushSubscription (`jmap/mail`, `jmap/core`).
- Sharing: mailbox ACL entries (user, group, special), Delegate, DelegatedAccount (`mailbox/api/.../MailboxACL.java`, `jmap/delegation`).
- Administration: User, Domain, alias, forward, group and regex mappings, DLP rule, drop list entry, Sieve script, mail queue, mail repository, dead-lettered event, task (`server/data/data-api`).

## Modules and plugins that ship
- Packaged builds: memory, JPA, PostgreSQL, Cassandra, distributed (Cassandra, object store, RabbitMQ, OpenSearch), plus SMTP-only variants (`server/apps`).
- Plugins: deleted messages vault, quota warning mail, quota search (`mailbox/plugin`); backup export (`mailbox/backup`).
- Extensions: Rspamd, SpamAssassin, ClamAV, CrowdSec, metrics reporter (`third-party`). DKIM, LDAP matchers, rate limiter (`server/mailet`). S/MIME and iCalendar mailets (`mailet/crypto`, `mailet/icalendar`).
- No LinShare module and no fetchmail wiring were found in the Guice builds at this tag.

## Integrations and external surfaces
- Identity: LDAP directory (read only), OIDC for IMAP and SMTP, JWT for JMAP and the admin interface.
- Search: OpenSearch, Lucene or a scan. Text extraction: Tika. Storage: S3, Cassandra, PostgreSQL, file. Queues: RabbitMQ, Pulsar, ActiveMQ.
- Outbound hooks: mail headers or whole mail posted over HTTP (`HeadersToHTTP`, `SerialiseToHTTP`), Web Push.

## API surface
- JMAP: 33 methods registered (`server/container/guice/protocols/jmap/.../RFC8621MethodsModule.java:144-176`), each with a contract test. Capabilities: core, mail, submission, vacationresponse, websocket, quota, mdn, and three James extensions (shares, delegation, identity sort order). No calendar or contacts capability (`jmap/core/Capability.scala:58-68`; driven 2026-10-12).
- IMAP: 44 commands, with IDLE, MOVE, CONDSTORE, QRESYNC, ACL, QUOTA, METADATA, SPECIAL-USE, LIST-EXTENDED, ESEARCH, OBJECTID, SAVEDATE, REPLACE, COMPRESS.
- Administration REST: about 200 route registrations in 16 modules, no OpenAPI file; documented in `docs/` and `src/site`.

## Permission model
- Per folder: eleven IMAP ACL rights per user, group or special name (`MailboxACL.java:119`), set over IMAP or the JMAP `sharedWith` property.
- Per account: all-or-nothing delegation (`Delegate/set`), honoured by JMAP, IMAP sign in and sending.
- Administrators are named in configuration (`usersrepository.xml:27`); the admin interface has its own token or password.

## What stands out
1. Labels are one thing across protocols: a JMAP keyword is an IMAP flag (`ImapKeywordsConsistencyContract.scala`; driven 2026-10-12).
2. Folder sharing and whole-account delegation are both first-class in JMAP, as server extensions (`Capability.scala:65`, `:67`).
3. Three push channels: web socket, event stream, and Web Push to a closed client with device verification (`WebSocketRoutes.scala:162`, `EventSourceRoutes.scala:170`, `WebPushClient.scala:39`).
4. Send later works over JMAP and SMTP FUTURERELEASE, behind `delay.sends.enabled` (`EmailSubmissionSetMethod.scala:343`).
5. Permanently deleted mail stays recoverable, searchable and exportable by an administrator (`DeletedMessagesVaultRoutes.java:114-115`).
6. Every long admin job is a task that can be listed, awaited and cancelled (`TasksRoutes.java:241-247`), including erase-a-person and rename-a-person.
7. Data leak rules and sender block lists are data, managed per domain or per person through the API (`DLPConfigurationRoutes.java:92`, `DropListRoutes.java:77`).
8. Mail processing is configuration: about 50 conditions and 60 actions, combinable with and, or, not (`mailetcontainer.xml:49`).

## Not settled by reading
- **Search differs per backend, and the difference is in the code.** Lucene (memory and JPA builds) splits text on white space only and matches by token prefix (`LenientImapSearchAnalyzer.java:41`, `LuceneMessageSearchIndex.java:437-441`). So "#58231" is found and "58231" is not, which matches the run of 2026-10-12. `setEnableSuffixMatch` would fix it but nothing calls it. OpenSearch indexes bodies with the standard analyzer (`DefaultMailboxMappingFactory.java:261`), which should drop the "#" and find both forms. The scan backend does a plain substring test (`MessageSearches.java:255`), which should also find both. The last two are read, not run.
- Attachment text search needs Tika and `opensearch.indexAttachments`; one contract test expects attachment content to be ignored (`EmailQueryMethodContract.scala:7316`). Which builds find it needs a run.
- Structured filter rules run at delivery (`JMAPFiltering.java:56`) but no registered JMAP method stores them. How a client is meant to set them at this tag is open.
- `collapseThreads` is accepted and ignored; thread keyword filters are rejected (`MailboxFilter.scala:224`). Folder thread counts are message counts (`MailboxFactory.scala:127`).
- How group ACL entries resolve to people, and whether restore-from-archive and copy-between-backends are reachable in the packaged builds.
- Highlighted snippets, quota warning mail, Web Push delivery and OIDC sign in were read through tests only.
