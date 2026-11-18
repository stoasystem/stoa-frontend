/**
 * The keyword screen for AI answers: step 2 of #27's three.
 *
 * Step 1 (the command bound, a successful terminal state) is asserted where the
 * answer is fetched. Step 3 is a person reading every answer, which nothing
 * here replaces: a screen that passes only means none of these cheap signs of
 * a wrong answer showed up. `offline/judge.spec.ts` holds the fixed answers -
 * a refusal, the wrong language, no example - that show the screen notices
 * them, without asking a model anything.
 */

import { expect, type Locator } from '@playwright/test'

const WORDS: Record<'de' | 'en', ReadonlySet<string>> = {
  de: new Set([
    'der', 'die', 'das', 'und', 'ist', 'nicht', 'ein', 'eine', 'einen', 'ich', 'du', 'wir',
    'es', 'mit', 'auf', 'für', 'von', 'zu', 'den', 'dem', 'des', 'sich', 'auch', 'wie', 'wenn',
    'oder', 'aber', 'wird', 'werden', 'kann', 'dass', 'man', 'bei', 'nach', 'noch', 'sind',
  ]),
  en: new Set([
    'the', 'and', 'is', 'are', 'not', 'a', 'you', 'we', 'it', 'with', 'on', 'for', 'of', 'to',
    'this', 'that', 'be', 'can', 'what', 'how', 'if', 'or', 'but', 'so', 'which', 'then',
    'there', 'from', 'by', 'at', 'as', 'your', 'have', 'has',
  ]),
}

export function languageScores(text: string): { de: number; en: number } {
  const tokens = text.toLowerCase().split(/[^a-zäöüß]+/).filter(Boolean)
  let de = 0
  let en = 0
  for (const token of tokens) {
    if (WORDS.de.has(token)) de += 1
    if (WORDS.en.has(token)) en += 1
  }
  return { de, en }
}

/** `de` or `en` when one clearly outweighs the other; `unclear` otherwise. */
export function dominantLanguage(text: string): 'de' | 'en' | 'unclear' {
  const { de, en } = languageScores(text)
  if (de >= 5 && de >= 2 * en) return 'de'
  if (en >= 5 && en >= 2 * de) return 'en'
  return 'unclear'
}

const REFUSALS = [
  /\b(kann|darf) ich (dir )?(dabei |das |hier )?(leider )?nicht (helfen|beantworten|erklären)/i,
  /\bnicht (Teil|Stoff) (deines|des|der) (Lehrplans|Stoffs|Klasse|Schuljahres)/i,
  /\bzu (schwer|schwierig|kompliziert|fortgeschritten) für (dich|die 6|deine Klasse|dein Alter)/i,
  /\bfrag (am besten |doch )?(deine[nrm]? )?(Lehrer|Lehrerin|Lehrperson|Eltern)/i,
  /\bI (can ?not|can't|am unable to|'m unable to) (help|answer|explain)/i,
  /\b(beyond|outside) (your|the) (curriculum|grade level)\b/i,
]

const EXAMPLES = /(zum Beispiel|z\.\s?B\.|\bBeispiel|\bstell dir (einmal |mal )?vor|\bwie (ein|eine|einen|wenn)\b|\bvergleich|ähnlich wie|\bfor example\b|\bimagine\b|\blike a\b)/i

export type Screen = {
  language: 'de' | 'en'
  topic: RegExp
  wantsExample?: boolean
  minLength?: number
}

// E03 checks the language of equation guidance, not whether the tutor gives
// the final result. A student may be asked to finish the last step.
export const E03_SCREEN: Screen = {
  language: 'en',
  topic: /\b(equation|subtract|divide|2x)\b/i,
  minLength: 40,
}

/**
 * What the screen found wrong with an answer; empty when it found nothing.
 * The answer still goes to a person either way.
 */
