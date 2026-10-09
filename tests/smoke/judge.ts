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

/**
 * A stretch of an answer that reads the same on screen as in the stored text:
 * no markdown or LaTeX in it, which the page renders into something else.
 */
export function plainSnippet(content: string, length = 32): string | null {
  for (const line of content.split('\n')) {
    for (const piece of line.split(/[$\\`*_#|^{}[\]<>~]+/)) {
      const text = piece.replace(/\s+/g, ' ').trim()
      if (text.length >= length && /[A-Za-zÄÖÜäöüß]{3}/.test(text)) return text.slice(0, length).trim()
    }
  }
  return null
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
