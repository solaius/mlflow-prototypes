---
id: 2026-09-18-pdouble-picker-placeholder
author: Peter Double
date: 2026-09-18
target: mlflow
branch: agent-registry-rfc
base: b0f5c22a1
features: [agent-registry, agent-plugins]
sources:
  - {id: S1, kind: review, title: "Owner ruling on the reference picker placeholder", date: 2026-09-18}
impact: none
---

# Reference picker shows its search prompt

## Narrative
Answers the first open question of `2026-09-18-pdouble-unified-registry-merge`.
The shared reference picker repeated its label inside the field, so the search
prompt each form passes it was never seen. The field now shows the prompt while
empty and the linked names once something is picked, and the label appears once,
above it. With the prompt slot free, the nothing-registered message moves into
the disabled field, where the older picker had it. Filter-row dropdowns keep
their inline label, since they have no label above them.

## Entries

### 1. A reference field shows its search prompt, not its label again
- **Type:** Update
- **Intent:** An empty reference field shows its search prompt; once something
  is linked it shows the linked names. The field's label appears once, above
  the field, and never inside it.
- **Why:** The label inside the field repeated the heading above it and hid the
  prompt that says what the field does (S1).
- **Replay:** none
- **Supersedes:** none
- **Files:** RefLinkSection.tsx, RefLinkSection.test.tsx
- **Revert:** drop `withInlineLabel={false}` on the trigger

### 2. The nothing-registered message sits in the disabled field
- **Type:** Update
- **Intent:** When the registry behind a reference field holds nothing that can
  be linked, the disabled field itself says so, in place of its search prompt.
- **Why:** With the prompt slot visible, the message belongs where the prompt
  would be, as it was on the older picker (S1).
- **Replay:** none
- **Supersedes:** 2026-09-18-pdouble-unified-registry-merge#2
- **Files:** RefLinkSection.tsx, RefLinkSection.test.tsx

## Open questions
- Still open from the merge: menu rows show a record's full description where
  the older picker cut it to one line.
