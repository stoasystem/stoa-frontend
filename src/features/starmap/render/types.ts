/*
 * The renderer seam (#11 point 1, kept by #72). The engine works out
 * everything a frame shows -- where each star and nebula is on screen, how
 * sharp each nebula is, which star breathes, what is dimmed or named -- and a
 * renderer only turns that into pixels. Canvas 2D sprites and nebula tiles
 * are the one implementation; a WebGL `gl.POINTS` renderer can take the same
 * frame if the phones in #44 miss the budget (degrade order: breathing, then
 * glow, then WebGL).
 */
import type { Viewport } from '@/features/starmap/view/camera'
import type { Rgb } from '@/features/starmap/view/semanticZoom'

export type RendererKind = 'canvas2d' | 'webgl'

/** Learning states as small integers, in `LEARNING_STATES` order. */
export const STATE_LIT = 0
export const STATE_IN_PROGRESS = 1
export const STATE_READY = 2
export const STATE_LOCKED = 3

/** The connection lines' inks (#121), from the `--starmap-link-*` and `--starmap-bridge` sky tokens. */
export type LinkInk = {
  /** Tier 1: a line into the recommended star. */
  recommended: string
  /** Tier 2: an in-progress star to its prerequisites. */
  inProgress: string
  /** Tier 3: both ends lit, the path walked. */
  walked: string
  /** Tier 4: into a locked star (star layer only, dashed). */
  locked: string
  /** The panorama's soft bridges between nebulae, and the glow between galaxies. */
  bridge: string
}

/** Colours read from the sky tokens (`data-surface="sky"`). */
export type StarMapTheme = {
  sky: string
  atmosphere: string
  lit: string
  litCore: string
  text: string
  textBody: string
  textCaption: string
  fontFamily: string
  /** The connection lines (#121); `LINK_INK` (render/links.ts) when absent. */
  links?: LinkInk
  /** A galaxy's name on the panorama (#137), the `--starmap-galaxy-name` sky token; `GALAXY_NAME_INK` (render/galaxyNames.ts) when absent. */
  galaxyName?: string
}

/** What stays the same from frame to frame: the map's data, in arrays. */
export type SceneData = {
  /**
   * Which map this is: subject, orientation and layout. Tiles painted for one
   * map are never shown on another, even where nebula indices and lit counts
   * happen to match.
   */
  mapKey: string
  count: number
  /**
   * One sky (#119): nebulae drawn as clouds in their own tint, galaxies as a
   * faint haze of their base tint with dark sky between them; topic discs
   * are navigation bounds only.
   */
  galaxy?: boolean
  /** The sky's galaxies, left to right (one sky only; absent otherwise). */
  galaxies?: readonly {
    subjectId: string
    name: string
    /** The box round its stars, map units. */
    x0: number
    x1: number
    y0: number
    y1: number
    /** Its base colour (haze, clouds) and its name's ink, by subject (#143: `GALAXY_COLOURS`). */
    colour: { readonly base: Rgb; readonly name: Rgb }
    /** 1, or less for a subject the student does not take. */
    dim: number
    /** Its nebulae, by index. */
    nebulae: readonly number[]
  }[]
  /** Map position of every star, map units. */
  mapX: Float32Array
  mapY: Float32Array
  state: Uint8Array
  progress: Float32Array
  reviewDue: Uint8Array
  /** Index of the recommended star (in the galaxy in focus, on one sky), or -1. */
  recommended: number
  /**
   * Every recommended star -- one per subject the student takes, on one sky
   * -- drawn as a full glyph at every zoom: the way in. Absent: just `recommended`.
   */
  recommendations?: readonly number[]
  /** Nebula index of every star. */
  nebula: Uint16Array
  names: readonly string[]
  /** Each star's skills, lit or not (#9 point 10; `[]` until stoa-backend#58). */
  skills: readonly (readonly boolean[])[]
  nebulae: readonly {
    topicId: string
    name: string
    /** Map disc. */
    x: number
    y: number
    r: number
    lit: number
    total: number
    /** Its own shade, near its galaxy's base colour (one sky only; #143: `nebulaShade`). */
    colour?: Rgb
    /** 1, or less in a galaxy the student does not take (one sky only). */
    dim?: number
  }[]
  /** Lines between nebulae, aggregated from prerequisites (#72 point 2). */
  links: readonly { a: number; b: number; count: number }[]
  /** Every prerequisite as star index pairs, across nebulae and subjects (#121; drawn by tier in `render/links.ts`). */
  starLinks: readonly { from: number; to: number }[]
}

