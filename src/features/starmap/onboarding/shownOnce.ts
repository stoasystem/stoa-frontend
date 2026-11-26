/*
 * Hints shown once per account (#747): the star clusters' panorama hint and
 * the route scene's tour. Kept in localStorage, one key per account, like
 * the review reminder's day (`reviewReminder.ts`): a hint seen once is not
 * shown again on this browser, whoever else signs in on it sees their own.
 * Storage refused or missing (a private window, blocked site data) is
 * treated as "not seen yet": the hint may come back, the page works.
 */

/** The hints, by name: the panorama's "the map is in clusters now", the route scene's tour. */
export type OnceHint = 'clusterHint' | 'routeTour'

export function onceKey(hint: OnceHint, ownerId: string): string {
  return `stoa.starmap.${hint}.${ownerId}`
}

export function shownBefore(hint: OnceHint, ownerId: string): boolean {
  try {
    return localStorage.getItem(onceKey(hint, ownerId)) === '1'
  } catch {
    return false
  }
}

export function markShown(hint: OnceHint, ownerId: string): void {
  try {
    localStorage.setItem(onceKey(hint, ownerId), '1')
  } catch {
    // Storage refused: the hint may come back next time.
  }
}
