/**
 * #697: a voice question in the Ask field. The microphone records (press,
 * then press again), the recording goes to the backend as the request body,
 * and what was said lands in the field at the cursor -- never sent. Only for
 * a student a linked parent allowed (stoa-backend#469); otherwise, and when
 * the browser refuses the microphone or cannot record, the microphone says
 * how to dictate, as before (#515).
 *
 * The recording is a 16 kHz mono WAV the page writes itself with Web Audio
 * (#726: the speech model takes only mp3 and wav). Web Audio is a stand-in
 * here (jsdom has none, `fakeWebAudio.ts`): these tests show what the
 * composer does with the samples it is given, not that a real browser hears
 * the microphone. That is for the device checks in the PR.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Composer } from '@/components/base/Composer'
import type { VoiceInput } from '@/components/base/useVoiceRecording'
import { ChildVoiceQuestionsCard } from '@/components/parent/ChildVoiceQuestionsCard'
import { useVoiceQuestionInput } from '@/hooks/student/useVoiceQuestionInput'
import i18n from '@/i18n'
import {
  canRecordVoiceHere,
  insertAtCursor,
  MAX_RECORDING_BYTES,
  MAX_SENDS_PER_RECORDING,
  VOICE_FAILURE_CODES,
  VoiceFailure,
  type VoiceFailureKind,
} from '@/lib/voiceRecording'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { ApiError, httpClient } from '@/services/api/httpClient'
import { transcribeVoiceQuestion, voiceFailureOf } from '@/services/student/voiceQuestionsApi'
import { useAuthStore } from '@/store/authStore'
import { FakeAudioContext, FakeAudioWorkletNode, installWebAudio, readWav, removeWebAudio } from './fakeWebAudio'

const LOCALES = ['de', 'en', 'fr', 'it'] as const
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const LINUX = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

/* ---- the browser's audio and microphone, stand-ins ------------------- */

const trackStopped = vi.fn()
const getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop: trackStopped }] }) as unknown as MediaStream)

function pretend(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true })
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 0, configurable: true })
}

