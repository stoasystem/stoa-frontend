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

function Harness({ dictationHint = true }: { dictationHint?: boolean }) {
  const [value, setValue] = useState('')
  return (
    <I18nextProvider i18n={i18n}>
      <button type="button">elsewhere</button>
      <Composer value={value} onChange={setValue} onSubmit={vi.fn()} label="Ask" dictationHint={dictationHint} />
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

  it('stays off in a composer that did not ask for it (the teacher reply)', async () => {
    pretend(AGENTS[0][1], 0)
    render(<Harness dictationHint={false} />)
    await userEvent.click(screen.getByRole('textbox', { name: 'Ask' }))
    expect(line()).toBeNull()
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
  for (const locale of LOCALES) {
    it(`has one sentence per device in ${locale}, each naming its own way in`, async () => {
      await i18n.changeLanguage(locale)
      const say = (platform: DictationPlatform) => i18n.t(`composer.dictation.${platform}`, { ns: 'common' })
      expect(say('windows')).toContain('Win + H')
      expect(say('mac')).not.toContain('Win + H')
      expect(say('touch')).not.toContain('Win + H')
      expect(new Set([say('windows'), say('mac'), say('touch')]).size).toBe(3)
      for (const platform of ['windows', 'mac', 'touch'] as const) {
        expect(say(platform)).not.toBe(`composer.dictation.${platform}`)
      }
    })
  }
})

describe('the privacy page on dictation', () => {
  // "Only the text" in each language: the sentence #494 settled on.
  const ONLY_TEXT = {
    de: 'STOA bekommt nur den Text',
    en: 'STOA only receives the text',
    fr: 'STOA ne reçoit que le texte',
    it: 'STOA riceve solo il testo',
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
      expect(text).toContain(ONLY_TEXT[locale])
      expect(text).toContain('Win + H')
    })
  }
})
