/**
 * #339: the parent's child page, progress page and learning history.
 *
 * The 2026-10-20 audit found, on a German screen:
 * - P4: the progress page printed the assignment's subject and topic ids
 *   ("math / linear-equations"), the assignment UUID where a title was
 *   missing, and the backend's English reason for it;
 * - P5: the child page carried the curriculum catalogue panel — the whole
 *   catalogue, not this child, with operator copy and a completed-lesson
 *   count that was always 0;
 * - P6: the child page's weak topics were the summary's ids as sent;
 * - P7: the subject cards counted the child's Ask questions under "Aufgaben";
 * - P8: the progress and history pages named no child and had no way back,
 *   and the child page had no way to the progress page;
 * - P11: the child page had no h1 while it loaded or failed, and its and the
 *   history page's loading and error lines were not announced.
 */
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { LearningProfileSignals } from '@/components/learning/LearningProfileSignals'
import deChat from '@/i18n/locales/de/chat.json'
import deParent from '@/i18n/locales/de/parent.json'
import dePractice from '@/i18n/locales/de/practice.json'
import enChat from '@/i18n/locales/en/chat.json'
import enParent from '@/i18n/locales/en/parent.json'
import enPractice from '@/i18n/locales/en/practice.json'
import frChat from '@/i18n/locales/fr/chat.json'
import frParent from '@/i18n/locales/fr/parent.json'
import frPractice from '@/i18n/locales/fr/practice.json'
import itChat from '@/i18n/locales/it/chat.json'
import itParent from '@/i18n/locales/it/parent.json'
import itPractice from '@/i18n/locales/it/practice.json'
import { ChildLearningHistoryPage } from '@/pages/parent/ChildLearningHistoryPage'
import { ChildSummaryPage } from '@/pages/parent/ChildSummaryPage'
import { ParentChildProgressPage } from '@/pages/parent/ParentChildProgressPage'
import type { LearningProfile } from '@/types/learningProfile'
import type { ChildLearningSummary } from '@/types/parent'

const state = vi.hoisted(() => ({
  summary: { isLoading: false, isError: false, data: undefined as unknown },
  profile: { isLoading: false, isError: false, data: undefined as unknown },
  history: { isLoading: false, isError: false, data: undefined as unknown },
  progress: { isLoading: false, error: null as unknown, data: undefined as unknown },
  catalogCalls: 0,
}))

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/hooks/parent/useChildLearningSummaryQuery', () => ({
  useChildLearningSummaryQuery: () => state.summary,
}))
vi.mock('@/hooks/parent/useChildLearningProfileQuery', () => ({
  useChildLearningProfileQuery: () => state.profile,
}))
vi.mock('@/hooks/parent/useChildLearningHistoryQuery', () => ({
  useChildLearningHistoryQuery: () => state.history,
}))
vi.mock('@/hooks/learning/useLearningOperationsQueries', () => ({
  useParentChildProgressQuery: () => state.progress,
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => {
    state.catalogCalls += 1
    return { data: undefined, isLoading: true, isError: false }
  },
}))

const LANGUAGES = {
  en: { parent: enParent, practice: enPractice, chat: enChat },
  de: { parent: deParent, practice: dePractice, chat: deChat },
  fr: { parent: frParent, practice: frPractice, chat: frChat },
  it: { parent: itParent, practice: itPractice, chat: itChat },
} as const

const initialLanguage = i18n.language

const SUMMARY: ChildLearningSummary = {
  student: { id: 'child-1', name: 'Nina Vogt', grade: '7' },
  questionsAskedThisWeek: 3,
  aiResolvedThisWeek: 2,
  teacherHelpRequestsThisWeek: 1,
  practiceLessonsCompletedThisWeek: 4,
  weakTopics: [],
  recentActivity: [],
}

const PROFILE: LearningProfile = {
  studentId: 'child-1',
  subjects: [{ id: 'math', labelKey: 'subjects.math', rolloutState: 'active' }],
  subjectActivity: [
    {
      subject: 'math',
      label: 'Mathematics',
      rolloutState: 'active',
      questionCount: 5,
      aiResolvedCount: 4,
      teacherEscalationCount: 1,
      feedbackAverage: null,
    },
  ],
  weakTopics: [],
  strengthTopics: [],
  updatedAt: '2026-10-19T09:00:00Z',
}

const UNKNOWN_REASON = 'Picked by the nightly sequencer for spaced review.'