function installBrowser({ webAudio = true }: { webAudio?: boolean } = {}) {
  Object.defineProperty(window.navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
  if (webAudio) installWebAudio()
  else removeWebAudio()
}

/** The capture worklet's node of the latest recording. */
const capture = () => FakeAudioWorkletNode.instances[FakeAudioWorkletNode.instances.length - 1]

beforeEach(async () => {
  await i18n.changeLanguage('de')
  getUserMedia.mockReset()
  getUserMedia.mockImplementation(async () => ({ getTracks: () => [{ stop: trackStopped }] }) as unknown as MediaStream)
  trackStopped.mockReset()
  pretend(WINDOWS)
  installBrowser()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  Reflect.deleteProperty(window.navigator, 'userAgent')
  Reflect.deleteProperty(window.navigator, 'maxTouchPoints')
  Reflect.deleteProperty(window.navigator, 'mediaDevices')
  removeWebAudio()
  useAuthStore.setState({ user: null, isAuthenticated: false } as never)
})

const common = (key: string, options?: Record<string, unknown>) => i18n.t(key, { ns: 'common', ...options })
const startName = () => common('composer.voice.start')
const stopName = () => common('composer.voice.stop')
const dictationName = () => common('composer.dictation.label')

/* ---- a composer with voice given directly ------------------------------ */

function Harness({
  voice,
  initial = '',
  onSubmit = vi.fn(),
  disabled = false,
}: {
  voice?: VoiceInput
  initial?: string
  onSubmit?: (value: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState(initial)
  return (
    <I18nextProvider i18n={i18n}>
      <button type="button">elsewhere</button>
      <Composer value={value} onChange={setValue} onSubmit={onSubmit} label="Ask" dictation voice={voice} disabled={disabled} />
    </I18nextProvider>
  )
}

function voiceWith(transcribe: VoiceInput['transcribe'], extra: Partial<VoiceInput> = {}): VoiceInput {
  return { transcribe, ...extra }
}

const field = () => screen.getByRole('textbox', { name: 'Ask' }) as HTMLTextAreaElement
const voiceBubble = () => document.querySelector<HTMLElement>('[data-composer-voice]')

/** Records `seconds` of speech and stops. */
async function recordAndStop(seconds = 1) {
  await userEvent.click(screen.getByRole('button', { name: startName() }))
  await screen.findByRole('button', { name: stopName() })
  act(() => capture().hear(seconds))
  await userEvent.click(screen.getByRole('button', { name: stopName() }))
}

describe('whether this browser can record (#726)', () => {
  const mic = { navigator: { mediaDevices: { getUserMedia: () => {} } } }
  it('needs Web Audio with an audio worklet, and a microphone to ask for', () => {
    expect(canRecordVoiceHere({ AudioContext: class {}, AudioWorkletNode: class {}, ...mic })).toBe(true)
    // Safari before 14.1: Web Audio, but no worklet.
    expect(canRecordVoiceHere({ AudioContext: class {}, ...mic })).toBe(false)
    expect(canRecordVoiceHere({ AudioWorkletNode: class {}, ...mic })).toBe(false)
    // Not a secure page: no getUserMedia.
    expect(canRecordVoiceHere({ AudioContext: class {}, AudioWorkletNode: class {}, navigator: {} })).toBe(false)
  })
})

describe('what was said goes in at the cursor', () => {
  it('replaces a selection and keeps a space to the words either side', () => {
    expect(insertAtCursor('', 0, 0, 'Hallo')).toEqual({ value: 'Hallo', cursor: 5 })
    expect(insertAtCursor('Frage:', 6, 6, 'Sinus')).toEqual({ value: 'Frage: Sinus', cursor: 12 })
    expect(insertAtCursor('ab', 1, 1, 'X')).toEqual({ value: 'a X b', cursor: 3 })
    expect(insertAtCursor('a OLD b', 2, 5, 'NEW')).toEqual({ value: 'a NEW b', cursor: 5 })
    expect(insertAtCursor('text', null, null, 'more')).toEqual({ value: 'text more', cursor: 9 })
  })
})

describe('recording a voice question (#697)', () => {
  it('records, sends the recording itself, and puts the text in the field without sending it', async () => {
    const transcribe = vi.fn(async () => 'Wie rechne ich den Sinus aus?')
    const onSubmit = vi.fn()
    render(<Harness voice={voiceWith(transcribe)} initial="Hallo." onSubmit={onSubmit} />)
    const mic = screen.getByRole('button', { name: startName() })
    expect(mic).toHaveAttribute('aria-pressed', 'false')
    field().setSelectionRange(6, 6)

    await userEvent.click(mic)
    // Listening, with the time against the minute.
    await waitFor(() => expect(voiceBubble()).toHaveAttribute('data-composer-voice', 'listening'))
    expect(voiceBubble()).toHaveTextContent(common('composer.voice.listening'))
    expect(document.querySelector('[data-composer-voice-clock]')).toHaveTextContent('0:00 / 1:00')
    expect(screen.getByRole('button', { name: stopName() })).toHaveAttribute('aria-pressed', 'true')
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
    // The microphone goes through the capture worklet, which is connected so every engine runs it.
    const context = FakeAudioContext.instances[0]
    expect(context.audioWorklet.addModule).toHaveBeenCalledTimes(1)
    expect(FakeAudioWorkletNode.instances).toHaveLength(1)
    expect(capture().processor).toBe('stoa-mono-capture')
    expect(context.sources[0].connect).toHaveBeenCalledWith(capture())
    expect(capture().connect).toHaveBeenCalledWith(context.destination)

    act(() => capture().hear(2.5))
    await userEvent.click(screen.getByRole('button', { name: stopName() }))
    await waitFor(() => expect(field().value).toBe('Hallo. Wie rechne ich den Sinus aus?'))
    const [recording] = transcribe.mock.calls[0] as unknown as [Blob]
    expect(recording).toBeInstanceOf(Blob)
    // A 16 kHz mono 16-bit WAV, as long as what was heard.
    expect(recording.type).toBe('audio/wav')
    const wav = await readWav(recording)
    expect(wav).toMatchObject({ riff: 'RIFF', wave: 'WAVE', format: 1, channels: 1, sampleRate: 16_000, bitsPerSample: 16 })
    expect(wav.seconds).toBeCloseTo(2.5, 2)
    expect(onSubmit).not.toHaveBeenCalled()
    // The microphone let go of, the audio closed.
    expect(trackStopped).toHaveBeenCalled()
    expect(context.close).toHaveBeenCalled()
    expect(capture().port.onmessage).toBeNull()
    expect(voiceBubble()).toBeNull()
    await waitFor(() => expect(field()).toHaveFocus())
  })

  it('says it is turning the recording into text while it waits', async () => {
    let answer: (text: string) => void = () => {}
    const transcribe = vi.fn(() => new Promise<string>((resolve) => (answer = resolve)))
    render(<Harness voice={voiceWith(transcribe)} />)
    await recordAndStop()
    await waitFor(() => expect(voiceBubble()).toHaveAttribute('data-composer-voice', 'transcribing'))
    expect(voiceBubble()).toHaveTextContent(common('composer.voice.transcribing'))
    expect(document.querySelector('[data-composer-voice-status]')).toHaveTextContent(common('composer.voice.transcribing'))
    await act(async () => answer('Fertig'))
    await waitFor(() => expect(field().value).toBe('Fertig'))
  })

  it('stops by itself at the minute and sends exactly a minute, under 2 MiB', async () => {
    const transcribe = vi.fn(async () => 'Eine lange Frage')
    render(<Harness voice={voiceWith(transcribe)} />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    await screen.findByRole('button', { name: stopName() })
    // The child keeps talking past the minute: the samples, not a timer, say when it is up.
    act(() => capture().hear(30))
    expect(transcribe).not.toHaveBeenCalled()
    act(() => capture().hear(31))
    await waitFor(() => expect(field().value).toBe('Eine lange Frage'))
    expect(transcribe).toHaveBeenCalledTimes(1)
    const [recording] = transcribe.mock.calls[0] as unknown as [Blob]
    const wav = await readWav(recording)
    expect(wav.seconds).toBe(60)
    expect(wav.totalBytes).toBe(44 + 60 * 16_000 * 2)
    expect(recording.size).toBeLessThan(MAX_RECORDING_BYTES)
    expect(trackStopped).toHaveBeenCalled()
  })

  it('stops at the minute by the clock too, should the samples be slow', async () => {
    vi.useFakeTimers()
    const transcribe = vi.fn(async () => 'Eine lange Frage')
    render(<Harness voice={voiceWith(transcribe)} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: startName() }))
    })
    act(() => capture().hear(12))
    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    expect(document.querySelector('[data-composer-voice-clock]')).toHaveTextContent('0:30 / 1:00')
    expect(transcribe).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    expect(transcribe).toHaveBeenCalledTimes(1)
    await act(async () => {
      await Promise.resolve()
      vi.advanceTimersByTime(20)
    })
    expect(field().value).toBe('Eine lange Frage')
  })

  it('makes the audio context in the press itself, before the microphone is asked for (Safari, iOS)', async () => {
    let contextsWhenAsked = -1
    let resumedWhenAsked = false
    getUserMedia.mockImplementationOnce(async () => {
      contextsWhenAsked = FakeAudioContext.instances.length
      resumedWhenAsked = (FakeAudioContext.instances[0]?.resume.mock.calls.length ?? 0) > 0
      return { getTracks: () => [{ stop: trackStopped }] } as unknown as MediaStream
    })
    render(<Harness voice={voiceWith(vi.fn(async () => 'x'))} />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    await screen.findByRole('button', { name: stopName() })
    expect(contextsWhenAsked).toBe(1)
    expect(resumedWhenAsked).toBe(true)
  })

  it('writes 16 kHz from a 44.1 kHz microphone too', async () => {
    FakeAudioContext.rate = 44_100
    const transcribe = vi.fn(async () => 'Hallo')
    render(<Harness voice={voiceWith(transcribe)} />)
    await recordAndStop(2)
    await waitFor(() => expect(transcribe).toHaveBeenCalled())
    const wav = await readWav((transcribe.mock.calls[0] as unknown as [Blob])[0])
    expect(wav.sampleRate).toBe(16_000)
    expect(wav.seconds).toBeCloseTo(2, 2)
  })

  it('sends nothing when nothing was heard', async () => {
    const transcribe = vi.fn(async () => 'never')
    render(<Harness voice={voiceWith(transcribe)} initial="Mein Text" />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    await screen.findByRole('button', { name: stopName() })
    await userEvent.click(screen.getByRole('button', { name: stopName() }))
    await waitFor(() => expect(voiceBubble()).toHaveAttribute('data-composer-voice-failure', 'silent'))
    expect(transcribe).not.toHaveBeenCalled()
    expect(field().value).toBe('Mein Text')
  })

  it('lets go of the microphone and the audio when the composer goes away mid-recording', async () => {
    const { unmount } = render(<Harness voice={voiceWith(vi.fn(async () => 'never'))} />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    await screen.findByRole('button', { name: stopName() })
    act(() => capture().hear(1))
    unmount()
    expect(trackStopped).toHaveBeenCalled()
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalled()
    expect(capture().disconnect).toHaveBeenCalled()
  })

  it('lets go of a microphone granted after the composer went away', async () => {
    let grant: (stream: MediaStream) => void = () => {}
    getUserMedia.mockImplementationOnce(() => new Promise<MediaStream>((resolve) => (grant = resolve)))
    const { unmount } = render(<Harness voice={voiceWith(vi.fn(async () => 'never'))} />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    unmount()
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalled()
    await act(async () => grant({ getTracks: () => [{ stop: trackStopped }] } as unknown as MediaStream))
    expect(trackStopped).toHaveBeenCalled()
    expect(FakeAudioWorkletNode.instances).toHaveLength(0)
  })

  it('says the recording broke off when the worklet cannot be loaded', async () => {
    const transcribe = vi.fn(async () => 'never')
    let grant: (stream: MediaStream) => void = () => {}
    getUserMedia.mockImplementationOnce(() => new Promise<MediaStream>((resolve) => (grant = resolve)))
    render(<Harness voice={voiceWith(transcribe)} />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    FakeAudioContext.instances[0].audioWorklet.addModule.mockRejectedValueOnce(new DOMException('no', 'AbortError'))
    await act(async () => grant({ getTracks: () => [{ stop: trackStopped }] } as unknown as MediaStream))
    await waitFor(() => expect(voiceBubble()).toHaveAttribute('data-composer-voice-failure', 'recorder'))
    expect(trackStopped).toHaveBeenCalled()
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalled()
    expect(transcribe).not.toHaveBeenCalled()
  })

  it('puts the recording away with Esc, keeping the field', async () => {
    const transcribe = vi.fn(async () => 'never')
    render(<Harness voice={voiceWith(transcribe)} initial="Mein Text" />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    await screen.findByRole('button', { name: stopName() })
    act(() => capture().hear(1))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(voiceBubble()).toBeNull())
    await act(async () => {
      await Promise.resolve()
    })
    expect(transcribe).not.toHaveBeenCalled()
    expect(trackStopped).toHaveBeenCalled()
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalled()
    expect(field().value).toBe('Mein Text')
  })
})

describe('where the microphone only says how to dictate', () => {
  it('without voice questions: no recording, the dictation help as before', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: dictationName() }))
    expect(document.querySelector('[data-composer-dictation="windows"]')).not.toBeNull()
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(FakeAudioContext.instances).toHaveLength(0)
  })

  it('when the browser refuses the microphone: the dictation help, saying so, and no recorder', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
    const transcribe = vi.fn(async () => 'never')
    render(<Harness voice={voiceWith(transcribe)} initial="Mein Text" />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    const help = await waitFor(() => {
      const shown = document.querySelector('[data-composer-dictation="windows"]')
      expect(shown).not.toBeNull()
      return shown!
    })
    expect(help).toHaveTextContent(common('composer.voice.failed.micBlocked'))
    expect(help).toHaveTextContent(common('composer.dictation.windows'))
    expect(FakeAudioWorkletNode.instances).toHaveLength(0)
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalled()
    expect(transcribe).not.toHaveBeenCalled()
    expect(field().value).toBe('Mein Text')
    // From now on the microphone is the way to dictate.
    expect(screen.getByRole('button', { name: dictationName() })).toHaveAttribute('data-composer-mic', 'dictation')
  })

  it('refused where no dictation can be named (Linux): says so and to type', async () => {
    pretend(LINUX)
    getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
    render(<Harness voice={voiceWith(vi.fn(async () => 'never'))} />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    await waitFor(() => expect(document.querySelector('[data-composer-dictation="none"]')).not.toBeNull())
    expect(document.querySelector('[data-composer-dictation]')).toHaveTextContent(common('composer.voice.typeInstead'))
  })
})

describe('when it does not become text', () => {
  async function failWith(kind: VoiceFailureKind) {
    const transcribe = vi.fn(async () => {
      throw new VoiceFailure(kind)
    })
    render(<Harness voice={voiceWith(transcribe)} initial="Schon getippt" />)
    await recordAndStop()
    await waitFor(() => expect(voiceBubble()).toHaveAttribute('data-composer-voice-failure', kind))
    return transcribe
  }

  for (const [code, kind] of Object.entries(VOICE_FAILURE_CODES)) {
    it(`${code}: says so in the child's words, keeps the field, offers typing`, async () => {
      await failWith(kind)
      expect(voiceBubble()).toHaveTextContent(common(`composer.voice.failed.${kind}`))
      expect(field().value).toBe('Schon getippt')
      expect(screen.getByRole('button', { name: common('composer.voice.typeInsteadAction') })).toBeInTheDocument()
    })
  }

  it('the daily limit is not "try again": typing is the way on until tomorrow', async () => {
    await failWith('dailyLimit')
    expect(document.querySelector('[data-composer-voice-retry]')).toBeNull()
    expect(common('composer.voice.failed.dailyLimit')).not.toBe(common('composer.voice.failed.unavailable'))
  })

  it('unavailable: "try again" sends the same recording, with no new one', async () => {
    let calls = 0
    const transcribe = vi.fn<VoiceInput['transcribe']>(async () => {
      calls += 1
      if (calls === 1) throw new VoiceFailure('unavailable')
      return 'Zweiter Versuch'
    })
    render(<Harness voice={voiceWith(transcribe)} />)
    await recordAndStop()
    const retry = await screen.findByRole('button', { name: common('composer.voice.sendAgain') })
    expect(retry).toHaveAttribute('data-composer-voice-retry', 'send')
    await userEvent.click(retry)
    await waitFor(() => expect(field().value).toBe('Zweiter Versuch'))
    expect(transcribe).toHaveBeenCalledTimes(2)
    expect(transcribe.mock.calls[1][0]).toBe(transcribe.mock.calls[0][0])
    expect(FakeAudioContext.instances).toHaveLength(1)
  })

  it(`sends one recording at most ${MAX_SENDS_PER_RECORDING} times, then offers only typing (stoa-backend#542)`, async () => {
    const transcribe = vi.fn<VoiceInput['transcribe']>(async () => {
      throw new VoiceFailure('unavailable')
    })
    render(<Harness voice={voiceWith(transcribe)} initial="Schon getippt" />)
    await recordAndStop()
    for (let send = 2; send <= MAX_SENDS_PER_RECORDING; send += 1) {
      await userEvent.click(await screen.findByRole('button', { name: common('composer.voice.sendAgain') }))
      await waitFor(() => expect(transcribe).toHaveBeenCalledTimes(send))
    }
    await waitFor(() => expect(voiceBubble()).toHaveAttribute('data-composer-voice-failure', 'gaveUp'))
    expect(voiceBubble()).toHaveTextContent(common('composer.voice.failed.gaveUp'))
    expect(document.querySelector('[data-composer-voice-retry]')).toBeNull()
    expect(screen.getByRole('button', { name: common('composer.voice.typeInsteadAction') })).toBeInTheDocument()
    expect(transcribe).toHaveBeenCalledTimes(MAX_SENDS_PER_RECORDING)
    expect(field().value).toBe('Schon getippt')
  })

  it('a new recording starts its own count', async () => {
    let calls = 0
    const transcribe = vi.fn<VoiceInput['transcribe']>(async () => {
      calls += 1
      if (calls === 1) throw new VoiceFailure('unavailable')
      if (calls === 2) throw new VoiceFailure('silent')
      if (calls === 3) throw new VoiceFailure('unavailable')
      return 'Geht doch'
    })
    render(<Harness voice={voiceWith(transcribe)} />)
    await recordAndStop()
    await userEvent.click(await screen.findByRole('button', { name: common('composer.voice.sendAgain') }))
    await userEvent.click(await screen.findByRole('button', { name: common('composer.voice.recordAgain') }))
    await screen.findByRole('button', { name: stopName() })
    act(() => capture().hear(1))
    await userEvent.click(screen.getByRole('button', { name: stopName() }))
    // The new recording may be tried again once, like the first.
    await userEvent.click(await screen.findByRole('button', { name: common('composer.voice.sendAgain') }))
    await waitFor(() => expect(field().value).toBe('Geht doch'))
    expect(transcribe).toHaveBeenCalledTimes(4)
  })

  it('offline is the connection, not the server: "try again" stays as long as it takes', async () => {
    let calls = 0
    const transcribe = vi.fn<VoiceInput['transcribe']>(async () => {
      calls += 1
      if (calls <= 3) throw new VoiceFailure('offline')
      return 'Wieder online'
    })
    render(<Harness voice={voiceWith(transcribe)} />)
    await recordAndStop()
    for (let send = 0; send < 3; send += 1) {
      await userEvent.click(await screen.findByRole('button', { name: common('composer.voice.sendAgain') }))
    }
    await waitFor(() => expect(field().value).toBe('Wieder online'))
  })

  it('refused by the model (502): says to type, and offers no "try again" (stoa-backend#542)', async () => {
    await failWith('refused')
    expect(voiceBubble()).toHaveTextContent(common('composer.voice.failed.refused'))
    expect(document.querySelector('[data-composer-voice-retry]')).toBeNull()
    expect(screen.getByRole('button', { name: common('composer.voice.typeInsteadAction') })).toBeInTheDocument()
    expect(voiceFailureOf(new ApiError('refused', { status: 502, code: 'voice_transcription_refused' }))).toBe('refused')
  })

  it('silent: "record again" starts a new recording', async () => {
    await failWith('silent')
    await userEvent.click(screen.getByRole('button', { name: common('composer.voice.recordAgain') }))
    await screen.findByRole('button', { name: stopName() })
    expect(FakeAudioContext.instances).toHaveLength(2)
  })

  it('not allowed (a parent switched it off): tells the host, and offers dictation', async () => {
    const onNotAllowed = vi.fn()
    const transcribe = vi.fn(async () => {
      throw new VoiceFailure('notAllowed')
    })
    render(<Harness voice={voiceWith(transcribe, { onNotAllowed })} />)
    await recordAndStop()
    await waitFor(() => expect(onNotAllowed).toHaveBeenCalled())
    expect(voiceBubble()).toHaveTextContent(common('composer.dictation.windows'))
  })

  it('"type instead" puts it away and gives the field the keyboard', async () => {
    await failWith('unavailable')
    await userEvent.click(screen.getByRole('button', { name: common('composer.voice.typeInsteadAction') }))
    expect(voiceBubble()).toBeNull()
    expect(field()).toHaveFocus()
    expect(field().value).toBe('Schon getippt')
  })
})

describe('the transcription request', () => {
  it('sends the recording as the body, declared with its own type', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: { text: 'Hallo' } })
    const recording = new Blob(['bytes'], { type: 'audio/wav' })
    await expect(transcribeVoiceQuestion(recording)).resolves.toBe('Hallo')
    const [path, body, config] = post.mock.calls[0]
    expect(path).toBe('/students/me/voice-questions/transcriptions')
    expect(body).toBe(recording)
    expect(config?.headers).toMatchObject({ 'Content-Type': 'audio/wav' })
  })

  it('reads each refusal by its code', async () => {
    for (const [code, kind] of Object.entries(VOICE_FAILURE_CODES)) {
      expect(voiceFailureOf(new ApiError('no', { status: 400, code }))).toBe(kind)
    }
    expect(voiceFailureOf(new ApiError('down', { status: 503 }))).toBe('unavailable')
    expect(voiceFailureOf(new ApiError('offline', { transportCode: 'ERR_NETWORK' }))).toBe('offline')
    expect(voiceFailureOf(new ApiError('odd', { status: 500, code: 'internal_error' }))).toBe('failed')
    vi.spyOn(httpClient, 'post').mockRejectedValue(new ApiError('limit', { status: 429, code: 'voice_transcription_daily_limit' }))
    await expect(transcribeVoiceQuestion(new Blob(['x'], { type: 'audio/wav' }))).rejects.toMatchObject({ kind: 'dailyLimit' })
  })
})

