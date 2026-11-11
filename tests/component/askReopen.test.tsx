/**
 * Getting Ask back after it was closed (#125), from the docked composer.
 *
 * Closing the panel left the docked composer -- a new question could still be
 * asked -- but the conversation just read had no entry anywhere on the page.
 * A round button at the end of the composer's row was the way back (#645),
 * and it read as a second way into the same thread: typing opened the last
 * conversation, and so did the button. Now a press on the composer's field
 * offers the latest conversations and the whole list, and its + offers the
 * ways to add a picture right there, opening Ask only once one is chosen. The button stays only while the usage period is paused
 * (#615), when the field is shut.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { ASK_REOPEN } from '@/features/ask/askLayout'
import { AskServerProvider } from '@/features/ask/server/askServer'
import i18n from '@/i18n'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

// What a picked file goes through on its way up is askAttachments'; here it
// only has to arrive in Ask's tray, so the upload is answered and held.
vi.mock('@/services/files/fileApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/fileApi')>()),
  uploadFile: vi.fn(() => new Promise(() => {})),
}))
vi.mock('@/services/files/prepareImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/prepareImage')>()),
  prepareImage: vi.fn(async (file: File) => file),
}))
vi.mock('@/services/files/uploadCodeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/files/uploadCodeApi')>()),
  createUploadCode: vi.fn(() => new Promise(() => {})),
}))

const summary = (id: string, title: string, updatedAt: string) => ({ id, title, subject: 'math', grade: '8', updatedAt })

/** Five conversations, listed out of order: the dock must pick the three newest itself. */
const CONVERSATIONS = [
  summary('c1', 'Linear equations', '2026-10-11T10:00:00.000Z'),
  summary('c2', 'Fractions', '2026-10-10T10:00:00.000Z'),
  summary('c3', 'Percentages', '2026-10-13T10:00:00.000Z'),
  summary('c4', 'Angles', '2026-10-09T10:00:00.000Z'),
  summary('c5', 'Powers', '2026-10-12T10:00:00.000Z'),
]

/** The server behind Ask, in memory (#571), and no teacher online. */
let server: FakeAskServer

/** A width, and a touch screen (a coarse pointer) below a tablet's unless said otherwise. */
function emulateWidth(width: number, touch = width < 768) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: query.includes('pointer: coarse') ? touch : !min || width >= Number(min[1]),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

