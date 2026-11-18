/**
 * #697: a voice question in the Ask field. The microphone records (press,
 * then press again), the recording goes to the backend as the request body,
 * and what was said lands in the field at the cursor -- never sent. Only for
 * a student a linked parent allowed (stoa-backend#469); otherwise, and when
 * the browser refuses the microphone or cannot record, the microphone says
 * how to dictate, as before (#515).
 *
 * The browser's recorder is a stand-in here (jsdom has none): these tests
 * show what the composer does with it, not that a real browser records in a
 * format the model takes. That is for the device checklist in the PR.
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
  insertAtCursor,
  MAX_RECORDING_BYTES,
  pickRecordingType,
  recordingTypeHere,
  VOICE_FAILURE_CODES,
  VoiceFailure,
  type VoiceFailureKind,
} from '@/lib/voiceRecording'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { ApiError, httpClient } from '@/services/api/httpClient'
import { transcribeVoiceQuestion, voiceFailureOf } from '@/services/student/voiceQuestionsApi'
import { useAuthStore } from '@/store/authStore'

const LOCALES = ['de', 'en', 'fr', 'it'] as const
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const LINUX = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

/* ---- the browser's recorder and microphone, stand-ins ---------------- */

class FakeRecorder {
  static instances: FakeRecorder[] = []
  static supported = (type: string) => type.startsWith('audio/webm')
  static isTypeSupported = (type: string) => FakeRecorder.supported(type)
  state: 'inactive' | 'recording' = 'inactive'
  mimeType: string
  options: MediaRecorderOptions | undefined
  /** What the recording holds when it stops. */
  bytes: BlobPart[] = ['opus-bytes']
  private listeners: Record<string, Array<(event: unknown) => void>> = {}
  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.options = options
    this.mimeType = options?.mimeType ?? ''
    FakeRecorder.instances.push(this)
  }
  addEventListener(type: string, listener: (event: unknown) => void) {
    ;(this.listeners[type] ??= []).push(listener)
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    if (this.state === 'inactive') return
    this.state = 'inactive'
    // As a browser does: the data, then `stop`, after the call returns.
    void Promise.resolve().then(() => {
      this.emit('dataavailable', { data: new Blob(this.bytes, { type: this.mimeType }) })
      this.emit('stop', {})
    })
  }
  private emit(type: string, event: unknown) {
    for (const listener of this.listeners[type] ?? []) listener(event)
  }
}

const trackStopped = vi.fn()
const getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop: trackStopped }] }) as unknown as MediaStream)

function pretend(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true })
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 0, configurable: true })
}

function installBrowser({ recorder = true }: { recorder?: boolean } = {}) {
  Object.defineProperty(window.navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
  if (recorder) Object.defineProperty(window, 'MediaRecorder', { value: FakeRecorder, configurable: true, writable: true })
  else Reflect.deleteProperty(window, 'MediaRecorder')
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
  FakeRecorder.instances = []
  FakeRecorder.supported = (type: string) => type.startsWith('audio/webm')
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
  Reflect.deleteProperty(window, 'MediaRecorder')
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
  return { recordingType: 'audio/webm;codecs=opus', transcribe, ...extra }
}

const field = () => screen.getByRole('textbox', { name: 'Ask' }) as HTMLTextAreaElement
const voiceBubble = () => document.querySelector<HTMLElement>('[data-composer-voice]')

async function recordAndStop() {
  await userEvent.click(screen.getByRole('button', { name: startName() }))
  await screen.findByRole('button', { name: stopName() })
  await userEvent.click(screen.getByRole('button', { name: stopName() }))
}

describe('the recorder type (#697)', () => {
  it('asks for WebM first, then Ogg, then MP4 with AAC, and is null with none of them', () => {
    expect(pickRecordingType(() => true)).toBe('audio/webm;codecs=opus')
    expect(pickRecordingType((type) => type.startsWith('audio/ogg'))).toBe('audio/ogg;codecs=opus')
    // Safari: MP4 only.
    expect(pickRecordingType((type) => type.startsWith('audio/mp4'))).toBe('audio/mp4;codecs=mp4a.40.2')
    expect(pickRecordingType((type) => type === 'audio/mp4')).toBe('audio/mp4')
    expect(pickRecordingType((type) => type === 'audio/wav')).toBeNull()
    expect(
      pickRecordingType(() => {
        throw new Error('old engine')
      }),
    ).toBeNull()
  })

  it('is null without MediaRecorder or without getUserMedia', () => {
    expect(recordingTypeHere({ navigator: { mediaDevices: { getUserMedia: () => {} } } })).toBeNull()
    expect(recordingTypeHere({ MediaRecorder: { isTypeSupported: () => true }, navigator: {} })).toBeNull()
    expect(
      recordingTypeHere({ MediaRecorder: { isTypeSupported: () => true }, navigator: { mediaDevices: { getUserMedia: () => {} } } }),
    ).toBe('audio/webm;codecs=opus')
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
    expect(FakeRecorder.instances).toHaveLength(1)
    expect(FakeRecorder.instances[0].options).toMatchObject({ mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 32_000 })

    await userEvent.click(screen.getByRole('button', { name: stopName() }))
    await waitFor(() => expect(field().value).toBe('Hallo. Wie rechne ich den Sinus aus?'))
    const [recording] = transcribe.mock.calls[0] as unknown as [Blob]
    expect(recording).toBeInstanceOf(Blob)
    expect(recording.type).toBe('audio/webm;codecs=opus')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(trackStopped).toHaveBeenCalled()
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

  it('stops by itself at the minute and sends what it has', async () => {
    vi.useFakeTimers()
    const transcribe = vi.fn(async () => 'Eine lange Frage')
    render(<Harness voice={voiceWith(transcribe)} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: startName() }))
    })
    expect(FakeRecorder.instances[0]?.state).toBe('recording')
    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    expect(document.querySelector('[data-composer-voice-clock]')).toHaveTextContent('0:30 / 1:00')
    expect(FakeRecorder.instances[0].state).toBe('recording')
    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    expect(FakeRecorder.instances[0].state).toBe('inactive')
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(transcribe).toHaveBeenCalledTimes(1)
    await act(async () => {
      await Promise.resolve()
      vi.advanceTimersByTime(20)
    })
    expect(field().value).toBe('Eine lange Frage')
  })

  it('does not send a recording over 2 MiB', async () => {
    const transcribe = vi.fn(async () => 'never')
    render(<Harness voice={voiceWith(transcribe)} initial="Mein Text" />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    await screen.findByRole('button', { name: stopName() })
    FakeRecorder.instances[0].bytes = [new Uint8Array(MAX_RECORDING_BYTES + 1)]
    await userEvent.click(screen.getByRole('button', { name: stopName() }))
    await waitFor(() => expect(voiceBubble()).toHaveAttribute('data-composer-voice-failure', 'tooLarge'))
    expect(transcribe).not.toHaveBeenCalled()
    expect(field().value).toBe('Mein Text')
  })

  it('puts the recording away with Esc, keeping the field', async () => {
    const transcribe = vi.fn(async () => 'never')
    render(<Harness voice={voiceWith(transcribe)} initial="Mein Text" />)
    await userEvent.click(screen.getByRole('button', { name: startName() }))
    await screen.findByRole('button', { name: stopName() })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(voiceBubble()).toBeNull())
    await act(async () => {
      await Promise.resolve()
    })
    expect(transcribe).not.toHaveBeenCalled()
    expect(trackStopped).toHaveBeenCalled()
    expect(field().value).toBe('Mein Text')
  })
})

