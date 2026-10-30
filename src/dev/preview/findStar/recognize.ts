/*
 * PROTOTYPE #476 -- throwaway. The recogniser stub and the way to a star.
 *
 * Two recognisers, to see where each one breaks:
 *
 *   - `local`: what the front end could do alone. It knows the star names in
 *     the reader's language only (the map is sent already translated), and a
 *     short list of "practise / keep going" words in de / en / fr / it.
 *     Chinese, typos and synonyms do not match; a bare question ("What is a
 *     derivative?") has no practise word, so it stays a question.
 *   - `backend`: stands in for #472's smallest change, the model returning a
 *     nullable `target_unit_id` beside its answer. Faked here with an alias
 *     table (Chinese included) and a rough "is this a question" check; the
 *     real thing would be the model's call.
 */
import type { Star, StarMap } from '@/features/starmap/model/starMap'

export type Recognizer = 'local' | 'backend'

export type Recognition = {
  text: string
  recognizer: Recognizer
  /** The practise / keep-going word found, if any. */
  cue: string | null
  /** Asked as a question ("what is …?"), which stays with Ask. */
  question: boolean
  star: Star | null
  /** Whether the input is read as "take me to a star". */
  intent: boolean
  /** One line for the state panel, in Chinese: why it came out this way. */
  why: string
}

const LOCAL_CUES = ['practis', 'practic', 'keep going', 'continue', 'work on', 'train', 'üben', 'übe ', 'weiter', 'lernen', 'exercer', "m'entraîner", 'continuer', 'travailler', 'esercitar', 'continuare', 'allenar', 'ripassare']
const BACKEND_CUES = [...LOCAL_CUES, '练', '学', '复习', '继续', 'learn', 'apprendre', 'imparare']
const QUESTION = /[?？]|^(what|why|how|was|warum|wie|qu'est|pourquoi|comment|cosa|perché|come)\b|什么|为什么|怎么|吗/i

/** Chinese names for the calculus nebula and a few others: what a model would understand, not what the map carries. */
const ALIASES: Record<string, string[]> = {
  'calculus-1': ['变化率', '平均变化率'],
  'calculus-2': ['极限'],
  'calculus-3': ['导数', '求导', 'derivative', 'ableitung', 'dérivée', 'derivata'],
  'calculus-4': ['求导法则', '导数法则'],
  'calculus-5': ['曲线', '函数图像分析'],
  'calculus-6': ['积分'],
  'demo-sine-cosine': ['正弦', '余弦', '三角函数'],
}

const ARTICLES = /^(the|die|der|das|le|la|les|l'|il|lo|gli|i)\s*/i

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** A placeholder star's name is its nebula's and a number ("Calculus 7"): nobody types that. */
function named(star: Star): boolean {
  return !/\s\d+$/.test(star.name)
}

function localStar(map: StarMap, text: string): Star | null {
  const input = fold(text)
  let best: Star | null = null
  let length = 0
  for (const star of map.stars) {
    if (!named(star)) continue
    const name = fold(star.name).replace(ARTICLES, '')
    if (name.length >= 4 && input.includes(name) && name.length > length) {
      best = star
      length = name.length
    }
  }
  return best
}

function backendStar(map: StarMap, text: string): Star | null {
  const input = fold(text)
  // Longest alias first, so 求导法则 wins over 求导.
  const pairs = Object.entries(ALIASES).flatMap(([unitId, words]) => words.map((word) => [unitId, fold(word)] as const))
  pairs.sort((a, b) => b[1].length - a[1].length)
  const hit = pairs.find(([, word]) => input.includes(word))
  const star = hit ? map.stars.find((candidate) => candidate.unitId === hit[0]) : undefined
  return star ?? localStar(map, text)
}

export function recognize(map: StarMap, text: string, recognizer: Recognizer): Recognition {
  const input = fold(text)
  const cue = (recognizer === 'local' ? LOCAL_CUES : BACKEND_CUES).find((word) => input.includes(fold(word))) ?? null
  const question = QUESTION.test(text.trim())
  const star = recognizer === 'local' ? localStar(map, text) : backendStar(map, text)
  const intent = star !== null && cue !== null && !question
  let why: string
  if (intent) why = `命中：练习词「${cue}」+ 星「${star.name}」`
  else if (!star && recognizer === 'local' && /[一-鿿]/.test(text)) why = '没命中：本地只有当前界面语言的星名（de/en/fr/it），中文对不上 → 当普通提问'
  else if (!star) why = cue ? `有练习词「${cue}」但没对上任何星 → 当普通提问（开放式「练点难的」归推荐）` : '没对上星，也没有练习词 → 普通提问'
  else if (question) why = `对上星「${star.name}」，但这是在问问题 → 普通提问`
  else why = `对上星「${star.name}」，但没有练习词 → 普通提问`
  return { text, recognizer, cue, question, star, intent, why }
}

export type Way = {
  target: Star
  /** The stars not lit that the target waits for, all the way back, prerequisites first. */
  missing: Star[]
  /** The lit stars the way starts from. */
  from: Star[]
  /** The prerequisite edges along the way. */
  edges: [string, string][]
  /** Where to begin: the first missing star that can be started now. */
  first: Star | null
}

export function wayTo(map: StarMap, target: Star): Way {
  const byId = new Map(map.stars.map((star) => [star.unitId, star]))
  const into = new Map<string, string[]>()
  for (const edge of map.prerequisites) into.set(edge.to, [...(into.get(edge.to) ?? []), edge.from])
  const missing = new Set<string>()
  const from = new Set<string>()
  const edges: [string, string][] = []
  const visit = (id: string) => {
    for (const parent of into.get(id) ?? []) {
      edges.push([parent, id])
      if (byId.get(parent)?.state === 'lit') from.add(parent)
      else if (!missing.has(parent)) {
        missing.add(parent)
        visit(parent)
      }
    }
  }
  visit(target.unitId)
  // Prerequisites first: a star after everything it waits for.
  const order: string[] = []
  const placed = new Set<string>()
  const place = (id: string) => {
    if (placed.has(id)) return
    placed.add(id)
    for (const parent of into.get(id) ?? []) if (missing.has(parent)) place(parent)
    order.push(id)
  }
  for (const id of missing) place(id)
  const stars = order.map((id) => byId.get(id)!).filter(Boolean)
  return {
    target,
    missing: stars,
    from: [...from].map((id) => byId.get(id)!).filter(Boolean),
    edges,
    first: stars.find((star) => star.state === 'ready' || star.state === 'in_progress') ?? (target.state === 'lit' ? null : target),
  }
}
