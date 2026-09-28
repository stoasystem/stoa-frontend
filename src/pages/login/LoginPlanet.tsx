import { useId } from 'react'
import { cn } from '@/lib/utils'

/*
 * The small planet on the sign-in page (#53). It takes the place of candidate
 * 04's orbit diagram and is drawn the way the Home · the planet board draws
 * the sphere: an atmosphere halo, the sphere gradient (highlight 38% / 32%,
 * mid at 55%, limb), a 10% rim and a faint graticule -- all from the sky
 * tokens. Three lit points breathe (Motion and states); under reduced motion
 * they hold still (`.sky-breathe` in index.css).
 *
 * Static SVG on purpose: the planet renderer (#47) is for the student's
 * planet, and a sign-in page should not wait on it. It is decoration only.
 */

const R = 72
const C = 100

// Lit points: position on the sphere, glow radius, breath length and phase.
const LIT_POINTS = [
  { x: 76, y: 72, glow: 7, duration: '3.2s', delay: '-0.4s' },
  { x: 124, y: 96, glow: 6, duration: '2.8s', delay: '-1.6s' },
  { x: 94, y: 130, glow: 5, duration: '4.2s', delay: '-2.3s' },
] as const

// A few far stars around the sphere, white at low opacity (decoration, not text).
const FAR_STARS = [
  [18, 34, 0.9, 0.35],
  [184, 22, 0.7, 0.28],
  [170, 176, 0.9, 0.3],
  [26, 158, 0.6, 0.25],
  [150, 10, 0.5, 0.22],
] as const

function litStarPath(x: number, y: number, r: number) {
  const k = r * 0.35
  return `M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r} Z`
}

export function LoginPlanet({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const sphere = `${id}-sphere`
  const clip = `${id}-clip`
  const haze = `${id}-haze`
  const glow = `${id}-glow`

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn('block h-auto', className)}
      aria-hidden="true"
      focusable="false"
      data-login-planet=""
    >
      <defs>
        <radialGradient id={sphere} cx="38%" cy="32%" r="75%">
          <stop offset="0" style={{ stopColor: 'var(--sphere-0)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--sphere-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--sphere-2)' }} />
        </radialGradient>
        <clipPath id={clip}>
          <circle cx={C} cy={C} r={R} />
        </clipPath>
        <filter id={haze} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={glow} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {FAR_STARS.map(([x, y, r, opacity]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} style={{ fill: 'var(--on-sky-text)' }} fillOpacity={opacity} />
      ))}

      <circle cx={C} cy={C} r={R + 5} style={{ fill: 'var(--atmosphere)' }} filter={`url(#${haze})`} />
      <circle cx={C} cy={C} r={R} fill={`url(#${sphere})`} />

      <g clipPath={`url(#${clip})`} fill="none" style={{ stroke: 'var(--on-sky-text)' }} strokeOpacity={0.07} strokeWidth={0.6}>
        {/* Latitudes, seen from a little above the equator. */}
        <ellipse cx={C} cy={C + 8} rx={R} ry={16} />
        <ellipse cx={C} cy={C - 30} rx={63} ry={13} />
        <ellipse cx={C} cy={C + 44} rx={57} ry={12} />
        {/* Meridians. */}
        <ellipse cx={C} cy={C} rx={26} ry={R} />
        <ellipse cx={C} cy={C} rx={54} ry={R} />
      </g>
      <circle cx={C} cy={C} r={R} fill="none" style={{ stroke: 'var(--on-sky-text)' }} strokeOpacity={0.1} strokeWidth={0.8} />

      {LIT_POINTS.map((point) => (
        <g key={`${point.x}-${point.y}`}>
          <circle
            className="sky-breathe"
            style={{ ['--breathe-duration' as string]: point.duration, animationDelay: point.delay, fill: 'var(--lit)' }}
            cx={point.x}
            cy={point.y}
            r={point.glow}
            fillOpacity={0.3}
            filter={`url(#${glow})`}
          />
          <path
            className="sky-breathe"
            style={{ ['--breathe-duration' as string]: point.duration, animationDelay: point.delay, fill: 'var(--lit)' }}
            d={litStarPath(point.x, point.y, point.glow)}
            fillOpacity={0.85}
          />
          <circle cx={point.x} cy={point.y} r={1.3} style={{ fill: 'var(--lit-core)' }} />
        </g>
      ))}
    </svg>
  )
}
