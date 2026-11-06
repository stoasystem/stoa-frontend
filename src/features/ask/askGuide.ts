/*
 * What the onboarding sequel (#586) keeps about Ask, in this tab only.
 *
 * Whether a student is new to Ask is read from the server -- the
 * conversations they have (ADR 0003, as the first landing reads the sky) --
 * so nothing here says "seen the tour". Two conveniences are kept in this
 * tab's sessionStorage, one key per account:
 *
 *   - the conversations started from an example on the first landing ("Find
 *     my own star"): that is the onboarding talking, not the student asking
 *     on their own, so it does not count against the practice stage's tip;
 *   - the practice stage's tip, waved away: not again in this tab.
 */

const GUIDE_KEY = 'stoa.ask.guideConversations'
const TIP_KEY = 'stoa.ask.stageTip.dismissed'

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Storage refused: the tip simply comes back next time.
  }
}

/** The conversations the onboarding started for this account in this tab. */
export function guideConversations(ownerId: string): Set<string> {
  try {
    const value = JSON.parse(read(`${GUIDE_KEY}.${ownerId}`) ?? '[]') as unknown
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

/** A conversation started from one of the first landing's examples. */
export function rememberGuideConversation(ownerId: string, conversationId: string) {
  const known = guideConversations(ownerId)
  known.add(conversationId)
  write(`${GUIDE_KEY}.${ownerId}`, JSON.stringify([...known]))
}

/** Whether the student has asked anything of their own: a conversation the onboarding did not start. */
export function hasAskedOwnQuestion(ownerId: string, conversations: readonly { id: string }[]): boolean {
  const guide = guideConversations(ownerId)
  return conversations.some((conversation) => !guide.has(conversation.id))
}

export function stageTipDismissed(ownerId: string): boolean {
  return read(`${TIP_KEY}.${ownerId}`) === '1'
}

export function dismissStageTip(ownerId: string) {
  write(`${TIP_KEY}.${ownerId}`, '1')
}
