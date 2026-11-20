import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/**
 * A voice question (#697) recorded as the speech model takes it (#726): the
 * built site, under production's content security policy, loads its audio
 * worklet from its own origin, hears Chromium's stand-in microphone (a beep),
 * and sends a 16 kHz mono 16-bit WAV, declared `audio/wav`. The model on
 * Bedrock takes only mp3 and wav (stoa-backend#542), so the media type is
 * checked against the backend's OpenAPI document like every other call: until
 * the backend names `audio/wav` there, this test fails, as it should.
 *
 * One stand-in: Playwright cannot answer a worklet's module request (Chromium
 * fetches it past the page's routes, so it would go to the network and fail).
 * `addModule` therefore fetches the module through the routes -- the built
 * site's own file, which must exist and be JavaScript -- and loads that from
 * a blob, which production's policy (`script-src 'self'`) rightly forbids; so
 * this file runs with the policy off. That the policy lets the real worklet
 * load is checked in Chromium and WebKit by hand (PR #726's notes).
 */
test.use({
  permissions: ['microphone'],
  bypassCSP: true,
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    type AddModule = (this: unknown, url: string | URL, options?: unknown) => Promise<void>
    const page = globalThis as unknown as { AudioWorklet: { prototype: { addModule: AddModule } }; __worklet: unknown }
    const load = page.AudioWorklet.prototype.addModule
    page.AudioWorklet.prototype.addModule = async function (url, options) {
      const response = await fetch(url)
      const type = response.headers.get('content-type') ?? ''
      page.__worklet = { url: response.url, status: response.status, type }
      if (!response.ok) throw new DOMException(`worklet ${response.status}`, 'AbortError')
      const source = URL.createObjectURL(new Blob([await response.text()], { type: 'text/javascript' }))
      return load.call(this, source, options)
    }
  })
})

type Wav = { riff: string; wave: string; format: number; channels: number; sampleRate: number; bits: number; seconds: number; peak: number }

function readWav(bytes: Buffer): Wav {
  const tag = (at: number) => bytes.toString('latin1', at, at + 4)
  const byteRate = bytes.readUInt32LE(28)
  const dataBytes = bytes.readUInt32LE(40)
  let peak = 0
  for (let at = 44; at + 1 < bytes.length; at += 2) peak = Math.max(peak, Math.abs(bytes.readInt16LE(at)))
  return {
    riff: tag(0),
    wave: tag(8),
    format: bytes.readUInt16LE(20),
    channels: bytes.readUInt16LE(22),
    sampleRate: bytes.readUInt32LE(24),
    bits: bytes.readUInt16LE(34),
    seconds: dataBytes / byteRate,
    peak,
  }
}

test('records the microphone as a 16 kHz mono WAV and puts what was said in the field (#726)', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.voiceQuestions = { allowed: true }
  world.install()
  let sent: { type: string; bytes: Buffer } | null = null
  backend.on('POST', '/students/me/voice-questions/transcriptions', ({ headers, bytes }) => {
    sent = { type: headers['content-type'] ?? '', bytes: bytes ?? Buffer.alloc(0) }
    return { status: 200, body: { text: 'How do I work out the sine of 30 degrees?' } }
  })
  await signInAsStudent(page)

  const field = page.getByRole('textbox', { name: 'Your question' })
  await expect(field).toBeVisible()
  await page.getByRole('button', { name: 'Ask by voice' }).click()
  const stop = page.getByRole('button', { name: 'Stop recording' })
  await expect(stop).toBeVisible()
  await expect(page.locator('[data-composer-voice-clock]')).toHaveText(/^0:02 \/ 1:00$/, { timeout: 10_000 })
  await stop.click()

  await expect(field).toHaveValue('How do I work out the sine of 30 degrees?')
  // The worklet is the site's own hashed file, served as JavaScript.
  const worklet = await page.evaluate(() => (globalThis as unknown as { __worklet: { url: string; status: number; type: string } }).__worklet)
  expect(worklet.url).toMatch(/^https:\/\/app\.stoa-e2e\.test\/assets\/monoCapture\.worklet-[\w-]+\.js$/)
  expect(worklet.status).toBe(200)
  expect(worklet.type).toContain('javascript')
  expect(sent).not.toBeNull()
  const { type, bytes } = sent!
  expect(type).toBe('audio/wav')
  const wav = readWav(bytes)
  expect(wav).toMatchObject({ riff: 'RIFF', wave: 'WAVE', format: 1, channels: 1, sampleRate: 16_000, bits: 16 })
  expect(wav.seconds).toBeGreaterThan(1.5)
  expect(wav.seconds).toBeLessThan(5)
  // Chromium's stand-in microphone beeps: something was heard, not silence.
  expect(wav.peak).toBeGreaterThan(1_000)
  // Nothing sent with the question itself: the text waits in the field.
  expect(backend.callsTo('POST', '/students/me/voice-questions/transcriptions')).toHaveLength(1)
})
