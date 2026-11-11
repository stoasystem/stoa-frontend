/**
 * The "Find my own star" examples over the docked composer keep clear of the
 * page's own controls (#598): on a 375 phone the map's "?" (bottom left) and
 * its zoom pair (bottom right) stand in the same band as the examples, and the
 * examples covered them until they went. The controls are never hidden; the
 * examples narrow to the room between them, and wrap.
 */
import { useLayoutEffect, type RefObject } from 'react'

export type Box = { left: number; top: number; right: number; bottom: number }

/** How far the examples stand off a control beside them. */
export const CLEAR_GAP = 8

/** Frames measured again after the page changes size, while its controls settle. */
const SETTLE_FRAMES = 12

/**
 * The padding each side of `box` needs so that nothing in it reaches the
 * controls beside it: a control left of the box's middle pushes from the left,
 * one right of it from the right. A control above or below the box, or one
 * across its middle (no room either side of it), is left alone.
 */
export function sidePads(box: Box, controls: Box[], gap = CLEAR_GAP): { left: number; right: number } {
  const middle = (box.left + box.right) / 2
  let left = 0
  let right = 0
  for (const control of controls) {
    if (control.right <= control.left || control.bottom <= control.top) continue
    if (control.bottom <= box.top || control.top >= box.bottom) continue
    if (control.right <= box.left || control.left >= box.right) continue
    if (control.left < middle && control.right > middle) continue
    if (control.right <= middle) left = Math.max(left, Math.ceil(control.right - box.left + gap))
    else right = Math.max(right, Math.ceil(box.right - control.left + gap))
  }
  return { left, right }
}

/**
 * The page's controls the examples keep clear of: the star map's overlays
 * (`data-starmap-overlay`). Ask's own way back is the composer under the
 * examples (its button, drawn only while paused, has no examples to clear). A wrapper with
 * no size of its own (the "?" sits in one) stands for what is drawn inside it.
 */
export function controlBoxes(page: HTMLElement): Box[] {
  const boxes: Box[] = []
  const collect = (element: Element, depth: number) => {
    const box = element.getBoundingClientRect()
    if (box.width > 0 && box.height > 0) boxes.push(box)
    else if (depth < 3) for (const child of element.children) collect(child, depth + 1)
  }
  for (const control of page.querySelectorAll('[data-starmap-overlay]')) collect(control, 0)
  return boxes
}

/**
 * While `active`, pads `own` each side so its contents keep clear of the
 * controls on `page` beside it. Narrower, the examples wrap and grow taller,
 * which can bring another control into their band: the padding only grows
 * while they are offered (so it settles), and starts over when the page
 * changes size.
 */
export function useClearOfControls(own: RefObject<HTMLElement | null>, page: RefObject<HTMLElement | null>, active: boolean) {
  useLayoutEffect(() => {
    const element = own.current
    const root = page.current
    if (!active || !element || !root) return
    let pads = { left: 0, right: 0 }
    const apply = () => {
      element.style.paddingLeft = pads.left ? `${pads.left}px` : ''
      element.style.paddingRight = pads.right ? `${pads.right}px` : ''
      element.dataset.clearOf = pads.left || pads.right ? `${pads.left} ${pads.right}` : ''
    }
    const measure = () => {
      const next = sidePads(element.getBoundingClientRect(), controlBoxes(root))
      const left = Math.max(pads.left, next.left)
      const right = Math.max(pads.right, next.right)
      if (left === pads.left && right === pads.right) return
      pads = { left, right }
      apply()
    }
    // The controls settle a few frames after the page does (a phone's layout
    // follows the media query); measure again while they move.
    let frame = 0
    let frames = 0
    const settle = () => {
      measure()
      if (++frames < SETTLE_FRAMES) frame = requestAnimationFrame(settle)
    }
    const restart = () => {
      pads = { left: 0, right: 0 }
      apply()
      cancelAnimationFrame(frame)
      frames = 0
      settle()
    }
    restart()
    // The examples' own size changes as they wrap; the page's, when the window does.
    const wraps = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => measure())
    const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => restart())
    wraps?.observe(element)
    resizes?.observe(root)
    return () => {
      cancelAnimationFrame(frame)
      wraps?.disconnect()
      resizes?.disconnect()
      pads = { left: 0, right: 0 }
      apply()
    }
  }, [own, page, active])
}
