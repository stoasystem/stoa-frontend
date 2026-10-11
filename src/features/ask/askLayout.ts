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
  /** Placement: "bottom 22, width 640, centred". */
  desktop: { bottom: 22, width: 640 },
  /** Placement: "inset 12, bottom 34, full width". */
  phone: { inset: 12, bottom: 34 },
} as const

/**
 * The button that calls Ask back after it was closed (#125).
 *
 * Every other corner is taken, measured on the pages Ask sits on:
 *   bottom centre  the docked composer (640 wide, 46 high, 22 or 34 up)
 *   bottom right   the star map's zoom pair, at 24 (wide) or 16 (phone) in
 *                  from both edges, over the composer's reserved band
 *   bottom left    the legend on a wide screen (up to 640 wide), the "?" on a
 *                  phone, both at the same offsets as the zoom pair
 *   left edge,     the role switcher used for testing, `fixed left-2 top-1/2`
 *     middle
 * The right edge's middle is the one band none of them reaches, and it mirrors
 * the role switcher across the page. 44 is the smallest touch target the Sizes
 * board allows.
 */
export const ASK_REOPEN = { size: 44, inset: 16 } as const

export function sheetHeightFor(entry: AskEntry): string {
  return entry === 'direct' ? ASK_SHEET.directHeight : ASK_SHEET.planetHeight
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
