/**
 * ZealLab Agent branding constants for the TUI.
 *
 * Owned by the ZealLab fork — no upstream counterpart, so this file never
 * conflicts on a merge from opencode. Prefer importing from here over
 * hard-coding product strings, so a future rename touches one file.
 */

/** Product name as shown to users. */
export const NAME = "ZealLab Agent"

/** Short name, for tight spots (status bars, titles). */
export const SHORT_NAME = "ZealLab"

/**
 * How a user invokes the agent — via the `zl` command dispatcher shipped by
 * the zl-tools package. There is no standalone binary on $PATH.
 */
export const BINARY = "zl agent"

/** Debian package name / on-disk binary name. */
export const PACKAGE = "zl-agent"

/** Default TUI theme id — see theme/assets/zeallab.json. */
export const THEME = "zeallab"

/** One-line descriptor. */
export const TAGLINE = "Local AI coding agent for ZealLab OS"

/** Brand palette, mirrored from /brand/colors.json at the repo root. */
export const COLORS = {
  /** main_blue */
  primary: "#1b75bc",
  /** second_grey */
  secondary: "#6d6e71",
  /** light_accent */
  accent: "#00aeef",
} as const

export { logo, go, marks } from "./logo"
