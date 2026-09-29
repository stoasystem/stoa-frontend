/*
 * The phone bench (#44): a panel over the dev star map that drags the map
 * round a circle for ten seconds, times every animation frame on its own
 * clock, and keeps the readings in this browser so the six runs -- 500, 1000
 * and 2000 stars, foveation on and off -- add up to the ticket's table.
 *
 * The drag goes through the stage's own pointer handlers, the way a finger
 * does, on the whole-map layer: every star on screen, nebulae crossing the
 * focus and fading between sprites and tiles. It is the heaviest thing the
 * map does for any length of time.
 *
 * Mounted in its own root beside the map, so it is not part of what is timed
 * and its taps never reach the canvas. Dev only, and not translated.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { BENCH_SIZES, benchTable, formatSummary, summarizeFrames, type BenchResult } from './benchStats'

const STORAGE_KEY = 'stoa-starmap-bench'
const WARMUP_MS = 1500
const MEASURE_MS = 10_000
const CIRCLE_PERIOD_MS = 4000

type Config = { points: number; foveate: boolean }
type Stored = { device: string; results: BenchResult[]; queue: Config[] }

const ALL_CONFIGS: Config[] = [true, false].flatMap((foveate) => BENCH_SIZES.map((points) => ({ points, foveate })))

function guessDevice(): string {
  const ua = navigator.userAgent
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : 'Desktop'
  const browser = /CriOS|Chrome/.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser'
  return `${device} · ${browser}`
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Stored
  } catch {
    // Private mode or blocked storage: the bench still runs, it just forgets.
  }
  return { device: guessDevice(), results: [], queue: [] }
}

function save(stored: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // As above.
  }
}

function urlFor(config: Config, run: boolean): string {
  const url = new URL(window.location.href)
  url.searchParams.set('points', String(config.points))
  url.searchParams.set('foveation', config.foveate ? 'on' : 'off')
  url.searchParams.set('bench', '1')
  if (run) url.searchParams.set('run', '1')
  else url.searchParams.delete('run')
  return url.toString()
}

function currentConfig(): Config {
  const params = new URLSearchParams(window.location.search)
  return { points: Number(params.get('points') ?? 10), foveate: params.get('foveation') !== 'off' }
}

/** No frame for this long: the screen went off or the tab was hidden, and the run means nothing. */
const STALL_MS = 2000

const nextFrame = () =>
  new Promise<number>((resolve, reject) => {
    const stall = setTimeout(() => reject(new Error('The page stopped drawing (screen off, tab hidden?). Run again.')), STALL_MS)
    requestAnimationFrame((now) => {
      clearTimeout(stall)
      resolve(now)
    })
  })
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * `StarMapView` captures the pointer before it hands the press to the engine,
 * and a real browser refuses to capture a pointer it never saw go down. The
 * bench's pointer is made up, so let that one call fail quietly.
 */
function tolerateSyntheticCapture() {
  const capture = Element.prototype.setPointerCapture
  Element.prototype.setPointerCapture = function (this: Element, id: number) {
    try {
      capture.call(this, id)
    } catch {
      // The bench's pointer.
    }
  }
}

async function measure(onProgress: (text: string) => void): Promise<number[]> {
  const stage = document.querySelector<HTMLElement>('[data-starmap-stage]')
  if (!stage) throw new Error('No star map on this page.')
  onProgress('Warming up…')
  await wait(WARMUP_MS)

  const rect = stage.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const r = Math.min(rect.width, rect.height) * 0.25
  const pointer = { pointerId: 7331, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, button: 0 }
  const at = (angle: number) => ({ clientX: cx + r * Math.cos(angle), clientY: cy + r * Math.sin(angle) })

  let angle = 0
  stage.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, ...at(angle), buttons: 1 }))
  const intervals: number[] = []
  try {
    const start = await nextFrame()
    let last = start
    while (last - start < MEASURE_MS) {
      const now = await nextFrame()
      intervals.push(now - last)
      last = now
      angle = (((now - start) % CIRCLE_PERIOD_MS) / CIRCLE_PERIOD_MS) * Math.PI * 2
      stage.dispatchEvent(new PointerEvent('pointermove', { ...pointer, ...at(angle), buttons: 1 }))
      if (intervals.length % 30 === 0) onProgress(`Measuring… ${Math.ceil((MEASURE_MS - (now - start)) / 1000)} s`)
    }
  } finally {
    stage.dispatchEvent(new PointerEvent('pointerup', { ...pointer, ...at(angle), buttons: 0 }))
  }
  return intervals
}

