#!/usr/bin/env node
/*
 * How long a tap on a star waits for its first frame (#139, #123 B6). On a
 * phone, a tap on a star used to stall about 330 ms with no new frame while
 * React mounted the card and took the parallel DOM down; the camera's flight
 * now starts first. With the dev server running:
 *
 *   node scripts/design-preview-tap-latency.mjs --base http://127.0.0.1:5173
 *
 * Each run opens `surface=map-nebula` (stars big enough to pick) at a phone
 * viewport with touch, taps the star link nearest the middle through the
 * DevTools protocol, and reads two clocks:
 *
 *   - in the page: from the `pointerup` to the first animation frame after
 *     it, to the first animation frame whose canvas has moved (the flight's
 *     first frame), the longest gap
 *     between animation frames over the 700 ms that follow (the flight is
 *     600 ms), and the long tasks (> 50 ms) in that window;
 *   - Chrome's own: from the tap to the first screencast frame that differs
 *     from the frame before the tap (the first frame the browser painted
 *     with the map moved), and when the card (`article`) is in the DOM.
 *
 * Options: --base, --points 1000|2000, --viewports phone,narrow, --runs 5,
 * --unit (a star to tap, e.g. `demo-sine-cosine`; default the star link
 * nearest the middle),
 * --throttle 1,4 (CPU slow-down factors), --surface (default `map-nebula`).
 * Prints every run and the median per viewport and throttle. Fails (exit 1)
 * on a request outside the dev server.
 */
import { setTimeout as delay } from 'node:timers/promises'
import { URL } from 'node:url'
import { chromium } from '@playwright/test'

/* global window, document, performance, PerformanceObserver, MutationObserver, requestAnimationFrame, Image -- used inside page.evaluate */

const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  narrow: { width: 375, height: 812 },
}

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const base = new URL(option('base', 'http://127.0.0.1:5173'))
const points = Number(option('points', '1000'))
const surface = option('surface', 'map-nebula')
const viewports = option('viewports', 'phone,narrow').split(',')
const runs = Number(option('runs', '5'))
const throttles = option('throttle', '1,4').split(',').map(Number)
const unit = option('unit', '')
const leaks = []

function previewUrl(query) {
  const url = new URL('/src/dev/preview.html', base)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value))
  return url.href
}

const median = (values) => {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  return sorted.length ? sorted[sorted.length >> 1] : NaN
}
const ms = (value) => (Number.isFinite(value) ? `${Math.round(value)}` : '–')

/** Mean absolute difference of two JPEG frames (160 px wide grey copies), 0..255. */
async function diffPage(browser) {
  const page = await browser.newPage()
  return {
    diff: (a, b) =>
      page.evaluate(async ([first, second]) => {
        const grey = async (data) => {
          const image = new Image()
          image.src = `data:image/jpeg;base64,${data}`
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = 160
          canvas.height = Math.round((160 * image.height) / image.width)
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
          return ctx.getImageData(0, 0, canvas.width, canvas.height).data
        }
        const [p, q] = [await grey(first), await grey(second)]
        let d = 0
        for (let i = 0; i < p.length; i += 4) d += Math.abs((p[i] + p[i + 1] + p[i + 2]) / 3 - (q[i] + q[i + 1] + q[i + 2]) / 3)
        return d / (p.length / 4)
      }, [a, b]),
    close: () => page.close(),
  }
}

