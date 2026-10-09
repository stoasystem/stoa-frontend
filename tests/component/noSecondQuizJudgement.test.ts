/**
 * The quiz is judged in one place, and that place is the backend
 * (stoa-backend#92 / #83).
 *
 * The frontend shipped its own copy: it drew the paper (`composeSkipQuiz`,
 * `composeTestOutQuiz`), counted the mistakes it forgave (`QUIZ_MAX_MISTAKES`,
 * `quizLost`), decided the student had passed, and then called
 * `POST /practice/lessons/:id/complete` -- which answered 409
 * `lesson_exercises_unanswered`, because the backend had never seen those
 * answers. The button was on the screen in production and could not finish a
 * single lesson.
 *
 * This is the gate on that. Under the practice surface listed in ROOTS, none
 * of the marks of a second judgement may appear: no answer key to compare
 * against, no local tally of mistakes, no paper drawn at random, and none of
 * the retired rule constants. A file that genuinely needs one is registered in
 * KEPT with the exact count and a marker proving the occurrences it keeps are
 * the ones meant. A list that only shrinks: adding to it, or raising a count,
 * is an edit somebody has to make on purpose.
 *
 * What it cannot see: it reads source text, so a second judgement written in
 * other words -- comparing two strings the backend happened to send -- is
 * invisible to it. `tests/component/lessonQuiz.test.tsx` is the other half:
 * it makes the backend contradict what the frontend could have worked out and
 * requires the screen to follow the backend.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(__dirname, '../../src')

/** Where a second judgement would go. */
const ROOTS = ['features/chapter', 'components/practice', 'hooks/practice', 'services/practice']

type Mark = { name: string; pattern: RegExp; why: string }

const MARKS: Mark[] = [
  {
    name: 'answer key',
    pattern: /\bcorrectAnswer\b/g,
    why: 'an answer the screen could compare against itself',
  },
  {
    name: 'retired rule constants',
    pattern: /\bQUIZ_(?:HEARTS|MAX_MISTAKES|MIN_SIZE|REVIEW_EXTRA|TEST_OUT_SIZE)\b/g,
    why: 'the quiz rules the frontend used to hold',
  },
  {
    name: 'local paper or verdict',
    pattern: /\b(?:composeSkipQuiz|composeTestOutQuiz|quizLost)\b/g,
    why: 'drawing the paper or calling the quiz lost here',
  },
  {
    name: 'local mistake tally',
    pattern: /\bmistakes\s*(?:\+\+|\+=|\+\s*1)/g,
    why: 'counting the mistakes a quiz forgives here',
  },
  {
    name: 'drawing at random',
    pattern: /\bMath\.random\b|\bshuffle\s*\(/g,
    why: 'drawing exercises here instead of taking the backend\'s paper',
  },
]

type Kept = {
  /** Exactly how many occurrences the file keeps. */
  count: number
  /** Why they stay. */
  why: string
  /** Must match the file: the kept occurrences are these, not others. */
  marker: RegExp
}

const KEPT: Record<string, Kept> = {
  // The mistakes list, long after the answer was judged: the backend sends the
  // right answer with the record so the student can read it back. Nothing is
  // compared here.
  'components/practice/MistakeReviewCard.tsx': {
    count: 2,
    why: 'the recorded right answer, read off the mistake and passed on for review',
    marker: /correctAnswer: mistake\.correctAnswer/,
  },
  'components/practice/LessonResultSummary.tsx': {
    count: 2,
    why: 'the same recorded answer on the lesson summary',
    marker: /correctAnswer: mistake\.correctAnswer/,
  },
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(full)
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : []
  })
}

const relativeName = (full: string) => path.relative(SRC, full).split(path.sep).join('/')

const sourceFiles = ROOTS.flatMap((root) => filesUnder(path.join(SRC, root)))

/** Comments explain the rule; they are not a second judgement. */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

function marksIn(source: string): string[] {
  const body = withoutComments(source)
  return MARKS.flatMap((mark) => body.match(mark.pattern) ?? [])
}

describe('no second quiz judgement in the frontend', () => {
  it('finds a mark of judgement only in the registered files', () => {
    const found = sourceFiles
      .filter((full) => marksIn(readFileSync(full, 'utf8')).length > 0)
      .map(relativeName)
      .sort()
    expect(found).toEqual(Object.keys(KEPT).sort())
  })

  it.each(Object.entries(KEPT))('keeps exactly what %s registers', (name, kept) => {
    const full = path.join(SRC, name)
    const source = readFileSync(full, 'utf8')
    expect(source).toMatch(kept.marker)
    expect(marksIn(source)).toHaveLength(kept.count)
  })

  it('leaves the quiz module with no rule of its own to apply', () => {
    const quiz = readFileSync(path.join(SRC, 'features/chapter/quiz.ts'), 'utf8')
    expect(marksIn(quiz)).toEqual([])
    // What is left is the names of the backend's refusals and their copy.
    expect(quiz).toMatch(/lesson_quiz_credential_expired/)
    expect(quiz).not.toMatch(/export (?:const|function) (?:QUIZ_HEARTS|compose|quizLost)/)
  })

  it('takes the quiz through the service layer, where the contract check can see it', () => {
    const api = readFileSync(path.join(SRC, 'services/practice/practiceApi.ts'), 'utf8')
    expect(api).toMatch(/\/practice\/lessons\/\$\{lessonId\}\/quiz`/)
    expect(api).toMatch(/\/practice\/lessons\/\$\{lessonId\}\/quiz\/\$\{quizId\}\/answer`/)
    expect(api).toMatch(/quizCredential/)
  })

  it.each([
    ['const key = challenge.correctAnswer', 'answer key'],
    ['if (mistakes + 1 > allowed) return', 'local mistake tally'],
    ['setQuiz({ ...quiz, mistakes: quiz.mistakes += 1 })', 'local mistake tally'],
    ['const paper = shuffle(ids).slice(0, 5)', 'drawing at random'],
    ['const pick = Math.random()', 'drawing at random'],
    ['export const QUIZ_MAX_MISTAKES = 1', 'retired rule constants'],
    ['return quizLost(mistakes)', 'local paper or verdict'],
    ['composeTestOutQuiz(ids)', 'local paper or verdict'],
  ])('can fail: %s is a mark', (source) => {
    // Negative control. Both checks above are counts, so the counting itself
    // has to be able to come out non-zero.
    expect(marksIn(source)).not.toHaveLength(0)
  })

  it.each([
    ["const mode = QUIZ_MODE"],
    ['const code = QUIZ_TROUBLES.find((known) => known === value)'],
    ['// mistakes += 1 is what this file no longer does'],
    ['/* composeSkipQuiz drew the paper here until #92 */'],
    ['const left = view.heartsLeft'],
  ])('leaves %s alone', (source) => {
    expect(marksIn(source)).toEqual([])
  })
})
