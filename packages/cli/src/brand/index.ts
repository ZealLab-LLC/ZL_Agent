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

// Keep the background service separate from stock OpenCode installations.
export const SERVICE_NAMESPACE = "zeallab"
