#!/usr/bin/env node
/*
 * Screenshots of the design preview (#115) for the comparison page, and the
 * check that the preview reaches no backend while it takes them.
 *
 *   npm run dev -- --host 127.0.0.1 --port 5173      # in another terminal
 *   node scripts/capture-design-preview.mjs --label before
 *   ... change something ...
 *   node scripts/capture-design-preview.mjs --label after
 *
 * then open /src/dev/preview-compare.html?mode=shots&before=before&after=after.
 *
 * Options: --base <dev server origin> (default http://127.0.0.1:5173),
 * --label <set name> (default: a timestamp), --surfaces a,b (default: all),
 * --points 10,1000,2000, --viewports desktop,phone,narrow (1440×900,
 * 390×844, 375×812), --lang de|en|fr|it, --long-names (the star map's
 * nebulae with long names, the preview's `longNames=1`).
 *
 * Writes .codex-screenshots/design-preview/<label>/<surface>__<viewport>__<points>.png
 * (Git ignores the folder) and records the set in index.json beside them.
 * Every request the page makes is watched: one to any origin but the dev
 * server's, or one the preview had no demo answer for, is reported, and the
 * first kind fails the run (exit 1).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { URL } from 'node:url'
import { chromium } from '@playwright/test'

/* global window -- read inside page.evaluate, in the browser */

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, mobile: false },
  phone: { width: 390, height: 844, mobile: true },
  narrow: { width: 375, height: 812, mobile: true },
}

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const base = new URL(option('base', 'http://127.0.0.1:5173'))
const label = option('label', new Date().toISOString().replace(/[:.]/g, '-')).replace(/[^\w.-]/g, '_')
const askedSurfaces = option('surfaces', '')
const pointsList = option('points', '10,1000,2000').split(',').map(Number)
const viewports = option('viewports', 'desktop,phone,narrow').split(',')
const language = option('lang', '')
const longNames = process.argv.includes('--long-names')
const outRoot = path.resolve('.codex-screenshots/design-preview')
const outDir = path.join(outRoot, label)

for (const name of viewports) {
  if (!VIEWPORTS[name]) throw new Error(`Unknown viewport ${name}; one of ${Object.keys(VIEWPORTS).join(', ')}`)
}

function previewUrl(query) {
  const url = new URL('/src/dev/preview.html', base)
  for (const [key, value] of Object.entries(query)) if (value !== '') url.searchParams.set(key, String(value))
  return url.href
}

const browser = await chromium.launch()
const leaks = []
const unanswered = []
const consoleProblems = []
const shots = []

try {
  // The list of surfaces comes from the page itself, so it cannot drift from surfaces.ts.
  const probe = await browser.newPage()
  await probe.goto(previewUrl({ surface: 'login' }))
  const catalog = await probe.evaluate(() => window.__stoaPreviewSurfaces)
  await probe.close()
  const wanted = askedSurfaces ? new Set(askedSurfaces.split(',')) : null
  const surfaces = catalog.filter((surface) => !wanted || wanted.has(surface.id))

  await mkdir(outDir, { recursive: true })

  for (const surface of surfaces) {
    for (const viewportName of viewports) {
      const viewport = VIEWPORTS[viewportName]
      for (const points of surface.stars ? pointsList : [pointsList.includes(1000) ? 1000 : pointsList[0]]) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.mobile,
          hasTouch: viewport.mobile,
          deviceScaleFactor: 1,
        })
        const page = await context.newPage()
        const where = `${surface.id} ${viewportName} ${points}`
        page.on('request', (request) => {
          const url = new URL(request.url())
          if (url.protocol === 'data:' || url.protocol === 'blob:') return
          if (url.origin !== base.origin || url.pathname.startsWith('/api')) leaks.push(`${where}: ${request.method()} ${request.url()}`)
        })
        page.on('websocket', (socket) => {
          const url = new URL(socket.url())
          if (url.host !== base.host) leaks.push(`${where}: WS ${socket.url()}`)
        })
        page.on('console', (message) => {
          if (message.type() === 'error' || message.type() === 'warning') consoleProblems.push(`${where}: [${message.type()}] ${message.text()}`)
        })
        page.on('pageerror', (error) => consoleProblems.push(`${where}: [pageerror] ${error.message}`))

        await page.goto(previewUrl({ surface: surface.id, points, lang: language, longNames: longNames && surface.stars ? 1 : '' }))
        await page.waitForSelector('html[data-preview-ready="1"]', { timeout: 20_000 })
        await page.waitForLoadState('networkidle')
        // The star map eases in; let it settle before the picture.
        await delay(surface.stars ? 1500 : 600)

        const journal = await page.evaluate(() => window.__stoaPreview)
        for (const entry of journal?.unanswered ?? []) unanswered.push(`${where}: ${entry.method} ${entry.url}`)

        const file = `${surface.id}__${viewportName}__${points}.png`
        await page.screenshot({ path: path.join(outDir, file) })
        shots.push({ surface: surface.id, viewport: viewportName, points, file })
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}

let index = {}
try {
  index = JSON.parse(await readFile(path.join(outRoot, 'index.json'), 'utf8'))
} catch {
  index = {}
}
index[label] = { createdAt: new Date().toISOString(), language: language || null, longNames, shots, leaks, unanswered, consoleProblems }
await writeFile(path.join(outRoot, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)

console.log(`${shots.length} screenshots in ${path.relative(process.cwd(), outDir)}`)
console.log(`requests outside the dev server: ${leaks.length}`)
for (const line of leaks) console.log(`  ${line}`)
console.log(`requests without a demo answer (answered 404 in the page): ${unanswered.length}`)
for (const line of unanswered) console.log(`  ${line}`)
console.log(`console errors and warnings: ${consoleProblems.length}`)
for (const line of consoleProblems) console.log(`  ${line}`)
if (leaks.length > 0) process.exitCode = 1
