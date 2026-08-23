/**
 * ZealLab Agent brand marks.
 *
 * Owned by the ZealLab fork — upstream has no counterpart, so this file never
 * conflicts on a merge from opencode. `src/logo.ts` is a one-line re-export of
 * this module, which keeps the fork's diff against upstream to a single line.
 *
 * The wordmark is drawn in the same half-block font upstream uses, rendered by
 * `src/component/logo.tsx`. Marks carry rendering hints rather than glyphs:
 *   _  space painted with the shadow (tinted) background
 *   ^  ▀ painted with the shadow background
 *   ~  ▀ drawn in the shadow foreground
 *   ,  ▄ drawn in the shadow foreground
 *   =  ━ rule drawn in brand blue
 *
 * `left` renders muted (brand grey #6d6e71), `right` renders bold (brand blue
 * #1b75bc) — matching the ZEAL / LAB split of brand/logo.svg. The trailing >_
 * is the prompt glyph from the logo's right edge.
 */
export const logo = {
  // ZEAL renders muted (brand grey), LAB renders in brand blue -- the split
  // from brand/logo.svg. The second row is the rule: `=` marks are drawn as a
  // brand-blue horizontal stroke spanning the full lockup, so it lives in the
  // left column and the right column is empty for that row.
  //
  //   Z E A L L A B
  //   ━━━━━━━━━━━━━
  left: [
    //
    "Z E A L",
    "=============",
  ],
  right: [
    //
    "L A B",
    "",
  ],
}

/** Compact mark used by the background pulse animation. */
export const go = {
  left: ["    ", "▀▀▀▀", "_▄█_", "▀▀▀▀"],
  right: ["    ", "█___", "█___", "▀▀▀▀"],
}

export const marks = "_^~,="
