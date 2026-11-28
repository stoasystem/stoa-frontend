import { drawingFilled, emptyDrawing, isDrawing, sameDrawing } from '@/features/chapter/gridDrawing'
import type { PracticeAnswer, PracticeAnswerResult, PracticeChallenge } from '@/types/practice'

export type PracticeLessonState = {
  currentIndex: number
  answer: PracticeAnswer
  feedback?: PracticeAnswerResult
  hintsShown: number
  incorrectAttempts: number
}

export type PracticeLessonAction =
  | { type: 'answer'; answer: PracticeAnswer }
  /** `answer`: the answer this verdict is for. A verdict for another one is dropped (#733). */
  | { type: 'feedback'; feedback: PracticeAnswerResult; answer?: PracticeAnswer }
  | { type: 'hint' }
  | { type: 'retry' }
  | { type: 'next'; challenges: PracticeChallenge[] }
  | { type: 'reset' }

export const initialPracticeLessonState: PracticeLessonState = {
  currentIndex: 0,
  answer: '',
  hintsShown: 0,
  incorrectAttempts: 0,
}

/**
 * Whether there is an answer to check: an order or a set of options needs a
 * first pick, a drawing something drawn (#744), anything typed a character
 * that is not a space.
 */
export function answerFilled(answer: PracticeAnswer): boolean {
  if (isDrawing(answer)) return drawingFilled(answer)
  return Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0
}

/** The same answer: the same text, the same pieces (or option numbers) in the same order, or the same drawing. */
export function sameAnswer(a: PracticeAnswer, b: PracticeAnswer): boolean {
  if (isDrawing(a) || isDrawing(b)) return isDrawing(a) && isDrawing(b) && sameDrawing(a, b)
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => item === b[index])
  }
  return a === b
}

export function practiceLessonReducer(
  state: PracticeLessonState,
  action: PracticeLessonAction,
): PracticeLessonState {
  switch (action.type) {
    case 'answer':
      return { ...state, answer: action.answer }
    case 'feedback':
      // The answer was changed, or the exercise left, after it was sent: the
      // verdict would be drawn beside an answer it was not given for.
      if (action.answer !== undefined && !sameAnswer(action.answer, state.answer)) return state
      return {
        ...state,
        feedback: action.feedback,
        incorrectAttempts: action.feedback.correct ? state.incorrectAttempts : state.incorrectAttempts + 1,
      }
    case 'hint':
      return { ...state, hintsShown: state.hintsShown + 1 }
    case 'retry':
      return { ...state, answer: Array.isArray(state.answer) ? [] : isDrawing(state.answer) ? emptyDrawing() : '', feedback: undefined }
    case 'next':
      return {
        ...initialPracticeLessonState,
        currentIndex: Math.min(state.currentIndex + 1, action.challenges.length - 1),
        hintsShown: state.hintsShown,
        incorrectAttempts: state.incorrectAttempts,
      }
    case 'reset':
      return initialPracticeLessonState
    default:
      return state
  }
}
