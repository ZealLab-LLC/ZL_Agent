# Network audit

You asked to be told about anything that reaches the internet. This is the full
list for the ZealLab Agent CLI/TUI as of this fork.

Short version: **normal use — starting the agent, picking a model, chatting,
reading and editing files — makes no outbound requests.** Model inference goes
to `http://localhost:11434`. There is one automatic path left that *can* reach
out (LSP server auto-download, §2) and several opt-in ones (§3).

---

## 1. Disabled by default in this fork

These were automatic in upstream opencode and are now off. Set
`ZEALLAB_ALLOW_NETWORK=1` to restore upstream behaviour.

| What | Host | How it was disabled |
| --- | --- | --- |
| Remote model catalog, plus an hourly refresh timer | `models.opencode.ai` | `OPENCODE_DISABLE_MODELS_FETCH=1` in `packages/opencode/src/brand/index.ts`. The catalog is built from local `ollama /api/tags` instead. |
| Auto-update check and install | `opencode.ai/install`, npm registry | `OPENCODE_DISABLE_AUTOUPDATE=1`, same file. |
| Session sharing | `opencode.ai` | Now defaults to disabled instead of "manual allowed" — `Brand.shareDisabled()` in `packages/opencode/src/brand/index.ts`. Opt back in with `"share": "manual"`. |
| Every cloud model provider (Anthropic, OpenAI, Copilot, Bedrock, …) | various | Removed from the catalog at runtime by `packages/core/src/plugin/zeallab-lockdown.ts`. |
| Every cloud sign-in / OAuth flow | various | Same plugin removes them from the integration list, so the UI never offers them. |

## 2. Automatic, and still present — read this one

**LSP server auto-download.** When you open a project in a language whose
language server is not installed locally, opencode downloads it. There are 17
such fetches in `packages/opencode/src/lsp/server.ts`, hitting:

- `github.com` and `api.github.com` (zls, elixir-ls, clangd, vscode-eslint, …)
- `api.releases.hashicorp.com` (terraform-ls)
- `download-cdn.jetbrains.com` (jdtls)
- `www.eclipse.org` (Eclipse JDT)

Some servers are installed through `npm` instead, which hits the npm registry.

This fires without asking, the first time you touch a matching file type. I left
it alone because disabling LSP outright would remove diagnostics and
go-to-definition, which is a product decision rather than a branding one.

To turn it off completely, in `zeallab.json`:

```json
{ "lsp": false }
```

Or disable individual servers:

```json
{ "lsp": { "zls": { "disabled": true } } }
```

If you want this off by default in the fork, say so — it is a two-line change in
the brand bootstrap.

## 3. Opt-in — only if you run them or configure them

| What | Trigger |
| --- | --- |
| `webfetch` tool | The model calls it, which needs the tool enabled and (by default) your permission. `packages/core/src/tool/webfetch.ts` |
| `websearch` tool | Same. `packages/core/src/tool/websearch.ts` |
| `zl agent github …`, `zl agent pr …` | You run the command. Talks to `api.github.com` and `api.opencode.ai`. |
| Remote MCP servers | Only servers you list in config. Local stdio MCP servers stay local. |
| External plugins / skills installed by npm name | Only ones you configure. Installs via `Npm` service → npm registry. |
| OpenTelemetry export | Only if you set `OTEL_EXPORTER_OTLP_ENDPOINT`. Nothing is exported otherwise — there is no built-in analytics or telemetry. |

## 4. Not part of the agent

`packages/app`, `packages/console`, `packages/desktop`, `packages/stats`,
`packages/web`, `packages/slack` are upstream's hosted products. They are
network-dependent by nature, are not built or started by `zl agent`, and are not
rebranded. They can be deleted if you never intend to build them — I left them
so upstream merges stay clean.

## 5. Verifying

To confirm for yourself, run the agent with outbound traffic blocked and check
that everything except §2/§3 still works:

```bash
# allow loopback (ollama), drop the rest, for one command
sudo firejail --net=none --netfilter zl agent
```

Or watch what it actually opens:

```bash
sudo ss -tnp | grep zl-agent
```
