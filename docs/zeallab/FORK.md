# Fork maintenance

This repo is a fork of [opencode](https://github.com/anomalyco/opencode). The
branding and the Ollama-only lockdown are deliberately built as **additive
modules** so that merging upstream stays cheap.

```bash
git fetch upstream
git merge upstream/dev
```

## The rule

Fork behaviour lives in new files that upstream does not have. Those can never
conflict. Where upstream code has to change, the edit is reduced to a **single
line that delegates** to a fork-owned module.

## Fork-owned files (no upstream counterpart — never conflict)

| File | Purpose |
| --- | --- |
| `brand/` | Logo, favicon, colour tokens. Source of truth for the palette. |
| `packages/tui/src/brand/index.ts` | TUI brand constants (name, theme id, palette). |
| `packages/tui/src/brand/logo.ts` | ASCII wordmark + `>_` prompt glyph. |
| `packages/tui/src/theme/assets/zeallab.json` | The `zeallab` theme. |
| `packages/opencode/src/brand/index.ts` | CLI brand constants, offline env defaults, share policy. |
| `packages/opencode/src/brand/bootstrap.ts` | Side-effecting import that applies those defaults. |
| `packages/core/src/plugin/provider/ollama.ts` | Builds the model catalog from the local Ollama daemon. |
| `packages/core/src/plugin/zeallab-lockdown.ts` | Drops every non-Ollama provider and every cloud sign-in. |
| `docs/zeallab/` | These docs. |
| `.github/workflows/zl-agent-release.yml` | Builds the Linux binaries and publishes the GitHub Release the Debian package consumes. |
| `script/zeallab-sync-agent-docs.sh` | Copies `CLAUDE.md` to `AGENTS.md` / `GEMINI.md`. |

## Edits to upstream files (keep this list short)

| File | Edit |
| --- | --- |
| `packages/tui/src/logo.ts` | Replaced with a one-line re-export of `./brand/logo`. |
| `packages/tui/src/theme/index.ts` | One import + one registry entry for `zeallab`. |
| `packages/tui/src/context/theme.tsx` | Default theme id now `Brand.THEME`. |
| `packages/tui/src/app.tsx` | Terminal title now `Brand.NAME`. |
| `packages/tui/src/attention.ts` | Notification title + sound-pack name from `Brand`. |
| `packages/tui/src/util/presentation.ts` | Dropped a duplicated copy of the logo; now uses `Brand.logo`. |
| `packages/tui/src/util/error.ts` | Error hints reference `Brand.BINARY` / `zeallab.json`. |
| `packages/core/src/plugin/provider.ts` | One import + one entry for `OllamaPlugin`. |
| `packages/core/src/plugin/internal.ts` | One import + registers `ZealLabLockdownPlugin` **last**. |
| `packages/opencode/src/index.ts` | Brand bootstrap as first import; `scriptName` from `Brand.BINARY`. |
| `packages/opencode/src/cli/ui.ts` | Non-TTY wordmark derived from the brand glyphs instead of a second hardcoded copy. |
| `packages/opencode/src/config/config.ts` | Four hardcoded filename lists replaced with `Brand.CONFIG_*`. |
| `packages/opencode/src/share/session.ts` | Share default routed through `Brand.shareDisabled()`. |
| `package.json`, `packages/opencode/package.json` | Name, description, `bin` → `zeallab`. |
| `.gitignore` | Ignores the generated per-tool instruction files and `zeallab.json`. |

If a merge conflicts in one of these, the resolution is almost always "take
upstream's version, then re-apply the one-line delegation."

## Why the lockdown plugin is registered last

`State.create` in `packages/core/src/state.ts` applies transforms in
registration order. `ZealLabLockdownPlugin` must run after `ModelsDevPlugin`,
after every provider plugin, and after the user's config providers — otherwise
something registered later could re-add a cloud provider. It is therefore the
last `add(...)` call in `plugin/internal.ts`. **Keep it last** when resolving a
merge conflict in that file.

## Deliberately NOT renamed

The rebrand is user-facing only. Internals keep upstream's names so that merges
stay clean:

- npm package names (`@opencode-ai/*`)
- `OPENCODE_*` environment variables (fork-specific ones use `ZEALLAB_*`)
- the `packages/opencode/` directory
- config directory `~/.config/opencode`
- upstream's own engineering READMEs under `packages/*/src/**`

Renaming any of these would put a conflict in nearly every upstream pull. If you
later decide the tradeoff is worth it, do it as one dedicated commit so it can be
reverted cleanly.

## AI assistant instructions

`CLAUDE.md`, `AGENTS.md` and `GEMINI.md` live at the repo root and are **not in
git** — they are local working notes, and this is a public repository. Edit
`CLAUDE.md` and run `./script/zeallab-sync-agent-docs.sh` to copy it to the
other two.

Because they are gitignored, a fresh clone has none of them; recreate
`CLAUDE.md` (or copy it from another checkout) and re-run the script. Keeping
our `AGENTS.md` out of git also means upstream's own root `AGENTS.md` can never
conflict with ours.

Upstream's per-package `AGENTS.md` files under `packages/**` are genuine
engineering docs and remain tracked — the ignore rules are anchored to the repo
root so they are untouched.

## Distribution

The agent is delivered as the `zl-agent` Debian package from
[ZealLab-LLC/Packages](https://github.com/ZealLab-LLC/Packages), and is invoked
as `zl agent` through that repo's `zl` dispatcher. No binary is placed on
`$PATH`.

The two repos are coupled only by a release artifact:

```
ZL_Agent  --tag v1.0.0-->  GitHub Release
                             zl-agent-linux-{x64,arm64}.tar.gz
                             checksums.txt
                                    |
                                    v
Packages  fetch-agent.sh  ->  packages/zl-agent/  ->  zl-agent_1.0.0-1_amd64.deb
```

`Brand.BINARY` is therefore `"zl agent"`, not a single word — it is used for
yargs' `scriptName` and in user-facing hints, both of which want the full
invocation a user would type.

Upstream's own workflows under `.github/workflows/` target opencode's release
infrastructure and secrets. They are inert here but were left in place so
merges stay clean; disable them in the repo settings if the failure noise is
annoying.

## Known limitations

- **Reasoning blocks from thinking models are not surfaced separately.** Ollama
  returns thinking text in a `reasoning` field. The v2 catalog schema
  (`packages/schema/src/model.ts`) has no `interleaved` capability, so there is
  nowhere to declare which field carries it. Answers are unaffected — only the
  separate "thinking" display is missing.
- **Model cost is reported as zero**, which is correct for local inference but
  means the token-spend UI always shows $0.00.
