/**
 * Getting Ask back after it was closed (#125).
 *
 * Closing the panel left the docked composer -- a new question could still be
 * asked -- but the conversation just read had no entry anywhere on the page.
 * The way back is a button on the right edge, and it goes back to the
 * conversation that was open, not to an empty new one.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { ASK_REOPEN } from '@/features/ask/askLayout'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(async () => ({
    items: [
      { id: 'c1', title: 'Linear equations', subject: 'math', grade: '8', updatedAt: '2026-10-11T10:00:00.000Z' },
      { id: 'c2', title: 'Fractions', subject: 'math', grade: '8', updatedAt: '2026-10-10T10:00:00.000Z' },
    ],
  })),
  getConversation: vi.fn(async (id: string) => ({
    id,
    title: id === 'c2' ? 'Fractions' : 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-10-11T10:00:00.000Z',
    messages: [],
  })),
  createConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(async () => ({ online: false, availableTeachers: 0 })),
  getTeacherHelpRequest: vi.fn(async () => {
    throw new ApiError('never escalated', { status: 404 })
  }),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))

function emulateWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: !min || width >= Number(min[1]),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

function planet(width = 1280) {
  emulateWidth(width)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/planet/math']}>
          <AskHost>
            <button type="button">Rotate the planet</button>
          </AskHost>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const reopen = () => document.querySelector<HTMLElement>('[data-ask-reopen]')
const surface = () => document.querySelector<HTMLElement>('[data-ask-surface]')
const dockedField = () => within(document.querySelector<HTMLElement>('[data-ask-docked]')!).getByRole('textbox')

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('the way back into Ask', () => {
  it('is on the page while Ask is closed, and gone while it is open', async () => {
    planet()
    expect(reopen()).not.toBeNull()

    await userEvent.type(dockedField(), 'W')
    expect(surface()).not.toBeNull()
    // The negative: with the panel on screen there is nothing to call back.
    expect(reopen()).toBeNull()
  })

  it('opens the conversation that was being read, not a new empty one', async () => {
    planet()
    await userEvent.type(dockedField(), 'W')
    await userEvent.click(await screen.findByRole('button', { name: /Fractions/ }))
    expect(surface()).toHaveAttribute('data-ask-conversation', 'c2')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(surface()).toBeNull()

    const back = reopen()!
    expect(back).toHaveAttribute('data-ask-reopen', 'conversation')
    expect(back).toHaveAccessibleName('Back to your conversation')
    await userEvent.click(back)

    expect(surface()).toHaveAttribute('data-ask-conversation', 'c2')
    expect(await screen.findByRole('heading', { name: 'Fractions' })).toBeInTheDocument()
  })

  it('opens the list, and says so, when no conversation was open', async () => {
    planet()
    const back = reopen()!
    expect(back).toHaveAttribute('data-ask-reopen', 'list')
    expect(back).toHaveAccessibleName('Open Ask')

    await userEvent.click(back)
    expect(surface()).toHaveAttribute('data-ask-conversation', '')
  })

  it('keeps clear of the controls the pages already put in the corners', () => {
    planet()
    const back = reopen()!
    // The right edge's middle: the zoom pair, the legend, the "?" and the
    // docked composer all live along the bottom, and the role switcher used for
    // testing is `fixed left-2 top-1/2` on the other side.
    expect(back).toHaveStyle({ right: `${ASK_REOPEN.inset}px`, width: '44px', height: '44px' })
    expect(back.className).toContain('top-1/2')
    expect(back.className).toContain('-translate-y-1/2')
    expect(back.className).not.toContain('bottom-')
  })
})
