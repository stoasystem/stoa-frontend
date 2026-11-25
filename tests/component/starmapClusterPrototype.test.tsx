/*
 * The star cluster prototype's screens (`src/dev/clusters`): the overview
 * opens a cluster, a route's stars are buttons in route order that open a
 * card, and a star from another cluster leads there and opens on that star.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ClusterPrototype } from '@/dev/clusters/ClusterPrototype'
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
          <Route path="/clusters/:subjectId" element={<ClusterPrototype />} />
          <Route path="/clusters/:subjectId/:clusterId" element={<ClusterPrototype />} />
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
  it('shows four clusters with their lit counts and opens one', async () => {
    const user = userEvent.setup()
    renderAt('/clusters/math')
    const tiles = screen.getAllByRole('button')
    expect(tiles.map((t) => t.getAttribute('data-cluster'))).toEqual(['numbers', 'geometry', 'algebra', 'data'])
    expect(within(tiles[2]).getByText('3 of 23 lit')).toBeInTheDocument()
    await user.click(tiles[2])
    expect(screen.getByTestId('where')).toHaveTextContent('/clusters/math/algebra')
    expect(screen.getByRole('heading', { level: 1, name: 'Equations and algebra' })).toBeInTheDocument()
  })

  it('lists the route as buttons in route order; Enter opens a card, Escape closes it', async () => {
    const user = userEvent.setup()
    const { container } = renderAt('/clusters/math/algebra')
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
    const { container } = renderAt('/clusters/math/algebra')
    await user.click(container.querySelector<HTMLButtonElement>('[data-route-entrance]')!)
    const source = screen.getByRole('dialog').querySelector<HTMLButtonElement>('[data-entrance-source]')!
    const unitId = source.dataset.entranceSource!
    await user.click(source)
    expect(screen.getByTestId('where').textContent).toMatch(new RegExp(`^/clusters/math/(numbers|geometry)\\?star=${unitId}$`))
    // Opens on that star, with its card.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(container.querySelector(`[data-unit="${unitId}"]`)).toHaveAttribute('data-selected')
  })

  it('starts practising in the chapter', async () => {
    const user = userEvent.setup()
    const { container } = renderAt('/clusters/math/data')
    await user.click(container.querySelector<HTMLButtonElement>('[data-next]')!)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByTestId('where').textContent).toMatch(/^\/chapter\/daten-/)
  })
})
