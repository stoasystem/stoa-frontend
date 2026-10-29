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
 */
import { useId, useLayoutEffect, useMemo, useRef } from 'react'
import { cleanFigure } from '@/features/chapter/figure'
import { cn } from '@/lib/utils'

export function ExerciseFigure({ svg, labelledBy, className }: { svg: string; labelledBy?: string; className?: string }) {
  const prefix = `figure-${useId().replace(/[^\w-]/g, '')}-`
  const figure = useMemo(() => cleanFigure(svg, prefix), [svg, prefix])
  const paper = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const node = paper.current
    if (!node || !figure) return
    node.replaceChildren(figure.svg)
    return () => node.replaceChildren()
  }, [figure])

  if (!figure) return null
  const reading = figure.named ? {} : labelledBy ? { role: 'img', 'aria-labelledby': labelledBy } : { 'aria-hidden': true }
  return (
    <span
      ref={paper}
      data-exercise-figure=""
      {...reading}
      className={cn('flex min-w-0 max-w-full justify-center overflow-hidden rounded-[12px] bg-white p-3 text-[#1D1D1F]', className)}
    />
  )
}
