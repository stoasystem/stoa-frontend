#!/usr/bin/env node
/*
 * Continuous frames of the star map zooming (#134): from the panorama in to a
 * single star and back out, recorded as the browser paints them (Chrome's
 * screencast), so a jump, a label that flickers or a line that pops shows up
 * frame by frame. With the dev server running:
 *
 *   node scripts/design-preview-zoom-frames.mjs --base http://127.0.0.1:5173 --label after-134
 *
 * Desktop (1440×900) zooms with the mouse wheel around a point over a nebula;
 * the phones (390×844, 375×812) with a synthetic two-finger pinch (touch
 * events through the DevTools protocol) around the same kind of point. Each
 * run then taps a star (the card opens) and pinches / wheels back out.
 *
 * Options: --base, --label (default `zoom-frames`), --points 1000|2000,
 * --viewports desktop,phone,narrow, --surface (default `map`).
 *
 * Writes .codex-screenshots/design-preview/<label>/zoom-<viewport>-<points>/NNNN.jpg
 * (every frame) and zoom-<viewport>-<points>-sheet-N.png (contact sheets of
 * 30 frames, in order, each stamped with its time). Fails (exit 1) on a
 * request outside the dev server.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { URL } from 'node:url'
import { chromium } from '@playwright/test'

/* global window, document, Image -- used inside page.evaluate, in the browser */

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, mobile: false },
  phone: { width: 390, height: 844, mobile: true },
  narrow: { width: 375, height: 812, mobile: true },
}

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const base = new URL(option('base', 'http://127.0.0.1:5173'))
const label = option('label', 'zoom-frames').replace(/[^\w.-]/g, '_')
const points = Number(option('points', '1000'))
const surface = option('surface', 'map')
const viewports = option('viewports', 'desktop,phone,narrow').split(',')
const outDir = path.resolve('.codex-screenshots/design-preview', label)
const leaks = []

function previewUrl(query) {
  const url = new URL('/src/dev/preview.html', base)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value))
  return url.href
}

/** Frames as Chrome paints them, with their times. */
async function screencast(page) {
  const client = await page.context().newCDPSession(page)
  const frames = []
  client.on('Page.screencastFrame', (event) => {
    frames.push({ data: event.data, at: event.metadata.timestamp })
    client.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {})
  })
  return {
    client,
    frames,
    start: () => client.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 }),
    stop: () => client.send('Page.stopScreencast'),
  }
}

/** A two-finger pinch around `(x, y)` from `from` to `to` px apart, over `steps` moves 16 ms apart. */
async function pinch(client, x, y, from, to, steps = 30) {
  const touch = (spread) => [
    { x: x - spread / 2, y, id: 1 },
    { x: x + spread / 2, y, id: 2 },
  ]
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(from) })
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(from + (to - from) * t) })
    await delay(16)
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

async function tap(client, x, y) {
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
  await delay(40)
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

/** The star link nearest the middle of the screen, as the parallel DOM places it. */
async function starNearMiddle(page, width, height) {
  return page.evaluate(([w, h]) => {
    let best = null
    for (const link of document.querySelectorAll('a[data-unit]')) {
      const box = link.getBoundingClientRect()
      const x = box.left + box.width / 2
      const y = box.top + box.height / 2
      const d = Math.hypot(x - w / 2, y - h * 0.45)
      if (!best || d < best.d) best = { x, y, d, unit: link.getAttribute('data-unit') }
    }
    return best
  }, [width, height])
}

/**
 * How much each frame differs from the one before (mean absolute difference
 * of a 160 px wide grey copy, 0..255), and how many frames are nearly black:
 * a jump is a spike among its neighbours, a blank canvas a black frame.
 */
async function frameDiffs(browser, frames) {
  const page = await browser.newPage()
  const result = await page.evaluate(async (images) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    let previous = null
    const diffs = []
    let black = 0
    for (const data of images) {
      const image = new Image()
      image.src = `data:image/jpeg;base64,${data}`
      await image.decode()
      canvas.width = 160
      canvas.height = Math.round((160 * image.height) / image.width)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const grey = new Float32Array(pixels.length / 4)
      for (let i = 0; i < grey.length; i += 1) grey[i] = (pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 3
      // The map area (below the header) nearly black: the canvas was blank.
      let map = 0
      const from = Math.floor(grey.length * 0.2)
      for (let i = from; i < grey.length; i += 1) map += grey[i]
      if (map / (grey.length - from) < 4) black += 1
      if (previous) {
        let d = 0
        for (let i = 0; i < grey.length; i += 1) d += Math.abs(grey[i] - previous[i])
        diffs.push(d / grey.length)
      }
      previous = grey
    }
    return { diffs, black }
  }, frames.map((frame) => frame.data))
  await page.close()
  return result
}

async function sheets(browser, frames, name) {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } })
  const t0 = frames[0]?.at ?? 0
  const per = 30
  const files = []
  for (let s = 0; s * per < frames.length; s += 1) {
    const chunk = frames.slice(s * per, (s + 1) * per)
    const cells = chunk
      .map((frame, i) => `<figure><img src="data:image/jpeg;base64,${frame.data}"><figcaption>#${s * per + i + 1} · ${Math.round((frame.at - t0) * 1000)} ms</figcaption></figure>`)
      .join('')
    await page.setContent(`<!doctype html><style>body{margin:0;background:#111;color:#ddd;font:12px system-ui}main{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:4px}figure{margin:0}img{width:100%;display:block}figcaption{padding:2px 0}</style><main>${cells}</main>`)
    await page.waitForLoadState('load')
    const file = path.join(outDir, `${name}-sheet-${s + 1}.png`)
    await page.screenshot({ path: file, fullPage: true })
    files.push(file)
  }
  await page.close()
  return files
}

