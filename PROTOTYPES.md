# MLflow asset registry UI prototypes

Clickable UI prototypes of four MLflow asset registries, built inside the
MLflow frontend so they use its real shell, navigation and design system.

**Live preview:** https://solaius.github.io/mlflow-prototypes/

| Registry | Route | Upstream design |
|---|---|---|
| Skills | [#/skills](https://solaius.github.io/mlflow-prototypes/#/skills) | [RFC-0008](https://github.com/mlflow/rfcs/pull/26) |
| Agent Plugins | [#/agent-plugins](https://solaius.github.io/mlflow-prototypes/#/agent-plugins) | [RFC-0008](https://github.com/mlflow/rfcs/pull/26), [RFC-0010](https://github.com/mlflow/rfcs/pull/27) |
| Agents | [#/agents](https://solaius.github.io/mlflow-prototypes/#/agents) | [RFC-0011](https://github.com/mlflow/rfcs/pull/39) (draft) |
| MCP Servers | [#/mcp-registry](https://solaius.github.io/mlflow-prototypes/#/mcp-registry) | MLflow MCP server registry |

## What works

The preview is a static build with no tracking server behind it. The four
registries run on in-browser mock data and are fully interactive: create,
version, tag, alias, filter, compare, delete. Changes live in the browser tab
and reset on reload. The rest of MLflow (experiments, prompts, models) needs a
server, so those pages show empty or error states here.

## Where the code is

- `mlflow/server/js/src/skills-registry/`, `agent-plugins/`, `agent-registry/`,
  `mcp-registry/` -- one directory per registry, each with its own mocks.
- `mlflow/server/js/src/common/` -- controls the registries share (reference
  picker, filter comboboxes, icons, search syntax).
- `.design/` -- dated change reports recording each design decision and why it
  was made, plus a per-registry design history.

This repository is a snapshot of the prototype branch on top of upstream MLflow
(`80c376037`, 2026-07-23), so `git diff 80c376037` shows everything the
prototypes add. Upstream CI workflows are removed; the one workflow builds and
publishes the preview.

## Run it locally

```bash
cd mlflow/server/js
corepack enable
yarn install --immutable
REACT_APP_MCP_REGISTRY_MOCKS=true yarn start
```

Contributors: Peter Double, Daniel Warner, Aditi Saluja; the page shell builds
on Juntao Wang's page composer work.
