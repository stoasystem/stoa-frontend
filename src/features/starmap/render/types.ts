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

export type RendererKind = 'canvas2d' | 'webgl'

/** Learning states as small integers, in `LEARNING_STATES` order. */
export const STATE_LIT = 0
export const STATE_IN_PROGRESS = 1
export const STATE_READY = 2
export const STATE_LOCKED = 3

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
  /** Map position of every star, map units. */
  mapX: Float32Array
  mapY: Float32Array
  state: Uint8Array
  progress: Float32Array
  reviewDue: Uint8Array
  /** Index of the one recommended star, or -1. */
  recommended: number
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
  }[]
  /** Lines between nebulae, aggregated from prerequisites (#72 point 2). */
  links: readonly { a: number; b: number; count: number }[]
  /** Prerequisites inside a nebula, star index pairs, with the nebula (#72 point 3). */
  innerLinks: readonly { from: number; to: number; nebula: number }[]
}

export type SceneFrame = {
  viewport: Viewport
  /** screen = (ox, oy) + map * scale. */
  scale: number
  ox: number
  oy: number
  /** Screen position of every star. */
  x: Float32Array
  y: Float32Array
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
  /** The recommended star's breath, when it breathes. */
  breath: { index: number; scale: number; alpha: number } | null
  /** Star names inside the chosen nebula. */
  starLabelAlpha: number
  /** Nebula names. */
  nebulaLabelAlpha: number
  /** Prerequisite lines inside the chosen nebula. */
  innerLinkAlpha: number
  /** The chosen nebula (nebula and star layers), or -1. */
  chosenNebula: number
  /** The star picked out (keyboard focus, the star layer), or -1. */
  focusStar: number
  /** The nebula whose link has keyboard focus, drawn with a ring, or -1. */
  highlightNebula: number
  /** Everything but the focus star fades to this (the star layer). */
  dim: number
  /** Skill dots beside the stars (large enough glyphs only). */
  showSkills: boolean
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
