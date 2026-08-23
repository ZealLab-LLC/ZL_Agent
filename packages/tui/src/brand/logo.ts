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
 *
 * `left` renders muted (brand grey #6d6e71), `right` renders bold (brand blue
 * #1b75bc) — matching the ZEAL / LAB split of brand/logo.svg. The trailing >_
 * is the prompt glyph from the logo's right edge.
 */
export const logo = {
  // Z E A L
  left: [
    //
    "▀▀▀▀ █▀▀▀ ▄▀▀▄ █___",
    "_▄█_ █▀▀_ █▀▀█ █___",
    "▀▀▀▀ ▀▀▀▀ ▀__▀ ▀▀▀▀",
  ],
  // L A B > _
  right: [
    //
    "█___ ▄▀▀▄ █▀▀▄ █▄__ ____",
    "█___ █▀▀█ █▀▀█ _▀█_ ____",
    "▀▀▀▀ ▀__▀ ▀▀▀▀ ▀▀__ ▀▀▀▀",
  ],
}

/** Compact mark used by the background pulse animation. */
export const go = {
  left: ["    ", "▀▀▀▀", "_▄█_", "▀▀▀▀"],
  right: ["    ", "█___", "█___", "▀▀▀▀"],
}

export const marks = "_^~,"
