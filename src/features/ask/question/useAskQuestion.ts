import { useRef } from 'react'
import { quoteField, type AskPractice, type AskQuote } from '@/features/ask/practiceContext'
import { serverAskQuestionAdapter, type AskQuestionAdapter } from '@/features/ask/question/askQuestionAdapter'
import { heldQuestionKey, initialQuestionKey } from '@/features/ask/question/questionKeys'
import type { AttachmentBatch } from '@/features/uploads/useAttachments'
import { useCreateConversationMutation } from '@/hooks/chat/useCreateConversationMutation'
import {
  readPendingMessage,
  rememberPendingMessage,
  toStreamPayload,
  trackSending,
  writePendingMessage,
  type PendingMessage,
} from '@/lib/pendingChatMessages'
import { ApiError } from '@/services/api/httpClient'
import { isSameSession, storedRefreshToken } from '@/services/auth/sessionRefresh'
import type { StreamMessagePayload } from '@/services/chat/chatStreamApi'
import { currentSessionToken } from '@/store/authStore'
import type { ChatAttachment, PracticeContextRef } from '@/types/chat'

/** One question, as the student sent it. */
export type AskedQuestion = {
  content: string
  /** The passage 「问这段」 put aside for it (#263). */
  quote?: AskQuote | null
  /** The files taken for it; `sent()` is called once it is on its way. */
  files: Pick<AttachmentBatch, 'references' | 'attachments' | 'sent'>
  /** The exercise on screen, whose ids go out with it (#56). */
  practice?: AskPractice | null
}

/**
 * Where the question went: into a conversation, which may now be opened, or
 * nowhere -- the conversation could not be made, or the session it was asked
 * in is no longer this tab's.
 */
export type AskOutcome = { kind: 'opened'; conversationId: string } | { kind: 'failed'; error: unknown }

/** Sending into the open conversation: `useStreamingChat`'s `sendStreamingMessage`. */
export type SendInConversation = (
  payload: Omit<StreamMessagePayload, 'idempotencyKey'> & { attachments?: ChatAttachment[] },
) => unknown

export type AskQuestion = {
  ask(question: AskedQuestion): Promise<AskOutcome>
  /** Whether a question sent now would go out: not while one is being started or answered. */
  canAsk(): boolean
  /** A conversation is being made for a question. */
  starting: boolean
  /** Why the last conversation could not be made, until the next question is on its way. */
  startError: Error | null
}

type RefusedConversation = {
  id: string
  subject: string
  grade: string
  content: string
  practiceContext?: PracticeContextRef
}

/** The session the question was asked in, as `useStreamingChat`'s `runAttempt` tells it (ADR 0002, 0003). */
function askedInThisSession() {
  const sender = currentSessionToken()
  const senderRefresh = storedRefreshToken()
  return () => currentSessionToken() === sender || (sender !== null && isSameSession(senderRefresh))
}

const sessionChanged = () => new Error('The session the question was asked in is no longer this tab’s.')

/**
 * Asking a question (#562): one way in for all four ways a question goes out.
 *
 * - Into the open conversation: `sendStreamingMessage` answers it there.
 * - From the list: `POST /conversations` carries it as its first question,
 *   answered under `initial-<id>`.
 * - From the list with a quote or a file, which that request cannot carry:
 *   the conversation starts empty and the question is sent into it under
 *   `held-<id>`, whether or not Ask is still open by then (#263).
 * - A refused first question asked again as it was: into the conversation the
 *   refusal named, under `initial-<id>` (#327 K4) -- that question only (#370).
 *
 * The question is the signed-in person's: once the tab holds another session,
 * nothing of it is written, sent or remembered (ADR 0002, 0003).
 */
