/**
 * #538: an `image_upload` case shows the image moderation refused, and why.
 *
 * The admin saw "No question preview / No AI answer snapshot / No teacher reply
 * snapshot" for the three cases the #512 smoke run made: neither the image nor
 * what it was blocked for, so nothing to decide on. The image is read with the
 * admin's token as a blob, blurred until asked for, and let go when the case
 * leaves the screen. A deleted one says so, with its date.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { formatDayAndTime } from '@/lib/formatDateTime'
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage'
import { ApiError } from '@/services/api/httpClient'
import type { ModerationCase, ModerationImageContext } from '@/services/admin/adminApi'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const api = vi.hoisted(() => ({
  getModerationCases: vi.fn(),
  getModerationCase: vi.fn(),
  getModerationCaseImage: vi.fn(),
  updateModerationCase: vi.fn(),
  addModerationCaseNote: vi.fn(),
}))

vi.mock('@/services/admin/adminApi', () => api)

function imageContext(overrides: Partial<ModerationImageContext> = {}): ModerationImageContext {
  return {
    upload_id: 'up-1',
    conversation_id: 'conv-7',
    uploaded_at: '2026-10-30T09:15:00+00:00',
    uploader_id: 'student-42',
    uploader_role: 'student',
    media_type: 'image/jpeg',
    size_bytes: 2048,
    hits: [
      { label: 'Middle Finger', category: 'Rude Gestures', confidence: 97.3 },
      { label: 'Weapons', category: 'Violence', confidence: 81 },
    ],
    image_status: 'stored',
    image_deleted_at: null,
    ...overrides,
  }
}

function imageCase(id: string, context: Partial<ModerationImageContext> | null = {}): ModerationCase {
  return {
    case_id: id,
    status: 'open',
    reason: 'unsafe_content',
    severity: 'high',
    surface: 'image_upload',
    question_id: null,
    student_id: 'student-42',
    reporter_id: 'image-moderation',
    reporter_role: 'system',
    report_note: null,
    question_context: null,
    image_context: context ? imageContext(context) : null,
    created_at: '2026-10-30T09:15:01+00:00',
    updated_at: '2026-10-30T09:15:01+00:00',
    history: [],
  }
}

function questionCase(id: string): ModerationCase {
  return {
    ...imageCase(id, null),
    surface: 'question',
    question_id: `q-${id}`,
    reporter_id: 'teacher-1',
    reporter_role: 'teacher',
    question_context: { content_preview: `question of ${id}` },
  }
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    client,
    ...renderWith(client),
  }
}

function renderWith(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AdminModerationPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

function listOf(items: ModerationCase[]) {
  api.getModerationCases.mockResolvedValue({ items, count: items.length, access_pattern: 'scan' })
  api.getModerationCase.mockImplementation(async (id: string) => items.find((item) => item.case_id === id))
}

const caseButton = (id: string) => screen.getByRole('button', { name: new RegExp(`^${id}`) })
const caseHeading = (id: string) => screen.findByText(`Case ${id}`)
const blockedImage = () => screen.findByRole('img', { name: 'The image moderation blocked' })
const imageSection = () => screen.getByRole('region', { name: 'Blocked image' })

const created: string[] = []
const revoked: string[] = []

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

beforeEach(() => {
  vi.clearAllMocks()
  created.length = 0
  revoked.length = 0
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test/${created.length + 1}`
    created.push(url)
    return url
  })
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url)
  })
  api.getModerationCaseImage.mockResolvedValue(new Blob(['jpg'], { type: 'image/jpeg' }))
  api.addModerationCaseNote.mockImplementation(async (input: { caseId: string }) => imageCase(input.caseId))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the detail of an image_upload case', () => {
  it('shows the image in place of the question, AI answer and teacher reply', async () => {
    listOf([imageCase('mod-upload-1')])
    renderPage()

    const image = await blockedImage()
    expect(image).toHaveAttribute('src', 'blob:test/1')
    expect(api.getModerationCaseImage).toHaveBeenCalledWith('mod-upload-1')
    expect(screen.queryByText('No question preview')).not.toBeInTheDocument()
    expect(screen.queryByText('No AI answer snapshot')).not.toBeInTheDocument()
    expect(screen.queryByText('No teacher reply snapshot')).not.toBeInTheDocument()
    expect(screen.getByText('Case mod-upload-1').nextElementSibling).toHaveTextContent('Image upload - Unsafe content')
  })

  it('blurs the image until the admin asks to see it, and blurs it again on request', async () => {
    listOf([imageCase('mod-upload-1')])
    renderPage()

    const image = await blockedImage()
    expect(image).toHaveAttribute('data-revealed', 'false')
    expect(image.className).toMatch(/\bblur-2xl\b/)

    fireEvent.click(screen.getByRole('button', { name: 'Show image' }))
    expect(image).toHaveAttribute('data-revealed', 'true')
    expect(image.className).not.toMatch(/\bblur/)

    fireEvent.click(screen.getByRole('button', { name: 'Blur image' }))
    expect(image.className).toMatch(/\bblur-2xl\b/)
  })

  it('names each hit’s category, label and confidence as a percentage', async () => {
    listOf([imageCase('mod-upload-1')])
    renderPage()
    await blockedImage()

    const hits = within(imageSection()).getByRole('list', { name: 'Blocked for' })
    const rows = within(hits).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Rude Gestures · Middle Finger97.3%')
    expect(rows[1]).toHaveTextContent('Violence · Weapons81%')
  })

  it('says who uploaded it, when, and in which conversation', async () => {
    listOf([imageCase('mod-upload-1')])
    renderPage()
    await blockedImage()

    const section = imageSection()
    expect(within(section).getByText('Uploaded by').nextElementSibling).toHaveTextContent('student-42 · student')
    expect(within(section).getByText('Uploaded').nextElementSibling).toHaveTextContent(
      formatDayAndTime('2026-10-30T09:15:00+00:00'),
    )
    expect(within(section).getByText('Conversation').nextElementSibling).toHaveTextContent('conv-7')
  })

  it('leaves the conversation out when the upload had none', async () => {
    listOf([imageCase('mod-upload-1', { conversation_id: null })])
    renderPage()
    await blockedImage()

    expect(within(imageSection()).queryByText('Conversation')).not.toBeInTheDocument()
  })
})

describe('an image that is gone', () => {
  it('says it was deleted, and when, without asking for it', async () => {
    listOf([imageCase('mod-upload-1', { image_status: 'deleted', image_deleted_at: '2026-12-01T03:00:00+00:00' })])
    renderPage()
    await caseHeading('mod-upload-1')

    expect(
      within(imageSection()).getByText(`Image deleted on ${formatDayAndTime('2026-12-01T03:00:00+00:00')}`),
    ).toBeInTheDocument()
    expect(within(imageSection()).queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show image' })).not.toBeInTheDocument()
    expect(api.getModerationCaseImage).not.toHaveBeenCalled()
  })

  it('says it was deleted when the image route answers 404, rather than drawing a broken image', async () => {
    listOf([imageCase('mod-upload-1')])
    api.getModerationCaseImage.mockRejectedValue(new ApiError('Moderation case image not found', { status: 404 }))
    renderPage()

    expect(await within(await waitFor(imageSection)).findByText('Image deleted')).toBeInTheDocument()
    expect(within(imageSection()).queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('offers to try again when the image could not be read for another reason', async () => {
    listOf([imageCase('mod-upload-1')])
    api.getModerationCaseImage.mockRejectedValueOnce(new ApiError('Moderation case image is unavailable', { status: 503 }))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the image.')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await blockedImage()).toHaveAttribute('src', 'blob:test/1')
    expect(api.getModerationCaseImage).toHaveBeenCalledTimes(2)
  })

  it('does not draw what came back when it is not a JPEG or PNG', async () => {
    listOf([imageCase('mod-upload-1')])
    api.getModerationCaseImage.mockResolvedValue(new Blob(['<svg/>'], { type: 'image/svg+xml' }))
    renderPage()

    expect(await within(await waitFor(imageSection)).findByText('This image cannot be shown here.')).toBeInTheDocument()
    expect(created).toEqual([])
  })
})

describe('the image is not kept', () => {
  it('lets go of the address when the admin opens another case', async () => {
    listOf([imageCase('mod-upload-1'), questionCase('case-q')])
    renderPage()
    await blockedImage()

    fireEvent.click(caseButton('case-q'))
    await caseHeading('case-q')
    expect(revoked).toEqual(['blob:test/1'])
    expect(screen.getByText('question of case-q', { selector: '.leading-6' })).toBeInTheDocument()
  })

  it('lets go of the address when the admin leaves the page', async () => {
    listOf([imageCase('mod-upload-1')])
    const { unmount } = renderPage()
    await blockedImage()

    unmount()
    expect(revoked).toEqual(['blob:test/1'])
  })

  it('reads it again when the admin comes back to the case', async () => {
    listOf([imageCase('mod-upload-1'), questionCase('case-q')])
    renderPage()
    await blockedImage()

    fireEvent.click(caseButton('case-q'))
    await caseHeading('case-q')
    fireEvent.click(caseButton('mod-upload-1'))
    await blockedImage()
    expect(api.getModerationCaseImage).toHaveBeenCalledTimes(2)
  })

  it('reads only the image of the case on screen, none from the queue', async () => {
    listOf([imageCase('mod-upload-1'), imageCase('mod-upload-2'), imageCase('mod-upload-3')])
    renderPage()
    await blockedImage()

    expect(api.getModerationCaseImage).toHaveBeenCalledTimes(1)
    expect(api.getModerationCaseImage).toHaveBeenCalledWith('mod-upload-1')
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('does not read it again when a note refreshes the case', async () => {
    listOf([imageCase('mod-upload-1')])
    renderPage()
    await blockedImage()

    fireEvent.change(screen.getByPlaceholderText('Add an internal moderation note'), { target: { value: 'seen' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Note added.'))
    await waitFor(() => expect(api.getModerationCases).toHaveBeenCalledTimes(2))

    expect(api.getModerationCaseImage).toHaveBeenCalledTimes(1)
  })

  it('does not read it again when a language switch refreshes every query', async () => {
    listOf([imageCase('mod-upload-1')])
    const { client } = renderPage()
    await blockedImage()

    // What AppProviders does on `languageChanged`.
    await client.invalidateQueries()
    await waitFor(() => expect(api.getModerationCase).toHaveBeenCalledTimes(2))

    expect(api.getModerationCaseImage).toHaveBeenCalledTimes(1)
    expect(revoked).toEqual([])
  })
})

describe('in the admin’s language', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('reads the admin copy in German', async () => {
    await i18n.changeLanguage('de')
    listOf([imageCase('mod-upload-1')])
    renderPage()

    expect(await screen.findByRole('img', { name: 'Das von der Moderation blockierte Bild' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bild anzeigen' })).toBeInTheDocument()
    expect(caseButton('mod-upload-1')).toHaveTextContent('Blockiertes Bild · Rude Gestures, Violence')
    expect(screen.getByRole('list', { name: 'Blockiert wegen' })).toBeInTheDocument()
  })

  it('writes the confidence as a percentage the way the language does', async () => {
    await i18n.changeLanguage('fr')
    listOf([imageCase('mod-upload-1')])
    renderPage()

    await screen.findByRole('img', { name: "L'image bloquée par la modération" })
    const hits = screen.getByRole('list', { name: 'Bloquée pour' })
    expect(within(hits).getAllByRole('listitem')[0]).toHaveTextContent(/97,3\s?%$/)
  })
})

describe('the queue line of an image_upload case', () => {
  it('says it is a blocked image and names each category once, with no thumbnail', async () => {
    listOf([
      imageCase('mod-upload-1', {
        hits: [
          { label: 'Weapons', category: 'Violence', confidence: 90 },
          { label: 'Graphic Violence', category: 'Violence', confidence: 88 },
          { label: 'Middle Finger', category: 'Rude Gestures', confidence: 99 },
        ],
      }),
    ])
    renderPage()
    await caseHeading('mod-upload-1')

    const row = caseButton('mod-upload-1')
    expect(row).toHaveTextContent('Blocked image · Violence, Rude Gestures')
    expect(row).not.toHaveTextContent('No context preview')
    expect(within(row).queryByRole('img')).not.toBeInTheDocument()
  })

  it('says it is a blocked image when no hit was recorded', async () => {
    listOf([imageCase('mod-upload-1', { hits: [] })])
    renderPage()
    await caseHeading('mod-upload-1')

    expect(caseButton('mod-upload-1')).toHaveTextContent(/Unsafe contentBlocked image$/)
  })
})
