/*
 * Small stars as question types (#501, stoa-backend#127).
 *
 * In a knowledge-base star the small stars around a star are question types:
 * tapping one practises that type of task on that knowledge point, in practice
 * sets cut by stage ("Stufe 1", "Stufe 2" ...) that the student works through
 * in `order`. A small star says `extension` when it only deepens its star:
 * done, it shines on its own, and the star lights from its core small stars
 * alone. A small star whose next practice needs knowledge the student has not
 * mastered names where that knowledge is (`missingPrerequisites`); nothing is
 * locked by it (ADR 0004).
 *
 * Which practice sets belong to which small star is not a field of the
 * catalog. The backend names them after it: a small star is
 * `{unitId}--{questionType}`, and each of its practice sets
 * `{skillId}--{stage}` or `{skillId}--{stage}-{part}`
 * (`scripts/knowledge_base_import.py`, `knowledge_base_catalog.skill_id`).
 * The ZAP stars' skills are tags on exercises (`brueche-kuerzen`), not
 * question types: their ids do not start with their star's id, they have no
 * practice sets of their own, and they stay what they were, dots with names.
 *
 * The stars read in full (#503) do say it: each practice set names its
 * `skillId`. Where they are at hand that is what counts, and the names only
 * stand in where they are not.
 */
import type { KnowledgeSkill, MissingPrerequisite } from '@/features/starmap/model/starMap'
import type { KnowledgeMapPracticeSet } from '@/types/practice'

/** Whether `skill` is a question type of `unitId` with practice sets of its own, not a tag on exercises. */
export function isQuestionType(skill: Pick<KnowledgeSkill, 'skillId'>, unitId: string): boolean {
  return skill.skillId.startsWith(`${unitId}--`) && skill.skillId.length > unitId.length + 2
}

/**
 * Whether `lessonId` is one of the practice sets of the small star `skillId`:
 * as `practiceSets` says, when the backend sent them (#503), else by name.
 */
export function isPracticeSetOf(lessonId: string, skillId: string, practiceSets: readonly KnowledgeMapPracticeSet[] = []): boolean {
  const said = practiceSets.find((set) => set.lessonId === lessonId)
  return said ? said.skillId === skillId : lessonId.startsWith(`${skillId}--`)
}

/**
 * A practice set's title inside its small star: the stage, without the small
 * star's name in front of it ("Kopfrechnen-Trick · Stufe 2" → "Stufe 2"). The
 * backend writes both in the reader's language, so the name is matched as it
 * is sent; a title that does not start with it stays whole.
 */
export function stageTitle(title: string, skillName: string): string {
  const prefix = `${skillName} · `
  return skillName && title.startsWith(prefix) && title.length > prefix.length ? title.slice(prefix.length) : title
}

/** The star a hint sends the student to, as far as the sky knows it. */
export type PrerequisiteTarget = MissingPrerequisite & { nebulaId?: string; subjectId?: string }

/**
 * What a small star asks to be learned first: the stars to light first, and
 * whether it is this very star's earlier stages (`unitId` is the star itself).
 * A target the sky does not hold has no `nebulaId` and gets no link.
 */
export function prerequisiteHints(
  skill: Pick<KnowledgeSkill, 'missingPrerequisites'>,
  unitId: string,
  sky: {
    stars: readonly { unitId: string; nebulaId: string }[]
    nebulae: readonly { topicId: string; subjectId?: string }[]
  },
): { earlierStages: boolean; stars: PrerequisiteTarget[] } {
  const missing = skill.missingPrerequisites ?? []
  const stars: PrerequisiteTarget[] = []
  for (const item of missing) {
    if (item.unitId === unitId || stars.some((known) => known.unitId === item.unitId)) continue
    const star = sky.stars.find((candidate) => candidate.unitId === item.unitId)
    const subjectId = star && sky.nebulae.find((nebula) => nebula.topicId === star.nebulaId)?.subjectId
    stars.push({ ...item, ...(star ? { nebulaId: star.nebulaId } : {}), ...(subjectId ? { subjectId } : {}) })
  }
  return { earlierStages: missing.some((item) => item.unitId === unitId), stars }
}
