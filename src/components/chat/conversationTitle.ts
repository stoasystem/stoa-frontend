import type { TFunction } from 'i18next'

/** Subject spellings that reached DynamoDB before ids were normalised. */
const SUBJECT_ALIASES: Record<string, string> = {
  mathematics: 'math',
  mathematik: 'math',
  mathematiques: 'math',
  matematica: 'math',
  physik: 'physics',
  physique: 'physics',
  fisica: 'physics',
  deutsch: 'german',
  allemand: 'german',
  tedesco: 'german',
  englisch: 'english',
  anglais: 'english',
  inglese: 'english',
}

const TITLE_SEPARATORS = ['–', '—', '-']

/** The subject named the way the rest of the app names it. */
export function subjectDisplayLabel(subject: string, t: TFunction<'chat'>): string {
  const raw = (subject ?? '').trim()
  if (!raw) return ''
  const normalized = raw.toLowerCase()
  const id = SUBJECT_ALIASES[normalized] ?? normalized
  return t(`subjects.${id}`, { defaultValue: raw })
}

/**
 * A conversation still carrying the generated `subject – grade` placeholder is
 * shown with the localised subject name; a title taken from the student's own
 * question is left exactly as written.
 */
export function conversationDisplayTitle(
  conversation: { title?: string; subject?: string; grade?: string },
  t: TFunction<'chat'>,
): string {
  const title = (conversation.title ?? '').trim()
  const subject = (conversation.subject ?? '').trim()
  const grade = (conversation.grade ?? '').trim()
  if (!title || !subject) return title

  const label = subjectDisplayLabel(subject, t)
  for (const separator of TITLE_SEPARATORS) {
    const placeholder = grade ? `${subject} ${separator} ${grade}` : `${subject} ${separator}`
    if (title.toLowerCase() === placeholder.toLowerCase()) {
      return grade ? `${label} ${separator} ${grade}` : label
    }
  }
  return title
}