function assignment(overrides: Record<string, unknown>) {
  return {
    assignmentId: '9f1c2e4a-7b3d-4c11-8e2f-5a6b7c8d9e0f',
    studentId: 'child-1',
    status: 'assigned',
    sourceType: 'curriculum_exercise',
    sourceId: 'ex-1',
    title: null,
    subject: 'math',
    topicIds: ['linear-equations', 'brueche'],
    reviewed: true,
    rationale: 'A reviewed curriculum exercise is available for this weak topic.',
    ...overrides,
  }
}

function at(path: string, pattern: string, page: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={page} />
      </Routes>
    </MemoryRouter>,
  )
}

const renderProgress = () =>
  at('/parent/children/child-1/progress', '/parent/children/:childId/progress', <ParentChildProgressPage />)
const renderHistory = () =>
  at('/parent/children/child-1/history', '/parent/children/:childId/history', <ChildLearningHistoryPage />)
const renderChild = () =>
  at('/parent/children/child-1', '/parent/children/:childId', <ChildSummaryPage />)

beforeEach(async () => {
  await i18n.changeLanguage('en')
  state.summary = { isLoading: false, isError: false, data: SUMMARY }
  state.profile = { isLoading: false, isError: false, data: undefined }
  state.history = { isLoading: false, isError: false, data: { items: [] } }
  state.progress = { isLoading: false, error: null, data: undefined }
  state.catalogCalls = 0
})

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

describe('P4: the progress page names what was assigned, not its ids', () => {
  for (const [language, { parent, practice, chat }] of Object.entries(LANGUAGES)) {
    it(`in ${language}`, async () => {
      await i18n.changeLanguage(language)
      state.progress = {
        isLoading: false,
        error: null,
        data: {
          assignedPracticeCount: 2,
          completedPracticeCount: 0,
          weakAreas: [],
          assignments: [
            assignment({}),
            assignment({ assignmentId: 'a-2', title: 'Fractions', topicIds: [], rationale: UNKNOWN_REASON }),
          ],
          completedAssignments: [],
        },
      }
      renderProgress()
      const body = document.body.textContent ?? ''

      expect(screen.getByText(practice.assignments.untitled)).toBeInTheDocument()
      expect(body).not.toContain('9f1c2e4a')
      expect(screen.getByText(`${chat.subjects.math} / Linear equations, ${practice.progress.topicNames.brueche}`)).toBeInTheDocument()
      expect(screen.getByText(`${chat.subjects.math} / ${parent.progress.topicPending}`)).toBeInTheDocument()
      expect(body).not.toContain('linear-equations')
      expect(body).not.toMatch(/\bmath\b/)

      expect(screen.getByText(practice.progress.rationale.curriculumExercise)).toBeInTheDocument()
      if (language === 'en') {
        expect(screen.getByText(UNKNOWN_REASON)).toBeInTheDocument()
      } else {
        expect(body).not.toContain('reviewed curriculum exercise')
        expect(body).not.toContain(UNKNOWN_REASON)
        expect(screen.getByText(parent.progress.defaultExplanation)).toBeInTheDocument()
      }
    })
  }
})

describe('P5: the child page shows no curriculum catalogue', () => {
  it('neither renders the panel nor loads the catalogue', async () => {
    await i18n.changeLanguage('de')
    renderChild()
    expect(screen.queryByText(dePractice.curriculumRollout.title)).not.toBeInTheDocument()
    expect(screen.queryByText(dePractice.curriculumRollout.heading)).not.toBeInTheDocument()
    expect(screen.queryByText(dePractice.curriculumRollout.loading)).not.toBeInTheDocument()
    expect(state.catalogCalls).toBe(0)
  })
})