export function screenAnswer(answer: string, screen: Screen): string[] {
  const problems: string[] = []
  const language = dominantLanguage(answer)
  if (language !== screen.language) {
    problems.push(`language: expected ${screen.language}, the words read ${language} (${JSON.stringify(languageScores(answer))})`)
  }
  const refusal = REFUSALS.find((pattern) => pattern.test(answer))
  if (refusal) problems.push(`reads as a refusal: ${refusal}`)
  if (!screen.topic.test(answer)) problems.push(`never mentions ${screen.topic}`)
  if (screen.wantsExample && !EXAMPLES.test(answer)) problems.push('no example or analogy')
  const minLength = screen.minLength ?? 120
  if (answer.trim().length < minLength) problems.push(`only ${answer.trim().length} characters; not an explanation`)
  return problems
}

/** An assistant message as `GET /conversations/{id}` returns it. */
export type StoredAnswer = {
  content: string
  structured?: {
    kind?: string
    steps?: string[] | null
    answer?: string | null
    hints?: string[] | null
    similarExercises?: string[] | null
    knowledgePoints?: unknown[] | null
  } | null
}

/**
 * The text of an answer the page shows at first sight (#714). An answer that
 * carries its sections is drawn from them, not from `content`
 * (src/features/ask/AskAnswerSections.tsx, `hasSections`): each step in its own
 * card, the card's number drawn beside the step's text, then the answer. Its
 * `content` is the backend's joined text -- `1. …`, `2. …` and the first hint,
 * which the page keeps closed -- so a stretch of it may not be on screen at all.
 * The steps' own text is, whatever the card around it is made to look like.
 */
export function shownAnswerText(message: StoredAnswer): string {
  const structured = message.structured
  if (structured?.kind === 'answer') {
    const steps = (structured.steps ?? []).filter((step) => step.trim())
    const answer = structured.answer?.trim() ?? ''
    const sections = Boolean(
      steps.length || answer || structured.hints?.length || structured.similarExercises?.length || structured.knowledgePoints?.length,
    )
    if (sections) return [...steps, answer].filter(Boolean).join('\n')
  }
  return message.content
}

/** `1. `, `2) `, `- `, `• ` at the start of a line: a list marker, not the line's words. */
const LIST_MARKER = /^\s*(?:\d{1,3}[.)]|[-+•])\s+/

/**
 * A stretch of an answer that reads the same on screen as in the stored text:
 * no markdown or LaTeX in it, which the page renders into something else, and
 * no list marker at the start of a line, which the page may draw as a number
 * of its own (#714).
 */
export function plainSnippet(content: string, length = 32): string | null {
  for (const line of content.split('\n')) {
    for (const piece of line.replace(LIST_MARKER, '').split(/[$\\`*_#|^{}[\]<>~]+/)) {
      const text = piece.replace(/\s+/g, ' ').trim()
      if (text.length >= length && /[A-Za-zÄÖÜäöüß]{3}/.test(text)) return text.slice(0, length).trim()
    }
  }
  return null
}

/**
 * The stored answer is on screen in `shown`, the assistant's bubble: a plain
 * stretch of what the page draws of it (`shownAnswerText`), or, for an answer
 * with no such stretch, something. `offline/judge.spec.ts` runs it against a
 * page laid out as Ask lays out an answer in steps, and against one without it.
 */
export async function expectAnswerOnScreen(shown: Locator, message: StoredAnswer, timeout = 15_000): Promise<void> {
  const snippet = plainSnippet(shownAnswerText(message))
  if (snippet) {
    await expect(shown, 'the answer is on screen').toContainText(snippet, { timeout })
  } else {
    await expect(shown, 'an answer is on screen').not.toBeEmpty({ timeout })
  }
}

/**
 * Where an error code sits in a refusal's body, since #44 leaves the nesting
 * to the first real run: `code`, `detail.code`, `error.code`, ... up to three
 * levels down. Returns the first string `code` found, breadth first.
 */
export function findErrorCode(body: unknown): { code: string; path: string } | null {
  let level: Array<{ value: unknown; path: string }> = [{ value: body, path: '' }]
  for (let depth = 0; depth < 4 && level.length > 0; depth += 1) {
    const next: typeof level = []
    for (const { value, path } of level) {
      if (typeof value !== 'object' || value === null) continue
      const record = value as Record<string, unknown>
      if (typeof record.code === 'string') return { code: record.code, path: path ? `${path}.code` : 'code' }
      for (const [key, child] of Object.entries(record)) {
        next.push({ value: child, path: path ? `${path}.${key}` : key })
      }
    }
    level = next
  }
  return null
}
