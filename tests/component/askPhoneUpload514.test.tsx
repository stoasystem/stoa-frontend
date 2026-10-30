/**
 * A photo from the phone, by a QR in Ask on the computer (#514; the backend's
 * stoa-backend#146).
 *
 * The computer makes a one-time code for the open conversation and shows it as
 * a QR with the ten minutes it has left, then asks how far the phone has got.
 * Once the photo has passed it is shown, and joins the question only when the
 * student adds it: whoever scans the QR first holds the code (stoa-backend#171,
 * audit item M1). The question then carries it as `{uploadId}` like any upload.
 *
 * This drives the real panel; only the services at the edge are answered.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { encode } from 'uqr'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import i18n from '@/i18n'
import { ApiError, apiErrorFromBody } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { Conversation } from '@/types/chat'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/commandMessageIds', () => ({
  commandMessageIds: vi.fn(async (conversationId: string, key: string) => ({
    studentMessageId: `student:${conversationId}:${key}`,
    assistantMessageId: `assistant:${conversationId}:${key}`,
  })),
}))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(),
  getConversation: vi.fn(),
  createConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/files/uploadCodeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/uploadCodeApi')>()),
  createUploadCode: vi.fn(),
  readUploadCode: vi.fn(),
  readUploadCodePhoto: vi.fn(),
}))
// The encoder is imported when a QR is first shown; a load that fails is said.
let encoderFails = false
vi.mock('uqr', async (importOriginal) => {
  const real = await importOriginal<typeof import('uqr')>()
  return {
    ...real,
    encode: (...args: Parameters<typeof real.encode>) => {
      if (encoderFails) throw new Error('Failed to fetch dynamically imported module')
      return real.encode(...args)
    },
  }
})
let attachmentsWork = true
vi.mock('@/features/ask/attachmentsSwitch', () => ({
  get ATTACHMENTS_WORK() {
    return attachmentsWork
  },
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

import { getConversation } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'
import { createUploadCode, readUploadCode, readUploadCodePhoto } from '@/services/files/uploadCodeApi'

const createMock = vi.mocked(createUploadCode)
const readMock = vi.mocked(readUploadCode)
const photoMock = vi.mocked(readUploadCodePhoto)
const streamMock = vi.mocked(streamConversationMessage)

const CODE_ID = 'a1'.repeat(16)
const CODE = `${CODE_ID}.${'s'.repeat(43)}`

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000).toISOString()

function conversation(): Conversation {
  return {
    id: 'c1',
    title: 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-10-30T10:00:00.000Z',
    messages: [],
  }
}

/** A computer (a fine pointer) or a phone (a coarse one), at a desktop width. */
function emulate(device: 'computer' | 'phone') {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('pointer: coarse') ? device === 'phone' : !/max-width/.test(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

function openAsk(conversationId: string | null = 'c1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[conversationId ? `/ask/${conversationId}` : '/ask']}>
          <AskHost route={{ conversationId }} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return within(screen.getByRole('complementary'))
}

/** The QR's modules for `text`, drawn the way the card draws them. */
function qrPath(text: string) {
  let drawn = ''
  encode(text, { ecc: 'M', border: 4 }).data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) drawn += `M${x} ${y}h1v1h-1z`
    }),
  )
  return drawn
}

const originalMatchMedia = window.matchMedia
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

beforeEach(async () => {
  await i18n.changeLanguage('en')
  emulate('computer')
  attachmentsWork = true
  encoderFails = false
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  vi.mocked(getConversation).mockResolvedValue(conversation())
  vi.mocked(getGenerationProgress).mockResolvedValue({ status: 'completed', steps: [] } as never)
  streamMock.mockResolvedValue('streamed')
  createMock.mockResolvedValue({ codeId: CODE_ID, code: CODE, expiresAt: minutesFromNow(10) })
  readMock.mockResolvedValue({ codeId: CODE_ID, status: 'waiting', expiresAt: minutesFromNow(10), redeemedAt: null, uploadId: null })
  photoMock.mockResolvedValue(new Blob([new Uint8Array(3000)], { type: 'image/jpeg' }))
  URL.createObjectURL = vi.fn(() => 'blob:phone-photo')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
  sessionStorage.clear()
  vi.clearAllMocks()
})

