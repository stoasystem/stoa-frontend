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

/**
 * The practice context for one Ask panel, and the conversations it has
 * already been told in. Held by the stage, so it outlives the phone sheet.
 */
export type AskPractice = {
  context: AskPracticeContext
  /** Conversation id -> the `practiceContextKey` it was last told. */
  told: Map<string, string>
}

/**
 * Tell a conversation again once what is on screen changed: another exercise,
 * another answer, another attempt. Otherwise one telling is enough.
 */
export function practiceContextKey(context: AskPracticeContext) {
  return [context.challengeId, context.answer ?? '', context.attempts, context.hintViewed ? 1 : 0].join('\u0001')
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
 */
export function withPracticeContext(
  t: TFunction<'chat'>,
  practice: AskPractice | undefined,
  conversationId: string | null,
  question: string,
) {
  if (!practice) return question
  const key = practiceContextKey(practice.context)
  if (conversationId && practice.told.get(conversationId) === key) return question
  return describePracticeContext(t, practice.context, question)
}

/** Remember that `conversationId` now knows what is on screen. */
export function markPracticeContextTold(practice: AskPractice | undefined, conversationId: string) {
  if (practice) practice.told.set(conversationId, practiceContextKey(practice.context))
}