describe('P6: the child page names weak topics', () => {
  const weakCard = (parent: typeof enParent) =>
    screen.getByText(parent.summary.weakTopics).closest('.stoa-card') as HTMLElement

  for (const [language, { parent, chat, practice }] of Object.entries(LANGUAGES)) {
    it(`from the summary's ids in ${language}`, async () => {
      await i18n.changeLanguage(language)
      state.summary = {
        isLoading: false,
        isError: false,
        data: { ...SUMMARY, weakTopics: ['math', 'linear-equations', 'brueche', 'Lineare Funktionen'] },
      }
      renderChild()
      const card = within(weakCard(parent))
      expect(card.getByText(chat.subjects.math)).toBeInTheDocument()
      expect(card.getByText('Linear equations')).toBeInTheDocument()
      expect(card.getByText(practice.progress.topicNames.brueche)).toBeInTheDocument()
      expect(card.getByText('Lineare Funktionen')).toBeInTheDocument()
      expect(card.queryByText('math')).not.toBeInTheDocument()
      expect(card.queryByText('linear-equations')).not.toBeInTheDocument()
    })
  }

  it("from the learning profile's labels when it has them", async () => {
    await i18n.changeLanguage('de')
    state.summary = { isLoading: false, isError: false, data: { ...SUMMARY, weakTopics: ['math', 'linear-equations'] } }
    state.profile = {
      isLoading: false,
      isError: false,
      data: {
        ...PROFILE,
        weakTopics: [
          { subject: 'math', topicId: 'bruchrechnen', label: 'Bruchrechnen', count: 2, evidenceQuestionIds: [] },
          { subject: 'math', topicId: 'satz-des-pythagoras', label: 'satz-des-pythagoras', count: 1, evidenceQuestionIds: [] },
        ],
      },
    }
    renderChild()
    const card = within(weakCard(deParent))
    expect(card.getByText('Bruchrechnen')).toBeInTheDocument()
    expect(card.getByText('Satz des pythagoras')).toBeInTheDocument()
    expect(card.queryByText('satz-des-pythagoras')).not.toBeInTheDocument()
    expect(card.queryByText(deChat.subjects.math)).not.toBeInTheDocument()
  })
})

describe('P7: the subject card counts questions asked', () => {
  for (const [language, { practice }] of Object.entries(LANGUAGES)) {
    it(`in ${language}`, async () => {
      await i18n.changeLanguage(language)
      render(<LearningProfileSignals title="t" description="d" profile={PROFILE} isLoading={false} isError={false} />)
      expect(screen.getByText(practice.profile.questionsAsked)).toBeInTheDocument()
      expect(screen.queryByText(practice.set.metricQuestions)).not.toBeInTheDocument()
    })
  }
})

describe('P8: the child pages lead to each other', () => {
  it('the child page links to the progress page', async () => {
    await i18n.changeLanguage('de')
    renderChild()
    expect(screen.getByRole('link', { name: deParent.summary.progressLink }))
      .toHaveAttribute('href', '/parent/children/child-1/progress')
  })

  for (const [name, render] of [['progress', renderProgress], ['history', renderHistory]] as const) {
    it(`the ${name} page names the child and leads back to the child page`, async () => {
      await i18n.changeLanguage('de')
      render()
      const crumbs = within(screen.getByRole('navigation'))
      expect(crumbs.getByRole('link', { name: 'Nina Vogt' })).toHaveAttribute('href', '/parent/children/child-1')
      expect(crumbs.getByRole('link', { name: deParent.dashboardTitle })).toHaveAttribute('href', '/parent')
      expect(screen.getByRole('link', { name: deParent.childSummary })).toHaveAttribute('href', '/parent/children/child-1')
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  }

  it('falls back to a generic name while the child is unknown', async () => {
    await i18n.changeLanguage('de')
    state.summary = { isLoading: true, isError: false, data: undefined }
    renderProgress()
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: deParent.child }))
      .toHaveAttribute('href', '/parent/children/child-1')
  })
})

describe('P11: loading and failure keep a heading and are announced', () => {
  it('the child page while it loads', async () => {
    await i18n.changeLanguage('de')
    state.summary = { isLoading: true, isError: false, data: undefined }
    renderChild()
    expect(screen.getByRole('heading', { level: 1, name: deParent.childSummary })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(deParent.summary.loading)
  })

  it('the child page when it fails', async () => {
    await i18n.changeLanguage('de')
    state.summary = { isLoading: false, isError: true, data: undefined }
    renderChild()
    expect(screen.getByRole('heading', { level: 1, name: deParent.childSummary })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(deParent.summary.loadFailed)
  })

  it('the child page has one h1 once loaded: the child', async () => {
    renderChild()
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Nina Vogt'])
  })

  it('the history page while it loads and when it fails', async () => {
    await i18n.changeLanguage('de')
    state.history = { isLoading: true, isError: false, data: undefined }
    const { unmount } = renderHistory()
    expect(screen.getByRole('status')).toHaveTextContent(deParent.history.loading)
    unmount()

    state.history = { isLoading: false, isError: true, data: undefined }
    renderHistory()
    expect(screen.getByRole('alert')).toHaveTextContent(deParent.history.loadFailed)
  })
})
