/**
 * An exercise's figure (#504, stoa-backend#127): one `<svg>`, drawn into the
 * page so its `currentColor` follows the text it sits under.
 *
 * The backend refuses any figure that strays from its allowlist
 * (`stoa.services.figure_svg`), so what comes is a drawing and nothing else.
 * The page does not take that on trust: the text goes through DOMPurify with
 * the same allowlist, elements and attributes alike, and comes back as nodes
 * that were never script. Anything outside it is dropped -- a `<script>`, an
 * `on*` handler, an `href`, an `<image>`, a `<foreignObject>`, a `style` -- and
 * so is any attribute that refers to anything but a marker of the figure's own
 * (below). The nodes go into the page as they are, not as text parsed again,
 * so nothing can change meaning on the way in.
 *
 * Not the `svg` profile DOMPurify ships: that one lets `<image>`, `<a>`,
 * `<use>`, `<style>` and filters through, far more than a figure may hold.
 */
import DOMPurify, { type DOMPurify as Purifier } from 'dompurify'

/*
 * The allowlist, as stoa-backend has it in src/stoa/services/figure_svg.py
 * (`ELEMENTS`, `ATTRIBUTES`; main at stoa-backend#127). Copied by hand: a
 * change there that should show here is a change to make here too. Narrower
 * here is safe (a figure loses what the page will not draw); wider is not.
 */
const ELEMENTS = [
  'svg', 'g', 'defs', 'marker', 'title', 'desc',
  'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse', 'path',
  'text', 'tspan',
]

const ATTRIBUTES = [
  'xmlns', 'viewBox', 'width', 'height', 'preserveAspectRatio', 'role', 'aria-label',
  'id', 'transform',
  'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'dx', 'dy',
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'opacity',
  'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline',
  'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'markerUnits',
  'marker-start', 'marker-mid', 'marker-end',
]

/*
 * The one reference a figure may make: `url(#id)`, written just so, to a
 * marker of its own. A paint or marker attribute is read as CSS, and CSS
 * reads `URL(` as `url(` and `\75 rl(` as `url(` too (an escape); either way
 * the browser fetches whatever follows (#504 audit: a GET to another site,
 * with the Referer). So any value that mentions `url(` in any case or spacing,
 * or holds a backslash at all, is dropped unless it is exactly this.
 */
const LOCAL_REFERENCE = /^url\(#([A-Za-z_][\w.-]*)\)$/
const MENTIONS_URL = /url\s*\(/i

/** Whether a value may be read as anything but itself: a CSS escape, or a `url(` not written as a local reference. */
function refersOut(value: string) {
  return value.includes('\\') || (MENTIONS_URL.test(value) && !LOCAL_REFERENCE.test(value.trim()))
}

let purifier: Purifier | null = null

/** Its own instance, so the hook below holds for figures and nothing else. */
function figurePurifier(): Purifier {
  if (!purifier) {
    purifier = DOMPurify(window)
    purifier.addHook('uponSanitizeAttribute', (_node, data) => {
      // A name is read out, never parsed as CSS: a backslash there is just text.
      if (data.attrName !== 'aria-label' && refersOut(data.attrValue)) data.keepAttr = false
    })
  }
  return purifier
}

/** No taller than this, whatever its viewBox says: one 400 × 4 000 000 would stretch the page. */
export const FIGURE_MAX_HEIGHT = '70vh'

export type CleanFigure = {
  svg: SVGSVGElement
  /** Whether the drawing names itself (`<title>` or `aria-label`), so it needs no label from the page. */
  named: boolean
}

/** A length in px, as `width="320"` or `width="320px"` gives it; null for `100%` and the like. */
function pixels(value: string | null): number | null {
  if (!value || !/^\s*\d+(\.\d+)?\s*(px)?\s*$/.test(value)) return null
  const number = Number.parseFloat(value)
  return number > 0 ? number : null
}

/**
 * The figure, cleaned and ready to put in the page; null when nothing of it is
 * left to draw. `idPrefix` keeps the ids of two figures on one page apart: two
 * option figures that both define `#arrow` would otherwise both point at the
 * first one.
 */
export function cleanFigure(source: string, idPrefix: string): CleanFigure | null {
  if (typeof source !== 'string' || !source.trim()) return null
  const fragment = figurePurifier().sanitize(source, {
    ALLOWED_TAGS: [...ELEMENTS, '#text'],
    ALLOWED_ATTR: ATTRIBUTES,
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
  })
  const found = Array.from(fragment.children).find((node): node is SVGSVGElement => node.localName === 'svg')
  if (!found) return null
  // DOMPurify works in a document of its own, where nothing loads or runs;
  // the page gets a copy that belongs to it.
  const svg = document.importNode(found, true)

  // A reference goes to the figure's own ids, renamed with them; one to an id
  // the figure does not have (another figure's, the page's) goes altogether.
  const ids = new Set<string>()
  for (const node of [svg, ...svg.querySelectorAll('[id]')]) {
    if (!node.id) continue
    ids.add(node.id)
    node.id = `${idPrefix}${node.id}`
  }
  for (const node of [svg, ...svg.querySelectorAll('*')]) {
    for (const attribute of Array.from(node.attributes)) {
      const id = LOCAL_REFERENCE.exec(attribute.value.trim())?.[1]
      if (id === undefined) continue
      if (ids.has(id)) node.setAttribute(attribute.name, `url(#${idPrefix}${id})`)
      else node.removeAttribute(attribute.name)
    }
  }

  // As wide as it was drawn, never wider than the column, scaled by its
  // viewBox: no sideways scroll on a phone. Never taller than most of the
  // screen either: a figure squeezed by that keeps its shape (`meet`), with
  // room around it, rather than running the page on for ever.
  const box = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  const boxSize = box?.length === 4 && box[2] > 0 && box[3] > 0 ? { width: box[2], height: box[3] } : null
  const width = pixels(svg.getAttribute('width'))
  const height = pixels(svg.getAttribute('height'))
  if (!boxSize && width && height) svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  const ratio = boxSize ?? (width && height ? { width, height } : null)
  const natural = width ?? boxSize?.width ?? null
  if (/\bnone\b/.test(svg.getAttribute('preserveAspectRatio') ?? '')) svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.style.display = 'block'
  svg.style.width = '100%'
  svg.style.height = 'auto'
  svg.style.maxHeight = FIGURE_MAX_HEIGHT
  if (natural) svg.style.maxWidth = `${natural}px`
  if (ratio) svg.style.aspectRatio = `${ratio.width} / ${ratio.height}`

  const named = Boolean(svg.getAttribute('aria-label')?.trim() || svg.querySelector(':scope > title')?.textContent?.trim())
  if (named) svg.setAttribute('role', 'img')
  else svg.removeAttribute('role')
  return { svg, named }
}
