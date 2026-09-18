---
id: 2026-09-07-dwarner-skills-demo-prep
author: Daniel Warner
date: 2026-09-07
target: mlflow
branch: dw-design-updates-for-demo
base: 9544ee0a1
features: [skills-registry]
sources:
  - {id: S1, kind: review, title: "2026-09-01 skills registry UX review (Murdock, Warner, Wang, Prahl, Watanabe)", date: 2026-09-01}
  - {id: S2, kind: meeting, title: "2026-09-04 UX/UI-Eng working session (Murdock, Warner, Wang, Nosirova)", date: 2026-09-04}
  - {id: S3, kind: review, title: "Bill Murdock's RFC-0008 review thread", url: "https://github.com/mlflow/rfcs/pull/26"}
  - {id: S4, kind: doc, title: "MLflow 3.15 MCP registry (demo site)", url: "https://demo.mlflow.org/#/mcp-registry"}
  - {id: S5, kind: doc, title: "MLflow prompt registry detail and usage screens (reference implementation in this repo)"}
  - {id: S6, kind: meeting, title: "Skills registry demo prep requests ahead of the 2026-09-08 demo", date: 2026-09-08}
  - {id: S7, kind: doc, title: "RFC-0008 skills registry", url: "https://github.com/mlflow/rfcs/pull/26"}
  - {id: S8, kind: review, title: "Matt Prahl's organization filter requests"}
impact: none
---

# Skills registry: demo-prep pass (Daniel Warner)

## Narrative
Daniel Warner's last-mile design pass on the skills registry prototype ahead of
the 2026-09-08 demo, made on his own branch off `skills-registry-rfc` at
`9544ee0a1`. The aim was to make the skills screens read like the MLflow
registries that already ship: the prompts detail page (header, tag row,
Preview / Traces switch, version rail, code blocks) and the MCP server pages
(card dimming, description type). Along the way he reworked the create form
around radio-driven progressive disclosure, fixed several display bugs (a
source link printed twice, a duplicate new-window icon, a dead icon style
prop) and made the folder upload actually read the files. Several entries
reverse earlier ones as the demo took shape; Supersedes records the net
result. Converted on 2026-09-11 from his running log (`dw_ui_changes.md`,
later `.design/2026-09-07-dw-skills-demo/ui-changes.md`); entry 48 records his
final commit `e4032f77b`, which the log did not cover. Two items were ruled on
at merge in `2026-09-11-pdouble-merge-rulings`: the rename in #40 and the
unfilterable source type named in #46.

## Entries

### 1. Hide the organization (`@acme-platform`) from the three skill display surfaces
- **Type:** Update
- **Intent:** Browse cards and the detail header do not print @org under the name; the full @org/name stays in the name's tooltip.
- **Why:** Seeded organization names read as noise on browse surfaces (S6). The table half was reversed by #45.
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillCard.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillListTable.tsx`

**What:** Removed the `@{organization}` line that rendered under the skill name in
three places:

| Surface | Was |
|---|---|
| Skill detail page | secondary text under the `<h2>` title |
| Skill card (card view) | secondary line between the title row and the description |
| Skill list table | the whole **Organization** column |

Follow-on cleanups the removals required:
- Dropped the now-unused `ORGANIZATION` member from the `ColumnKeys` enum and the
  `SkillOrganizationCell` import in `SkillListTable.tsx`.
- Left `SkillOrganizationCell` itself in place in `SkillCellRenderers.tsx`. It is
  now unreferenced, but it is an export so it does not trip lint, and keeping it
  makes the revert a clean one-file operation.

**Why:** Demo prep — the seeded org names are placeholder data and read as noise on
the skill surfaces.

**Not changed:** The **Organization** filter dropdown in the list page filter row
(`SkillListFilters.tsx`) still exists and still lists `@acme-platform` in its
options. It was outside the stated scope; removing it changes filtering behaviour
rather than just display. Flagged for a decision before the demo.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing across 5 suites; ESLint clean on all three files; webpack recompiled with
no new warnings.

**Revert:**
```bash
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/skills-registry/components/SkillPage.tsx \
  mlflow/server/js/src/skills-registry/components/SkillCard.tsx \
  mlflow/server/js/src/skills-registry/components/SkillListTable.tsx
```

### 2. Move tags under the heading (prompts-style) and drop "Alias references"
- **Type:** Update
- **Intent:** Entity tags render as an uncaptioned chip row under the detail title; the entity-level alias block is dropped because aliases belong to versions.
- **Why:** Align the detail header with the prompts detail page (S5, S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`

**What:** Replaced the two-column captioned metadata row that sat below the
description with a bare tag chip row directly under the page title.

Before — a `flex` row holding two labelled blocks, below the description:

```
  <h2> skill name
  description paragraph
  Tags                    Alias references
  [key: value] [key: …]   [@org/name@prod] […]
```

After — chips immediately under the title, no caption, description below:

```
  <h2> skill name
  [key: value] [key: …]
  description paragraph
```

This matches `PromptsDetailsPage.tsx`, where `PromptsListTableTagsBox` renders as an
uncaptioned chip row immediately after the `Header`.

Details:
- The `Tags` caption is gone, along with the `Alias references` caption and its
  `SkillAliasesCell`. Removed the now-unused `SkillAliasesCell` import.
- The tag row is wrapped in a `skill.tags.length > 0` guard. Without it,
  `SkillTagsCell` falls back to `<EmptyCell />` (a dash), which looked like stray
  punctuation floating under the title when a skill has no tags. The old layout
  never hit this because the `Tags` caption gave the dash context.
- `SkillAliasesCell` is left in `SkillCellRenderers.tsx`, now unreferenced.

**Why:** Demo prep — align the skill detail page with the prompt detail page, and
cut the alias block from the header area.

**Alias functionality is not lost:** this only removed the skill-level *display* of
aliases. Per-version aliases still render, with their pencil edit affordance, via
`SkillVersionAliasesCell` in `SkillVersionPane.tsx:338` and `SkillVersionRail.tsx:157`.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing; ESLint and Prettier clean on the file; webpack recompiled with no new
warnings.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillPage.tsx`

> Note: entries 1 and 2 both touch `SkillPage.tsx`. Reverting that file undoes the
> org hiding from entry 1 as well.

### 3. Add an inline edit-tags pencil beside the tag row
- **Type:** Update
- **Intent:** The entity tag row carries its own edit control: a pencil after the chips, or an 'Add tags' button when there are none, opening a tags-only editor.
- **Why:** Prompts parity: tags are edited where they are shown (S5).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillTagsBox.tsx` *(new)*
- `mlflow/server/js/src/skills-registry/hooks/useEditSkillTagsModal.tsx` *(new)*
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx` *(modified)*

**What:** The tag row from entry 2 now carries an inline edit affordance, matching
the prompt details page:

| Skill has tags | Renders |
|---|---|
| yes | chips followed by a small tertiary pencil button |
| no | a single tertiary **Add tags** button |

Clicking either opens a tags-only modal. Saving writes through the existing
`setSkillTag` / `deleteSkillTag` store mutators, which call `notify()`, so the chip
row updates without a reload.

Two new files rather than inline JSX:
- `SkillTagsBox.tsx` — the chip row plus button, mirroring `PromptDetailsTagsBox.tsx`.
  Absorbs the `tags.length > 0` guard introduced in entry 2.
- `useEditSkillTagsModal.tsx` — a tags-only modal, built as the skill-level twin of
  the existing `useEditSkillVersionTagsModal`. It reuses `SkillTagsEditor` and diffs
  the draft against stored tags, issuing one write per change (RFC-0008 has no
  "replace all tags" call, so a rename lands as a delete plus a set).

**Why a new hook instead of reusing `useEditSkillModal`:** that modal can already
reach these tags, but it also carries description and icon fields. A pencil sitting
beside the tags that opens a form of mostly unrelated fields is a worse affordance
than no pencil. The kebab → **Edit** path is unchanged and still edits all three.

**Design note:** the empty state shows a labelled "Add tags" button rather than a
bare pencil, copying the prompts behaviour — a lone pencil next to empty space reads
as decoration rather than a control.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing; ESLint and Prettier clean on all three files; webpack recompiled with no
new warnings.

**Revert:**
```bash
rm mlflow/server/js/src/skills-registry/components/SkillTagsBox.tsx \
   mlflow/server/js/src/skills-registry/hooks/useEditSkillTagsModal.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillPage.tsx
```
> Reverting `SkillPage.tsx` also undoes entries 1 and 2.

### 4. Move the description out of the header into the version metadata grid
- **Type:** Update
- **Intent:** The description moves from the header into the version metadata grid.
- **Why:** Keep the header to name and tags (S6).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`

**What:** Dropped the `<Typography.Paragraph>` description from under the page
title, and added a **Description:** row to the version metadata grid in the right
pane, positioned between **Registered at:** and **Status:** as requested.

Header is now just name + tags:

```
  <h2> skill name
  [key: value] [key: value] [pencil]
```

Version pane grid:

```
  Registered at:   2026-08-14 09:22:31
  Description:     Attach and verify SBOM attestations on container images. …
  Status:          Active  [pencil]
  Created by:      …
```

Empty descriptions render a secondary "None", matching how the grid's **Version
tags:** row already handles emptiness.

Also refreshed the `SkillPage` doc comment, which still described a header carrying
"name, description, tags, alias references" — all three of those claims were stale
after entries 1, 2 and 4.

**Why:** Demo prep — keep the header to name and tags, and surface the description
as a labelled field instead.

**Worth knowing — the description is skill-level, not version-level.** RFC-0008
carries `description` on the parent skill only; `SkillVersionEntity` has no such
field. So this row shows the *same* text for every version you click in the rail,
while every other row in that grid changes per version. It behaves correctly, but
if someone clicks through versions during the demo and watches that row stay
frozen, that is why. Making it genuinely per-version would need a schema change.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing; ESLint clean on both files; webpack recompiled with no new warnings.
Prettier flags `SkillVersionPane.tsx`, but on a pre-existing line (170, a wrapped
`defaultMessage`) that this change did not touch — confirmed by diffing Prettier's
output. Left as-is to avoid unrelated reformatting noise in the demo diff.

**Revert:**
```bash
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/skills-registry/components/SkillPage.tsx \
  mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx
```
> Reverting `SkillPage.tsx` also undoes entries 1, 2 and 3.

