# Clarity review of the coverage boards

Five independent reviewers read the 87 coverage boards of mail, calendar and tasks as a first-time user, from screenshots only, without knowing what the designers intended.

| Verdict before the fixes | Boards |
|---|---|
| Clear | 18 |
| Mostly clear | 61 |
| Unclear | 8 |

They wrote 112 must-fix findings and 246 that would help. Eight designers answered every one: 335 fixed as proposed, 24 fixed in another way, 2 not done. The two not done ask for a "Nextcloud only" mark on the mail settings and administration boards, where nothing is Nextcloud only.

## Files

- `out-r1.json` to `out-r5.json`: the findings per pack, with a verdict and a reason per board, findings across boards, and what to keep.
- `response-*.json`: what the designer did with each finding.

## What the owner decided

- Deleting on the task board hides the work package and keeps it 30 days. Only "Delete for good", or the end of the 30 days, deletes it in OpenProject.
- Mail has three roles everywhere: Viewer, Editor and Manager, with "May send as this mailbox" as a switch. The fine rights of a folder sit behind Advanced.
- The tasks app uses OpenProject's words: project, work package, child work package, closed.

The boards were not reviewed again after the fixes.
