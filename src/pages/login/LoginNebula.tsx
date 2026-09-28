import { useId } from 'react'
import { cn } from '@/lib/utils'

/*
 * The small nebula on the sign-in page (#53). It takes the place of candidate
 * 04's orbit diagram, drawn in the star-map language that replaced the planet
 * (#72): a soft cloud of stars -- mostly faint, a few lit in star-gold --
 * scattered unevenly, with one faint line to a second, smaller cloud at the
 * edge. Colours are the sky tokens (--atmosphere, --lit, --lit-deep,
 * --lit-core, white for the faint stars).
 *
 * The glow is baked into radial gradients, not a blur filter, so nothing is
 * recomputed per frame while the lit stars breathe (Motion and states); under
 * reduced motion they hold still (`.sky-breathe` in index.css). Static SVG,
 * decoration only.
 */

type Star = { x: number; y: number; r: number; opacity: number }
type LitStar = { x: number; y: number; size: number; duration: string; delay: string }

// A fixed seed, so the scatter is the same on every render and every build.
function scatter(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stars around a centre: denser in the middle, stretched and turned, so the cloud is not round. */
function cloud(
  seed: number,
  count: number,
  { cx, cy, sx, sy, turn }: { cx: number; cy: number; sx: number; sy: number; turn: number },
): Star[] {
  const random = scatter(seed)
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  const round = (value: number) => Math.round(value * 10) / 10
  return Array.from({ length: count }, () => {
    // Box-Muller: a normal spread, thinning to the edges.
    const u = Math.max(random(), 1e-6)
    const v = random()
    const radius = Math.sqrt(-2 * Math.log(u))
    const dx = radius * Math.cos(2 * Math.PI * v) * sx
    const dy = radius * Math.sin(2 * Math.PI * v) * sy
    const nearness = Math.exp(-(radius * radius) / 3)
    return {
      x: round(cx + dx * cos - dy * sin),
      y: round(cy + dx * sin + dy * cos),
      r: round(0.45 + random() * 0.7),
      opacity: round(0.18 + nearness * 0.4 + random() * 0.12),
    }
  }).filter((star) => star.x > 2 && star.x < 198 && star.y > 2 && star.y < 198)
}

const MAIN = { cx: 92, cy: 108, sx: 30, sy: 19, turn: -0.5 }
const SMALL = { cx: 168, cy: 36, sx: 9, sy: 6, turn: 0.4 }

const FAINT_STARS: Star[] = [...cloud(53, 64, MAIN), ...cloud(72, 16, SMALL)]

const LIT_STARS: LitStar[] = [
  { x: 78, y: 116, size: 6.5, duration: '3.4s', delay: '-0.6s' },
  { x: 106, y: 92, size: 5, duration: '2.8s', delay: '-1.7s' },
  { x: 64, y: 132, size: 3.8, duration: '4.2s', delay: '-2.4s' },
  { x: 121, y: 110, size: 3.4, duration: '3.8s', delay: '-0.2s' },
  { x: 166, y: 38, size: 3.6, duration: '3.1s', delay: '-1.1s' },
]

/** The one link: from a lit star of the main cloud to the small cloud's. */
const LINK = { from: LIT_STARS[1], to: LIT_STARS[4] }

function litStarPath(x: number, y: number, r: number) {
  const k = r * 0.32
  return `M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r} Z`
}

export function LoginNebula({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const haze = `${id}-haze`
  const warm = `${id}-warm`
  const glow = `${id}-glow`

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn('block h-auto', className)}
      aria-hidden="true"
      focusable="false"
      data-login-nebula=""
    >
      <defs>
        {/* The cloud's light, baked: cool haze, a warmer heart, the stars' glow. */}
        <radialGradient id={haze}>
          <stop offset="0" style={{ stopColor: 'var(--atmosphere)' }} stopOpacity={1} />
          <stop offset="0.55" style={{ stopColor: 'var(--atmosphere)' }} stopOpacity={0.45} />
          <stop offset="1" style={{ stopColor: 'var(--atmosphere)' }} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={warm}>
          <stop offset="0" style={{ stopColor: 'var(--lit-deep)' }} stopOpacity={0.16} />
          <stop offset="1" style={{ stopColor: 'var(--lit-deep)' }} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={glow}>
          <stop offset="0" style={{ stopColor: 'var(--lit)' }} stopOpacity={0.45} />
          <stop offset="0.4" style={{ stopColor: 'var(--lit)' }} stopOpacity={0.14} />
          <stop offset="1" style={{ stopColor: 'var(--lit)' }} stopOpacity={0} />
        </radialGradient>
      </defs>

      <ellipse
        cx={MAIN.cx}
        cy={MAIN.cy}
        rx={82}
        ry={56}
        transform={`rotate(-29 ${MAIN.cx} ${MAIN.cy})`}
        fill={`url(#${haze})`}
      />
      <ellipse
        cx={MAIN.cx + 4}
        cy={MAIN.cy - 2}
        rx={42}
        ry={26}
        transform={`rotate(-24 ${MAIN.cx} ${MAIN.cy})`}
        fill={`url(#${warm})`}
      />
      <ellipse
        cx={SMALL.cx}
        cy={SMALL.cy}
        rx={26}
        ry={18}
        transform={`rotate(23 ${SMALL.cx} ${SMALL.cy})`}
        fill={`url(#${haze})`}
      />

      <line
        x1={LINK.from.x}
        y1={LINK.from.y}
        x2={LINK.to.x}
        y2={LINK.to.y}
        style={{ stroke: 'var(--lit)' }}
        strokeOpacity={0.28}
        strokeWidth={0.6}
        strokeDasharray="1.6 2.4"
        strokeLinecap="round"
      />

      {FAINT_STARS.map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          style={{ fill: 'var(--on-sky-text)' }}
          fillOpacity={star.opacity}
        />
      ))}

      {LIT_STARS.map((star) => (
        <g
          key={`${star.x}-${star.y}`}
          className="sky-breathe"
          style={{ ['--breathe-duration' as string]: star.duration, animationDelay: star.delay }}
        >
          <circle cx={star.x} cy={star.y} r={star.size * 2.4} fill={`url(#${glow})`} />
          <path d={litStarPath(star.x, star.y, star.size)} style={{ fill: 'var(--lit)' }} fillOpacity={0.9} />
          <circle cx={star.x} cy={star.y} r={Math.max(0.9, star.size * 0.2)} style={{ fill: 'var(--lit-core)' }} />
        </g>
      ))}
    </svg>
  )
}
