/*
 * Nebula tiles (#72 point 6): each nebula outside the focus is drawn as one
 * small image, painted once -- its stars as soft dots at low resolution,
 * blurred by downsampling -- and then only scaled and faded. A tile is
 * repainted only when its nebula's lit fraction changes; panning, zooming,
 * breathing and plain redraws never touch it. No blur filter ever runs per
 * frame (nor at all: `ctx.filter` is missing on Safari, so the blur is the
 * downsample).
 */

export type Tile = { canvas: CanvasImageSource; size: number }

export type TileCache = {
  /** The tile for nebula `index`, painting it if `key` differs from the last one. */
  get(index: number, key: string): Tile
  /** Forget every tile (a new theme or pixel ratio). */
  clear(): void
  readonly paints: number
}

/** The tile key: the one thing that repaints a tile. */
export function litFractionKey(lit: number, total: number): string {
  return `${lit}/${total}`
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
