import { readPendingMessage, writePendingMessage, type PendingMessage } from '@/lib/pendingChatMessages'
import { streamConversationMessage } from '@/services/chat/chatStreamApi'

/**
 * The sends still on their way in this tab, by idempotency key: the
 * conversation, opened meanwhile, waits for their answer instead of sending
 * the same message a second time.
 */
const inFlight = new Map<string, Promise<void>>()

/** The send of this message still on its way in this tab, if there is one. */
export function detachedSendFor(idempotencyKey: string): Promise<void> | undefined {
  return inFlight.get(idempotencyKey)
}

/**
 * Send a message into a conversation whether or not anything is showing it
 * (#263). Ask holds a question with a quote or a file until
 * `POST /conversations` has made the conversation it goes into, and the
 * student may close Ask before that; the question must still go out, and go
 * into that conversation only.
 *
 * It is kept as the conversation's pending message first, so opening the
 * conversation -- now, later, or after a reload -- shows it waiting for its
 * answer, as with the first question `POST /conversations` carries itself.
 */
export function sendDetached(conversationId: string, pending: PendingMessage) {
  writePendingMessage(conversationId, { ...pending, unconfirmed: true })
  const sent = streamConversationMessage({
    conversationId,
    payload: {
      content: pending.content,
      attachmentIds: pending.attachmentIds,
      idempotencyKey: pending.idempotencyKey,
      ...(pending.practiceContext ? { practiceContext: pending.practiceContext } : {}),
      ...(pending.quote ? { quote: pending.quote } : {}),
    },
    onEvent: () => {},
  }).then(
    () => {
      // The server has it: from here on it is waited for, never sent again.
      // Unless the conversation has settled it, or signing out cleared it.
      const kept = readPendingMessage(conversationId)
      if (kept?.idempotencyKey === pending.idempotencyKey && kept.unconfirmed) {
        writePendingMessage(conversationId, { ...kept, unconfirmed: undefined })
      }
    },
    () => {
      // Left unconfirmed: opening the conversation sends it again, same key.
    },
  )
  const tracked = sent.finally(() => inFlight.delete(pending.idempotencyKey))
  inFlight.set(pending.idempotencyKey, tracked)
  return tracked
}