const PHONE = 'Send a photo from your phone'

function ready(redeemedAt = new Date().toISOString()) {
  readMock.mockResolvedValue({
    codeId: CODE_ID,
    status: 'ready',
    expiresAt: minutesFromNow(9),
    redeemedAt,
    uploadId: 'up-phone',
  })
}

describe('the phone entry in Ask', () => {
  it('is offered on a computer with a conversation open', async () => {
    const ask = openAsk()
    await ask.findByText('Linear equations')
    expect(ask.getByRole('button', { name: PHONE })).toBeInTheDocument()
  })

  it('waits behind the attachments switch, as the paperclip does', async () => {
    attachmentsWork = false
    const ask = openAsk()
    await ask.findByText('Linear equations')
    expect(ask.queryByRole('button', { name: PHONE })).toBeNull()
  })

  it('is not offered on a phone, where the camera is right there', async () => {
    emulate('phone')
    const ask = openAsk()
    await ask.findByText('Linear equations')
    expect(ask.queryByRole('button', { name: PHONE })).toBeNull()
  })

  it('is not offered before there is a conversation for the code to belong to', async () => {
    const ask = openAsk(null)
    await ask.findByRole('textbox', { name: 'Your question' })
    expect(ask.queryByRole('button', { name: PHONE })).toBeNull()
  })
})

describe('the QR', () => {
  it('carries the code after the # of the phone page’s address, with the time it has left', async () => {
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))

    const qr = await ask.findByRole('img', { name: 'QR code to send a photo from your phone' })
    expect(createMock).toHaveBeenCalledWith('c1')
    expect(qr.querySelector('path')?.getAttribute('d')).toBe(qrPath(`${window.location.origin}/upload#${CODE}`))
    expect(ask.getByText(/^Works for (10:00|9:5\d) more$/)).toBeInTheDocument()
    await waitFor(() => expect(readMock).toHaveBeenCalledWith('c1', CODE_ID, expect.anything()))
  })

  it('says so when the QR cannot be drawn, rather than showing an empty square', async () => {
    encoderFails = true
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))

    expect(await ask.findByText('The QR code could not be shown. Reload the page and try again.')).toBeInTheDocument()
    expect(ask.queryByRole('img', { name: 'QR code to send a photo from your phone' })).toBeNull()
  })

  it.each([
    ['en', 'This code has expired. Make a new one.', 'New code'],
    ['de', 'Dieser Code ist abgelaufen. Erstell einen neuen.', 'Neuer Code'],
    ['fr', 'Ce code a expiré. Crées-en un nouveau.', 'Nouveau code'],
    ['it', 'Questo codice è scaduto. Creane uno nuovo.', 'Nuovo codice'],
  ])('says in %s when the ten minutes ran out, and makes a new code', async (language, sentence, renew) => {
    await i18n.changeLanguage(language)
    readMock.mockResolvedValue({ codeId: CODE_ID, status: 'expired', expiresAt: minutesFromNow(-1), redeemedAt: null, uploadId: null })
    openAsk()
    const button = await screen.findByRole('button', { name: i18n.t('composer.phone', { ns: 'common' }) })
    await userEvent.click(button)

    expect(await screen.findByText(sentence)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: i18n.t('ask.phone.qrLabel', { ns: 'chat' }) })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: renew }))
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(2))
  })

  it('takes the QR down once the code’s own time is up, before the server says so', async () => {
    createMock.mockResolvedValue({ codeId: CODE_ID, code: CODE, expiresAt: minutesFromNow(-0.01) })
    readMock.mockResolvedValue({ codeId: CODE_ID, status: 'waiting', expiresAt: minutesFromNow(-0.01), redeemedAt: null, uploadId: null })
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))

    expect(await ask.findByText('This code has expired. Make a new one.')).toBeInTheDocument()
    expect(ask.queryByRole('img', { name: 'QR code to send a photo from your phone' })).toBeNull()
  })

  it('says the phone is sending once it took the code', async () => {
    readMock.mockResolvedValue({ codeId: CODE_ID, status: 'uploading', expiresAt: minutesFromNow(9), redeemedAt: new Date().toISOString(), uploadId: null })
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))

    expect(await ask.findByText('Your phone is sending the photo…')).toBeInTheDocument()
    expect(ask.queryByRole('img', { name: 'QR code to send a photo from your phone' })).toBeNull()
  })

  it('says when the photo did not arrive', async () => {
    readMock.mockResolvedValue({ codeId: CODE_ID, status: 'failed', expiresAt: minutesFromNow(9), redeemedAt: new Date().toISOString(), uploadId: null })
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))

    expect(await ask.findByText('The photo did not arrive. Make a new code and try again.')).toBeInTheDocument()
  })

  it('says to wait when the gateway throttles making codes, with a 429 that has no code', async () => {
    createMock.mockRejectedValue(apiErrorFromBody({ message: 'Too Many Requests' }, { status: 429, fallback: 'x' }))
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))

    expect(await ask.findByText('Too many codes in a short time. Wait a moment, then try again.')).toBeInTheDocument()
    expect(readMock).not.toHaveBeenCalled()
  })
})

