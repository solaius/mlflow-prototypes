---
id: 2026-09-18-pdouble-agent-plugins-replay
author: Peter Double
date: 2026-09-18
target: mlflow
branch: agent-registry-rfc
base: 4d9573ef0
features: [agent-plugins]
sources:
  - {id: S1, kind: doc, title: "Pending replay list for agent-plugins (design_reports.py pending), 49 entries", date: 2026-09-18}
  - {id: S2, kind: review, title: "Owner picks and rulings on the agent-plugins replay", date: 2026-09-18}
  - {id: S3, kind: doc, title: "RFC-0008 skills and agent plugins registry", url: "https://github.com/mlflow/rfcs/pull/26"}
impact: none
---

# Agent plugins: replay of the skills design passes

## Narrative
Run 1 of 3 agreed on 2026-09-18 (agent-registry-rfc v9). It carries the skills registry's
2026-09-07 demo-prep pass, the 2026-09-11 rulings, the 2026-09-15 stakeholder round and
the 2026-09-18 rulings onto Agent Plugins, which was still at the v6 standards. The owner
took 48 of the 49 pending entries and declined one (S2). One more is declined here with a
grounded reason. Each group below lists what it carries. Skills components are imported,
not copied, so this run changes no skills-registry file. Agent Registry is v10.

## Entries

### 1. Detail header follows the skills header
- **Type:** Update
- **Intent:** No `@org` line under the title; the description sits in the header as muted copy clamped to two lines with Read more; entity tags follow as a chip row with their own pencil; no page-level Use; the primary button reads Create <entity> version; the kebab Edit holds only the mutable non-tag fields.
- **Why:** Parity with the skills detail page (S1, S2).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#1 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#2 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#3 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#5 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#35 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#36 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#37 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#40 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#48 (agent-plugins), 2026-09-11-pdouble-merge-rulings#1 (agent-plugins)
- **Files:** AgentPluginPage.tsx, useEditPluginModal.tsx, useEditPluginTagsModal.tsx (new), AgentPluginCard.tsx
- **Notes:** Imports SkillDescriptionBox and SkillTagsBox; the manifest description still stands in when the parent has none (RFC-0008). The version grid never carried the description, so demo-prep#36 already held.

### 2. Version pane and files follow the skills pane
- **Type:** Update
- **Intent:** Delete version before Use; the browse link shows only when it differs from the source, the disclaimer either way; version tags are labelled Metadata; the file tree takes the full width and a file opens in a modal with syntax highlighting, nothing opening on arrival; a file read at the provider says the content is read from a remote source.
- **Why:** Parity with the skills version pane (S1, S2).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#6 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#14 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#15 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#17 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#18 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#32 (agent-plugins), 2026-09-11-pdouble-merge-rulings#4 (agent-plugins), 2026-09-15-dwarner-stakeholder-feedback#7 (agent-plugins), 2026-09-18-pdouble-round2-merge-rulings#1 (agent-plugins), 2026-09-18-pdouble-round2-merge-rulings#2 (agent-plugins)
- **Files:** AgentPluginVersionPane.tsx, AgentPluginFilesTab.tsx, common/utils/codeLanguageForPath.ts (new)
- **Notes:** Already true before this run: the rail row layout (demo-prep#17; the plugin kind tag stays, since RFC-0008 resolves kind per version), a single new-window icon (demo-prep#18), and tabs under the metadata (rulings-09-11#4). Plugin versions carry no content digest, so demo-prep#14 has no row to move; it applies if one is added.

### 3. List page follows the skills list
- **Type:** Update
- **Intent:** No subtitle, with the standard gap before the filter row; an Active checkbox instead of a status select; a label control after source; the search help opens with a sentence naming the filters; cards carry no status tag and no `@org` line, their footer is the organization plus the action, and a card whose latest live version is not active recedes; the table's organization column does not truncate.
- **Why:** Parity with the skills list (S1, S2).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#9 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#10 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#34 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#41 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#45 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#46 (agent-plugins), 2026-09-15-dwarner-stakeholder-feedback#2 (agent-plugins), 2026-09-15-dwarner-stakeholder-feedback#4 (agent-plugins), 2026-09-18-pdouble-round2-merge-rulings#4 (agent-plugins)
- **Files:** AgentPluginListPage.tsx, AgentPluginListFilters.tsx, AgentPluginListTable.tsx, AgentPluginCard.tsx, useAgentPlugins.ts
- **Notes:** demo-prep#34 (timestamp and action) and stakeholder#4 (organization instead of the timestamp) combine into one footer: `@org` and the action.

### 4. Use modal follows the skills Use modal
- **Type:** Update
- **Intent:** Use on the entity pulls what the backend resolves as latest, never through an alias; from a version it pins that version. The resolution line is one muted sentence tight under the heading, then the format tabs at the default size, then the prompts usage block, which the create form's CLI and Python arms use too.
- **Why:** Parity with the skills Use modal; latest-not-alias is exactly RFC-0008's resolution of the bare plugin URI (S1, S2, S3).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#12 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#13 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#38 (agent-plugins), 2026-09-15-dwarner-stakeholder-feedback#1 (agent-plugins), 2026-09-15-dwarner-stakeholder-feedback#3 (agent-plugins)
- **Files:** AgentPluginPullModal.tsx, AgentPluginRegisterSnippet.tsx

### 5. Create and add version follow the skills form
- **Type:** Update
- **Intent:** Name first, at the top, with the organization typed into it as `@org/name` and a hint saying so; the Form / CLI / Python switch at the default size; the registration choice as vertical radios with their own descriptions, nothing preselected on create, each option's fields revealed beneath it; secondary labels in the reveal hint-styled with source type above location; no reference-URI preview; the status hint says when a draft is passed over; the icon field is the MCP registry's editor.
- **Why:** Parity with the skills create form (S1, S2).
- **Replay:** none
- **Supersedes:** none
- **Replays:** 2026-09-07-dwarner-skills-demo-prep#20 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#21 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#22 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#23 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#24 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#25 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#28 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#29 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#42 (agent-plugins), 2026-09-15-dwarner-stakeholder-feedback#5 (agent-plugins), 2026-09-15-dwarner-stakeholder-feedback#8 (agent-plugins), 2026-09-18-pdouble-round2-merge-rulings#3 (agent-plugins), 2026-09-18-pdouble-round2-merge-rulings#6 (agent-plugins)
- **Declines:** 2026-09-07-dwarner-skills-demo-prep#19 (agent-plugins), 2026-09-07-dwarner-skills-demo-prep#27 (agent-plugins)
- **Files:** usePluginFormModal.tsx, AgentPluginSourceFields.tsx
- **Notes:** Declined: demo-prep#19, because the organization now goes in the name rather than Advanced settings (owner, S2); demo-prep#27, because the heading stays Content, since an assembled version has no plugin-level source (S3). The IconEditor (stakeholder#5) arrives through the shared SkillIconField, which both plugin forms already used. Version mode is still seeded from the latest version's kind, since the choice was already made for that plugin.

### 6. Organization field in Import mode
- **Type:** Decision
- **Intent:** Where the name is taken from a package manifest, there is no name input to scope, so the organization is its own optional field placed directly under the package location.
- **Why:** Owner ruling on this replay (S2): the name comes from plugin.json (S3), so `@org/name` in the name field cannot apply there.
- **Replay:** none
- **Supersedes:** none
- **Files:** usePluginFormModal.tsx

## Open questions
