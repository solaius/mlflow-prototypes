---
id: 2026-09-18-pdouble-round2-merge-rulings
author: Peter Double
date: 2026-09-18
target: mlflow
branch: skills-registry-rfc
base: 8405e5188
features: [skills-registry]
sources:
  - {id: S1, kind: review, title: "MR !2: DW Stakeholder Feedback Round 2", date: 2026-09-18}
  - {id: S2, kind: doc, title: "RFC-0008 skills registry", url: "https://github.com/mlflow/rfcs/pull/26"}
  - {id: S3, kind: review, title: "Owner rulings on the round-2 merge", date: 2026-09-18}
impact: none
---

# Merge rulings on the stakeholder feedback round 2

## Narrative
Daniel Warner's `dw-stakeholder-feedback-round-2` (MR !2, head `8405e5188`)
fast-forwarded into `skills-registry-rfc`, then merged on into
`agent-registry-rfc`. His report,
`2026-09-15-dwarner-stakeholder-feedback`, covered the first two commits; the
last three (`abb5c3918`, `0a91e4e3d`, `8405e5188`) had no entries, so entries
1-4 record them from the MR description and the diffs. Their Replay scope
follows the pattern of every other entry in his report. Entries 5 and 6 are
the owner's rulings at the merge.

## Entries

### 1. Remote-source files state names where the content lives
- **Type:** Update
- **Intent:** When a version's files are held at a remote source and not
  listed by the registry, the files area says the content is read from a
  remote source and offers the link out, with no further explanation.
- **Why:** Updated wording for remote sources in the files section (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillFilesTab.tsx
- **Notes:** Commit `abb5c3918`. The alert title changed from "No file listing
  for this version" to "Content is read from a remote source.", and the
  resolution reason line under it was removed.

### 2. Version tags label reads Metadata
- **Type:** Update
- **Intent:** The key/value tags on a version are labelled Metadata.
- **Why:** Minor wording update in the round-2 pass (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillVersionPane.tsx
- **Notes:** Commit `0a91e4e3d`, "Version tags:" to "Metadata:".

### 3. Organization is entered in the name, not its own field
- **Type:** Update
- **Intent:** The create form has no separate organization input; a scoped
  entity is created by typing `@org/name` into the name field, which the hint
  under it explains.
- **Why:** Removed the Org field from the advanced area of the create modal (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** useSkillFormModal.tsx
- **Notes:** Commit `8405e5188`. Carries together with #6, without which the
  hint registers an unscoped entity.

### 4. Label filter on the catalogue
- **Type:** Update
- **Intent:** The catalogue filter row has a searchable label control listing
  every tag value in use; picking one narrows the list to entries carrying a
  tag with that value, whatever its key.
- **Why:** Added an independent filter control for labels back into the catalog
  page (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillListFilters.tsx, SkillListPage.tsx, useSkills.ts
- **Notes:** Commit `8405e5188`. Matches on tag value only, not key; the search
  box still filters `key:value` tags through the search syntax.

### 5. Keep the Source column and the Source filter
- **Type:** Revert
- **Intent:** The catalogue keeps its Source column and its Source filter.
  The filter row as a whole is to be re-evaluated later, not trimmed one
  control at a time.
- **Why:** Staying in line with RFC-0008's UI section, which names source type
  as a structured filter (S2, S3). This keeps 2026-09-11-pdouble-merge-rulings#2
  in force.
- **Replay:** none
- **Supersedes:** 2026-09-15-dwarner-stakeholder-feedback#6
- **Files:** SkillListTable.tsx, SkillListFilters.tsx, SkillListFilters.test.tsx
- **Revert:** re-apply 2026-09-15-dwarner-stakeholder-feedback#6
- **Notes:** The search help popover names source type again: "Filter by tag,
  org, keyword, source type, and label."

### 6. Split an `@org/name` typed into the name field
- **Type:** Fix
- **Intent:** A name typed as `@org/name` creates the entity under that
  organization with the bare name, in the duplicate check, the register snippet
  and the created record alike.
- **Why:** With the organization field gone (#3), following the name hint
  registered an unscoped entity whose name began with `@org/` (S3).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** useSkillFormModal.tsx
- **Notes:** Uses the existing `parseSkillQualifiedName` in `constants.ts`.

## Open questions
