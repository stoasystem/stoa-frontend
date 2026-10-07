/*
 * The star glyph in SVG, for the star layer and the legend (the canvas draws
 * the same geometry from sprites). Measured off the canvas board "Knowledge
 * point glyph"; see `render/glyph.ts`.
 */
import { useId } from 'react'
import { GLYPH_LARGE, GLYPH_SMALL, starPath } from '@/features/starmap/render/glyph'
import type { LearningState } from '@/features/starmap/model/starMap'

export function StarGlyph({
  state,
  size,
  progress = 0,
  recommended = false,
  reviewDue = false,
  breathe = false,
}: {
  state: LearningState
  size: number
  progress?: number
  recommended?: boolean
  reviewDue?: boolean
  /** Breathing (CSS, held still under reduced motion): the recommended star only. */
  breathe?: boolean
}) {
  const id = useId()
  const cut = size >= 30 ? GLYPH_LARGE : GLYPH_SMALL
  const half = cut.box / 2
  const blurId = `${id}-blur`
  const lit = 'var(--lit)'
  const core = 'var(--lit-core)'
  const white = 'var(--on-sky-text)'

  let body
  if (state === 'lit') {
    const g = cut.lit
    body = (
      <>
        <circle className="starmap-halo" r={g.halo} fill={lit} fillOpacity={g.haloAlpha} filter={`url(#${blurId})`} />
        <path className="starmap-star" d={starPath(g.tip, g.waist)} fill={lit} fillOpacity={g.starAlpha} />
        <circle r={g.ring} fill="none" stroke={lit} strokeOpacity={g.ringAlpha} strokeWidth={g.ringWidth} />
        <circle r={g.core} fill={core} />
      </>
    )
  } else if (state === 'in_progress') {
    const g = cut.inProgress
    const circumference = 2 * Math.PI * g.ring
    body = (
      <>
        <circle className="starmap-halo" r={g.halo} fill={lit} fillOpacity={g.haloAlpha} filter={`url(#${blurId})`} />
        <path className="starmap-star" d={starPath(g.tip, g.waist)} fill={lit} fillOpacity={g.starAlpha} />
        <circle r={g.ring} fill="none" stroke={white} strokeOpacity={g.trackAlpha} strokeWidth={g.ringWidth} />
        <circle
          r={g.ring}
          fill="none"
          stroke={lit}
          strokeWidth={g.ringWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference * Math.min(1, Math.max(0, progress))} ${circumference}`}
          transform="rotate(-90)"
        />
        <circle r={g.core} fill={core} />
      </>
    )
  } else if (state === 'ready') {
    const g = cut.ready
    body = (
      <>
        <circle r={g.ring} fill="none" stroke={white} strokeOpacity={g.ringAlpha} strokeWidth={g.ringWidth} />
        <circle r={g.core} fill={white} fillOpacity={g.coreAlpha} />
      </>
    )
  } else {
    const g = cut.locked
    body = <circle r={g.ring} fill="none" stroke={white} strokeOpacity={g.ringAlpha} strokeWidth={g.ringWidth} />
  }

  const r = cut.recommended
  const review = cut.review
  const pip = review.offset / Math.SQRT2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-half} ${-half} ${cut.box} ${cut.box}`}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', overflow: 'visible' }}
      data-starmap-breathe={breathe ? '' : undefined}
    >
      <defs>
        <filter id={blurId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={cut.lit.blur} />
        </filter>
      </defs>
      {recommended && (
        <>
          <circle r={r.halo} fill={lit} fillOpacity={r.haloAlpha} filter={`url(#${blurId})`} />
          <circle r={r.ring} fill="none" stroke={lit} strokeWidth={r.ringWidth} strokeDasharray={r.dash.join(' ')} />
        </>
      )}
      {body}
      {reviewDue && (
        <>
          <circle cx={pip} cy={-pip} r={review.radius + review.outline} fill="var(--sky)" />
          <circle cx={pip} cy={-pip} r={review.radius} fill={white} />
        </>
      )}
    </svg>
  )
}
