/*
 * A knowledge point's chapter: its lessons in order, and how far the student
 * is (#13 point 1, #50).
 *
 * The route carries only the unit id. The curriculum catalog
 * (`GET /practice/curriculum/catalog`) says which subject and topic the unit
 * belongs to, and the topic's roadmap (`GET /practice/:subject/:topic/roadmap`)
 * gives the unit's lessons with this student's status for each. Both calls
 * exist today; nothing here changes their contract. When the star map's read
 * model lands (#48) it may carry the chapter itself, and this can read it
 * from there instead.
 */
import { useMemo } from 'react'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { usePracticeRoadmapQuery } from '@/hooks/practice/usePracticeRoadmapQuery'
import type { RoadmapLessonStatus } from '@/types/practice'

export type ChapterLessonStatus = RoadmapLessonStatus

export type ChapterLesson = {
  id: string
  title: string
  order: number
  status: ChapterLessonStatus
  estimatedMinutes?: number
  exerciseCount: number
}

export type Chapter = {
  unitId: string
  title: string
  subjectId: string
  topicId: string
  lessons: ChapterLesson[]
  /** Lessons completed. */
  done: number
  total: number
  /** The lesson to go on with: the one in progress, else the first open one. */
  nextLessonId: string | null
}

export type ChapterQuery =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'missing' }
  | { status: 'ready'; chapter: Chapter }

/** Where the student goes on in a chapter: the lesson marked current, else the first one they may open. */
export function nextLessonOf(lessons: readonly ChapterLesson[]): string | null {
  const current = lessons.find((lesson) => lesson.status === 'current')
  if (current) return current.id
  const open = lessons.find((lesson) => lesson.status === 'available' || lesson.status === 'review')
  return open?.id ?? null
}

/** The lesson after `lessonId` in the chapter that is not done yet, if any. */
export function lessonAfter(chapter: Chapter, lessonId: string): ChapterLesson | null {
  const index = chapter.lessons.findIndex((lesson) => lesson.id === lessonId)
  const rest = index >= 0 ? chapter.lessons.slice(index + 1) : chapter.lessons
  return rest.find((lesson) => lesson.status !== 'completed' && lesson.status !== 'locked') ?? null
}

export function useChapter(unitId: string | undefined): ChapterQuery {
  const catalogQuery = useCurriculumCatalogQuery()
  const unit = catalogQuery.data?.units.find((candidate) => candidate.id === unitId)
  const roadmapQuery = usePracticeRoadmapQuery(unit?.subjectId, unit?.topicId)
  const roadmap = roadmapQuery.data

  return useMemo<ChapterQuery>(() => {
    if (!unitId) return { status: 'missing' }
    if (catalogQuery.isLoading) return { status: 'loading' }
    if (catalogQuery.isError) return { status: 'error', retry: () => void catalogQuery.refetch() }
    if (!unit) return { status: 'missing' }
    if (roadmapQuery.isLoading) return { status: 'loading' }
    if (roadmapQuery.isError || !roadmap) return { status: 'error', retry: () => void roadmapQuery.refetch() }
    const roadmapUnit = roadmap.units.find((candidate) => candidate.id === unitId)
    if (!roadmapUnit) return { status: 'missing' }

    const counts = new Map(
      (catalogQuery.data?.lessons ?? [])
        .filter((lesson) => lesson.unitId === unitId)
        .map((lesson) => [lesson.id, lesson.exerciseCount] as const),
    )
    const lessons = [...roadmapUnit.lessons]
      .sort((a, b) => a.order - b.order)
      .map<ChapterLesson>((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        status: lesson.status,
        estimatedMinutes: lesson.estimatedMinutes,
        exerciseCount: counts.get(lesson.id) ?? lesson.challengeCount,
      }))
    return {
      status: 'ready',
      chapter: {
        unitId,
        title: roadmapUnit.title || unit.title,
        subjectId: unit.subjectId,
        topicId: unit.topicId,
        lessons,
        done: lessons.filter((lesson) => lesson.status === 'completed').length,
        total: lessons.length,
        nextLessonId: nextLessonOf(lessons),
      },
    }
  }, [unitId, unit, catalogQuery, roadmapQuery, roadmap])
}

/** `/chapter/:unitId` and `/chapter/:unitId/:lessonId`, each segment encoded once. */
export function chapterPath(unitId: string, lessonId?: string) {
  const base = `/chapter/${encodeURIComponent(unitId)}`
  return lessonId ? `${base}/${encodeURIComponent(lessonId)}` : base
}
