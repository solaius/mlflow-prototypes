# Design History

This file contains a chronological record of key design updates and decisions for the agent registry prototype. See `.design/README.md` for format guidelines. Entries before 2026-09-11 are backfilled from the hub's prototype version summaries.

---

## 2026-09-18

### [Update] Replay of the skills design passes
- Detail header: no @org line, clamped description, tag row with its own pencil, Create agent version. (2026-09-18-pdouble-agent-registry-replay#1)
- Traces and Evaluations move to a page-level Preview / Traces / Evaluations switch above the rail. (2026-09-18-pdouble-agent-registry-replay#2)
- Version pane: browse link only when distinct, Metadata label. (2026-09-18-pdouble-agent-registry-replay#3)
- List: no subtitle, Active checkbox, Label filter, search lead-in, @org card footer, dimmed non-active cards. (2026-09-18-pdouble-agent-registry-replay#4)
- Create: Name first with @org/name, radio anchor choice with revealed fields, stacked source fields, prompts code block. (2026-09-18-pdouble-agent-registry-replay#5)

### [Decision] No Use modal or file tree changes for agents
- Pull and file-viewer entries declined: agents are reached through bindings and have no file tree. (2026-09-18-pdouble-agent-registry-replay#6)

### [Update] Reference fields show their search prompt
- An empty reference field shows its search prompt instead of repeating its label, and a field with nothing to link says so inside the disabled field. (2026-09-18-pdouble-picker-placeholder#1, 2026-09-18-pdouble-picker-placeholder#2)

### [Decision] One reference picker, and Aditi Saluja's work merged in
- Linking skills, plugins, MCP servers, models and agents in the create form uses the searchable multi-select chosen on 2026-08-26: checkboxes in the dropdown, chips below, a linked record shown checked. (2026-09-18-pdouble-unified-registry-merge#1)
- A reference field with nothing to link is disabled and says why beneath it. (2026-09-18-pdouble-unified-registry-merge#2)
- Version comparison keeps its rows beside the declared changes, and the list keeps its filter row, over the tile grid and skill filter from the same pass. (2026-09-18-pdouble-unified-registry-merge#3, 2026-09-18-pdouble-unified-registry-merge#4)

## 2026-09-11

### [Update] Composed the skills demo-prep pass
- Skill pages inside this prototype picked up the demo-prep redesign; the agent screens have not yet followed it. The patterns waiting to be carried over are listed by the hub's pending-replay check. (2026-09-11-pdouble-merge-rulings#4)

## 2026-09-09

### [Update] Aligned with RFC-0011
- Reworked the agent registry around RFC-0011 as reviewed: how an agent version is anchored, what it is built from, who can reach it, how its lifecycle is audited and how two versions compare.

## 2026-09-04

### [Update] Reverse lookups moved beside the version
- "Used by agents" became a tab scoped to the selected skill version.

## 2026-08-26

### [Feedback] Demo feedback on linking, filters and eval compare
- Aditi Saluja replaced the link-button dialogs with an inline searchable multi-select, made the skill filter searchable, and laid eval scores out as per-metric tiles. Report converted from her commit on 2026-09-18. (2026-08-26-asaluja-agent-registry-demo-feedback#1, 2026-08-26-asaluja-agent-registry-demo-feedback#2, 2026-08-26-asaluja-agent-registry-demo-feedback#3)

## 2026-08-10

### [Update] Initial design created
- A record-centric agent registry whose versions pin skills and MCP servers, with the runtime side held behind an explicit boundary panel.