### 5. Trim the skill detail page header actions
- **Type:** Update
- **Intent:** The detail header has no page-level Use; the primary button reads 'Create <entity> version'; the kebab keeps Edit and Delete.
- **Why:** Remove the duplicate Use and align the primary label with prompts (S5, S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`

**What:** Three changes to the button group at the top right of the skill detail page.

> **Amended later the same session** — the kebab change below was reversed on
> request; **Edit** is back. The table and cleanup list reflect the final state.
> See the amendment note at the end of this entry.

| | Before | After |
|---|---|---|
| Kebab menu | Edit, Delete | Edit, Delete *(unchanged)* |
| Secondary button | **Use** (play icon) | removed |
| Primary button | **Add version** | **Create skill version** |

The new label matches the prompt details page's "Create prompt version".

Cleanups the removals required:
- Dropped the page-level `SkillPullModal`, its `pullModalOpen` state, and the
  `PlayIcon` / `SkillPullModal` imports — all were reachable only through the
  deleted "Use" button. `SkillVersionPane` has its own independent copy of that
  state, button and modal, so the version-scoped "Use" still works.
- `useState` was left unused once `pullModalOpen` went, so the React import is now
  `useMemo` only.

**Why:** Demo prep — drop the duplicate "Use" and align the primary label with prompts.

#### Amendment: Edit restored to the kebab

The kebab was briefly reduced to **Delete** only. That removed the sole entry point
to `useEditSkillModal`, which is the only editor for a skill's **description** and
**icon** — and entry 4 had just moved the description into the version metadata grid
where it reads as a prominent field, so a reviewer would likely try to edit it and
find no way to. Tags were never affected; they keep the pencil from entry 3.

**Edit** was put back on request, restoring: the `DropdownMenu.Item`, the
`useEditSkillModal` call, its `{EditSkillModal}` render, and its import. The kebab is
therefore **Edit, Delete** — identical to the baseline — and description and icon are
editable again. The "Use" removal and the button relabel from this entry both stand.

Net effect of entry 5 on the kebab: none. Only the "Use" button and the primary
button label changed.

**Verification (after the amendment):** `yarn type-check` clean; `yarn test
src/skills-registry` 52/52 passing; ESLint and Prettier clean on the file; webpack
recompiled with "No issues found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
> Also undoes entries 1, 2, 3 and the `SkillPage` half of 4.

### 6. Swap the version pane action order to Delete → Use
- **Type:** Update
- **Intent:** Version pane actions read Delete version, then Use.
- **Why:** Prompts order for version actions (S5).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`

**What:** Reordered the two buttons beside the "Viewing version N" heading.

```
  before:   Viewing version 3        [▶ Use] [🗑 Delete version]
  after:    Viewing version 3        [🗑 Delete version] [▶ Use]
```

Now matches `PromptContentPreview.tsx:133-166`, whose order is
`Delete version → Optimize → Use`. Skills has no Optimize equivalent, so the two
buttons sit adjacent.

Pure reordering — the `Tooltip` wrapper, the `canDelete` disabled state, the danger
styling and both handlers moved unchanged.

**Why:** Demo prep — consistency with the prompt details view.

**Note on the request:** the instruction was to put Delete version *to the right of*
Use, citing consistency with prompts. Those two goals conflicted: the skills pane
already had Delete on the right, while prompts puts Delete on the **left**. Raised
the discrepancy and confirmed the intent was to match prompts, so Delete moved left.
The literal wording would have meant no change at all.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing; ESLint clean; webpack recompiled with "No issues found". Prettier still
flags only the pre-existing line 170 noted in entry 4, untouched here.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`
> Also undoes the `SkillVersionPane` half of entry 4 (the **Description:** row).

### 7. Drop the timestamp from skill cards (table keeps it)
- **Type:** Update
- **Intent:** Cards drop the timestamp; the footer pairs status with the action.
- **Why:** Reduce card noise (S6).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillCard.tsx`

**What:** Removed the last-updated date/time from the card footer in card view. The
footer now pairs the status tag with the **Use** button:

```
  before:   [Active]  2026-08-14 09:22:31              [▶ Use]
  after:    [Active]                                   [▶ Use]
```

**Table view is untouched** — `SkillListTable.tsx` still renders its **Last updated**
column via `Utils.formatTimestamp` (`SkillListTable.tsx:167`), verified after the edit.

Cleanups the removal required:
- Dropped the now-unused `timestamp` const and the `Utils` import. `intl` stays —
  the Use button's tooltip and aria-label still need it.
- Updated the component doc comment, which described "a footer pairing the timestamp
  with a single action button".

**Why:** Demo prep — reduce card noise; the exact time is a table-view concern.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing; ESLint and Prettier clean on the file; webpack recompiled with "No issues
found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillCard.tsx`
> Also undoes the `SkillCard` half of entry 1 (the `@organization` line).

### 8. Promote "Traces & evaluations" to a page-level Preview / Traces switch
- **Type:** Decision
- **Intent:** Traces leaves the version pane for a page-level Preview / Traces switch above the rail; only the right pane swaps, Preview is the default, Traces is ?mode=traces.
- **Why:** Prompts parity and a shorter label (S5). Reopens the tabs-under-metadata ruling of the 2026-09-04 session (S2); settled for the composed branch in 2026-09-11-pdouble-merge-rulings#4.
- **Replay:** agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`

**What:** The tab renamed to **Traces**, and moved out of the right pane up to a
segmented control above the versions rail, exactly where the prompt details page puts
its Preview / Compare / Traces switch.

Before — two tabs inside the right pane, below the metadata grid:

```
  ┌ Versions ─┐ ┌ Viewing version 3  [Delete version] [Use] ─────────┐
  │ v3        │ │ Registered at: …                                   │
  │ v2        │ │ Description:   …                                   │
  │ v1        │ │ ─────────────────────────────────                  │
  │           │ │ [ Files | Traces & evaluations ]                   │
  │           │ │ (file browser)                                     │
```

After — a `[Preview | Traces]` control over the rail; it swaps the right pane:

```
  [🔍 Preview] [⑂ Traces]
  ┌ Versions ─┐ ┌ Viewing version 3  [Delete version] [Use] ─────────┐
  │ v3        │ │ Registered at: …                                   │
  │ v2        │ │ Description:   …                                   │
  │ v1        │ │ (file browser)                                     │
```

Built to match `PromptsDetailsPage.tsx:222-263` (the `SegmentedControlGroup`) and
`:279-312` (the right-pane swap): same `ZoomMarqueeSelection` icon on Preview, same
`ForkHorizontalIcon` on Traces, same "rail stays put, only the right pane changes"
behaviour — so switching modes can never show you a different version than the one
you have selected. No **Compare** button: prompts can diff two prompt texts,
skills have no equivalent content-diff view to compare into.

**The version pane's tab strip is gone.** Lifting Traces out left `Files` alone in a
two-tab strip, and a single tab is chrome with nothing to choose, so the files now
render directly under the metadata grid. Say the word if you would rather keep a
one-item strip for the demo — it is a small change back.

**URL state:** the query param changed from `?tab=observability` to `?mode=traces`.
Preview is the default and stays out of the URL, so `#/skills/@org/name` is unchanged
for the common case. Any bookmark or slide link using the old `?tab=` value will now
land on Preview rather than erroring.

Cleanups the move required:
- Deleted the `SkillDetailTab` enum, the `isSkillDetailTab` guard, and the
  `activeTab` / `onTabChange` props from `SkillVersionPaneProps` — all were used only
  by the strip. No test referenced them.
- Dropped the now-unused `Tabs` and `SkillObservabilityTab` imports from
  `SkillVersionPane.tsx`; `SkillObservabilityTab` is now imported by `SkillPage.tsx`.

**Not renamed:** the component file is still `SkillObservabilityTab.tsx`, and its
in-file doc comment still refers to a tab. Only the user-visible label was in scope;
renaming the file would have added churn to the demo diff for no visible effect.

**Why:** Demo prep — consistency with the prompt details page, and a shorter label.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing across 5 suites; ESLint clean on both files; Prettier clean on
`SkillPage.tsx` and, on `SkillVersionPane.tsx`, still flagging only the pre-existing
line noted in entry 4. Webpack recompiled with "No issues found" and the same 14
baseline warnings.

**Revert:**
```bash
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/skills-registry/components/SkillPage.tsx \
  mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx
```
> Also undoes entries 1, 2, 3, 4, 5 and 6.

### 9. Simplify the skills list page: drop the subtitle, the Organization and Source filters
- **Type:** Update
- **Intent:** The list page goes straight from title to filter row, with no subtitle paragraph.
- **Why:** Match the prompts and MCP list pages (S4, S5). The filter cuts were reversed by #44 and 2026-09-11-pdouble-merge-rulings#2.
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillListPage.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.test.tsx`

**What:** Three removals, bringing the list page in line with the prompts and MCP
registry list pages (MCP as shipped in 3.15 — https://demo.mlflow.org/#/mcp-registry),
both of which go from title straight to a spare filter row.

| Removed | Was |
|---|---|
| Subtitle paragraph | *"Versioned records pointing at content in git, an OCI image, a ZIP archive, or MLflow artifacts. The registry stores the source; the content stays where it is."* |
| **Organization** filter | a searchable `RegistryFilterCombobox`, placeholdered "All organizations" |
| **Source** filter | a `SimpleSelect`, placeholdered "All sources" |

The filter row is now search box + **Status**:

```
  before:   [Search skills] [Status: All statuses] [All organizations ▾] [Source: All sources]
  after:    [Search skills] [Status: All statuses]
```

**Filtering behaviour is not lost, only the controls.** `organization` and `sourceType`
are still fields on `SkillListFilters`, `useSkills` still applies them, and
`SkillListPage`'s `isFiltered` check still counts them — so a preset or a future URL
param would still work. Free text also still searches organization, so typing
`ocp-admin` narrows the list the way the dropdown did.

This finally closes the loose end flagged in entry 1: the Organization dropdown was the
one place `@acme-platform` still surfaced after the org was hidden from the card, table
and detail page.

Cleanups the removals required:
- Dropped the now-unused `RegistryFilterCombobox`, `useSkillOrganizations`,
  `SkillSourceType`, `SOURCE_TYPE_LABELS` and `SOURCE_TYPE_OPTIONS` imports from
  `SkillListFilters.tsx`, and the `organizations` local.
- Dropped the `Typography` import from `SkillListPage.tsx`, unused once the paragraph went.
- `useSkillOrganizations` (`hooks/useSkills.ts:103`) is now unreferenced. Left in place,
  same call as `SkillOrganizationCell` in entry 1: it is an export so it does not trip
  lint, and leaving it keeps the revert to the files listed above.

**Tests updated** (`SkillListFilters.test.tsx`): the "narrows the organization list as you
type" test tested a control that no longer exists, so it was replaced by one asserting
neither control renders. The "describes itself at rest" test dropped its "All sources"
and "All organizations" assertions. Suite count is unchanged at 4.

**Worth a look before the demo:** RFC-0008's UI section explicitly calls for organization
and source-type filters, so this is a deliberate divergence from the spec in favour of
consistency with the shipped registries. Easy to put back if a reviewer asks for it.

**Why:** Demo prep — match the choices made for the Prompts and MCP registry pages.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing across 5 suites; ESLint and Prettier clean on all three files; webpack
recompiled with "No issues found" and the same 14 baseline warnings.

**Revert:**
```bash
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/skills-registry/components/SkillListPage.tsx \
  mlflow/server/js/src/skills-registry/components/SkillListFilters.tsx \
  mlflow/server/js/src/skills-registry/components/SkillListFilters.test.tsx
```
> These three files are untouched by entries 1-8, so this revert is independent.

### 10. Restore the gap between the "Skills" heading and the filter row
- **Type:** Fix
- **Intent:** Keep the standard gap between the list title and the filter row.
- **Why:** The removed subtitle had been holding the gap; prompts uses the same spacer (S5).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillListPage.tsx`

**What:** Added a `<Spacer shrinks={false} />` between the `Header` and
`RegistryListControls`.

```
  before:   Skills                          [Create skill]
            [Search skills] [Status]

  after:    Skills                          [Create skill]

            [Search skills] [Status]
```

This is the gap entry 9 took away by accident: the subtitle paragraph was also
providing the vertical separation, so removing it butted the search box against the
title. `PromptsPage.tsx:84` puts the identical `<Spacer shrinks={false} />` between its
own `Header` and `PromptsListFilters`, so this matches prompts rather than being a
value chosen to look right.

**Why the spacer and not a margin on `RegistryListControls`:** that component is shared
by all four registries, so a top margin there would have moved the MCP, model and prompt
rows too.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing; ESLint and Prettier clean on the file; webpack recompiled with "No issues
found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillListPage.tsx`
> Also undoes the `SkillListPage` half of entry 9 (the subtitle removal) — which is
> consistent, since the subtitle is what used to hold this gap open.

### 11. Make the skill code snippets follow the app theme
- **Type:** Fix
- **Intent:** Code snippets follow the app theme.
- **Why:** Code blocks rendered light inside dark modals (S6).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillPullInstructions.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillRegisterSnippet.tsx`

**What:** Added the `theme` prop to both `CodeSnippet` blocks, so they render dark in
dark mode like every other code block in MLflow.

```tsx
<CodeSnippet
  language={format === PullFormat.CLI ? 'text' : 'python'}
  theme={theme.isDarkMode ? 'duotoneDark' : 'light'}   // <-- added
  style={{ padding: theme.spacing.sm }}
>
```

**Why it was wrong:** `CodeSnippet` defaults to `theme = 'light'`
(`shared/web-shared/snippet/CodeSnippet.tsx:87`) and does *not* read the DuBois theme on
its own. Omitting the prop is not "inherit" — it is "always light". So the Use modal
showed a white `#fafafa` block inside a dark modal.

This ternary is the house idiom, not an invention: all 21 other `CodeSnippet` call sites
in the app pass exactly `theme={theme.isDarkMode ? 'duotoneDark' : 'light'}`, including
`AgentActionCard.tsx:229-267`, which renders the "Or use coding agents/code snippets"
panel in the screenshot.

**Two files, not one.** The ask was about the **Use** modal
(`SkillPullInstructions`), but `SkillRegisterSnippet` — the CLI/Python arms of the
**Create skill** modal — had the identical omission. Fixing only the Use modal would
have left two snippet surfaces in the same feature disagreeing about theme, which is
worse than either state on its own.

**Known remaining light block, outside this feature:**
`experiment-tracking/pages/experiment-overview/components/QualityTabEmptyState.tsx:129`
has the same bug. Left alone — it is not skills registry and not in the demo path.

**Not changed:** no `backgroundColor` override. `AgentActionCard` adds
`backgroundColor: theme.colors.backgroundPrimary` so its block blends into its card;
these snippets sit in modals where Prism's own `#2a2734` reads as an intentional code
block, which is also what `CodeBlock.tsx:16-43` does.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 52/52
passing; ESLint and Prettier clean on both files; webpack recompiled with "No issues
found". Worth an eyeball in both themes — toggle dark mode and open **Use** on any
skill, then **Create skill** → CLI.

**Revert:**
```bash
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/skills-registry/components/SkillPullInstructions.tsx \
  mlflow/server/js/src/skills-registry/components/SkillRegisterSnippet.tsx
```
> Neither file is touched by entries 1-10, so this revert is independent.

### 12. Demote the resolution line in the Use modal to a footnote
- **Type:** Update
- **Intent:** The Use modal's resolution line is one muted sentence, not a bold label plus value.
- **Why:** Resolution detail is reference material, not an instruction (S6). Its placement was reversed by #38.
- **Replay:** agent-plugins
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillPullModal.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillPullInstructions.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillPullModal.test.tsx`

**What:** Moved "Resolves through alias: production (currently v2) [Active]" from above
the format toggle down to the bottom of the modal, directly above "Fetches the content
from its source into a local directory.", and restyled it to match that line.

```
  before:                          after:
  ─────────────────────────        ─────────────────────────
  Resolves through alias:          [CLI] [Python]
  production (currently v2)        ┌───────────────────────┐
  [Active]                         │ mlflow skills pull …  │
  [CLI] [Python]                   └───────────────────────┘
  ┌───────────────────────┐        Resolves through alias: production
  │ mlflow skills pull …  │        (currently v2) [Active]
  └───────────────────────┘        Fetches the content from its source
  Fetches the content from…        into a local directory.
```

Style change: was **bold label** + regular value at `size="sm"`; now the whole line is
`size="sm" color="secondary"`, identical to the "Fetches the content…" sentence it now
sits above.

**How it is wired:** `SkillPullInstructions` grew a `resolutionNote?: React.ReactNode`
prop and renders it as the first line of a footnote block it owns. The styling lives in
that component rather than at the call site, so the two footnotes cannot drift apart.
`SkillPullModal` is the only consumer.

**One message instead of two.** The bold-label version needed the label and value as
separate `Typography.Text` nodes, so they were separate `FormattedMessage`s. With one
weight there is nothing to split, so they merged:

| Before | After |
|---|---|
| `"Resolves through alias:"` + `"{alias} (currently v{version})"` | `"Resolves through alias: {alias} (currently v{version})"` |
| `"Pinned version:"` + `"v{version}"` | `"Pinned version: v{version}"` |

Better for translators, who now get a sentence rather than a fragment. Two old i18n
keys are retired and two new ones added.

**Judgment call — the status tag stayed a tag.** "Give it the same subtle text style"
could be read as flattening **Active** into grey text too. It is still a colored `Tag`,
because that is how status renders on every other skills surface (card, table, rail,
version pane) and the color is the information. Say the word if you would rather it be
plain text — it is a two-line change.

**Tests updated** (`SkillPullModal.test.tsx`): the "labels which of the two it handed
over" test asserted on the now-retired `'Pinned version:'` fragment and was failing; it
now matches the merged sentence. Added a companion test for the alias branch, which had
no coverage — the alias name and the version it currently points at are both load-bearing
in a copied command. Suite goes 3 → 4 tests, total 52 → 53.

**Why:** Demo prep — the resolution detail is reference material, not an instruction, so
it reads better beside the sentence it qualifies than as a bold heading above the thing
you came to copy.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 53/53 passing
across 5 suites; ESLint and Prettier clean on all three files; webpack recompiled with
"No issues found".

**Revert:**
```bash
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/skills-registry/components/SkillPullModal.tsx \
  mlflow/server/js/src/skills-registry/components/SkillPullInstructions.tsx \
  mlflow/server/js/src/skills-registry/components/SkillPullModal.test.tsx
```
> Reverting `SkillPullInstructions.tsx` also undoes its half of entry 11 (the dark-mode
> `theme` prop). To keep entry 11, revert only the modal and the test, then re-add the
> `resolutionNote` prop removal by hand — or just re-apply the one-line `theme` prop.

### 13. Reuse the prompts code block, replacing entry 11's approach
- **Type:** Update
- **Intent:** Code snippets in the Use and Create modals render as the prompts usage block: page-toned background, wrapped long lines, borderless copy icon.
- **Why:** The two Use modals should look like one product (S5).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** #11
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/experiment-tracking/components/artifact-view-components/ShowArtifactCodeSnippet.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillPullInstructions.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillRegisterSnippet.tsx`

> **This supersedes entry 11.** Entry 11 made the skill snippets dark by passing
> `theme="duotoneDark"`. Prompts does *not* do that — it keeps the light Prism palette
> and overrides the background instead. Both look dark in dark mode, but they are
> visibly different blocks, which is what the request was about. The `duotoneDark`
> prop is gone; entry 11's outcome (dark in dark mode) survives by other means.

**What:** Both skill snippets now render through `ShowArtifactCodeSnippet` — the exact
component behind the prompt **Usage example** modal — instead of hand-assembling a
`CodeSnippet` and a `CopyButton`.

What changes visually:

| | Skills before | Skills now / prompts |
|---|---|---|
| Palette | `duotoneDark` (Prism's `#2a2734` purple-black) | light palette, background overridden to `theme.colors.backgroundSecondary` |
| Text color | Prism default | `theme.colors.textPrimary` |
| Long lines | overflow | `wrapLongLines` + `whiteSpace: 'pre-wrap'` |
| Copy button | small default button with visible "Copy"-style chrome | borderless `CopyIcon`, `showLabel={false}` |

The long-line wrapping matters here beyond consistency: the CLI pull command is long
enough to overflow the modal, and it now wraps instead.

**The shared component gained three optional props**, all defaulted so the six artifact-view
call sites and the prompts modal render byte-identically to before:

| Prop | Default | Why |
|---|---|---|
| `language` | `'python'` | the CLI tab needs `'text'`; `CodeSnippetLanguage` has no shell grammar |
| `componentId` | `CopyButton`'s own default | keeps the skills analytics IDs that already existed |
| `copyAriaLabel` | none | keeps the accessible name the skills buttons already had |

`componentId` is named exactly that, not `copyComponentId`: the
`@databricks/no-dynamic-property-value` lint rule only accepts a literal or a parameter
named `componentId`, and rejected the longer name.

**Two files again, for the reason given in entry 11:** the ask was the Use modal, but
`SkillRegisterSnippet` (the Create skill modal's CLI/Python arms) is the same affordance
in the same feature, and leaving the two disagreeing is worse than either alone.

**Note on `ShowArtifactCodeSnippet` a11y, unchanged:** it renders the copy button with
`showLabel={false}`, so without `copyAriaLabel` the button has no accessible name. That
is pre-existing and still true for the prompts and artifact-view call sites; the skills
call sites pass the label, so they are fine.

**Why:** Demo prep — the two Use modals should look like one product.

**Verification:** `yarn type-check` clean; ESLint and Prettier clean on all three files;
`yarn test src/skills-registry` 53/53 passing. Because a shared component changed, also
ran `yarn test src/experiment-tracking/components/artifact-view-components
src/experiment-tracking/pages/prompts` — 183/183 passing across 25 suites. Webpack
recompiled with "No issues found".

**Revert:**
```bash
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/experiment-tracking/components/artifact-view-components/ShowArtifactCodeSnippet.tsx \
  mlflow/server/js/src/skills-registry/components/SkillPullInstructions.tsx \
  mlflow/server/js/src/skills-registry/components/SkillRegisterSnippet.tsx
```
> Reverting `SkillPullInstructions.tsx` also undoes entry 12's `resolutionNote` prop, so
> revert `SkillPullModal.tsx` and its test alongside if you take this one back.
> `ShowArtifactCodeSnippet.tsx` is the only file outside `skills-registry/` touched in
> this whole log.

### 14. Move Content digest below Source, and give it a copy button
- **Type:** Update
- **Intent:** Content digest sits right after Source and has a copy button that copies the full value.
- **Why:** Group the source rows; digests are pasted, not transcribed (S6).
- **Replay:** agent-plugins
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`

**What:** Reordered the version metadata grid and added a copy affordance to the digest.

```
  before:                    after:
  Created by:                Created by:
  Content digest:  a1b2c3…   Aliases:
  Aliases:                   Version tags:
  Version tags:              Source:
  Source:                    Content digest:  a1b2c3d4e5f6  [⧉]
  Reference URIs:            Reference URIs:
```

Digest now sits between the source it was computed from and the URIs that resolve to it,
so those three rows read as one "where did this come from and how do I ask for it again"
block.

**The copy button copies the full digest, not the twelve characters on screen.**
`SkillDigestCell` truncates via `formatDigest` (`utils.ts:256`) and keeps the whole value
in a tooltip. A copy button handing over the truncation would be worse than no button —
a digest is only useful whole — so it reads `skillVersion.digest` directly.

Details:
- The button is in `SkillVersionPane`, not inside `SkillDigestCell`. That cell also
  renders in the version rail and the list table, where a per-row copy button is clutter.
- It is hidden when there is no digest. `SkillDigestCell` renders "Not computed" in that
  case, and a copy button beside it would offer to copy nothing.
- Uses the shared `CopyButton` with `showLabel={false}` and `<CopyIcon />` — the same
  borderless icon treatment entry 13 brought to the snippets — at `size="small"` to match
  the pencil buttons elsewhere in the grid.

**Why:** Demo prep — grouping the source-related rows, and digests are meant to be pasted
into a comparison rather than transcribed.

**Verification:** `yarn type-check` clean; `yarn test src/skills-registry` 53/53 passing;
ESLint clean; webpack recompiled with "No issues found". Prettier still flags only the
pre-existing line noted in entry 4, untouched here.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`
> Also undoes entries 4 (the **Description:** row), 6 (the Delete/Use order) and the
> version pane's half of entry 8 (the removed tab strip).

### 15. Open a skill's file in a modal instead of a column beside the tree
- **Type:** Update
- **Intent:** The file tree takes the full width and a file opens in a modal; nothing opens on arrival.
- **Why:** Both halves of the side-by-side split were too narrow (S6).
- **Replay:** agent-plugins
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillFilesTab.tsx`

**What:** The Files tab was a two-column row — a 320px file tree on the left, the selected
file's content in the space to the right. The tree is now full width and clicking a file
opens its content in a wide modal.

```
  before:                                after:
  ┌──────────────┬────────────────────┐  ┌───────────────────────────────────┐
  │ ▸ SKILL.md   │ ---                │  │ ▸ SKILL.md                  1.4 KB│
  │   references │ name: pr-review    │  │   references/                     │
  │   scripts    │ ---                │  │   scripts/                        │
  │              │                    │  └───────────────────────────────────┘
  │              │ # PR review        │        click a file ↓
  │              │ Use this skill …   │  ┌── references/style.md ──────── ✕ ─┐
  └──────────────┴────────────────────┘  │ # Style guide                     │
   tree 320px      content, always on    │ Prefer …                          │
                   showing SKILL.md      └───────────────────────────────────┘
```

**Nothing is open on arrival.** The pane version defaulted to the entry point
(`selectedPath ?? files.find(f => f.isEntryPoint)?.path`) because empty space beside a tree
reads as broken. A modal that opened by itself would read as something the reader did not
ask for, so that default is gone and `activePath` starts `undefined`.

Details:
- **Two state values, not one nullable path.** `activePath` is the last file read and
  outlives the modal, so the tree keeps marking that row; `isFileModalOpen` is whether the
  reader is looking at it right now. Collapsing them into one would also blank the modal
  body mid-close-animation.
- The tree frame keeps its `maxHeight: 420` + internal scroll (the 2026-09-04 decision
  about not letting an expanded tree set the page height still holds); it only loses the
  fixed 320px basis.
- The content keeps its existing treatment — same `<pre>`, same `backgroundSecondary`, same
  frontmatter split through `renderManifest()` for SKILL.md. The border came off (the
  dialog is the frame now) and `maxHeight` went from `420` to `60vh`.
- The "stored but too large to preview" fallback moved into the modal rather than being
  dropped, so clicking such a file explains itself instead of doing nothing.
- **Pointer-source skills are untouched.** Those rows still `window.open` the file at the
  provider; `SkillFileTree` only calls `onSelect` when `rendersContent`, so the modal never
  opens for them.

**`SkillFileTree.tsx` was not modified** — its `activePath` / `onSelect` contract fit as-is.

**Judgment call:** the modal shows the file as plain `<pre>` text rather than routing it
through the shared `ShowArtifactCodeSnippet` block from entry 13. That block would add a
copy button and Prism highlighting, but skill files are mostly markdown, and it is a
larger change than "show it in a modal". Worth revisiting if you want the copy button.

**Why:** Requested during demo prep — both halves of the split were losing. The tree had
320px to render nested paths in, and source lines wrapped in whatever the pane had left.

**Verification:** `yarn type-check` clean; ESLint clean; `npx prettier --check` clean;
`yarn test src/skills-registry` 53/53 passing; webpack recompiled with "No issues found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillFilesTab.tsx`
> This file is otherwise untouched by entries 1–14, so the revert is self-contained.

### 16. Give the file browser a "Files:" label inside the metadata grid
- **Type:** Update
- **Intent:** When Files is the only version content, it renders as a labelled 'Files:' grid row instead of an unlabelled block.
- **Why:** An unlabelled block read as a separate region (S6).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`

**What:** The file tree was a full-width block hanging off the bottom of the pane, below
and outside the label/value grid. It is now the grid's last row, labelled `Files:`, so its
left edge lines up with every other value.

```
  before:                              after:
  Source:          github.com/…        Source:          github.com/…
  Content digest:  a1b2c3d4e5f6  [⧉]   Content digest:  a1b2c3d4e5f6  [⧉]
  Reference URIs:  skills:/…           Reference URIs:  skills:/…
                                       Files:           ┌──────────────────┐
  ┌────────────────────────────────┐                    │ ▸ SKILL.md 1.4 KB│
  │ ▸ SKILL.md              1.4 KB │                    │   references/    │
  │   references/                  │                    └──────────────────┘
  └────────────────────────────────┘
   full-width, unlabelled section      labelled row, indented to the value column
```

Details:
- The label follows the existing convention (`Typography.Text bold`, trailing colon,
  `description: 'Skill version pane metadata label'`), so it is indistinguishable from the
  rows above it — including to a translator.
- It sits last in the grid because it is by far the tallest row. The tree bounds itself at
  420px and scrolls, so any row after it would land an awkward distance down the page.
- The grid already sets `alignItems: 'flex-start'`, so the label sits at the top of the
  tree rather than floating in the middle of a 420px row. No new alignment rule needed.
- The value cell carries `minWidth: 0` — without it a long file path would push the grid
  column wider than the pane.
- Spacing changed slightly as a side effect: the block used to get the pane's `md` flex gap
  plus its own `md` top margin, and now gets the grid's `sm` row gap like its neighbours.
  That is the point of the change rather than an accident of it.

**Why:** Requested during demo prep — an unlabelled full-width region under the properties
read as a separate part of the page rather than as one of the things the pane says about a
version.

**Verification:** `yarn type-check` clean; ESLint clean; `yarn test src/skills-registry`
53/53 passing; webpack recompiled with "No issues found". Prettier still flags only the
pre-existing line noted in entry 4, untouched here.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`
> Also undoes entries 4, 6, 14 and the version pane's half of entry 8 — see those entries.

### 17. Drop the content digest from the version rail rows
- **Type:** Update
- **Intent:** Version rail rows show version, status and aliases on one line with the timestamp beneath; no digest.
- **Why:** The hash was noise in the rail; matches the prompts version cell (S5, S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillVersionRail.tsx`,
`mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx` (stale comment only)

**What:** Rail rows no longer print the digest hash under the version name.

```
  before:                          after:
  ┌───────────────────────────┐    ┌───────────────────────────┐
  │ Version 2  [Active]       │    │ Version 2  [Active]       │
  │            @ production   │    │            @ production   │
  │ 0e8f850aedee              │    │ 08/02/2026, 12:20:00 PM   │
  │ 08/02/2026, 12:20:00 PM   │    └───────────────────────────┘
  └───────────────────────────┘
```

The rail cell is now structurally identical to the prompts feature's
`PromptVersionsTableCombinedCell` — bold "Version N" plus alias chips on one line, a
secondary timestamp below, same `theme.spacing.sm` gap — which is the component this rail
has claimed to mirror since it was written.

**What this gives up, and where it went.** The digest is how you spot two versions holding
identical content, and the rail was the only place that comparison was possible at a
glance: `SkillDigestCell` there rendered a "same content as v1, v2" note. That note still
exists on the version pane, one click away. Losing the across-rows view is the real cost of
this change; it was three lines of hash in a narrow rail for a question that is rarely the
one being asked, and it pushed the timestamp — which usually is — out of the eye's path.

Removed along with it, all now unreferenced: `digestGroups`, `matchingVersionsFor`, and the
`SkillDigestCell` / `groupVersionsByDigest` imports. Both still have other callers
(`SkillVersionPane`, and `groupVersionsByDigest` has unit tests), so nothing was orphaned.

**Also corrected a stale comment** in `SkillVersionPane.tsx`: it justified putting the copy
button outside `SkillDigestCell` on the grounds that the cell "also renders in the version
rail and the list table". The list table never rendered it, and after this change the rail
does not either — `SkillDigestCell` now has exactly one caller. The reasoning was rewritten
to the one that still holds (it is a shared renderer, so anything baked in travels with it).

**Why:** Requested during demo prep — the hash was noise in the rail.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean on the
rail; `yarn test src/skills-registry` 53/53 passing; webpack recompiled with "No issues
found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillVersionRail.tsx`
> Self-contained: no earlier entry touched the rail. Leaves the corrected comment in
> `SkillVersionPane.tsx` in place, which is harmless but would then be describing a rail
> that shows the digest again.

### 18. Remove the duplicate new-window icon from source link-outs
- **Type:** Fix
- **Intent:** Source link-outs show a single new-window icon.
- **Why:** Reported during demo prep (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillSourceLinkOut.tsx`

**What:** The link-out rendered two ⧉ glyphs in a row.

```
  before:  https://github.com/…/coreos-cve-validator ⧉ ⧉
  after:   https://github.com/…/coreos-cve-validator ⧉
```

`Typography.Link` appends its own `NewWindowIcon` whenever `openInNewTab` is set (it takes
a `dangerouslyHideNewTabIcon` prop to suppress it), and this component was also adding one
by hand inside the link body. Removed the hand-written one and kept the design system's,
which is the one that stays correct if DuBois changes the affordance.

Affects every place a source link-out appears: the version pane's "browse at source" line
and both alerts in the Files section.

**Not a duplicate, left alone:** `SkillFileTree.tsx:215` also draws a `NewWindowIcon`, but
its rows are plain divs with a click handler rather than `Typography.Link`, so that is the
only icon there. `SkillVersionPane.tsx:401` already relied on `openInNewTab` alone.

**Why:** Reported during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 53/53 passing; webpack recompiled with "No issues found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceLinkOut.tsx`
> Self-contained: no earlier entry touched this file.

### 19. Move Organization into Advanced settings on the Create skill form
- **Type:** Update
- **Intent:** Organization moves into Advanced settings on the create form.
- **Why:** Organization is optional and most entries are unscoped (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`

**What:** Organization left the top row of the create form and joined the collapsed
Advanced settings section. Name now has the top row to itself, full width.

```
  before:                                after:
  ┌──────────┬─────────────────────┐     ┌───────────────────────────────┐
  │ Organiz. │ Name                │     │ Name                          │
  │ rh-team  │ my-skill            │     │ my-skill                      │
  └──────────┴─────────────────────┘     └───────────────────────────────┘
   Source …                               Source …
   ▸ Advanced settings (optional)         ▾ Advanced settings (optional)
       Ref / Subpath                          Ref / Subpath
       Description                            Organization      ← moved here
       Icon / Status / Tags                   Description
                                              Icon / Status / Tags
```

**Placement within the section:** after the ref/subpath fields, before Description. The
ref fields are a continuation of the Source block sitting directly above the toggle, and
Description is the other piece of optional identity, so Organization slots between them
rather than jumping to the head of the section.

Details:
- The reference-URI hint under Name still previews the organization
  (`skills:/@org/name`), so setting one in the advanced section shows up at the top of the
  form immediately. That hint is now the only place the choice is visible when the section
  is collapsed.
- Kept `onBlur={handleNameBlur}` on the field. "Already registered" is a check on org +
  name together, so moving the input must not stop it revalidating.
- Still create-mode only (`isCreatingSkill`); version mode never showed it, since the
  organization is fixed by the skill being versioned.
- **Trimmed the hint** from "Optional. Leave blank for an unscoped skill." to "Leave blank
  for an unscoped skill." — the section it now lives in is labelled "(optional)", so the
  first word was saying it twice.

**Judgment call:** the field is full width in the stack rather than keeping its old 180px
box. Everything else in the advanced section is full width, including the Status select,
and a lone narrow input mid-stack looks like a mistake. Easy to cap with a `maxWidth` if
you would rather it stayed compact.

**Why:** Requested during demo prep — organization is optional and most skills are
unscoped, but it was the first field the eye landed on in a form whose one required
identity field is the name.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 53/53 passing (no test renders this modal); webpack
recompiled with "No issues found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`
> Self-contained: no earlier entry touched this file.

### 20. Match the Form/CLI/Python control to the rest of the Create skill modal
- **Type:** Update
- **Intent:** The Form / CLI / Python switch renders at the default size.
- **Why:** Two segmented controls at different sizes read as different kinds of control (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`

**What:** Dropped `size="small"` from the Form / CLI / Python `SegmentedControlGroup`, so
it renders at the same size as the Link-to-a-source / Upload-a-folder control below it.

```
  before:  [Form][CLI][Python]        ← small
           [ Link to a source ][ Upload a folder ]

  after:   [ Form ][ CLI ][ Python ]  ← default, matching
           [ Link to a source ][ Upload a folder ]
```

One prop removed; no layout or state change. The two controls were the only segmented
controls in the dialog, and at different sizes they read as two different kinds of control
rather than as the same affordance used twice.

**Deliberately not changed:** the CLI/Python control inside the "Use" modal
(`SkillPullInstructions`) is still `size="small"`. It is the only control in that dialog,
so it has nothing to be inconsistent with, and matching the MCP registry's
`ConnectionInstructions` is what put it at that size. Worth revisiting only if you want the
two modals to look identical.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 53/53 passing; webpack recompiled with "No issues found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`
> Also undoes entry 19 (Organization moved into Advanced settings).

### 21. Make Link-to-a-source / Upload-a-folder radio buttons
- **Type:** Update
- **Intent:** A choice that changes which fields follow is a radio group, not a segmented control.
- **Why:** The mode is a decision about the entity, not a view switch (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`

**What:** The registration-mode `SegmentedControlGroup` became a `Radio.Group`.

```
  before:  Content
           [ Link to a source ][ Upload a folder ]
           Content stays where it is. Clients fetch it with their own credentials.

  after:   Content
           (•) Link to a source    ( ) Upload a folder
           Content stays where it is. Clients fetch it with their own credentials.
```

The two modes are a choice being made *about the skill being registered*, and the fields
below change depending on which is picked. A segmented control reads as a view switch over
the same content — which is exactly what the Form/CLI/Python control above it is — so
having both as segmented controls made two different kinds of decision look like one.

Details:
- `layout="horizontal"`, so the row occupies the same single line the segmented control
  did and nothing below it moves.
- Same `name`, same `componentId`, same `onChange` shape (`event.target.value`), so the
  analytics id and the form state are untouched.
- The hint below still switches with the selection, describing the chosen mode.
- `SegmentedControlButton` / `SegmentedControlGroup` imports dropped; this file had no
  other use for them.

**Judgment call:** kept the single switching hint below the group rather than moving each
mode's explanation under its own radio. Per-option descriptions are the more conventional
radio pattern and would let a reader compare both modes at once, but it is a bigger
rewrite of the block than the change asked for. Say the word if you want it.

**Interaction with entry 20:** that entry aligned this control's size with the
Form/CLI/Python one. It is no longer a segmented control, so the two are now different
kinds of control by design; entry 20's change to the Form/CLI/Python group (default size)
still stands on its own and was not reverted.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 53/53 passing; webpack recompiled with "No issues found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`
> Self-contained: no earlier entry touched this file.

### 22. No default registration mode, vertical radios, and progressive disclosure
- **Type:** Update
- **Intent:** That radio group is vertical, each option carries its own description, nothing is preselected, and submit stays disabled until a choice is made.
- **Why:** Defaulting a mode puts the user in a half-filled form for a choice they never made (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`,
`mlflow/server/js/src/skills-registry/mocks/skillsStore.ts`,
`mlflow/server/js/src/skills-registry/skills-registry.test.ts`

**What:** Three related changes to the Content block of the Create skill modal.

```
  before (opened, nothing typed):        after (opened, nothing chosen):
  Content                                Content
  (•) Link to a source  ( ) Upload…      ( ) Link to a source
  Content stays where it is. Clients…        Content stays where it is. Clients fetch
                                             it with their own credentials.
  Source type   Location                 ( ) Upload a folder
  [Git      ▾]  [___________________]        Your browser reads the folder and uploads
                                             it. MLflow stores the content.
  A source records where the content
  lives; MLflow never fetches it.        (source type / location appear on selection)
```

1. **No default selection.** `EMPTY_SOURCE_INPUT.mode` is now `undefined` and
   `SkillSourceInput.mode` is optional. The two modes ask for completely different things —
   a URL versus a local directory — so defaulting to either puts the user in front of a
   half-filled form for a decision they never made.
2. **Vertical layout** (`layout="vertical"`), which is what gives each option room for its
   own description.
3. **Progressive disclosure.** Source type, Location, the pasted-URL correction, the
   directory picker and the "A source records where the content lives" note all render
   only once a mode is set.

Details:
- **The per-mode explanations moved under their own radios.** There used to be one hint
  below the group that swapped with the selection; with nothing selected there is no mode
  to describe, and a reader choosing between two flows wants to compare them rather than
  click one to find out what it was.
- **`value={value.mode ?? ''}`, not `undefined`.** An undefined value makes antd's radio
  group uncontrolled, and its internal state could then drift from the form's. The empty
  string matches no radio, so nothing is checked and the group stays controlled.
- **The submit button is genuinely blocked, not just visually.** `isSourceInputComplete`
  returns `false` for an absent mode, which is what `okButtonProps.disabled` reads. Without
  that, a user who filled nothing could submit and the store would fall through to its
  pointer branch — registering a mode nobody picked.
- `sourceType` still starts on git. Pre-selecting the most common type *inside* a mode the
  user has already committed to is a different thing from pre-selecting the mode itself.
- Version mode is unaffected: it pre-fills the mode from the previous version, which is a
  deliberate carry-over rather than a default.
- `SkillSourceRefFields` already returned null for a non-pointer mode, so the advanced
  section's ref/subpath fields hide themselves with no change.

**Tests added** (`skills-registry.test.ts`, 53 → 55): two cases pinning that
`EMPTY_SOURCE_INPUT` has no mode, that a filled `sourceUri` or `uploadedFolderName` without
a mode is still incomplete, and that each mode is judged on its own field.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean on both
changed source files; `yarn test src/skills-registry` 55/55 passing; webpack recompiled
with "No issues found". `skillsStore.ts` has a pre-existing prettier violation (a stray
blank line near the end of the file, present at HEAD before this change) — left alone.

**Revert:**
```
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/mocks/skillsStore.ts
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/skills-registry.test.ts
```
> The first also undoes entry 21 (radios instead of a segmented control). Revert all three
> together or the optional `mode` type and its tests will disagree with the form.

### 23. Drop the "Skill folder" label and indent the folder picker under its radio
- **Type:** Update
- **Intent:** The chosen option's control hangs directly under its radio, indented, with no heading restating the radio.
- **Why:** A heading restating the radio made the picker look like a separate question (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`

**What:** The upload branch lost its heading and moved right to hang under the radio's
text.

```
  before:                                after:
  ( ) Link to a source                   ( ) Link to a source
      Content stays where it is…             Content stays where it is…
  (•) Upload a folder                    (•) Upload a folder
      Your browser reads the folder…         Your browser reads the folder…

  Skill folder                               [ Choose Files ] no file chosen
  [ Choose Files ] no file chosen            Select the directory containing SKILL.md.
  Select the directory containing
  SKILL.md.
```

The radio directly above already says "Upload a folder", so a second heading restating it
made the picker look like a separate question rather than the continuation of the one just
answered.

**The indent is `theme.spacing.lg`, and it is not hand-tuned.** That is the same offset
DuBois applies to a `FormUI.Hint` following a radio label (`getCommonRadioGroupStyles` in
the design system: `'& > label + .hint': { paddingLeft: theme.spacing.lg }`), so this uses
the design system's own answer for the same alignment problem rather than a number that
happened to look right.

**Kept the accessible name.** Removing a visible label is a visual decision and must not
cost the input its name, so the same "Skill folder" string is now an `aria-label` — same
message id and description, so nothing changes for translators.

The block is a plain flex column now rather than the local `Field` helper, since `Field`
exists to pair a label with a control and there is no longer a label.

**Not changed, worth a look:** the pointer branch's Source type / Location fields are still
flush left, not indented under "Link to a source". You only see one branch at a time so the
inconsistency is never on screen at once, and you asked specifically about the upload
button — but if you want them to match, that is the same one-line `paddingLeft`.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 55/55 passing; webpack recompiled with "No issues found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`
> Also undoes entries 21 and 22 — see the note on entry 22 about reverting all three of its
> files together.

### 24. Stack Source type over Location, quiet their labels, drop the closing hint
- **Type:** Update
- **Intent:** Source type and location stack vertically with hint-styled labels; the closing explanatory note is dropped.
- **Why:** Requested during demo prep (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`

**What:** Three changes to the pointer branch of the create-skill form.

```
  before:                                     after:
  (•) Link to a source                        (•) Link to a source
      Content stays where it is…                  Content stays where it is…
  ( ) Upload a folder                         ( ) Upload a folder
      Your browser reads the folder…              Your browser reads the folder…

  Source type      Location                   Source type
  [ Git      v ]   [ https://…            ]   [ Git                            v ]

  A source records where the content          Location
  lives; MLflow never fetches it.             [ https://…                        ]
```

1. **Removed** "A source records where the content lives; MLflow never fetches it."
2. **`Source type` and `Location` are now help-text style**, not bold headings.
3. **Stacked vertically** instead of sharing one horizontal row.

**The labels are still `<label>` elements.** Only the styling changed — swapping them for
plain text would have cost the select and the input their `htmlFor` association, which is
what lets a click on the word focus the control and what a screen reader reads out. The
local `Field` helper gained an optional `subtleLabel` prop that applies the four properties
DuBois' own `getHintStyles` sets (`textSecondary`, regular weight, `fontSizeSm`,
`lineHeightSm`), so a subtle label and a real hint render as the same text rather than
merely similar text.

**The override is scoped under `'&&'` on purpose.** DuBois' `getLabelStyles` wraps its own
declarations in `'&&'` to raise specificity; a plain override loses to it and silently does
nothing. Matching the wrapper is what makes this land.

**Stacking dropped two wrapper divs, not just their flex direction.** The pair used to sit
in a row with the type pinned to `flex: '0 0 160px'` and the location taking the remainder.
Both are now direct siblings in the returned fragment, so they inherit the same vertical
gap the form gives every other field, and the location input — the field carrying the
actual content of the registration — gets the full dialog width. The select is now
full-width too, matching the Status select in the advanced section.

**Judgment call:** the select at full width is wide for its four short options ("Git",
"OCI image", "ZIP archive", "MLflow artifact"). The alternative is capping it at 160px
while the location stays full width, but that reintroduces a hard-coded width for no
reason other than appearance. Say the word and it is a one-line `css={{ maxWidth: 160 }}`.

**Still not indented** under "Link to a source" — same note as entry 23; the two branches
are never on screen together.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 55/55 passing; webpack recompiled with "No issues found"
(the same 14 baseline warnings).

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`
> Also undoes entries 21, 22 and 23 — see the note on entry 22 about reverting all three of
> its files together.

### 25. Reveal the pointer fields between the two radio options
- **Type:** Update
- **Intent:** Each option's fields render directly beneath that option, between the radios.
- **Why:** Fields below both radios read as belonging to either mode (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`

**What:** Source type and Location now render inside the radio group, directly beneath
"Link to a source", instead of below both options.

```
  before:                                     after:
  (•) Link to a source                        (•) Link to a source
      Content stays where it is…                  Content stays where it is…
  ( ) Upload a folder                             Source type
      Your browser reads the folder…              [ Git                        v ]

  Source type                                     Location
  [ Git                            v ]            [ https://…                    ]

  Location                                    ( ) Upload a folder
  [ https://…                        ]            Your browser reads the folder…
```

Below both radios, a location field sat under "Upload a folder" and read as though it
might belong to either mode. Under the option that asks for it, there is nothing to work
out.

**The web-URL correction alert moved with them.** It is feedback on the location input, so
leaving it below the group would have left it pointing at a field two options away.

**Indented by `theme.spacing.lg`** — the DuBois radio-hint offset, same as the folder
picker in entry 23. This is now load-bearing rather than cosmetic: sitting flush left
inside a list of radios, the fields would read as a third option.

**The folder picker did NOT move inside the group, and that is not an inconsistency.**
"Upload a folder" is the last radio, so below the group already *is* directly below that
radio. Both modes reveal their fields in the same place relative to their own option; only
the pointer needed code to get there.

**Spacing:** `paddingBottom: theme.spacing.sm` on the inserted block matches what the
vertical radio group already puts below each label (`getVerticalRadioGroupStyles`), so the
gap above "Upload a folder" is the same as the gap between the radios when nothing is
expanded.

**Worth knowing before this ships beyond the demo:** the group renders `role="radiogroup"`,
and ARIA expects a radiogroup to own radios — not a select and a text input. It works, and
antd is fine with non-`Radio` children (`SecretFormFields.tsx:163` already wraps its radios
in a plain div), but a screen reader announcing "radio group, 2 items" while focus can tab
into a combobox inside it is a real wrinkle. The accessible fix is to render the fields
outside the group and reorder visually, which costs more than it is worth for a prototype.
Flagging it rather than deciding it.

**Also removed** the now-dead `{!value.mode ? null : isUpload ? … : …}` ternary — with the
pointer branch gone it collapses to `{isUpload && …}`, since an unchosen mode is not an
upload.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 55/55 passing; webpack recompiled with "No issues found"
(the same 14 baseline warnings).

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`
> Also undoes entries 21, 22, 23 and 24 — see the note on entry 22 about reverting all
> three of its files together.

### 26. Move Name into the Advanced settings accordion
- **Type:** Update
- **Intent:** Name moves into Advanced settings.
- **Why:** Requested during demo prep (S6).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`

**What:** The Name field left the top of the create form and now sits inside Advanced
settings, directly above Organization.

```
  before:                                     after:
  [ Form ] [ CLI ] [ Python ]                 [ Form ] [ CLI ] [ Python ]

  Name                                        Content
  [ my-skill                         ]        ( ) Link to a source
  Referenced as skills:/my-skill                  Content stays where it is…
                                              ( ) Upload a folder
  Content                                         Your browser reads the folder…
  ( ) Link to a source
      Content stays where it is…              > Advanced settings (optional)
  ( ) Upload a folder                             …
      Your browser reads the folder…              Name
                                                  [ my-skill                    ]
  > Advanced settings (optional)                  Referenced as skills:/my-skill
      Branch / Path                               Organization
      Organization                                [ rh-team                     ]
      Description …                               Description …
```

Placed above Organization rather than after it: the two are the skill's identity, and the
"Referenced as `skills:/@org/name`" hint below the name previews both, so editing either
one updates a line already on screen.

**This required a change to how the name is validated, and that is the part worth
reviewing.** Name is the one required field in the create form. Previously Create was
disabled until it had a value. With the field behind a collapsed chevron, that produces a
dead end — a greyed-out Create with nothing on screen explaining why. So:

- `isComplete` now gates Create on the **source** alone.
- `handleSubmit` still refuses an empty or duplicate name, and now calls
  `setShowAdvanced(true)` before setting the error, so the section opens and the field is
  marked.

The rule did not change; where the user meets it did — from an inert button to an
answerable question. **If you would rather keep the old behaviour, say so** and I will
revert to disabling Create; it is a two-line change, and it is a genuine trade (a disabled
button never lets a bad submit through, but it also never says why).

**Upload mode is unaffected in practice.** It infers the name from the selected folder, so
`effectiveName` is already non-empty and submit never reaches the error branch. The
"Name (optional)" label and the "Read from SKILL.md as…" hint moved along with the field
and still switch on mode.

**Also collapsed** the now-single-branch ternary at the top of the form: with the name gone
the create case renders nothing there, so `{isCreatingSkill ? … : <Typography.Text/>}`
became `{!isCreatingSkill && <Typography.Text/>}`. The version-mode line ("Adding a version
to …") is unchanged.

**Judgment call:** the create form now opens with the Form/CLI/Python control and the mode
radios and nothing else — nowhere on the collapsed view does the skill's name appear. That
is a fair reading of what you asked for, but it does mean a user can fill in a source and
click Create before the form has ever mentioned a name. The submit-time reveal is what
catches that.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 55/55 passing; webpack recompiled with "No issues found"
(the same 14 baseline warnings). No test covers the modal's submit gating, so the
`isComplete` change is verified by reading, not by a test.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`
> Also undoes entries 19 and 20 (Organization moved into Advanced; full-size
> Form/CLI/Python control).

### 27. Rename the "Content" heading to "Source"
- **Type:** Update
- **Intent:** The heading above the registration modes reads 'Source'.
- **Why:** Requested during demo prep (S6).
- **Replay:** agent-plugins
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`

**What:** One label. The heading above the two mode radios reads "Source" instead of
"Content".

```
  before:                        after:
  Content                        Source
  ( ) Link to a source           ( ) Link to a source
  ( ) Upload a folder            ( ) Upload a folder
```

**Worth a second look before the demo:** when "Link to a source" is picked, the revealed
fields are "Source type" and "Location", so the section now reads Source → Source type.
Not wrong — the type *is* a property of the source — but it is a repeated word two lines
apart, and "Content" avoided it by naming the other axis. If it grates on screen, the
smaller fix is renaming the inner field to "Type", since "Source" directly above it already
supplies the context.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 55/55 passing; webpack recompiled with "No issues found".
`yarn i18n:check` reports a key mismatch, but it does so on the unmodified branch too
(3500 extracted vs 3324 in `en.json` with these changes stashed) — pre-existing, not caused
by this rename.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`
> Also undoes entries 21–25 — see the note on entry 22 about reverting all three of its
> files together.

### 28. Move Name back to the top of the form — reverts entry 26
- **Type:** Revert
- **Intent:** Required fields never sit inside 'Advanced settings (optional)'; Name returns to the top of the form.
- **Why:** A required field cannot sit behind a label promising everything inside is optional (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** #26
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`

**What:** Entry 26 is undone. Name is back on the top row of the create form, above the
Source radios, and the validation entry 26 changed is back to what it was.

Name is required, and the disclosure it was moved into is labelled "Advanced settings
(optional)". A required field cannot live behind that label — the label is a promise that
everything inside can be skipped.

Three things reverted together:

- The Name block returned to the top row; the `{isCreatingSkill ? … : …}` ternary is back
  (entry 26 had collapsed it to `{!isCreatingSkill && …}`).
- `isComplete` gates Create on **name + source** again, so Create stays disabled until the
  name has a value.
- `handleSubmit` no longer calls `setShowAdvanced(true)` in its two name-error branches —
  the field is visible, so there is nothing to reveal.

**Organization stays in Advanced settings** (entry 19). That one really is optional, so it
is unaffected by this.

**Net effect:** on this file the create form is now exactly where entry 27 left everything
else and where entries 19 + 20 left this file. Entry 26 leaves no trace.

**Why:** Requested during demo prep — "it's not actually optional".

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 55/55 passing; webpack recompiled with "No issues found".
Confirmed by grep that `setShowAdvanced` now has only its three original call sites (the
open-with-ref case, `onRequestAdvanced`, and the toggle button).

**Revert:** nothing to revert — this entry *is* a revert. Reverting entry 26's file with
`git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`
would also undo entries 19 and 20.

### 29. Remove the "Referenced as skills:/my-skill" hint
- **Type:** Update
- **Intent:** No reference-URI preview hint under Name.
- **Why:** The hint repeated what the user could already see (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`

**What:** The URI preview under the Name input is gone.

```
  before:                              after:
  Name                                 Name
  [ my-skill                    ]      [ my-skill                    ]
  Referenced as skills:/my-skill
                                       Source
  Source                               ( ) Link to a source
  ( ) Link to a source                 ( ) Upload a folder
```

The hint slot below Name is now used only when it carries something the user cannot
already see: a validation error, or the fact that the name is being read from SKILL.md
rather than typed. Both of those still render exactly as before.

The trailing branch of the ternary became `null` rather than being restructured, so the
error and inferred-name cases keep their existing precedence.

**One knock-on:** with an organization set in Advanced settings, this hint was the only
place the form showed the two combined as `skills:/@org/name`. That preview is gone; the
qualified name still appears in the duplicate-name error ("A skill named
"@rh-sre/foo" is already registered.") and on the skill page after creation.

`getSkillQualifiedName` and `effectiveName` are both still used elsewhere in the file
(duplicate-name errors, the CLI/Python snippet, the version-mode line), so nothing was
left orphaned — checked by grep, not assumed.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 55/55 passing; webpack recompiled with "No issues found".

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`
> Also undoes entries 19 and 20. Entries 26 and 28 cancel out and are not affected.

### 30. Edit pencil beside Description on the skill details page
- **Type:** Update
- **Intent:** An edit pencil sits beside Description in the version grid.
- **Why:** Requested during demo prep (S6).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/hooks/useEditSkillDescriptionModal.tsx` **(new file)**
- `mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`

**What:** A small pencil button now sits beside the Description value in the metadata grid
and opens a one-field modal.

```
  before:                                    after:
  Registered at:  2026-09-02 14:10           Registered at:  2026-09-02 14:10
  Description:    Drafts remediation…        Description:    Drafts remediation…  [pencil]
  Status:         [ Active ] [pencil]        Status:         [ Active ] [pencil]
```

Same affordance the Status, Aliases and version-Tags rows already use: a `size="small"`
`Button` with a `PencilIcon` and an `aria-label`, in a flex row with `gap: theme.spacing.xs`.

**A new one-field modal rather than reusing the existing "Edit skill" modal.** The kebab
menu already opens `useEditSkillModal`, which edits description, icons and tags together.
Wiring the pencil to that would answer a click on *Description* with a form asking three
questions. `useEditSkillDescriptionModal` mirrors its structure — seed-on-open, Save /
Cancel, `Input.TextArea` — and writes through the same `updateSkill` call, so there is one
write path, not two.

**The modal says "Applies to every version of this skill."** RFC-0008 carries `description`
on the parent, so this edit lands on all versions. The pane it opens from is titled
"Viewing version N", which is exactly the context in which someone would assume otherwise.

**The pencil shows even when the description is "None."** That is the state most in need of
it; hiding the only way to add a description behind already having one is a trap.

**It is NOT hidden on withdrawn versions,** unlike the Status and version-Tags pencils
beside it. Those edit one withdrawn registration, which is terminal. The description
belongs to the skill, which is still live — so it stays editable from whichever version
happens to be selected. Flagging it because the inconsistency is visible: on a deleted
version you will see one pencil and not the other two.

**Clearing works.** `updateSkill` only falls back to the stored value when the field is
absent, and the modal always sends a string, so emptying the box and saving removes the
description rather than silently keeping it.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean on both files; `prettier --check`
clean on the new hook; `yarn test src/skills-registry` 55/55 passing; webpack recompiled
with "No issues found". `SkillVersionPane.tsx` still reports its one pre-existing prettier
violation (the wrapped delete-tooltip `defaultMessage`, present before any of these
changes) — confirmed by diffing prettier's output that it is the *only* remaining
difference, so nothing added here is unformatted. No test covers the modal; verified by
reading and by the running dev server.

**Revert:**
```
rm mlflow/server/js/src/skills-registry/hooks/useEditSkillDescriptionModal.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx
```
> The `git checkout` also undoes entries 16 and 17 (the Files row in the metadata grid; the
> digest removal). Delete the new hook file in the same step or the build breaks on a
> dangling import.

### 31. Space the description modal's hint off the textarea
- **Type:** Fix
- **Intent:** Space the description editor's hint off the textarea.
- **Why:** Requested during demo prep (S6).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/hooks/useEditSkillDescriptionModal.tsx`

**What:** The hint under the textarea in the Edit description modal no longer sits flush
against the input's border.

```
  before:                                after:
  ┌──────────────────────────────┐       ┌──────────────────────────────┐
  │                              │       │                              │
  └──────────────────────────────┘       └──────────────────────────────┘
  Applies to every version…
                                         Applies to every version…
```

`FormUI.Hint` sets no margin of its own — the create form's fields get their spacing from
a flex wrapper, and this modal put the textarea and the hint straight into the modal body
with nothing between them. Added the same wrapper: `flexDirection: 'column'` with
`gap: theme.spacing.xs`, which is the field-to-hint gap used everywhere else in this
feature rather than a value picked to look right in this one dialog.

**Why:** Requested during demo prep (screenshot).

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 55/55 passing; webpack recompiled with "No issues found".

**Revert:** part of entry 30's new file — see that entry's revert block.

### 32. Fix the source link printing twice on the version pane
- **Type:** Fix
- **Intent:** Print the provider browse URL only when it differs from the source URL.
- **Why:** A ref-less git source printed its URL twice (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillSourceLinkOut.tsx`
- `mlflow/server/js/src/skills-registry/skills-registry.test.ts`

**The cause, since you asked.** `getGitBrowseUrl` (`constants.ts:87-89`) exists to turn a
clone URL plus ref and path into a provider browse link. When a version has **no ref**
there is nothing to append, so it returns the repository URL unchanged — i.e. the source.
The Source row rendered both unconditionally:

- line 1: `Typography.Link href={source}`
- line 3: `SkillSourceLinkOut href={gitBrowseUrl}`

so for a ref-less git version they were the same string, printed twice. Your
`create-jira-stories` skill is in exactly that state: it was registered by pasting a
GitLab **tree** URL into Location without applying the "Use {cloneUrl}" correction, so it
has no ref — which is also why no "Ref:" row appears above it in the screenshot. The
seeded demo skills all carry refs, so this never showed until a skill was created by hand.

```
  before:                                      after:
  Source:  [Git] https://…/create-jira-stories  Source:  [Git] https://…/create-jira-stories
           https://…/create-jira-stories                 Opens a third-party site. Check you
           Opens a third-party site. Check you            trust the source before using what
           trust the source before using what             it contains.
           it contains.
```

**The fix compares before rendering.** A new `distinctBrowseUrl` is the browse URL only
when it differs from the source; the second link renders only when it has somewhere else
to go. The disclaimer still renders either way — the destination is somebody else's site
regardless — so `SkillSourceDisclaimer` was extracted from `SkillSourceLinkOut` and both
now use it. One definition of the sentence, not two for translators to keep in step.

**Not fixed, and deliberately:** the underlying oddity is that the skill has no ref at all,
so "browse this version" and "browse the repo" are genuinely the same place. That is a
data-entry outcome (the paste correction was offered and declined), not a display bug, and
forcing a ref would change what was registered.

**Test added** (`skills-registry.test.ts`, 55 → 56): pins that `getGitBrowseUrl` returns
the repository URL unchanged with no ref, including when a subpath is present, so the
equality the pane now relies on cannot drift.

**Why:** Reported during demo prep (screenshot).

**Verification:** `yarn type-check` clean; ESLint clean on both components;
`prettier --check` clean on `SkillSourceLinkOut.tsx` and the test file;
`yarn test src/skills-registry` 56/56 passing; webpack recompiled with "No issues found".
`SkillVersionPane.tsx` still carries only its one pre-existing prettier violation —
verified by diffing prettier's output. Also checked the two other `SkillSourceLinkOut`
call sites in `SkillFilesTab.tsx`: both are the only link in their alert, so neither has
the duplication.

**Revert:**
```
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceLinkOut.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/skills-registry.test.ts
```
> These also undo entries 16, 17, 18, 22 and 30. Reverting `SkillVersionPane.tsx` alone
> requires also deleting entry 30's new hook file.

### 33. Actually read the uploaded folder: real file listing and real content digest
- **Type:** Update
- **Intent:** Uploading a folder reads its files: a real file listing and a content digest computed over the bytes.
- **Why:** Upload recorded only the folder name, with no listing and no real digest (S6).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/mocks/uploadedSkillContent.ts` *(new)*
- `mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx`
- `mlflow/server/js/src/skills-registry/mocks/skillsStore.ts`
- `mlflow/server/js/src/skills-registry/mocks/skillContent.ts`
- `mlflow/server/js/src/skills-registry/skills-registry.test.ts`

**The cause, since you asked.** Uploading `arena-research-skill-main` produced a version
with no Files listing. Two independent gaps, neither about the folder:

1. **The picker never read the files.** `SkillSourceFields.tsx` took one thing from the
   `FileList` and dropped the rest:
   ```tsx
   const first = event.target.files?.[0];
   const folderName = first?.webkitRelativePath?.split('/')[0];
   update({ uploadedFolderName: folderName || undefined });
   ```
   "Upload" meant "note the folder's name". No paths, no bytes. It also meant the digest
   (`fe8f3b9a4d7a…`) was `synthesizeUploadDigest` over org/name/version — real-looking, but
   not a hash of anything.
2. **`resolveSkillFiles` could only find listings for seeded skills.** It looked the skill
   up in `seedByQualifiedName` and returned `unlisted` otherwise, so a skill created at
   runtime could not have a listing even if the files had been captured. Source type
   `mlflow` hit the `default` branch, hence the vague "No file listing was recorded".

```
  before:                                    after:
  Files:                                     Files:
   ⓘ No file listing for this version         ▾ SKILL.md            2.1 KB
     No file listing was recorded for         ▾ reference/
     this version.                              api-notes.md       4.4 KB
                                              ▾ scripts/
  Content digest:  fe8f3b9a4d7a                 collect.py         1.8 KB
  (hash of "org/name@upload@1")
                                             Content digest:  3f9c1d… (SHA-256 of the tree)
```

**What the browser now does at pick time** (`uploadedSkillContent.ts`): reads every file
under the chosen directory, strips the leading folder segment so paths are skill-relative,
drops tooling residue (`.git/`, `node_modules/`, `__pycache__/`, `.DS_Store`, `._*`),
sniffs text vs. binary by decoding the bytes rather than by extension allowlist, and
computes SHA-256 per file then over the sorted `path hash` manifest. The listing and the
digest travel through `SkillSourceInput` into `createSkill` / `addSkillVersion`, which
record the listing per `(org, name, version)`; `resolveSkillFiles` checks that before the
seed map. Files open in the existing modal — no changes needed in `SkillFilesTab.tsx` or
`SkillFileTree.tsx`, which were already generic over the resolution.

**Digest is now a real content hash**, so uploading the same folder twice produces the same
digest and the two versions group as identical content — which is what the field is for.
The serialization is this prototype's own, not anything RFC-0008 specifies.

**Two new warnings, neither blocking.** After the read the form knows things it could not
know before: whether `SKILL.md` sits at the root, and whether the read succeeded at all.
Both surface as `FormUI.Message type="warning"` rather than gating submit — the folder name
alone was the entire input until now, so a folder with no manifest still registers, with the
problem stated. **Judgment call:** a missing `SKILL.md` is arguably invalid and could block
submission; left as a warning so a demo cannot get stuck behind a heuristic.

**Other judgment calls:**
- The listing is **not** a field on `SkillVersionEntity`. RFC-0008's version entity has no
  file manifest, and the repo's standing rule (and its own test, "fields the backend does
  not have are absent") is to keep invented fields off the entity. It lives in a separate
  module, the way `skillFileTrees.ts` sits beside the seeds.
- `synthesizeUploadDigest` is **kept** as a fallback. `crypto.subtle` needs a secure
  context; localhost qualifies, but plain HTTP from another host does not. There, a
  stand-in beats an empty digest, because empty means "nobody read the content".
- **No file-count cap.** Picking a huge folder by mistake reads all of it, but browsers
  already show their own "Upload N files?" confirmation, and a silent cap would under-report
  a listing while looking complete.
- Async read guarded two ways: a `valueRef` so the result merges into current form state
  rather than the state captured at pick time, and a token so picking a second folder
  discards the first read instead of racing it.

**Also changed:** the `mlflow` case in `describeMissingListing` now says the listing was not
captured at registration, instead of falling through to the generic wording — MLflow holds
the content by definition, so "read it at its source" would point at the registry itself.

**Tests added** (`skills-registry.test.ts`, 56 → 61): a folder uploaded through the store
lists and renders with `SKILL.md` first; the real digest wins over the stand-in and the
stand-in still fills the field when no hash is available; an upload that read nothing gets
the MLflow wording, not the git wording; path-stripping and the residue filter are pinned
directly. The `FileList` half is not unit-tested — it needs a DOM with `webkitRelativePath`
and `File.arrayBuffer`; the store half is where the defect was.

**Why:** Reported during demo prep (screenshot) and requested as the full version — read
the bytes, not just the folder name — over the cheaper paths-and-sizes-only option.

**Verification:** `yarn type-check` clean; ESLint clean on all five files;
`prettier --check` clean on all five; `yarn test src/skills-registry` 61/61 passing;
webpack recompiled with 14 baseline warnings and "No issues found". `prettier --write` on
`skillsStore.ts` also removed one pre-existing trailing blank line at EOF that predates
this branch.

**Revert:**
```
rm mlflow/server/js/src/skills-registry/mocks/uploadedSkillContent.ts
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/mocks/skillsStore.ts
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/mocks/skillContent.ts
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillSourceFields.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/skills-registry.test.ts
```
> `SkillSourceFields.tsx` also undoes entries 21-27; `skills-registry.test.ts` also undoes
> entry 32. All four files must be reverted together with deleting the new module, or the
> imports break.

### 34. Swap the card footer back: timestamp in, status tag out
- **Type:** Update
- **Intent:** Card footer: timestamp and the action; no status tag.
- **Why:** Recency is the useful browse signal; status belongs beside its version (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** #7
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillCard.tsx`

**What:** The card footer now carries the last-updated timestamp and the **Use** button.
The status tag is gone from card view.

```
  before:   [Active]                                   [▶ Use]
  after:    2026-08-14 09:22:31                        [▶ Use]
```

This reverses entry 7, which had removed the timestamp for the opposite reason. The
timestamp markup is restored exactly as it was at baseline — `Utils.formatTimestamp`, the
same `Typography.Text color="secondary" size="sm"` with `textEllipsisStyles`, inside the
same left-hand flex group.

Cleanups the swap required:
- Re-added the `Utils` import and the `timestamp` const.
- Dropped `SkillStatusTag` from the `./SkillCellRenderers` import. `SkillTagsCell` comes
  from the same module and is still used, so the import line stays, just narrower.
- `latestVersion` stays a prop — `SkillPullModal` still needs it for the pull snippet — but
  its JSDoc no longer claims it feeds a status tag.
- Restored the doc comment's "a footer pairing the timestamp with a single action button".
- Replaced entry 7's explanatory comment (which documented why no timestamp was there) with
  one covering the new absence: the status tag belongs beside the version it describes, on
  the detail page.

**Where status still shows:** the list table's **Status** column and the version pane, both
untouched. Card view was the only surface losing it.

**Why:** Demo prep — recency is the useful sort signal when browsing a catalogue; the
status of a skill's *latest* version is detail-page information.

**Verification:** `yarn type-check` clean; ESLint clean on the file; `prettier --check`
clean; `yarn test src/skills-registry` 61/61 passing; dev server serving 200 on :3000.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillCard.tsx`
> This restores the baseline footer (timestamp **and** status tag) and also undoes entry 1's
> `SkillCard` half (the `@organization` line) and entry 7.

### 35. Put the description back in the skill page header, between title and tags
- **Type:** Update
- **Intent:** The description sits in the header between title and tags, as muted body copy at the default text size, capped at a 720px measure.
- **Why:** A visitor should read what the entity does without scanning the grid; type matches the MCP server page (S4, S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** #4
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`

**What:** The skill detail page header now reads title → description → tags, with the
description as muted body copy.

```
  before:                          after:
  Skills >                         Skills >
  [icon] cluster-report            [icon] cluster-report
  [key: value] [key: value] [✎]    Generate a health report across OpenShift clusters…
                                   [key: value] [key: value] [✎]
```

**The style, matched to the DevTools reading you sent** (MCP server details page):
`font-size: 13px`, `line-height: 20px`, `color: rgb(146, 164, 179)`. That is DuBois'
*base* typography step plus `textSecondary`, i.e. `<Typography.Text color="secondary">`
with **no** `size` prop. Worth stating because the obvious guess is wrong: `size="sm"` is
the 12/16 step, which would have come out a pixel small. Spacing is `theme.spacing.sm`
below, matching the gap the header row already leaves above it.

**Capped at 720px.** Full width let the sentence run to roughly 190 characters a line on a
wide monitor. 720 is the measure `SkillFilesTab` and `SkillObservabilityTab` already use for
prose in this feature, so it was the consistent number rather than a new one; it lands the
description at ~105 characters a line. Tighter is available if you want it closer to the
classic 90-character ceiling.

**Not clamped, deliberately.** The MCP page's span carries `-webkit-line-clamp: 1`. That
suits a card or a list row; on a detail page truncating the one sentence that explains the
skill, with nowhere to expand it, trades away the reason the field is there. Say the word
and it is a one-line change to `textClampStyles(1)`.

**This partially reverses entry 4**, which moved the description out of the header and into
the version pane's metadata grid.

**Flagging a duplication this creates.** The pane's **Description:** row (entry 4) and its
edit pencil (entry 30) are untouched, so the description now appears twice on the same
screen — once in the header, once in the grid to the right. Same shape as the double source
link fixed in entry 32. Two ways out:

- Drop the pane's Description row and move its pencil next to the header copy. Cleaner, and
  it puts the edit affordance where the text is; costs entry 30's placement.
- Keep both, on the grounds that the grid is a complete field list. Then the header copy is
  a summary and the repetition is the price.

Resolved in entry 36: the pane row is gone and the pencil moved to the header.

**Why:** Demo prep — a visitor should read what the skill does without scanning the metadata
grid for it.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 61/61 passing.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
> This restores the *baseline* header, which used `Typography.Paragraph` rather than this
> styling, and also undoes entries 1, 2, 3, 4 (the `SkillPage` half) and 8.

### 36. Drop the Description row from the version pane; move its pencil to the header
- **Type:** Decision
- **Intent:** The description appears once, in the header; the version grid carries no entity-level fields.
- **Why:** The description is entity-level (S7); a frozen row among per-version rows reads as a bug (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
- `mlflow/server/js/src/skills-registry/hooks/useEditSkillDescriptionModal.tsx`

**What:** Resolves the duplication flagged in entry 35. "Viewing version N" no longer
carries a Description row, so the description appears once on the page — in the header.

```
  before (both showed the same text):        after:
  ┌ header ──────────────────────┐           ┌ header ──────────────────────┐
  │ sbom-attestor                │           │ sbom-attestor                │
  │ Attach and verify SBOM…      │           │ Attach and verify SBOM…  [✎] │
  │ [category: security] [✎]     │           │ [category: security] [✎]     │
  └──────────────────────────────┘           └──────────────────────────────┘
    Viewing version 2                          Viewing version 2
    Registered at:  2026-08-02 12:20           Registered at:  2026-08-02 12:20
    Description:    Attach and verify… [✎]     Status:         Active  [✎]
    Status:         Active  [✎]                Created by:     acme-platform
```

**The pencil moved with the copy rather than being deleted.** Entry 30 added it and it is
the only field-level way to edit a description — the alternative is the kebab's "Edit
skill" modal, which asks three questions. `useEditSkillDescriptionModal` is unchanged in
behaviour; it is now mounted by `SkillPage` instead of `SkillVersionPane`, with the same
`size="small"` `PencilIcon` button and `aria-label`. `componentId` changed from
`…version-pane.edit-description` to `…skill-page.edit-description`, since it is no longer
in the pane.

**"None" became "No description".** In a label/value grid a bare "None" is unambiguous
because the label sits beside it. Standing alone under the title it needs to say what is
absent.

**Why the pane was the right one to lose it.** Every other row in that grid changes when
you click a different version in the rail; description could not, because RFC-0008 carries
it on the parent skill. A field frozen against its neighbours reads as a bug during a demo.
The header is version-independent, so that is where it belongs.

**Two doc comments updated** in the hook, both of which justified the "Applies to every
version of this skill" hint by pointing at the pane's "Viewing version N" title. The hint
still earns its place — a version is always selected on that page — but the reasoning had
to stop naming a heading it no longer sits under.

**Why:** Requested during demo prep, closing entry 35's open question.

**Verification:** `yarn type-check` clean; ESLint clean on all three files; `prettier
--check` clean on `SkillPage.tsx` and the hook; `SkillVersionPane.tsx` still carries only
its one pre-existing prettier violation (the wrapped delete-tooltip `defaultMessage`) —
confirmed by diffing prettier's output. `yarn test src/skills-registry` 61/61 passing; dev
server serving 200 on :3000.

**Revert:**
```
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/skills-registry/components/SkillVersionPane.tsx \
  mlflow/server/js/src/skills-registry/components/SkillPage.tsx
rm mlflow/server/js/src/skills-registry/hooks/useEditSkillDescriptionModal.tsx
```
> Reverting these two files also undoes entries 1, 2, 3, 4, 8, 16, 17, 30, 32 and 35. The
> hook file must go in the same step or both components break on a dangling import —
> baseline has neither the hook nor any reference to it.

### 37. Clamp the header description to two lines behind a Read more toggle
- **Type:** Update
- **Intent:** The header description clamps to two lines with a Read more / Show less toggle that appears only when the text overflows.
- **Why:** Long descriptions pushed the page below the fold (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillDescriptionBox.tsx` *(new)*
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`

**What:** The header description now shows two lines with a **Read more** link; expanding
swaps it for **Show less**. `cluster-creator`'s eight-line description was pushing the tags,
the Preview/Traces switch and the whole version pane below the fold.

```
  before:                                     after:
  cluster-creator                             cluster-creator
  End-to-end OpenShift cluster creation  [✎]  End-to-end OpenShift cluster creation  [✎]
  using Red Hat Assisted Installer. Handles   using Red Hat Assisted Installer. Handles…
  Single-Node OpenShift (SNO) and HA multi-   Read more
  … six more lines …                          [category: automation] [lifecycle: beta] [✎]
  [category: automation] [lifecycle: beta]
```

**The toggle's presence is measured, not guessed.** A character-count threshold is the
tempting shortcut and it is wrong in both directions: the clamp is `-webkit-line-clamp`, so
whether text overflows depends on the rendered width and where it happens to wrap. The
component observes its own text element with a `ResizeObserver` and compares `scrollHeight`
against `clientHeight`, so narrowing the window can bring the toggle into existence and
widening it can take it away — the same pattern `common/components/CollapsibleContainer.tsx`
uses.

**Measurement is skipped while expanded.** Expanding removes the clamp, at which point the
element measures as fitting; re-reading it there would delete the toggle at the instant it
was used. The last collapsed reading stands until it collapses again.

**A new component rather than reusing `CollapsibleContainer`.** That one does the same job
in outline, but it is built for a 150px block: it fades the cut with a gradient, which over
two lines is more chrome than content, and it carries a hard-coded Databricks discovery
`componentId` that would misattribute every click from this page. The measurement logic is
copied from it rather than reinvented.

**Also moved into the new component:** the 720px measure and the typography note from entry
35, so the reasoning sits with the markup it explains rather than in `SkillPage`.

**Keyed on the skill.** `SkillPage` stays mounted when you navigate from one skill to
another, so without a `key` an expansion would carry over to a description the reader never
expanded.

**Judgment call — two lines, and where the toggle sits.** Two matches what you asked for.
The toggle is a `type="link"` button on its own line below the text rather than inline
after the ellipsis; antd 4.16's `Typography.Paragraph ellipsis={{ expandable: true }}` would
give the inline version in three lines of code, but it only expands — there is no collapsing
back, which defeats the point of keeping the header short.

**Why:** Reported during demo prep (screenshot) — a long description buried the page.

**Verification:** `yarn type-check` clean; ESLint clean on both files; `prettier --check`
clean; `yarn test src/skills-registry` 61/61 passing. `yarn i18n:check` reports a mismatch,
but it does so with these changes stashed as well — `en.json` has never been regenerated for
the skills-registry prototype on this branch, so it is pre-existing, not a regression here.

**Revert:**
```
rm mlflow/server/js/src/skills-registry/components/SkillDescriptionBox.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillPage.tsx
```
> Reverting `SkillPage.tsx` also undoes entries 1, 2, 3, 4, 8, 35 and 36. Delete the new
> component in the same step or the build breaks on a dangling import. To keep the header
> description but drop only the clamp, revert this entry alone by inlining the box's markup
> back into `SkillPage` as entry 36 left it.

### 38. Use modal: full-size format tabs, resolution line back above them
- **Type:** Update
- **Intent:** In the Use modal the resolution sentence sits above the format tabs, which render at the default size.
- **Why:** The resolution line qualifies both formats, so it reads better before the choice (S6).
- **Replay:** agent-plugins
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillPullInstructions.tsx`

**What:** The CLI / Python segmented control is now the default size, and "Resolves through
alias: production (currently v2) [Active]" sits above it rather than under the snippet.

```
  before:                                  after:
  [CLI][Python]        <- size="small"     Resolves through alias: production
  ┌───────────────────────┐                (currently v2) [Active]
  │ mlflow skills pull …  │                [ CLI ] [ Python ]
  └───────────────────────┘                ┌───────────────────────┐
  Resolves through alias: production       │ mlflow skills pull …  │
  (currently v2) [Active]                  └───────────────────────┘
  Fetches the content from its source      Fetches the content from its source
  into a local directory.                  into a local directory.
```

**This reverses the placement half of entry 12**, which demoted the line to a footnote. The
argument for the new position is that the line qualifies *both* formats equally, so it reads
better before the choice than after the result of one.

**It did not go all the way back.** Entry 12 also restyled the line from **bold label** +
value to a single muted `size="sm"` sentence, and merged two i18n messages into one. Both of
those stayed: you asked for a move, not a promotion, and the modal has one thing worth
emphasising — the snippet you came to copy. Reinstating the bold label would also mean
splitting the merged messages back apart and retiring two more i18n keys.

**The footnote block collapsed to a single line.** With the resolution note gone from it,
the wrapping `div` and its `gap` had nothing left to space, so "Fetches the content…" is now
a direct child of the column.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 61/61 passing — including `SkillPullModal.test.tsx`, whose
two resolution-line assertions are text matches and so survive the move.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillPullInstructions.tsx`
> Also undoes entries 11, 12 and 13 in this file. To keep those and reverse only this entry,
> re-add `size="small"` to the `SegmentedControlGroup` and move the `resolutionNote` block
> back above the "Fetches the content…" line inside a shared `div`.

### 39. Breathing room between the tag row and the Preview/Traces switch
- **Type:** Fix
- **Intent:** Leave a medium gap between the header's tag row and the Preview / Traces switch.
- **Why:** The switch crowded the chips (S6).
- **Replay:** agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:** `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`

**What:** The header block's `paddingBottom` went from `0` to `theme.spacing.sm`. With the
tag row's own `sm` bottom margin that makes `md` (16px) between the last chip and the
segmented control, where it was `sm` (8px).

```
  before:                          after:
  [category: security] [✎]         [category: security] [✎]
  [ Preview ][ Traces ]
                                   [ Preview ][ Traces ]
```

**Placed on the seam, not on the tag row.** `SkillTagsBox` renders one thing and should not
carry spacing that exists because of what happens to sit under it. The header container's
bottom padding is the actual boundary between the header and the rail-and-pane row, so that
is where the gap belongs — and it stays correct if the tag row is ever the last element or
ever moves.

**Why:** Reported during demo prep (screenshot) — the switch was crowding the chips and read
as part of the tag row.

**Verification:** `yarn type-check` clean; ESLint clean; `prettier --check` clean;
`yarn test src/skills-registry` 61/61 passing.

**Revert:** `git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
> Also undoes entries 1, 2, 3, 4, 8, 35, 36 and 37. To reverse only this entry, set the
> header container's `paddingBottom` back to `0`.

### 40. Edit skill modal: tags out, name in
- **Type:** Update
- **Intent:** The kebab Edit modal leaves out tags, which have their own editor.
- **Why:** Two drafts of one tag list with no rule for which wins (S6). The rename half was dropped in 2026-09-11-pdouble-merge-rulings#1.
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/hooks/useEditSkillModal.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`
- `mlflow/server/js/src/skills-registry/mocks/skillsStore.ts`
- `mlflow/server/js/src/skills-registry/mocks/skillContent.ts`
- `mlflow/server/js/src/skills-registry/mocks/uploadedSkillContent.ts`

**What:** The kebab → **Edit** modal drops its Tags editor and gains a **Name** field above
Description.

```
  before:                              after:
  ┌─ Edit skill ─────────────┐         ┌─ Edit skill ─────────────┐
  │ Description              │         │ Name                     │
  │ [                      ] │         │ [ cluster-creator      ] │
  │ Tags                     │         │ Renaming changes this    │
  │ [key][value]        [+]  │         │ skill's URI. References  │
  │ Icon                     │         │ already copied elsewhere │
  │ [ 🧩 ]  [ Upload ]       │         │ will not resolve.        │
  └──────────────────────────┘         │ Description              │
                                       │ [                      ] │
                                       │ Icon                     │
                                       │ [ 🧩 ]  [ Upload ]       │
                                       └──────────────────────────┘
```

**Tags left because they already had a better editor.** Entry 30 put a pencil on the tag row
under the page title, which edits the chips you are looking at. Keeping a second copy in this
modal meant two drafts of one list open at once with no rule for which wins. The per-tag
diff-and-write logic went with it — `SkillTagsEditor` and `setSkillTag`/`deleteSkillTag` are
untouched and still used by the tag-row editor and the create form.

**⚠️ Name is not an RFC-0008 operation.** The RFC keys a skill on `(organization, name)` and
gives `update_skill` no name field, so a real rename is either a new endpoint or a
register-and-delete. The prototype offers the field anyway so the question can be asked of a
working screen, but the demo should say out loud that **a rename cannot be made safe from
inside the registry**: a `skills://` URI in a CI job, a pull command in someone's notes, or an
already-pulled copy on disk all still name the old skill, and there is no redirect behind
them. The modal says as much in a hint under the field. Organization stays fixed — moving a
skill between orgs is a different operation with different permissions.

**A rename has to move three side maps, not just the record.** This is the part worth showing
the RFC. Beyond rewriting `name` on the skill and on every version, `renameSkill` re-keys:
the version high-water mark (`versionCounters` — miss it and a renamed skill re-issues a
version number a deleted version already used), any folder read through the upload picker
(`renameUploadedSkillFiles`, every version, not just the latest), and the seed a stored skill
resolves its file listing through (`renameSkillSeedKey`). Aliases ride along on the skill
record, so they need no separate move. The seed re-key moves only the *lookup* key —
`REGISTERED_SKILL_FILES` is still indexed by the seed's own org/name, so the record of where
a listing was fetched from does not get rewritten by a rename.

**Duplicate names are caught on blur.** Reusing `skillNameExists`, the same check the create
form uses. Blank is deliberately *not* an error — a half-cleared field mid-edit should not
turn red at you; it is simply a no-op on save. Save re-checks and stays open on failure
rather than closing on a silently discarded edit.

**The page follows the rename.** `SkillPage` addresses itself by name in the URL, so without
`onRenamed` the save would land and the page it was saved from would flip to "Skill not
found". It navigates with `replace: true`: the old name no longer resolves, so leaving it in
history would put a dead page one Back away.

**Judgment call — rename is destructive and the UI treats it as ordinary.** It sits in a
plain edit form next to Description with only a hint to mark it. If this survives review it
probably wants a confirmation step, or to be a distinct "Rename" action rather than a field
you can change by accident while fixing a typo in the description.

**Why:** Requested during demo prep.

**Verification:** `yarn type-check` clean; ESLint clean on all five files; `prettier --check`
clean; `yarn test src/skills-registry` 61/61 passing. No test covers the rename path — the
suite has no `useEditSkillModal` spec, and one was not added here.

**Revert:**
```
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/hooks/useEditSkillModal.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillPage.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/mocks/skillsStore.ts
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/mocks/skillContent.ts
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/mocks/uploadedSkillContent.ts
```
> Heavy overlap — these five files carry most of the prototype's other work.
> `useEditSkillModal.tsx` is entry 27's file; `SkillPage.tsx` also undoes entries 1, 2, 3, 4,
> 8, 35, 36, 37 and 39; `skillsStore.ts`, `skillContent.ts` and `uploadedSkillContent.ts`
> carry entries 14–26 between them. **To reverse only this entry**, do it by hand: delete
> `renameSkill`, `renameSkillSeedKey` and `renameUploadedSkillFiles` and their imports, drop
> the Name field, `nameError`, `handleNameBlur` and the rename branch of `handleSubmit`, drop
> the `onRenamed` prop from both the hook and the `SkillPage` call site, and restore the Tags
> block plus its `tags` state and diff-write from git.

### 41. Card view: dim everything on a card whose latest version is not active
- **Type:** Update
- **Intent:** A card whose latest live version is not active recedes: icon at half opacity, text and action in secondary grey, action still clickable.
- **Why:** Match the MCP server cards (S4).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillCard.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillCellRenderers.tsx`

**What:** A card whose latest live version is `active` reads exactly as before. Anything else
— draft, deprecated, or no live version at all — drops its **icon, name, tags and Use button**
so the whole card recedes together. Matches the MCP server cards.

```
  active:                              not active:
  🧩 cluster-inventory      v3         🧩 cluster-creator        v2      <- icon faded,
  Lists every OpenShift cluster…       End-to-end OpenShift cluster…        name grey
  [category: automation]               [category: automation]           <- chip text grey
  09/09/2026, 11:24 AM   [▶ Use]       09/09/2026, 12:36 PM   [▶ Use]   <- Use grey, not blue
                          ^ blue
```

**Status comes from the latest LIVE version, not the skill.** RFC-0008 puts `status` on the
version; a skill has no status of its own. The card already receives that version because
the Use button pulls it, so the card is dimmed by the same thing it hands you. A skill with
no live version at all dims as well — there is nothing active behind it either.

**The Use button loses its blue, which is the point of the change.** It was the brightest
element on an otherwise grey card, reading as a recommendation to pull exactly the version
you should not. It stays clickable: a deprecated skill can still be pulled, and hiding the
command would just send people to the CLI docs to reconstruct it.

**Greying that button took a wrapper `<span>` and an `!important`, and neither part is
optional.** The obvious approach — a `css` prop on the `Button` — silently does nothing.
DuBois' `Button` builds its inner element as `{...props, css: getMemoizedButtonEmotionStyles(…)}`,
spreading the caller's props first and then overwriting `css` with its own. (That is also
why the `color: actionPrimaryBackgroundDefault` this replaced was dead code from the start:
the button was tertiary blue on its own, not because anything here asked for it.) On top of
that, DuBois runs its type colours through `importantify`, so the blue lands as
`color: #2272B4 !important` on `&:enabled:not(.du-bois-light-btn-icon-only)` — specificity
(0,3,0). The override therefore lives on a wrapper span as
`'&& button:enabled, && button:enabled:hover, && button:enabled:active'`, where `&&` doubles
the wrapper's own class to reach (0,3,1) and win. Hover and press are listed explicitly or
the button flashes blue under the cursor. The wrapper sits **outside** the `Tooltip`, so the
Tooltip→Button pairing is byte-identical and the tooltip still describes the button rather
than a styling div.

**This could not be verified in jest.** Emotion's `css` prop is compiled by
`craco.config.js` (`importSource: '@emotion/react'` plus `@emotion/babel-plugin`);
`jest.babel.config.js` has no emotion entry, so in jsdom an app-level `css` prop renders as
the literal attribute `css="[object Object]"` and every card reports the same colour
regardless of status. DuBois' own styles do show up there, because those packages ship
pre-compiled — which is exactly what makes the false reading convincing. Verified in a real
browser instead (see below).

**Status is carried by contrast, not a badge.** This is what makes entry 34's removal of the
status tag hold up — the lifecycle is still legible while scanning the grid, without spending
a chip on every card.

**`SkillTagsCell` gained an optional `muted` prop**, defaulting off. The table shares that
renderer and is unaffected; only the card passes it.

**The icon fades by opacity, because it is the one element that cannot take a colour.** Text
has `textSecondary`; a skill icon is an author-supplied image, and `RegistryIconImage` will
not recolour someone's logo — it cannot know what the mark is meant to look like. So the
icon gets `opacity: 0.5`, which drops it by about as much as the grey drops the words beside
it. The value is a named constant rather than a literal, since it is a design decision
without a token behind it.

**The placeholder had to be faded separately.** `RegistryIconImage` applies its `css` prop to
the image's chip but renders the caller's placeholder glyph untouched, so passing the styles
only to the component would have left every icon-less skill as the one card keeping a
full-strength puzzle mark. Both now take the same `iconStyles`.

**Why:** Requested during demo prep, with the MCP card treatment as the reference.

**Verification:** `yarn type-check` clean; ESLint clean on both files; prettier clean;
`yarn test src/skills-registry` 61/61 passing across 5 suites; dev server 200. Computed
colours read out of a real Chromium at `http://localhost:3000/#/skills`:
`@ocp-admin/cluster-creator` (latest version `draft`) renders its Use button at
`rgb(111, 111, 111)`, and all nine active neighbours on the first page stay at
`rgb(34, 114, 180)`. Visible on the seeded data without any setup.

**Revert:**
```
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillCard.tsx
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillCellRenderers.tsx
```
> Reverting `SkillCard.tsx` also undoes entry 34 (which removed the status badge and restored
> the timestamp), so a bare revert brings the badge back. `SkillCellRenderers.tsx` carries
> earlier cell work as well. To reverse only this entry, delete `isActive` and its three uses
> in `SkillCard.tsx` and drop the `muted` prop from `SkillTagsCell`.

### 42. Restore Bill's draft-resolution wording on the Status field
- **Type:** Fix
- **Intent:** The status hint says a draft is passed over whenever an active version exists and is always reachable by explicit version or alias.
- **Why:** Restore Bill Murdock's corrected draft-resolution wording (S3).
- **Replay:** agent-plugins
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**File:**
- `mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx`

**What:** One string — the `FormUI.Hint` under the **Status** selector in the Create skill /
Create skill version modal.

```
  before:  Status
           [ Active                    ▾ ]
           Active resolves by name. Draft is reachable only by version or alias.

  after:   Status
           [ Active                    ▾ ]
           A draft is passed over whenever any active version exists. A draft can
           always be reached by an explicit version pin or an alias.
```

**Why:** The old sentence states the thing Bill Murdock corrected twice in the review thread,
and it was wrong in a way that matters. "Draft is reachable **only** by version or alias"
says a name-only reference never resolves to a draft. It does: when a skill has no active
version at all, latest-resolution falls back to the highest non-deleted version, so a
brand-new skill whose first version is a draft resolves by name. RFC-0008's status table
gives exactly that case as its example. Bill's item 11 raised it, Peter's reply narrowed it
to "a draft never satisfies a name-only reference", and Bill's follow-up corrected that too;
the wording above is his final text, minus the trailing "so you can share it for review and
promote it later from the version's detail page" clause, which describes a workflow rather
than the resolution rule and does not fit a form hint.

**This is not something these UI changes broke.** The short sentence is present at the
baseline commit `9544ee0a1`, so the branch had already drifted from the wording Peter
reported shipping. It surfaced while auditing the 41 previous entries against the review
thread.

**Not changed:** the `description` field on the message is untouched, so the i18n key is
stable and no other locale entry needs regenerating. No test asserted the old string.

**Verification:** `yarn type-check` clean; ESLint clean; prettier clean;
`yarn test src/skills-registry` 61/61 passing across 5 suites.

**Revert:**
```bash
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/hooks/useSkillFormModal.tsx
```
> This file also carries entries 19-29 (the whole Create skill form restructure: source-type
> radios, progressive disclosure, Name placement, the "Source" heading). A bare revert undoes
> all of them. To reverse only this entry, restore the single `defaultMessage` at the
> `FormUI.Hint` under the Status selector.

### 43. Fade a non-active card's custom icon, not just the default glyph
- **Type:** Fix
- **Intent:** Fading a card's icon also fades custom icons, not just the placeholder glyph.
- **Why:** The fade in #41 missed custom icons (S6). Shared renderer: arrives everywhere with the merge.
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/common/components/RegistryIcon.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillCard.tsx` (comment only)

**What:** Entry 41 said a non-active card's icon fades to 50%. It only did so for skills with
no registered icon. A skill carrying a **custom** icon kept it at full strength, so the
publisher art was the one bright thing on an otherwise grey card — the exact problem entry 41
set out to fix, just relocated.

```
  before:                                after:
  [◉] model-monitor         v2           [◉] model-monitor        v2     <- chip now 50%
      ^ full-strength white chip              ^ recedes with the card
  🧩 system-context         v2           🧩 system-context        v2
      ^ already faded                         ^ unchanged
```

**Why it silently did nothing.** `SkillCard` passes `css={iconStyles}` to `RegistryIconImage`,
and `RegistryIconImage` declared a matching `css?: Record<string, unknown>` prop and spread it
onto the chip. That prop is unreachable. Emotion's JSX transform intercepts `css` on a
**component** — it serializes the styles and passes the result down as `className`, so the
component's own `css` prop never receives anything. The declaration and the spread were dead
code, and had been since the renderer was written.

The placeholder branch worked only by accident of a different mechanism: `<PuzzleIcon
css={iconStyles} />` is a DuBois icon that forwards `className`, so Emotion's rewrite lands
where it needs to. That asymmetry is what made the bug look like a styling problem rather
than a plumbing one.

**Fix:** `RegistryIconImage` now accepts `className` and puts it on the chip, replacing the
`css` prop and its spread. Callers keep writing `css={...}` exactly as before — `className`
is just the seam Emotion actually delivers it through, and it is the standard contract for
making any component `css`-able. The prop's doc comment says so, and says that it does not
reach `placeholder`, which is the caller's own element and is rendered untouched.

**This is a shared renderer.** RFC-0008 §Icons specifies it is shared across the skills, MCP
and agent-plugin registries, so the change is deliberately additive: nothing about theme
selection, sanitising, fallback or sizing moves. The other three call sites
(`SkillListTable`, `SkillPage`, `SkillIconField`) are unaffected — `SkillListTable` passes
`css={{ flexShrink: 0 }}`, which now genuinely applies and duplicates a value the chip
already hard-codes.

**Judgment call: the whole chip fades, not just the image.** A registered icon sits on a
white ground, because a near-black monochrome mark is invisible on a dark theme. Fading only
the `img` would leave a full-strength white tile on a grey card, which reads louder than the
icon did. Fading the chip takes the ground down with the art.

**Verification:** `yarn type-check` clean; ESLint and prettier clean on both files;
`yarn test src/skills-registry src/common/components` 186/186 passing across 28 suites.
Computed opacity read out of a real Chromium at `http://localhost:3000/#/skills`:
`@ocp-admin/cluster-creator` (custom icon, latest version `draft`) reports `0.5`, and the
six active cards with custom icons on the first page all report `1`. Not testable in jest —
see entry 41 on why `css` props do not compile under `jest.babel.config.js`.

**Revert:**
```bash
git checkout 9544ee0a1 -- mlflow/server/js/src/common/components/RegistryIcon.tsx
```
> `RegistryIcon.tsx` is otherwise untouched by entries 1-42, so this revert is independent —
> it restores the dead `css` prop and non-active custom icons go back to full strength. The
> `SkillCard.tsx` change here is a corrected comment only; reverting that file would undo
> entries 1, 7, 34 and 41 as well.

### 44. Put the Organization filter back on the catalog view — partly reverts entry 9
- **Type:** Revert
- **Intent:** The organization filter stays in the list filter row.
- **Why:** Requested by name (S8) and committed to by the RFC's UI section (S3, S7).
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.test.tsx`

**What:** The searchable **Organization** combobox is back in the skills list filter row,
between Status and the end of the row.

```
  before (entry 9):   [Search skills] [Status: All statuses]
  after:              [Search skills] [Status: All statuses] [All organizations ▾]
```

**Why:** It was the one control in entry 9's cut that someone had asked for by name. Matt
Prahl requested an organization filter, then followed up asking that the unbounded filters be
filterable combo boxes; Peter built it as a `TypeaheadCombobox`. Bill Murdock's item 14
separately noted that RFC-0008's UI section commits to filtering by organization. Cutting it
for consistency with the prompts and MCP list pages traded a requested capability for a
convention, which is the wrong way round.

**Restored as it was, not reinvented.** Same `RegistryFilterCombobox` (the shared
`TypeaheadCombobox` wrapper), same `useSkillOrganizations` hook, same placeholder and aria
label, same `renderOption` printing `@{organization}`. Nothing new was written; the controls
were the only thing entry 9 removed, so putting them back is a matter of re-rendering them.

**Source type stays cut.** Entry 9 removed two controls and this restores one. Source type is
the dimension nobody asked to browse by — it appears in the RFC's list, but not in Matt's
four asks or Bill's fourteen, and the row reads better at three controls than four. The
`sourceType` filter field and its query support are untouched, so it is one component away
if a reviewer wants it.

**The combobox is where `@acme-platform` reappears**, which entry 1 had described as
placeholder noise. That reading was wrong: `@acme-platform` is the deliberately-invented
organization holding the two synthetic skills that demo the OCI and ZIP file browsers
(`mocks/demoSourceSkills.ts` says so outright). It belongs in the list.

**The `@` is presentation only.** `renderOption` prints it; the stored value stays bare,
because that is what a skill record carries and what the query layer matches on. Printing it
keeps the dropdown reading the same as the URIs on the detail page, which is the consistency
Bill raised in items 13 and 18d.

**Tests:** the entry-9 test asserting neither control renders now asserts only that the
source control is absent, the at-rest test picks its "All organizations" placeholder
assertion back up, and the baseline's type-to-narrow test returns — it clicks the combobox,
sees all eight seeded organizations, types `ocp`, and watches `@rh-sre` drop out while
`@ocp-admin` stays. Suite count unchanged at 4; test count 61 → 62.

**Verification:** `yarn type-check` clean; ESLint and prettier clean on both files;
`yarn test src/skills-registry` 62/62 passing across 5 suites. Exercised in a real Chromium
at `http://localhost:3000/#/skills`: the combobox lists `@acme-platform`, `@ocp-admin`,
`@rh-ai-engineer`, `@rh-automation`, `@rh-basic`, `@rh-developer`, `@rh-sre`, `@rh-virt`;
typing `ocp` narrows to one; selecting it takes the grid to the 8 `@ocp-admin` skills.

**Revert:**
```bash
git checkout 9544ee0a1 -- \
  mlflow/server/js/src/skills-registry/components/SkillListFilters.tsx \
  mlflow/server/js/src/skills-registry/components/SkillListFilters.test.tsx
```
> That reverts to the BASELINE, which restores the Source filter too and undoes entry 9's
> other work on these files. To land only this entry, keep the files as they now stand. To
> undo only this entry and keep entry 9, delete the `RegistryFilterCombobox` block, the
> `useSkillOrganizations` call and the two imports.

### 45. Put the Organization column back in the table view — partly reverts entry 1
- **Type:** Revert
- **Intent:** The table keeps an Organization column wide enough that organizations do not truncate.
- **Why:** Readers must see what they filtered by; (organization, name) is the key (S3, S7).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**File:**
- `mlflow/server/js/src/skills-registry/components/SkillListTable.tsx`

**What:** The **Organization** column is back in the skills list table, second, between Name
and Description.

```
  before:  | Name | Description | Latest version | Status | Source | Last modified | Use |
  after:   | Name | Organization | Description | Latest version | Status | Source | Last modified | Use |
```

**Why:** The companion to entry 44. With an organization filter back in the row above, a
table that never shows the organization leaves the reader unable to see what they filtered
by, or to tell two same-named skills in different organizations apart — which is the whole
reason RFC-0008 makes `(organization, name)` the primary key rather than the name alone.
Bill Murdock's items 13 and 18d were both about the `@` marker being present and consistent
across surfaces; hiding it from the table cut the other way.

**Restored in place, not rebuilt.** The `ORGANIZATION` member is back on `ColumnKeys`, the
`SkillOrganizationCell` import is back, and the column definition is the baseline's. That
cell already prints the leading `@` and renders an unscoped skill as a dash rather than an
empty cell, so a bare first segment stays unambiguously a name.

**One deliberate change from the baseline: `maxWidth` 160 → 200.** At 160 the two longest
seeded organizations truncate — `@acme-platform` became `@acme-platf…` and
`@rh-ai-engineer` would become `@rh-ai-engi…`. An organization is an identifier people match
on rather than read, so a truncated one costs the reader the exact thing the column was
added for. 200 fits every seeded value with room to spare, and the 40px comes out of the
description column's `flex: 2`, which loses the least by it.

**The card view is unchanged.** Entry 1 removed the organization from three surfaces; this
restores one of them. Cards get their organization from the tooltip on the name, which
carries the full `@org/name`, and a card is a browse surface where the second line of
identifier competes with the description for the space that makes the card scannable.

**Verification:** `yarn type-check` clean; ESLint and prettier clean; `yarn test
src/skills-registry` 62/62 passing across 5 suites. Read out of a real Chromium at
`http://localhost:3000/#/skills` in list view: headers are `Name, Organization, Description,
Latest version, Status, Source, Last modified, Use`, values render as `@acme-platform` and
`@ocp-admin`, and no organization cell reports `scrollWidth > clientWidth` — i.e. nothing
clips at the new width.

**Revert:**
```bash
git checkout 9544ee0a1 -- mlflow/server/js/src/skills-registry/components/SkillListTable.tsx
```
> That goes to BASELINE, which also undoes entry 1's other work on this file and restores
> `maxWidth: 160`. To undo only this entry and keep entry 1, delete the `ORGANIZATION` column
> definition, the enum member and the `SkillOrganizationCell` import.

### 46. Lead the search help popover with a summary of what can be filtered
- **Type:** Update
- **Intent:** The search help opens with one sentence naming what can be filtered, before the syntax.
- **Why:** The popover opened on grammar before saying what the box is for (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.tsx`
- `mlflow/server/js/src/model-registry/components/model-list/ModelListFilters.tsx`

**What:** The info popover on the skills search box now opens with a plain-language summary
before the syntax explanation.

```
  before:                                  after:
  ┌──────────────────────────────────┐     ┌──────────────────────────────────┐
  │ To search by tags or by names    │     │ Filter by tag, org, keyword,     │
  │ and tags, use a simplified       │     │ and source type.                 │
  │ version of the SQL WHERE clause. │     │                                  │
  │ Learn more                       │     │ To search by tags or by names    │
  │                                  │     │ and tags, use a simplified       │
  │ Examples:                        │     │ version of the SQL WHERE clause. │
  │ • tags.my_key = "my_value"       │     │ Learn more                       │
  │ • name ILIKE "%my-skill-name%"…  │     │                                  │
  └──────────────────────────────────┘     │ Examples: …                      │
                                           └──────────────────────────────────┘
```

**Why:** The popover opened on grammar. A reader who does not already know the box accepts a
query language has no reason to click an info icon, and one who does click it meets `WHERE`
before learning what the box is for. Naming the dimensions first makes the syntax the answer
to a question the reader now has.

**Done with a prop, not a fork.** `ModelSearchInputHelpTooltip` is shared by the model
registry, the prompt registry and skills, so it gained an optional `leadIn?: React.ReactNode`
that renders above the existing paragraph with a blank line under it. Unset by default, which
is what keeps the model and prompt popovers byte-identical. This follows the seam
`exampleEntityName` already established on the same component: per-registry text arrives as a
prop rather than by copying the popover.

**⚠️ The sentence names one thing the UI cannot currently do. `source type` has no control
and is not free-text searchable.** `matchesFreeText` (`skillSearchSyntax.ts:105`) matches
name, organization, description, tags and aliases — not source type — and entry 9 removed the
Source dropdown, which entry 44 did not restore. So of the four dimensions named:

| Named | Works today? | How |
|---|---|---|
| tag | yes | `tags.key = "value"` in the box, or free text |
| org | yes | free text, or the combobox restored in entry 44 |
| keyword | yes | free text over name, description, tags, aliases |
| source type | **no** | no control, not free-text matched |

Written as requested rather than trimmed, since the copy was specified exactly. Two ways to
make it true, both small: restore the Source dropdown entry 9 removed (the filter field and
query support are still live, so it is one component), or teach `matchesFreeText` to match
the latest version's source type. **Flagged for a decision before the demo** — this is the
same class of thing Bill Murdock raised in items 2, 6 and 7, where the UI described something
the system does not do.

**Verification:** `yarn type-check` clean; ESLint and prettier clean on both files;
`yarn test src/skills-registry src/model-registry/components/model-list` 73/73 passing across
7 suites. `yarn i18n:check` reports a mismatch, but it does so on a clean baseline tree too
(3503 extracted vs 3324 in `en.json`), so it is pre-existing and not caused by the new key.
Read out of a real Chromium: the skills popover reads *"Filter by tag, org, keyword, and
source type."* followed by the original paragraph, and the prompts popover is unchanged.

**Revert:**
```bash
git checkout 9544ee0a1 -- mlflow/server/js/src/model-registry/components/model-list/ModelListFilters.tsx
```
> `ModelListFilters.tsx` is untouched by entries 1-45, so that revert is independent and
> removes the `leadIn` prop. `SkillListFilters.tsx` also carries entries 9, 10 and 44 — to
> drop only this sentence, remove the `leadIn` prop from the `ModelSearchInputHelpTooltip`
> call and the now-unused `FormattedMessage` import.

### 47. Keep the `@` in the organization filter after you pick one
- **Type:** Fix
- **Intent:** A picked organization keeps its @ in the filter input.
- **Why:** The @ must read the same in the menu, the input and the URIs (S3). Shared control: arrives everywhere with the merge.
- **Replay:** none
- **Supersedes:** none
- **Notes:** Original log entry, verbatim.

**Files:**
- `mlflow/server/js/src/common/components/RegistryFilterCombobox.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillListFilters.test.tsx`

**What:** Selecting an organization now leaves `@acme-platform` in the input, not `acme-platform`.

```
  before:                                  after:
  ┌────────────────────────────┐           ┌────────────────────────────┐
  │ All organizations       ▾  │           │ All organizations       ▾  │
  ├────────────────────────────┤           ├────────────────────────────┤
  │ @acme-platform             │  ← click  │ @acme-platform             │  ← click
  │ @ocp-admin                 │           │ @ocp-admin                 │
  └────────────────────────────┘           └────────────────────────────┘
             ↓                                        ↓
  ┌────────────────────────────┐           ┌────────────────────────────┐
  │ acme-platform       ✕   ▾  │           │ @acme-platform      ✕   ▾  │
  └────────────────────────────┘           └────────────────────────────┘
     the @ the menu offered
     disappears on selection
```

**Why:** The menu wrote the organization the way RFC-0008 writes it and the input wrote it a
different way, so choosing an option appeared to change what you had chosen. It also broke the
`@`-consistency point Bill Murdock made twice (items 13 and 18d): every other surface — the
detail page URIs, the table column restored in entry 45, the pull snippets — carries the
marker, and this was the one place it fell off.

**The rename is the substance of the change.** `RegistryFilterCombobox`'s `renderOption` is now
`formatOption`, and it returns a `string` rather than a node. That is not cosmetic: the old prop
only ever reached the menu row, which is precisely why the input disagreed with it. Downshift
fills the input from `itemToString` after a selection, so the formatting has to be available
there too, and a `ReactNode` cannot be put in an `<input value>`. Returning a string lets one
function serve all three places that write an option.

**Matching had to move with it, or the fix would have traded one bug for a worse one.** The
next keystroke after a selection is matched against whatever is sitting in the input. With the
input reading `@acme-platform` and the matcher still comparing raw items, `'acme-platform'
.includes('@acme-platform')` is `false` — so editing a selection would have emptied the menu
entirely. `matcher` now compares formatted-to-formatted. A side effect worth having: a query
can include the marker or omit it and both find the option (`acme` and `@acme` both hit).

**The stored value is untouched.** `onChange` still emits the bare `acme-platform`, because
that is what a skill record carries and what the query layer matches on. The `@` is
presentation only, applied at the three points where an option is written for a human.

**Verification:** `yarn type-check` clean; ESLint and prettier clean on all three files;
`yarn test src/skills-registry` 63/63 across 5 suites. Added a test that renders the filter row
with real state and asserts the input reads `@ocp-admin` after selection — confirmed it is a
real guard by reverting `itemToString` alone, which fails it and nothing else. Read out of a
real Chromium at `#/skills`: menu shows all eight organizations marked; clicking
`@acme-platform` leaves `@acme-platform` in the input and narrows the grid to 2 cards (the two
synthetic OCI/ZIP demo skills); backspacing the selection down to `@acme` still lists
`@acme-platform`; typing `acme` without the marker also lists it. Specifically checked that
`formValue` does not bypass `itemToString` and re-seed the input with the bare string — it
does not.

**Revert:**
```bash
git checkout 9544ee0a1 -- mlflow/server/js/src/common/components/RegistryFilterCombobox.tsx
```
> ⚠️ `RegistryFilterCombobox.tsx` at baseline has no `renderOption`/`formatOption` prop at all,
> so this revert alone will not type-check while entry 44's call site still passes one. Revert
> it together with the entry 44 block in `SkillListFilters.tsx`, or just change `formatOption`
> back to `renderOption` in both files and restore `itemToString: (item) => item ?? ''` and the
> raw `matcher` — which is the smaller move, and drops only this entry. The test added here
> lives alongside entries 44's tests in `SkillListFilters.test.tsx`; delete the
> `keeps the \`@\` in the input` case and the `useState`/`SkillListFilterValues` imports.

### 48. Description is edited only through the kebab Edit modal (retroactive)
- **Type:** Decision
- **Intent:** The description is edited only in the kebab Edit modal; there is no inline pencil.
- **Why:** A field belongs in one editor (S6).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** #30, #31
- **Notes:** Added at conversion; not in Daniel's log.

**Files:**
- `mlflow/server/js/src/skills-registry/components/SkillDescriptionBox.tsx`
- `mlflow/server/js/src/skills-registry/components/SkillPage.tsx`

**What:** The pencil beside the header description is gone. `SkillDescriptionBox` is now
read-only and the description is edited in the kebab's **Edit** modal, next to icon.
Supersedes the pencil placement from entries 30 and 36.

**Why:** A field belongs in one editor. Entry 40 already took tags out of the Edit modal
because they have their own pencil, and the description was the one field still reachable
from two places. (Daniel's commit `e4032f77b`, "fix", 2026-09-09.)

**Revert:** `git show e4032f77b` and reverse it by hand. 2026-09-11-pdouble-merge-rulings#3 deleted the hook it would
need.

## Open questions
- #25: the radio group owns non-radio controls, an ARIA wrinkle; the accessible fix was deferred.
- #33: a folder with no SKILL.md warns rather than blocking registration.
