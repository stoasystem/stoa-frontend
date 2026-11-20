/**
 * Web Audio as a voice question records with it (#726), for jsdom, which has
 * none: an AudioContext that says what was done to it, and the capture
 * worklet's node, whose `hear` hands the page samples as the real worklet
 * would (blocks of 2048, at the context's rate).
 *
 * What a real browser does with the microphone is for the device checks in
 * the PR; these show what the page does with the samples it is given.
 */
import { vi } from 'vitest'

export class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  /** The rate the next context runs at: 48 kHz as most devices, 44.1 kHz as some Macs. */
  static rate = 48_000
  readonly sampleRate = FakeAudioContext.rate
  state: AudioContextState = 'suspended'
  readonly destination = { fake: 'speakers' }
  readonly audioWorklet = { addModule: vi.fn(async (url: string) => void url) }
  readonly resume = vi.fn(async () => {
    if (this.state !== 'closed') this.state = 'running'
  })
  readonly close = vi.fn(async () => {
    this.state = 'closed'
  })
  readonly sources: Array<{ stream: MediaStream; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = []
  readonly createMediaStreamSource = vi.fn((stream: MediaStream) => {
    const source = { stream, connect: vi.fn(), disconnect: vi.fn() }
    this.sources.push(source)
    return source
  })
  constructor() {
    FakeAudioContext.instances.push(this)
  }
}

export class FakeAudioWorkletNode {
  static instances: FakeAudioWorkletNode[] = []
  readonly port: { onmessage: ((event: { data: unknown }) => void) | null } = { onmessage: null }
  onprocessorerror: (() => void) | null = null
  readonly connect = vi.fn()
  readonly disconnect = vi.fn()
  constructor(
    readonly context: FakeAudioContext,
    readonly processor: string,
    readonly options?: AudioWorkletNodeOptions,
  ) {
    FakeAudioWorkletNode.instances.push(this)
  }

  /** The microphone hears `seconds` of a tone at `amplitude`, block by block. */
  hear(seconds: number, amplitude = 0.25) {
    const frames = Math.round(seconds * this.context.sampleRate)
    for (let at = 0; at < frames; at += 2048) {
      const block = new Float32Array(Math.min(2048, frames - at))
      for (let i = 0; i < block.length; i += 1) block[i] = amplitude * Math.sin(((at + i) / this.context.sampleRate) * 2 * Math.PI * 220)
      this.port.onmessage?.({ data: block })
    }
  }
}

export function installWebAudio() {
  FakeAudioContext.instances = []
  FakeAudioContext.rate = 48_000
  FakeAudioWorkletNode.instances = []
  Object.defineProperty(window, 'AudioContext', { value: FakeAudioContext, configurable: true, writable: true })
  Object.defineProperty(window, 'AudioWorkletNode', { value: FakeAudioWorkletNode, configurable: true, writable: true })
}

export function removeWebAudio() {
  Reflect.deleteProperty(window, 'AudioContext')
  Reflect.deleteProperty(window, 'AudioWorkletNode')
}

/** The fields of a WAV header, read as the backend reads them. */
export async function readWav(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const view = new DataView(bytes.buffer)
  const tag = (at: number) => String.fromCharCode(...bytes.slice(at, at + 4))
  const byteRate = view.getUint32(28, true)
  const dataBytes = view.getUint32(40, true)
  return {
    riff: tag(0),
    riffSize: view.getUint32(4, true),
    wave: tag(8),
    fmt: tag(12),
    fmtSize: view.getUint32(16, true),
    format: view.getUint16(20, true),
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    byteRate,
    blockAlign: view.getUint16(32, true),
    bitsPerSample: view.getUint16(34, true),
    data: tag(36),
    dataBytes,
    seconds: dataBytes / byteRate,
    totalBytes: bytes.length,
    sample: (index: number) => view.getInt16(44 + index * 2, true),
  }
}
