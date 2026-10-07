#!/usr/bin/env node
/*
 * Continuous frames of a star being dragged (#136): the grabbed star follows
 * the hand, its linked stars are pulled after it on springs, and everything
 * springs back when it is let go -- recorded as the browser paints it
 * (Chrome's screencast), so a jitter, a jump or a star that does not come
 * home shows up frame by frame. With the dev server running:
 *
 *   node scripts/design-preview-drag-frames.mjs --base http://127.0.0.1:5173 --label after-136
 *
 * Desktop (1440×900) drags with the mouse; the phones (390×844, 375×812)
 * hold the star for half a second (touch events through the DevTools
 * protocol) and then drag it. Two stars: `sine` is the demo knowledge point
 * "Sine and cosine" (its successor "Refraction" is in physics), `hub` the
 * star on screen with the most links. `zoom` drags `sine` and wheels in and
 * out while it is held (desktop only).
 *
 * Options: --base, --label (default `drag-frames`), --points 1000|2000,
 * --viewports desktop,phone,narrow, --stars sine,hub,zoom, --surface
 * (default `map-focus-star`).
 *
 * Writes .codex-screenshots/design-preview/<label>/<star>-<viewport>-<points>/NNNN.jpg
 * and contact sheets of 30 frames, and prints the route before and after
 * (a drag never changes it), whether every star's link in the parallel DOM
 * is back where it was, and how much each frame differs from the one before.
 * Fails (exit 1) on a request outside the dev server, a route change, or a
 * star not back in its place.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { URL } from 'node:url'
import { chromium } from '@playwright/test'

/* global window, document, Image, HTMLElement -- used inside page.evaluate, in the browser */

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
const label = option('label', 'drag-frames').replace(/[^\w.-]/g, '_')
const points = Number(option('points', '1000'))
const surface = option('surface', 'map-focus-star')
const viewports = option('viewports', 'desktop,phone,narrow').split(',')
const stars = option('stars', 'sine,hub').split(',')
const outDir = path.resolve('.codex-screenshots/design-preview', label)
const leaks = []
const problems = []

function previewUrl(query) {
  const url = new URL('/src/dev/preview.html', base)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value))
  return url.href
}

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

/** Every star link of the parallel DOM and where it is (the map at rest). */
async function starLinks(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[data-unit]')].map((link) => {
      const box = link.getBoundingClientRect()
      return { unit: link.getAttribute('data-unit'), x: box.left + box.width / 2, y: box.top + box.height / 2 }
    }),
  )
}

/** How many links each star has in the demo sky the preview serves (both ways, across subjects). */
async function degrees(page, size) {
  return page.evaluate(async (count) => {
    // The dev server serves the demo sky as a module; the browser imports it.
    // eslint-disable-next-line import-x/no-unresolved
    const { demoSky } = await import('/src/dev/demo/data/index.ts')
    const out = {}
    for (const { from, to } of demoSky(count).prerequisites) {
      out[from] = (out[from] ?? 0) + 1
      out[to] = (out[to] ?? 0) + 1
    }
    return out
  }, size)
}

/**
 * A path for the hand from `(x, y)`, `steps` moves: out towards the middle of
 * the screen (and a little past it), then a small loop, ending held still.
 */
function handPath(x, y, width, height, steps) {
  const cx = width / 2
  const cy = height * 0.5
  const d = Math.hypot(cx - x, cy - y) || 1
  const reach = Math.max(Math.min(width, height) * 0.3, d * 0.8)
  const ux = (cx - x) / d
  const uy = (cy - y) / d
  const out = []
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps
    if (t < 0.55) {
      const e = t / 0.55
      const s = e * e * (3 - 2 * e)
      out.push({ x: x + ux * reach * s, y: y + uy * reach * s })
    } else {
      const a = ((t - 0.55) / 0.45) * Math.PI * 2
      const r = reach * 0.22
      const ex = x + ux * reach
      const ey = y + uy * reach
      out.push({ x: ex + r * Math.sin(a), y: ey - r * (1 - Math.cos(a)) })
    }
  }
  return out.map((p) => ({ x: Math.max(8, Math.min(width - 8, p.x)), y: Math.max(8, Math.min(height - 8, p.y)) }))
}

