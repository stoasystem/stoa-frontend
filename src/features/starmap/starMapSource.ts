/*
 * The star map's data source (#131; it grew out of #51's override seam):
 * where `useStarMap` gets the map it draws.
 *
 * Production default: `emptyStarMapSource` -- an empty sky (no subjects, no
 * nebulae, no stars) and `demo: false`, so the route shows its empty state
 * and no Demo notice. The application carries no demo data at all; the
 * production bundle is checked for it (`designPreviewExcluded.test.ts`).
 * When #48 wires the read model (stoa-backend#59) in, it becomes the
 * production source here, and `useStarMap` keeps its shape.
 *
 * The design preview (`src/dev/preview/lighting.tsx`) and the bench
 * (`src/dev/starmapBench.tsx`) provide the demo sky from `src/dev/demo/sky`
 * instead; the preview's also follows the lessons completed on the page.
 */
import type { TFunction } from 'i18next'
import { createContext, useContext } from 'react'
import type { StarMap } from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'

/**
 * How many stars the whole sky holds, as a demo source is asked for it
 * (`?points=`): 10 is planned by hand; 500, 1000 and 2000 are the phone
 * bench's steps (#44). A real read model ignores it.
 */
export const FIXTURE_SIZES = [10, 500, 1000, 2000] as const
export type FixtureSize = (typeof FIXTURE_SIZES)[number]

export function isFixtureSize(value: number): value is FixtureSize {
  return (FIXTURE_SIZES as readonly number[]).includes(value)
}

export type StarMapRequest = {
  /** The galaxy in focus (the route's `/map/:subjectId`). */
  subjectId: string
  size: FixtureSize
  t: TFunction<'starmap'>
  language: SupportedLanguage
  /** Include the sky's prerequisites (the bench's `&relations=fixture`). */
  relations: boolean
  /** Long nebula names, to check labels in four languages (dev switch). */
  longNames: boolean
}

export type StarMapSource = {
  /** The map to draw. Must be pure; a new source means the states changed. */
  read: (request: StarMapRequest) => StarMap
  /** The map is demo content: the view shows the Demo notice and the placeholder-star note. */
  demo: boolean
}

/** A sky with nothing in it yet: what the application draws until #48. */
export function emptyStarMap(subjectId: string): StarMap {
  return {
    subject: { subjectId, name: '' },
    subjects: [],
    nebulae: [],
    stars: [],
    prerequisites: [],
    summary: { lit: 0, total: 0, streakDays: 0, score: 0 },
  }
}

export const emptyStarMapSource: StarMapSource = {
  read: ({ subjectId }) => emptyStarMap(subjectId),
  demo: false,
}

export const StarMapSourceContext = createContext<StarMapSource>(emptyStarMapSource)

export function useStarMapSource(): StarMapSource {
  return useContext(StarMapSourceContext)
}

/** The subject to open: the last one, else the first the student takes that has stars. */
export function defaultSubject(last: string | undefined, subjects: StarMap['subjects']): string {
  return subjects.find((s) => s.subjectId === last)?.subjectId
    ?? subjects.find((s) => s.enrolled && s.total > 0)?.subjectId
    ?? subjects.find((s) => s.total > 0)?.subjectId
    ?? subjects[0]?.subjectId
    ?? 'math'
}