function planet(width = 1280, touch?: boolean) {
  emulateWidth(width, touch)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/planet/math']}>
          <AskServerProvider value={server}>
            <AskHost>
              <button type="button">Rotate the planet</button>
            </AskHost>
          </AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const reopen = () => document.querySelector<HTMLElement>('[data-ask-reopen]')
const surface = () => document.querySelector<HTMLElement>('[data-ask-surface]')
const recent = () => document.querySelector<HTMLElement>('[data-ask-recent]')
const docked = () => document.querySelector<HTMLElement>('[data-ask-docked]')!
const dockedField = () => within(docked()).getByRole('textbox')

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  server = createFakeAskServer()
  server.availability = { online: false, availableTeachers: 0 }
  server.seed({
    conversations: CONVERSATIONS.map((conversation) => ({ ...conversation, messages: [] })),
    list: CONVERSATIONS,
  })
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('the docked composer is the one way back into Ask', () => {
  for (const width of [375, 1280]) {
    it(`draws no second button beside it at ${width}`, () => {
      planet(width)
      expect(reopen()).toBeNull()
      const row = docked()
      if (width >= 1280) {
        // Centred, 640 at most, with no room kept for a button.
        expect(row.style.gridTemplateColumns).toBe('1fr minmax(0, 640px) 1fr')
      } else {
        expect(row.style.gap).toBe('')
        expect(row.children).toHaveLength(1)
      }
    })
  }

  it('a press on the field offers the three newest conversations, newest first, and the whole list', async () => {
    planet()
    expect(dockedField()).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(dockedField())

    const menu = await screen.findByRole('menu')
    expect(dockedField()).toHaveAttribute('aria-expanded', 'true')
    expect(dockedField()).toHaveAttribute('aria-controls', menu.id)
    await waitFor(() => expect(menu.querySelectorAll('[data-ask-recent-conversation]')).toHaveLength(3))
    const ids = [...menu.querySelectorAll<HTMLElement>('[data-ask-recent-conversation]')].map((row) => row.dataset.askRecentConversation)
    expect(ids).toEqual(['c3', 'c5', 'c1'])
    expect(within(menu).getByRole('menuitem', { name: /All conversations/ })).toBeInTheDocument()
    // Offered, not opened.
    expect(surface()).toBeNull()
  })

  it('a conversation chosen there opens Ask on it', async () => {
    planet()
    await userEvent.click(dockedField())
    await userEvent.click(await screen.findByRole('menuitem', { name: /Powers/ }))

    expect(surface()).toHaveAttribute('data-ask-conversation', 'c5')
    expect(recent()).toBeNull()
  })

  it('the pill under them opens the list', async () => {
    planet(375)
    await userEvent.click(dockedField())
    await userEvent.click(await screen.findByRole('menuitem', { name: /All conversations/ }))

    expect(surface()).toHaveAttribute('data-ask-conversation', '')
  })

  it('opens on a press only: not when a script or Tab puts the cursor in the field', async () => {
    planet()
    dockedField().focus()
    expect(dockedField()).toHaveFocus()
    expect(recent()).toBeNull()

    dockedField().blur()
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    expect(recent()).toBeNull()
    expect(surface()).toBeNull()
  })

  it('arrows move through it, and Escape puts it away with the cursor back in the field', async () => {
    planet()
    await userEvent.click(dockedField())
    await waitFor(() => expect(recent()!.querySelectorAll('[role=menuitem]')).toHaveLength(4))

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: /Percentages/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: /Powers/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: /All conversations/ })).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    expect(recent()).toBeNull()
    expect(dockedField()).toHaveFocus()
    expect(dockedField()).toHaveAttribute('aria-expanded', 'false')
  })

  it('goes when the student types, and typing still opens Ask with what was typed', async () => {
    planet()
    await userEvent.click(dockedField())
    expect(await screen.findByRole('menu')).toBeInTheDocument()

    await userEvent.type(dockedField(), 'W')
    expect(recent()).toBeNull()
    expect(surface()).not.toBeNull()
  })

  it('goes on a press anywhere else', async () => {
    planet()
    await userEvent.click(dockedField())
    expect(await screen.findByRole('menu')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Rotate the planet' }))
    expect(recent()).toBeNull()
    expect(surface()).toBeNull()
  })

  it('offers only the whole list while there is no conversation yet', async () => {
    server.seed({ conversations: [], list: [] })
    planet()
    await userEvent.click(dockedField())

    const menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(1)
    expect(within(menu).getByRole('menuitem', { name: /All conversations/ })).toBeInTheDocument()
  })

  it('Enter with nothing written still says what is missing, and opens nothing', async () => {
    planet()
    dockedField().focus()
    fireEvent.keyDown(dockedField(), { key: 'Enter' })
    expect(surface()).toBeNull()
    expect(docked().querySelector('[data-composer-hint="empty"]')).not.toBeNull()
  })
})

