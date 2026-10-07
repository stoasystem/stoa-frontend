/**
 * The star card's "Back" keeps the map's query (#146, round three C7 of
 * #142): `?points=` and the dev switches stay on the way back to the
 * nebula, on a wide screen's card and in a phone's sheet, and on the card's
 * links to the stars to light first.
 */
import { act, fireEvent, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { pathForTarget, type LayerTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap } from './starmapHarness'

const QUERY = '?points=1000&relations=fixture'

function Where() {
  const { pathname, search } = useLocation()
  return <output data-where>{pathname + search}</output>
}

function showStar(map: StarMap, star: Star, width: number, height: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width, height, right: width, bottom: height, toJSON: () => ({}),
  } as DOMRect)
  const target: LayerTarget = { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }
  const clock = fakeClock()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[pathForTarget(subjectOfNebula(map, star.nebulaId), target) + QUERY]}>
        <div data-surface="sky" className="flex">
          <StarMapView map={map} target={target} onNavigate={vi.fn()} scheduler={clock} createRendererFor={() => recordingRenderer()} />
        </div>
        <Where />
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  const where = () => view.container.querySelector('[data-where]')!.textContent
  return { ...view, where }
}

describe('the card keeps the map’s query (#146 C7)', () => {
  afterEach(() => vi.restoreAllMocks())

  for (const [label, width, height] of [['a wide screen’s card', 1280, 776], ['a phone’s sheet', 390, 844]] as const) {
    it(`"Back" in ${label} goes to the nebula with the query kept`, () => {
      const map = skyMap(1000, 'math')
      const star = map.stars.find((s) => subjectOfNebula(map, s.nebulaId) === 'math')!
      const { container, where } = showStar(map, star, width, height)
      const card = container.querySelector('article[aria-labelledby="starmap-star-title"]')!
      expect(card.hasAttribute('data-star-sheet')).toBe(width < 768)
      const back = card.querySelector<HTMLAnchorElement>('a[data-star-back]')!
      const nebulaPath = pathForTarget(subjectOfNebula(map, star.nebulaId), { layer: 'nebula', nebulaId: star.nebulaId })
      expect(back.getAttribute('href')).toBe(nebulaPath + QUERY)
      act(() => {
        fireEvent.click(back)
      })
      expect(where()).toBe(nebulaPath + QUERY)
    })
  }

  it('the links to the stars to light first keep it too', () => {
    const map = skyMap(1000, 'math', { relations: true })
    const locked = map.stars.find((s) => s.state === 'locked' && map.prerequisites.some((e) => e.to === s.unitId && map.stars.find((b) => b.unitId === e.from)?.state !== 'lit'))!
    expect(locked).toBeDefined()
    const { container } = showStar(map, locked, 1280, 776)
    const links = [...container.querySelectorAll<HTMLAnchorElement>('#starmap-star-prerequisites ~ ul a')]
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link.getAttribute('href')!.endsWith(QUERY)).toBe(true)
  })
})
