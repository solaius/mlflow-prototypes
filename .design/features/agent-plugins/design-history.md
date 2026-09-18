# Design History

This file contains a chronological record of key design updates and decisions for the agent plugins prototype. See `.design/README.md` for format guidelines. Entries before 2026-09-11 are backfilled from the hub's prototype version summaries.

---

## 2026-09-18

### [Update] Replay of the skills design passes
- Detail header: no @org line, clamped description, tag row with its own pencil, no page-level Use, Create agent plugin version. (2026-09-18-pdouble-agent-plugins-replay#1)
- Version pane: Delete before Use, browse link only when distinct, Metadata label, full-width file tree with a highlighted file modal. (2026-09-18-pdouble-agent-plugins-replay#2)
- List: no subtitle, Active checkbox, Label filter, search lead-in, @org card footer, dimmed non-active cards. (2026-09-18-pdouble-agent-plugins-replay#3)
- Use pulls latest, not an alias; muted resolution line; prompts code block. (2026-09-18-pdouble-agent-plugins-replay#4)
- Create: Name first with @org/name, radio registration choice with revealed fields, stacked source fields. (2026-09-18-pdouble-agent-plugins-replay#5)

### [Decision] Organization stays a field in Import mode
- The name comes from plugin.json, so the organization is its own field under the package location. (2026-09-18-pdouble-agent-plugins-replay#6)

### [Update] Reference fields show their search prompt
- An empty reference field shows its search prompt instead of repeating its label, and a field with nothing to link says so inside the disabled field. (2026-09-18-pdouble-picker-placeholder#1, 2026-09-18-pdouble-picker-placeholder#2)

### [Update] Members are linked through the shared reference picker
- Skill and MCP server members are picked from the same searchable multi-select as the agent form, and a member field with nothing to link is disabled and says why. (2026-09-18-pdouble-unified-registry-merge#1, 2026-09-18-pdouble-unified-registry-merge#2)

## 2026-09-11

### [Update] Organization filter keeps its @ after selection
- Arrived with the skills demo-prep merge through the shared filter control. (2026-09-07-dwarner-skills-demo-prep#47)

## 2026-09-09

### [Update] Brought up to the registry standards and RFC-0008 / RFC-0010
- Plugin versions follow their manifest, plugins are either assembled or packaged, imports introspect the package, members can include MCP servers, and a plugin is withdrawn when a member skill is deleted.

## 2026-09-04

### [Update] Real collections and a plugin filter on skills
- Reseeded from Red Hat's real agentic collections so member lists resolve, and the skills list can be filtered to one plugin's skills.

## 2026-09-03

### [Update] Initial design created
- Agent plugins as their own registry, with deletion guarded so a plugin still in use cannot be removed silently.
