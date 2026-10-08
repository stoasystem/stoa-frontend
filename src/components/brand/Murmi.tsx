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
 * Drawn here rather than shipped as an image: four expressions out of the same
 * shapes cost nothing to add, the colours are tokens so it follows the theme,
 * and it stays sharp at any size without a second file per density.
 *
 * It is decorative. Everything Murmi is used to say is also said in text, so
 * the figure carries `aria-hidden` and a reader who never sees it misses
 * nothing.
 */
import { cn } from '@/lib/utils'

export type MurmiMood =
  /** Beside an empty state, a greeting, the quiet moments. */
  | 'calm'
  /** At the telescope: a lesson is waiting, something is worth looking at. */
  | 'watching'
  /** A knowledge point has just lit. The one big expression; used sparingly. */
  | 'delighted'
  /** An answer was wrong. Not disappointed — looking again. */
  | 'thinking'

const FUR = 'var(--murmi-fur)'
const FUR_DARK = 'var(--murmi-fur-dark)'
const BELLY = 'var(--murmi-belly)'
const INK = 'var(--murmi-ink)'

/** Eyes, mouth and brow per mood. The body never changes. */
function Face({ mood }: { mood: MurmiMood }) {
  const open = mood !== 'delighted'
  return (
    <>
      {open ? (
        <>
          <circle cx="30" cy="29" r="3.1" fill={INK} />
          <circle cx="42" cy="29" r="3.1" fill={INK} />
          <circle cx="31.1" cy="27.9" r="1.1" fill="#fff" />
          <circle cx="43.1" cy="27.9" r="1.1" fill="#fff" />
        </>
      ) : (
        // Eyes closed in a smile: the one moment the face is not watching.
        <>
          <path d="M26.5 29 q3.5 -3.5 7 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M38.5 29 q3.5 -3.5 7 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )}
      <ellipse cx="36" cy="36" rx="4.6" ry="3.4" fill={FUR_DARK} />
      {mood === 'thinking' ? (
        // A small sideways mouth: considering it, not sad. Nothing here frowns.
        <path d="M32 41 q4 2 7 -0.5" stroke={FUR_DARK} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M30 40 q6 5 12 0" stroke={FUR_DARK} strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
    </>
  )
}

export function Murmi({
  mood = 'calm',
  size = 'var(--murmi-state)',
  className,
}: {
  mood?: MurmiMood
  /** A number is a count of pixels; anything else is a CSS length, such as a token. */
  size?: number | string
  className?: string
}) {
  const measured = typeof size === 'number'
  return (
    <svg
      viewBox="0 0 76 72"
      width={measured ? size : undefined}
      height={measured ? size : undefined}
      style={measured ? undefined : { width: size, height: size }}
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <ellipse cx="36" cy="50" rx="19" ry="17" fill={FUR} />
      <ellipse cx="36" cy="54" rx="12" ry="11" fill={BELLY} />
      <circle cx="36" cy="30" r="16" fill={FUR} />
      <ellipse cx="25" cy="19" rx="6" ry="6.5" fill={FUR_DARK} />
      <ellipse cx="47" cy="19" rx="6" ry="6.5" fill={FUR_DARK} />
      <Face mood={mood} />
      {(mood === 'watching' || mood === 'delighted') && (
        <>
          {/* The telescope, and what it is pointed at. */}
          <rect x="46" y="21" width="23" height="7" rx="3.5" fill="var(--murmi-scope)" transform="rotate(-27 46 21)" />
          <circle cx="68" cy="10" r="4" fill="var(--lit)" />
          {mood === 'delighted' && <circle cx="68" cy="10" r="8" fill="var(--lit)" opacity="0.25" />}
        </>
      )}
    </svg>
  )
}