/* ---- the student's switch, read from the backend ------------------------ */

function StudentAsk() {
  const voice = useVoiceQuestionInput()
  return <Harness voice={voice} />
}

function renderStudentAsk(allowed: boolean | 'fails') {
  useAuthStore.setState({ user: { id: 's1', role: 'student' }, isAuthenticated: true } as never)
  const get = vi.spyOn(httpClient, 'get').mockImplementation(async (url: string) => {
    if (url === '/students/me/voice-questions') {
      if (allowed === 'fails') throw new ApiError('down', { status: 503 })
      return { data: { allowed } }
    }
    throw new Error(`unexpected ${url}`)
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <StudentAsk />
    </QueryClientProvider>,
  )
  return get
}

describe("the student's switch (GET /students/me/voice-questions)", () => {
  it('off (no parent allowed it, or no linked parent): the microphone only says how to dictate', async () => {
    const get = renderStudentAsk(false)
    await waitFor(() => expect(get).toHaveBeenCalledWith('/students/me/voice-questions'))
    await userEvent.click(screen.getByRole('button', { name: dictationName() }))
    expect(document.querySelector('[data-composer-dictation="windows"]')).not.toBeNull()
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('on: the microphone records', async () => {
    renderStudentAsk(true)
    const mic = await screen.findByRole('button', { name: startName() })
    expect(mic).toHaveAttribute('data-composer-mic', 'voice')
  })

  it('unknown (the read failed): the microphone only says how to dictate', async () => {
    const get = renderStudentAsk('fails')
    await waitFor(() => expect(get).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: dictationName() })).toHaveAttribute('data-composer-mic', 'dictation')
  })

  it('on, in a browser without Web Audio worklets: not even asked, the dictation help', async () => {
    installBrowser({ webAudio: false })
    const get = renderStudentAsk(true)
    expect(screen.getByRole('button', { name: dictationName() })).toHaveAttribute('data-composer-mic', 'dictation')
    expect(get).not.toHaveBeenCalled()
  })
})

/* ---- the parent's switch -------------------------------------------------- */

describe("the parent's switch for one child", () => {
  function renderCard(initial: { allowed: boolean; changedAt?: string | null; changedByMe?: boolean | null }) {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { studentId: 'child-1', ...initial } })
    const put = vi.spyOn(httpClient, 'put').mockImplementation(async (_url: string, body: unknown) => ({
      data: { studentId: 'child-1', allowed: (body as { allowed: boolean }).allowed, changedAt: '2026-11-17T10:00:00Z', changedByMe: true },
    }))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <ChildVoiceQuestionsCard childId="child-1" childName="Lena" />
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>,
    )
    return { get, put }
  }

  it('reads the switch, off by default, and says what happens to a recording', async () => {
    const { get } = renderCard({ allowed: false, changedAt: null, changedByMe: null })
    const toggle = await screen.findByRole('switch', { name: i18n.t('voiceQuestions.label', { ns: 'parent' }) })
    expect(get).toHaveBeenCalledWith('/parents/me/children/child-1/voice-questions')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    const card = document.querySelector('[data-child-voice-questions]')!
    expect(card).toHaveTextContent('Lena')
    expect(card).toHaveTextContent(i18n.t('voiceQuestions.processing', { ns: 'parent' }))
    expect(document.querySelector('[data-child-voice-questions-changed]')).toBeNull()
  })

  it('turns it on with PUT {allowed: true}, then shows what the server holds', async () => {
    const { put } = renderCard({ allowed: false })
    const toggle = await screen.findByRole('switch', { name: i18n.t('voiceQuestions.label', { ns: 'parent' }) })
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
    expect(put).toHaveBeenCalledWith('/parents/me/children/child-1/voice-questions', { allowed: true })
    expect(document.querySelector('[data-child-voice-questions-changed]')).toHaveTextContent(/17/)
  })

  it('turns it off again', async () => {
    const { put } = renderCard({ allowed: true, changedAt: '2026-11-10T08:00:00Z', changedByMe: false })
    const toggle = await screen.findByRole('switch', { name: i18n.t('voiceQuestions.label', { ns: 'parent' }) })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(document.querySelector('[data-child-voice-questions-changed]')).toHaveTextContent(
      i18n.t('voiceQuestions.changedByOther', { ns: 'parent', date: '' }).replace(/\.$/, '').trim(),
    )
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))
    expect(put).toHaveBeenCalledWith('/parents/me/children/child-1/voice-questions', { allowed: false })
  })

  it('a failed change leaves the switch where it was and says so', async () => {
    renderCard({ allowed: false })
    vi.spyOn(httpClient, 'put').mockRejectedValue(new ApiError('down', { status: 503 }))
    const toggle = await screen.findByRole('switch', { name: i18n.t('voiceQuestions.label', { ns: 'parent' }) })
    await userEvent.click(toggle)
    await screen.findByText(i18n.t('voiceQuestions.saveFailed', { ns: 'parent' }))
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })
})

