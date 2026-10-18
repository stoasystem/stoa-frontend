import { create } from 'zustand'
import { QUOTE_MAX_LENGTH, type MessageQuote, type PracticeContextRef, type QuoteSource } from '@/types/chat'

/**
 * What Ask carries with a question beside the practice stage (#12 points 4
 * and 5, #50, #56): which exercise is on screen, and the passage the student
 * chose to ask about.
 *
 * Both are structured fields on the request. The exercise is ids only
 * (`practiceContext`); the backend reads the wording, the chapter and the
 * learning state from them itself, so no context text is ever written into
 * the student's own message. The text fallback that stood here until #56 --
 * `describePracticeContext`, `practiceContextKey` and the record of which
 * conversation had been told what -- is gone with it.
 */

/** The practice context for one Ask panel: the exercise on screen, by id. */
export type AskPractice = {
  context: PracticeContextRef
}

/**
 * A quote waiting to go out with the next question. `truncated` is this side's
 * own note that the passage was cut to fit, and `conversationId` the
 * conversation a quoted answer is in; neither is sent.
 */
export type AskQuote = MessageQuote & { truncated: boolean; conversationId?: string | null }

/** The passage as it may be sent: cut to what the backend accepts. */
export function makeQuote(text: string, source: QuoteSource, conversationId?: string | null): AskQuote {
  const trimmed = text.trim()
  const truncated = trimmed.length > QUOTE_MAX_LENGTH
  return {
    text: truncated ? trimmed.slice(0, QUOTE_MAX_LENGTH) : trimmed,
    source,
    truncated,
    ...(source.kind === 'message' ? { conversationId: conversationId ?? null } : {}),
  }
}

/**
 * Whether a quote belongs where Ask is now (#263): a passage of an exercise
 * beside that exercise only, a passage of an answer in that answer's
 * conversation only. Anywhere else it is not shown and not sent.
 */
export function quoteBelongs(
  quote: AskQuote,
  here: { challengeId: string | null; conversationId: string | null },
) {
  return quote.source.kind === 'challenge'
    ? quote.source.id === here.challengeId
    : quote.conversationId === here.conversationId
}

/** Only the two keys the backend takes: `truncated` stays on this side. */
export function quoteField(quote: AskQuote): MessageQuote {
  return { text: quote.text, source: quote.source }
}

type AskQuoteState = {
  quote: AskQuote | null
  setQuote: (quote: AskQuote | null) => void
}

/**
 * 「问这段」 hands the chosen passage to Ask through here: the chip sets it,
 * the composer shows it, sending clears it. In memory only -- a quote is about
 * what is on screen now -- and cleared when the stage leaves the exercise or
 * the conversation it came from (`StageWithAsk`).
 */
export const useAskQuoteStore = create<AskQuoteState>((set) => ({
  quote: null,
  setQuote: (quote) => set({ quote }),
}))

export function clearAskQuote() {
  useAskQuoteStore.setState({ quote: null })
}
