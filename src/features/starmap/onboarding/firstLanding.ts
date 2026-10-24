/*
 * The first landing (plan A of docs/research/user-onboarding-design.md, first
 * half): a student who has not started anything does not open on the whole
 * sky, where nothing says where to begin, but on the recommended star of the
 * galaxy in focus, its nebula seen whole, with Murmi beside it.
 *
 * Who is new is read from the sky, never stored: no star lit and none in
 * progress. So the truth stays the backend's (#9), a shared browser is right
 * for whoever is signed in (ADR 0003), and signing out clears nothing that
 * matters. A student who looked around and left lands here again next time,
 * which is what they still have to do.
 *
 * Plan B comes first when there is a choice to make: a student who takes
 * more than one subject is asked which one school is on now, and lands on
 * that galaxy's recommended star. The answer only steers the camera.
 *
 * The first lighting closes it: once the student's first star is lit, the
 * camera pulls back to the whole galaxy, and Murmi points at what comes next.
 */
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import type { LayerTarget } from '@/features/starmap/view/layers'

/** Nothing lit, nothing in progress: the student has not started anything yet. */
export function isNewcomer(map: Pick<StarMap, 'stars'>): boolean {
  return map.stars.length > 0 && map.stars.every((star) => star.state === 'ready' || star.state === 'locked')
}

/** The recommended star of a galaxy (by default the one in focus), if it has one. */
export function recommendedIn(map: StarMap, subjectId: string = map.subject.subjectId): Star | null {
  return map.stars.find((star) => star.recommendation && subjectOfNebula(map, star.nebulaId) === subjectId) ?? null
}

/** The subjects the student takes that have somewhere to start: what plan B asks between. */
export function startableSubjects(map: StarMap): StarMap['subjects'] {
  return map.subjects.filter((galaxy) => galaxy.enrolled && recommendedIn(map, galaxy.subjectId) !== null)
}

/** The recommended star's nebula seen whole, the star kept in view. */
export function landingOn(star: Star): LayerTarget {
  return { layer: 'nebula', nebulaId: star.nebulaId, whole: { star: star.unitId } }
}

/**
 * Where a newcomer's `target` lands instead: from the galaxy (nothing chosen),
 * the recommended star of `subjectId` (by default the galaxy in focus), its
 * nebula seen whole; null for anything else, which opens as itself. A nebula
 * or star the student chose, or a link, is theirs.
 */
export function firstLandingFor(map: StarMap, target: LayerTarget, subjectId: string = map.subject.subjectId): LayerTarget | null {
  if (target.layer !== 'map' || !isNewcomer(map)) return null
  const star = recommendedIn(map, subjectId) ?? recommendedIn(map)
  return star ? landingOn(star) : null
}

/** Whether `unitId` is the only star lit in the whole sky: the student's first. */
export function isFirstLit(map: Pick<StarMap, 'stars'>, unitId: string): boolean {
  const lit = map.stars.filter((star) => star.state === 'lit')
  return lit.length === 1 && lit[0].unitId === unitId
}
