# Network audit

ZealLab Agent starts a local server and discovers models from the Ollama daemon
on loopback. `ZEALLAB_OLLAMA_URL` and `OLLAMA_HOST` can point discovery and
inference at an explicitly chosen daemon.

| Path | Default behavior |
| --- | --- |
| Ollama discovery | `GET /api/tags` lists installed models. `POST /api/show` supplies completion, tool, vision and context metadata for changed tags. Ollama cloud tags are excluded before that request. |
| Model inference | Requests use the same daemon's OpenAI-compatible `/v1` endpoint. |
| models.dev | Startup and refresh skip the catalog, including any previously cached data. The ZealLab release binary embeds an empty snapshot. |
| Upstream provider and web-search integrations | Only Ollama is registered by default. The final provider transform removes other providers and sign-ins added by plugins. Saved provider definitions cannot redirect the Ollama endpoint. |
| Auto-update | Disabled by default. ZealLab releases are distributed through the Debian package. |
| Upstream Console and registered well-known origins | The Console provider is skipped and saved well-known origins are excluded from startup and refresh. |
| Background service | Uses a separate registration and default port from stock OpenCode. Its external tunnel requires `ZEALLAB_ALLOW_NETWORK=1`. |

The ripgrep fallback can download a verified archive from GitHub when a search
requires ripgrep and neither the system nor the local cache has it. This
behavior predates the sync and remains in `packages/core/src/ripgrep/binary.ts`.
The upstream V1 LSP installer and session sharing paths were removed in V2.

Configured remote MCP servers, plugin installs and updates, browser actions,
explicit remote server connections, and tools such as `webfetch` can access
their configured destinations. The release process fetches pinned build
dependencies. The packaged CLI includes the terminal UI and skips the upstream
web UI archive build.

`ZEALLAB_ALLOW_NETWORK=1` restores the upstream network defaults. Separately,
`ZEALLAB_ALLOW_REMOTE_PROVIDERS=1` enables upstream providers and integrations
for debugging. The upstream unit suites use both switches, then the fork's
local-provider smoke test runs with both switches unset.
