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
 * so is any `url(...)` that is not a marker of the figure's own. The nodes go
 * into the page as they are, not as text parsed again, so nothing can change
 * meaning on the way in.
 */
import DOMPurify, { type DOMPurify as Purifier } from 'dompurify'

/** `figure_svg.ELEMENTS`. */
const ELEMENTS = [
  'svg', 'g', 'defs', 'marker', 'title', 'desc',
  'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse', 'path',
  'text', 'tspan',
]

/** `figure_svg.ATTRIBUTES`. */
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

/** The one reference a figure may make: to a marker of its own (`figure_svg._LOCAL_REFERENCE`). */
const LOCAL_REFERENCE = /^url\(#[A-Za-z_][\w.-]*\)$/
const REFERENCE = /url\(#([A-Za-z_][\w.-]*)\)/g

let purifier: Purifier | null = null

/** Its own instance, so the hook below holds for figures and nothing else. */
function figurePurifier(): Purifier {
  if (!purifier) {
    purifier = DOMPurify(window)
    purifier.addHook('uponSanitizeAttribute', (_node, data) => {
      if (data.attrValue.includes('url(') && !LOCAL_REFERENCE.test(data.attrValue.trim())) data.keepAttr = false
    })
  }
  return purifier
}

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

  const ids = new Set<string>()
  for (const node of svg.querySelectorAll('[id]')) {
    ids.add(node.id)
    node.id = `${idPrefix}${node.id}`
  }
  if (svg.id) svg.id = `${idPrefix}${svg.id}`
  if (ids.size > 0) {
    for (const node of [svg, ...svg.querySelectorAll('*')]) {
      for (const attribute of Array.from(node.attributes)) {
        if (!attribute.value.includes('url(')) continue
        node.setAttribute(attribute.name, attribute.value.replace(REFERENCE, (whole, id: string) => (ids.has(id) ? `url(#${idPrefix}${id})` : whole)))
      }
    }
  }

  // As wide as it was drawn, never wider than the column, scaled by its
  // viewBox: no sideways scroll on a phone.
  const box = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  const boxSize = box?.length === 4 && box[2] > 0 && box[3] > 0 ? { width: box[2], height: box[3] } : null
  const width = pixels(svg.getAttribute('width'))
  const height = pixels(svg.getAttribute('height'))
  if (!boxSize && width && height) svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  const ratio = boxSize ?? (width && height ? { width, height } : null)
  const natural = width ?? boxSize?.width ?? null
  svg.style.display = 'block'
  svg.style.width = '100%'
  svg.style.height = 'auto'
  if (natural) svg.style.maxWidth = `${natural}px`
  if (ratio) svg.style.aspectRatio = `${ratio.width} / ${ratio.height}`

  const named = Boolean(svg.getAttribute('aria-label')?.trim() || svg.querySelector(':scope > title')?.textContent?.trim())
  if (named) svg.setAttribute('role', 'img')
  else svg.removeAttribute('role')
  return { svg, named }
}
