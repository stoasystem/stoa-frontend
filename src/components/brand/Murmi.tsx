/*
 * Murmi, the observatory marmot (step 5 of the combined design).
 *
 * An alpine marmot, because it is the animal of this country's mountains and
 * the word has the same root in all four languages. At a telescope, because a
 * marmot floating in space would be a cartoon pasted onto an astronomy theme —
 * and because Switzerland does in fact watch the sky from the top of its
 * mountains. The two halves of the product meet in one character rather than
 * sitting next to each other.
 *
 * Drawn here rather than shipped as an image: every expression and pose comes
 * out of the same shapes and costs nothing to add, the colours are tokens so it
 * follows the theme, and it stays sharp at any size without a second file per
 * density.
 *
 * The marmot in it: a darker cap over the crown, a pale muzzle with a proper
 * nose and the two front teeth, whiskers, inner ears, short dark paws held at
 * the chest, feet, and a short tail with a dark tip. Below 40px (and at
 * `--murmi-inline`) the hair-thin parts — whiskers, teeth, highlights, the
 * telescope's rings, the text in the book — are left out and the strokes that
 * stay are thicker, so the small figure is a clean shape rather than mush.
 *
 * `animated` gives each pose a quiet idle loop in CSS (murmi.css): a blink,
 * breathing, an ear twitch, and the pose's own movement. `entrance` is the
 * one-shot instead: the figure pops up into place, plays its pose's movement
 * once, and rests (for a notice that appears, such as the usage period
 * banner, #616). Both are off by default, and under
 * `prefers-reduced-motion: reduce` the figure holds still in its resting pose
 * whatever the props say.
 *
 * It is decorative. Everything Murmi is used to say is also said in text, so
 * the figure carries `aria-hidden` and a reader who never sees it misses
 * nothing.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import '@/components/brand/murmi.css'

export type MurmiMood =
  /** Beside an empty state, a greeting, the quiet moments. */
  | 'calm'
  /** At the telescope: a lesson is waiting, something is worth looking at. */
  | 'watching'
  /** A knowledge point has just lit. The one big expression at the telescope; used sparingly. */
  | 'delighted'
  /** An answer was wrong. Not disappointed — looking again, paw at the chin. */
  | 'thinking'
  /** A greeting: one paw raised. The first screen of the day, a welcome. */
  | 'waving'
  /** A paw pointing to the side, toward the star it suggests next. */
  | 'pointing'
  /**
   * One arm reaching out and down, a digit pointing at what is below and to
   * the right; the other paw under the muzzle, three thought dots rising
   * beside the head; eyes on the place it points to: "tell me here" over
   * Ask's composer (#586). `thinking`'s face, `pointing`'s paw turned down.
   */
  | 'guiding'
  /** Both paws up: a whole set finished. Bigger than `delighted`; rarer still. */
  | 'cheering'
  /** A star quiz passed with a slip: well done, not the big one. Paws clapping at the chest. */
  | 'clapping'
  /** Holding an open star chart: loading, a lesson in progress. */
  | 'reading'
  /** Eyes closed, a few z's: nothing is due right now. */
  | 'sleeping'
  /** Head tilted, one ear up, a small question mark: `thinking`'s lighter cousin. */
  | 'curious'
  /** Upright, paws at the mouth: the marmot's alarm whistle. Something needs attention (reviews due). */
  | 'calling'
  /**
   * Round glasses, a slate held up with three step marks: the `concise` answer
   * style. Focused, never stern: the usual smile stays.
   */
  | 'steps'
  /** Eyes smiling shut, cheeks warm, a glowing star held out in both paws: the `encouraging` answer style. */
  | 'offering'
  /** An apple in one paw, a ringed planet in the other, a bulb overhead: the `vivid` answer style (an analogy). */
  | 'storytelling'
  /**
   * A small hourglass held in both paws, looked at attentively (not worried):
   * the usage period ends soon (#616). Moving, the sand runs down and the glass
   * is turned over once.
   */
  | 'hourglass'
  /** A sealed letter held out in both paws, smiling: the usage period has ended, ask to renew it (#616). */
  | 'letter'

/** Every mood, in the order the gallery shows them. */
export const MURMI_MOODS = [
  'calm',
  'watching',
  'delighted',
  'thinking',
  'waving',
  'pointing',
  'guiding',
  'cheering',
  'clapping',
  'reading',
  'sleeping',
  'curious',
  'calling',
  'steps',
  'offering',
  'storytelling',
  'hourglass',
  'letter',
] as const satisfies readonly MurmiMood[]

const FUR = 'var(--murmi-fur)'
const FUR_DARK = 'var(--murmi-fur-dark)'
const BELLY = 'var(--murmi-belly)'
const INK = 'var(--murmi-ink)'
const CROWN = 'var(--murmi-crown)'
const MUZZLE = 'var(--murmi-muzzle)'
const BLUSH = 'var(--murmi-blush)'
const EAR = 'var(--murmi-ear)'
const TOOTH = 'var(--murmi-tooth)'
const PAW = 'var(--murmi-paw)'
const SCOPE = 'var(--murmi-scope)'
const BRASS = 'var(--murmi-brass)'
const PAGE = 'var(--murmi-page)'
const MARK = 'var(--murmi-mark)'
const GLOW = 'var(--murmi-glow)'
const APPLE = 'var(--murmi-apple)'
const LEAF = 'var(--murmi-leaf)'
/** The sky's lit colour; on a light page, where --lit is not defined, the streak's gold. */
const LIT = 'var(--lit, var(--star))'

/** Whether the hair-thin parts are drawn. */
type Detail = 'full' | 'simple'

