import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherSupportAllowanceEditor } from '@/pages/admin/TeacherSupportAllowanceEditor'
import {
  readTeacherSupportAllowance,
  setTeacherSupportAllowance,
} from '@/services/admin/accountsApi'

// Every student already has the assigned figure, so the editor is always
// adjusting a number that is in force. An editor that opened blank would make
// "leave it alone" and "set it to nothing" look the same.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && 'count' in options ? `${key}:${options.count}` : key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

vi.mock('@/services/admin/accountsApi', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/admin/accountsApi')>(
      '@/services/admin/accountsApi',
    )
  return { ...actual, readTeacherSupportAllowance: vi.fn(), setTeacherSupportAllowance: vi.fn() }
})

const mockedRead = vi.mocked(readTeacherSupportAllowance)
const mockedSet = vi.mocked(setTeacherSupportAllowance)

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function allowance(overrides: Partial<Awaited<ReturnType<typeof readTeacherSupportAllowance>>> = {}) {
  return {
    studentId: 'student-b',
    weeklyCases: 7,
    source: 'default' as const,
    default: 7,
    maximum: 200,
    ...overrides,
  }
}

// The reason is the editor's own field now (#259), not one the page shares.
async function open(reason = 'exam period') {
  render(<TeacherSupportAllowanceEditor studentId="student-b" onClose={() => {}} />, {
    wrapper: Wrapper,
  })
  if (reason) await userEvent.type(screen.getByLabelText('accounts.reasonPrompt'), reason)
}

beforeEach(() => {
  mockedRead.mockReset()
  mockedSet.mockReset()
})

describe('the weekly teacher-support figure an administrator edits', () => {
  it('opens on the figure that is in force, not on an empty box', async () => {
    mockedRead.mockResolvedValue(allowance())
    await open()

    const field = await screen.findByLabelText('accounts.teacherSupport.weeklyCases')
    await waitFor(() => expect(field).toHaveValue('7'))
    expect(screen.getByText('accounts.teacherSupport.assignedDefault:7')).toBeInTheDocument()
  })

  it('says when the figure came from an administrator rather than from the default', async () => {
    mockedRead.mockResolvedValue(allowance({ weeklyCases: 20, source: 'administrator' }))
    await open()

    expect(
      await screen.findByText('accounts.teacherSupport.setByAdministrator:20'),
    ).toBeInTheDocument()
  })

  it('sends the number and the reason typed for this row', async () => {
    mockedRead.mockResolvedValue(allowance())
    mockedSet.mockResolvedValue({ ...allowance({ weeklyCases: 20, source: 'administrator' }), stateVersion: 1 })
    await open()

    const field = await screen.findByLabelText('accounts.teacherSupport.weeklyCases')
    await waitFor(() => expect(field).toHaveValue('7'))
    await userEvent.clear(field)
    await userEvent.type(field, '20')
    await userEvent.click(screen.getByRole('button', { name: 'accounts.teacherSupport.save' }))

    // react-query hands the mutation context as a second argument; the first
    // is what this editor decided to send.
    await waitFor(() =>
      expect(mockedSet.mock.calls[0]?.[0]).toEqual({
        studentId: 'student-b',
        weeklyCases: 20,
        reason: 'exam period',
      }),
    )
    // #259: a saved reason does not wait to be sent again with the next change.
    await waitFor(() => expect(screen.getByLabelText('accounts.reasonPrompt')).toHaveValue(''))
  })

  it('warns before zero is saved, because zero is not "none set"', async () => {
    mockedRead.mockResolvedValue(allowance())
    await open()

    const field = await screen.findByLabelText('accounts.teacherSupport.weeklyCases')
    await waitFor(() => expect(field).toHaveValue('7'))
    await userEvent.clear(field)
    await userEvent.type(field, '0')

    expect(screen.getByText('accounts.teacherSupport.zeroWarning')).toBeInTheDocument()
  })

  it('refuses a figure the backend would store and then read back as the default', async () => {
    // Anything past the maximum falls back to the assigned seven when it is
    // read, so storing it would be a cut dressed up as a raise.
    mockedRead.mockResolvedValue(allowance())
    await open()

    const field = await screen.findByLabelText('accounts.teacherSupport.weeklyCases')
    await waitFor(() => expect(field).toHaveValue('7'))
    await userEvent.clear(field)
    await userEvent.type(field, '201')
    await userEvent.click(screen.getByRole('button', { name: 'accounts.teacherSupport.save' }))

    expect(screen.getByText('accounts.teacherSupport.outOfRange')).toBeInTheDocument()
    expect(mockedSet).not.toHaveBeenCalled()
  })

  it('will not save without the reason the audit log records', async () => {
    mockedRead.mockResolvedValue(allowance())
    await open('')

    const field = await screen.findByLabelText('accounts.teacherSupport.weeklyCases')
    await waitFor(() => expect(field).toHaveValue('7'))
    await userEvent.click(screen.getByRole('button', { name: 'accounts.teacherSupport.save' }))

    expect(screen.getByText('accounts.reasonRequired')).toBeInTheDocument()
    expect(mockedSet).not.toHaveBeenCalled()
  })
})
