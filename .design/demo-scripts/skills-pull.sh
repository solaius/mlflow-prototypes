#!/usr/bin/env bash
#
# Stand-in for `mlflow skills pull`, for the skills registry demo.
#
# The registry UI offers `mlflow skills pull skills:/@org/name/N` as the consume step, but
# that CLI does not exist yet -- RFC-0008 proposes it and the prototype is frontend-only,
# with no API to resolve a `skills:/` URI against. This script does the part that IS
# specified: take the coordinates the registry shows on a version (source, ref, path) and
# fetch exactly that directory into a destination.
#
# Git pointers only. An uploaded skill lives in MLflow artifact storage, which this
# prototype has no server for.
#
# Usage:
#   ./skills-pull.sh --source <clone-url> [--ref <branch|tag|sha>] [--path <subpath>] \
#                       [--destination <dir>]
#
# Demo example -- @ocp-admin/cluster-report version 2, straight into Claude Code's skills
# directory, after which the agent can use it with no further setup:
#
#   ./skills-pull.sh \
#     --source https://github.com/RHEcosystemAppEng/agentic-plugins \
#     --ref main \
#     --path ocp-admin/skills/cluster-report \
#     --destination .claude/skills/cluster-report
#
set -euo pipefail

SOURCE=""
REF=""
SUBPATH=""
DESTINATION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) SOURCE="$2"; shift 2 ;;
    --ref) REF="$2"; shift 2 ;;
    --path) SUBPATH="$2"; shift 2 ;;
    --destination) DESTINATION="$2"; shift 2 ;;
    -h|--help) sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$SOURCE" ]]; then
  echo "error: --source is required (the clone URL shown in the version's Source row)" >&2
  exit 2
fi

# Default the destination from the skill directory's own name, which is what the registry
# uses as the skill name for a monorepo-hosted skill.
if [[ -z "$DESTINATION" ]]; then
  leaf="${SUBPATH##*/}"
  [[ -n "$leaf" ]] || leaf="$(basename "${SOURCE%.git}")"
  DESTINATION="./skills/$leaf"
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Pulling from $SOURCE${REF:+ @ $REF}${SUBPATH:+ :: $SUBPATH}"

# A blobless sparse clone so a skill inside a large monorepo costs the skill, not the
# monorepo. This is the same shape a real pull would want.
CLONE_ARGS=(--depth 1 --filter=blob:none --sparse --quiet)

# `--branch` accepts a branch or tag but not a commit SHA, so a pinned version takes the
# fetch-then-checkout path instead. Registry versions use both: aliases and demo versions
# point at `main`, while pinned ones carry a full SHA.
if [[ -n "$REF" && "$REF" =~ ^[0-9a-f]{7,40}$ ]]; then
  git clone "${CLONE_ARGS[@]}" "$SOURCE" "$TMP/repo"
  git -C "$TMP/repo" fetch --depth 1 --quiet origin "$REF"
  git -C "$TMP/repo" checkout --quiet FETCH_HEAD
elif [[ -n "$REF" ]]; then
  git clone "${CLONE_ARGS[@]}" --branch "$REF" "$SOURCE" "$TMP/repo"
else
  git clone "${CLONE_ARGS[@]}" "$SOURCE" "$TMP/repo"
fi

if [[ -n "$SUBPATH" ]]; then
  git -C "$TMP/repo" sparse-checkout set --no-cone "$SUBPATH" >/dev/null
  CONTENT="$TMP/repo/$SUBPATH"
else
  git -C "$TMP/repo" sparse-checkout disable >/dev/null
  CONTENT="$TMP/repo"
fi

if [[ ! -d "$CONTENT" ]]; then
  echo "error: no directory at '$SUBPATH' in $SOURCE${REF:+ @ $REF}" >&2
  exit 1
fi

if [[ ! -f "$CONTENT/SKILL.md" ]]; then
  echo "warning: no SKILL.md at the root of the pulled directory -- clients resolve a skill through that file" >&2
fi

mkdir -p "$DESTINATION"
# `/.` copies the directory's CONTENTS, so the skill root is the destination rather than a
# nested folder the agent would not look inside.
cp -R "$CONTENT/." "$DESTINATION/"
rm -rf "$DESTINATION/.git"

echo
echo "Pulled into $DESTINATION:"
(cd "$DESTINATION" && find . -type f -not -path './.git/*' | sed 's|^\./|  |' | sort)
