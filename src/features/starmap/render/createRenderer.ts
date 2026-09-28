/*
 * Which renderer draws the star map. Canvas 2D is the only one written; the
 * WebGL slot stays empty until the phone benchmark (#44) says the sprites miss
 * 60 fps at 2000 stars even with breathing and glow turned off (#11 point 3,
 * kept by #72).
 * A WebGL renderer implements `StarMapRenderer` and goes in the table below;
 * nothing else changes.
 */
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import type { StarMapRenderer, RendererFactory, RendererKind } from '@/features/starmap/render/types'

export const RENDERERS: Record<RendererKind, RendererFactory | null> = {
  canvas2d: createCanvas2DRenderer,
  webgl: null,
}

/** Does nothing: where a canvas has no 2D context (jsdom, a lost GPU process). */
export function createNullRenderer(): StarMapRenderer {
  return {
    kind: 'canvas2d',
    stats: { frames: 0, starDraws: 0, tileDraws: 0, tilePaints: 0 },
    resize() {},
    setTheme() {},
    setData() {},
    draw() {},
    snapshot() {},
    destroy() {},
  }
}

/** The renderer asked for, else Canvas 2D, else one that draws nothing. */
export function createRenderer(canvas: HTMLCanvasElement, preferred: RendererKind = 'canvas2d'): StarMapRenderer {
  const factories = [RENDERERS[preferred], RENDERERS.canvas2d]
  for (const factory of factories) {
    const renderer = factory?.(canvas)
    if (renderer) return renderer
  }
  return createNullRenderer()
}
