/**
 * The audio worklet a voice question records with (#726). It runs on the
 * browser's audio thread and only collects: each render block (128 frames)
 * of the microphone, mixed to one channel, is copied into a batch, and every
 * `BATCH_FRAMES` the batch goes to the page, which brings it down to 16 kHz
 * and writes the WAV (`src/lib/wav.ts`). It writes nothing to its output, so
 * the page plays no sound.
 *
 * Built by Vite as a file of its own (`?worker&url`) and loaded with
 * `audioWorklet.addModule` from STOA's own origin, as `script-src 'self'`
 * asks; it imports nothing.
 */

// The worklet scope's own globals, which TypeScript's DOM library leaves out.
declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort
  abstract process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void

/** About 43 ms at 48 kHz: few messages, and little lost when the child stops. */
const BATCH_FRAMES = 2048

class MonoCapture extends AudioWorkletProcessor {
  private batch = new Float32Array(BATCH_FRAMES)
  private filled = 0

  process(inputs: Float32Array[][]): boolean {
    const channels = inputs[0]
    if (!channels || channels.length === 0) return true
    const frames = channels[0].length
    for (let i = 0; i < frames; i += 1) {
      let sum = 0
      for (let c = 0; c < channels.length; c += 1) sum += channels[c][i]
      this.batch[this.filled++] = sum / channels.length
      if (this.filled === BATCH_FRAMES) {
        this.port.postMessage(this.batch, [this.batch.buffer])
        this.batch = new Float32Array(BATCH_FRAMES)
        this.filled = 0
      }
    }
    return true
  }
}

registerProcessor('stoa-mono-capture', MonoCapture)

// A module, so the declarations above stay in this file.
export {}
