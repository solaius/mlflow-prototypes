---
paths: "mlflow/server/js/src/**"
---

# Design reports

This fork keeps a design record in `.design/` (read `.design/README.md`). When a
change in this session alters what a user sees or does in a registry UI:

- add an entry to this session's change report in `.design/changes/`
  (`YYYY-MM-DD-<handle>-<slug>.md`, created on the first such change) with Type,
  Intent, Why (cite the source: meeting, review, Slack thread) and Replay;
- add a one-line entry to `.design/features/<feature>/design-history.md`
  (feature from `.design/feature-mapping.md`) ending with the report entry ref.

Reverse an earlier change with a new entry that says `Supersedes`, never by
editing the old one. Skip refactors, lint fixes and test-only changes.

Cursor sessions follow the same rule in `.cursor/rules/design-reports.mdc`,
which spells out the entry shape in full.
