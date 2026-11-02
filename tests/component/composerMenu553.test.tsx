/*
 * The composer's + and microphone (#553), as the student found them on
 * production: the + went straight to a file dialog with no word of the phone,
 * a line over the field said how to dictate where an icon was wanted, and a
 * scrollbar with two arrows stood beside an empty one-line field.
 *
 *   - the + opens a menu of the ways to add a picture, by pointer and by
 *     keyboard, Esc giving the keyboard back to the +;
 *   - the phone's way, when it cannot be used yet, stays in the menu, off,
 *     with its reason, reachable and read out;
 *   - the one-line field draws no scrollbar;
 *   - the words are in all four languages.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { Composer } from '@/components/base/Composer'
import i18n from '@/i18n'

function show(props: Partial<Parameters<typeof Composer>[0]> = {}) {
  render(
    <I18nextProvider i18n={i18n}>
      <Composer value="" onChange={vi.fn()} onSubmit={vi.fn()} label="Ask" {...props} />
    </I18nextProvider>,
  )
  return screen.getByRole('button', { name: 'Add a photo' })
}

describe('the + menu', () => {
  it('on a computer: choose a picture, or have the phone take one', async () => {
    const onAttach = vi.fn()
    const onPhone = vi.fn()
    await i18n.changeLanguage('en')
    await userEvent.click(show({ onAttach, onPhone }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Choose a photo or file',
      'Send a photo from your phone',
    ])
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Send a photo from your phone' }))
    expect(onPhone).toHaveBeenCalledTimes(1)
    expect(onAttach).not.toHaveBeenCalled()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens from the keyboard, and Esc gives the keyboard back to the +', async () => {
    const onAttach = vi.fn()
    await i18n.changeLanguage('en')
    const add = show({ onAttach, onCapture: vi.fn() })
    add.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(add).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    expect(onAttach).toHaveBeenCalledTimes(1)
  })

  it('keeps the phone’s way, off and with its reason, until it can be used', async () => {
    await i18n.changeLanguage('en')
    await userEvent.click(show({ onAttach: vi.fn(), phoneLater: true }))
    const item = screen.getByRole('menuitem', { name: /^Send a photo from your phone/ })
    expect(item).toHaveAttribute('aria-disabled', 'true')
    expect(item).toHaveTextContent('Send your question first, then you can add a photo from your phone.')
    await userEvent.click(item)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('is not there with no way to add a picture', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Composer value="" onChange={vi.fn()} onSubmit={vi.fn()} label="Ask" />
      </I18nextProvider>,
    )
    expect(screen.queryByRole('button', { name: 'Add a photo' })).toBeNull()
  })

  it('is off with the rest of a composer that is off', () => {
    expect(show({ onAttach: vi.fn(), disabled: true })).toBeDisabled()
  })
})

describe('the one-line field', () => {
  it('draws no scrollbar, docked; the full composer keeps its own', () => {
    const { unmount } = render(
      <I18nextProvider i18n={i18n}>
        <Composer value="" onChange={vi.fn()} onSubmit={vi.fn()} label="Ask" />
      </I18nextProvider>,
    )
    expect(screen.getByRole('textbox', { name: 'Ask' }).className).toContain('[scrollbar-width:none]')
    unmount()
    render(
      <I18nextProvider i18n={i18n}>
        <Composer value="" onChange={vi.fn()} onSubmit={vi.fn()} label="Ask" variant="full" />
      </I18nextProvider>,
    )
    expect(screen.getByRole('textbox', { name: 'Ask' }).className).not.toContain('scrollbar-width')
  })
})

describe('the words', () => {
  it('name the + and say why the phone waits, in all four languages, each its own', () => {
    const english = i18n.getFixedT('en', 'common')
    for (const locale of ['de', 'fr', 'it'] as const) {
      const t = i18n.getFixedT(locale, 'common')
      for (const key of ['composer.add', 'composer.phoneLater']) {
        expect(t(key), `${locale} ${key}`).not.toBe(key)
        expect(t(key), `${locale} ${key}`).not.toBe(english(key))
      }
    }
  })
})
