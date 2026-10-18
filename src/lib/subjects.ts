import type { TFunction } from 'i18next'

/**
 * Every spelling of a subject the app has met, by its slug (`subjectSlug`):
 * the ids themselves, free text from application and profile forms, and the
 * English labels the teacher editor used to save. One table for the whole app,
 * so a subject reads the same on every page (#267, #270). The backend compares
 * subjects through `practice_repo.normal_subject_id` (lowercase, then its own
 * shorter alias table), so writing the id is safe.
 */
export const SUBJECT_ALIASES: Record<string, string> = {
  math: 'math',
  maths: 'math',
  mathematics: 'math',
  mathematik: 'math',
  mathematiques: 'math',
  matematica: 'math',
  physics: 'physics',
  physik: 'physics',
  physique: 'physics',
  fisica: 'physics',
  chemistry: 'chemistry',
  chemie: 'chemistry',
  chimie: 'chemistry',
  chimica: 'chemistry',
  biology: 'biology',
  biologie: 'biology',
  biologia: 'biology',
  german: 'german',
  deutsch: 'german',
  allemand: 'german',
  tedesco: 'german',
  english: 'english',
  englisch: 'english',
  anglais: 'english',
  inglese: 'english',
}

/** A spelling reduced to what `SUBJECT_ALIASES` is keyed by: lowercase ASCII letters and digits. */
export function subjectSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

/**
 * The subject id a stored or sent subject names (`Mathematik`, `subj-math`
 * and `math` are one subject), or `undefined` when the app does not know it.
 */
export function normalSubjectId(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const slug = subjectSlug(value)
  return SUBJECT_ALIASES[slug] ?? (slug.startsWith('subj') ? SUBJECT_ALIASES[slug.slice(4)] : undefined)
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
  const id = normalSubjectId(raw) ?? raw.toLowerCase()
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
