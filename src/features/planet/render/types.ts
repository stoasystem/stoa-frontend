/*
 * The renderer seam (#11 point 1). The engine works out everything a frame
 * shows -- where each point is, how it breathes, what is dimmed or labelled --
 * and a renderer only turns that into pixels. Canvas 2D sprites are the one
 * implementation; a WebGL `gl.POINTS` renderer can take the same frame if the
 * phones in #44 miss the budget (degrade order: breathing, then glow, then
 * WebGL).
 */
import type { GeoPermissibleObjects, GeoProjection } from 'd3-geo'
import type { Disc, Viewport } from '@/features/planet/geo/projection'

export type RendererKind = 'canvas2d' | 'webgl'

/** Learning states as small integers, in `LEARNING_STATES` order. */
export const STATE_LIT = 0
export const STATE_IN_PROGRESS = 1
export const STATE_READY = 2
export const STATE_LOCKED = 3

/** Colours read from the sky tokens (`data-surface="sky"`). */
export type PlanetTheme = {
  sky: string
  sphere0: string
  sphere1: string
  sphere2: string
  atmosphere: string
  lit: string
  litCore: string
  text: string
  textBody: string
  textCaption: string
  fontFamily: string
}

/** What stays the same from frame to frame: the planet's data, in arrays. */
export type SceneData = {
  count: number
  /** `[lng, lat]` pairs, degrees. */
  lngLat: Float64Array
  state: Uint8Array
  progress: Float32Array
  reviewDue: Uint8Array
  /** Index of the one recommended point, or -1. */
  recommended: number
  /** Region index of every point. */
  region: Uint16Array
  names: readonly string[]
  regions: readonly {
    name: string
    lng: number
    lat: number
    /** The region's outline on the sphere, a d3-geo circle polygon. */
    outline: GeoPermissibleObjects
  }[]
}

export type SceneFrame = {
  viewport: Viewport
  projection: GeoProjection
  disc: Disc
  x: Float32Array
  y: Float32Array
  depth: Float32Array
  breathScale: Float32Array
  breathAlpha: Float32Array
  /** A point's drawn box at the front of the sphere, CSS px. */
  glyphSize: number
  /** Names of the focused region's points: 0 hidden, 1 shown. */
  pointLabelAlpha: number
  /** Continent names on the whole planet. */
  regionLabelAlpha: number
  /** Region whose points get names and whose outline is picked out, or -1. */
  focusRegion: number
  /** Point picked out (keyboard focus, the point layer), or -1. */
  focusPoint: number
  /** Everything but the focused point fades to this (the point layer). */
  dim: number
  /** Alpha of the frame before a crossfade, laid over this one; 0 = none. */
  crossfade: number
}

export interface PlanetRenderer {
  readonly kind: RendererKind
  resize(viewport: Viewport, dpr: number): void
  setTheme(theme: PlanetTheme): void
  setData(data: SceneData): void
  draw(frame: SceneFrame): void
  /** Keep what is on screen now, for a crossfade to fade out. */
  snapshot(): void
  destroy(): void
}

export type RendererFactory = (canvas: HTMLCanvasElement) => PlanetRenderer | null