describe('the docked +', () => {
  const add = () => within(docked()).getByRole('button', { name: 'Add a photo' })
  const actions = (menu: Element) =>
    [...menu.querySelectorAll<HTMLElement>('[data-composer-action]')].map((item) => item.dataset.composerAction)
  const dockedPicker = () => docked().querySelector<HTMLInputElement>('input[type=file]:not([capture])')!
  const photo = () => new File([new Uint8Array(2000)], 'triangle.png', { type: 'image/png' })

  it('opens its menu right on the dock, and Ask stays closed (phone)', async () => {
    planet(375)
    await userEvent.click(add())

    const menu = await waitFor(() => {
      const found = docked().querySelector('[data-composer-menu]')
      expect(found).not.toBeNull()
      return found!
    })
    // A phone or tablet: the camera, or a photo already on it.
    expect(actions(menu)).toEqual(['capture', 'attach'])
    expect(surface()).toBeNull()
  })

  it('opens its menu right on the dock, and Ask stays closed (computer)', async () => {
    planet(1280)
    await userEvent.click(add())

    const menu = await waitFor(() => {
      const found = docked().querySelector('[data-composer-menu]')
      expect(found).not.toBeNull()
      return found!
    })
    // A computer: a file on it, or a photo from the phone.
    expect(actions(menu)).toEqual(['attach', 'phone'])
    expect(surface()).toBeNull()
  })

  for (const width of [375, 1280]) {
    it(`a file picked from it opens Ask with the file in Ask's composer, not sent, at ${width}`, async () => {
      planet(width)
      const click = vi.spyOn(dockedPicker(), 'click')
      await userEvent.click(add())
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Choose a photo or file' }))
      // The chooser opened from the press itself, and Ask waits for a file.
      expect(click).toHaveBeenCalledTimes(1)
      expect(surface()).toBeNull()

      await userEvent.upload(dockedPicker(), photo())

      expect(surface()).not.toBeNull()
      const tray = await waitFor(() => {
        const found = surface()!.querySelector<HTMLElement>('[data-ask-attachments]')
        expect(found).not.toBeNull()
        return found!
      })
      expect(within(tray).getByText('triangle.png')).toBeInTheDocument()
      // Waiting for the question: the cursor in Ask's field, nothing sent.
      const field = surface()!.querySelector<HTMLTextAreaElement>('[data-composer-field]')!
      await waitFor(() => expect(field).toHaveFocus())
      expect(server.stream.streamConversationMessage).not.toHaveBeenCalled()
      expect(server.conversations.createConversation).not.toHaveBeenCalled()
      expect(useAskStore.getState().added).toBeNull()
    })
  }

  it('a chooser put away with nothing picked opens nothing', async () => {
    planet()
    await userEvent.click(add())
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Choose a photo or file' }))
    fireEvent.change(dockedPicker(), { target: { files: [] } })

    expect(surface()).toBeNull()
    expect(useAskStore.getState().added).toBeNull()
  })

  it('"Send a photo from your phone" opens Ask and starts the phone there', async () => {
    planet(1280)
    await userEvent.click(add())
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Send a photo from your phone' }))

    expect(surface()).not.toBeNull()
    await waitFor(() => expect(surface()!.querySelector('[data-phone-upload]')).not.toBeNull())
    expect(useAskStore.getState().added).toBeNull()
  })

  it('a plain opening shows no add menu', async () => {
    planet()
    await userEvent.type(dockedField(), 'W')
    expect(surface()).not.toBeNull()
    expect(surface()!.querySelector('[data-composer-menu]')).toBeNull()
  })
})

describe('while the usage period is paused (#615)', () => {
  function pause() {
    server.entitlement = { ...server.entitlement, usagePeriod: { endsAt: '2026-11-08', state: 'expired', daysLeft: 0, paidBy: 'parent' } }
  }

  it('keeps the button at the end of the row, the one way to the old conversations', async () => {
    pause()
    planet(1280)
    const back = await waitFor(() => {
      expect(reopen()).not.toBeNull()
      return reopen()!
    })
    expect(back).toHaveAttribute('data-ask-reopen', 'list')
    expect(back).toHaveAccessibleName('Open Ask')
    expect(back).toHaveStyle({ width: `${ASK_REOPEN.size}px`, height: `${ASK_REOPEN.size}px` })
    const room = ASK_REOPEN.size + ASK_REOPEN.gap
    expect(docked().style.gridTemplateColumns).toBe(`minmax(${room}px, 1fr) minmax(0, 640px) minmax(${room}px, 1fr)`)
    expect(dockedField()).toBeDisabled()
    expect(within(docked()).getByRole('button', { name: 'Add a photo' })).toBeDisabled()

    await userEvent.click(back)
    expect(surface()).toHaveAttribute('data-ask-conversation', '')
  })
})
