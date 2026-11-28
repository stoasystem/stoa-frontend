/**
 * An exercise's figure on paper (#504): the question's drawing under it, or an
 * option's drawing in its choice. Cleaned by `cleanFigure` first.
 *
 * Always on white with dark ink, in the dark sky too: some figures draw in
 * fixed dark greys and black (the faces and edges of a solid), which a dark
 * card would swallow. The ink is what `currentColor` takes.
 *
 * A figure that names itself (`<title>`, `aria-label`) keeps its name. One that
 * does not is named by the element `labelledBy` points at: the question, for
 * the question's figure, read as it is shown (KaTeX's MathML says a formula;
 * the question's own text would say its dollars and backslashes). With no
 * label either, it is left out of the reading, as an option's drawing is
 * beside the option it belongs to.
 *
 * With `choices` (a `multi_select` question, stoa-backend#593) the elements
 * that carry `data-choice="B"` are hotspots: B is the second option, whatever
 * its text. Each is a checkbox named by its option, picked by a click, a tap,
 * Space or Enter, reached with Tab, and picked or not exactly as that option
 * is in the list under the question -- both read the one answer. Behind each
 * lies a target at least 44 px square on screen, so a dot of a few pixels can
 * be hit with a finger; it is also what shows the hotspot picked.
 */
