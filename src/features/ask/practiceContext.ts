import type { TFunction } from 'i18next'

/**
 * What the Ask beside the practice stage knows about the exercise on screen
 * (#12 point 4, #50).
 *
 * ---------------------------------------------------------------------------
 * TEXT FALLBACK -- to be replaced by #56
 * (https://github.com/stoasystem/stoa-frontend/issues/56).
 *
 * The decision is a structured `practiceContext: { challengeId, lessonId,
 * unitId }` on the message, ids only, from which the backend reads the
 * exercise, the chapter, the learning state and the latest mistakes itself.
 * The backend has no such field yet (stoasystem/stoa-backend#61). Until it
 * does, the context is written out as text and put in front of the student's
 * question, the way the old chat page did it (`chat:contextLines`). The text
 * shows in the student's own bubble; #56 sends the ids instead, deletes
 * `describePracticeContext` and `practiceContextKey`, and the ids below are
 * already what it will send.
 * ---------------------------------------------------------------------------
 */
export type AskPracticeContext = {
  unitId: string
  lessonId: string
  challengeId: string
  /** The exercise's topic, as the lesson names it. */
  topic: string
  /** The exercise itself. */
  prompt: string
  /** What the student has put down so far, if anything. */
  answer?: string
  /** Wrong answers so far on this exercise. */
  attempts: number
  hintViewed: boolean
}

/** The practice context for one Ask panel: the exercise on screen. */
export type AskPractice = {
  context: AskPracticeContext
}

/**
 * Tell a conversation again once what is on screen changed: another exercise,
 * another answer, another attempt. Otherwise one telling is enough.
 */
export function practiceContextKey(context: AskPracticeContext) {
  return [context.challengeId, context.answer ?? '', context.attempts, context.hintViewed ? 1 : 0].join('\u0001')
}

/*
 * Which conversation was last told what, by conversation id, in session
 * storage: the stage remounting (another lesson, a reload) does not tell the
 * same conversation the same thing twice. Only a hash of the key is kept, so
 * the student's answer is not written to storage; signing out clears it all.
 * Without storage it lives in memory for the page's life.
 */
export const PRACTICE_TOLD_KEY_PREFIX = 'stoa_ask_practice_told:'
const toldInMemory = new Map<string, string>()

function hashKey(key: string) {
  // FNV-1a, 32 bit: enough to tell one screen from the next.
  let hash = 0x811c9dc5
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function readTold(conversationId: string): string | null {
  try {
    return sessionStorage.getItem(PRACTICE_TOLD_KEY_PREFIX + conversationId)
  } catch {
    return toldInMemory.get(conversationId) ?? null
  }
}

function writeTold(conversationId: string, hashed: string) {
  toldInMemory.set(conversationId, hashed)
  try {
    sessionStorage.setItem(PRACTICE_TOLD_KEY_PREFIX + conversationId, hashed)
  } catch {
    // Kept in memory above.
  }
}

/** Signing out: whoever signs in next starts with nothing told. */
export function clearPracticeContextTold() {
  toldInMemory.clear()
  try {
    const keys: string[] = []
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index)
      if (key?.startsWith(PRACTICE_TOLD_KEY_PREFIX)) keys.push(key)
    }
    for (const key of keys) sessionStorage.removeItem(key)
  } catch {
    // Without storage nothing was kept.
  }
}

/** TEXT FALLBACK (#56): the student's question, then the exercise as lines of text. */
export function describePracticeContext(t: TFunction<'chat'>, context: AskPracticeContext, question: string) {
  return [
    question,
    '',
    t('contextLines.practiceTopic', { topic: context.topic }),
    t('contextLines.practiceQuestion', { prompt: context.prompt }),
    context.answer ? t('contextLines.myAnswer', { answer: context.answer }) : '',
    context.attempts > 0 ? t('contextLines.attempts', { attempts: context.attempts }) : '',
    context.hintViewed ? t('contextLines.hintViewed') : '',
  ]
    .filter((line, index) => index < 2 || line !== '')
    .join('\n')
}

/**
 * The message to send: the question alone when `conversationId` has already
 * been told about what is on screen, otherwise with the context in front.
 * A new conversation (`conversationId` null) is always told.
 *
 * `told` records the telling. Call it only once the message has gone out:
 * a message that failed has told nobody, so the next question tells again.
 * It records what was on screen when the message was written, not later.
 */
export function withPracticeContext(
  t: TFunction<'chat'>,
  practice: AskPractice | undefined,
  conversationId: string | null,
  question: string,
): { content: string; told: (conversationId: string) => void } {
  if (!practice) return { content: question, told: () => {} }
  const hashed = hashKey(practiceContextKey(practice.context))
  const told = (id: string) => writeTold(id, hashed)
  if (conversationId && readTold(conversationId) === hashed) return { content: question, told }
  return { content: describePracticeContext(t, practice.context, question), told }
}
