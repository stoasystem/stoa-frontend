/*
 * "Find my own star" (#586, docs/research/user-onboarding-design.md 7b): the
 * things a newcomer could say to Ask to find the star that fits where school
 * is, offered beside the docked composer for that moment. Two or three, for
 * the subject of the star the student landed on; a subject without its own
 * get two that fit any.
 *
 * Sent as they are, they go the way of any question that names a star: the
 * answer carries it, and its card draws the path on the map (#489).
 */
import type { TFunction } from 'i18next'

/** The subjects with examples of their own, as `learningSubjectOptions` names them. */
const EXAMPLES = {
  math: ['quadratic', 'derivatives', 'trig'],
  physics: ['forces', 'circuits'],
  german: ['essay', 'grammar'],
  english: ['tenses', 'essay'],
  general: ['class', 'start'],
} as const

type Group = keyof typeof EXAMPLES

/** Which examples a galaxy gets: its subject's own (an id containing the subject's, as Ask reads it), else the general ones. */
export function exampleGroupFor(subjectId: string): Group {
  const id = subjectId.toLowerCase()
  const own = (Object.keys(EXAMPLES) as Group[]).find((group) => group !== 'general' && id.includes(group))
  return own ?? 'general'
}

/** What a student in `subjectId` could say to find their star, in the page's language. */
export function findOwnExamples(t: TFunction<'starmap'>, subjectId: string): string[] {
  const group = exampleGroupFor(subjectId)
  return EXAMPLES[group].map((key) => t(`findOwn.examples.${group}.${key}`))
}
