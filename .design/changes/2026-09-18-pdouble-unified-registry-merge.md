---
id: 2026-09-18-pdouble-unified-registry-merge
author: Peter Double
date: 2026-09-18
target: mlflow
branch: agent-registry-rfc
base: 89e15cf94
features: [agent-registry, agent-plugins]
sources:
  - {id: S1, kind: review, title: "Owner review of the two reference pickers", date: 2026-08-26}
  - {id: S2, kind: review, title: "Owner ruling on the unified-registry merge", date: 2026-09-12}
  - {id: S3, kind: review, title: "Owner answers at the v11 trial merge", date: 2026-09-18}
impact: none
---

# Unified-registry merge: one reference picker

## Narrative
`unified-registry` (`baa3623b4`) merged into `agent-registry-rfc` as v11, the
last run before the per-registry branches retire. It carried two commits of
content: Aditi Saluja's demo-feedback pass (`2026-08-26-asaluja-agent-registry-demo-feedback`)
and the extraction of her picker to a shared component that every registry form
uses. The 2026-09-09 rework had deleted that shared picker and built the agent
and plugin forms on the older one, so git would have merged cleanly while
deleting the picker the owner had chosen and leaving seven fields importing a
file that no longer existed. The merge restores her picker, rewires the agent
bill of materials (five fields) and the plugin members (two fields) to it,
deletes the older picker, and keeps the 2026-09-09 compare tab and list filters
over her versions of them.

## Entries

### 1. Every registry form links references through the same picker
- **Type:** Decision
- **Intent:** Every field that links another registry's records (skills,
  plugins, MCP servers, models, agents) uses the one searchable multi-select:
  checkboxes inside the dropdown, linked records as chips below, pinned to
  their latest version. A record already linked shows checked, and unchecking
  it unlinks it. The field's label is drawn once, by the picker.
- **Why:** The owner chose this picker over the one written alongside it (S1),
  and ruled that the merge resolves to it (S2).
- **Replay:** none
- **Replays:** 2026-08-26-asaluja-agent-registry-demo-feedback#1 (agent-plugins)
- **Supersedes:** none
- **Files:** RefLinkSection.tsx (restored), AgentBomPicker.tsx,
  AgentPluginMemberPicker.tsx; RegistryEntityPicker.tsx and its test deleted
- **Revert:** restore RegistryEntityPicker from 89e15cf94 and the two callers
- **Notes:** Registered models with no version keep pinning `external`, and
  name-level agent references keep `name-level`, through the callers' own
  mapping. The older picker hid already-linked records; this one lists them
  checked, which is why it won S1.

### 2. A reference field with nothing to link says so
- **Type:** Fix
- **Intent:** When the registry behind a reference field holds nothing that
  can be linked, the field is disabled and a line directly under it says why
  (for example, that no skill has an active version yet).
- **Why:** The dropdown drops any row that is not an option, so its own "None
  registered yet." never rendered and an empty dropdown opened on a bare
  search box. The older picker stated the empty case on the field; the owner
  asked for that behaviour to be kept as an optional addition (S3).
- **Replay:** none
- **Supersedes:** none
- **Files:** RefLinkSection.tsx, RefLinkSection.test.tsx
- **Notes:** The prop is optional; without it the picker behaves as she wrote
  it. Her two menu strings also moved to translated messages.

### 3. Version comparison keeps its rows beside the declared changes
- **Type:** Decision
- **Intent:** Comparing agent versions shows per-metric score deltas and how
  many regressed as rows beside the declared-changes diff, not as a grid of
  tiles.
- **Why:** The 2026-09-09 compare tab computes the same deltas and regression
  count; her tile layout is an optional restyle, not a gap (S2).
- **Replay:** none
- **Supersedes:** 2026-08-26-asaluja-agent-registry-demo-feedback#3
- **Files:** AgentVersionCompareView.tsx deleted (was already deleted here)

### 4. The agent list keeps its filter row
- **Type:** Decision
- **Intent:** The agent list filters by search, status, organization and a
  bill-of-materials axis with a searchable name, which covers filtering by
  skill.
- **Why:** The 2026-09-09 filter row subsumes her searchable skill filter (S2).
- **Replay:** none
- **Supersedes:** 2026-08-26-asaluja-agent-registry-demo-feedback#2
- **Files:** AgentListPage.tsx (this branch's side of both hunks)

## Open questions
- The picker's closed field shows its label, not its placeholder text, so the
  "Search registered skills" style prompts passed to it are never seen. Keep,
  or show the placeholder in the field and the label only above it?
- Menu rows show a record's full description; the dropped picker cut it to one
  line. Long skill descriptions now make rows several lines tall. Clamp to one
  or two lines, or keep the full text?
