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
| `.github/workflows/*.yml` (22 files) | One `if: github.repository == 'anomalyco/opencode'` line per job. See [Continuous integration](#continuous-integration). |
| `.github/workflows/typecheck.yml`, `test.yml` | Runners retargeted to `ubuntu-latest`; test matrix trimmed to Linux. |
| `.github/CODEOWNERS` | Emptied — upstream's owners are not in this org, which made GitHub reject the file. |

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
infrastructure and secrets. They are **not** inert by default — see
[Continuous integration](#continuous-integration) for how they are held off.

## Continuous integration

The fork inherited 26 workflows from upstream. Most cannot work here, and a few
were actively harmful, so each job carries an explicit repository guard.

**Why they were not simply left alone.** Two things break them:

- **Runners.** 20 of the 26 workflows request Blacksmith runners
  (`blacksmith-4vcpu-ubuntu-2404` and friends). ZealLab has no Blacksmith
  account, so no runner ever claims those jobs — they sit `queued` until the
  24h timeout. A single push to `dev` used to strand seven runs this way.
- **Secrets.** This repo has no Actions secrets or variables configured, so
  anything keyed on `OPENCODE_API_KEY`, `OPENCODE_APP_ID`, `DISCORD_WEBHOOK`,
  `AWS_DEPLOY_ROLE_ARN`, `VSCE_PAT` or `POSTHOG_KEY` fails or no-ops.

Worse, several *did* run: the issue/PR automation (`triage`, `duplicate-issues`,
`pr-management`, `pr-standards`, `close-issues`, `close-prs`,
`compliance-close`) is on `ubuntu-latest` and closes issues and PRs and posts
bot comments, judged against `.github/TEAM_MEMBERS` — which lists 22 upstream
opencode maintainers and nobody from this org. `generate.yml` auto-commits to
`dev`, and `containers.yml` pushes images to `ghcr.io/ZealLab-LLC`.

**The guard.** Every upstream job now starts with:

```yaml
    if: github.repository == 'anomalyco/opencode'
```

This is upstream's own idiom — `deploy.yml`, `publish.yml`, `stats.yml` and
`docs-update.yml` already shipped with it. It is one line per job, so merges
stay cheap, and it is self-cancelling: if upstream ever adds its own guard, the
conflict resolves to the same text. Re-enabling a workflow here is a one-line
deletion.

Two subtleties worth preserving if you resolve a conflict in these files:

- `opencode.yml`'s condition is a chain of `||`. Because `&&` binds tighter, the
  guard must wrap that chain in parentheses or it only covers the first clause.
- `publish.yml`'s final `publish` job is `if: always() && !failure() &&
  !cancelled()`. Skipped needs satisfy all three, so without its own guard it
  runs even when every job it depends on was skipped.

### What actually runs on this fork

| Workflow | Trigger | Notes |
| --- | --- | --- |
| `typecheck.yml` | push/PR to `dev` | Retargeted to `ubuntu-latest`. |
| `test.yml` | push to `dev`, all PRs | Retargeted to `ubuntu-latest`. Windows leg and the Playwright `e2e` job removed — this fork ships Linux only. |
| `zl-agent-release.yml` | tag `v*`, manual | Fork-owned. Builds and publishes the release. |

Everything else is guarded off **and disabled**, which are two separate
mechanisms doing two different jobs:

- The in-repo `if:` guard is documentation and a second layer. It survives a
  clone and a merge.
- `gh workflow disable` stops GitHub creating a run at all. This is the part
  that actually silences them, because of the allowlist behaviour below.

To confirm nothing has drifted:

```bash
gh workflow list -R ZealLab-LLC/ZL_Agent --all   # only 3 should be 'active'
gh run list      -R ZealLab-LLC/ZL_Agent --limit 30
```

## The Actions allowlist

This repo sets an allowlist under Settings → Actions → General. It was briefly
set to **"Allow ZealLab-LLC actions only"** (`allowed_actions: "local_only"`),
which does not work: `actions/checkout` is owned by GitHub, not by ZealLab-LLC,
so every workflow — including `zl-agent-release.yml` — died with
`startup_failure` at 0s.

Two things are worth knowing before touching this setting again:

- **The allowlist is enforced at run creation, before job-level `if:` is
  evaluated.** A guarded job does not exempt its workflow. This is why the
  guards alone were not enough and the workflows are also disabled.
- Honouring it costs nothing here, because every external action in this repo
  is already pinned to a 40-character SHA, so `sha_pinning_required` is on.

The current policy is the minimum the three active workflows need:

```jsonc
// repos/ZealLab-LLC/ZL_Agent/actions/permissions
{ "allowed_actions": "selected", "sha_pinning_required": true }

// .../actions/permissions/selected-actions
{
  "github_owned_allowed": true,   // actions/checkout, setup-node, cache, {up,down}load-artifact
  "verified_allowed": false,
  "patterns_allowed": ["oven-sh/setup-bun@*", "softprops/action-gh-release@*"]
}
```

Deliberately **not** allowlisted: `docker/*`, `azure/*`, `aws-actions/*`,
`apple-actions/*`, `nixbuild/*`, `SethCohen/*`, `anomalyco|sst/opencode/github`.
Those appear only in disabled workflows. Re-enabling one of those workflows
means extending the allowlist too — which is a good forcing function, since it
makes the added trust explicit.

## Known test failures on `dev`

`test` is green except `opencode#test` (8 of 9 turbo tasks pass). Five tests
fail, and all five are the rebrand's blast radius — upstream's tests hardcode
upstream's names:

| Test | Expects | Fork provides |
| --- | --- | --- |
| `createTuiAttention` (3 tests) | `title: "opencode"`, `sound_pack: "opencode.default"` | `Brand.NAME`, `${Brand.SHORT_NAME} Default` (`packages/tui/src/attention.ts`) |
| `opencode CLI help-text snapshots` | upstream `scriptName` | `Brand.BINARY` = `zl agent` (`packages/opencode/src/index.ts`) |
| `creates global jsonc config with schema...` | upstream config filenames | `Brand.CONFIG_*` (`packages/opencode/src/config/config.ts`) |

These are not CI faults — they predate the CI work and were simply never
observed, because no workflow had ever successfully run on this fork. Fixing
them means teaching those tests to read from `Brand` rather than asserting the
literal string `opencode`, which keeps them meaningful after a merge. Until
then `test` is red on `dev`.

### Release version stamping

`packages/script` derives the version from `git branch --show-current`, which is
**empty on a tag checkout** (detached HEAD). Unset, that makes `IS_PREVIEW` true
and stamps the binary `0.0.0--<timestamp>` — note the double hyphen — so a
`v1.0.0` tag would ship a binary whose `--version` disagrees with its own
release. `zl-agent-release.yml` therefore derives the version from the tag and
passes `OPENCODE_VERSION` and `OPENCODE_CHANNEL=latest` into the build, and the
smoke test asserts `zl-agent --version` matches exactly.

Note that setting `OPENCODE_VERSION` also short-circuits the npm registry
lookup that `packages/script` would otherwise perform, which keeps the release
build from depending on `registry.npmjs.org` being reachable.

## Known limitations

- **Reasoning blocks from thinking models are not surfaced separately.** Ollama
  returns thinking text in a `reasoning` field. The v2 catalog schema
  (`packages/schema/src/model.ts`) has no `interleaved` capability, so there is
  nowhere to declare which field carries it. Answers are unaffected — only the
  separate "thinking" display is missing.
- **Model cost is reported as zero**, which is correct for local inference but
  means the token-spend UI always shows $0.00.
