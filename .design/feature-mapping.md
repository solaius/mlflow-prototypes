# Feature mapping

Maps code paths in this fork to the design feature whose history they belong to.
See `.design/README.md`.

| Code Path | Design Feature | Design History |
|---|---|---|
| `mlflow/server/js/src/skills-registry/` | Skills registry | `.design/features/skills-registry/design-history.md` |
| `mlflow/server/js/src/agent-plugins/` | Agent plugins | `.design/features/agent-plugins/design-history.md` |
| `mlflow/server/js/src/agent-registry/` | Agent registry | `.design/features/agent-registry/design-history.md` |
| `mlflow/server/js/src/mcp-registry/` | MCP registry | `.design/features/mcp-registry/design-history.md` |

Shared registry components (`mlflow/server/js/src/common/components/Registry*` and
other files under `common/` used by more than one registry) have no history of
their own. A report's `features:` lists the features whose screens the session
changed. An entry's Replay names only the features that need their OWN code
change to follow it. A shared-component change that reaches every registry
through the merge uses `Replay: none` and says so in Why, as entries `#43` and
`#47` of `2026-09-07-dwarner-skills-demo-prep` do.
