import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StudentProfilePage } from '@/pages/profile/StudentProfilePage'

// Card 007: payments are frozen, and the owner's ruling was that no page may
// show anything about them. `billingFrozen.test.ts` next door judges the route
// table, and the route table was clean the whole time this page went on
// printing a plan name, a plan status and a trial end date: withdrawing a route
// says nothing about what the pages still reachable put on the screen.
//
// So this one renders the page and reads it. The judge is not "the billing card
// was removed" -- that agrees with itself the moment somebody adds a different
// one. It is "no word about what this costs appears anywhere in the output".

// Leading boundary only, on purpose: `profile.subscriptionCover` has to count
// and `explanations` must not. A trailing `\b` would invert both.
const PAID_VOCABULARY =
  /\b(billing|subscription|checkout|stripe|refund|payment|invoice|price|pricing|plan|purchase|charge|coupon|discount|paywall|wallet|trial|tier)/i

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  // The key is the assertion target: `profile.subscriptionCover` says what the
  // page would print without depending on which of four languages is loaded.
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

vi.mock('@/hooks/student/useStudentProfileQuery', () => ({
  useStudentProfileQuery: () => ({
    data: {
      userId: 'student-1',
      name: 'Probe Student',
      email: 'probe@stoa.test',
      guardianStatus: 'linked',
      primarySubjects: ['math'],
      grade: 'S1',
      school: 'Probe School',
      updatedAt: '2026-09-01T00:00:00+00:00',
    },
    isPending: false,
  }),
}))

vi.mock('@/hooks/student/useStudentEntitlementQuery', () => ({
  // A student who does have an entitlement: the page must stay quiet about it,
  // not merely have nothing to say.
  useStudentEntitlementQuery: () => ({
    data: {
      effectivePlan: 'premium',
      status: 'trialing',
      nextBillingDate: '2026-12-01T00:00:00+00:00',
    },
    isPending: false,
  }),
}))

vi.mock('@/hooks/student/useStudentLearningProfileQuery', () => ({
  useStudentLearningProfileQuery: () => ({ data: undefined, isPending: false }),
}))

vi.mock('@/hooks/student/useUpdateStudentProfileMutation', () => ({
  useUpdateStudentProfileMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/profile']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('card 007: a student profile says nothing about what anything costs', () => {
  it('prints no paid word although the account carries an entitlement', () => {
    const { container } = render(<StudentProfilePage />, { wrapper })

    const printed = (container.textContent ?? '')
      .split(/\s+/)
      .filter((word) => PAID_VOCABULARY.test(word))

    expect(printed).toEqual([])
  })

  it('reads enough of the page for an empty result to mean something', () => {
    // Negative control. Without it the check above also passes on a page that
    // rendered nothing at all, which is how it would pass if the mocks above
    // ever stopped satisfying the component.
    const { container } = render(<StudentProfilePage />, { wrapper })

    expect((container.textContent ?? '').length).toBeGreaterThan(200)
  })

  it('would notice a plan put back on the screen', () => {
    // Second negative control: the vocabulary itself still has teeth, and it
    // tells `plan` from `explanations`.
    const words = 'profile.plan profile.subscriptionCover explanations lastUpdated'.split(' ')

    expect(words.filter((word) => PAID_VOCABULARY.test(word))).toEqual([
      'profile.plan',
      'profile.subscriptionCover',
    ])
  })
})
