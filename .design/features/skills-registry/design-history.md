# Design History

This file contains a chronological record of key design updates and decisions for the skills registry prototype. See `.design/README.md` for format guidelines. Entries before 2026-09-07 are backfilled from the hub's prototype version summaries; no change reports exist for them.

---

## 2026-09-18

### [Decision] Merge rulings on the stakeholder feedback round 2
- Source column and Source filter stay, in line with RFC-0008; the filter row is to be re-evaluated as a whole later. (2026-09-18-pdouble-round2-merge-rulings#5)
- A name typed as `@org/name` now creates the skill under that organization. (2026-09-18-pdouble-round2-merge-rulings#6)
- Recorded the round-2 changes the report missed: remote-source files wording, the Metadata label, organization entered through the name, and the label filter. (2026-09-18-pdouble-round2-merge-rulings#1, #2, #3, #4)

## 2026-09-15

### [Update] Stakeholder feedback pass
- Skill-level Use now pulls the backend's latest version instead of resolving through a production alias. (2026-09-15-dwarner-stakeholder-feedback#1)
- Status dropdown replaced by an Active checkbox, matching the MCP server registry. (2026-09-15-dwarner-stakeholder-feedback#2)
- Use modal resolution line tightened to the heading. (2026-09-15-dwarner-stakeholder-feedback#3)
- Card footer shows organization instead of timestamp. (2026-09-15-dwarner-stakeholder-feedback#4)
- Icon editor now matches the MCP registry: per-theme rows, add/remove, preview strip — reverted, then ported from production MLflow 3.15. (2026-09-15-dwarner-stakeholder-feedback#5)
- Source column and Source filter removed from the catalogue. (2026-09-15-dwarner-stakeholder-feedback#6)
- File viewer modal now shows syntax-highlighted content with line numbers. (2026-09-15-dwarner-stakeholder-feedback#7)
- Create skill Name input shows a hint about organization scoping. (2026-09-15-dwarner-stakeholder-feedback#8)

## 2026-09-11

### [Decision] Merge rulings on the demo-prep pass
- Dropped the skill rename, which RFC-0008 does not have, and restored the Source filter the search help promised. (2026-09-11-pdouble-merge-rulings#1, #2)
- On the composed branch, version content keeps its tabs under the metadata while Traces stays at page level. (2026-09-11-pdouble-merge-rulings#4)

## 2026-09-07

### [Update] Demo-prep design pass (Daniel Warner)
- Detail page now reads like prompts: description and tags under the title, a page-level Preview / Traces switch and a simpler version rail. (2026-09-07-dwarner-skills-demo-prep#35, #3, #8, #17)
- Cards recede when their latest version is not active, as MCP cards do. (2026-09-07-dwarner-skills-demo-prep#41)
- The create form asks link-or-upload with radios and reveals only the chosen path's fields; uploads read the folder's real files. (2026-09-07-dwarner-skills-demo-prep#22, #25, #33)

## 2026-09-04

### [Meeting] UX/UI-Eng working session (Murdock, Warner, Wang, Nosirova)
- Moved the tabs under the version details, turned files into an expandable tree, and showed full source URLs with a third-party note.

### [Update] Icons and version tag editing
- Skills gained icons and editable version tags.

## 2026-09-03

### [Feedback] 2026-09-01 UX review (Murdock, Warner, Wang, Prahl, Watanabe)
- Optional create fields moved behind Advanced settings with a Form / CLI / Python toggle; the detail page gained tabs; delete now follows the RFC's rule; the catalogue was reseeded from Red Hat's real skills.

## 2026-08-25

### [Feedback] Daniel Warner UX review
- Adopted the shared alias chip and the RFC's four-state lifecycle, and put SKILL.md behind a collapsed disclosure.

## 2026-08-05

### [Update] Initial design created
- List, detail and create screens for RFC-0008 in MLflow's own design system, plus adding a version.
