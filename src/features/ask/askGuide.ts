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
