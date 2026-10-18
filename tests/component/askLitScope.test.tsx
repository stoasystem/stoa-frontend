/**
 * The lit card shows in the conversations it is about, not in all of them (#267).
 *
 * The moments lit this session were kept per account, and every thread read
 * them all: after a maths point lit, last week's German conversation ended
 * with "<point> is lit", and so did every other one. A card is now shown only
 * in a conversation about the point's subject that was open in Ask when the
 * point lit, or that was started after it lit.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AskPanel } from '@/features/ask/AskPanel'
import { useAskController } from '@/features/ask/useAskController'
import { resetAsk, useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'
import { litMomentsFor, useLitMomentsStore, type LitMoment } from '@/store/litMomentsStore'

vi.mock('@/services/student/studentApi', () => ({ getStudentProfile: vi.fn(async () => ({ grade: 'grade_9' })) }))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(async () => ({ items: [] })),
  getConversation: vi.fn(),
  createConversation: vi.fn(),
}))
vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn(), rotateAnalyticsSession: vi.fn() }))

import { getConversation } from '@/services/chat/chatApi'

const LIT_AT = '2026-10-18T09:00:00.000Z'
const moment = (conversationId: string | null, subjectId = 'math'): LitMoment => ({
  unitId: 'kp-sine',
  name: 'Sine and cosine',
  subjectId,
  nebulaId: 'trigonometry',
  litAt: LIT_AT,
  conversationId,
})

function conversation(id: string, subject: string, startedAt: string) {
  return {
    id,
    title: 'A conversation',
    subject,
    grade: 'grade_9',
    updatedAt: startedAt,
    messages: [{ id: `${id}-m1`, conversationId: id, role: 'user', content: 'A question', createdAt: startedAt, status: 'completed' }],
  }
}

function Host() {
  const controller = useAskController()
  return <AskPanel controller={controller} layout="panel" subjectId="math" />
}

async function openConversation(data: ReturnType<typeof conversation>, moments: LitMoment[]) {
  vi.mocked(getConversation).mockResolvedValue(data as never)
  useLitMomentsStore.setState({ byOwner: { 'student-a': moments } })
  useAskStore.getState().select('student-a', data.id)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByText('A question')
}

const card = () => screen.queryByRole('region', { name: i18n.t('chat:ask.lit.label') })

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({ user: { id: 'student-a' } as never })
})
afterEach(() => {
  vi.clearAllMocks()
  resetAsk()
  useLitMomentsStore.setState({ byOwner: {} })
  useAuthStore.setState({ user: null })
})

describe('the lit card in Ask (#267)', () => {
  it('shows in the conversation that was open when the point lit', async () => {
    await openConversation(conversation('c-open', 'math', '2026-10-18T08:00:00.000Z'), [moment('c-open')])
    expect(card()).not.toBeNull()
  })

  it('does not show in last week’s German conversation', async () => {
    await openConversation(conversation('c-german', 'german', '2026-10-11T08:00:00.000Z'), [moment('c-open')])
    expect(card()).toBeNull()
  })

  it('does not show in an older conversation of the same subject that was not open', async () => {
    await openConversation(conversation('c-old-maths', 'math', '2026-10-11T08:00:00.000Z'), [moment('c-open')])
    expect(card()).toBeNull()
  })

  it('shows in a conversation of its subject started after it lit', async () => {
    await openConversation(conversation('c-new', 'math', '2026-10-18T10:00:00.000Z'), [moment(null)])
    expect(card()).not.toBeNull()
  })
})

describe('which moments a conversation shows', () => {
  const thread = { id: 'c-1', subject: 'math', startedAt: '2026-10-18T08:00:00.000Z' }

  it('matches the subject however the map names it', () => {
    expect(litMomentsFor([moment('c-1', 'subj-math')], thread)).toHaveLength(1)
    expect(litMomentsFor([moment('c-1', 'physics')], thread)).toEqual([])
  })

  it('shows none while the conversation is still loading', () => {
    expect(litMomentsFor([moment('c-1')], { id: 'c-1', subject: undefined, startedAt: undefined })).toEqual([])
  })

  it('a conversation with no message yet is not one started after it lit', () => {
    expect(litMomentsFor([moment(null)], { ...thread, startedAt: undefined })).toEqual([])
  })
})
