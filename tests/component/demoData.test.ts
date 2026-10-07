/**
 * The design preview's demo data set (#116): the contract `src/dev/demo/data`
 * exports, the demo knowledge point's chapter walked from a wrong answer to a
 * lit star, Ask's conversations with a human-help request, the bell, /me --
 * and that no production code imports any of it.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { notificationTargetPath } from '@/components/notifications/notificationTargets'
import * as demo from '@/dev/demo/data'
import { useChapter } from '@/features/chapter/useChapter'
import { supportedLanguages } from '@/i18n/languages'

vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getCurriculumCatalog: vi.fn(async () => demo.demoCatalog()),
  getPracticeRoadmap: vi.fn(async () => demo.demoRoadmap()),
}))

const { demoChapter, DEMO_KNOWLEDGE_POINT } = demo
const lessonIds = DEMO_KNOWLEDGE_POINT.lessons.map((lesson) => lesson.lessonId)

describe('the contract', () => {
  it('exports the named, typed objects the preview reads', () => {
    for (const name of ['demoStudent', 'demoProfile', 'demoNotifications', 'demoConversations', 'demoChapter', 'demoSky', 'demoStarMap', 'DEMO_KNOWLEDGE_POINT', 'FIXTURE_SIZES'] as const) {
      expect(demo[name]).toBeDefined()
    }
    expect(demo.demoStudent.role).toBe('student')
    expect(demo.demoProfile.userId).toBe(demo.demoStudent.id)
  })

  it('gives /me the subjects the student takes: the enrolled galaxies', () => {
    const sky = demo.demoSky(1000)
    expect(demo.demoProfile.primarySubjects).toEqual(sky.galaxies.filter((galaxy) => galaxy.enrolled).map((galaxy) => galaxy.subjectId))
    expect(demo.demoProfile.primarySubjects).toEqual(['math', 'physics'])
  })

  it.each(supportedLanguages)('has the whole set in %s', (language) => {
    const set = demo.demoDataFor(language)
    expect(set.demoStudent.preferredLocale).toBe(language)
    expect(set.demoProfile.preferredAnswerLanguage).toBe(language)
    const texts = [
      ...set.demoNotifications.items.flatMap((item) => [item.title, item.summary]),
      ...set.demoConversations.flatMap((conversation) => [conversation.title, ...conversation.messages.map((message) => message.content)]),
      ...set.demoChapter.lessons.flatMap((lesson) => [lesson.title, ...lesson.challenges.flatMap((c) => [c.prompt, c.hint ?? '', c.explanation ?? '', ...(c.options ?? [])])]),
      ...set.demoChapter.roadmap.units.flatMap((unit) => [unit.title, ...unit.lessons.map((lesson) => lesson.title)]),
    ]
    for (const text of texts) expect(text.trim()).not.toBe('')
    if (language !== 'en') {
      expect(set.demoChapter.lessons[0].challenges[0].prompt).not.toBe(demoChapter.lessons[0].challenges[0].prompt)
      expect(set.demoNotifications.items[0].title).not.toBe(demo.demoNotifications.items[0].title)
    }
  })
})

describe('the demo knowledge point’s chapter', () => {
  it('is the star the sky marks, with the lessons and progress the star shows', () => {
    const sky = demo.demoSky(1000)
    const star = sky.stars.find((candidate) => candidate.unitId === demoChapter.unitId)!
    expect(sky.knowledgePointId).toBe(demoChapter.unitId)
    expect(star.chapter.lessonCount).toBe(demoChapter.lessons.length)
    expect(star.chapter.lessonsDone).toBe(demoChapter.completed.length)
    expect(star.chapter.nextLesson?.lessonId).toBe(demoChapter.roadmap.currentLessonId)
    const remaining = demoChapter.lessons.filter((lesson) => !demoChapter.completed.includes(lesson.id))
    expect(star.unmetExercises).toBe(remaining.reduce((sum, lesson) => sum + lesson.challenges.length, 0))
    expect(demoChapter.catalog.units.map((unit) => unit.id)).toEqual([demoChapter.unitId])
    expect(demoChapter.catalog.lessons.map((lesson) => lesson.exerciseCount)).toEqual(demoChapter.lessons.map((lesson) => lesson.challenges.length))
  })

  it('has several lessons of several exercises, every answer right by the check', () => {
    expect(demoChapter.lessons.length).toBeGreaterThanOrEqual(3)
    for (const language of supportedLanguages) {
      for (const lesson of demo.demoLessons(language)) {
        expect(lesson.challenges.length).toBeGreaterThanOrEqual(3)
        for (const challenge of lesson.challenges) {
          if (challenge.type === 'multiple_choice') expect(challenge.options).toContain(challenge.correctAnswer)
          if (challenge.type === 'ordering') expect([...(challenge.correctAnswer as string[])].sort()).toEqual([...challenge.options!].sort())
          expect(demo.checkDemoAnswer(challenge.id, challenge.correctAnswer, language)?.correct).toBe(true)
          expect(demo.demoHint(challenge.id, language)?.hint).toBe(challenge.hint)
        }
      }
    }
  })

  it('walks a wrong answer, a right one, a finished lesson and a lit star', () => {
    expect(demo.demoKnowledgePointState()).toBe('in_progress')
    const roadmap = demo.demoRoadmap()
    expect(roadmap.units[0].lessons.map((lesson) => lesson.status)).toEqual(['completed', 'current', 'available'])

    const current = demoChapter.lessons.find((lesson) => lesson.id === roadmap.currentLessonId)!
    const first = current.challenges[0]
    const wrong = first.options!.find((option) => option !== first.correctAnswer)!
    const missed = demo.checkDemoAnswer(first.id, wrong)!
    expect(missed).toMatchObject({ correct: false, feedback: first.incorrectFeedback, hint: first.hint })
    expect(demo.checkDemoAnswer(first.id, first.correctAnswer)).toMatchObject({ correct: true, feedback: first.correctFeedback })
    // A text answer counts with a decimal comma, too.
    const decimal = current.challenges.find((challenge) => challenge.correctAnswer === '0.6')!
    expect(demo.checkDemoAnswer(decimal.id, ' 0,6 ')?.correct).toBe(true)

    expect(demo.demoLessonResult(current.id)).toMatchObject({ lessonId: current.id, correctCount: current.challenges.length })
    const afterTwo = [...demoChapter.completed, current.id]
    expect(demo.demoRoadmap(afterTwo).units[0].lessons.map((lesson) => lesson.status)).toEqual(['completed', 'completed', 'current'])
    expect(demo.demoKnowledgePointState(afterTwo)).toBe('in_progress')
    const done = demo.demoRoadmap(lessonIds)
    expect(done.currentLessonId).toBeUndefined()
    expect(done.progress).toBe(1)
    expect(demo.demoKnowledgePointState(lessonIds)).toBe('lit')
    expect(demo.checkDemoAnswer('not-a-demo-exercise', 'x')).toBeNull()
  })

  it('is what the chapter page reads (`useChapter`)', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children)
    const { result } = renderHook(() => useChapter(demoChapter.unitId), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    if (result.current.status !== 'ready') return
    expect(result.current.chapter).toMatchObject({
      unitId: demoChapter.unitId,
      subjectId: 'math',
      topicId: 'trigonometry',
      done: 1,
      total: 3,
      nextLessonId: lessonIds[1],
    })
    expect(result.current.chapter.lessons.map((lesson) => lesson.exerciseCount)).toEqual([3, 4, 3])
  })
})

describe('Ask, the bell and /me', () => {
  it('has conversations with messages, one with a teacher working on a help request', () => {
    expect(demo.demoConversations.length).toBeGreaterThanOrEqual(2)
    for (const conversation of demo.demoConversations) {
      expect(conversation.messages.length).toBeGreaterThan(0)
      for (const message of conversation.messages) expect(message.conversationId).toBe(conversation.id)
    }
    const [help] = demo.demoTeacherHelpRequests
    expect(help.status).toBe('in_progress')
    const helped = demo.demoConversations.find((conversation) => conversation.id === help.conversationId)!
    expect(helped.messages.some((message) => message.role === 'teacher')).toBe(true)
    expect(new Set(demo.demoConversations.map((conversation) => conversation.subject))).toEqual(new Set(['math', 'physics']))
    expect(demo.demoConversationList.items.map((item) => item.id)).toEqual(demo.demoConversations.map((conversation) => conversation.id))
  })

  it('has a few notifications, the unread ones opening the helped conversation', () => {
    const { items, count } = demo.demoNotifications
    expect(count).toBe(items.length)
    expect(items.length).toBeGreaterThanOrEqual(3)
    const unread = items.filter((item) => item.status === 'created')
    expect(unread.length).toBeGreaterThan(0)
    for (const item of unread) {
      expect(notificationTargetPath(item, 'student')).toBe(`/ask/${demo.DEMO_HELP_CONVERSATION_ID}`)
    }
  })
})

describe('production code', () => {
  // The directory entries say which are directories: no stat call per file.
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      return entry.isDirectory() ? files(path) : /\.(ts|tsx)$/.test(path) ? [path] : []
    })
  }

  // Reads every source file: some 30 ms alone, but with the full suite beside
  // it (a production build among it) reading the same disk, it once took 21 s
  // (#133). A real hang still fails, at 30 s, like designPreviewExcluded's walk.
  it('never imports the demo data set (`src/dev` only)', { timeout: 30_000 }, () => {
    const offenders = files('src')
      .filter((path) => !path.replace(/\\/g, '/').startsWith('src/dev/'))
      .filter((path) => /from\s+['"](@\/dev\/demo|[./]+\/dev\/demo)/.test(readFileSync(path, 'utf8')))
    expect(offenders).toEqual([])
  })
})
