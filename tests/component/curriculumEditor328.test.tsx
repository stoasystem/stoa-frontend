/**
 * The curriculum editor belongs to one version (#328).
 *
 * The draft patch, its invalid-JSON flag, the save result, the submit-review
 * error and the diff's "from" version all outlived a switch to another
 * lesson, so Save wrote lesson A's content (exercises replaced) into lesson B.
 * And while the preview was loading or had failed, "Current content" showed
 * an empty lesson that "Load current content" copied and Save wrote back,
 * deleting every exercise.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import {
  getCurriculumPreview,
  getCurriculumWorklist,
  patchCurriculumDraft,
  submitCurriculumReview,
} from '@/services/admin/curriculumApi'
import { ApiError } from '@/services/api/httpClient'
import type { CurriculumVersion } from '@/types/curriculumOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/services/admin/curriculumApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/curriculumApi')>(
    '@/services/admin/curriculumApi',
  )
  return {
    ...actual,
    getCurriculumWorklist: vi.fn(),
    getCurriculumPreview: vi.fn(),
    patchCurriculumDraft: vi.fn(),
    submitCurriculumReview: vi.fn(),
  }
})

const worklist = vi.mocked(getCurriculumWorklist)
const preview = vi.mocked(getCurriculumPreview)
const patch = vi.mocked(patchCurriculumDraft)
const submit = vi.mocked(submitCurriculumReview)

const LESSON_A: CurriculumVersion = { publicLessonId: 'lesson-a', versionId: 'va1', state: 'draft' }
const LESSON_B: CurriculumVersion = { publicLessonId: 'lesson-b', versionId: 'vb1', state: 'draft' }
const EXERCISE_A = { exerciseId: 'exercise-a-1', prompt: 'Solve x + 4 = 9.' }
const EXERCISE_B = { exerciseId: 'exercise-b-1', prompt: 'Solve 2x = 8.' }

function previewOf(versionId: string): CurriculumVersion {
  return versionId === 'va1'
    ? { ...LESSON_A, lesson: { title: 'Lesson A' }, exercises: [EXERCISE_A] }
    : { ...LESSON_B, lesson: { title: 'Lesson B' }, exercises: [EXERCISE_B] }
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
  worklist.mockResolvedValue({ items: [LESSON_A, LESSON_B], count: 2 })
  preview.mockImplementation(async (_lesson, versionId) => previewOf(versionId))
  patch.mockImplementation(async ({ versionId }) => previewOf(versionId))
})
afterAll(async () => {
  await i18n.changeLanguage('en')
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AdminCurriculumPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

/** Opens a version from the worklist tab and goes to the given tab. */
async function open(user: ReturnType<typeof userEvent.setup>, lessonId: string, tab: string) {
  await user.click(screen.getByRole('tab', { name: 'Worklist' }))
  const card = (await screen.findByRole('heading', { name: lessonId })).closest('div.grid') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Open' }))
  await user.click(screen.getByRole('tab', { name: tab }))
}

const editor = () => screen.getByRole('textbox', { name: 'Draft patch' })
const save = () => screen.getByRole('button', { name: 'Save draft' })
const loadCurrent = () => screen.getByRole('button', { name: 'Load current content' })

describe('switching versions', () => {
  it('drops the patch for lesson A, so saving lesson B never sends it', async () => {
    const user = userEvent.setup()
    renderPage()
    await open(user, 'lesson-a', 'Editor')
    await waitFor(() => expect(loadCurrent()).toBeEnabled())
    await user.click(loadCurrent())
    expect((editor() as HTMLTextAreaElement).value).toContain('exercise-a-1')

    await open(user, 'lesson-b', 'Editor')
    expect(editor()).toHaveValue('{}')
    await waitFor(() => expect(save()).toBeEnabled())
    await user.click(save())

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1))
    expect(patch.mock.calls[0][0]).toEqual({ publicLessonId: 'lesson-b', versionId: 'vb1', payload: {} })
  })

  it('drops the invalid-JSON warning and the save result of lesson A', async () => {
    const user = userEvent.setup()
    renderPage()
    await open(user, 'lesson-a', 'Editor')
    await waitFor(() => expect(save()).toBeEnabled())
    await user.click(save())
    expect(await screen.findByText('Saved va1.')).toBeInTheDocument()
    fireEvent.change(editor(), { target: { value: '{ not json' } })
    await user.click(save())
    expect(editor()).toHaveAttribute('aria-invalid', 'true')

    await open(user, 'lesson-b', 'Editor')
    expect(screen.queryByText('Saved va1.')).not.toBeInTheDocument()
    expect(editor()).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('drops the submit-review error and the diff base of lesson A', async () => {
    submit.mockRejectedValue(new ApiError('nope', { status: 409, code: 'not_draft' }))
    const user = userEvent.setup()
    renderPage()
    await open(user, 'lesson-a', 'Review')
    fireEvent.change(screen.getByPlaceholderText('from version'), { target: { value: 'va0' } })
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    await open(user, 'lesson-b', 'Review')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('from version')).toHaveValue('')
    expect(screen.getByPlaceholderText('to version')).toHaveValue('vb1')
  })

  it('keeps the patch when the same version is opened again', async () => {
    const user = userEvent.setup()
    renderPage()
    await open(user, 'lesson-a', 'Editor')
    fireEvent.change(editor(), { target: { value: '{"lesson":{"title":"Draft"}}' } })
    await open(user, 'lesson-a', 'Editor')
    expect(editor()).toHaveValue('{"lesson":{"title":"Draft"}}')
  })
})

describe('the current content', () => {
  it('says it is loading, and keeps Load current and Save off, until the preview arrives', async () => {
    let arrive!: (value: CurriculumVersion) => void
    preview.mockReturnValue(new Promise((done) => (arrive = done)))
    const user = userEvent.setup()
    renderPage()
    await open(user, 'lesson-a', 'Editor')

    expect(screen.getByText('Loading the current content.')).toBeInTheDocument()
    expect(screen.queryByText(/"exercises": \[\]/)).not.toBeInTheDocument()
    expect(loadCurrent()).toBeDisabled()
    expect(save()).toBeDisabled()

    arrive(previewOf('va1'))
    await waitFor(() => expect(loadCurrent()).toBeEnabled())
    expect(save()).toBeEnabled()
    expect(screen.getByText(/exercise-a-1/)).toBeInTheDocument()
  })

  it('says it failed instead of showing an empty lesson, and offers a retry', async () => {
    preview.mockRejectedValueOnce(new ApiError('down', { status: 503 }))
    const user = userEvent.setup()
    renderPage()
    await open(user, 'lesson-a', 'Editor')

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/The current content could not be loaded/)).toBeInTheDocument()
    expect(screen.queryByText(/"exercises": \[\]/)).not.toBeInTheDocument()
    expect(loadCurrent()).toBeDisabled()
    expect(save()).toBeDisabled()
    fireEvent.submit(save().closest('form') as HTMLFormElement)
    expect(patch).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(loadCurrent()).toBeEnabled())
    expect(save()).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