describe('where the microphone only says how to dictate', () => {
  it('without voice questions: no recording, the dictation help as before', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: dictationName() }))
    expect(document.querySelector('[data-composer-dictation="windows"]')).not.toBeNull()
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(FakeRecorder.instances).toHaveLength(0)
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
    expect(FakeRecorder.instances).toHaveLength(0)
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
    expect(FakeRecorder.instances).toHaveLength(1)
  })

  it('silent: "record again" starts a new recording', async () => {
    await failWith('silent')
    await userEvent.click(screen.getByRole('button', { name: common('composer.voice.recordAgain') }))
    await screen.findByRole('button', { name: stopName() })
    expect(FakeRecorder.instances).toHaveLength(2)
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
    const recording = new Blob(['bytes'], { type: 'audio/mp4' })
    await expect(transcribeVoiceQuestion(recording)).resolves.toBe('Hallo')
    const [path, body, config] = post.mock.calls[0]
    expect(path).toBe('/students/me/voice-questions/transcriptions')
    expect(body).toBe(recording)
    expect(config?.headers).toMatchObject({ 'Content-Type': 'audio/mp4' })
  })

  it('reads each refusal by its code', async () => {
    for (const [code, kind] of Object.entries(VOICE_FAILURE_CODES)) {
      expect(voiceFailureOf(new ApiError('no', { status: 400, code }))).toBe(kind)
    }
    expect(voiceFailureOf(new ApiError('down', { status: 503 }))).toBe('unavailable')
    expect(voiceFailureOf(new ApiError('offline', { transportCode: 'ERR_NETWORK' }))).toBe('offline')
    expect(voiceFailureOf(new ApiError('odd', { status: 500, code: 'internal_error' }))).toBe('failed')
    vi.spyOn(httpClient, 'post').mockRejectedValue(new ApiError('limit', { status: 429, code: 'voice_transcription_daily_limit' }))
    await expect(transcribeVoiceQuestion(new Blob(['x'], { type: 'audio/webm' }))).rejects.toMatchObject({ kind: 'dailyLimit' })
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

  it('on, in a browser with no MediaRecorder: not even asked, the dictation help', async () => {
    installBrowser({ recorder: false })
    const get = renderStudentAsk(true)
    expect(screen.getByRole('button', { name: dictationName() })).toHaveAttribute('data-composer-mic', 'dictation')
    expect(get).not.toHaveBeenCalled()
  })

  it('on, in a browser that records none of the three formats: the dictation help', async () => {
    FakeRecorder.supported = (type) => type === 'audio/wav'
    renderStudentAsk(true)
    expect(screen.getByRole('button', { name: dictationName() })).toHaveAttribute('data-composer-mic', 'dictation')
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
    'unavailable', 'offline', 'failed', 'micBlocked', 'micMissing', 'recorder',
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
