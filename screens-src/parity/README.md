# Capability matrices for mail, calendar and tasks

Mail, calendar and tasks have boards on the screens site and no repository of their own yet. Their capability matrices live here, in the same format every other app keeps at `openspec/parity/capabilities.json`. `scripts/screens/capabilities.py` reads them (`LOCAL_APPS`).

| App | Capabilities | Products read |
|---|---|---|
| mail | 800 | La Suite Messages (commit 536aa80), Nextcloud Mail 5.12.4, Apache James 3.9.1 |
| calendar | 357 | Nextcloud Calendar 6.6.2, Notion Calendar (public pages only) |
| tasks | 260 | Nextcloud Deck 1.19.0, Nextcloud Tasks 0.18.1 |

## How they were made, on 12 October 2026

1. **Read.** One reader per product walked the source at a release tag: routes, controllers, models, permissions, pages, tests, strings, commands. Every capability has `path:line` evidence. Notion Calendar is closed source and was rated from its public pages. The readings are in `<app>/census/`.
2. **Fold.** Rows from different products that mean the same thing were merged into one capability, conservatively. Every census row ends up in exactly one capability.
3. **Cover.** Every capability got one of two answers: the boards that show it, or the reason it has no screen (server behaviour, a protocol detail, a command line). A capability on a new board counts only when its proof text was found in the built board; that text is kept as `screen.proof`.

## How to read a row

- Our own column (`mail`, `calendar`, `tasks`) is `no` on every row and `built.state` is `none`: these apps are designed, not built.
- `unknown` on a competitor means its reading did not mention the capability. Absence was not checked by a targeted search, so it is not `no`.
- `featureConfidence` is `medium` everywhere: the grouping into features was done in the fold and not reviewed row by row.
- `note` says where the capability shows: on a screen, as a setting, in the background, or through an interface for other programs.

## When an app gets its own repository

Move its folder to `openspec/parity/` in that repository, add the app to `APPS` in `capabilities.py` and remove it from `LOCAL_APPS`.
