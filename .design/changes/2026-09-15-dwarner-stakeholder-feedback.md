---
id: 2026-09-15-dwarner-stakeholder-feedback
author: Daniel Warner
date: 2026-09-15
target: mlflow
branch: skills-registry-rfc
base: ee5dbfedf
features: [skills-registry]
sources:
  - {id: S1, kind: review, title: "Stakeholder feedback: Use on a skill should pull latest, not the production alias", date: 2026-09-15}
  - {id: S2, kind: doc, title: "MLflow MCP registry (demo site) — Active checkbox and icon form", url: "https://demo.mlflow.org/#/mcp-registry"}
impact: none
---

# Skills registry: stakeholder feedback pass

## Narrative
New design pass on the skills registry, kept as its own batch rather than
appended to the 2026-09-07 demo-prep report or the 2026-09-11 merge rulings.
The driver is the latest feedback from a key stakeholder. Work is on
`skills-registry-rfc` at `ee5dbfedf`. The first item is the skill-level Use
button: it had been resolving through a `production` alias, and the ask is to
pull whatever the backend considers latest instead. Also replaced the status
dropdown with an Active checkbox, matching the MCP server registry.

## Entries

### 1. Skill-level Use pulls latest, not a production alias
- **Type:** Update
- **Intent:** Use on a skill (not a specific version) fetches what the backend
  considers latest — the highest non-draft version — and does not resolve
  through a production alias, even when one exists. Use on a version still
  pins that version.
- **Why:** The snippet said it used the production alias; latest is the honest
  consume default. Preferring production when it exists was considered and
  declined (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillPullModal.tsx, SkillPullModal.test.tsx, SkillPullInstructions.tsx
- **Revert:** restore alias preference (`latest`, then the first alias on the version)
- **Notes:** Stakeholder: "The use button says it uses the alias production but
  I think the better approach is just pull what is considered the latest by the
  backend (e.g. highest non-draft version). We could optionally special case
  that if production alias exists, we prefer that but I tend towards not."

### 2. Replace the status dropdown with an Active checkbox
- **Type:** Update
- **Intent:** The catalog filter row shows a checkbox labelled Active rather
  than a status dropdown. Checked shows only active skills; unchecked shows
  all statuses including drafts.
- **Why:** Match the MCP server registry's filter row (S2).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillListFilters.tsx, SkillListFilters.test.tsx

### 3. Tighten the Use modal resolution line to the heading
- **Type:** Fix
- **Intent:** In the Use modal the resolution note sits tight against the
  heading and leaves a medium gap before the format tabs.
- **Why:** The equal spacing made the note read as a peer of the tabs rather
  than a qualifier of the heading (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillPullInstructions.tsx, SkillPullModal.tsx

### 4. Replace the timestamp on skill cards with the organization name
- **Type:** Update
- **Intent:** The card footer shows the organization (prefixed with `@`) where
  the timestamp used to be. Skills without an organization show nothing there.
- **Why:** The organization is more useful for scanning a mixed catalogue than
  the last-updated timestamp (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillCard.tsx

### 5. Adopt the MCP registry's IconEditor for skills
- **Type:** Update
- **Intent:** The icon section in Create skill and Edit skill matches the MCP
  registry's form: confirmed rows with URL + theme dropdown + remove, a draft
  row with URL + theme + add, and a preview strip showing both light- and
  dark-theme renderings.
- **Why:** Ported directly from the production MCP registry (`IconEditor.tsx`
  in MLflow 3.15) for feature parity (S2).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillIconField.tsx, useEditSkillModal.tsx
- **Notes:** Folded at the 2026-09-18 merge from two entries, `5` and `5a`,
  which the report grammar cannot parse (`5a` is not an entry number, and `5`
  superseded itself). The first attempt was recorded verbatim as: "Revert: icon
  editor stays as-is. The icon editor remains the single-URL field with inline
  preview. The multi-row form did not render correctly (S1)." The port above is
  what shipped.

### 6. Remove the Source column and Source filter
- **Type:** Update
- **Intent:** The catalogue table has no Source column and the filter row has no
  Source dropdown. Source type is a version detail discovered on the detail page.
- **Why:** Source type adds noise to the browse surface without aiding discovery (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** 2026-09-11-pdouble-merge-rulings#2
- **Files:** SkillListTable.tsx, SkillListFilters.tsx, SkillListFilters.test.tsx
- **Notes:** 2026-09-11-pdouble-merge-rulings#2 is the entry which restored the Source filter.

### 7. Syntax highlighting in the file viewer modal
- **Type:** Update
- **Intent:** Opening a file from the skill version details tree shows syntax-highlighted
  content with line numbers, using the language implied by the file extension.
- **Why:** The plain `<pre>` block made code files hard to read (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** SkillFilesTab.tsx

### 8. Help text on the Name input about organization scoping
- **Type:** Update
- **Intent:** The Create skill form shows a hint below the Name field
  explaining that names can be scoped under an organization. The hint is
  replaced by an error or the inferred-name note when those apply.
- **Why:** A user whose name collides may not know that scoping under an
  organization is possible; the hint surfaces the option before it is needed (S1).
- **Replay:** agent-plugins, agent-registry
- **Supersedes:** none
- **Files:** useSkillFormModal.tsx

## Open questions
