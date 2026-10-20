import type { ChatAttachment, ChatMessage, MessageQuote, PracticeContextRef } from '@/types/chat'

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
  /** Sent again as it was: the same command carries the same fields (#56). */
  practiceContext?: PracticeContextRef
  quote?: MessageQuote
  /**
   * Sent by `sendDetached` with no conversation on screen, and not yet known
   * to have reached the server: a tab that no longer has that request sends it
   * again with the same key, which the server takes as the same message (#263).
   */
  unconfirmed?: boolean
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
      ...(value.practiceContext ? { practiceContext: value.practiceContext } : {}),
      ...(value.quote ? { quote: value.quote } : {}),
      ...(value.unconfirmed === true ? { unconfirmed: true } : {}),
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
  pending: {
    idempotencyKey: string
    content: string
    askedAt: string
    practiceContext?: PracticeContextRef
    quote?: MessageQuote
  },
) {
  writePendingMessage(conversationId, pending)
}

/**
 * A message that did not go through, with what sending it again takes: kept
 * in the tab until the student sends it again or signs out, so a later answer,
 * another conversation or closing Ask does not wipe it (#326 K1).
 */
export type FailedMessage = {
  /** The student's bubble, `failed`, carrying its retry. */
  student: ChatMessage & {
    retryPayload: Omit<PendingMessage, 'askedAt' | 'idempotencyKey' | 'unconfirmed'> & { idempotencyKey?: string }
  }
  /** What stood in the answer's place, if anything. */
  answer?: ChatMessage
}

type StoredFailedMessage = FailedMessage & { owner: string }

export const FAILED_MESSAGE_KEY_PREFIX = 'stoa_failed_chat_messages:'
const failedKey = (conversationId: string) => `${FAILED_MESSAGE_KEY_PREFIX}${conversationId}`

function readStoredFailed(conversationId: string): StoredFailedMessage[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(failedKey(conversationId)) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter(
      (entry): entry is StoredFailedMessage =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as StoredFailedMessage).owner === 'string' &&
        typeof (entry as StoredFailedMessage).student?.id === 'string' &&
        typeof (entry as StoredFailedMessage).student?.retryPayload?.content === 'string',
    )
  } catch {
    return []
  }
}

function writeStoredFailed(conversationId: string, entries: StoredFailedMessage[]) {
  try {
    if (entries.length > 0) {
      sessionStorage.setItem(failedKey(conversationId), JSON.stringify(entries))
    } else {
      sessionStorage.removeItem(failedKey(conversationId))
    }
  } catch {
    // Without storage the failed message lasts as long as the conversation is open.
  }
}

/**
 * The conversation's failed messages, oldest first: only `owner`'s, the
 * account that wrote them. Nobody signed in reads none.
 */
export function readFailedMessages(conversationId: string, owner: string | null | undefined): FailedMessage[] {
  if (!owner) return []
  return readStoredFailed(conversationId)
    .filter((entry) => entry.owner === owner)
    .map(({ student, answer }) => (answer ? { student, answer } : { student }))
}

/** Keep `failed` for `owner`, in place of an earlier record of the same bubble. */
export function keepFailedMessage(conversationId: string, owner: string | null | undefined, failed: FailedMessage) {
  if (!owner) return
  writeStoredFailed(conversationId, [
    ...readStoredFailed(conversationId).filter((entry) => entry.student.id !== failed.student.id),
    { ...failed, owner },
  ])
}

/** Forget the failed message whose student bubble is `studentMessageId`. */
export function dropFailedMessage(conversationId: string, studentMessageId: string) {
  writeStoredFailed(
    conversationId,
    readStoredFailed(conversationId).filter((entry) => entry.student.id !== studentMessageId),
  )
}

/**
 * Signing out: the questions still waiting for an answer, and the ones that
 * did not go through, are this account's words, and must not be left in the
 * tab for the next one.
 */
export function clearPendingMessages() {
  try {
    const keys: string[] = []
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index)
      if (key?.startsWith(PENDING_MESSAGE_KEY_PREFIX) || key?.startsWith(FAILED_MESSAGE_KEY_PREFIX)) keys.push(key)
    }
    for (const key of keys) sessionStorage.removeItem(key)
  } catch {
    // Without storage nothing was kept.
  }
}
