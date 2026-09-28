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
 * instead; only the draft and the first message of a new conversation pass
 * through here there, because those outlive the route change from `/ask` to
 * `/ask/:id`.
 */
export type AskQueuedMessage = { conversationId: string; content: string }

type AskState = {
  /** Whose Ask this is; a different account in the same tab starts closed. */
  ownerId: string | null
  open: boolean
  /** The open conversation on the planet; `null` shows the list. */
  conversationId: string | null
  /** What is in the panel's composer. */
  draft: string
  /** The first message of a conversation just created, sent once it is open. */
  queued: AskQueuedMessage | null
}

type AskActions = {
  /** Typing in the docked composer: open with what was typed. */
  openWithDraft: (ownerId: string, draft: string) => void
  select: (ownerId: string, conversationId: string | null) => void
  setDraft: (draft: string) => void
  queue: (message: AskQueuedMessage | null) => void
  close: () => void
}

export const ASK_STORAGE_KEY = 'stoa_ask_panel'

type Persisted = Pick<AskState, 'ownerId' | 'open' | 'conversationId'>

function readPersisted(): Persisted {
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

export const useAskStore = create<AskState & AskActions>((set) => ({
  ...readPersisted(),
  draft: '',
  queued: null,
  openWithDraft: (ownerId, draft) =>
    set((state) => ({
      ownerId,
      open: true,
      draft,
      // Another account's conversation is not this one's to show.
      conversationId: state.ownerId === ownerId ? state.conversationId : null,
    })),
  select: (ownerId, conversationId) => set({ ownerId, open: true, conversationId }),
  setDraft: (draft) => set({ draft }),
  queue: (queued) => set({ queued }),
  close: () => set({ open: false }),
}))

useAskStore.subscribe((state, previous) => {
  if (
    state.ownerId !== previous.ownerId ||
    state.open !== previous.open ||
    state.conversationId !== previous.conversationId
  ) {
    writePersisted({ ownerId: state.ownerId, open: state.open, conversationId: state.conversationId })
  }
})

/** Ask on the planet as this account left it: closed for anyone else. */
export function planetAskFor(state: AskState, ownerId: string | null) {
  const mine = ownerId !== null && state.ownerId === ownerId
  return {
    open: mine && state.open,
    conversationId: mine ? state.conversationId : null,
  }
}