export function useAskQuestion({
  subject,
  grade,
  conversationId,
  sendStreamingMessage,
  isStreaming,
  adapter = serverAskQuestionAdapter,
}: {
  /** The subject a new conversation is about. */
  subject: string
  /** The student's year group, as conversations take it. */
  grade: string
  /** The conversation on screen; `null` on the list. */
  conversationId: string | null
  sendStreamingMessage: SendInConversation
  /** An answer is being written in the open conversation. */
  isStreaming: boolean
  adapter?: AskQuestionAdapter
}): AskQuestion {
  // The question `POST /conversations` is carrying now: when it was asked, and
  // in which session.
  const askingRef = useRef<{ askedAt: string; owns: () => boolean } | null>(null)
  // The first question goes out with the conversation itself, so it is sent
  // exactly when the student sends it: never later, and not lost if Ask closes
  // or the page reloads before the conversation opens. It is remembered as a
  // message waiting for its answer, which the conversation picks up when it
  // opens (after a reload too).
  const createConversation = useCreateConversationMutation({
    create: adapter.createConversation,
    onCreated: (created, payload) => {
      if (!payload.initialMessage) return
      const asking = askingRef.current
      if (asking && !asking.owns()) return
      rememberPendingMessage(created.id, {
        idempotencyKey: initialQuestionKey(created.id),
        content: payload.initialMessage,
        askedAt: asking?.askedAt ?? new Date().toISOString(),
        // The same fields the server took it with, or sending it again under
        // the same key is refused as a different message (#327 K3).
        ...(payload.practiceContext ? { practiceContext: payload.practiceContext } : {}),
      })
    },
  })
  // Two sends in one tick would start two conversations.
  const creatingRef = useRef(false)
  // The conversation a refused first question left behind (#327 K4): asking
  // that question again goes into it, not into another empty one.
  const refusedRef = useRef<RefusedConversation | null>(null)

  const canAsk = () => (conversationId ? !isStreaming : !creatingRef.current && !createConversation.isPending)

  /**
   * Sent into a conversation as a message of its own -- into that
   * conversation only, and whether or not anything shows it (#263). It is
   * kept as the conversation's pending message first, so opening the
   * conversation -- now, later, or after a reload -- shows it waiting for its
   * answer, and a conversation opened meanwhile waits for this request
   * instead of sending it again.
   */
  function sendInto(id: string, pending: PendingMessage, owns: () => boolean): boolean {
    // Before it is written down, and so before it is sent: both happen now.
    if (!owns()) return false
    writePendingMessage(id, { ...pending, unconfirmed: true })
    const sent = adapter.sendMessage(id, toStreamPayload(pending)).then(
      () => {
        // The server has it: from here on it is waited for, never sent again.
        // Unless the conversation has settled it, or signing out cleared it.
        const kept = readPendingMessage(id)
        if (kept?.idempotencyKey === pending.idempotencyKey && kept.unconfirmed) {
          writePendingMessage(id, { ...kept, unconfirmed: undefined })
        }
      },
      () => {
        // Left unconfirmed: opening the conversation sends it again, same key.
      },
    )
    trackSending(pending.idempotencyKey, sent)
    return true
  }

  async function ask({ content, quote = null, files, practice = null }: AskedQuestion): Promise<AskOutcome> {
    if (!canAsk()) return { kind: 'failed', error: new Error('A question is already on its way.') }
    const references = files.references
    const carried = references.length > 0
    const practiceContext = practice?.context
    const practiceField = practiceContext ? { practiceContext } : {}

    if (conversationId) {
      files.sent()
      void sendStreamingMessage({
        content,
        ...practiceField,
        ...(quote ? { quote: quoteField(quote) } : {}),
        ...(carried ? { attachmentIds: references, attachments: files.attachments } : {}),
      })
      return { kind: 'opened', conversationId }
    }

    const owns = askedInThisSession()
    const askedAt = new Date().toISOString()
    const pendingIn = (idempotencyKey: string): PendingMessage => ({
      idempotencyKey,
      content,
      askedAt,
      ...(carried ? { attachmentIds: references, attachments: files.attachments } : {}),
      ...practiceField,
      ...(quote ? { quote: quoteField(quote) } : {}),
    })

    // The refused question asked again as it was goes into the conversation
    // made for it, under the key the server named for it. Any other question
    // starts a conversation of its own, as usual: in the refused one it would
    // sit under the refused question's title (#370).
    const refused = refusedRef.current
    if (
      refused &&
      refused.subject === subject &&
      refused.grade === grade &&
      refused.content === content &&
      !quote &&
      !carried &&
      sameContext(refused.practiceContext, practiceContext)
    ) {
      refusedRef.current = null
      createConversation.reset()
      if (!sendInto(refused.id, pendingIn(initialQuestionKey(refused.id)), owns)) {
        return { kind: 'failed', error: sessionChanged() }
      }
      files.sent()
      return { kind: 'opened', conversationId: refused.id }
    }

    creatingRef.current = true
    askingRef.current = { askedAt, owns }
    // `POST /conversations` takes neither a quote nor a file, so a question
    // carrying either starts the conversation empty and is sent into it as a
    // message of its own (#263).
    const held = Boolean(quote) || carried
    try {
      const created = await createConversation.mutateAsync({
        subject,
        grade,
        ...(held ? {} : { initialMessage: content }),
        ...practiceField,
      })
      if (!owns()) return { kind: 'failed', error: sessionChanged() }
      if (held) {
        if (!sendInto(created.id, pendingIn(heldQuestionKey(created.id)), owns)) {
          return { kind: 'failed', error: sessionChanged() }
        }
        files.sent()
      }
      return { kind: 'opened', conversationId: created.id }
    } catch (error: unknown) {
      // The conversation was made and only its first question refused: the
      // refusal names it (#327 K4).
      const made = refusedConversationId(error)
      if (made && !held && owns()) {
        refusedRef.current = { id: made, subject, grade, content, practiceContext }
      }
      return { kind: 'failed', error }
    } finally {
      creatingRef.current = false
    }
  }

  return {
    ask,
    canAsk,
    starting: createConversation.isPending,
    startError: createConversation.error ?? null,
  }
}

/**
 * The conversation `POST /conversations` made before refusing its first
 * question: the backend names it in the refusal's detail, so the question can
 * be asked again in it (stoa-backend `_naming_the_conversation`).
 */
function refusedConversationId(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  const detail = error.detail
  if (typeof detail !== 'object' || detail === null) return null
  const id = (detail as { conversationId?: unknown }).conversationId
  return typeof id === 'string' && id ? id : null
}

function sameContext(a?: PracticeContextRef, b?: PracticeContextRef) {
  return a?.unitId === b?.unitId && a?.lessonId === b?.lessonId && a?.challengeId === b?.challengeId
}
