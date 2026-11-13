/*
 * What the onboarding sequel (#586) keeps about Ask, in this tab only.
 *
 * Whether a student is new to Ask is read from the server -- the
 * conversations they have (ADR 0003, as the first landing reads the sky) --
 * so nothing here says "seen the tour". One convenience is kept in this tab's
 * sessionStorage, one key per account: the practice stage's tip, waved away,
 * does not come back in this tab.
 */

const TIP_KEY = 'stoa.ask.stageTip.dismissed'

export function stageTipDismissed(ownerId: string): boolean {
  try {
    return sessionStorage.getItem(`${TIP_KEY}.${ownerId}`) === '1'
  } catch {
    return false
  }
}

export function dismissStageTip(ownerId: string) {
  try {
    sessionStorage.setItem(`${TIP_KEY}.${ownerId}`, '1')
  } catch {
    // Storage refused: the tip simply comes back next time.
  }
}

/*
 * Ask's first-time tour (#677): Murmi points at the microphone, the + and
 * "Ask a teacher" in turn, the first time Ask opens for a student new to Ask.
 * Whether it is due is read from the server (no conversation before this
 * open); how far it got is kept here, in this tab only, one key per account:
 * the step it is on once begun, and `done` once over (its end, Skip or
 * Escape). The practice stage's tip reads it too: once the tour has begun in
 * this tab, the tip does not come to make the photo point again.
 */
export type AskTourStep = 'mic' | 'add' | 'teacher'
/** `null`: never begun in this tab. */
export type AskTourProgress = AskTourStep | 'done' | null

const TOUR_KEY = 'stoa.ask.tour'
const TOUR_VALUES: readonly string[] = ['mic', 'add', 'teacher', 'done']
const tourListeners = new Set<() => void>()
/** What this tab holds when storage refuses it: the tour still ends, in this tab's memory. */
const tourMemory = new Map<string, AskTourProgress>()

export function askTourProgress(ownerId: string | null): AskTourProgress {
  if (!ownerId) return null
  try {
    const value = sessionStorage.getItem(`${TOUR_KEY}.${ownerId}`)
    if (value !== null) return TOUR_VALUES.includes(value) ? (value as AskTourProgress) : null
    return null
  } catch {
    return tourMemory.get(ownerId) ?? null
  }
}

export function setAskTourProgress(ownerId: string, progress: Exclude<AskTourProgress, null>) {
  tourMemory.set(ownerId, progress)
  try {
    sessionStorage.setItem(`${TOUR_KEY}.${ownerId}`, progress)
  } catch {
    // Storage refused: kept in this tab's memory only.
  }
  for (const listener of tourListeners) listener()
}

/** For `useSyncExternalStore`: told whenever the tour moves on. */
export function subscribeAskTour(listener: () => void) {
  tourListeners.add(listener)
  return () => {
    tourListeners.delete(listener)
  }
}
