/**
 * #410 (part 3): archiving in the bell's panel.
 *
 * An archived item leaves the list with the button that was pressed, and focus
 * fell to <body>. Every archive button was also called just "Archive", so a
 * screen reader could not tell which notification each one removes.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/common.json'
import en from '@/i18n/locales/en/common.json'
import fr from '@/i18n/locales/fr/common.json'
import italian from '@/i18n/locales/it/common.json'
import { httpClient } from '@/services/api/httpClient'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { NotificationEvent } from '@/types/notification'

vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled', isLive: false }),
}))

// Event 1 is the oldest; the list is newest first.
function event(n: number): NotificationEvent {
  return {
    eventId: `e-${n}`,
    recipientRole: 'student',
    eventType: 'system_notice',
    targetType: 'system',
    targetId: `t-${n}`,
    title: `Notice ${n}`,
    summary: `Summary ${n}`,
    status: 'read',
    createdAt: new Date(Date.UTC(2026, 9, 1) + n * 60_000).toISOString(),
    metadata: {},
  }
}

let store: NotificationEvent[] = []
// Holds the archive's answer back until the test lets it through.
let hold: Promise<void> = Promise.resolve()

function fakeBackend() {
  vi.spyOn(httpClient, 'get').mockImplementation(async (url: string, config?: { params?: unknown }) => {
    if (url !== '/notifications') throw new Error(`unexpected GET ${url}`)
    const { status } = (config?.params ?? {}) as Record<string, unknown>
    const items = store
      .filter((item) => (status === undefined ? item.status !== 'archived' : item.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { data: { items, count: items.length } }
  })
  vi.spyOn(httpClient, 'post').mockImplementation(async (url: string) => {
    const match = /^\/notifications\/([^/]+)\/archive$/.exec(url)
    const item = match && store.find((candidate) => candidate.eventId === decodeURIComponent(match[1]))
    if (!match || !item) throw new Error(`unexpected POST ${url}`)
    await hold
    item.status = 'archived'
    return { data: item }
  })
}

async function openPanel(events: NotificationEvent[]) {
  store = events
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: /^Notifications/ }))
  const panel = screen.getByRole('dialog', { name: 'Notifications' })
  await within(panel).findByRole('button', { name: `Archive “${events[0].title}”` })
  return panel
}

const item = (n: number) => screen.getByRole('button', { name: new RegExp(`^Notice ${n}(?!\\d)`) })
const archiveOf = (n: number) => screen.getByRole('button', { name: `Archive “Notice ${n}”` })
const gone = (n: number) => waitFor(() => expect(screen.queryByRole('button', { name: `Archive “Notice ${n}”` })).toBeNull())

beforeEach(async () => {
  await i18n.changeLanguage('en')
  hold = Promise.resolve()
  fakeBackend()
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('each archive button', () => {
  it('is named for its notification', async () => {
    const panel = await openPanel([event(1), event(2), event(3)])
    const names = within(panel)
      .getAllByRole('button', { name: /^Archive/ })
      .map((button) => button.getAttribute('aria-label'))
    expect(names).toEqual(['Archive “Notice 3”', 'Archive “Notice 2”', 'Archive “Notice 1”'])
  })
})

describe('after an archive, focus', () => {
  it('goes to the next item', async () => {
    await openPanel([event(1), event(2), event(3)])
    await userEvent.click(archiveOf(2))
    await gone(2)
    await waitFor(() => expect(item(1)).toHaveFocus())
  })

  it('goes to the one before when the last item was archived', async () => {
    await openPanel([event(1), event(2), event(3)])
    await userEvent.click(archiveOf(1))
    await gone(1)
    await waitFor(() => expect(item(2)).toHaveFocus())
  })

  it('goes to the panel when no item is left', async () => {
    const panel = await openPanel([event(1)])
    await userEvent.click(archiveOf(1))
    await gone(1)
    await waitFor(() => expect(panel).toHaveFocus())
    expect(within(panel).getByText('No notifications yet.')).toBeInTheDocument()
  })

  it('stays where it was put while the archive was on its way', async () => {
    let release: () => void = () => {}
    hold = new Promise((resolve) => { release = resolve })
    await openPanel([event(1), event(2), event(3)])
    await userEvent.click(archiveOf(2))
    item(3).focus()
    release()
    await gone(2)
    expect(item(3)).toHaveFocus()
  })
})

describe('the new copy', () => {
  it('is in all four languages and names the notification', () => {
    for (const [language, bundle] of Object.entries({ de, en, fr, it: italian })) {
      expect(bundle.notifications.archiveItem, language).toContain('{{title}}')
    }
    expect(de.notifications.archiveItem).not.toContain('ß')
  })
})
