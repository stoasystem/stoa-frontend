import type { PracticeAnswerResult, PracticeChallenge } from '@/types/practice'

export type PracticeLessonState = {
  currentIndex: number
  answer: string | string[]
  feedback?: PracticeAnswerResult
  hintsShown: number
  incorrectAttempts: number
}

export type PracticeLessonAction =
  | { type: 'answer'; answer: string | string[] }
  | { type: 'feedback'; feedback: PracticeAnswerResult }
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

export function practiceLessonReducer(
  state: PracticeLessonState,
  action: PracticeLessonAction,
): PracticeLessonState {
  switch (action.type) {
    case 'answer':
      return { ...state, answer: action.answer }
    case 'feedback':
      return {
        ...state,
        feedback: action.feedback,
        incorrectAttempts: action.feedback.correct ? state.incorrectAttempts : state.incorrectAttempts + 1,
      }
    case 'hint':
      return { ...state, hintsShown: state.hintsShown + 1 }
    case 'retry':
      return { ...state, answer: Array.isArray(state.answer) ? [] : '', feedback: undefined }
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
