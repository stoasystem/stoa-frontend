#!/usr/bin/env node
/*
 * Frame times while the star map zooms in and out continuously (#134), on the
 * bench's production build (#44), in headless Chromium with vsync off, so
 * every frame's real cost shows. Build and serve the bench first:
 *
 *   npm run bench:build && npm run bench:preview -- --port 4180
 *   node scripts/starmap-zoom-frametime.mjs --base http://127.0.0.1:4180
 *
 * Each run opens /src/dev/starmap.html?path=/map/math&points=<points> at
 * 390×844 @1x, waits for the map, then for `--seconds` scrolls the wheel by
 * ±10 px every 16 ms over the middle of the map -- 1.8 s in, 1.8 s out, and
 * again -- and times every animation frame in which the map drew (a frame
 * the map sat out is cheap and would only flatter the numbers: the build
 * before #134 drew only during its layer flights). Prints each run's p50 /
 * p95 / max (ms) and the median of the runs' p95.
 *
 * `--scenario pan` instead drags the map left 6 px a frame (the measure of
 * #120 / #132), for the same build's baseline in the same session.
 *
 * Options: --points 2000, --runs 3, --seconds 10, --width 390, --height 844,
 * --scenario zoom|pan.
 */
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

/* global window, document, CanvasRenderingContext2D, requestAnimationFrame, performance, WheelEvent, setInterval, clearInterval -- in the browser */

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const base = option('base', 'http://127.0.0.1:4173')
const points = Number(option('points', '2000'))
const runs = Number(option('runs', '3'))
const seconds = Number(option('seconds', '10'))
const width = Number(option('width', '390'))
const height = Number(option('height', '844'))
const scenario = option('scenario', 'zoom')

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] })
const p95s = []
try {
  for (let run = 0; run < runs; run += 1) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    // Count the map's draws: the Canvas 2D renderer starts every frame with setTransform on its own context.
    await page.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.setTransform
      window.__starmapDraws = 0
      CanvasRenderingContext2D.prototype.setTransform = function (...args) {
        if (this.canvas?.isConnected) window.__starmapDraws += 1
        return original.apply(this, args)
      }
    })
    await page.goto(`${base}/src/dev/starmap.html?path=/map/math&points=${points}`)
    await page.waitForSelector('[data-starmap-stage]', { timeout: 30_000 })
    await delay(2000)
    const timing = page.evaluate(
      ({ seconds, zoom }) =>
        new Promise((resolve) => {
          const stage = document.querySelector('[data-starmap-stage]')
          const rect = stage.getBoundingClientRect()
          const at = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height * 0.45 }
          const start = performance.now()
          const scroll = setInterval(() => {
            if (!zoom) return
            const t = performance.now() - start
            const inwards = Math.floor(t / 1800) % 2 === 0
            stage.dispatchEvent(new WheelEvent('wheel', { deltaY: inwards ? -10 : 10, ...at, bubbles: true, cancelable: true }))
          }, 16)
          const times = []
          let last = performance.now()
          let draws = window.__starmapDraws
          const tick = (now) => {
            if (window.__starmapDraws !== draws) times.push(now - last)
            draws = window.__starmapDraws
            last = now
            if (now - start < seconds * 1000) requestAnimationFrame(tick)
            else {
              clearInterval(scroll)
              resolve(times.slice(1))
            }
          }
          requestAnimationFrame(tick)
        }),
      { seconds, zoom: scenario === 'zoom' },
    )
    if (scenario === 'pan') {
      // Drag left 6 px a frame, picking the map up again near the left edge.
      const end = Date.now() + seconds * 1000
      const y = Math.round(height * 0.45)
      while (Date.now() < end) {
        let x = width - 40
        await page.mouse.move(x, y)
        await page.mouse.down()
        while (x > 40 && Date.now() < end) {
          x -= 6
          await page.mouse.move(x, y)
          await delay(16)
        }
        await delay(120)
        await page.mouse.up()
      }
    }
    const intervals = await timing
    const sorted = [...intervals].sort((a, b) => a - b)
    const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
    p95s.push(at(0.95))
    console.log(`run ${run + 1}: ${intervals.length} frames that drew, p50 ${at(0.5).toFixed(1)} ms, p95 ${at(0.95).toFixed(1)} ms, max ${sorted[sorted.length - 1].toFixed(1)} ms`)
    await page.close()
  }
} finally {
  await browser.close()
}
const median = [...p95s].sort((a, b) => a - b)[Math.floor(p95s.length / 2)]
console.log(`median p95 ${median.toFixed(1)} ms (${p95s.map((p) => p.toFixed(1)).join(' / ')})`)
