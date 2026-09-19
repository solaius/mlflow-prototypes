---
id: 2026-09-11-pdouble-merge-rulings
author: Peter Double
date: 2026-09-11
target: mlflow
branch: skills-registry-rfc
base: 9353ba5c4
features: [skills-registry, agent-registry]
sources:
  - {id: S1, kind: call, title: "Peter / Daniel - unified asset view in mlflow", date: 2026-09-11}
  - {id: S2, kind: doc, title: "RFC-0008 skills registry", url: "https://github.com/mlflow/rfcs/pull/26"}
impact: none
---

# Merge rulings on the skills demo-prep pass

## Narrative
Rulings from the 2026-09-11 Peter Double / Daniel Warner call, applied when
Daniel's branch merged into `skills-registry-rfc` (`9353ba5c4`, rulings in
`58ed49079`) and on into `agent-registry-rfc` (`5aa7d4fee`). Two of his entries
were reversed in part: the rename (RFC-0008 has no such operation) and the
missing source filter (the search help promised it). One orphaned editor was
removed, and the composed branch kept a tab strip for version content beside
his page-level Traces switch. Entries 1-3 were briefly numbered 49-51 in the
interim log at `.design/2026-09-07-dw-skills-demo/ui-changes.md`.

## Entries

### 1. Drop the rename from the Edit skill modal
- **Type:** Revert
- **Intent:** Name and organization cannot be edited after registration; the Edit modal offers only the entity's mutable fields.
- **Why:** RFC-0008 keys a skill on (organization, name) and has no rename; the demo runbook already told the audience names are immutable. Ruled on the call, Daniel agreeing (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Recorded in the interim log as entry 49.

**Files:**
- `mlflow/server/js/src/skills-registry/hooks/useEditSkillModal.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
- `mlflow/server/js/src/skills-registry/mocks/skillsStore.ts`
- `mlflow/server/js/src/skills-registry/mocks/skillContent.ts`
- `mlflow/server/js/src/skills-registry/mocks/uploadedSkillContent.ts`

**What:** The Edit skill modal is back to Description and Icon. The Name field, its blur
check, `renameSkill`, `renameSkillSeedKey`, `renameUploadedSkillFiles` and `SkillPage`'s
`onRenamed` navigation are removed. Entry 40's other half stands, so tags stay out of this
modal.

**Why:** Ruling from the 2026-09-11 call, with Daniel agreeing. RFC-0008 keys a skill on
`(organization, name)` and gives `update_skill` no name field, so the rename was invented
UI. The demo runbook already told the audience that names are immutable. If rename is
wanted, raise it as a question on the RFC rather than as a prototype control.

**Revert:** `git show 75edd0ca5` holds the rename. Re-apply its Name field and the three
rename helpers.

### 2. Restore the Source filter
- **Type:** Revert
- **Intent:** Every dimension the search help names has a control or a free-text match in the filter row.
- **Why:** The search help named source type and nothing filtered by it; the RFC's UI section calls for the control (S1, S2).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Recorded in the interim log as entry 50.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.test.tsx`

**What:** The **Source** `SimpleSelect` ("All sources") is back in the filter row after the
Organization combobox, restored exactly as it was at baseline.

```
  before:  [Search skills] [Status] [All organizations ▾]
  after:   [Search skills] [Status] [All organizations ▾] [Source: All sources]
```

**Why:** Ruling from the 2026-09-11 call. Entry 46's popover says "Filter by tag, org,
keyword, and source type", and nothing on the page filtered by source type. Of the three
fixes entry 46 offered, the call picked restoring the control over widening free-text
search or changing the copy. It also brings the row back in line with RFC-0008's UI section.

**Tests:** the entry-9 "offers no source control" case is removed, and the at-rest test
asserts "All sources" again.

**Revert:** delete the Source `SimpleSelect` block and its three imports, and restore the
"offers no source control" test.

### 3. Delete the orphaned description editor
- **Type:** Fix
- **Intent:** An editor with no entry point is removed.
- **Why:** Left without a caller by 2026-09-07-dwarner-skills-demo-prep#48 (S1).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Recorded in the interim log as entry 51.

**Files:** `mlflow/server/js/src/skills-registry/hooks/useEditSkillDescriptionModal.tsx` *(deleted)*

**What:** Removed. After entry 48 nothing imports it.

**Revert:** `git checkout 9353ba5c4 -- mlflow/server/js/src/skills-registry/hooks/useEditSkillDescriptionModal.tsx`

### 4. Composed branch: version content in tabs under the metadata
- **Type:** Decision
- **Intent:** Where a version has more than one kind of content (files, reverse lookups), those sit in tabs under the metadata grid; Traces stays at page level.
- **Why:** On the skills-only branch Files was the last tab left, so the strip went; on the composed branch the reverse lookups keep it worth having (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx (on agent-registry-rfc, 5aa7d4fee)
- **Notes:** The pane keeps Daniel's page-level Preview / Traces switch (2026-09-07-dwarner-skills-demo-prep#8) and holds a Files / Used by agents / Packaged in plugins strip, on the `tab` query parameter the agent and plugin pages already use.

## Open questions