const browser = await chromium.launch()
try {
  await mkdir(outDir, { recursive: true })
  for (const name of viewports) {
    const viewport = VIEWPORTS[name]
    if (!viewport) throw new Error(`Unknown viewport ${name}`)
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      hasTouch: viewport.mobile,
      isMobile: viewport.mobile,
    })
    const page = await context.newPage()
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.protocol === 'data:' || url.protocol === 'blob:') return
      if (url.origin !== base.origin || url.pathname.startsWith('/api/')) leaks.push(`${request.method()} ${request.url()}`)
    })
    await page.goto(previewUrl({ surface, points }))
    await page.waitForSelector('html[data-preview-ready="1"]', { timeout: 20_000 })
    await delay(1500)
    const cast = await screencast(page)
    const { width, height } = viewport
    // Over a nebula of the galaxy in focus, a little off the middle.
    const x = Math.round(width * 0.46)
    const y = Math.round(height * 0.48)
    const route = () => page.evaluate(() => new URL(window.location.href).searchParams.get('path'))
    const routes = [await route()]
    await cast.start()
    await delay(300)
    if (!viewport.mobile) {
      await page.mouse.move(x, y)
      for (let i = 0; i < 26; i += 1) {
        await page.mouse.wheel(0, -100)
        await delay(70)
      }
    } else {
      await pinch(cast.client, x, y, 60, 300)
      await delay(250)
      await pinch(cast.client, x, y, 60, 300)
      await delay(250)
      await pinch(cast.client, x, y, 80, 200)
    }
    await delay(900)
    routes.push(await route())
    // Tap the star nearest the middle: its card opens.
    const star = await starNearMiddle(page, width, height)
    if (star) {
      if (viewport.mobile) await tap(cast.client, star.x, star.y)
      else await page.mouse.click(star.x, star.y)
      await delay(1200)
      routes.push(await route())
    }
    // And back out to the panorama.
    if (!viewport.mobile) {
      await page.mouse.move(x, y)
      for (let i = 0; i < 30; i += 1) {
        await page.mouse.wheel(0, 100)
        await delay(70)
      }
    } else {
      for (let i = 0; i < 4; i += 1) {
        await pinch(cast.client, x, y, 300, 60)
        await delay(200)
      }
    }
    await delay(1200)
    routes.push(await route())
    await cast.stop()
    const runName = `zoom-${name}-${points}`
    const frameDir = path.join(outDir, runName)
    await rm(frameDir, { recursive: true, force: true })
    await mkdir(frameDir, { recursive: true })
    for (let i = 0; i < cast.frames.length; i += 1) {
      await writeFile(path.join(frameDir, `${String(i + 1).padStart(4, '0')}.jpg`), Buffer.from(cast.frames[i].data, 'base64'))
    }
    const made = await sheets(browser, cast.frames, runName)
    const span = cast.frames.length > 1 ? cast.frames[cast.frames.length - 1].at - cast.frames[0].at : 0
    const { diffs, black } = await frameDiffs(browser, cast.frames)
    const top = diffs.map((d, i) => [d, i + 2]).sort((a, b) => b[0] - a[0]).slice(0, 6)
    const sorted = [...diffs].sort((a, b) => a - b)
    console.log(`${runName}: ${cast.frames.length} frames over ${span.toFixed(1)} s; routes ${routes.join(' -> ')}; ${made.length} sheets`)
    console.log(`  frame-to-frame difference: median ${(sorted[sorted.length >> 1] ?? 0).toFixed(2)}, p95 ${(sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(2)}; largest ${top.map(([d, i]) => `#${i} ${d.toFixed(1)}`).join(', ')}; nearly black frames: ${black}`)
    await context.close()
  }
  console.log(`frames in ${path.relative(process.cwd(), outDir)} (${(await readdir(outDir)).length} entries)`)
} finally {
  await browser.close()
}
console.log(`requests outside the dev server: ${leaks.length}`)
for (const line of leaks) console.log(`  ${line}`)
if (leaks.length) process.exitCode = 1
