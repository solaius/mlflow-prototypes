# .design Folder Specification

**Version 0.1 (UXD) + change reports.** Adapted from the UXD RHOAI prototype
repo's `.design/README.md` v0.1 (`uxd/prototypes/rhoai`, branch `3.6`). Everything
in the UXD spec applies here unchanged; this fork adds **change reports**, a
second layer that makes design changes replayable across features and traceable
to the conversation that caused them.

This folder captures design context, rationale and history for the MLflow
registry prototypes (skills, agent plugins, agents, MCP servers). It helps AI
assistants and humans understand the "why" behind design decisions.

**Key principle:** focus on *design* decisions and *user experience* updates, not
code changes.

## Folder structure

```
.design/
├── README.md             # this file
├── feature-mapping.md    # code path -> feature -> history
├── changes/              # change reports, one file per working session
├── demo-scripts/         # demo walkthroughs (tracked in this fork)
└── features/
    └── {feature-name}/
        ├── design-history.md
        └── {release}/    # e.g. 3.6/ ; impact-report.md is reserved here
```

## Features folder

Each subfolder of `features/` is one feature area (`skills-registry/`,
`agent-plugins/`, `agent-registry/`, `mcp-registry/`).

### design-history.md

A chronological record of design evolution, newest date first:

```markdown
# Design History

## 2026-01-30

### [Meeting] MaaS 3.4 UX Sync
- [Recording](link) | [Chat](link) | [Gemini notes](link)
- Summary of key discussion points

### [Decision] Changed navigation structure
- Moved API Keys from Settings to main nav
- Rationale: users need quick access for daily workflows
```

Entry types: `[Meeting]`, `[Decision]`, `[Update]`, `[Descoped]`, `[Feedback]`.
One or two sentences each, past tense, user-experience impact only: no API field
names, no component names, no file names. Group related small changes.

**One addition in this fork:** an entry backed by a change report ends with the
entry reference in parentheses, e.g. `(2026-09-07-dwarner-skills-demo-prep#41)`.

### Release subfolders

Free-form working files for one release (`3.6/`, `3.7/`). The only fixed name is
`impact-report.md`, reserved for a downstream impact report (what a change here
means for OpenShift AI). Nothing writes it yet.

## Change reports

One markdown file per working session in `changes/`, named
`YYYY-MM-DD-<handle>-<slug>.md` (handle = first initial + surname: `dwarner`,
`pdouble`; handle and slug are lowercase letters, digits and hyphens). Never edit
another person's report; reports are append-only. Frontmatter is for machines;
headings are fixed so agents can grep.

```markdown
---
id: 2026-09-07-dwarner-skills-demo-prep      # = filename stem
author: Daniel Warner
date: 2026-09-07
target: mlflow
branch: dw-design-updates-for-demo           # where the work was done
base: 9544ee0a1                               # commit it was made against
features: [skills-registry]                   # slugs from feature-mapping.md
sources:
  - {id: S1, kind: meeting, title: "Skills registry UX review", date: 2026-09-01, url: "..."}
impact: none                                  # none | flagged
---

# Skills registry: demo-prep pass

## Narrative
Three to eight sentences: what the session set out to do, what drove it, what
changed overall, what is still open.

## Entries

### 41. Dim cards whose latest version is not active
- **Type:** Update
- **Intent:** A card whose latest live version is not active recedes: icon at
  half opacity, text and action in secondary grey, action still clickable.
- **Why:** Match the MCP server cards (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillCard.tsx, SkillCellRenderers.tsx
- **Revert:** delete `isActive` and its three uses
- **Notes:** optional, free-form, runs to the next entry.

## Open questions
```

Frontmatter: all of `id` (the filename stem), `author`, `date` (`YYYY-MM-DD`),
`target`, `branch`, `base`, `features` (non-empty, slugs from
`feature-mapping.md`), `sources` (may be `[]`) and `impact` (`none` or `flagged`)
are required. Each source has `id` (`S<n>`, unique in the report), `kind` and
`title`; `url` and `date` are optional.

| field | required | form |
|---|---|---|
| `**Type:**` | yes | `Update`, `Decision`, `Fix`, `Descoped`, `Revert`, `Feedback` |
| `**Intent:**` | yes | the rule, with no file or component names, so it applies to any feature |
| `**Why:**` | yes | the reason; cite sources in parentheses, e.g. `(S1)` or `(S1, S2)` |
| `**Replay:**` | yes | `none`, or the other features that should follow this change |
| `**Supersedes:**` | no | `none`, or refs this entry replaces |
| `**Replays:**` | no | one or more comma-separated `<ref> (<feature>, ...)` pairs: this entry carries an earlier one to those features |
| `**Declines:**` | no | one or more comma-separated `<ref> (<feature>, ...)` pairs: decided NOT to carry it there (say why) |
| `**Files:**`, `**Revert:**` | no | free text |
| `**Notes:**` | no | free text; must be the last field and runs to the next `###`, so anything after it is not parsed as a field |

A ref is `#<n>` (same report) or `<report-id>#<n>`. Source kinds: `meeting`,
`call`, `review`, `slack`, `issue`, `doc`, `screenshot`. Sources are links, never
pasted transcripts; no customer names; no NDA material.

**Replay model.** A feature's pending work = entries whose Replay names it, minus
anything superseded, minus anything a later entry Replays or Declines for it. The
hub's prototyper computes this with `design_reports.py pending` and starts each
new version from that list.

**When branches merge.**

- A `design-history.md` conflict is two dated blocks: keep both, newest first.
- A ref to an entry in a report that lives on a branch not merged here yet does
  not resolve, so `check` fails until that branch is merged in.
- A designer branch that comes back with no report (and no log to convert into
  one) is not merged; the owner asks the designer for the intent first.

## AI assistant guidelines

After any design-related change in this repo:

1. Add an entry to this session's report in `changes/` (create the file on the
   session's first change). Intent in one or two sentences; Why with a source.
2. Add or extend a brief entry in the feature's `design-history.md`, ending with
   the report entry ref.
3. Do not log code refactoring, lint or type fixes, file moves or test-only
   changes.

When a later change reverses an earlier one, do not edit the earlier entry: add a
new entry with `Supersedes`.
