/**
 * ZealLab Agent branding + local-only bootstrap for the CLI.
 *
 * Owned by the ZealLab fork — no upstream counterpart, so this file never
 * conflicts on a merge from opencode.
 *
 * IMPORTANT: this module must stay free of imports from @opencode-ai/core.
 * `bootstrap()` sets environment defaults that core's Flag module reads at
 * module-evaluation time, so it has to run before core is ever loaded. It is
 * imported as the first import of src/index.ts for exactly that reason.
 */

/** Product name as shown to users. */
export const NAME = "ZealLab Agent"

/** Short name, for tight spots. */
export const SHORT_NAME = "ZealLab"

/**
 * How a user invokes the agent. It ships inside the `zl-agent` Debian package
 * and is reached through the `zl` command dispatcher, so the invocation is
 * `zl agent` — there is no standalone binary on $PATH.
 */
export const BINARY = "zl agent"

/** Debian package name / on-disk binary name. */
export const PACKAGE = "zl-agent"

/** One-line descriptor. */
export const TAGLINE = "Local AI coding agent for ZealLab OS"

/**
 * Environment defaults that keep the agent local-only.
 *
 * Each is only applied when the variable is unset, so an operator can still
 * override any of them explicitly.
 */
const OFFLINE_DEFAULTS: Record<string, string> = {
  // No remote model catalog — plugin/provider/ollama.ts builds the catalog from
  // the local Ollama daemon instead. Also stops the hourly refresh timer.
  OPENCODE_DISABLE_MODELS_FETCH: "1",
  // Never phone home to check for or install a new release.
  OPENCODE_DISABLE_AUTOUPDATE: "1",
}

export function bootstrap() {
  if (process.env["ZEALLAB_ALLOW_NETWORK"] === "1") return
  for (const [key, value] of Object.entries(OFFLINE_DEFAULTS)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
}

/**
 * Session sharing uploads the transcript to a remote service, so ZealLab Agent
 * treats "unset" as disabled — the opposite of upstream, where unset means
 * "manual sharing allowed". An operator can still opt in by setting
 * `"share": "manual"` or `"auto"` in config.
 */
export function shareDisabled(share: string | undefined) {
  if (process.env["ZEALLAB_ALLOW_NETWORK"] === "1") return share === "disabled"
  return share !== "manual" && share !== "auto"
}

/**
 * Config filenames, in merge order (later entries override earlier ones).
 *
 * Upstream's `opencode.json` is still accepted so an existing setup keeps
 * working; `zeallab.json` is listed last so it wins when both are present.
 */
export const CONFIG_FILES = ["opencode.json", "opencode.jsonc", "zeallab.json", "zeallab.jsonc"] as const

/** Same list, most-preferred first — for picking a file to write to. */
export const CONFIG_FILES_PREFERRED = ["zeallab.jsonc", "zeallab.json", "opencode.jsonc", "opencode.json"] as const

/**
 * Project-config basenames, in merge order (later overrides earlier), resolved
 * as `<name>.json` / `<name>.jsonc` walking up from the working directory.
 */
export const CONFIG_BASENAMES = ["opencode", "zeallab"] as const
