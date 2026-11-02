/*
 * The star glyph in SVG, for the star layer and the legend (the canvas draws
 * the same geometry from sprites). Measured off the canvas board "Knowledge
 * point glyph"; see `render/glyph.ts`.
 */
import { useId } from 'react'
import { CORE_SOLID, GLOW_STOPS, GLYPH_LARGE, GLYPH_SMALL, glintPath, RAY_STOPS, starPath, type StarLight } from '@/features/starmap/render/glyph'
import type { StarLook } from '@/features/starmap/model/starMap'

/** A glowing star: the canvas's `starLight`, with its gradients as SVG defs. */
function StarLightGlyph({ g, id }: { g: StarLight; id: string }) {
  const lit = 'var(--lit)'
  const core = 'var(--lit-core)'
  const rays = (key: string, reach: number, alpha: number) => (
    <radialGradient id={`${id}-${key}`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={reach}>
      {RAY_STOPS.map(([at, ink, a]) => (
        <stop key={at} offset={at} style={{ stopColor: ink === 'core' ? core : lit }} stopOpacity={a * alpha} />
      ))}
    </radialGradient>
  )
  return (
    <>
      <defs>
        <radialGradient id={`${id}-glow`}>
          {GLOW_STOPS.map(([at, a]) => (
            <stop key={at} offset={at} style={{ stopColor: lit }} stopOpacity={a * g.glowAlpha} />
          ))}
        </radialGradient>
        {rays('rays', g.tip, g.starAlpha)}
        {rays('glint', g.glint, g.glintAlpha)}
        <radialGradient id={`${id}-core`}>
          <stop offset={0} style={{ stopColor: core }} />
          <stop offset={CORE_SOLID} style={{ stopColor: core }} />
          <stop offset={1} style={{ stopColor: core }} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle className="starmap-halo" r={g.glow} fill={`url(#${id}-glow)`} />
      <path d={glintPath(g.glint, g.glintWaist)} fill={`url(#${id}-glint)`} />
      <path className="starmap-star" d={starPath(g.tip, g.waist)} fill={`url(#${id}-rays)`} />
      <circle r={g.core} fill={`url(#${id}-core)`} />
    </>
  )
}

export function StarGlyph({
  state,
  size,
  progress = 0,
  recommended = false,
  reviewDue = false,
  breathe = false,
}: {
  /** How the star is drawn: its learning state, or `waiting` (`starLook`). */
  state: StarLook
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
  const white = 'var(--on-sky-text)'

  let body
  if (state === 'lit') {
    body = <StarLightGlyph g={cut.lit} id={id} />
  } else if (state === 'in_progress') {
    const g = cut.inProgress
    const circumference = 2 * Math.PI * g.ring
    body = (
      <>
        <StarLightGlyph g={g} id={id} />
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
    const g = cut.waiting
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
          <feGaussianBlur stdDeviation={cut.recommended.blur} />
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
