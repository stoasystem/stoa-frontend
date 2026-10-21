/**
 * #411: a star's "Review N" opens its review, and the review's "Back to the
 * star map" went to `/`, the whole sky, losing the star (and the map's
 * query) the review was opened from. The card now names its star, and Back
 * returns to it.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { StarCard } from '@/features/starmap/components/StarCard'
import { subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { pathForTarget } from '@/features/starmap/view/layers'
import { reviewReturnPath } from '@/features/starmap/view/reviewReturn'
import i18n from '@/i18n'
import enPractice from '@/i18n/locales/en/practice.json'
import { ReviewPage } from '@/pages/review/ReviewPage'
import { skyMap } from './starmapHarness'

vi.mock('@/layouts/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('@/components/practice/ReviewSession', () => ({ ReviewSession: () => null }))

const QUERY = '?points=1000&relations=fixture'

function Where() {
  const { pathname, search } = useLocation()
  return <output data-where>{pathname + search}</output>
}
const where = () => document.querySelector('[data-where]')!.textContent

function starWithReviews(map: StarMap) {
  const star = { ...map.stars.find((candidate) => candidate.state !== 'locked')!, reviewDue: 2 }
  const nebula = map.nebulae.find((candidate) => candidate.topicId === star.nebulaId)!
  const path = pathForTarget(subjectOfNebula(map, star.nebulaId), { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
  return { star, nebula, path }
}

function show(initial: Parameters<typeof MemoryRouter>[0]['initialEntries']) {
  const map = skyMap(1000, 'math')
  const { star, nebula, path } = starWithReviews(map)
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={initial ?? [path + QUERY]}>
        <Routes>
          <Route path="/map/*" element={<StarCard map={map} star={star} nebula={nebula} reducedMotion />} />
          <Route path="/review/:unitId" element={<ReviewPage />} />
          <Route path="/" element={<p>the whole sky</p>} />
        </Routes>
        <Where />
      </MemoryRouter>
    </I18nextProvider>,
  )
  return { star, path }
}

const backLink = () => screen.getByRole('link', { name: enPractice.review.backToMap })

beforeAll(async () => {
  await i18n.changeLanguage('en')
})
afterEach(() => vi.restoreAllMocks())

describe('the review opened from a star (#411)', () => {
  it('goes back to that star, with the map’s query', () => {
    const { star, path } = show(undefined)

    fireEvent.click(screen.getByRole('link', { name: i18n.t('starmap:star.review', { count: 2 }) }))
    expect(where()).toBe(`/review/${encodeURIComponent(star.unitId)}`)

    expect(backLink()).toHaveAttribute('href', path + QUERY)
    fireEvent.click(backLink())
    expect(where()).toBe(path + QUERY)
  })

  it('goes back to the sky when it was reached some other way', () => {
    show(['/review/brueche-u1'])

    expect(backLink()).toHaveAttribute('href', '/')
  })

  it.each([
    { star: '//evil.example/map/x' },
    { star: 'https://evil.example/map/x' },
    { star: '/admin/users' },
    { star: 42 },
    { other: '/map/math' },
    '/map/math',
    null,
  ])('takes no way back from state that names no star on the map (%j)', (state) => {
    expect(reviewReturnPath(state)).toBeNull()
    show([{ pathname: '/review/brueche-u1', state }])
    expect(backLink()).toHaveAttribute('href', '/')
  })
})
