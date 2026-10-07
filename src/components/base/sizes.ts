/**
 * Every dimension on the canvas board "Design language · Sizes"
 * (https://claude.ai/artifact/XTHszGBU78LNmon3uJjMNk), in CSS pixels, so
 * nothing is eyeballed twice. The base components read their dimensions from
 * here; tests/component/baseComponentSizes.test.tsx holds each one against the
 * board's own numbers, written out again, so a change here goes red there.
 *
 * Touch targets never fall under 44 on a phone; the visible control may be
 * smaller (the board's own rule).
 */

/** Buttons: three sizes. Weight 600 throughout. */
export const BUTTON_SIZES = {
  /** Phone primary, practice. */
  large: { height: 50, fontSize: 17, paddingX: 24, radius: 12 },
  /** The default. */
  regular: { height: 40, fontSize: 15, paddingX: 18, radius: 10 },
  /** Chips, in-card. */
  small: { height: 32, fontSize: 13, paddingX: 12, radius: 8 },
} as const

/** Icon buttons: box -> glyph. Round, no border, always a label. */
export const ICON_BUTTON_SIZES = {
  24: 14,
  28: 16,
  30: 18,
  32: 20,
  34: 20,
  36: 22,
} as const

/** Avatars: diameter -> initials font size. */
export const AVATAR_SIZES = {
  16: 11,
  26: 11,
  28: 11,
  30: 12,
  36: 15,
  44: 19,
  60: 27,
} as const

/** Icons: stroke 1.6, round caps, 24 grid. */
export const ICON = {
  stroke: 1.6,
  inline: 12,
  chip: 14,
  rowTrailing: 16,
  rowLeading: 18,
  button: 20,
  toolbar: 22,
} as const

/** Sizes: "Touch targets never fall under 44 on phone; the visible control may be smaller." */
export const TOUCH_TARGET = 44

/** Top bar (Sizes: "Logo 30 h · bell 36 · avatar 30 · gap 6 · side padding 20"); a 1 px separator under it. */
export const TOP_BAR = { height: 56, logo: 30, bell: 36, avatar: 30, gap: 6, paddingX: 20, border: 1 } as const

/** Phone top bar (Placement: "44 below a 54 safe area · 16 / 8 from edges"). */
export const TOP_BAR_PHONE = {
  height: 44,
  logo: 26,
  bell: 36,
  avatar: 28,
  gap: 2,
  paddingLeft: 16,
  paddingRight: 8,
} as const

/** Segmented control. Navigation 30 (text 14); filters 28. */
export const SEGMENTED = {
  nav: { height: 30, fontSize: 14 },
  filter: { height: 28, fontSize: 14 },
  itemPaddingX: 12,
  trackPadding: 2,
  trackRadius: 9,
  itemRadius: 7,
} as const

/** Search field: 36 by default, 32 in toolbars, 38 on a page; magnifier 18. */
export const SEARCH_FIELD = {
  toolbar: 32,
  default: 36,
  page: 38,
  radius: 10,
  glyph: 18,
  paddingX: 12,
  fontSize: 15,
} as const

/** Text field: the page search field's measure (38, radius 10, 12 inside, text 15), as a fill. */
export const TEXT_FIELD = { height: 38, radius: 10, paddingX: 12, fontSize: 15 } as const

/** List rows: 52; 48 in settings; 56 with a subtitle; 60-64 with an avatar. */
export const ROW = {
  settings: 48,
  default: 52,
  subtitle: 56,
  avatar: 64,
  groupRadius: 12,
  paddingX: 16,
  paddingY: 12,
  gap: 14,
  /** Leading icon tile. */
  tile: 32,
  tileRadius: 9,
  /** Leading avatar in a 64 row. */
  avatar36: 36,
} as const

/** Status pill: 22 high, text 12/600, pad 9. No borders, no icons. */
export const PILL = { height: 22, radius: 11, fontSize: 12, fontWeight: 600, paddingX: 9 } as const

/** Toggle: 26 x 44, knob 22. */
export const TOGGLE = { height: 26, width: 44, radius: 13, knob: 22 } as const

/** Progress: 4 high, the track is the fill colour. */
export const PROGRESS = { height: 4, radius: 4 } as const

/** Composer: docked 46 (radius 22-24), full ~150 (radius 18). */
export const COMPOSER = {
  docked: { height: 46, radius: 23, textarea: 32, attach: 32, attachGlyph: 20, send: 32, sendGlyph: 18 },
  full: { minHeight: 150, radius: 18, textarea: 78, footer: 32, attach: 32, attachGlyph: 20, send: 32, sendGlyph: 18 },
} as const

/** Account menu (Components: Account menu). */
export const ACCOUNT_MENU = { width: 260, item: 34, itemRadius: 7, glyph: 17 } as const

/** Admin source list (Teacher · Parent · Admin row, Admin board). */
export const SOURCE_LIST = { width: 240, item: 34, itemRadius: 8, glyph: 18 } as const
