---
id: 2026-08-26-asaluja-agent-registry-demo-feedback
author: Aditi Saluja
date: 2026-08-26
target: mlflow
branch: unified-registry
base: a6c0f1719
features: [agent-registry]
sources:
  - {id: S1, kind: review, title: "Agent registry demo feedback (Daniel Warner): modal-on-modal reference linking"}
  - {id: S2, kind: doc, title: "Commit 7b76a4837: Agent Registry: address demo feedback on linking, filters, eval compare"}
impact: none
---

# Agent registry: demo feedback on linking, filters, eval compare

## Narrative
Aditi Saluja answered the agent registry demo feedback on `unified-registry`
in one commit, `7b76a4837`, with no report at the time. This report was
converted from that commit at the 2026-09-18 unified-registry merge, at the
owner's request, so the replay model can see her work. Entries 1-3 restate
the three bullets of her commit message; the message itself is kept verbatim
in the Notes of entry 1. The reference picker was taken for every registry
form on 2026-08-26 and survives the merge; the skill filter and the eval
comparison layout are superseded by the 2026-09-09 agent registry rework
(`2026-09-18-pdouble-unified-registry-merge`).

## Entries

### 1. References are linked inline from one searchable multi-select
- **Type:** Update
- **Intent:** Linking references (skills, MCP servers, plugins, models) happens
  in a searchable dropdown with a checkbox per item, so several can be linked
  without it closing and one can be unlinked from the same list. Linked items
  show as removable chips below, pinned to their latest version. No button
  that opens a second dialog.
- **Why:** The link button opened a modal on top of the create modal (S1).
- **Replay:** agent-plugins
- **Supersedes:** none
- **Files:** AgentCreateModal.tsx
- **Notes:** Her commit message (S2), verbatim:

  > Agent Registry: address demo feedback on linking, filters, eval compare
  >
  > - AgentCreateModal: replace Link-button/modal-on-modal ref pickers with a
  >   searchable, multi-select combobox (skills, MCP, plugins, models); selected
  >   items shown as removable chips, latest version auto-pinned
  > - Agent list: make the skill filter a searchable single-select combobox
  > - Compare view: render eval-score comparison as a responsive grid of per-metric
  >   tiles (Compare Runs style) with per-version bars and delta
  > - Tidy import ordering left by the inline MCP stub

### 2. The agent list's skill filter is searchable
- **Type:** Update
- **Intent:** Filtering the agent list by skill uses a searchable single-select
  dropdown rather than a plain list.
- **Why:** Demo feedback on the agent list filters (S1).
- **Replay:** none
- **Supersedes:** none
- **Files:** AgentListPage.tsx

### 3. Eval scores compare as per-metric tiles
- **Type:** Update
- **Intent:** Comparing two versions shows one tile per evaluation metric, with
  a bar per version and the delta, in a responsive grid like Compare Runs.
- **Why:** Demo feedback on the version comparison (S1).
- **Replay:** none
- **Supersedes:** none
- **Files:** AgentVersionCompareView.tsx

## Open questions
