/**
 * Where Ask sits, from the canvas (https://claude.ai/artifact/XTHszGBU78LNmon3uJjMNk):
 * Placement, rows "Planet: composer" and "Ask panel"; Motion and states, rows
 * "Panel (Ask, desktop)" and "Sheet (phone)".
 */

/** How Ask was opened, which decides its height on a phone (#49, 2026-09-28 review). */
export type AskEntry =
  /** Typing in the docked composer on the planet: the planet stays behind it. */
  | 'planet'
  /** `/ask` or `/ask/:id` opened directly (a deep link, a notification). */
  | 'direct'
  /**
   * Beside the practice stage (#50): a panel next to the exercise on a wide
   * screen; on a narrower one the composer under the stage, which raises the
   * same 72% sheet the planet does.
   */
  | 'stage'

export const ASK_PANEL = {
  /** Placement: "right, 420 wide, over the sky". */
  width: 420,
  headerHeight: 56,
  /** Motion: slides 40 px from the right and fades. */
  slideFrom: 40,
} as const

export const ASK_SHEET = {
  /** Placement: "sheet, 72% high" -- from the planet (#12 point 6), and from the stage. */
  planetHeight: '72%',
  /** Opened directly: a full-screen sheet (#13 point 1). */
  directHeight: '100%',
  grabber: { width: 36, height: 5 },
  radius: 20,
  /** Motion: "From the bottom; dim 25%". */
  dim: 0.25,
  /** Dragged further than this share of its height, the sheet closes. */
  dismissFraction: 0.25,
} as const

export const DOCKED_COMPOSER = {
  /** Placement: "bottom 22, width 640, centred" (`ASK_REOPEN` beside it only while paused, #615). */
  desktop: { bottom: 22, width: 640 },
  /** Placement: "inset 12, bottom 34, full width" (less `ASK_REOPEN` while paused). */
  phone: { inset: 12, bottom: 34 },
} as const

/**
 * Ask rising from the docked composer on a wide screen (#660): typing on the
 * star map, or opening `/ask` and `/ask/:id`, grows the conversation upward
 * from where the composer stood -- as wide as the composer
 * (`DOCKED_COMPOSER.desktop.width`, narrower only with less than `inset` on
 * either side), centred, its bottom on the composer's own line, and up to
 * `top` from the top of the page. The map behind it dims and cannot be used:
 * a tap on the dim or Esc closes Ask.
 *
 * The 420 panel beside the map (`ASK_PANEL`) is where Ask goes once the student
 * follows a star from it, so map and conversation are read side by side.
 *
 * Motion: grows up from the composer's height and fades in; under reduced
 * motion the same crossfade as the panel and the sheet.
 */
export const ASK_RISE = {
  width: DOCKED_COMPOSER.desktop.width,
  bottom: DOCKED_COMPOSER.desktop.bottom,
  /** The room left above it, under the page's top edge. */
  top: 24,
  /** The least room on either side, on a screen narrower than the composer plus this. */
  inset: 24,
  radius: 20,
  /** Heavier than the phone sheet's dim: the map is not being read now. */
  dim: 0.35,
} as const

/**
 * Ask given the whole screen from the button in its header (#676).
 *
 * Wide, risen Ask fills the whole window, the top bar too (it sits at z-30),
 * so the map is fully covered; the panel keeps its own sky. On a phone the
 * sheet from the planet goes to `ASK_SHEET.directHeight`, the height the `/ask`
 * route's sheet has; dragged down from there it goes back to 72% first.
 * Beside the map (#660) there is no full screen: its expand button raises Ask.
 */
export const ASK_FULL_SCREEN = {
  /** Over the top bar (z-30) and its dim. */
  zIndex: 40,
  /**
   * Wide, what is read keeps to one centred column this wide: the thread and
   * its cards, "Ask a teacher", the list and the composer. Across the whole
   * window a long answer ran to lines too long to follow. No layout token was
   * near this width; 760 holds the risen width (640) and a little more, about
   * 80-90 characters of an answer to a line.
   */
  column: 760,
} as const

/**
 * The button that calls Ask back after it was closed (#125), at the end of the
 * docked composer's row: on the practice stage (#180), and on the star map only
 * while the usage period is paused (#615), when the composer is shut.
 * 44 is the smallest touch target the Sizes board allows; `gap` is the room
 * between it and the composer.
 *
 * On a wide star map the composer stays centred, 640 at most, and the button
 * stands outside it on its right: the row keeps `size + gap` free on both
 * sides of the composer, so it narrows evenly before the button ever reaches
 * the page's edge. On a phone the composer takes the row less the button.
 */
export const ASK_REOPEN = { size: 44, gap: 8 } as const

export function sheetHeightFor(entry: AskEntry, fullScreen = false): string {
  return entry === 'direct' || fullScreen ? ASK_SHEET.directHeight : ASK_SHEET.planetHeight
}

/**
 * The Ask panel and sheet are a dark surface (#125): a white card over the star
 * map read as a different product, which is what the student said. Each
 * carries `data-surface="sky"` and `data-ask-surface`; the rule for that pair
 * in `src/styles/brand-tokens.css` points the light names the panel's contents
 * use at their sky counterparts, where the contrast gate rates them.
 *
 * What stays here is the panel's own ground: the sky, left slightly open so
 * the blur has work.
 */
export const ASK_SURFACE_BACKGROUND = {
  panel: 'color-mix(in srgb, var(--sky) 94%, transparent)',
  sheet: 'color-mix(in srgb, var(--sky) 96%, transparent)',
} as const
