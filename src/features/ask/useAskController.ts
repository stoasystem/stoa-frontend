import { useCallback } from 'react'
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
  setDraft: (draft: string) => void
  /** Typing in the docked composer on the planet. */
  openWithDraft: (draft: string) => void
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

  const openWithDraft = useCallback(
    (value: string) => {
      if (ownerId) storeOpenWithDraft(ownerId, value)
    },
    [ownerId, storeOpenWithDraft],
  )

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

  return {
    entry: direct ? 'direct' : 'planet',
    open: direct ? true : planetOpen,
    conversationId: direct ? directId : planetConversationId,
    draft,
    setDraft,
    openWithDraft,
    select,
    close,
  }
}
