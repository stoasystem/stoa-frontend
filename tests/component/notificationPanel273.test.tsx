/**
 * The bell's panel (#273, items 3 and 4).
 *
 * 3. Over a sky page the panel opens inside `<header data-surface="sky">` and
 *    inherited the sky's --red, focus ring and dark scrollbar while being a
 *    white card. brand-tokens.css hands back the light values; check:contrast
 *    rates them as the theme "panel". This keeps the hand-back complete: every
 *    name the sky block redefines that :root also defines is restored, with
 *    :root's value.
 * 4. Escape or a click outside used to drop focus to <body>, and the panel had
 *    no role, no label and no aria-controls pointing at it.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled', isLive: false }),
}))

afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

function renderBell() {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <header data-surface="sky">
          <NotificationCenter onSky />
        </header>
        <p>outside</p>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return screen.getByRole('button', { name: /notifications\.openLabel/ })
}

describe('the bell panel (#273 item 4)', () => {
  it('is a labelled dialog the bell points at', async () => {
    const bell = renderBell()
    expect(bell).not.toHaveAttribute('aria-controls')
    await userEvent.click(bell)
    const panel = screen.getByRole('dialog', { name: 'notifications.title' })
    expect(bell).toHaveAttribute('aria-expanded', 'true')
    expect(bell).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('data-notification-panel')
  })

  it('gives focus back to the bell on Escape', async () => {
    const bell = renderBell()
    await userEvent.click(bell)
    await userEvent.tab()
    expect(bell).not.toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(bell).toHaveFocus()
  })

  it('gives focus back to the bell on a click outside that lands nowhere focusable', async () => {
    const bell = renderBell()
    await userEvent.click(bell)
    await userEvent.click(screen.getByText('outside'))
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(bell).toHaveFocus())
  })
})

describe('the panel on a sky page (#273 item 3)', () => {
  const css = readFileSync(path.resolve(__dirname, '../../src/styles/brand-tokens.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )
  function block(selector: string) {
    const start = css.indexOf(`${selector} {`)
    expect(start, selector).toBeGreaterThanOrEqual(0)
    const body = css.slice(start, css.indexOf('}', start))
    return {
      body,
      tokens: Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])),
    }
  }

  it('hands back the light value of every name the sky redefines', () => {
    const root = block(':root').tokens
    const sky = block('[data-surface="sky"]').tokens
    const panel = block('[data-surface="sky"] [data-notification-panel]')
    const redefined = Object.keys(sky).filter((name) => name in root)
    expect(redefined).toContain('--red')
    expect(redefined).toContain('--focus-ring')
    for (const name of redefined) expect(panel.tokens[name], name).toBe(root[name])
    expect(panel.body).toMatch(/color-scheme:\s*light/)
  })
})
