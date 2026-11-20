/**
 * A voice question's recording as the speech model takes it (#726): 16-bit
 * PCM WAV, mono, 16 kHz. Voxtral on Bedrock takes only mp3 and wav
 * (stoa-backend#542), so the browser records PCM with Web Audio and writes the
 * WAV itself; the backend reads the duration from the header, with no decoder.
 *
 * A minute is 960 000 samples, 1 920 044 bytes with the header: under the
 * 2 MiB the backend takes.
 */

/** The rate the recording is written at, whatever the microphone's own. */
export const WAV_SAMPLE_RATE = 16_000
/** The size of the canonical RIFF/WAVE header `encodeWav` writes. */
export const WAV_HEADER_BYTES = 44

/**
 * Brings the audio context's samples (usually 48 or 44.1 kHz, as floats) down
 * to `WAV_SAMPLE_RATE` as 16-bit integers, a block at a time as they come.
 * Each output sample is the mean of the input samples in its window: a box
 * filter, enough against aliasing for speech. Holds at most `maxSamples`,
 * so a recording cannot grow past the backend's minute however late the
 * timer is.
 */
export class Downsampler {
  private readonly ratio: number
  private readonly out: Int16Array
  private produced = 0
  private seen = 0
  private sum = 0
  private count = 0

  constructor(inputRate: number, maxSamples: number, outputRate: number = WAV_SAMPLE_RATE) {
    if (!(inputRate > 0) || !(outputRate > 0)) throw new RangeError(`sample rate ${inputRate} -> ${outputRate}`)
    this.ratio = inputRate / outputRate
    this.out = new Int16Array(Math.max(0, Math.floor(maxSamples)))
  }

  /** Takes a block of input; `true` once the recording is full. */
  push(block: Float32Array): boolean {
    for (let i = 0; i < block.length && !this.full; i += 1) {
      this.sum += block[i]
      this.count += 1
      this.seen += 1
      const due = Math.min(this.out.length, Math.floor(this.seen / this.ratio))
      if (this.produced < due) {
        const sample = toInt16(this.sum / this.count)
        // Below the output rate (a rare 8 kHz microphone) a sample is held for the gap.
        while (this.produced < due) this.out[this.produced++] = sample
        this.sum = 0
        this.count = 0
      }
    }
    return this.full
  }

  get full(): boolean {
    return this.produced >= this.out.length
  }

  /** Samples written so far. */
  get length(): number {
    return this.produced
  }

  /** What has been written, as a view (no copy). */
  samples(): Int16Array {
    return this.out.subarray(0, this.produced)
  }
}

function toInt16(value: number): number {
  const clamped = Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0))
  return clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff)
}

/** 16-bit mono PCM `samples` as a WAV file (`audio/wav`). */
export function encodeWav(samples: Int16Array, sampleRate: number = WAV_SAMPLE_RATE): Blob {
  const dataBytes = samples.length * 2
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataBytes)
  const view = new DataView(buffer)
  const ascii = (at: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(at + i, text.charCodeAt(i))
  }
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + dataBytes, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  ascii(36, 'data')
  view.setUint32(40, dataBytes, true)
  // WAV is little-endian; write each sample so a big-endian engine writes it right too.
  for (let i = 0; i < samples.length; i += 1) view.setInt16(WAV_HEADER_BYTES + i * 2, samples[i], true)
  return new Blob([buffer], { type: 'audio/wav' })
}
