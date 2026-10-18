import type { TFunction } from 'i18next'

/**
 * Subject spellings that reached DynamoDB before ids were normalised: free text
 * from the application forms and the English labels the teacher editor used to
 * save. The backend compares subjects through `practice_repo.normal_subject_id`
 * (lowercase, then its own shorter alias table), so writing the id is safe.
 */
export const SUBJECT_ALIASES: Record<string, string> = {
  mathematics: 'math',
  mathematik: 'math',
  mathematiques: 'math',
  matematica: 'math',
  physik: 'physics',
  physique: 'physics',
  fisica: 'physics',
  chemie: 'chemistry',
  chimie: 'chemistry',
  chimica: 'chemistry',
  biologie: 'biology',
  biologia: 'biology',
  deutsch: 'german',
  allemand: 'german',
  tedesco: 'german',
  englisch: 'english',
  anglais: 'english',
  inglese: 'english',
}

/** The subjects a teacher can tick, as the ids saved for them. */
export const TEACHER_SUBJECT_IDS = ['math', 'physics', 'chemistry', 'english', 'biology'] as const

/** Ids the teacher copy has a name for: the five above, and German from old forms. */
const NAMED_TEACHER_SUBJECTS = new Set<string>([...TEACHER_SUBJECT_IDS, 'german'])

/**
 * The id for a stored subject the app knows (`Mathematics`, `mathematik` and
 * `math` are one subject); anything else is kept exactly as stored, trimmed, so
 * the teacher sees what is really saved and can remove it.
 */
export function normalTeacherSubject(subject: string): string {
  const raw = (subject ?? '').trim()
  const lower = raw.toLowerCase()
  const id = SUBJECT_ALIASES[lower] ?? lower
  return NAMED_TEACHER_SUBJECTS.has(id) ? id : raw
}

/** Stored subjects as ids, each once, in the order first stored; empty values dropped. */
export function normalTeacherSubjects(subjects: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const subject of subjects) {
    const id = normalTeacherSubject(subject)
    if (!id || seen.has(id.toLowerCase())) continue
    seen.add(id.toLowerCase())
    result.push(id)
  }
  return result
}

/** A stored teacher subject named in the reader's language; one the app has no name for reads as stored. */
export function teacherSubjectLabel(subject: string, t: TFunction<'teacher'>): string {
  const id = normalTeacherSubject(subject)
  if (!NAMED_TEACHER_SUBJECTS.has(id)) return id
  return t(`availability.editor.subjectNames.${id}`, { defaultValue: id })
}
