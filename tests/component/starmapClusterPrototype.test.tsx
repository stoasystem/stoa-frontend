/*
 * The star cluster mock-up's route scene (`src/dev/clusters`): a route's stars
 * are buttons in route order that open a card, a star from another cluster
 * leads there and opens on that star, and "back" returns to the star map.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ClusterRouteScene } from '@/dev/clusters/ClusterRouteScene'
import i18n from '@/i18n'

function Where() {
  const location = useLocation()
  return <output data-testid="where">{location.pathname + location.search}</output>
}

function renderAt(path: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/map/:subjectId/cluster/:clusterId" element={<ClusterRouteScene />} />
          <Route path="*" element={null} />
        </Routes>
        <Where />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the star cluster prototype', () => {
  it('lists the route as buttons in route order; Enter opens a card, Escape closes it', async () => {
    const user = userEvent.setup()
    const { container } = renderAt('/map/math/cluster/algebra')
    const nodes = [...container.querySelectorAll<HTMLButtonElement>('[data-unit], [data-route-entrance]')]
    expect(nodes.filter((n) => n.dataset.unit)).toHaveLength(23)
    const lefts = nodes.map((n) => parseFloat(n.style.left))
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b))

    const next = container.querySelector<HTMLButtonElement>('[data-next]')!
    next.focus()
    await user.keyboard('{Enter}')
    const card = screen.getByRole('dialog')
    expect(within(card).getByText('Next on your route')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(next).toHaveFocus()
  })

  it('leads from an entrance to the star in the other cluster', async () => {
    const user = userEvent.setup()
    const { container } = renderAt('/map/math/cluster/algebra')
    await user.click(container.querySelector<HTMLButtonElement>('[data-route-entrance]')!)
    const source = screen.getByRole('dialog').querySelector<HTMLButtonElement>('[data-entrance-source]')!
    const unitId = source.dataset.entranceSource!
    await user.click(source)
    expect(screen.getByTestId('where').textContent).toMatch(new RegExp(`^/map/math/cluster/(numbers|geometry)\\?star=${unitId}$`))
    // Opens on that star, with its card.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(container.querySelector(`[data-unit="${unitId}"]`)).toHaveAttribute('data-selected')
  })

  it('goes back to the star map', async () => {
    const user = userEvent.setup()
    renderAt('/map/math/cluster/data')
    await user.click(screen.getByRole('button', { name: 'Back to the star map' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/map/math')
  })

  it('starts practising in the chapter', async () => {
    const user = userEvent.setup()
    const { container } = renderAt('/map/math/cluster/data')
    await user.click(container.querySelector<HTMLButtonElement>('[data-next]')!)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByTestId('where').textContent).toMatch(/^\/chapter\/daten-/)
  })
})
