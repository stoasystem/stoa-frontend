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
 * breathing, an ear twitch, and the pose's own movement. Off by default, and
 * under `prefers-reduced-motion: reduce` the figure holds still whatever the
 * prop says.
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
  /** Both paws up: a whole set finished. Bigger than `delighted`; rarer still. */
  | 'cheering'
  /** Holding an open star chart: loading, a lesson in progress. */
  | 'reading'
  /** Eyes closed, a few z's: nothing is due right now. */
  | 'sleeping'
  /** Head tilted, one ear up, a small question mark: `thinking`'s lighter cousin. */
  | 'curious'
  /** Upright, paws at the mouth: the marmot's alarm whistle. Something needs attention (reviews due). */
  | 'calling'

/** Every mood, in the order the gallery shows them. */
export const MURMI_MOODS = [
  'calm',
  'watching',
  'delighted',
  'thinking',
  'waving',
  'pointing',
  'cheering',
  'reading',
  'sleeping',
  'curious',
  'calling',
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

/* ---------------------------------------------------------------- head */

/** How the head sits on the body, per pose. */
const HEAD_POSE: Partial<Record<MurmiMood, string>> = {
  curious: 'rotate(-10 36 46)',
  sleeping: 'rotate(9 36 46)',
  pointing: 'rotate(4 36 46)',
  calling: 'translate(0 -2.5)',
}

/** Where the eyes look, per pose. */
const GAZE: Partial<Record<MurmiMood, [number, number]>> = {
  watching: [0.6, -0.6],
  thinking: [-0.6, -0.7],
  pointing: [0.9, 0],
  reading: [0, 0.9],
  curious: [0, -0.3],
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
  if (mood === 'delighted' || mood === 'cheering') {
    // Eyes closed in a smile: the one moment the face is not watching.
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
  if (mood === 'thinking') return <>{brow('M26.6 24.4 q3.2 -2 6.6 -0.6')}{brow('M38.8 24.6 q3.2 -0.6 6.6 0.2')}</>
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
  if (mood === 'thinking') {
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
        <ellipse cx="26.6" cy="36.2" rx="2.8" ry="1.7" fill={BLUSH} opacity="0.6" />
        <ellipse cx="45.4" cy="36.2" rx="2.8" ry="1.7" fill={BLUSH} opacity="0.6" />
        <Eyes mood={mood} full={full} />
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
function Limb({ d, at, full, r = [2.8, 2.4], angle = 0 }: {
  d: string
  at: [number, number]
  full: boolean
  r?: [number, number]
  angle?: number
}) {
  return (
    <>
      <path d={d} stroke={FUR_DARK} strokeWidth={full ? 4.4 : 4} strokeLinecap="round" fill="none" />
      {full && <path d={d} stroke={FUR} strokeWidth="2.6" strokeLinecap="round" fill="none" />}
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

/* ---------------------------------------------------------------- figure */

export function Murmi({
  mood = 'calm',
  size = 'var(--murmi-state)',
  animated = false,
  className,
}: {
  mood?: MurmiMood
  /** A number is a count of pixels; anything else is a CSS length, such as a token. */
  size?: number | string
  /** A quiet idle loop for the pose (blink, breath, the pose's own movement). Still under reduced motion. */
  animated?: boolean
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
  else if (mood === 'cheering') front = <Confetti full={full} />

  return (
    <svg
      viewBox="0 0 76 72"
      width={measured ? size : undefined}
      height={measured ? size : undefined}
      style={measured ? undefined : { width: size, height: size }}
      data-murmi={mood}
      data-murmi-detail={detail}
      data-murmi-animated={animated ? '' : undefined}
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', animated && 'murmi--animated', className)}
    >
      <g className={cn('murmi-part', mood === 'cheering' && 'murmi-bounce')}>
        {atScope && <TripodLegs full={full} />}
        <Body {...part} />
        {mood === 'reading' && <Book full={full} animated={animated} />}
        <Head {...part} />
        {front}
        <Arms {...part} />
      </g>
    </svg>
  )
}
