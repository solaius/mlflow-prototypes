---
name: dev-server
description: Use when starting the MLflow dev server, setting up a fresh clone, or when `dev/run-dev-server.sh` fails on Windows with "'--dev' is not supported on Windows", WinError 10022, or a missing `yarn` command.
---

# Run the MLflow Dev Server

Backend (uvicorn + SQLite) on **:5000**, React frontend (webpack) on **:3000**.
The frontend proxies `/ajax-api`, `/graphql`, `/get-artifact`, and `/gateway` to
:5000 (`mlflow/server/js/src/setupProxy.js`), so both must be running.

On Linux/macOS use the documented path in `CLAUDE.md`:

```bash
nohup uv run bash dev/run-dev-server.sh > /tmp/mlflow-dev-server.log 2>&1 &
```

**That script does not work on Windows.** Use the steps below instead.

## First-time setup

```bash
uv sync                                                   # repo root
corepack enable --install-directory ~/.local/bin          # if `yarn` is missing
cd mlflow/server/js && yarn install                        # ~730 pkgs, ~580 MB
```

`pyproject.toml` requires **uv >= 0.10.12**. An older uv fails to parse `uv.lock`
with `invalid type: boolean 'false', expected a timestamp string`. Fix with
`uv self update`.

## Run

```bash
# Backend — from repo root
uv run mlflow server --host 127.0.0.1 --port 5000 --workers 1

# Frontend — from mlflow/server/js
BROWSER=none yarn start
```

First webpack compile takes ~80s and emits ~45 source-map warnings. These are
benign — third-party packages shipping maps that point at absent `.ts` sources.

## Windows deviations

| Symptom | Cause | Fix |
|---|---|---|
| `Error: '--dev' is not supported on Windows` | CLI guard in `mlflow/cli/__init__.py` | Drop `--dev`. It only sets `--uvicorn-opts "--reload --log-level debug"` — see Backend auto-reload below if you want that. |
| `OSError: [WinError 10022]`, workers crash-loop | Default is 4 workers; uvicorn's multiprocess supervisor can't share a listening socket on Windows | `--workers 1` |
| `UnicodeEncodeError: '\U0001f3c3'` on run completion | MLflow writes a 🏃 emoji to a cp1252 console | `PYTHONIOENCODING=utf-8` — the run still logs, but is left in `RUNNING` status |
| `yarn: command not found` | corepack shims need `C:\Program Files\nodejs`, which needs admin | `corepack enable --install-directory ~/.local/bin` |
| `pgrep: command not found` | `dev/run-dev-server.sh` assumes GNU procps | Harmless; the script's `if` swallows it |

`node --version` may be below the `^24.14.0` in `package.json`. Node 22.16 builds
and runs fine; the engines field is not enforced.

## Backend auto-reload

The frontend hot-reloads on its own. For the backend, do **not** just add
`--reload`: `watchfiles` is not in the lock, so uvicorn falls back to
`StatReload`, which polls the whole repo root — including the 578 MB
`node_modules` — and burns ~90% of a core while idle.

Install `watchfiles` and scope the watched dirs:

```bash
uv run --with watchfiles mlflow server --host 127.0.0.1 --port 5000 --workers 1 \
  --uvicorn-opts "--reload --reload-dir mlflow/server --reload-dir mlflow/store"
```

Log should read `using WatchFiles`, not `using StatReload`. Idle cost is then ~0%,
and editing a file under those dirs logs `WatchFiles detected changes ... Reloading`.

## Verify

Don't stop at "the process started" — drive it:

```bash
curl -s http://127.0.0.1:5000/health                      # -> OK
curl -s -X POST http://127.0.0.1:5000/api/2.0/mlflow/experiments/create \
  -H "Content-Type: application/json" -d '{"name":"smoke-test"}'
```

Then load http://localhost:3000 and confirm the experiment appears under
**Recent Experiments** — that proves the frontend→backend proxy, not just two
live processes.

Full round trip through the Python client:

```bash
PYTHONIOENCODING=utf-8 uv run python -c "
import mlflow
mlflow.set_tracking_uri('http://127.0.0.1:5000')
mlflow.set_experiment('smoke-test')
with mlflow.start_run(run_name='first-run'):
    mlflow.log_param('alpha', 0.5)
    mlflow.log_metric('rmse', 0.42)
"
```

## Notes

- Backend defaults to `sqlite:///mlflow.db` and `mlruns/` in the repo root. Delete
  both to reset state.
- `MLflow job execution requirements not met` on startup is expected — the job
  backend has no Windows support. Only job invocation is affected.
- Port already in use: `Get-NetTCPConnection -LocalPort 5000 -State Listen` to
  find the owner. Stopping the parent uv process can leave uvicorn children alive.
