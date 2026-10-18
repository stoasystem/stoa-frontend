/**
 * The teacher availability editor, page and profile (#270, 2026-10-18 audit):
 * stored subjects from older forms are shown, normalised and removable; slots
 * can be removed; times are validated before saving; a failed save says so; a
 * save refreshes the profile; the profile names weekdays, status and subjects;
 * the availability page has loading and error states.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherAvailabilityEditor } from '@/components/teacher/TeacherAvailabilityEditor'
import i18n from '@/i18n'
import { TeacherAvailabilityPage } from '@/pages/teacher/TeacherAvailabilityPage'
import { TeacherProfilePage } from '@/pages/teacher/TeacherProfilePage'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import * as availabilityApi from '@/services/teacher/teacherAvailabilityApi'
import type { TeacherWeeklyAvailability } from '@/types/teacherAvailability'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherProfile: vi.fn(),
}))
vi.mock('@/services/teacher/teacherAvailabilityApi', () => ({
  getTeacherWeeklyAvailability: vi.fn(),
  updateTeacherWeeklyAvailability: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const update = vi.mocked(availabilityApi.updateTeacherWeeklyAvailability)

function renderWith(children: ReactNode, client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nextProvider>,
  )
  return client
}

function renderEditor(availability: TeacherWeeklyAvailability) {
  return renderWith(<TeacherAvailabilityEditor availability={availability} />)
}

async function save() {
  await userEvent.click(screen.getByRole('button', { name: 'Verfügbarkeit speichern' }))
}

const monday = { dayOfWeek: 'monday' as const, startTime: '16:00', endTime: '18:00' }
const thursday = { dayOfWeek: 'thursday' as const, startTime: '09:00', endTime: '11:00' }

beforeEach(async () => {
  vi.clearAllMocks()
  update.mockResolvedValue({ subjects: [], weeklyAvailability: [] })
  await i18n.changeLanguage('de')
})

describe('stored subjects', () => {
  it('shows older spellings as the known subject, ticked, and sends each once as its id', async () => {
    renderEditor({ subjects: ['mathematics', 'Mathematics', ' physik '], weeklyAvailability: [] })
    expect(screen.getByRole('checkbox', { name: 'Mathematik' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Physik' })).toBeChecked()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Chemie' }))
    await save()
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    expect(update.mock.calls[0][0].subjects).toEqual(['math', 'physics', 'chemistry'])
  })

  it('shows subjects outside the five so they can be removed, and sends none of them once unticked', async () => {
    renderEditor({ subjects: ['Deutsch', 'Geschichte', 'Mathematics'], weeklyAvailability: [] })
    const german = screen.getByRole('checkbox', { name: 'Deutsch' })
    const history = screen.getByRole('checkbox', { name: 'Geschichte' })
    expect(german).toBeChecked()
    expect(history).toBeChecked()
    await userEvent.click(german)
    await userEvent.click(history)
    // Still offered after unticking, so a slip can be undone.
    expect(screen.getByRole('checkbox', { name: 'Geschichte' })).not.toBeChecked()
    await save()
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    expect(update.mock.calls[0][0].subjects).toEqual(['math'])
  })
})

describe('weekly slots', () => {
  it('removes a slot, and the save sends only the rest', async () => {
    renderEditor({ subjects: [], weeklyAvailability: [monday, thursday] })
    await userEvent.click(screen.getByRole('button', { name: 'Zeitfenster Montag 16:00–18:00 entfernen' }))
    expect(screen.queryByRole('button', { name: /Montag/ })).toBeNull()
    await save()
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    expect(update.mock.calls[0][0].weeklyAvailability).toEqual([thursday])
  })

  it('uses time inputs', () => {
    renderEditor({ subjects: [], weeklyAvailability: [monday] })
    expect(screen.getByLabelText('Beginn')).toHaveAttribute('type', 'time')
    expect(screen.getByLabelText('Ende')).toHaveAttribute('type', 'time')
  })

  it('refuses an end before the start, and says why, without saving', async () => {
    renderEditor({ subjects: [], weeklyAvailability: [monday] })
    fireEvent.change(screen.getByLabelText('Ende'), { target: { value: '15:00' } })
    await save()
    expect(await screen.findByRole('alert')).toHaveTextContent('Das Ende muss nach dem Beginn liegen.')
    expect(screen.getByLabelText('Ende')).toHaveAttribute('aria-invalid', 'true')
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses a time that is not a time (a stored "abends", or an emptied input)', async () => {
    renderEditor({ subjects: [], weeklyAvailability: [{ ...monday, endTime: 'abends' }] })
    await save()
    expect(await screen.findByRole('alert')).toHaveTextContent('Bitte geben Sie eine gültige Beginn- und Endzeit ein.')
    expect(update).not.toHaveBeenCalled()
  })
})

describe('saving', () => {
  it('says so in the page when the save fails', async () => {
    update.mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
    renderEditor({ subjects: ['math'], weeklyAvailability: [monday] })
    await save()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ihre Verfügbarkeit konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.',
    )
  })

  it('refreshes the profile as well as the availability', async () => {
    const client = renderEditor({ subjects: ['math'], weeklyAvailability: [monday] })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await save()
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['teacher', 'profile'] }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['teacher', 'availability'] })
  })
})

describe('the profile page', () => {
  it('names the weekday, the paused status and the subjects in German', async () => {
    vi.mocked(teacherApi.getTeacherProfile).mockResolvedValue({
      id: 't', userId: 't', name: 'Frau Muster', email: 'm@x.ch', accountStatus: 'active',
      availabilityStatus: 'paused', subjects: ['Mathematics', 'math', 'Geschichte'],
      weeklyAvailability: [monday],
      createdAt: '2026-01-01', updatedAt: '2026-01-02',
    } as never)
    renderWith(<TeacherProfilePage />)
    expect(await screen.findByText('Montag · 16:00–18:00')).toBeInTheDocument()
    expect(screen.getByText('Pausiert')).toBeInTheDocument()
    expect(screen.getAllByText('Mathematik')).toHaveLength(1)
    expect(screen.getByText('Geschichte')).toBeInTheDocument()
    expect(screen.queryByText('Mathematics')).toBeNull()
    expect(screen.queryByText('paused')).toBeNull()
  })
})

describe('the availability page', () => {
  it('shows a loading state while the availability loads', () => {
    vi.mocked(availabilityApi.getTeacherWeeklyAvailability).mockReturnValue(new Promise(() => {}))
    renderWith(<TeacherAvailabilityPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('says so when the availability cannot be loaded', async () => {
    vi.mocked(availabilityApi.getTeacherWeeklyAvailability).mockRejectedValue(new ApiError('boom', { status: 403 }))
    renderWith(<TeacherAvailabilityPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Ihre Verfügbarkeit konnte nicht geladen werden.')
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('the new keys exist in all four languages', () => {
  it.each(['de', 'en', 'fr', 'it'])('%s', (language) => {
    for (const key of [
      'availability.loadFailed',
      'availability.editor.removeSlot',
      'availability.editor.removeSlotLabel',
      'availability.editor.invalidTime',
      'availability.editor.endBeforeStart',
      'availability.editor.saveFailed',
      'availability.editor.subjectNames.german',
      'profile.availabilityStatus.paused',
    ]) {
      // Read from the language itself, so the English fallback can't answer for it.
      expect(i18n.getResource(language, 'teacher', key), `${language} ${key}`).toEqual(expect.any(String))
    }
  })
})