const box: CSSProperties = {
  position: 'fixed',
  left: 8,
  bottom: 8,
  zIndex: 2147483647,
  width: 'min(360px, calc(100vw - 16px))',
  maxHeight: '60vh',
  overflow: 'auto',
  padding: 10,
  borderRadius: 8,
  background: 'rgba(12, 14, 24, 0.92)',
  color: '#f4f4f8',
  font: '12px/1.4 system-ui, sans-serif',
}
const button: CSSProperties = { font: 'inherit', padding: '6px 10px', marginRight: 6, marginTop: 6, borderRadius: 6 }

export function BenchPanel() {
  const [stored, setStored] = useState(load)
  const [status, setStatus] = useState('Idle.')
  const [running, setRunning] = useState(false)
  const config = currentConfig()
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  const update = (next: Stored) => {
    save(next)
    setStored(next)
  }

  const run = async () => {
    setRunning(true)
    try {
      const summary = summarizeFrames(await measure(setStatus))
      const latest = load()
      const next: Stored = {
        ...latest,
        results: [...latest.results, { device: latest.device, points: config.points, foveate: config.foveate, summary }],
      }
      const [following, ...rest] = next.queue
      next.queue = rest
      update(next)
      setStatus(`Done: ${formatSummary(summary)}`)
      if (following) window.location.replace(urlFor(following, true))
    } catch (error) {
      setStatus(String(error))
    } finally {
      setRunning(false)
    }
  }

  // `&run=1`: start by itself, as each step of "Run all six" does after its reload.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('run') === '1') void run()
    // Once, on mount.
  }, [])

  const runAll = () => {
    const [first, ...rest] = ALL_CONFIGS
    update({ ...load(), queue: rest })
    window.location.replace(urlFor(first, true))
  }

  const table = benchTable(stored.results)

  return (
    <div style={box} data-bench-panel>
      <strong>Star map bench (#44)</strong>
      <div>
        {config.points} stars · foveation {config.foveate ? 'on' : 'off'} · {window.innerWidth}×{window.innerHeight} @{' '}
        {window.devicePixelRatio}x{reducedMotion ? ' · reduced motion ON (turn it off)' : ''}
      </div>
      <label style={{ display: 'block', marginTop: 6 }}>
        Device{' '}
        <input
          value={stored.device}
          onChange={(event) => update({ ...stored, device: event.target.value })}
          style={{ font: 'inherit', width: '70%' }}
        />
      </label>
      <div>
        <button type="button" style={button} disabled={running} onClick={() => void run()}>
          Run this
        </button>
        <button type="button" style={button} disabled={running} onClick={runAll}>
          Run all six
        </button>
        <button type="button" style={button} disabled={running} onClick={() => update({ ...stored, results: [], queue: [] })}>
          Clear
        </button>
      </div>
      <div style={{ marginTop: 6 }}>{running ? `${status} Keep the screen on; don't touch it.` : status}</div>
      <div style={{ marginTop: 6 }}>
        {ALL_CONFIGS.map((c) => (
          <a key={`${c.points}-${c.foveate}`} href={urlFor(c, false)} style={{ color: '#9ecbff', marginRight: 8 }}>
            {c.points}/{c.foveate ? 'on' : 'off'}
          </a>
        ))}
      </div>
      {stored.results.length > 0 && (
        <textarea
          readOnly
          value={table}
          onFocus={(event) => event.currentTarget.select()}
          rows={Math.min(8, table.split('\n').length + 1)}
          style={{ font: '11px/1.3 ui-monospace, monospace', width: '100%', marginTop: 6 }}
          aria-label="Table for the ticket: tap to select, then copy"
        />
      )}
    </div>
  )
}

export function mountBenchPanel(createRoot: (el: HTMLElement) => { render(node: ReactNode): void }) {
  tolerateSyntheticCapture()
  const el = document.createElement('div')
  document.body.appendChild(el)
  createRoot(el).render(<BenchPanel />)
}
