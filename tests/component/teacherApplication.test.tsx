import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { TeacherActivatePage } from '@/pages/auth/TeacherActivatePage'
import { buildTeacherStatement } from '@/services/teacher/teacherApplicationApi'
import { submitTeacherApplication, claimTeacherInvitation } from '@/services/teacher/teacherApplicationApi'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

vi.mock('@/services/teacher/teacherApplicationApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/teacher/teacherApplicationApi')>(
    '@/services/teacher/teacherApplicationApi',
  )
  return {
    ...actual,
    submitTeacherApplication: vi.fn(),
    getTeacherApplicationStatus: vi.fn(),
    claimTeacherInvitation: vi.fn(),
    consumeTeacherInvitation: vi.fn(),
  }
})

vi.mock('@/services/auth/authApi', () => ({
  register: vi.fn(),
}))

const mockedSubmit = vi.mocked(submitTeacherApplication)
const mockedClaim = vi.mocked(claimTeacherInvitation)

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/register?role=teacher']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('buildTeacherStatement', () => {
  it('joins introduction, education, and experience without exceeding 2000 characters', () => {
    const statement = buildTeacherStatement({
      introduction: 'I teach algebra.',
      educationBackground: 'MSc Mathematics',
      yearsOfExperience: 4,
    })
    expect(statement).toContain('I teach algebra.')
    expect(statement).toContain('Education: MSc Mathematics')
    expect(statement).toContain('Experience: 4 years')
    expect(statement.length).toBeLessThanOrEqual(2000)
  })
})

describe('teacher registration uses the application API', () => {
  beforeEach(() => {
    mockedSubmit.mockReset()
    mockedSubmit.mockResolvedValue({
      applicationId: 'teacherapp_1',
      version: 1,
      status: 'pending_review',
    })
  })

  it('does not collect a password and submits /teacher-applications fields', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />, { wrapper })

    await user.click(screen.getByRole('button', { name: 'common:actions.continue' }))
    expect(screen.queryByLabelText('auth:register.password')).toBeNull()

    await user.type(screen.getByLabelText('auth:register.name'), 'Ada Teacher')
    await user.type(screen.getByLabelText('auth:register.email'), 'ada@school.ch')
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(checkboxes[1])
    await user.click(screen.getByRole('button', { name: 'common:actions.continue' }))

    await user.type(screen.getByLabelText('register.educationBackground'), 'ETH Zurich')
    await user.type(screen.getByLabelText('register.introduction'), 'I help students with proofs.')
    await user.click(screen.getByRole('button', { name: 'auth:register.applyCta' }))

    await waitFor(() => {
      expect(mockedSubmit).toHaveBeenCalledWith({
        email: 'ada@school.ch',
        emailVerified: true,
        fullName: 'Ada Teacher',
        subjects: ['Mathematics'],
        statement: expect.stringContaining('I help students with proofs.'),
      })
    })
    expect(screen.getByText('auth:register.pendingReviewTitle')).toBeInTheDocument()
  })
})

describe('teacher activation page', () => {
  beforeEach(() => {
    mockedClaim.mockReset()
    mockedClaim.mockResolvedValue({
      status: 'active',
      userId: 'teacher_1',
      applicationId: 'teacherapp_1',
      applicationVersion: 1,
    })
  })

  it('claims the invitation token with a password', async () => {
    const user = userEvent.setup()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/teacher-activate?token=invitation-token-32-characters-long']}>
          <Routes>
            <Route path="/teacher-activate" element={<TeacherActivatePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await user.type(screen.getByLabelText('auth:register.password'), 'ValidPass12!')
    await user.type(screen.getByLabelText('auth:activate.confirmPassword'), 'ValidPass12!')
    await user.click(screen.getByRole('button', { name: 'auth:activate.submit' }))

    await waitFor(() => {
      expect(mockedClaim).toHaveBeenCalledWith('invitation-token-32-characters-long', 'ValidPass12!')
    })
    expect(screen.getByText('auth:activate.success')).toBeInTheDocument()
  })

  it('rejects a missing token before calling the API', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/teacher-activate']}>
          <Routes>
            <Route path="/teacher-activate" element={<TeacherActivatePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('auth:activate.missingToken')).toBeInTheDocument()
    expect(mockedClaim).not.toHaveBeenCalled()
  })
})
