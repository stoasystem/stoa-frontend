import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { askPathFor, roleHomePaths } from '@/app/router/routeManifest'
import type { AskEntry } from '@/features/ask/askLayout'
import { askFor, useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'

/** `/ask` or `/ask/:conversationId`: the id comes from the path, and only from it. */
export type AskRoute = { conversationId: string | null }

export type AskController = {
  entry: AskEntry
  open: boolean
  /** The open conversation; `null` shows the conversation list. */
  conversationId: string | null
  draft: string
  /** The draft now, outside a render (after a request has come back). */
  readDraft: () => string
  setDraft: (draft: string) => void
  /** Typing in the docked composer on the planet. */
  openWithDraft: (draft: string) => void
  /**
   * Open Ask again on whatever it last had open (#125): the conversation the
   * student was reading, not a new empty one. The draft is left as it is.
   */
  reopen: () => void
  /** Open a conversation, or `null` to go back to the list. */
  select: (conversationId: string | null) => void
  close: () => void
}

/**
 * One way to drive Ask, whichever way it was opened.
 *
 * From the planet, what is open is kept in the Ask store and the address does
 * not change. Opened at `/ask` or `/ask/:id`, the path says which conversation
 * is open: choosing one goes to its address, the back arrow to `/ask`, and
 * closing to `/` (#49, 2026-09-28 review).
 */
export function useAskController(route?: AskRoute): AskController {
  const navigate = useNavigate()
  const ownerId = useAuthStore((state) => state.user?.id ?? null)
  // Primitive reads: a selector that builds an object is a new snapshot on
  // every render, which zustand 5 refuses. Each is this account's only.
  const planetOpen = useAskStore((state) => askFor(state, ownerId).open)
  const planetConversationId = useAskStore((state) => askFor(state, ownerId).conversationId)
  const draft = useAskStore((state) => askFor(state, ownerId).draft)
  const storeSetDraft = useAskStore((state) => state.setDraft)
  const storeOpenWithDraft = useAskStore((state) => state.openWithDraft)
  const storeSelect = useAskStore((state) => state.select)
  const storeClose = useAskStore((state) => state.close)
  const direct = route !== undefined
  const directId = route?.conversationId ?? null

  const setDraft = useCallback(
    (value: string) => {
      if (ownerId) storeSetDraft(ownerId, value)
    },
    [ownerId, storeSetDraft],
  )

  const readDraft = useCallback(() => askFor(useAskStore.getState(), ownerId).draft, [ownerId])

  const openWithDraft = useCallback(
    (value: string) => {
      if (ownerId) storeOpenWithDraft(ownerId, value)
    },
    [ownerId, storeOpenWithDraft],
  )

  const reopen = useCallback(() => {
    if (ownerId) storeOpenWithDraft(ownerId, askFor(useAskStore.getState(), ownerId).draft)
  }, [ownerId, storeOpenWithDraft])

  const select = useCallback(
    (conversationId: string | null) => {
      if (direct) {
        navigate(askPathFor(conversationId))
        return
      }
      if (ownerId) storeSelect(ownerId, conversationId)
    },
    [direct, navigate, ownerId, storeSelect],
  )

  const close = useCallback(() => {
    storeClose()
    if (direct) navigate(roleHomePaths.student)
  }, [direct, navigate, storeClose])

  // The same object until something in it changes, so what is built on it --
  // the stage's controller, the hosts' callbacks -- changes only then (#416).
  const open = direct ? true : planetOpen
  const conversationId = direct ? directId : planetConversationId
  return useMemo<AskController>(
    () => ({
      entry: direct ? 'direct' : 'planet',
      open,
      conversationId,
      draft,
      readDraft,
      setDraft,
      openWithDraft,
      reopen,
      select,
      close,
    }),
    [close, conversationId, direct, draft, open, openWithDraft, readDraft, reopen, select, setDraft],
  )
}