const browser = await chromium.launch()
const differ = await diffPage(browser)
const summary = []
try {
  for (const name of viewports) for (const throttle of throttles) {
    const viewport = VIEWPORTS[name]
    if (!viewport) throw new Error(`Unknown viewport ${name}`)
    const results = []
    for (let run = 0; run < runs; run += 1) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: true, isMobile: true })
      const page = await context.newPage()
      page.on('request', (request) => {
        const url = new URL(request.url())
        if (url.protocol === 'data:' || url.protocol === 'blob:') return
        if (url.origin !== base.origin || url.pathname.startsWith('/api/')) leaks.push(`${request.method()} ${request.url()}`)
      })
      await page.goto(previewUrl({ surface, points }))
      await page.waitForSelector('html[data-preview-ready="1"]', { timeout: 30_000 })
      await delay(1500)
      const client = await context.newCDPSession(page)
      if (throttle > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: throttle })
      await delay(300)

      const star = await page.evaluate(([w, h, wanted]) => {
        let best = null
        for (const link of document.querySelectorAll(wanted ? `a[data-unit="${wanted}"]` : 'a[data-unit]')) {
          const box = link.getBoundingClientRect()
          const x = box.left + box.width / 2
          const y = box.top + box.height / 2
          if (!wanted && (y < 140 || y > h - 120)) continue
          const d = Math.hypot(x - w / 2, y - h * 0.5)
          if (!best || d < best.d) best = { x: Math.round(x), y: Math.round(y), d, unit: link.getAttribute('data-unit') }
        }
        return best
      }, [viewport.width, viewport.height, unit])
      if (!star) throw new Error('No star link on screen')

      // In the page: the pointerup, every animation frame, the long tasks.
      await page.evaluate(() => {
        const tap = { upAt: 0, frames: [], long: [], cardAt: 0, drawAt: 0 }
        window.__tapLatency = tap
        // The map's own frames: the first animation frame whose canvas differs
        // from the canvas at the tap (a small grey copy; the breathing of the
        // recommended star alone stays under the threshold).
        const stageCanvas = document.querySelector('[data-starmap-stage] canvas')
        const thumb = document.createElement('canvas')
        thumb.width = 48
        thumb.height = 104
        const thumbCtx = thumb.getContext('2d', { willReadFrequently: true })
        const grey = () => {
          thumbCtx.clearRect(0, 0, thumb.width, thumb.height)
          thumbCtx.drawImage(stageCanvas, 0, 0, thumb.width, thumb.height)
          const data = thumbCtx.getImageData(0, 0, thumb.width, thumb.height).data
          const out = new Float32Array(data.length / 4)
          for (let i = 0; i < out.length; i += 1) out[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3
          return out
        }
        let reference = null
        window.addEventListener('pointerup', () => {
          if (tap.upAt) return
          tap.upAt = performance.now()
          reference = grey()
        }, true)
        const loop = (now) => {
          tap.frames.push(now)
          if (reference && !tap.drawAt) {
            const current = grey()
            let d = 0
            for (let i = 0; i < current.length; i += 1) d += Math.abs(current[i] - reference[i])
            if (d / current.length > 1.5) tap.drawAt = now
          }
          if (!tap.upAt || now - tap.upAt < 1200) requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) tap.long.push({ start: entry.startTime, duration: entry.duration })
          }).observe({ type: 'longtask', buffered: false })
        } catch { /* no long-task timing */ }
        const watch = new MutationObserver(() => {
          if (!tap.cardAt && document.querySelector('[data-starmap-stage] article')) tap.cardAt = performance.now()
        })
        watch.observe(document.body, { childList: true, subtree: true })
      })

      const frames = []
      client.on('Page.screencastFrame', (event) => {
        frames.push({ data: event.data, at: event.metadata.timestamp })
        client.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {})
      })
      await client.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 })
      await delay(400)
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: star.x, y: star.y, id: 1 }] })
      await delay(40)
      const tappedAt = Date.now() / 1000
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await delay(1500)
      await client.send('Page.stopScreencast')
      if (throttle > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })

      const inPage = await page.evaluate(() => {
        const tap = window.__tapLatency
        const after = tap.frames.filter((at) => at > tap.upAt)
        const flight = after.filter((at) => at - tap.upAt <= 700)
        let gap = after.length ? after[0] - tap.upAt : NaN
        for (let i = 1; i < flight.length; i += 1) gap = Math.max(gap, flight[i] - flight[i - 1])
        const long = tap.long.filter((entry) => entry.start + entry.duration > tap.upAt - 5 && entry.start < tap.upAt + 700)
        return {
          firstFrame: after.length ? after[0] - tap.upAt : NaN,
          longestGap: gap,
          longTasks: long.map((entry) => Math.round(entry.duration)),
          card: tap.cardAt ? tap.cardAt - tap.upAt : NaN,
          drawn: tap.drawAt ? tap.drawAt - tap.upAt : NaN,
          route: new URL(window.location.href).searchParams.get('path'),
        }
      })

      // Chrome's own frames: the first painted after the tap that moved the map.
      const before = [...frames].reverse().find((frame) => frame.at <= tappedAt)
      let painted = NaN
      if (before) {
        for (const frame of frames) {
          if (frame.at <= tappedAt) continue
          if ((await differ.diff(before.data, frame.data)) > 0.6) {
            painted = (frame.at - tappedAt) * 1000
            break
          }
        }
      }
      const result = { ...inPage, painted, unit: star.unit }
      results.push(result)
      console.log(
        `${name} ×${throttle} run ${run + 1}: tap→first frame ${ms(result.firstFrame)} ms, tap→map moved ${ms(result.drawn)} ms, tap→first moved frame painted ${ms(result.painted)} ms, ` +
          `longest frame gap in the flight ${ms(result.longestGap)} ms, card in DOM ${ms(result.card)} ms, long tasks [${result.longTasks.join(', ')}] ms; ${result.route}`,
      )
      await context.close()
    }
    const line = {
      viewport: `${name} ${viewport.width}×${viewport.height}`,
      throttle,
      firstFrame: median(results.map((r) => r.firstFrame)),
      painted: median(results.map((r) => r.painted)),
      longestGap: median(results.map((r) => r.longestGap)),
      card: median(results.map((r) => r.card)),
      drawn: median(results.map((r) => r.drawn)),
    }
    summary.push(line)
  }
} finally {
  await differ.close()
  await browser.close()
}
console.log(`\nmedians of ${runs} runs, ${points} stars, ${surface}:`)
for (const line of summary) {
  console.log(
    `  ${line.viewport} CPU ×${line.throttle}: tap→first frame ${ms(line.firstFrame)} ms; tap→map moved ${ms(line.drawn)} ms; first moved frame painted ${ms(line.painted)} ms; ` +
      `longest gap in the flight ${ms(line.longestGap)} ms; card in DOM ${ms(line.card)} ms`,
  )
}
console.log(`requests outside the dev server: ${leaks.length}`)
for (const line of leaks) console.log(`  ${line}`)
if (leaks.length) process.exitCode = 1