/* ---- the words, in every language ------------------------------------------ */

describe('the voice question copy in every language', () => {
  const KINDS: VoiceFailureKind[] = [
    'notAllowed', 'unsupported', 'tooLarge', 'tooLong', 'unreadable', 'silent', 'dailyLimit',
    'unavailable', 'refused', 'offline', 'failed', 'gaveUp', 'micBlocked', 'micMissing', 'recorder',
  ]
  const KEYS = ['start', 'stop', 'listening', 'stopHint', 'privacy', 'transcribing', 'sendAgain', 'recordAgain', 'typeInsteadAction', 'typeInstead']

  it('has every sentence in de, fr and it, each its own words', () => {
    const en = i18n.getFixedT('en', 'common')
    for (const locale of ['de', 'fr', 'it'] as const) {
      const t = i18n.getFixedT(locale, 'common')
      for (const key of [...KEYS.map((k) => `composer.voice.${k}`), ...KINDS.map((k) => `composer.voice.failed.${k}`)]) {
        expect(t(key), `${locale} ${key}`).not.toBe(key)
        expect(t(key), `${locale} ${key}`).not.toBe(en(key))
      }
      const parent = i18n.getFixedT(locale, 'parent')
      expect(parent('voiceQuestions.label')).not.toBe('voiceQuestions.label')
      expect(parent('voiceQuestions.processing')).not.toBe(i18n.getFixedT('en', 'parent')('voiceQuestions.processing'))
    }
  })

  it('writes ss, not ß, in German', () => {
    const de = JSON.stringify(i18n.getResourceBundle('de', 'common').composer.voice) + JSON.stringify(i18n.getResourceBundle('de', 'parent').voiceQuestions)
    expect(de).not.toContain('ß')
  })
})