async function frameDiffs(browser, frames) {
  const page = await browser.newPage()
  const result = await page.evaluate(async (images) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    let previous = null
    const diffs = []
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
      if (previous) {
        let d = 0
        for (let i = 0; i < grey.length; i += 1) d += Math.abs(grey[i] - previous[i])
        diffs.push(d / grey.length)
      }
      previous = grey
    }
    return diffs
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
  for (const which of stars) for (const name of viewports) {
    const viewport = VIEWPORTS[name]
    if (!viewport) throw new Error(`Unknown viewport ${name}`)
    if (which === 'zoom' && viewport.mobile) continue
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
    // Keyboard focus off the star, so only the drag picks it out.
    await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
    await delay(1200)
    const { width, height } = viewport
    const before = await starLinks(page)
    let star
    if (which === 'hub') {
      const degree = await degrees(page, points)
      const inner = before.filter((s) => s.x > width * 0.15 && s.x < width * 0.85 && s.y > height * 0.25 && s.y < height * 0.75)
      star = inner.sort((a, b) => (degree[b.unit] ?? 0) - (degree[a.unit] ?? 0))[0]
      if (star) console.log(`hub: ${star.unit} with ${degree[star.unit] ?? 0} links`)
    } else {
      star = before.find((s) => s.unit === 'demo-sine-cosine')
    }
    if (!star) {
      problems.push(`${which}-${name}: no star to drag`)
      await context.close()
      continue
    }
    const route = () => page.evaluate(() => new URL(window.location.href).searchParams.get('path'))
    const routeBefore = await route()
    const cast = await screencast(page)
    await cast.start()
    await delay(250)
    const hand = handPath(star.x, star.y, width, height, 45)
    if (!viewport.mobile) {
      await page.mouse.move(star.x, star.y)
      await page.mouse.down()
      await delay(80)
      for (const [k, p] of hand.entries()) {
        await page.mouse.move(p.x, p.y)
        if (which === 'zoom' && (k === 15 || k === 30)) {
          for (let i = 0; i < 4; i += 1) {
            await page.mouse.wheel(0, k === 15 ? -100 : 100)
            await delay(40)
          }
        }
        await delay(16)
      }
      await delay(350)
      await page.mouse.up()
    } else {
      const touch = (p) => [{ x: p.x, y: p.y, id: 1 }]
      await cast.client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(star) })
      // Held still: grabbed after the long press, the star grows a little.
      await delay(500)
      for (const p of hand) {
        await cast.client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(p) })
        await delay(16)
      }
      await delay(350)
      await cast.client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    await delay(1500)
    await cast.stop()
    const routeAfter = await route()
    const after = await starLinks(page)
    const runName = `${which}-${name}-${points}`
    const where = new Map(after.map((s) => [s.unit, s]))
    let off = 0
    for (const s of before) {
      const a = where.get(s.unit)
      if (which !== 'zoom' && (!a || Math.hypot(a.x - s.x, a.y - s.y) > 0.5)) off += 1
    }
    if (routeAfter !== routeBefore) problems.push(`${runName}: route ${routeBefore} -> ${routeAfter}`)
    if (off > 0) problems.push(`${runName}: ${off} stars not back in place`)
    const frameDir = path.join(outDir, runName)
    await rm(frameDir, { recursive: true, force: true })
    await mkdir(frameDir, { recursive: true })
    for (let i = 0; i < cast.frames.length; i += 1) {
      await writeFile(path.join(frameDir, `${String(i + 1).padStart(4, '0')}.jpg`), Buffer.from(cast.frames[i].data, 'base64'))
    }
    const made = await sheets(browser, cast.frames, runName)
    const span = cast.frames.length > 1 ? cast.frames[cast.frames.length - 1].at - cast.frames[0].at : 0
    const diffs = await frameDiffs(browser, cast.frames)
    const top = diffs.map((d, i) => [d, i + 2]).sort((a, b) => b[0] - a[0]).slice(0, 6)
    const sorted = [...diffs].sort((a, b) => a - b)
    console.log(`${runName}: ${star.unit}; ${cast.frames.length} frames over ${span.toFixed(1)} s; route ${routeBefore} -> ${routeAfter}; ${before.length - off}/${before.length} stars back in place; ${made.length} sheets`)
    console.log(`  frame-to-frame difference: median ${(sorted[sorted.length >> 1] ?? 0).toFixed(2)}, p95 ${(sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(2)}; largest ${top.map(([d, i]) => `#${i} ${d.toFixed(1)}`).join(', ')}`)
    await context.close()
  }
  console.log(`frames in ${path.relative(process.cwd(), outDir)} (${(await readdir(outDir)).length} entries)`)
} finally {
  await browser.close()
}
console.log(`requests outside the dev server: ${leaks.length}`)
for (const line of leaks) console.log(`  ${line}`)
for (const line of problems) console.log(`problem: ${line}`)
if (leaks.length || problems.length) process.exitCode = 1
