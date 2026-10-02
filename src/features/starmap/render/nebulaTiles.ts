/*
 * Nebula tiles (#72 point 6). Each nebula has two small images, painted once:
 * its haze, drawn under every nebula whether it is in focus or not (so a
 * sharp nebula and a blurred one read as the same kind of thing), and its
 * stars as soft dots at low resolution, blurred by downsampling, which
 * stands in for the stars of a nebula outside the focus. Both are only
 * scaled and faded after that. A tile is repainted only when its nebula's
 * star states change, or a larger resolution tier is needed. Cached tiers
 * are retained on zoom-out; panning, breathing and redraws never touch it. No blur filter ever runs
 * (`ctx.filter` is missing on Safari anyway; the blur is the downsample).
 */

export type Tile = { haze: CanvasImageSource; stars: CanvasImageSource; size: number }

export type TileCache = {
  /** The tile for nebula `index`, painting it if `key` differs from the last one. */
  get(index: number, key: string, size?: number): Tile
  /** Forget every tile (a new theme or pixel ratio). */
  clear(): void
  readonly paints: number
}

/**
 * The tile key: which map (subject, orientation, layout), which nebula, and
 * its lit fraction. The renderer appends the complete star-state identity.
 */
export function tileKey(mapKey: string, topicId: string, lit: number, total: number): string {
  return `${mapKey}|${topicId}|${lit}/${total}`
}

export function createTileCache(paint: (index: number, size: number) => Tile): TileCache {
  const tiles = new Map<number, { key: string; tile: Tile }>()
  let paints = 0
  return {
    get(index, key, size = TILE_SIZE) {
      const hit = tiles.get(index)
      if (hit && hit.key === key && hit.tile.size >= size) return hit.tile
      paints += 1
      const tile = paint(index, size)
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

/** At most 256 px per tile; tiers only grow until data/theme changes. */
export function tileSizeFor(diameter: number, dpr: number): number {
  const pixels = diameter * dpr
  return pixels <= 64 ? 64 : pixels <= 128 ? 128 : 256
}

/** State identity, not just lit fraction: ready → locked must repaint too. Computed on data change. */
export function nebulaStateKeys(state: Uint8Array, nebula: Uint16Array, count: number): string[] {
  const keys = Array<string>(count).fill('')
  for (let i = 0; i < state.length; i += 1) keys[nebula[i]] += state[i]
  return keys
}