/* ---- the privacy notice ------------------------------------------------------ */

describe('the privacy notice on voice questions (ADR-010)', () => {
  // What it promises, sentence by sentence; the parent's card says the same.
  const PROMISES = {
    de: [
      'Ohne diese Erlaubnis ist die Funktion ausgeschaltet.',
      'Die Aufnahme geht an STOA und wird in Irland, in einem Rechenzentrum von AWS (Region eu-west-1), vom Sprachmodell Voxtral in Text umgewandelt.',
      'Die Aufnahme wird nur im Arbeitsspeicher verarbeitet: Sie wird nicht gespeichert, nicht protokolliert und nicht zum Trainieren von KI-Modellen verwendet.',
    ],
    en: [
      'Without this permission the feature is off.',
      'The recording goes to STOA and is turned into text in Ireland, in an AWS data centre (region eu-west-1), by the speech model Voxtral.',
      'The recording is processed in memory only: it is not stored, not logged and not used to train AI models.',
    ],
    fr: [
      'Sans cette autorisation, la fonction est désactivée.',
      "L'enregistrement est envoyé à STOA et transformé en texte en Irlande, dans un centre de données d'AWS (région eu-west-1), par le modèle vocal Voxtral.",
      "L'enregistrement est traité uniquement en mémoire : il n'est ni conservé, ni journalisé, ni utilisé pour entraîner des modèles d'IA.",
    ],
    it: [
      'Senza questo consenso la funzione è disattivata.',
      'La registrazione viene inviata a STOA e trasformata in testo in Irlanda, in un centro dati di AWS (regione eu-west-1), dal modello vocale Voxtral.',
      'La registrazione viene elaborata solo in memoria: non viene conservata, non viene registrata nei log e non viene usata per addestrare modelli di IA.',
    ],
  } as const

  for (const locale of LOCALES) {
    it(`says where and how a recording is turned into text, in ${locale}`, async () => {
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
      expect(text).toContain(i18n.t('privacy.sections.voiceQuestions.title', { ns: 'legal' }))
      for (const promise of PROMISES[locale]) expect(text).toContain(promise)
      // The parent reads the same promise beside the switch (in Sie/vous/Lei form, so only the place and keeping).
      const parent = i18n.t('voiceQuestions.processing', { ns: 'parent' })
      expect(parent).toContain('eu-west-1')
      expect(parent).toContain('Voxtral')
      expect(parent).toContain(PROMISES[locale][2])
    })
  }
})
