/**
 * The star map's top reads as one sky (#649).
 *
 * The sky bar is the sky at 86%; what showed through it was the shell's light
 * ground, so the bar came out a shade lighter than the sky under it. On a sky
 * page the shell is the sky now. The star map also drops the line under the
 * bar and under the demo notice; the other sky pages keep the bar's line,
 * because their content scrolls under it. Light pages are unchanged.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import '@/dev/demo/sky/source'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import i18n from '@/i18n'
import type { SupportedLanguage } from '@/i18n/languages'
import { AppLayout } from '@/layouts/AppLayout'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { fakeClock, recordingRenderer } from './starmapHarness'

// The bell's own data is not what this is about.
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  vi.restoreAllMocks()
})

function renderShell(props: { surface?: 'sky'; seamlessBar?: boolean; bleed?: boolean }) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AppLayout {...props}>
            <p>page</p>
          </AppLayout>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
  return {
    shell: document.querySelector('[data-app-shell]') as HTMLElement,
    bar: document.querySelector('[data-top-bar]') as HTMLElement,
  }
}

const classes = (element: Element) => (element.getAttribute('class') ?? '').split(/\s+/)
const borderClasses = (element: Element) => classes(element).filter((name) => /^border(-|$)/.test(name))

describe('the shell on a sky page (#649)', () => {
  it('paints the sky behind the translucent bar, so the bar is not lighter than the page', () => {
    const { shell, bar } = renderShell({ surface: 'sky', bleed: true, seamlessBar: true })
    expect(shell).toHaveAttribute('data-surface', 'sky')
    expect(classes(shell)).toContain('bg-sky')
    expect(classes(shell)).not.toContain('bg-ground')
    expect(bar.style.background).toContain('var(--sky)')
  })

  it('on the star map (seamless) there is no line under the bar', () => {
    const { bar } = renderShell({ surface: 'sky', bleed: true, seamlessBar: true })
    expect(borderClasses(bar)).toEqual([])
  })

  it('another sky page keeps the line, since its content scrolls under the bar', () => {
    const { shell, bar } = renderShell({ surface: 'sky' })
    expect(classes(shell)).toContain('bg-sky')
    expect(classes(bar)).toContain('border-b')
    expect(classes(bar)).toContain('border-[color:var(--sky-glass-border)]')
  })

  it('a light page keeps the light ground and the light bar with its line', () => {
    const { shell, bar } = renderShell({})
    expect(shell).not.toHaveAttribute('data-surface')
    expect(classes(shell)).toContain('bg-ground')
    expect(classes(shell)).not.toContain('bg-sky')
    expect(bar.style.background).toBe('var(--bar)')
    expect(classes(bar)).toContain('border-b')
    expect(classes(bar)).toContain('border-separator')
  })
})

it('the demo notice is a line of text on the sky, with no rule under it (#649)', async () => {
  await i18n.changeLanguage('en')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width: 375, height: 767, right: 375, bottom: 767, toJSON: () => ({}),
  } as DOMRect)
  const clock = fakeClock()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky">
          <StarMapView
            demo
            map={demoStarMap('math', 10, i18n.getFixedT('en', 'starmap'), { language: 'en' as SupportedLanguage })}
            target={{ layer: 'map' }}
            onNavigate={vi.fn()}
            scheduler={clock}
            createRendererFor={() => recordingRenderer()}
          />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  const notice = view.container.querySelector('[data-starmap-notice]')!
  expect(notice.textContent).toBe(i18n.t('starmap:demo.notice'))
  expect(borderClasses(notice)).toEqual([])
})
