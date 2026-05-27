import type { PracticeLesson, PracticeLessonResult, PracticeMistake } from '@/types/practice'

export const defaultPracticeTopicId = 'equations'

export function getPracticeTopicPath(subjectId: string, topicId = defaultPracticeTopicId) {
  return `/practice/${subjectId}/${topicId}`
}

export function getPracticeLessonPath(lesson: Pick<PracticeLesson, 'subjectId' | 'topicId' | 'id'>) {
  return getPracticeLessonPathFromIds(lesson.subjectId, lesson.topicId, lesson.id)
}

export function getPracticeLessonPathFromIds(subjectId: string, topicId: string | undefined, lessonId: string) {
  return `${getPracticeTopicPath(subjectId, topicId)}/lessons/${lessonId}`
}

export function getPracticeLessonResultPath(lesson: Pick<PracticeLesson, 'subjectId' | 'topicId' | 'id'>) {
  return `${getPracticeLessonPath(lesson)}/result`
}

export function getPracticeMistakeLessonPath(mistake: Pick<PracticeMistake, 'subjectId' | 'topicId' | 'lessonId'>) {
  return `${getPracticeTopicPath(mistake.subjectId, mistake.topicId)}/lessons/${mistake.lessonId}`
}

export function getPracticeResultTopicPath(result: Pick<PracticeLessonResult, 'subjectId' | 'topicId'>) {
  return getPracticeTopicPath(result.subjectId, result.topicId)
}
