/**
 * #726: a voice question is recorded as a 16 kHz mono 16-bit WAV, because
 * the speech model (Voxtral on Bedrock) takes only mp3 and wav
 * (stoa-backend#542). The backend reads the duration from the header, so the
 * header has to be the canonical 44 bytes and say what the data holds.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MAX_RECORDING_BYTES, MAX_RECORDING_SECONDS } from '@/lib/voiceRecording'
import { Downsampler, encodeWav, WAV_HEADER_BYTES, WAV_SAMPLE_RATE } from '@/lib/wav'
import { readWav } from './fakeWebAudio'

const tone = (rate: number, seconds: number, amplitude = 0.5) =>
  Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => amplitude * Math.sin((i / rate) * 2 * Math.PI * 220))

describe('encodeWav', () => {
  it('writes the canonical RIFF/WAVE header for 16 kHz mono 16-bit PCM', async () => {
    const samples = Int16Array.from([0, 1, -1, 32767, -32768, 1234])
    const blob = encodeWav(samples)
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(WAV_HEADER_BYTES + samples.length * 2)
    const wav = await readWav(blob)
    expect(wav).toMatchObject({
      riff: 'RIFF',
      riffSize: 36 + samples.length * 2,
      wave: 'WAVE',
      fmt: 'fmt ',
      fmtSize: 16,
      format: 1,
      channels: 1,
      sampleRate: 16_000,
      byteRate: 32_000,
      blockAlign: 2,
      bitsPerSample: 16,
      data: 'data',
      dataBytes: samples.length * 2,
    })
    // Little-endian, sample by sample.
    expect(Array.from({ length: samples.length }, (_, i) => wav.sample(i))).toEqual(Array.from(samples))
  })

  it('says its duration in the header: data bytes over the byte rate', async () => {
    const wav = await readWav(encodeWav(new Int16Array(WAV_SAMPLE_RATE * 3)))
    expect(wav.seconds).toBe(3)
  })

  it('an empty recording is still a valid WAV, of no length', async () => {
    const wav = await readWav(encodeWav(new Int16Array(0)))
    expect(wav).toMatchObject({ riff: 'RIFF', dataBytes: 0, seconds: 0, totalBytes: WAV_HEADER_BYTES })
  })

  it('a full minute fits under the 2 MiB the backend takes', () => {
    const minute = encodeWav(new Int16Array(MAX_RECORDING_SECONDS * WAV_SAMPLE_RATE))
    expect(minute.size).toBe(1_920_044)
    expect(minute.size).toBeLessThan(MAX_RECORDING_BYTES)
  })
})

describe('Downsampler', () => {
  for (const rate of [48_000, 44_100, 96_000, 16_000]) {
    it(`brings ${rate / 1000} kHz down to 16 kHz, keeping the length`, () => {
      const pcm = new Downsampler(rate, 10 * WAV_SAMPLE_RATE)
      const input = tone(rate, 2)
      // In the worklet's blocks, which need not divide the ratio.
      for (let at = 0; at < input.length; at += 2048) pcm.push(input.subarray(at, at + 2048))
      expect(pcm.length).toBe(2 * WAV_SAMPLE_RATE)
      expect(pcm.full).toBe(false)
    })
  }

  it('keeps the shape of the signal (a 220 Hz tone stays a 220 Hz tone)', () => {
    const pcm = new Downsampler(48_000, WAV_SAMPLE_RATE)
    pcm.push(tone(48_000, 1, 0.5))
    const out = pcm.samples()
    // Crossings of zero going up: 220 a second.
    let rising = 0
    for (let i = 1; i < out.length; i += 1) if (out[i - 1] < 0 && out[i] >= 0) rising += 1
    expect(rising).toBeGreaterThanOrEqual(219)
    expect(rising).toBeLessThanOrEqual(221)
    const peak = Math.max(...Array.from(out, Math.abs))
    expect(peak).toBeGreaterThan(0.45 * 32767)
    expect(peak).toBeLessThanOrEqual(0.5 * 32767 + 1)
  })

  it('clips what is louder than full scale instead of wrapping round', () => {
    const pcm = new Downsampler(16_000, 4)
    pcm.push(Float32Array.from([2, -2, 1, Number.NaN]))
    expect(Array.from(pcm.samples())).toEqual([32767, -32768, 32767, 0])
  })

  it('stops at its limit and says it is full', () => {
    const pcm = new Downsampler(48_000, 1_000)
    expect(pcm.push(new Float32Array(2_000))).toBe(false)
    expect(pcm.push(new Float32Array(10_000))).toBe(true)
    expect(pcm.length).toBe(1_000)
    expect(pcm.push(new Float32Array(10_000))).toBe(true)
    expect(pcm.length).toBe(1_000)
  })

  it('holds each sample of a slower microphone (8 kHz) for the gap', () => {
    const pcm = new Downsampler(8_000, 100)
    pcm.push(Float32Array.from([0.5, -0.5]))
    expect(Array.from(pcm.samples())).toEqual([16384, 16384, -16384, -16384])
  })

  it('refuses a rate of nothing', () => {
    expect(() => new Downsampler(0, 10)).toThrow(RangeError)
  })
})

describe('the capture worklet', () => {
  type Processor = { port: { postMessage: ReturnType<typeof vi.fn> }; process: (inputs: Float32Array[][]) => boolean }
  const registered: Array<[string, new () => Processor]> = []

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'AudioWorkletProcessor')
    Reflect.deleteProperty(globalThis, 'registerProcessor')
    registered.length = 0
    vi.resetModules()
  })

  async function load() {
    Object.assign(globalThis, {
      AudioWorkletProcessor: class {
        port = { postMessage: vi.fn() }
      },
      registerProcessor: (name: string, processor: new () => Processor) => registered.push([name, processor]),
    })
    await import('@/lib/monoCapture.worklet')
    expect(registered.map(([name]) => name)).toEqual(['stoa-mono-capture'])
    return new registered[0][1]()
  }

  it('mixes the channels to one and sends them in batches of 2048 frames', async () => {
    const processor = await load()
    const left = new Float32Array(128).fill(0.5)
    const right = new Float32Array(128).fill(-0.25)
    for (let block = 0; block < 15; block += 1) expect(processor.process([[left, right]])).toBe(true)
    expect(processor.port.postMessage).not.toHaveBeenCalled()
    processor.process([[left, right]])
    expect(processor.port.postMessage).toHaveBeenCalledTimes(1)
    const [batch, transfer] = processor.port.postMessage.mock.calls[0] as [Float32Array, ArrayBuffer[]]
    expect(batch).toHaveLength(2048)
    expect(batch.every((value) => value === 0.125)).toBe(true)
    // Handed over, not copied.
    expect(transfer).toEqual([batch.buffer])
  })

  it('keeps running with no input yet (the microphone not connected)', async () => {
    const processor = await load()
    expect(processor.process([])).toBe(true)
    expect(processor.process([[]])).toBe(true)
    expect(processor.port.postMessage).not.toHaveBeenCalled()
  })
})
