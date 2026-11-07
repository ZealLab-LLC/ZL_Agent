# Fork maintenance

ZealLab Agent tracks [OpenCode](https://github.com/anomalyco/opencode) on
`upstream/dev`. Keep fork logic in `brand/`, a package's `src/brand/`, or
the dedicated ZealLab policy and release files. Use small delegations in
upstream code.

```bash
git fetch upstream
git merge --no-commit upstream/dev
```

## Current upstream layout

Upstream V2 replaced `packages/opencode` with `packages/cli`, `packages/core`
and `packages/server`. Keep upstream's package names and `OPENCODE_*`
environment variables. ZealLab settings use `ZEALLAB_*`.

Upstream now provides Ollama discovery. The fork keeps endpoint normalization
and local-only rules around that provider. Both V1 config names
(`opencode.json` and `opencode.jsonc`) and the ZealLab equivalents are accepted.
The ZealLab files take precedence. The V2 background server uses separate
registration from stock OpenCode while retaining the existing config and data
roots. Session sharing was removed upstream.

## Fork-owned code

| Path | Purpose |
| --- | --- |
| `brand/`, `packages/tui/src/brand/`, `packages/tui/src/theme/assets/zeallab.json` | Brand assets, wordmark, palette and TUI theme. |
| `packages/cli/src/brand/`, `packages/core/src/brand/` | Invocation name, config filenames and Ollama endpoint handling. |
| `packages/core/src/zeallab-offline.ts`, `packages/core/src/plugin/zeallab-lockdown.ts` | Network defaults and final local-provider enforcement. |
| `.github/workflows/zl-agent-release.yml` | Linux builds and GitHub Release artifacts for the Debian package. |
| `packages/cli/test/zeallab-local.test.ts` | Starts the CLI with a loopback Ollama fixture and verifies that cloud models and endpoints are skipped. |
| `script/zeallab-sync-agent-docs.sh` | Copies local `CLAUDE.md` to `AGENTS.md` and `GEMINI.md`. |

## Edits to upstream files

| Path | Fork change |
| --- | --- |
| `packages/core/src/plugin/internal.ts`, `plugin/supervisor.ts` | Select Ollama-only built-ins and keep the guarded lockdown at the end of the post phase. |
| `packages/core/src/plugin/provider/{ollama,local}.ts` | Normalize the endpoint, wait briefly for the first discovery, and skip cloud tags and endpoint overrides. |
| `packages/core/src/config.ts`, `config/{discovery,plugin/provider}.ts` | Discover ZealLab config names and ignore custom provider definitions under the local-only policy. Model selection still reads user config. |
| `packages/core/src/{models-dev,wellknown}.ts` | Skip persisted and remote catalogs and saved remote origins in offline mode. |
| `packages/cli/src/{index,server-process}.ts`, `commands/commands.ts`, `services/{service-config,updater}.ts` | Apply local defaults, use the brand name and invocation, isolate the background service, and gate upstream updating and the remote tunnel. |
| `packages/cli/script/build.ts` | Embed the ZealLab invocation and build the release with an empty model snapshot. |
| `packages/tui/src/{app,attention,logo}`, `context/{local,theme}.tsx`, `theme/index.ts` | First-run picker, theme and brand defaults, and `/models` in place of `/connect`. |
| `packages/tui/src/component/{logo,todo-item}.tsx`, `component/prompt/{index,metadata}.tsx`, `routes/home.tsx`, `routes/session/permission.tsx`, `feature-plugins/sidebar/footer.tsx`, `util/{error,presentation}.ts`, `mini/{runtime.lifecycle,splash,theme}.ts` | Brand palette, onboarding, invocation hints and terminal output. |
| `packages/cli/test/` help and connection assertions, `packages/tui/test/` branding assertions | Assert the invocation, theme, titles and wordmark via `Brand`. |
| `packages/core/test/config/config.test.ts` | Use the fork’s config filename list for watcher assertions. |
| `package.json`, `bun.lock`, `README.md`, `.gitignore` | Fork identity, source entry point, and local instruction files. |
| `.github/workflows/`, `.github/CODEOWNERS` | Keep only fork CI and release workflows and preserve the fork's empty ownership file. |

Register `ZealLabLockdownPlugin` **last** in the `post` phase of
`packages/core/src/plugin/internal.ts`. The supervisor runs pre plugins, then
external plugins, then post plugins. Provider, model and integration transforms
follow this order. Keep the lockdown's ID guarded so plugin removal or an
external plugin with the same ID cannot replace it.

## Linux verification and distribution

Use the Bun version pinned by `packageManager` in the root manifest.
Use Node 24 and install `rg` before running the unit suites. The search tests
block network access, so they need a local ripgrep binary on `PATH`.

```bash
bun install --frozen-lockfile
bun run typecheck
ZEALLAB_ALLOW_REMOTE_PROVIDERS=1 ZEALLAB_ALLOW_NETWORK=1 node node_modules/turbo/bin/turbo test --concurrency=3 --env-mode=loose
bun test --cwd packages/cli test/zeallab-local.test.ts
```

The fork keeps three workflows. `typecheck.yml` and `test.yml` use GitHub-hosted
Linux runners, and `zl-agent-release.yml` builds the Debian package artifacts.
The test workflow downloads and verifies ripgrep from GitHub Releases before
running the suites through Turbo's Node entry point.
During upstream merges, remove workflows for upstream CI, bots, deployments,
and releases that reappear under `.github/workflows/`. Keep the shared
`setup-bun` action used by all three fork workflows.

The release workflow builds the V2 CLI for Linux x64 and arm64. It packages each
binary as `zl-agent` and publishes the same `zl-agent-linux-{x64,arm64}.tar.gz`
and `checksums.txt` artifacts consumed by
[ZealLab-LLC/Packages](https://github.com/ZealLab-LLC/Packages). Tagging this
repo triggers a release. Bump `AGENT_VERSION` and the Debian changelog in the
Packages repo after the artifacts are available. Invoke the installed agent via
`zl agent`.

Root `CLAUDE.md`, `AGENTS.md`, and `GEMINI.md` are local working notes and
stay out of Git. Upstream's per-package `AGENTS.md` files stay tracked.
