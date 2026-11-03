/*
 * The star glyph in SVG, for the star layer and the legend (the canvas draws
 * the same geometry from sprites). Measured off the canvas board "Knowledge
 * point glyph"; see `render/glyph.ts`.
 */
import { useId } from 'react'
import { GLOW_STOPS, GLYPH_LARGE, GLYPH_SMALL, LINE_GLOW, ORB_TURN, RAY_STOPS, rayPath, type StarLight } from '@/features/starmap/render/glyph'
import type { StarLook } from '@/features/starmap/model/starMap'

const LIT = 'var(--lit)'
const CORE = 'var(--lit-core)'
const WHITE = 'var(--on-sky-text)'
const RIM = 'var(--starmap-rim)'
const ICE = 'var(--starmap-ice)'

/** A glow that thins to nothing: the canvas's `softGlow` as an SVG gradient. */
function Glow({ id, r, color, alpha, className }: { id: string; r: number; color: string; alpha: number; className?: string }) {
  if (r <= 0 || alpha <= 0) return null
  return (
    <>
      <defs>
        <radialGradient id={id}>
          {GLOW_STOPS.map(([at, a]) => (
            <stop key={at} offset={at} style={{ stopColor: color }} stopOpacity={a * alpha} />
          ))}
        </radialGradient>
      </defs>
      <circle className={className} r={r} fill={`url(#${id})`} />
    </>
  )
}

/** An orb: `inner` at the centre, `outer` by `ORB_TURN`, nothing at the edge. */
function Orb({ id, r, inner, outer, alpha }: { id: string; r: number; inner: string; outer: string; alpha: number }) {
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset={0} style={{ stopColor: inner }} stopOpacity={alpha} />
          <stop offset={ORB_TURN} style={{ stopColor: outer }} stopOpacity={alpha * 0.9} />
          <stop offset={1} style={{ stopColor: outer }} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={r} fill={`url(#${id})`} />
    </>
  )
}

/** Four rays, white at the centre and fading out to their tips. */
function Rays({ id, tip, width, alpha, diagonal = false, className }: { id: string; tip: number; width: number; alpha: number; diagonal?: boolean; className?: string }) {
  if (tip <= 0 || alpha <= 0) return null
  return (
    <>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={tip}>
          {RAY_STOPS.map(([at, ink, a]) => (
            <stop key={at} offset={at} style={{ stopColor: ink === 'core' ? CORE : LIT }} stopOpacity={a * alpha} />
          ))}
        </radialGradient>
      </defs>
      <path className={className} d={rayPath(tip, width, diagonal)} fill={`url(#${id})`} />
    </>
  )
}

/** A ring drawn as light: a wide faint pass under the fine line. */
function GlowRing({ r, width, color, alpha, dash, transform }: { r: number; width: number; color: string; alpha: number; dash?: string; transform?: string }) {
  return (
    <>
      <circle r={r} fill="none" stroke={color} strokeOpacity={alpha * LINE_GLOW.alpha} strokeWidth={width * LINE_GLOW.wide} strokeDasharray={dash} strokeLinecap="round" transform={transform} />
      <circle r={r} fill="none" stroke={color} strokeOpacity={alpha} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" transform={transform} />
    </>
  )
}

/** A warm soft star: the canvas's `starLight`. */
function StarLightGlyph({ g, id }: { g: StarLight; id: string }) {
  return (
    <>
      <Glow id={`${id}-rim`} r={g.rim} color={RIM} alpha={g.rimAlpha} />
      <Glow id={`${id}-glow`} r={g.glow} color={LIT} alpha={g.glowAlpha} className="starmap-halo" />
      <Rays id={`${id}-glint`} tip={g.glint} width={g.glintWidth} alpha={g.glintAlpha} diagonal />
      <Rays id={`${id}-rays`} tip={g.tip} width={g.rayWidth} alpha={g.rayAlpha} className="starmap-star" />
      <Orb id={`${id}-orb`} r={g.orb} inner={CORE} outer={LIT} alpha={0.95} />
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

  let body
  if (state === 'lit') {
    body = <StarLightGlyph g={cut.lit} id={id} />
  } else if (state === 'in_progress') {
    const g = cut.inProgress
    const circumference = 2 * Math.PI * g.ring
    body = (
      <>
        <StarLightGlyph g={g} id={id} />
        <circle r={g.ring} fill="none" stroke={WHITE} strokeOpacity={g.trackAlpha} strokeWidth={g.ringWidth} />
        <GlowRing
          r={g.ring}
          width={g.ringWidth}
          color={LIT}
          alpha={0.9}
          dash={`${circumference * Math.min(1, Math.max(0, progress))} ${circumference}`}
          transform="rotate(-90)"
        />
      </>
    )
  } else if (state === 'ready') {
    const g = cut.ready
    body = (
      <>
        <Glow id={`${id}-rim`} r={g.rim} color={ICE} alpha={g.rimAlpha} />
        <Glow id={`${id}-glow`} r={g.glow} color={ICE} alpha={g.glowAlpha} />
        <Orb id={`${id}-orb`} r={g.orb} inner={WHITE} outer={ICE} alpha={g.orbAlpha} />
      </>
    )
  } else {
    const g = cut.waiting
    body = <GlowRing r={g.ring} width={g.ringWidth} color={WHITE} alpha={g.ringAlpha} />
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
          <circle r={r.halo} fill={LIT} fillOpacity={r.haloAlpha} filter={`url(#${blurId})`} />
          <GlowRing r={r.ring} width={r.ringWidth} color={LIT} alpha={0.9} dash={r.dash.join(' ')} />
        </>
      )}
      {body}
      {reviewDue && (
        <>
          <circle cx={pip} cy={-pip} r={review.radius + review.outline} fill="var(--sky)" />
          <circle cx={pip} cy={-pip} r={review.radius} fill={WHITE} />
        </>
      )}
    </svg>
  )
}
