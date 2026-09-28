import type { ChatAttachment } from '@/types/chat'

/**
 * One message on its way: what was asked, and the idempotency key that makes
 * it one command on the server however often it is sent. Kept in session
 * storage while unanswered, so a reload picks the same command up again.
 *
 * Its own module, with no React in it, so signing out can clear these without
 * pulling the streaming hook into every role's shell.
 */
export type PendingMessage = {
  idempotencyKey: string
  content: string
  attachmentIds?: string[]
  attachments?: ChatAttachment[]
  askedAt: string
}

export const PENDING_MESSAGE_KEY_PREFIX = 'stoa_pending_chat_message:'
const pendingKey = (conversationId: string) => `${PENDING_MESSAGE_KEY_PREFIX}${conversationId}`

export function readPendingMessage(conversationId: string): PendingMessage | null {
  try {
    const raw = sessionStorage.getItem(pendingKey(conversationId))
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PendingMessage>
    if (typeof value.idempotencyKey !== 'string' || typeof value.content !== 'string') return null
    return {
      idempotencyKey: value.idempotencyKey,
      content: value.content,
      attachmentIds: value.attachmentIds,
      attachments: value.attachments,
      askedAt: typeof value.askedAt === 'string' ? value.askedAt : new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

export function writePendingMessage(conversationId: string, pending: PendingMessage | null) {
  try {
    if (pending) {
      sessionStorage.setItem(pendingKey(conversationId), JSON.stringify(pending))
    } else {
      sessionStorage.removeItem(pendingKey(conversationId))
    }
  } catch {
    // Without storage a reload loses the wait, not the message.
  }
}

/**
 * A message the server already has but has not answered yet -- the first one
 * of a conversation, sent with `POST /conversations` itself -- so the
 * conversation waits for its answer as it would after a reload, instead of
 * sending it.
 */
export function rememberPendingMessage(
  conversationId: string,
  pending: { idempotencyKey: string; content: string; askedAt: string },
) {
  writePendingMessage(conversationId, pending)
}

/**
 * Signing out: the questions still waiting for an answer are this account's
 * words, and must not be left in the tab for the next one.
 */
export function clearPendingMessages() {
  try {
    const keys: string[] = []
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index)
      if (key?.startsWith(PENDING_MESSAGE_KEY_PREFIX)) keys.push(key)
    }
    for (const key of keys) sessionStorage.removeItem(key)
  } catch {
    // Without storage nothing was kept.
  }
}
