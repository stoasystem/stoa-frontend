/**
 * Which system dictation the child's device offers, for the line beside the
 * Ask field (#515).
 *
 * STOA writes no speech code of its own (#494): the browsers' own recognition
 * sends the recording to Google, Microsoft or Apple, and STOA can sign no
 * processing agreement with them. The device's dictation types into the field
 * like a keyboard, so STOA only ever receives the text. All the field does is
 * say how to start it:
 *
 *   windows  Win + H
 *   mac      the microphone key
 *   touch    the microphone on the on-screen keyboard (iPhone, iPad, Android)
 *
 * Anything else (Linux, ChromeOS, an unknown agent) gets no line rather than
 * a guess.
 */
export type DictationPlatform = 'windows' | 'mac' | 'touch'

interface NavigatorLike {
  userAgent: string
  maxTouchPoints?: number
}

export function dictationPlatform(
  nav: NavigatorLike | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): DictationPlatform | null {
  if (!nav) return null
  const agent = nav.userAgent
  // Android says Linux too, so it is asked before the desktop systems.
  if (/Android|iPhone|iPad|iPod/i.test(agent)) return 'touch'
  // iPadOS asks for the desktop site and says Macintosh; only its touch points give it away.
  if (/Macintosh|Mac OS X/.test(agent)) return (nav.maxTouchPoints ?? 0) > 1 ? 'touch' : 'mac'
  if (/Windows/.test(agent)) return 'windows'
  return null
}