export type SceneFrame = {
  viewport: Viewport
  /** screen = (ox, oy) + map * scale. */
  scale: number
  ox: number
  oy: number
  /** Screen position of every star (on one sky's ring, of its drawn copy). */
  x: Float32Array
  y: Float32Array
  /**
   * One sky's ring (#120): map units added to each galaxy's x this frame,
   * whole turns of the ring, so it is drawn at its copy nearest the view.
   * `x`, `y` and the nebula positions already include it; only what the
   * renderer places from map units (a galaxy's haze) needs it. Absent: none.
   */
  galaxyShift?: ArrayLike<number>
  /**
   * How strongly each star is drawn on its own, 0..1. Zero means it is left
   * to its nebula's tile: stars outside the focus are never drawn one by one.
   */
  starAlpha: Float32Array
  /** Each nebula's disc on screen, and how sharp it is (0 = tile only). */
  nebulaX: Float32Array
  nebulaY: Float32Array
  nebulaR: Float32Array
  sharpness: Float32Array
  /** A star's drawn box, CSS px. */
  glyphSize: number
  /**
   * 1: stars in focus are small dots (the whole map, where a full glyph per
   * star would pack a nebula solid); 0: full glyphs (zoomed in); between, a
   * crossfade. The recommended star is always a glyph.
   */
  dotBlend: number
  /** A dot's radius, CSS px. */
  dotRadius: number
  /**
   * One sky: the zoom over the farthest zoom (1 on the panorama). The
   * panorama's light (#137: quiet dots, brighter clouds, galaxy names) is a
   * continuous function of it (`PANORAMA`, view/semanticZoom.ts). Absent: zoomed in.
   */
  pastPanorama?: number
  /** The zoom as every reveal reads it: the glyph a star would be drawn at, unclamped (px, `starPxFor`). */
  starPx?: number
  /** The recommended star's breath, when it breathes. */
  breath: { index: number; scale: number; alpha: number } | null
  /** Star names, by zoom (#134: `starNameAlpha`); 0 far out. */
  starLabelAlpha: number
  /**
   * Which stars get a name (#134): those within `radius` px of the view's
   * focus point, fading out over the last `feather` px -- the nearest few
   * first, more as the zoom grows. Absent: every star on screen.
   */
  starNameReach?: { x: number; y: number; radius: number; feather: number }
  /**
   * How far the names of stars other than the key ones (recommended, in
   * progress, on the gold path) are in, 0..1 (#138 B2: `restStarNameAlpha`).
   * Absent: 1, every star named alike.
   */
  restStarNames?: number
  /** The star under the mouse, or -1 / absent: its name shows wherever star names can (#138 B2). */
  hoveredStar?: number
  /** Nebula names, all of them (a multiplier on `nebulaNames`). */
  nebulaLabelAlpha: number
  /** Each nebula's name by zoom (#134: `nebulaNameAlpha`); absent: 1 for every nebula. */
  nebulaNames?: ArrayLike<number>
  /** The hovered or keyboard-focused nebula's name: shown far out too, until star names take over. Absent: 1. */
  priorityNameAlpha?: number
  /** The lines by zoom (#121's tiers crossfaded by zoom, #134): the panorama's bridges, and each tier's star lines (index = tier). */
  lineReveal: { bridges: number; tiers: readonly number[] }
  /** With a star chosen, 0..1: how far the map has given way to it -- its own lines, every tier; the rest fade (#121, #134). */
  starFocus?: number
  /**
   * The chosen nebula, or -1: the one the route opens (or the chosen star's);
   * with nothing chosen, the one with keyboard focus, or the focused star's.
   */
  chosenNebula: number
  /**
   * Nothing is chosen (the route is the galaxy's). One sky then names a
   * nebula far out only when hovered or keyboard-focused; a focused
   * nebula's name is its link's pill. Absent: read from `chosenNebula < 0`.
   */
  wholeMap?: boolean
  /** The star picked out (keyboard focus, the star layer), or -1. */
  focusStar: number
  /** The nebula whose link has keyboard focus, drawn with a ring, or -1. */
  highlightNebula: number
  hoveredNebula?: number
  /** Everything but the focus star fades to this (a chosen star, zoomed in to it). */
  dim: number
  /**
   * How far the other nebulae have stepped back from a chosen one, 0..1, and
   * how far each nebula is lifted out of that (1: the chosen one): eased, so
   * choosing or letting go never dims the sky in one frame (#134). Absent:
   * read from `chosenNebula`.
   */
  chosenAmount?: number
  nebulaLift?: ArrayLike<number>
  /** Changes whenever `chosenAmount` or `nebulaLift` do: the light cache's key. */
  emphasisKey?: string
  /**
   * A star being dragged (#136), or absent. `x` / `y` already include every
   * displacement; `offsetX` / `offsetY` say how far each star is from its
   * place (px, 0 for most), so a line can be drawn between moved stars the
   * shorter way round the ring. `related` is 1 for the grabbed star and the
   * stars linked to it. `amount` (0..1, eased) lights the grabbed star's lines
   * and dims everything else; `grow` is the grabbed star's size factor.
   */
  drag?: {
    star: number
    related: Uint8Array
    offsetX: Float32Array
    offsetY: Float32Array
    amount: number
    grow: number
  }
  /** Skill dots beside the stars, 0..1 by zoom (large enough glyphs only). */
  showSkills: number
  /** The frame's time, ms, and how long a name takes to fade when it gains or loses its place (0: at once). */
  time?: number
  labelFadeMs?: number
  /** Alpha of the frame before a crossfade, laid over this one; 0 = none. */
  crossfade: number
}

