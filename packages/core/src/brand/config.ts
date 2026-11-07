/**
 * Config filenames, in merge order (later entries override earlier ones).
 *
 * Upstream's `opencode.json` is still accepted so an existing setup keeps
 * working; `zeallab.json` is listed last so it wins when both are present.
 */
export const CONFIG_FILES = ["opencode.json", "opencode.jsonc", "zeallab.json", "zeallab.jsonc"] as const
