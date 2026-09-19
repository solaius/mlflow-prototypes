# Skills Registry — UX demo runbook

Prototype: MLflow skills registry (frontend-only, RFC-0008).
Branch: `skills-registry-rfc`. UI changes: `.design/changes/2026-09-07-dwarner-skills-demo-prep.md`.

---

## The friction, in one sentence

> Agent skills spread by copy-paste, so nobody can say which version an agent is actually
> running, where it came from, or whether it's still the one they should be using.

Alternates, if the room leans a particular way:

- **Platform / governance audience** — Every team is writing agent skills and none of them
  are inventoried, so the capabilities your agents have are invisible to the people
  accountable for them.
- **Practitioner audience** — Finding a skill someone else already wrote means asking
  around in Slack, and using it means copying a folder you can't tell is current.

Lead with the first. It is the only framing where all three demo steps are answers to it.

## The three steps

| Step | What it does | Screen |
| --- | --- | --- |
| **Register** | Makes the copy addressable | Create skill modal |
| **Inspect** | Tells you where it came from and whether it changed | Catalogue → version pane |
| **Use** | Pulls a named version instead of a copy | Use button → `skills-pull.sh` |

Governance is not a fourth step. It is what makes Inspect possible, so demo it inside that
beat — an alias moved, a version deprecated, a delete blocked because the version is still
active.

---

## Before you start

- [ ] Dev server up at **http://localhost:3000** → **Skills** in the left nav.
- [ ] **Rename the demo folder**: `~/Downloads/arena-research-skill-main` →
      `~/Downloads/arena-research-skill`. The form infers the skill name from the folder
      name, which is why the earlier screenshot read `arena-research-skill-main`.
- [ ] Terminal open in a **scratch directory**, not the repo — Act 3 creates
      `.claude/skills/` in it.
- [ ] Claude Code ready to launch in that same scratch directory.

> **Do not refresh the browser mid-demo.** The store is in-memory. A refresh wipes anything
> you registered and resets to the seeded catalogue.

---

## Act 1 — Register (~2 min)

**Create skill** → **Upload a folder** → pick `arena-research-skill`.

Watch for the hint under the picker:

```
Read 13 files from arena-research-skill.
```

That count is the thing to say out loud — it is the proof the browser read the tree rather
than just noting the folder's name.

Submit. On the version page:

- the **Files** tab shows the real tree,
- `SKILL.md` opens in the modal,
- **Content digest** is a genuine SHA-256 over those bytes.

**The line that lands:**

> "That digest is a hash of the content, not of the record. Upload the same folder again and
> you get the same digest — which is how the registry can tell you two versions are
> identical."

---

## Act 2 — Inspect (~3 min)

Switch to a skill with history: **@ocp-admin/cluster-report**, **version 2**.

Name the subject change rather than glossing it — a skill you just created has one version
and nothing to compare. This one has two versions, tags, aliases, a git source and a ref.

The beat that matters is the **Files** tab, which reports no listing and links out instead.
It reads as a gap; it is actually the argument.

**The line that lands:**

> "The registry never fetched this. It records where the content lives and at which ref, and
> it won't render third-party content it never vetted. What it gives you is coordinates."

That sets up Act 3. Don't skip past it.

---

## Act 3 — Use (~3 min)

Read the coordinates off the **Source** row — clone URL, `Ref: main`,
`Path: ocp-admin/skills/cluster-report` — then run:

```bash
<repo>/.design/demo-scripts/skills-pull.sh \
  --source https://github.com/RHEcosystemAppEng/agentic-plugins \
  --ref main \
  --path ocp-admin/skills/cluster-report \
  --destination .claude/skills/cluster-report
```

Expected output:

```
Pulling from https://github.com/RHEcosystemAppEng/agentic-plugins @ main :: ocp-admin/skills/cluster-report

Pulled into .claude/skills/cluster-report:
  catalog-info.yaml
  docs/multi-cluster-auth.md
  SKILL.md
```

Open Claude Code in that directory and ask for something the skill declares itself for:

> "give me a health report across my clusters"

It picks the skill up from `.claude/skills/` with no further setup.

**Close on:**

> "The registry didn't hold the content. It held enough to go get it, and the agent gained a
> capability it didn't have thirty seconds ago."

---

## Three traps

1. **Do not run the command the Use button gives you.**
   `mlflow skills pull` does not exist — there is no `mlflow/skills` package in the repo.
   Show the modal as "this is the interface RFC-0008 proposes", then run
   `skills-pull.sh` instead. If asked, that gap is the honest state of a frontend
   prototype and saying so costs nothing.

2. **Do not demo cluster-report v1's pinned SHA.**
   The seeded commit SHAs are fabricated; `4c52ccb…` fails with `not our ref`. Use
   **version 2** (`ref: main`). For a pinned-commit moment,
   `8a0b1d5af849655e090feee0709ae3b0d5dfbc11` is the real head and it pulls.

3. **An uploaded skill cannot be pulled.**
   It lives in MLflow artifact storage and this prototype has no server for it, so
   `skills-pull.sh` handles git pointers only. That is why Act 1 and Act 3 use different
   skills.

---

## Likely questions

**"Why does one skill have a content digest and another doesn't?"**
A digest attests to content a client actually read. A CLI with the repo checked out can hash
the tree and register a pointer plus a digest; a browser recording a URL has nothing to
hash, and RFC-0008 makes the field nullable for exactly that case. Seeded skills model the
CLI path; a pointer registered through this form models the browser path.

**"Is this real data?"**
The catalogue is seeded from Red Hat's agentic collections — real skills, real file trees,
real repositories. There is no backend: everything lives in the browser for the life of the
tab.

**"Can I edit a skill here?"**
Description, icons, tags, aliases and status, yes. Name, organization and any version's
source, no — those are immutable in RFC-0008, and version numbers are never reused after a
delete.
