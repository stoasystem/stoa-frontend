/*
 * Nebula tiles (#72 point 6). Each nebula has two small images, painted once:
 * its haze, drawn under every nebula whether it is in focus or not (so a
 * sharp nebula and a blurred one read as the same kind of thing), and its
 * stars as soft dots at low resolution, blurred by downsampling, which
 * stands in for the stars of a nebula outside the focus. Both are only
 * scaled and faded after that. A tile is repainted only when its nebula's
 * lit fraction changes (or it belongs to another map); panning, zooming,
 * breathing and plain redraws never touch it. No blur filter ever runs
 * (`ctx.filter` is missing on Safari anyway; the blur is the downsample).
 */

export type Tile = { haze: CanvasImageSource; stars: CanvasImageSource; size: number }

export type TileCache = {
  /** The tile for nebula `index`, painting it if `key` differs from the last one. */
  get(index: number, key: string): Tile
  /** Forget every tile (a new theme or pixel ratio). */
  clear(): void
  readonly paints: number
}

/**
 * The tile key: which map (subject, orientation, layout), which nebula, and
 * its lit fraction. Within one map only the lit fraction ever changes it.
 */
export function tileKey(mapKey: string, topicId: string, lit: number, total: number): string {
  return `${mapKey}|${topicId}|${lit}/${total}`
}

export function createTileCache(paint: (index: number) => Tile): TileCache {
  const tiles = new Map<number, { key: string; tile: Tile }>()
  let paints = 0
  return {
    get(index, key) {
      const hit = tiles.get(index)
      if (hit && hit.key === key) return hit.tile
      paints += 1
      const tile = paint(index)
      tiles.set(index, { key, tile })
      return tile
    },
    clear() {
      tiles.clear()
    },
    get paints() {
      return paints
    },
  }
}

/** A tile's side, device px, and how far past the nebula's disc it reaches. */
export const TILE_SIZE = 64
export const TILE_REACH = 1.3
