/**
 * Shared parts every screen leans on (#276, 2026-10-18 audit): the dialog
 * scrolls instead of pushing its title and buttons off a small screen, the
 * error panel is announced, and the defaults a reader sees are in their own
 * language and spelled right.
 */
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { BackButton } from '@/components/common/BackButton'
import { ErrorState } from '@/components/common/ErrorState'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import i18n from '@/i18n'
import { languageOptions } from '@/i18n/languages'

function inApp(ui: React.ReactNode) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  )
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('shared components (#276)', () => {
  it('the dialog is never taller than the screen and scrolls its content', () => {
    inApp(
      <Dialog open>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Report</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toMatch(/(^|\s)max-h-\[calc\(100dvh-2rem\)\](\s|$)/)
    expect(dialog.className).toMatch(/(^|\s)overflow-y-auto(\s|$)/)
  })

  it('a dialog can still ask for its own height', () => {
    inApp(
      <Dialog open>
        <DialogContent aria-describedby={undefined} className="max-h-[90vh]">
          <DialogTitle>Assign</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toMatch(/(^|\s)max-h-\[90vh\](\s|$)/)
    expect(dialog.className).not.toMatch(/max-h-\[calc/)
  })

  it('the error panel is announced with its message', () => {
    inApp(<ErrorState title="Could not load" message="The server did not answer." />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Could not load')
    expect(alert).toHaveTextContent('The server did not answer.')
  })

  for (const [lang, word] of [['de', 'Zurück'], ['fr', 'Retour'], ['it', 'Indietro'], ['en', 'Back']] as const) {
    it(`the back button says "${word}" by default in ${lang}`, async () => {
      await i18n.changeLanguage(lang)
      inApp(
        <>
          <BackButton to="/" />
          <BackButton />
        </>,
      )
      expect(screen.getByRole('link', { name: word })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: word })).toBeInTheDocument()
    })
  }

  it('a label passed in still wins', () => {
    inApp(<BackButton to="/" label="Zur Karte" />)
    expect(screen.getByRole('link', { name: 'Zur Karte' })).toBeInTheDocument()
  })

  it('French is spelled "Français" in the language picker', () => {
    expect(languageOptions.find((option) => option.code === 'fr')?.label).toBe('Français')
  })
})
