---
id: 2026-09-18-pdouble-agent-registry-replay
author: Peter Double
date: 2026-09-18
target: mlflow
branch: agent-registry-rfc
base: 9d9ddccad
features: [agent-registry]
sources:
  - {id: S1, kind: doc, title: "Pending replay list for agent-registry (design_reports.py pending), 45 entries", date: 2026-09-18}
  - {id: S2, kind: review, title: "Owner picks and rulings on the agent-registry replay", date: 2026-09-18}
  - {id: S3, kind: doc, title: "RFC-0011 agent registry", url: "https://github.com/mlflow/rfcs/pull/39"}
impact: none
---

# Agent registry: replay of the skills design passes

## Narrative
Run 2 of 3 agreed on 2026-09-18 (agent-registry-rfc v10). It carries the same skills passes
as 2026-09-18-pdouble-agent-plugins-replay, this time onto Agent Registry, which was still
at the v6 standards. The owner took 40 of the 45 pending entries and declined 5, all for
grounded reasons: agents have no Use modal and no file tree (S3), and the organization now
goes in the name (S2). The owner also ruled that the page-level switch carries Evaluations
beside Traces. Skills components are imported, not copied.

## Entries

### 1. Detail header follows the skills header
- **Type:** Update
- **Intent:** No `@org` line under the title (the secondary line keeps the display name and version scheme); the description sits in the header as muted copy clamped to two lines; entity tags follow as a chip row with their own pencil; the primary button reads Create <entity> version; the kebab Edit holds only the mutable non-tag fields.
- **Why:** Parity with the skills detail page (S1, S2).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#1 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#2 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#3 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#5 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#35 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#36 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#37 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#40 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#48 (agent-registry), 2026-09-11-pdouble-merge-rulings#1 (agent-registry)
- **Files:** AgentPage.tsx, useEditAgentModal.tsx, useEditAgentTagsModal.tsx (new), AgentCard.tsx
- **Notes:** Agents never had a page-level Use, and the version grid never carried the description. The summary card and access bindings stay in the header, after the tags: they are the agent record's own content (S3).

### 2. Page-level Preview / Traces / Evaluations switch
- **Type:** Update
- **Intent:** Observability that reads the entity's one experiment is a page-level mode above the version rail, not a tab inside a version: Preview (the default, kept out of the URL), Traces and Evaluations on `?mode=`. Only the right pane swaps, and the rail and selected version stay put. Version-scoped content stays in tabs under the metadata. The tag row leaves a medium gap before the switch.
- **Why:** The skills Traces switch (S1), extended with Evaluations by owner ruling because both read the agent's default experiment, filterable by version (S2, S3).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#8 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#39 (agent-registry), 2026-09-11-pdouble-merge-rulings#4 (agent-registry)
- **Files:** AgentPage.tsx, AgentVersionPane.tsx
- **Notes:** Composition, Agent card, Compare and Lifecycle remain tabs under the metadata. The Evaluations mode uses CheckCircleIcon, since MLflow has no established evaluations icon to mirror.

### 3. Version pane follows the skills pane
- **Type:** Update
- **Intent:** The browse link shows only when it differs from the source, with the disclaimer either way; version tags are labelled Metadata.
- **Why:** Parity with the skills version pane (S1, S2).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#6 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#17 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#18 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#32 (agent-registry), 2026-09-18-pdouble-round2-merge-rulings#2 (agent-registry)
- **Files:** AgentCellRenderers.tsx, AgentVersionPane.tsx
- **Notes:** Already true before this run: Delete version is the pane's only action, because agents have no Use (demo-prep#6); the rail row layout (demo-prep#17); and a single new-window icon (demo-prep#18).

### 4. List page follows the skills list
- **Type:** Update
- **Intent:** No subtitle, with the standard gap before the filter row; an Active checkbox instead of a status select; a label control before the bill-of-materials filters; the search help opens with a sentence naming the filters; cards carry no status tag, timestamp or `@org` line, their footer is the organization, and a card whose latest version is not active recedes; the table's organization column does not truncate.
- **Why:** Parity with the skills list (S1, S2).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#9 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#10 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#34 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#41 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#45 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#46 (agent-registry), 2026-09-15-dwarner-stakeholder-feedback#2 (agent-registry), 2026-09-15-dwarner-stakeholder-feedback#4 (agent-registry), 2026-09-18-pdouble-round2-merge-rulings#4 (agent-registry)
- **Files:** AgentListPage.tsx, AgentListFilters.tsx, AgentListTable.tsx, AgentCard.tsx, useAgents.ts
- **Notes:** Agent cards have no action to keep, so the footer is the organization alone.

### 5. Create and add version follow the skills form
- **Type:** Update
- **Intent:** Name first, with the organization typed into it as `@org/name` and a hint saying so; the Form / CLI / Python switch at the default size; the anchor choice as vertical radios with their own descriptions, nothing preselected on create, each option's fields revealed beneath it; secondary labels hint-styled with source type above location; no reference-URI preview; the CLI and Python arms in the prompts usage block; the icon field is the MCP registry's editor.
- **Why:** Parity with the skills create form (S1, S2).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#13 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#20 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#21 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#22 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#23 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#24 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#25 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#28 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#29 (agent-registry), 2026-09-15-dwarner-stakeholder-feedback#5 (agent-registry), 2026-09-15-dwarner-stakeholder-feedback#8 (agent-registry), 2026-09-18-pdouble-round2-merge-rulings#3 (agent-registry), 2026-09-18-pdouble-round2-merge-rulings#6 (agent-registry)
- **Files:** useAgentFormModal.tsx, AgentAnchorFields.tsx, AgentRegisterSnippet.tsx
- **Notes:** An agent's name is always the registrant's, even when a card is imported, so `@org/name` applies in every anchor mode, unlike plugin import. The IconEditor (stakeholder#5) arrives through the shared SkillIconField, which both agent forms already used. Version mode stays seeded from the latest version's anchor.

### 6. Declined for agents
- **Type:** Decision
- **Intent:** Changes that exist to shape a pull modal or a file viewer do not carry to an entity that has neither.
- **Why:** RFC-0011 agents are reached through access bindings, not pulled, and their anchors are source pointers plus a configuration snapshot, not a file tree (S3); the organization goes in the name (S2).
- **Replay:** none
- **Supersedes:** none
- **Declines:** 2026-09-15-dwarner-stakeholder-feedback#1 (agent-registry), 2026-09-15-dwarner-stakeholder-feedback#3 (agent-registry), 2026-09-15-dwarner-stakeholder-feedback#7 (agent-registry), 2026-09-18-pdouble-round2-merge-rulings#1 (agent-registry), 2026-09-07-dwarner-skills-demo-prep#19 (agent-registry)

## Open questions
