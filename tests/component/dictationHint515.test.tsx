/**
 * #515, #553: in the Ask field, a microphone that says how to dictate with the
 * device's own system, and on the privacy page what that means for the voice.
 *
 * STOA writes no speech code (#494, ADR 0005). The microphone starts nothing:
 * pressed, it names the way in that the child's device has -- Win + H, the
 * Mac's microphone key, the microphone on the phone's keyboard -- and that
 * STOA only receives the text. On a system it cannot name there is none.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Composer } from '@/components/base/Composer'
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

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState('')
  return (
    <I18nextProvider i18n={i18n}>
      <button type="button">elsewhere</button>
      <Composer
        value={value}
        onChange={setValue}
        onSubmit={vi.fn()}
        label="Ask"
        dictation
        disabled={disabled}
      />
    </I18nextProvider>
  )
}

function bubble() {
  return document.querySelector('[data-composer-dictation]')
}

const micName = () => i18n.t('composer.dictation.label', { ns: 'common' })

describe('which dictation the device has', () => {
  for (const [name, agent, touchPoints, expected] of AGENTS) {
    it(`${name}: ${expected ?? 'none'}`, () => {
      expect(dictationPlatform({ userAgent: agent, maxTouchPoints: touchPoints })).toBe(expected)
    })
  }
})

describe('the microphone in the Ask field (#553)', () => {
  for (const [name, agent, touchPoints, expected] of AGENTS) {
    it(`${name}: ${expected === null ? 'no microphone' : 'says how to dictate there, and that STOA gets only text'}`, async () => {
      await i18n.changeLanguage('de')
      pretend(agent, touchPoints)
      render(<Harness />)
      const field = screen.getByRole('textbox', { name: 'Ask' })
      if (expected === null) {
        expect(screen.queryByRole('button', { name: micName() })).toBeNull()
        return
      }
      const mic = screen.getByRole('button', { name: micName() })
      expect(mic).toHaveAttribute('aria-expanded', 'false')
      expect(bubble()).toBeNull()
      // Nothing is said over the field any more, and the field points at nothing.
      expect(field).not.toHaveAttribute('aria-describedby')

      await userEvent.click(mic)
      const shown = bubble()!
      expect(shown).toHaveAttribute('data-composer-dictation', expected)
      expect(shown).toHaveTextContent(i18n.t(`composer.dictation.${expected}`, { ns: 'common' }))
      expect(shown).toHaveTextContent(i18n.t('composer.dictation.privacy', { ns: 'common' }))
      expect(mic).toHaveAttribute('aria-expanded', 'true')
      expect(mic).toHaveAttribute('aria-controls', shown.id)

      await userEvent.click(mic)
      expect(bubble()).toBeNull()
      expect(mic).toHaveAttribute('aria-expanded', 'false')
    })
  }

  it('is put away by Esc, which gives the keyboard back to the microphone', async () => {
    pretend(AGENTS[0][1], 0)
    render(<Harness />)
    const mic = screen.getByRole('button', { name: micName() })
    await userEvent.click(mic)
    expect(bubble()).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    expect(bubble()).toBeNull()
    expect(mic).toHaveFocus()
  })

  it('is put away by a press anywhere else, and stays for a press on itself', async () => {
    pretend(AGENTS[0][1], 0)
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: micName() }))
    await userEvent.click(bubble()!)
    expect(bubble()).not.toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(bubble()).toBeNull()
  })

  it('is not there in a composer that did not ask for it', () => {
    pretend(AGENTS[0][1], 0)
    render(
      <I18nextProvider i18n={i18n}>
        <Composer value="" onChange={vi.fn()} onSubmit={vi.fn()} label="Ask" />
      </I18nextProvider>,
    )
    expect(screen.queryByRole('button', { name: micName() })).toBeNull()
  })

  it('is off with the rest of a composer that is off', () => {
    pretend(AGENTS[0][1], 0)
    render(<Harness disabled />)
    expect(screen.getByRole('button', { name: micName() })).toBeDisabled()
  })

  it('has its name and the privacy sentence in every language, each its own words', async () => {
    const english = {
      label: i18n.getFixedT('en', 'common')('composer.dictation.label'),
      privacy: i18n.getFixedT('en', 'common')('composer.dictation.privacy'),
    }
    for (const locale of ['de', 'fr', 'it'] as const) {
      const t = i18n.getFixedT(locale, 'common')
      for (const key of ['label', 'privacy'] as const) {
        expect(t(`composer.dictation.${key}`)).not.toBe(`composer.dictation.${key}`)
        expect(t(`composer.dictation.${key}`), `${locale} ${key}`).not.toBe(english[key])
      }
      expect(t('composer.dictation.privacy')).toContain('STOA')
    }
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