/** What a renderer did, for tests and the frame-rate readings. */
export type RenderStats = {
  frames: number
  /** Stars drawn one by one in the last frame. */
  starDraws: number
  /** Nebula tiles drawn in the last frame. */
  tileDraws: number
  /** Tiles (re)painted since the renderer was made. */
  tilePaints: number
  /** The nebula drawn with a focus ring in the last frame, or -1. */
  highlightNebula: number
  /** Connection lines drawn in the last frame (#121). */
  links?: { bridges: number; hints: number; lines: number; labels: number; dragLabels?: number; bridgeLabels?: number }
  /** Galaxy names drawn in the last frame (#137; one sky, far out). */
  galaxyNames?: number
  /** Names drawn in the last frame, star and nebula (#134). */
  names?: { stars: number; nebulae: number }
  /** A name is still fading in or out: the renderer wants another frame. */
  settling?: boolean
  /** The boxes of the names at the screen's edge drawn in the last frame, CSS px (#138 D5); the lighting keeps clear of them (#145 C14). */
  edgeLabels?: readonly { x0: number; y0: number; x1: number; y1: number }[]
}

export interface StarMapRenderer {
  readonly kind: RendererKind
  readonly stats: RenderStats
  resize(viewport: Viewport, dpr: number): void
  setTheme(theme: StarMapTheme): void
  setData(data: SceneData): void
  draw(frame: SceneFrame): void
  /** Keep what is on screen now, for a crossfade to fade out. */
  snapshot(): void
  destroy(): void
}

export type RendererFactory = (canvas: HTMLCanvasElement) => StarMapRenderer | null
