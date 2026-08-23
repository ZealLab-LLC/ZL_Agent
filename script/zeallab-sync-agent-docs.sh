#!/usr/bin/env bash
# Propagates the AI assistant instructions from CLAUDE.md to the other tools'
# expected filenames (AGENTS.md for Codex, GEMINI.md for Gemini CLI).
#
# All three files are gitignored on purpose: they are local working notes and
# this is a public repository. That also keeps upstream opencode's own
# AGENTS.md from ever conflicting with ours.
#
# Because they are not in git, a fresh clone has none of them. Recreate
# CLAUDE.md by hand (or copy it from another checkout), then run this script.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$root/CLAUDE.md"

if [ ! -f "$src" ]; then
    cat >&2 <<'MSG'
Error: CLAUDE.md not found.

It is gitignored, so a fresh clone will not have it. Create it (it is the
source of truth for AI assistant instructions), then re-run this script.
MSG
    exit 1
fi

for target in AGENTS.md GEMINI.md; do
    cp "$src" "$root/$target"
    echo "wrote $target"
done