describe('the photo the phone sent', () => {
  it('is shown, and joins the question only when the student adds it, as its upload id', async () => {
    ready()
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))

    expect(await ask.findByRole('img', { name: 'The photo from your phone' })).toHaveAttribute('src', 'blob:phone-photo')
    expect(photoMock).toHaveBeenCalledWith('c1', CODE_ID, expect.anything())
    expect(ask.getByText('Is this your photo? Add it to your question.')).toBeInTheDocument()
    expect(ask.queryByRole('list', { name: 'Attached files' })).toBeNull()

    await userEvent.click(ask.getByRole('button', { name: 'Add photo' }))
    expect(await ask.findByText('phone-photo.jpg')).toBeInTheDocument()
    expect(ask.queryByRole('region', { name: 'Photo from your phone' })).toBeNull()

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Is this right?{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    expect(streamMock.mock.calls[0][0].payload.attachmentIds).toEqual([{ uploadId: 'up-phone' }])
  })

  it('is left out when the student says it is not theirs', async () => {
    ready()
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))
    await ask.findByRole('img', { name: 'The photo from your phone' })

    await userEvent.click(ask.getByRole('button', { name: 'Not mine' }))

    expect(ask.queryByRole('region', { name: 'Photo from your phone' })).toBeNull()
    expect(ask.queryByRole('list', { name: 'Attached files' })).toBeNull()
    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Is this right?{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    expect(streamMock.mock.calls[0][0].payload.attachmentIds).toBeUndefined()
  })

  it('is never added unseen: when it cannot be shown, there is nothing to add', async () => {
    ready()
    photoMock.mockRejectedValue(new ApiError('not found', { status: 404, code: 'upload_not_found' }))
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))

    expect(await ask.findByText('The photo cannot be shown here. Make a new code and send it again.')).toBeInTheDocument()
    expect(ask.queryByRole('button', { name: 'Add photo' })).toBeNull()
  })

  it('is held against the upload’s 30 minutes from when the phone took the code (#507)', async () => {
    // Taken 29 minutes ago: past the two minutes a question needs to go out.
    ready(minutesFromNow(-29))
    const ask = openAsk()
    await ask.findByText('Linear equations')
    await userEvent.click(ask.getByRole('button', { name: PHONE }))
    await userEvent.click(await ask.findByRole('button', { name: 'Add photo' }))

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Is this right?{Enter}')

    expect(await ask.findByText('This file took too long. Choose it again.')).toBeInTheDocument()
    expect(streamMock).not.toHaveBeenCalled()
  })
})
