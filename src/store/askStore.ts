import { create } from 'zustand'

/**
 * Ask opened from the planet (#12 points 1 and 6, #49).
 *
 * On the planet pages Ask is not a route: typing in the docked composer opens
 * the panel (desktop) or the sheet (phone) over whichever layer of the planet
 * the student is on, and the address stays where it is. What is open lives
 * here, and in session storage, so a reload brings the same conversation back
 * and `useStreamingChat` can pick up a message that was still being answered.
 *
 * `/ask` and `/ask/:conversationId` read the conversation from the path
 * instead; only the draft passes through here there.
 *
 * Everything here belongs to one account (`ownerId`). Another account in the
 * same tab reads none of it, and signing out wipes it (`resetAsk`).
 */
type AskState = {
  /** Whose Ask this is. */
  ownerId: string | null
  open: boolean
  /** The open conversation on the planet; `null` shows the list. */
  conversationId: string | null
  /** What is in the composer; kept in memory only, never in storage. */
  draft: string
}

type AskActions = {
  /** Typing in the docked composer: open with what was typed. */
  openWithDraft: (ownerId: string, draft: string) => void
  select: (ownerId: string, conversationId: string | null) => void
  setDraft: (ownerId: string, draft: string) => void
  close: () => void
}

export const ASK_STORAGE_KEY = 'stoa_ask_panel'

type Persisted = Pick<AskState, 'ownerId' | 'open' | 'conversationId'>

const CLOSED: AskState = { ownerId: null, open: false, conversationId: null, draft: '' }

/** What a reload restores: which account's Ask was open, and on which conversation. */
export function readPersistedAsk(): Persisted {
  const closed: Persisted = { ownerId: null, open: false, conversationId: null }
  try {
    const raw = sessionStorage.getItem(ASK_STORAGE_KEY)
    if (!raw) return closed
    const value = JSON.parse(raw) as Partial<Persisted>
    return {
      ownerId: typeof value.ownerId === 'string' ? value.ownerId : null,
      open: value.open === true,
      conversationId: typeof value.conversationId === 'string' ? value.conversationId : null,
    }
  } catch {
    return closed
  }
}

function writePersisted(state: Persisted) {
  try {
    sessionStorage.setItem(ASK_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Without storage a reload closes Ask; the conversation itself is on the server.
  }
}

function forgetPersisted() {
  try {
    sessionStorage.removeItem(ASK_STORAGE_KEY)
  } catch {
    // Nothing was stored either.
  }
}

/** A different account starts from nothing: no conversation, no draft. */
function forOwner(state: AskState, ownerId: string): Partial<AskState> {
  return state.ownerId === ownerId ? {} : { ...CLOSED, ownerId }
}

export const useAskStore = create<AskState & AskActions>((set) => ({
  ...CLOSED,
  ...readPersistedAsk(),
  openWithDraft: (ownerId, draft) => set((state) => ({ ...forOwner(state, ownerId), open: true, draft })),
  select: (ownerId, conversationId) =>
    set((state) => ({ ...forOwner(state, ownerId), open: true, conversationId })),
  setDraft: (ownerId, draft) => set((state) => ({ ...forOwner(state, ownerId), draft })),
  close: () => set({ open: false }),
}))

useAskStore.subscribe((state, previous) => {
  if (state.ownerId === null) {
    forgetPersisted()
    return
  }
  if (
    state.ownerId !== previous.ownerId ||
    state.open !== previous.open ||
    state.conversationId !== previous.conversationId
  ) {
    writePersisted({ ownerId: state.ownerId, open: state.open, conversationId: state.conversationId })
  }
})

/**
 * Signing out: forget this account's Ask entirely, in memory and in storage,
 * so the next account on this tab finds no draft and no open conversation.
 */
export function resetAsk() {
  useAskStore.setState({ ...CLOSED })
  forgetPersisted()
}

/** Ask as this account left it; closed and empty for anyone else. */
export function askFor(state: AskState, ownerId: string | null) {
  const mine = ownerId !== null && state.ownerId === ownerId
  return {
    open: mine && state.open,
    conversationId: mine ? state.conversationId : null,
    draft: mine ? state.draft : '',
  }
}
