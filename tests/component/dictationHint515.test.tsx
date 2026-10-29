/**
 * #515: beside the Ask field, a line on how to dictate with the device's own
 * system, and on the privacy page what that means for the voice.
 *
 * STOA writes no speech code (#494). The line only names the way in that the
 * child's device has -- Win + H, the Mac's microphone key, the microphone on
 * the phone's keyboard -- and says nothing on a system it cannot name.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Composer, type DictationHintPlacement } from '@/components/base/Composer'
import i18n from '@/i18n'
import { dictationPlatform, type DictationPlatform } from '@/lib/dictationPlatform'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'

const LOCALES = ['de', 'en', 'fr', 'it'] as const

const AGENTS: Array<[string, string, number, DictationPlatform | null]> = [
  [
    'Windows',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    0,
    'windows',
  ],
  [
    'Mac',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    0,
    'mac',
  ],
  [
    'iPhone',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    5,
    'touch',
  ],
  [
    'iPad asking for the desktop site',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    5,
    'touch',
  ],
  [
    'Android',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
    5,
    'touch',
  ],
  ['Linux', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 0, null],
  [
    'ChromeOS',
    'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    0,
    null,
  ],
]

function pretend(userAgent: string, maxTouchPoints: number) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true })
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true })
}

afterEach(() => {
  // Back to jsdom's own, which lives on the prototype.
  Reflect.deleteProperty(window.navigator, 'userAgent')
  Reflect.deleteProperty(window.navigator, 'maxTouchPoints')
})

function Harness({
  dictationHint = 'floating',
  busy = false,
}: {
  dictationHint?: DictationHintPlacement
  busy?: boolean
}) {
  const [value, setValue] = useState('')
  return (
    <I18nextProvider i18n={i18n}>
      <button type="button">elsewhere</button>
      <Composer
        value={value}
        onChange={setValue}
        onSubmit={vi.fn()}
        label="Ask"
        dictationHint={dictationHint}
        busy={busy}
      />
    </I18nextProvider>
  )
}

function line() {
  return document.querySelector('[data-composer-dictation]')
}

describe('which dictation the device has', () => {
  for (const [name, agent, touchPoints, expected] of AGENTS) {
    it(`${name}: ${expected ?? 'none'}`, () => {
      expect(dictationPlatform({ userAgent: agent, maxTouchPoints: touchPoints })).toBe(expected)
    })
  }
})

describe('the dictation line beside the Ask field', () => {
  for (const [name, agent, touchPoints, expected] of AGENTS) {
    it(`says the ${name} sentence, only while the field is empty and focused`, async () => {
      await i18n.changeLanguage('de')
      pretend(agent, touchPoints)
      render(<Harness />)
      const field = screen.getByRole('textbox', { name: 'Ask' })
      expect(line()).toBeNull()

      await userEvent.click(field)
      if (expected === null) {
        expect(line()).toBeNull()
        return
      }
      const sentence = i18n.t(`composer.dictation.${expected}`, { ns: 'common' })
      expect(line()).toHaveTextContent(sentence)
      expect(line()).toHaveAttribute('data-composer-dictation', expected)
      expect(field).toHaveAccessibleDescription(sentence)

      await userEvent.type(field, 'x')
      expect(line()).toBeNull()
      expect(field).not.toHaveAttribute('aria-describedby')

      await userEvent.clear(field)
      expect(line()).not.toBeNull()

      await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }))
      expect(line()).toBeNull()
    })
  }

  it('stays off in a composer that did not ask for it', async () => {
    pretend(AGENTS[0][1], 0)
    render(
      <I18nextProvider i18n={i18n}>
        <Composer value="" onChange={vi.fn()} onSubmit={vi.fn()} label="Ask" />
      </I18nextProvider>,
    )
    await userEvent.click(screen.getByRole('textbox', { name: 'Ask' }))
    expect(line()).toBeNull()
  })

  it('is not a live region, so focusing the field does not announce it on its own', async () => {
    pretend(AGENTS[0][1], 0)
    render(<Harness />)
    await userEvent.click(screen.getByRole('textbox', { name: 'Ask' }))
    const shown = line()!
    expect(shown).not.toBeNull()
    expect(shown).not.toHaveAttribute('role')
    expect(shown).not.toHaveAttribute('aria-live')
    expect(shown.closest('[aria-live], [role="status"], [role="alert"], [role="log"]')).toBeNull()
  })

  it('stays away while an answer is still coming', async () => {
    pretend(AGENTS[0][1], 0)
    render(<Harness busy />)
    await userEvent.click(screen.getByRole('textbox', { name: 'Ask' }))
    expect(line()).toBeNull()
  })

  it('floats inside the composer, or takes a line of its own above it when inline', async () => {
    await i18n.changeLanguage('de')
    pretend(AGENTS[0][1], 0)
    const { unmount } = render(<Harness />)
    await userEvent.click(screen.getByRole('textbox', { name: 'Ask' }))
    expect(line()!.closest('form')).not.toBeNull()
    unmount()

    render(<Harness dictationHint="inline" />)
    const field = screen.getByRole('textbox', { name: 'Ask' })
    await userEvent.click(field)
    const shown = line()!
    // In the host's flow, right before the composer, so it covers nothing over it.
    expect(shown.closest('form')).toBeNull()
    expect(shown.nextElementSibling).toBe(field.closest('form'))
    expect(field).toHaveAccessibleDescription(i18n.t('composer.dictation.windows', { ns: 'common' }))
    // Coming and going above the composer does not remount the field under the cursor.
    await userEvent.type(field, 'xy')
    expect(field).toHaveFocus()
    expect(field).toHaveValue('xy')
    expect(line()).toBeNull()
  })

  it('inline, keeps its room when it hides, so nothing over the composer moves under a click', async () => {
    await i18n.changeLanguage('de')
    pretend(AGENTS[0][1], 0)
    const { rerender } = render(<Harness dictationHint="inline" />)
    const field = screen.getByRole('textbox', { name: 'Ask' })
    const row = () => document.querySelector<HTMLElement>('[data-composer-dictation-placement="inline"]')
    const sentence = i18n.t('composer.dictation.windows', { ns: 'common' })

    // Before the field is focused the row is there already, holding the
    // sentence that sizes it, unseen and unheard.
    const kept = row()!
    expect(kept).toHaveTextContent(sentence)
    expect(kept).not.toBeVisible()
    expect(field).not.toHaveAttribute('aria-describedby')

    await userEvent.click(field)
    expect(row()).toBe(kept)
    expect(kept).toBeVisible()

    // Pressing something over the composer takes the focus away: the row
    // stays, with the same words, only unseen.
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(row()).toBe(kept)
    expect(kept).toHaveTextContent(sentence)
    expect(kept).not.toBeVisible()

    await userEvent.click(field)
    await userEvent.type(field, 'x')
    expect(row()).toBe(kept)
    expect(kept).not.toBeVisible()

    rerender(<Harness dictationHint="inline" busy />)
    expect(row()).toBe(kept)
  })

  it('inline, takes no room on a system it has nothing to say for', async () => {
    pretend(AGENTS[5][1], 0)
    render(<Harness dictationHint="inline" />)
    await userEvent.click(screen.getByRole('textbox', { name: 'Ask' }))
    expect(document.querySelector('[data-composer-dictation-placement]')).toBeNull()
  })

  it('gives way to the reason send did not go out', async () => {
    await i18n.changeLanguage('de')
    pretend(AGENTS[0][1], 0)
    render(<Harness />)
    const field = screen.getByRole('textbox', { name: 'Ask' })
    fireEvent.focus(field)
    expect(line()).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: i18n.t('composer.send', { ns: 'common' }) }))
    expect(line()).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('composer.sendBlocked.empty', { ns: 'common' }))
  })
})

describe('the dictation copy in every language', () => {
  // The words that make each sentence the one for its device: the Mac has a
  // key, the phone a keyboard on the screen. Swapping two sentences fails here.
  const MAC_KEY = { de: 'Mikrofontaste', en: 'microphone key', fr: 'touche micro', it: 'tasto del microfono' } as const
  const ON_SCREEN_KEYBOARD = { de: 'Tastatur', en: 'keyboard', fr: 'clavier', it: 'tastiera' } as const

  for (const locale of LOCALES) {
    it(`has one sentence per device in ${locale}, each naming its own way in`, async () => {
      await i18n.changeLanguage(locale)
      const say = (platform: DictationPlatform) => i18n.t(`composer.dictation.${platform}`, { ns: 'common' })
      expect(say('windows')).toContain('Win + H')
      expect(say('mac')).not.toContain('Win + H')
      expect(say('touch')).not.toContain('Win + H')
      expect(say('mac')).toContain(MAC_KEY[locale])
      expect(say('mac')).not.toContain(ON_SCREEN_KEYBOARD[locale])
      expect(say('touch')).toContain(ON_SCREEN_KEYBOARD[locale])
      expect(say('touch')).not.toContain(MAC_KEY[locale])
      expect(new Set([say('windows'), say('mac'), say('touch')]).size).toBe(3)
      for (const platform of ['windows', 'mac', 'touch'] as const) {
        expect(say(platform)).not.toBe(`composer.dictation.${platform}`)
      }
    })
  }
})

describe('the privacy page on dictation', () => {
  // What the section promises, sentence by sentence: the voice stays with the
  // device's system (#494) and STOA records none. Pinned whole, so a sentence
  // that keeps its keywords and turns its meaning does not pass.
  const PROMISES = {
    de: [
      'Die Sprache wird dann vom System des Geräts verarbeitet, STOA bekommt nur den Text.',
      'STOA selbst nimmt keine Sprache auf.',
    ],
    en: [
      "The voice is then processed by the device's system, and STOA only receives the text.",
      'STOA itself does not record any voice.',
    ],
    fr: [
      "La voix est alors traitée par le système de l'appareil, et STOA ne reçoit que le texte.",
      "STOA n'enregistre lui-même aucune voix.",
    ],
    it: [
      'La voce viene allora elaborata dal sistema del dispositivo e STOA riceve solo il testo.',
      'STOA stesso non registra alcuna voce.',
    ],
  } as const

  for (const locale of LOCALES) {
    it(`says the device handles the voice and STOA gets only text, in ${locale}`, async () => {
      await i18n.changeLanguage(locale)
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      render(
        <QueryClientProvider client={client}>
          <I18nextProvider i18n={i18n}>
            <MemoryRouter>
              <PrivacyPage />
            </MemoryRouter>
          </I18nextProvider>
        </QueryClientProvider>,
      )
      const text = document.body.textContent ?? ''
      expect(text).toContain(i18n.t('privacy.sections.voiceInput.title', { ns: 'legal' }))
      expect(text).toContain('Win + H')
      const sentences = i18n.t('privacy.sections.voiceInput.body', { ns: 'legal' }).split(/(?<=\.)\s+/)
      for (const promise of PROMISES[locale]) {
        expect(sentences).toContain(promise)
        expect(text).toContain(promise)
      }
      // Nothing beside them says what STOA does with the voice.
      for (const sentence of sentences.filter((said) => said.includes('STOA'))) {
        expect(PROMISES[locale]).toContain(sentence)
      }
    })
  }
})