import { useId, useLayoutEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { cleanFigure } from '@/features/chapter/figure'
import { cn } from '@/lib/utils'
import '@/features/chapter/hotspots.css'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** The smallest target a hotspot gets on screen, in CSS px (WCAG 2.5.5's 44). */
const HOTSPOT_TARGET = 44
/** Room round a hotspot's own drawing, in CSS px, where it is already larger. */
const HOTSPOT_MARGIN = 6

/** The hotspots of a question's figure, and the answer they pick into. */
export type FigureChoices = {
  /** The options' texts, in order: what each hotspot is called. */
  labels: readonly string[]
  /** The numbers of the options picked, 0 for the first. */
  picked: readonly number[]
  onToggle: (index: number) => void
  /** Once checked: how the picked hotspots are drawn. */
  verdict?: 'right' | 'wrong' | null
  disabled: boolean
}

/** The option a `data-choice` letter stands for: A is 0, L is 11. */
function optionOf(letter: string | null, count: number): number | null {
  if (!letter || !/^[A-L]$/.test(letter)) return null
  const index = letter.charCodeAt(0) - 65
  return index < count ? index : null
}

/**
 * Size each hotspot's target to its drawing, never under 44 px on screen.
 * Needs layout (`getBBox`); where there is none (a hidden figure, a test
 * page) the hotspot itself is still the target.
 */
function placeTargets(svg: SVGSVGElement) {
  const box = svg.viewBox?.baseVal
  const width = svg.getBoundingClientRect().width
  const scale = box && box.width > 0 && width > 0 ? width / box.width : 1
  for (const target of svg.querySelectorAll<SVGRectElement>('rect[data-choice-hit]')) {
    const hotspot = target.nextElementSibling
    if (!(hotspot instanceof SVGGraphicsElement) || typeof hotspot.getBBox !== 'function') continue
    let bounds: DOMRect
    try {
      bounds = hotspot.getBBox()
    } catch {
      continue
    }
    const w = Math.max(bounds.width + (2 * HOTSPOT_MARGIN) / scale, HOTSPOT_TARGET / scale)
    const h = Math.max(bounds.height + (2 * HOTSPOT_MARGIN) / scale, HOTSPOT_TARGET / scale)
    target.setAttribute('x', String(bounds.x + bounds.width / 2 - w / 2))
    target.setAttribute('y', String(bounds.y + bounds.height / 2 - h / 2))
    target.setAttribute('width', String(w))
    target.setAttribute('height', String(h))
    target.setAttribute('rx', String(Math.min(w, h) / 2))
  }
}

export function ExerciseFigure({
  svg,
  labelledBy,
  className,
  question = false,
  choices,
}: {
  svg: string
  labelledBy?: string
  className?: string
  /** The question's own drawing on the stage, which keeps a readable width (chapter.css, #735). */
  question?: boolean
  /** Its hotspots, for a question answered with a set of options (stoa-backend#593). */
  choices?: FigureChoices
}) {
  const prefix = `figure-${useId().replace(/[^\w-]/g, '')}-`
  const figure = useMemo(() => cleanFigure(svg, prefix), [svg, prefix])
  const paper = useRef<HTMLSpanElement>(null)
  const count = choices?.labels.length ?? 0
  // What a click picks into: the answer as it stands, not as it stood when the figure was drawn.
  const latest = useRef(choices)
  useLayoutEffect(() => {
    latest.current = choices
  })

  // The hotspots that stand for an option of this question; a letter past the
  // last option is drawing and nothing else.
  const hotspots = useMemo(() => {
    if (!figure || count === 0) return []
    return Array.from(figure.svg.querySelectorAll<SVGElement>('[data-choice]')).filter(
      (node) => optionOf(node.getAttribute('data-choice'), count) !== null,
    )
  }, [figure, count])
  const interactive = hotspots.length > 0

  useLayoutEffect(() => {
    const node = paper.current
    if (!node || !figure) return
    node.replaceChildren(figure.svg)
    return () => node.replaceChildren()
  }, [figure])

  // A target behind each hotspot, sized once laid out and again whenever the
  // figure is drawn at another width.
  useLayoutEffect(() => {
    if (!figure || !interactive) return
    const added: Element[] = []
    for (const hotspot of hotspots) {
      const target = document.createElementNS(SVG_NS, 'rect')
      target.setAttribute('data-choice-hit', hotspot.getAttribute('data-choice') ?? '')
      target.setAttribute('aria-hidden', 'true')
      const transform = hotspot.getAttribute('transform')
      if (transform) target.setAttribute('transform', transform)
      hotspot.before(target)
      added.push(target)
    }
    // A group, not a picture: a picture's insides are not read, and these are controls.
    const role = figure.svg.getAttribute('role')
    if (figure.named) figure.svg.setAttribute('role', 'group')
    placeTargets(figure.svg)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => placeTargets(figure.svg)) : null
    observer?.observe(figure.svg)
    return () => {
      observer?.disconnect()
      for (const target of added) target.remove()
      if (role) figure.svg.setAttribute('role', role)
      else figure.svg.removeAttribute('role')
    }
  }, [figure, hotspots, interactive])

  // Each hotspot says what it is and whether it is picked, as its option does.
  const picked = choices?.picked
  const disabled = choices?.disabled ?? false
  const verdict = choices?.verdict ?? null
  const labels = choices?.labels
  useLayoutEffect(() => {
    if (!figure || !labels) return
    for (const hotspot of hotspots) {
      const letter = hotspot.getAttribute('data-choice')
      const index = optionOf(letter, labels.length)
      if (index === null) continue
      const on = picked?.includes(index) ?? false
      const state = on ? (verdict ?? 'picked') : ''
      hotspot.setAttribute('role', 'checkbox')
      hotspot.setAttribute('aria-checked', String(on))
      hotspot.setAttribute('aria-label', labels[index].trim() || (letter ?? ''))
      hotspot.setAttribute('tabindex', disabled ? '-1' : '0')
      if (disabled) hotspot.setAttribute('aria-disabled', 'true')
      else hotspot.removeAttribute('aria-disabled')
      hotspot.setAttribute('data-hotspot', state)
      const target = hotspot.previousElementSibling
      if (target?.matches('[data-choice-hit]')) target.setAttribute('data-state', state)
    }
  }, [figure, hotspots, labels, picked, disabled, verdict])

  if (!figure) return null

  const pick = (element: EventTarget | null) => {
    const current = latest.current
    if (!current || current.disabled || !(element instanceof Element)) return false
    const node = element.closest('[data-choice-hit], [data-choice]')
    if (!node || !paper.current?.contains(node)) return false
    const index = optionOf(node.getAttribute('data-choice') ?? node.getAttribute('data-choice-hit'), current.labels.length)
    if (index === null) return false
    current.onToggle(index)
    return true
  }
  const onClick = (event: MouseEvent<HTMLSpanElement>) => {
    pick(event.target)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    if (!(event.target instanceof Element) || !event.target.matches('[data-choice]')) return
    if (pick(event.target)) event.preventDefault()
  }

  const reading = interactive
    ? labelledBy
      ? { role: 'group', 'aria-labelledby': labelledBy }
      : { role: 'group' }
    : figure.named
      ? {}
      : labelledBy
        ? { role: 'img', 'aria-labelledby': labelledBy }
        : { 'aria-hidden': true }
  return (
    <span
      ref={paper}
      data-exercise-figure={question ? 'question' : ''}
      data-hotspots={interactive ? '' : undefined}
      {...reading}
      {...(interactive ? { onClick, onKeyDown } : {})}
      className={cn('flex min-w-0 max-w-full justify-center overflow-hidden rounded-[12px] bg-white p-3 text-[#1D1D1F]', className)}
    />
  )
}