/** Below 40px a unit of the drawing is under half a pixel: the fine parts go. */
function detailFor(size: number | string): Detail {
  if (typeof size === 'number') return size < 40 ? 'simple' : 'full'
  return size.includes('--murmi-inline') ? 'simple' : 'full'
}

type Part = { mood: MurmiMood; full: boolean }

/** A four-pointed sparkle centred on (x, y). */
function sparkle(x: number, y: number, s: number) {
  return `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`
}

/** A five-pointed star centred on (x, y), outer radius `r`. */
function star(x: number, y: number, r: number) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 ? r * 0.46 : r
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    return `${(x + radius * Math.cos(angle)).toFixed(2)} ${(y + radius * Math.sin(angle)).toFixed(2)}`
  })
  return `M${points.join('L')}Z`
}

/** A box with rounded corners, as a path. */
function roundedBox(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`
}

/* ---------------------------------------------------------------- head */

/** How the head sits on the body, per pose. */
const HEAD_POSE: Partial<Record<MurmiMood, string>> = {
  curious: 'rotate(-10 36 46)',
  sleeping: 'rotate(9 36 46)',
  pointing: 'rotate(4 36 46)',
  guiding: 'rotate(6 36 46)',
  calling: 'translate(0 -2.5)',
  hourglass: 'rotate(4 36 46)',
  letter: 'rotate(-4 36 46)',
}

/** Where the eyes look, per pose. */
const GAZE: Partial<Record<MurmiMood, [number, number]>> = {
  watching: [0.6, -0.6],
  thinking: [-0.6, -0.7],
  pointing: [0.9, 0],
  guiding: [1, 1.1],
  reading: [0, 0.9],
  curious: [0, -0.3],
  clapping: [0, -0.4],
  hourglass: [0.2, 0.9],
}

function Ears({ mood, full }: Part) {
  const left =
    mood === 'sleeping' ? 'rotate(-10 24.3 17.6) translate(0 0.8)' : mood === 'calling' ? 'translate(0 -1)' : undefined
  const right =
    mood === 'sleeping'
      ? 'rotate(10 47.7 17.6) translate(0 0.8)'
      : mood === 'calling'
        ? 'translate(0 -1)'
        : mood === 'curious'
          ? 'translate(0.8 -1.8) rotate(14 47.7 17.6)'
          : undefined
  const ear = (cx: number, inner: number) => (
    <>
      <ellipse cx={cx} cy="17.6" rx="5.4" ry="5.6" fill={FUR_DARK} />
      <ellipse cx={inner} cy="18.2" rx={full ? 3 : 2.6} ry={full ? 3.2 : 2.8} fill={EAR} />
    </>
  )
  return (
    <>
      <g transform={left}>{ear(24.3, 24.8)}</g>
      <g transform={right}>
        {/* The one that twitches. */}
        <g className="murmi-part murmi-ear">{ear(47.7, 47.2)}</g>
      </g>
    </>
  )
}

function Eyes({ mood, full }: Part) {
  const stroke = full ? 2.2 : 2.6
  if (mood === 'delighted' || mood === 'cheering' || mood === 'offering') {
    // Eyes closed in a smile: the big moment, and the warm one (offering).
    return (
      <>
        <path d="M26.5 29 q3.5 -3.5 7 0" stroke={INK} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        <path d="M38.5 29 q3.5 -3.5 7 0" stroke={INK} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'sleeping') {
    // Lids down, curving the other way from the smile.
    return (
      <>
        <path d="M26.8 29.4 q3.2 2.4 6.4 0" stroke={INK} strokeWidth={stroke * 0.85} fill="none" strokeLinecap="round" />
        <path d="M38.8 29.4 q3.2 2.4 6.4 0" stroke={INK} strokeWidth={stroke * 0.85} fill="none" strokeLinecap="round" />
      </>
    )
  }
  const [dx, dy] = GAZE[mood] ?? [0, 0]
  return (
    <g transform={dx || dy ? `translate(${dx} ${dy})` : undefined}>
      <g className={cn('murmi-part', mood === 'reading' && 'murmi-scan')}>
        <g className="murmi-part murmi-eyes">
          <circle cx="30" cy="29" r="3.1" fill={INK} />
          <circle cx="42" cy="29" r="3.1" fill={INK} />
          <circle cx="31.1" cy="27.9" r="1.1" fill="#fff" />
          <circle cx="43.1" cy="27.9" r="1.1" fill="#fff" />
          {full && (
            <>
              <circle cx="29.1" cy="30.1" r="0.45" fill="#fff" />
              <circle cx="41.1" cy="30.1" r="0.45" fill="#fff" />
            </>
          )}
        </g>
      </g>
    </g>
  )
}

function Brows({ mood, full }: Part) {
  const brow = (d: string) => (
    <path d={d} stroke={CROWN} strokeWidth={full ? 1.2 : 1.6} fill="none" strokeLinecap="round" />
  )
  if (mood === 'thinking' || mood === 'guiding') return <>{brow('M26.6 24.4 q3.2 -2 6.6 -0.6')}{brow('M38.8 24.6 q3.2 -0.6 6.6 0.2')}</>
  if (mood === 'curious') return brow('M38.8 23.6 q3.4 -2.2 6.8 -0.4')
  if (mood === 'calling') return <>{brow('M26.4 23.8 q3.4 -2 6.8 -0.6')}{brow('M45.6 23.8 q-3.4 -2 -6.8 -0.6')}</>
  return null
}

/** The two front teeth: the marmot's own trait. Too fine to survive below 40px. */
function Teeth({ y = 38 }: { y?: number }) {
  const tooth = (x: number) => `M${x} ${y} h1.7 v2.5 q0 .7 -.7 .7 h-.3 q-.7 0 -.7 -.7 z`
  return (
    <>
      <path d={tooth(34.2)} fill={TOOTH} stroke={INK} strokeWidth="0.45" strokeLinejoin="round" />
      <path d={tooth(36.1)} fill={TOOTH} stroke={INK} strokeWidth="0.45" strokeLinejoin="round" />
    </>
  )
}

function Mouth({ mood, full }: Part) {
  const width = full ? 1.2 : 1.6
  const line = (d: string) => (
    <path d={d} stroke={INK} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  )
  if (mood === 'delighted' || mood === 'cheering') {
    return (
      <>
        <path d="M31.5 37.4 q4.5 7 9 0 q-4.5 1.2 -9 0 z" fill={INK} />
        <ellipse cx="36" cy="41.4" rx="2" ry="1" fill={BLUSH} />
        {full && <Teeth y={37.7} />}
      </>
    )
  }
  if (mood === 'clapping' || mood === 'storytelling') {
    // Storytelling: mid-sentence. Clapping: open and smiling, eyes open: pleased, a size smaller than cheering's beam.
    return (
      <>
        <path d="M32.8 37.6 q3.2 4.4 6.4 0 q-3.2 0.9 -6.4 0 z" fill={INK} />
        {full && <Teeth y={37.8} />}
      </>
    )
  }
  if (mood === 'calling') {
    // A round mouth: the whistle.
    return (
      <>
        <ellipse cx="36" cy="40.3" rx="1.9" ry="2.3" fill={INK} />
        {full && <Teeth y={37.6} />}
      </>
    )
  }
  if (mood === 'sleeping') return line('M34.2 38.6 q1.8 1.2 3.6 0')
  if (mood === 'thinking' || mood === 'guiding') {
    // A small sideways mouth: considering it, not sad. Nothing here frowns.
    return (
      <>
        {full && <Teeth y={37.6} />}
        {line('M36 36.3 v1.1')}
        {line('M32.6 40.6 q4 2 7 -0.5')}
      </>
    )
  }
  return (
    <>
      {full && <Teeth />}
      {line('M36 36.3 v1.4 M31.8 37.2 q2.1 1.9 4.2 0.5 q2.1 1.4 4.2 -0.5')}
    </>
  )
}

/** Small round glasses: the concise one. Scope blue, so they read as kit, not as a frown. */
function Glasses({ full }: { full: boolean }) {
  const rim = full ? 0.95 : 1.3
  return (
    <>
      <circle cx="30" cy="29" r="4.6" fill="#fff" fillOpacity="0.16" stroke={SCOPE} strokeWidth={rim} />
      <circle cx="42" cy="29" r="4.6" fill="#fff" fillOpacity="0.16" stroke={SCOPE} strokeWidth={rim} />
      <path d="M34.6 28.6 q1.4 -1.1 2.8 0" stroke={SCOPE} strokeWidth={rim} fill="none" strokeLinecap="round" />
      {full && (
        <path
          d="M26.6 27.2 a3.8 3.8 0 0 1 2.2 -2.4 M38.6 27.2 a3.8 3.8 0 0 1 2.2 -2.4"
          stroke="#fff"
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.75"
          fill="none"
        />
      )}
    </>
  )
}

function Head({ mood, full }: Part) {
  return (
    <g transform={HEAD_POSE[mood]}>
      <g className={cn('murmi-part', mood === 'curious' && 'murmi-tilt')}>
        <Ears mood={mood} full={full} />
        <circle cx="36" cy="30" r="16" fill={FUR} />
        {/* The dark cap over the crown, coming to a soft point between the eyes. */}
        <path d="M21.2 24 A16 16 0 0 1 50.8 24 Q43 19.2 36 21.6 Q29 19.2 21.2 24 Z" fill={CROWN} />
        {full && <path d="M33.6 33 Q34.6 26 36 23.4 Q37.4 26 38.4 33 Z" fill={MUZZLE} opacity="0.7" />}
        <ellipse cx="36" cy="37.6" rx="7.6" ry="5.6" fill={MUZZLE} />
        {mood === 'offering' ? (
          // Warmer cheeks: the encouraging one.
          <>
            <ellipse cx="26.4" cy="35.8" rx="3.4" ry="2.1" fill={BLUSH} opacity="0.95" />
            <ellipse cx="45.6" cy="35.8" rx="3.4" ry="2.1" fill={BLUSH} opacity="0.95" />
          </>
        ) : (
          <>
            <ellipse cx="26.6" cy="36.2" rx="2.8" ry="1.7" fill={BLUSH} opacity="0.6" />
            <ellipse cx="45.4" cy="36.2" rx="2.8" ry="1.7" fill={BLUSH} opacity="0.6" />
          </>
        )}
        <Eyes mood={mood} full={full} />
        {mood === 'steps' && <Glasses full={full} />}
        <Brows mood={mood} full={full} />
        <Mouth mood={mood} full={full} />
        <path d="M33.5 33.7 q2.5 -1.5 5 0 q-0.3 2.1 -2.5 2.7 q-2.2 -0.6 -2.5 -2.7 z" fill={INK} />
        {full && (
          <>
            <ellipse cx="35.2" cy="33.9" rx="0.9" ry="0.45" fill="#fff" opacity="0.7" />
            <path
              d="M28.6 37 l-5.4 -1.4 M28.6 38.6 l-5.6 0.6 M43.4 37 l5.4 -1.4 M43.4 38.6 l5.6 0.6"
              stroke={FUR_DARK}
              strokeWidth="0.55"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
      </g>
    </g>
  )
}

/* ---------------------------------------------------------------- body */

function Body({ mood, full }: Part) {
  const tall = mood === 'calling'
  return (
    <>
      {/* A short tail with a dark tip, behind on the left. */}
      <ellipse cx="19" cy="61" rx="7" ry="3.4" fill={FUR_DARK} transform="rotate(28 19 61)" />
      <ellipse cx="13.6" cy="58.1" rx="3" ry="2.6" fill={CROWN} transform="rotate(28 13.6 58.1)" />
      <g className={cn('murmi-part murmi-breath')}>
        <ellipse cx="36" cy={tall ? 50 : 51} rx={tall ? 17.5 : 18} ry={tall ? 17 : 16} fill={FUR} />
        {full && <path d="M47.5 39.5 q8.5 10 1 25 q4.5 -12.5 -1 -25 z" fill={FUR_DARK} opacity="0.55" />}
        <ellipse cx="36" cy="54.5" rx={tall ? 11 : 11.5} ry="10.5" fill={BELLY} />
      </g>
      <ellipse cx="28.5" cy="66.6" rx="5" ry="2.5" fill={PAW} />
      <ellipse cx="43.5" cy="66.6" rx="5" ry="2.5" fill={PAW} />
    </>
  )
}

/** An arm from the shoulder along `d`, ending in a paw at `at`. */
function Limb({ d, at, full, r = [2.8, 2.4], angle = 0, thick = false }: {
  d: string
  at: [number, number]
  full: boolean
  r?: [number, number]
  angle?: number
  /** A heavier arm, for one that has to read at a small size (`guiding`'s pointing arm). */
  thick?: boolean
}) {
  return (
    <>
      <path d={d} stroke={FUR_DARK} strokeWidth={(full ? 4.4 : 4) + (thick ? 1.2 : 0)} strokeLinecap="round" fill="none" />
      {full && <path d={d} stroke={FUR} strokeWidth={thick ? 3.4 : 2.6} strokeLinecap="round" fill="none" />}
      <ellipse
        cx={at[0]}
        cy={at[1]}
        rx={r[0]}
        ry={r[1]}
        fill={PAW}
        transform={angle ? `rotate(${angle} ${at[0]} ${at[1]})` : undefined}
      />
    </>
  )
}

const REST_LEFT = { d: 'M23.4 46.6 Q25.4 50.4 29.8 48.8', at: [30.8, 48.2] as [number, number] }
const REST_RIGHT = { d: 'M48.6 46.6 Q46.6 50.4 42.2 48.8', at: [41.2, 48.2] as [number, number] }

function Arms({ mood, full }: Part) {
  switch (mood) {
    case 'thinking':
      return (
        <>
          <Limb {...REST_LEFT} full={full} />
          {/* Paw at the chin. */}
          <Limb d="M48.6 46.6 Q48.5 44.5 43.2 43.6" at={[42.2, 43.4]} full={full} />
        </>
      )
    case 'guiding':
      // One paw up under the muzzle (thinking); the other reaches out and down
      // past the body, one digit out at the tip, at what is below and to the right.
      return (
        <>
          <Limb d="M23.4 46.6 Q22.4 41.8 30.4 42.4" at={[31.6, 42.2]} r={[3, 2.6]} full={full} />
          <g className="murmi-part murmi-point-down">
            <Limb d="M48.6 45.4 Q57.4 46.4 61.6 53" at={[62.8, 54.8]} r={[3.8, 3.2]} angle={40} full={full} thick />
            {/* The one digit out, down and to the right. */}
            <path d="M65 57.4 l3 3.4" stroke={PAW} strokeWidth={full ? 2.6 : 3.2} strokeLinecap="round" fill="none" />
          </g>
          {/* "Here": three short marks fanning out past the fingertip. */}
          <path
            className="murmi-part murmi-twinkle"
            d="M70.6 60.4 l3 -0.6 M71.4 63.6 l2.6 1.6 M68.8 64.8 l0.6 2.8"
            stroke={MARK}
            strokeWidth={full ? 1.4 : 2}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )
    case 'watching':
    case 'delighted':
      return (
        <>
          <Limb {...REST_LEFT} full={full} />
          {/* A paw on the tripod. */}
          <Limb d="M48.8 46 Q53.5 43 55 37.8" at={[55.4, 36.8]} full={full} />
        </>
      )
    case 'waving':
      return (
        <>
          <g className="murmi-part murmi-wave">
            <Limb d="M23.5 46 Q15.5 43.5 14 33.5" at={[13.8, 31.6]} r={[3, 3.4]} full={full} />
          </g>
          <Limb {...REST_RIGHT} full={full} />
        </>
      )
    case 'pointing':
      return (
        <>
          <Limb {...REST_LEFT} full={full} />
          <g className="murmi-part murmi-point">
            <Limb d="M48.5 46 Q56 44 61.5 41" at={[63, 40.3]} r={[3, 2.4]} angle={-20} full={full} />
            <path d="M64.6 39.4 l4 -1.6" stroke={PAW} strokeWidth="1.9" strokeLinecap="round" fill="none" />
          </g>
        </>
      )
    case 'cheering':
      return (
        <>
          <Limb d="M24 45 Q16.5 38 15.5 27.5" at={[15.4, 25.6]} r={[3, 3.4]} full={full} />
          <Limb d="M48 45 Q55.5 38 56.5 27.5" at={[56.6, 25.6]} r={[3, 3.4]} full={full} />
        </>
      )
    case 'clapping':
      // Paws meeting at mid-chest; each arm claps from its own shoulder (murmi.css).
      return (
        <>
          <g className="murmi-part murmi-clap murmi-clap-l">
            <Limb d="M23.5 46.5 Q26 50.6 32.6 49.8" at={[33.9, 49.2]} r={[2.4, 3.1]} angle={-12} full={full} />
          </g>
          <g className="murmi-part murmi-clap murmi-clap-r">
            <Limb d="M48.5 46.5 Q46 50.6 39.4 49.8" at={[38.1, 49.2]} r={[2.4, 3.1]} angle={12} full={full} />
          </g>
        </>
      )
    case 'reading':
      return (
        <>
          <Limb d="M23.5 46.5 Q22 50 24 53" at={[24.4, 53.2]} r={[2.7, 2.4]} full={full} />
          <Limb d="M48.5 46.5 Q50 50 48 53" at={[47.6, 53.2]} r={[2.7, 2.4]} full={full} />
        </>
      )
    case 'curious':
      return (
        <>
          <Limb {...REST_LEFT} full={full} />
          <Limb d="M48.6 46.6 Q52.5 44 50.6 39.6" at={[50.2, 38.6]} full={full} />
        </>
      )
    case 'steps':
      return (
        <>
          <Limb {...REST_LEFT} full={full} />
          {/* Holding the slate up by its lower corner. */}
          <Limb d="M48.6 46.6 Q51.5 48.4 54.4 46.6" at={[55.2, 45.8]} r={[2.6, 2.9]} full={full} />
        </>
      )
    case 'offering':
      // Both paws out in front, cupped under the star.
      return (
        <>
          <Limb d="M23.5 46.5 Q23.4 55 28.6 56" at={[29.8, 55.6]} r={[3, 2.4]} angle={18} full={full} />
          <Limb d="M48.5 46.5 Q48.6 55 43.4 56" at={[42.2, 55.6]} r={[3, 2.4]} angle={-18} full={full} />
        </>
      )
    case 'storytelling':
      // The apple held up on one side, the planet on the other.
      return (
        <>
          <Limb d="M23.5 46 Q16.5 44.2 15 36.6" at={[14.8, 35]} r={[3, 3]} full={full} />
          <Limb d="M48.5 46 Q55.5 44.2 57 36.6" at={[57.2, 35]} r={[3, 3]} full={full} />
        </>
      )
    case 'hourglass':
      // A paw either side of the frame, at the glass's waist.
      return (
        <>
          <Limb d="M23.5 46.5 Q24.2 52.8 28.6 53" at={[29.8, 52.6]} r={[2.4, 3]} full={full} />
          <Limb d="M48.5 46.5 Q47.8 52.8 43.4 53" at={[42.2, 52.6]} r={[2.4, 3]} full={full} />
        </>
      )
    case 'letter':
      // Both paws under the letter's lower corners; they lift with it (murmi.css).
      return (
        <g className="murmi-part murmi-hand">
          <Limb d="M23.5 46.5 Q23.4 55 28.4 57" at={[29.4, 57]} r={[3, 2.4]} angle={14} full={full} />
          <Limb d="M48.5 46.5 Q48.6 55 43.6 57" at={[42.6, 57]} r={[3, 2.4]} angle={-14} full={full} />
        </g>
      )
    case 'calling':
      // Paws at the mouth.
      return (
        <>
          <Limb d="M23.5 44.5 Q22.5 39 29.4 38" at={[30.4, 37.8]} r={[2.5, 3]} full={full} />
          <Limb d="M48.5 44.5 Q49.5 39 42.6 38" at={[41.6, 37.8]} r={[2.5, 3]} full={full} />
        </>
      )
    default:
      return (
        <>
          <Limb {...REST_LEFT} full={full} />
          <Limb {...REST_RIGHT} full={full} />
        </>
      )
  }
}

/* --------------------------------------------------------------- props */

/** The tripod's legs, behind everything. */
function TripodLegs({ full }: { full: boolean }) {
  return (
    <path
      d="M59 20.5 L52.5 67 M59 20.5 L59.5 67.5 M59 20.5 L66 67"
      stroke={SCOPE}
      strokeWidth={full ? 1.6 : 2.8}
      strokeLinecap="round"
      fill="none"
    />
  )
}

/** The tube, and what it is pointed at. */
function Telescope({ mood, full }: Part) {
  return (
    <>
      <g transform="rotate(-35 52 24)">
        {/* Eyepiece, tube, dew shield. */}
        <path d="M48.4 22.6 h3.8 v2.8 h-3.8 z" fill={SCOPE} />
        <rect x="52" y="20.9" width="17" height="6.2" rx="2" fill={SCOPE} />
        <path d="M65.5 20.2 h4 a0.8 0.8 0 0 1 0.8 0.8 v6 a0.8 0.8 0 0 1 -0.8 0.8 h-4 z" fill={SCOPE} />
        {full && (
          <>
            <path d="M52.2 21.4 v5.2 M65.2 20.6 v6.8" stroke={BRASS} strokeWidth="0.9" fill="none" />
            <path d="M70.3 21.8 v4.4" stroke={LIT} strokeWidth="0.8" strokeLinecap="round" fill="none" />
          </>
        )}
      </g>
      <circle cx="59" cy="19.6" r={full ? 1.3 : 1.6} fill={BRASS} />
      {mood === 'delighted' && <circle cx="70.5" cy="9.2" r="5.5" fill={LIT} opacity="0.25" />}
      <g className="murmi-part murmi-twinkle">
        <circle cx="70.5" cy="9.2" r="3" fill={LIT} />
        {full && <path d="M70.5 4.4 v9.6 M65.7 9.2 h9.6" stroke={LIT} strokeWidth="0.7" opacity="0.7" fill="none" />}
      </g>
      {mood === 'delighted' && (
        <g className="murmi-part murmi-twinkle murmi-late">
          <path d={sparkle(63, 4.5, 2)} fill={LIT} />
          <path d={sparkle(74, 18.5, 1.6)} fill={LIT} />
        </g>
      )}
    </>
  )
}

/** An open star chart held at the chest. */
function Book({ full, animated }: { full: boolean; animated: boolean }) {
  return (
    <>
      <path d="M22.5 47.5 L36 49.8 L49.5 47.5 L49.5 58.6 L36 61 L22.5 58.6 Z" fill={SCOPE} />
      <path d="M23.8 47.4 Q30 47.6 36 49.6 L36 59.6 Q30 57.6 23.8 57.4 Z" fill={PAGE} />
      <path d="M48.2 47.4 Q42 47.6 36 49.6 L36 59.6 Q42 57.6 48.2 57.4 Z" fill={PAGE} />
      <path d="M36 49.6 V59.6" stroke={FUR_DARK} strokeWidth={full ? 0.5 : 0.8} fill="none" />
      {full && (
        <>
          <path
            d="M26 50.4 q4 .3 7.6 1.6 M26 52.6 q4 .3 7.6 1.6 M26 54.8 q3 .2 5.5 1.1"
            stroke={FUR_DARK}
            strokeWidth="0.55"
            opacity="0.7"
            fill="none"
          />
          <path d="M39.6 52.6 L43.5 51 L45.5 54.2 L41.8 55.8" stroke={SCOPE} strokeWidth="0.45" fill="none" />
          <circle cx="39.6" cy="52.6" r="0.7" fill={SCOPE} />
          <circle cx="45.5" cy="54.2" r="0.7" fill={SCOPE} />
          <circle cx="41.8" cy="55.8" r="0.7" fill={SCOPE} />
        </>
      )}
      <circle cx="43.5" cy="51" r={full ? 1 : 1.4} fill={LIT} />
      {/* A page turning now and then; only drawn when it can move. */}
      {animated && (
        <path className="murmi-part murmi-flip" d="M36 49.6 Q42 47.6 48.2 47.4 L48.2 57.4 Q42 57.6 36 59.6 Z" fill={PAGE} />
      )}
    </>
  )
}

function Sleep({ full }: { full: boolean }) {
  const z = (x: number, y: number, s: number, n: number) => (
    <path
      className={`murmi-part murmi-z murmi-z-${n}`}
      d={`M${x} ${y} h${s} l${-s} ${s} h${s}`}
      stroke={MARK}
      strokeWidth={full ? 1.1 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  )
  return (
    <>
      {z(54, 13, 2.6, 1)}
      {z(59, 7, 3.4, 2)}
      {z(65, 1.2, 4.2, 3)}
    </>
  )
}

function Question({ full }: { full: boolean }) {
  return (
    <g className="murmi-part murmi-twinkle">
      <path
        d="M58.5 12.2 q0 -4.2 4.3 -4.2 q4.3 0 4.3 3.8 q0 2.6 -3.3 3.6 q-1 .4 -1 1.8 v.8"
        stroke={MARK}
        strokeWidth={full ? 1.6 : 2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="62.8" cy="21" r={full ? 1.05 : 1.3} fill={MARK} />
      {full && <path d={sparkle(55.5, 5.5, 1.6)} fill={LIT} />}
    </g>
  )
}

/** Three dots rising beside the head, away from the pointing paw: thinking it over. Large enough to stay at 48px. */
function ThoughtDots({ full }: { full: boolean }) {
  const grow = full ? 0 : 0.3
  return (
    <g className="murmi-part murmi-twinkle">
      <circle cx="16.8" cy="21" r={1.5 + grow} fill={MARK} />
      <circle cx="12.6" cy="14.4" r={2.1 + grow} fill={MARK} />
      <circle cx="9.6" cy="6.4" r={2.8 + grow} fill={MARK} />
    </g>
  )
}

function Whistle({ full }: { full: boolean }) {
  const lines = (d: string, side: 'l' | 'r') => (
    <path
      className={`murmi-part murmi-whistle murmi-whistle-${side}`}
      d={d}
      stroke={MARK}
      strokeWidth={full ? 1.4 : 1.9}
      strokeLinecap="round"
      fill="none"
    />
  )
  return (
    <>
      {lines('M17 21 l-5.5 -3.2 M15.5 27.5 h-6.4 M17 34 l-5.5 3.2', 'l')}
      {lines('M55 21 l5.5 -3.2 M56.5 27.5 h6.4 M55 34 l5.5 3.2', 'r')}
    </>
  )
}

/** Two short marks either side of the chest: the sound of the clap. */
function Clap({ full }: { full: boolean }) {
  const marks = (d: string, side: 'l' | 'r') => (
    <path
      className={`murmi-part murmi-clap-mark murmi-clap-mark-${side}`}
      d={d}
      stroke={MARK}
      strokeWidth={full ? 1.4 : 1.9}
      strokeLinecap="round"
      fill="none"
    />
  )
  return (
    <>
      {marks('M16.6 44.6 l-3.6 -2.8 M15.6 50 l-4.4 -0.4', 'l')}
      {marks('M55.4 44.6 l3.6 -2.8 M56.4 50 l4.4 -0.4', 'r')}
    </>
  )
}

function Confetti({ full }: { full: boolean }) {
  return (
    <>
      <g className="murmi-part murmi-twinkle">
        <path d={sparkle(7.5, 13, 2.6)} fill={LIT} />
        <path d={sparkle(66, 9, 3)} fill={LIT} />
      </g>
      {full && (
        <g className="murmi-part murmi-twinkle murmi-late">
          <path d={sparkle(68.5, 26, 2)} fill={LIT} />
          <path d={sparkle(5.5, 31, 1.8)} fill={LIT} />
        </g>
      )}
    </>
  )
}

/** A slate held up beside the head, with 1 · 2 · 3 drawn on it in strokes (no font). */
function Slate({ full }: { full: boolean }) {
  return (
    <g className="murmi-part murmi-tap">
      <path d="M54 30 h16 a2 2 0 0 1 2 2 v12 a2 2 0 0 1 -2 2 h-16 a2 2 0 0 1 -2 -2 v-12 a2 2 0 0 1 2 -2 z" fill={BRASS} />
      <path
        d="M54.4 31.3 h15.2 a1.1 1.1 0 0 1 1.1 1.1 v11.2 a1.1 1.1 0 0 1 -1.1 1.1 h-15.2 a1.1 1.1 0 0 1 -1.1 -1.1 v-11.2 a1.1 1.1 0 0 1 1.1 -1.1 z"
        fill={SCOPE}
      />
      {full && (
        <>
          <path
            d={[
              // 1
              'M55.5 36.6 l1.2 -1.1 v5',
              // 2
              'M60.7 36.6 q0.3 -1.1 1.4 -1.1 q1.4 0 1.4 1.3 q0 0.9 -0.8 1.6 l-2.1 2.1 h3',
              // 3
              'M66.7 35.9 q0.5 -0.4 1.3 -0.4 q1.3 0 1.3 1.2 q0 1.2 -1.5 1.3 q1.7 0 1.7 1.3 q0 1.2 -1.5 1.2 q-0.9 0 -1.4 -0.5',
            ].join(' ')}
            stroke={PAGE}
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="58.6" cy="38" r="0.55" fill={PAGE} />
          <circle cx="65.1" cy="38" r="0.55" fill={PAGE} />
        </>
      )}
    </g>
  )
}

/** A star held out in both paws, in a soft glow. */
function Offering({ full }: { full: boolean }) {
  return (
    <>
      <circle className="murmi-part murmi-glow" cx="36" cy="49.4" r="9.4" fill={GLOW} opacity="0.4" />
      <path d={star(36, 49.6, 6.2)} fill={GLOW} stroke={CROWN} strokeWidth={full ? 0.7 : 1} strokeLinejoin="round" />
      {full && (
        <g className="murmi-part murmi-twinkle">
          <path d={sparkle(17.5, 40, 1.8)} fill={LIT} />
          <path d={sparkle(55, 39, 1.5)} fill={LIT} />
        </g>
      )}
    </>
  )
}

/** An apple, a ringed planet, and the bulb of the idea that one is like the other. */
function Analogy({ full }: { full: boolean }) {
  const thin = full ? 0.8 : 1.1
  const ring = full ? 1.1 : 1.5
  return (
    <>
      {/* The apple, held up on the left. */}
      <g transform="translate(14.6 33) scale(1.2) translate(-14.6 -33)">
      <path
        d="M14.6 26.6 q-1.4 -1 -2.8 -0.4 q-2.3 1 -1.9 4 q.5 3.3 3.2 3.7 q.8 .1 1.5 -.3 q.7 .4 1.5 .3 q2.7 -.4 3.2 -3.7 q.4 -3 -1.9 -4 q-1.4 -.6 -2.8 .4 z"
        fill={APPLE}
      />
      <path d="M14.6 26.8 q.1 -1.6 1.1 -2.6" stroke={PAW} strokeWidth={thin} strokeLinecap="round" fill="none" />
      {full && (
        <>
          <ellipse cx="17.2" cy="24.6" rx="1.4" ry="0.65" fill={LEAF} transform="rotate(-28 17.2 24.6)" />
          <ellipse cx="12.4" cy="28.6" rx="0.7" ry="1.1" fill="#fff" opacity="0.5" transform="rotate(25 12.4 28.6)" />
        </>
      )}
      </g>
      {/* The planet, held up on the right: ring behind, ball, ring in front. */}
      <g transform="rotate(-18 57.6 29)">
        <ellipse cx="57.6" cy="29" rx="7.4" ry="2.1" stroke={MARK} strokeWidth={ring} fill="none" />
        <circle cx="57.6" cy="29" r="4.1" fill={SCOPE} />
        <path d="M50.2 29 A7.4 2.1 0 0 0 65 29" stroke={MARK} strokeWidth={ring} fill="none" />
      </g>
      {full && (
        <path d="M55 27 a3 3 0 0 1 2.3 -1.4" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" fill="none" />
      )}
      {/* The bulb over the head. */}
      <g className="murmi-part murmi-bulb">
        <circle cx="36" cy="5.4" r="3.4" fill={GLOW} stroke={CROWN} strokeWidth={full ? 0.6 : 0.9} />
        {full && (
          <path
            d="M30.2 5.4 h-2 M41.8 5.4 h2 M31.6 1.6 l-1.4 -1.1 M40.4 1.6 l1.4 -1.1"
            stroke={MARK}
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </g>
      <path d="M34.4 8.4 h3.2 v2.2 q0 .8 -.8 .8 h-1.6 q-.8 0 -.8 -.8 z" fill={SCOPE} />
    </>
  )
}

/** Where the hourglass's waist sits: the frame is symmetric about it, so turning it over leaves the same shape. */
const HOURGLASS_Y = 52.4

/**
 * A small hourglass in scope blue with cream glass and gold sand. The frame and
 * glass turn over as one group; the sand is a group of its own that fades out
 * while the glass turns and back in as it was, so it never hangs the wrong way
 * up. Below 40px the posts, the falling stream and the glint go.
 */
function Hourglass({ full }: { full: boolean }) {
  const y = HOURGLASS_Y
  const line = full ? 0.75 : 1.05
  return (
    <>
      <g className="murmi-part murmi-turn">
        <path
          d={`M31.6 ${y - 5.6} h8.8 q0 3.4 -4 5.6 q4 2.2 4 5.6 h-8.8 q0 -3.4 4 -5.6 q-4 -2.2 -4 -5.6 z`}
          fill={PAGE}
          stroke={SCOPE}
          strokeWidth={line}
          strokeLinejoin="round"
        />
        {full && (
          <>
            <path
              d={`M30.3 ${y - 5.6} V${y + 5.6} M41.7 ${y - 5.6} V${y + 5.6}`}
              stroke={SCOPE}
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
            />
            <path d={`M33 ${y - 4.6} q0.2 2 1.6 3.2`} stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.8" fill="none" />
          </>
        )}
        {/* The two caps (paths, not rects: a rect is the telescope's tube). */}
        <path d={roundedBox(29, y - 7.4, 14, 2, 0.9)} fill={SCOPE} />
        <path d={roundedBox(29, y + 5.4, 14, 2, 0.9)} fill={SCOPE} />
      </g>
      <g className="murmi-part murmi-sand">
        <path
          className="murmi-part murmi-sand-top"
          d={`M32.3 ${y - 3.4} h7.4 q-0.6 2.3 -3.7 3.2 q-3.1 -0.9 -3.7 -3.2 z`}
          fill={MARK}
        />
        {full && (
          <path
            className="murmi-part murmi-stream"
            d={`M36 ${y - 0.2} V${y + 4.4}`}
            stroke={MARK}
            strokeWidth="0.6"
            strokeLinecap="round"
            fill="none"
          />
        )}
        <path className="murmi-part murmi-sand-bottom" d={`M32.2 ${y + 5.3} q3.8 -3.6 7.6 0 z`} fill={MARK} />
      </g>
    </>
  )
}

/**
 * A sealed letter, cream with a crown outline so it holds on paper as on the
 * sky, and a red seal where the flap meets. The flap stays at every size (it is
 * what makes it a letter rather than a card); the lower fold lines and the
 * sparkle are full detail only.
 */
function Letter({ full }: { full: boolean }) {
  const line = full ? 0.75 : 1.05
  return (
    <>
      <g className="murmi-part murmi-hand">
        <g transform="rotate(-6 36 52)">
          <path d={roundedBox(26.6, 45.6, 18.8, 12.6, 1.2)} fill={PAGE} stroke={CROWN} strokeWidth={line} />
          {full && (
            <path
              d="M27.4 57.4 L33.4 52.6 M44.6 57.4 L38.6 52.6"
              stroke={CROWN}
              strokeWidth="0.55"
              strokeLinecap="round"
              opacity="0.6"
              fill="none"
            />
          )}
          <path d="M27 46.2 L36 53 L45 46.2" stroke={CROWN} strokeWidth={line} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="36" cy="53" r={full ? 1.9 : 2.3} fill={APPLE} />
        </g>
      </g>
      {full && <path className="murmi-part murmi-twinkle murmi-glint" d={sparkle(57.5, 41.5, 2.4)} fill={LIT} />}
    </>
  )
}

/* ---------------------------------------------------------------- figure */

export function Murmi({
  mood = 'calm',
  size = 'var(--murmi-state)',
  animated = false,
  facing = 'right',
  entrance = false,
  className,
}: {
  mood?: MurmiMood
  /** A number is a count of pixels; anything else is a CSS length, such as a token. */
  size?: number | string
  /** A quiet idle loop for the pose (blink, breath, the pose's own movement). Still under reduced motion. */
  animated?: boolean
  /**
   * Which way the figure looks and points. Drawn facing right; `left` mirrors
   * it on an inner group, so the box, its size and its data attributes stay.
   */
  facing?: 'left' | 'right'
  /**
   * A one-shot entrance for a notice that appears: the figure pops up into
   * place, plays its pose's movement once, and rests in the pose it is drawn
   * in (about two seconds). Never loops. Under reduced motion it is simply
   * there, at rest. Replay it by remounting (a new `key`).
   */
  entrance?: boolean
  className?: string
}) {
  const measured = typeof size === 'number'
  const detail = detailFor(size)
  const full = detail === 'full'
  const part = { mood, full }
  const atScope = mood === 'watching' || mood === 'delighted'
  let front: ReactNode = null
  if (atScope) front = <Telescope {...part} />
  else if (mood === 'sleeping') front = <Sleep full={full} />
  else if (mood === 'curious') front = <Question full={full} />
  else if (mood === 'calling') front = <Whistle full={full} />
  else if (mood === 'guiding') front = <ThoughtDots full={full} />
  else if (mood === 'cheering') front = <Confetti full={full} />
  else if (mood === 'clapping') front = <Clap full={full} />
  else if (mood === 'steps') front = <Slate full={full} />
  else if (mood === 'offering') front = <Offering full={full} />
  else if (mood === 'storytelling') front = <Analogy full={full} />
  else if (mood === 'hourglass') front = <Hourglass full={full} />
  else if (mood === 'letter') front = <Letter full={full} />

  const figure = (
    <g className={cn('murmi-part', mood === 'cheering' && 'murmi-bounce')}>
      {atScope && <TripodLegs full={full} />}
      <Body {...part} />
      {mood === 'reading' && <Book full={full} animated={animated} />}
      <Head {...part} />
      {front}
      <Arms {...part} />
    </g>
  )

  return (
    <svg
      viewBox="0 0 76 72"
      width={measured ? size : undefined}
      height={measured ? size : undefined}
      style={measured ? undefined : { width: size, height: size }}
      data-murmi={mood}
      data-murmi-detail={detail}
      data-murmi-animated={animated ? '' : undefined}
      data-murmi-facing={facing}
      data-murmi-entrance={entrance ? '' : undefined}
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', animated && 'murmi--animated', entrance && 'murmi--entrance', className)}
    >
      {/* The mirror is its own group: the part inside may take a CSS transform, which would replace it. */}
      <g transform={facing === 'left' ? 'matrix(-1 0 0 1 76 0)' : undefined}>
        {/* The entrance's rise is a group of its own too, outside the pose's own movement. */}
        {entrance ? <g className="murmi-part murmi-rise">{figure}</g> : figure}
      </g>
    </svg>
  )
}
