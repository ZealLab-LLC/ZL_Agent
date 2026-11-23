<p align="center">
  <img src="brand/logo.svg" alt="ZealLab" width="420">
</p>

<p align="center"><strong>ZealLab Agent</strong> — the local AI coding agent for ZealLab OS.</p>

---

ZealLab Agent is a terminal coding agent that talks to **Ollama running on your
own machine**. There is no cloud account, no API key, and no model catalog to
download. You pick a model from whatever you have pulled locally, and that is
the only thing the agent ever talks to.

It is a fork of [opencode](https://github.com/anomalyco/opencode), rebranded and
locked down to local inference.

## Requirements

- **Ollama**, already installed and running. ZealLab Agent does not install or
  manage it.
- At least one pulled model. A model with tool support is strongly recommended —
  without it the agent cannot read or edit files.
- **Bun** 1.4.4 (only to build from source).

Check your setup:

```bash
ollama list          # models you can choose from
curl localhost:11434/api/version
```

## Install

ZealLab Agent ships as the `zl-agent` Debian package from the
[ZealLab package repository](https://github.com/ZealLab-LLC/Packages). It plugs
into the `zl` command dispatcher, so there is no standalone binary on `$PATH`.

```bash
curl -fsSL https://zeallab-llc.github.io/Packages/setup.sh | sudo sh
sudo apt-get install -y zl-agent
```

### From source

```bash
bun install
bun run agent            # equivalent to `zl agent`
```

## Usage

```bash
zl agent                 # start the TUI in the current project
zl agent run "..."       # one-shot, non-interactive
zl agent models          # list the local models it can see
zl --help                # every zl subcommand, including this one
```

On first start the agent reads your local model list. If you have multiple models,
the TUI opens the model picker. Use `/models` to switch models later.

## Configuration

`zeallab.json` in your project root, or `~/.config/opencode/zeallab.json`:

```json
{
  "model": "ollama/qwen2.5-coder:14b"
}
```

### Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `ZEALLAB_OLLAMA_URL` | `http://localhost:11434` | Where the Ollama daemon lives. `OLLAMA_HOST` is honoured as a fallback. |
| `ZEALLAB_ALLOW_REMOTE_PROVIDERS` | unset | Set to `1` to re-enable upstream's cloud providers. Debugging only. |
| `ZEALLAB_ALLOW_NETWORK` | unset | Set to `1` to skip the offline defaults (remote model catalog, auto-update). Debugging only. |

## What "local only" means

Startup and model inference use the local Ollama daemon by default.

- The remote model catalog (`models.opencode.ai`) is disabled — the catalog is
  built from your local Ollama daemon using `/api/tags` and `/api/show`.
- Auto-update is disabled.
- Every non-Ollama provider is removed from the catalog at runtime, and every
  cloud sign-in is removed from the integration list.

Configured MCP servers and explicitly invoked network tools such as `webfetch`
can reach the internet. File search can download ripgrep if it needs the
fallback and the system has no `rg` binary. See the
[network audit](docs/zeallab/NETWORK.md) for details.

## Branding

Brand assets live in [`brand/`](brand/) and are the single source of truth:

| Token | Hex |
| --- | --- |
| `main_blue` | `#1b75bc` |
| `second_grey` | `#6d6e71` |
| `light_accent` | `#00aeef` |

The TUI ships a matching `zeallab` theme, set as the default.

## Releasing

Successful checks on the current `dev` tip automatically publish the next patch
release after both tests and typechecking pass. The release contains Linux x64 and arm64
binaries and checksums. Explicit version tags and manual release runs remain
available:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

The [Packages](https://github.com/ZealLab-LLC/Packages) repo already sets
`packages/zl-agent/AGENT_VERSION` to `latest`. Its next build fetches the newest
published release, verifies the checksum, and stamps the Debian changelog with
the matching version. After publication, Agent dispatches the Packages workflow
with that exact version to update the signed APT index. Configure the
`PACKAGES_DISPATCH_TOKEN` Actions secret in this repository with a fine-grained
GitHub token limited to Packages with Actions read/write permission.
If Packages is switched to a version pin, update its
`AGENT_VERSION` and Debian changelog together.

## Fork maintenance

This repo tracks upstream opencode on the `upstream` remote. Fork-owned code is
deliberately isolated so upstream merges stay clean — see
[docs/zeallab/FORK.md](docs/zeallab/FORK.md).

```bash
git fetch upstream
git merge upstream/dev
```

## License

MIT — see [LICENSE](LICENSE). Upstream opencode is also MIT.
