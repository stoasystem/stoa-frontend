#!/usr/bin/env node
/*
 * Walks the design preview's interactive flows (#115) and checks that none of
 * them reaches a backend. With the dev server running:
 *
 *   node scripts/design-preview-flows.mjs --base http://127.0.0.1:5173
 *
 * Flows: sign in from the login page; open the demo knowledge point's chapter
 * from its star card; answer every exercise of the next lesson wrong, then
 * right, and finish it, and see the chapter count it; send a message in Ask;
 * log out from the account menu; open the bell; zoom the star map (#134: the
 * wheel zooms without changing the route, a star tapped opens its card,
 * zooming out closes it and lets the nebula go); drag a star (#136: it
 * follows the mouse and springs back, every star back in place, no route
 * change, no card); switch subject. Then the
 * lighting moment (#51), in `design-preview-lighting-flows.mjs`.
 *
 * Each step asserts its end state on screen after a settle delay (#123): the
 * header still on the galaxy clicked 2 s later, the message still in the
 * thread once its answer is done, and so on -- a state that is reached and
 * then lost fails.
 *
 * The page after finishing the lesson is saved as
 * .codex-screenshots/design-preview/flows/lesson-finished.png.
 *
 * Fails (exit 1) on a failed flow, a request outside the dev server, a request
 * the preview had no demo answer for, or a console error or warning.
 */
import { readFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { URL } from 'node:url'
import { chromium } from '@playwright/test'
import { lightingFlows } from './design-preview-lighting-flows.mjs'

/* global window, document, fetch, HTMLElement -- used inside page.evaluate, in the browser */

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const base = new URL(option('base', 'http://127.0.0.1:5173'))
const API = 'https://api.design-preview.invalid'
const POINT = JSON.parse(readFileSync('src/dev/demo/sky/demo-sky.json', 'utf8')).knowledgePoint
/** How long a step's end state must hold before it counts: what snaps back, or goes away, fails. */
const SETTLE_MS = 2000
const settle = (ms = SETTLE_MS) => delay(ms)
const leaks = []
const unanswered = []
const problems = []
const results = []

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
watch(page)

/** Every request and socket of `target` must stay on the dev server; console errors and warnings are problems. */
function watch(target) {
  target.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol === 'data:' || url.protocol === 'blob:') return
    if (url.origin !== base.origin || url.pathname.startsWith('/api')) leaks.push(`${request.method()} ${request.url()}`)
  })
  target.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(`[${message.type()}] ${message.text()}`)
  })
  target.on('pageerror', (error) => problems.push(`[pageerror] ${error.message}`))
}

function previewUrl(query) {
  const url = new URL('/src/dev/preview.html', base)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value))
  return url.href
}

async function open(query, on = page) {
  // Collect what the page before this one could not answer.
  await collect(on)
  await on.goto(previewUrl(query))
  await on.waitForSelector('html[data-preview-ready="1"]', { timeout: 20_000 })
}

async function collect(on = page) {
  if (!on.url().startsWith(base.origin)) return
  const journal = await on.evaluate(() => window.__stoaPreview).catch(() => null)
  for (const entry of journal?.unanswered ?? []) unanswered.push(`${entry.method} ${entry.url}`)
  await on.evaluate(() => { if (window.__stoaPreview) window.__stoaPreview.unanswered = [] }).catch(() => {})
}

const route = () => page.evaluate(() => new URL(window.location.href).searchParams.get('path') ?? new URL(window.location.href).searchParams.get('surface'))

async function flow(name, run) {
  try {
    const detail = await run()
    results.push(`ok    ${name}${detail ? ` - ${detail}` : ''}`)
  } catch (error) {
    results.push(`FAIL  ${name} - ${String(error.message).split('\n')[0]}`)
  }
}

const mainPage = page
const button = (name, on = mainPage) => on.getByRole('button', { name, exact: true })

/** Gives `challenge` an answer: its right one, or a wrong one. */
async function answer(challenge, right, page = mainPage) {
  const wanted = right ? challenge.correctAnswer : wrongAnswer(challenge)
  if (challenge.type === 'multiple_choice') {
    await page.locator('label').filter({ has: page.locator(`input[type="radio"][value="${wanted}"]`) }).click()
  } else if (challenge.type === 'ordering') {
    const tiles = page.locator('button[aria-pressed]')
    // Clear what an earlier attempt chose, then choose in order.
    for (let index = 0; index < challenge.options.length; index += 1) {
      if ((await tiles.nth(index).getAttribute('aria-pressed')) === 'true') await tiles.nth(index).click()
    }
    for (const item of wanted) await tiles.nth(challenge.options.indexOf(item)).click()
  } else {
    await page.locator('input[type="text"], textarea').first().fill(String(wanted))
  }
}

function wrongAnswer(challenge) {
  if (challenge.type === 'multiple_choice') return challenge.options.find((item) => item !== challenge.correctAnswer)
  if (challenge.type === 'ordering') return [...challenge.correctAnswer].reverse()
  return 'not the answer'
}

async function feedback(page = mainPage) {
  const verdict = page.locator('[data-stage-feedback]')
  await verdict.waitFor({ timeout: 5000 })
  return verdict.getAttribute('data-stage-feedback')
}

try {
  await open({ surface: 'login' })
  await flow('login form signs in', async () => {
    await page.locator('input[type="email"], input[name="email"]').first().fill('lena.muster@example.com')
    await page.locator('input[type="password"]').first().fill('design-preview')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.locator('[data-account-trigger]').first().waitFor({ timeout: 8000 })
    await settle()
    // Still signed in, and off the login page, once it has settled.
    if (!(await page.locator('[data-account-trigger]').first().isVisible())) throw new Error('signed out again')
    if (await page.locator('input[type="password"]').count()) throw new Error('the login form is still on screen')
    const at = await route()
    if (at?.startsWith('/login')) throw new Error(`still at ${at}`)
    return `now at ${at}`
  })

  await open({ surface: 'map-star', points: 1000 })
  await flow('star card of the demo knowledge point opens its chapter', async () => {
    const link = page.locator(`a[href^="/chapter/${POINT.unitId}"]`).first()
    await link.waitFor({ timeout: 8000 })
    await link.click()
    await page.waitForFunction((unitId) => new URL(window.location.href).searchParams.get('path')?.startsWith(`/chapter/${unitId}`), POINT.unitId, { timeout: 8000 })
    await settle()
    const at = await route()
    if (at !== `/chapter/${POINT.unitId}`) throw new Error(`settled at ${at}`)
    const heading = (await page.getByRole('heading', { level: 1 }).first().textContent())?.trim()
    if (heading !== POINT.name.en) throw new Error(`the chapter's heading reads "${heading}"`)
    return `${at}, "${heading}"`
  })

  // The lesson the chapter goes on with, as the chapter itself finds it.
  await open({ surface: 'chapter' })
  const next = await page.evaluate(async (api) => {
    const catalog = await (await fetch(`${api}/practice/curriculum/catalog`)).json()
    const unit = catalog.units[0]
    const roadmap = await (await fetch(`${api}/practice/${unit.subjectId}/${unit.topicId}/roadmap`)).json()
    return { unitId: unit.id, lessonId: roadmap.currentLessonId }
  }, API)
  await open({ path: `/chapter/${next.unitId}/${next.lessonId}` })
  await flow('lesson: each exercise wrong, then right, then finish', async () => {
    const lessonId = next.lessonId
    const lesson = await page.evaluate(async ([api, id]) => (await fetch(`${api}/practice/lessons/${id}`)).json(), [API, lessonId])
    const verdicts = []
    for (const [index, challenge] of lesson.challenges.entries()) {
      await answer(challenge, false)
      await button('Check answer').click()
      verdicts.push(await feedback())
      await button('Try again').click()
      await answer(challenge, true)
      await button('Check answer').click()
      verdicts.push(await feedback())
      const last = index === lesson.challenges.length - 1
      await button(last ? 'Finish lesson' : 'Next question').click()
    }
    const expected = lesson.challenges.flatMap(() => ['wrong', 'correct'])
    if (JSON.stringify(verdicts) !== JSON.stringify(expected)) throw new Error(`verdicts ${verdicts.join(',')}`)
    // On screen: the lesson's result, still there once it has settled.
    await page.getByRole('heading', { name: 'Lesson complete' }).waitFor({ timeout: 8000 })
    await settle()
    await page.screenshot({ path: '.codex-screenshots/design-preview/flows/lesson-finished.png' })
    if (!(await page.getByRole('heading', { name: 'Lesson complete' }).isVisible())) throw new Error('the result went away')
    const counted = (await page.getByText(/^\d+ of \d+ lessons in .* done$/).first().textContent())?.trim()
    const position = POINT.lessons.findIndex((item) => item.lessonId === lessonId)
    if (counted !== `${position + 1} of ${POINT.lessons.length} lessons in ${POINT.name.en} done`) throw new Error(`the result reads "${counted}"`)
    // And the chapter, back on screen, goes on with the lesson after it.
    await page.getByRole('link', { name: 'Back to the chapter' }).click()
    const following = POINT.lessons[position + 1]
    const go = page.getByRole('link', { name: /^Continue:/ }).first()
    await go.waitFor({ timeout: 8000 })
    await settle()
    const href = await go.getAttribute('href')
    if (following && !href?.endsWith(`/${following.lessonId}`)) throw new Error(`the chapter continues with ${href}`)
    return `${lesson.challenges.length} exercises (${lesson.challenges.map((c) => c.type).join(', ')}); "${counted}"; the chapter continues with ${href}`
  })

  await open({ surface: 'ask-conversation', points: 1000 })
  await flow('Ask sends a message, the answer streams in, both stay in the thread', async () => {
    const question = 'Why is sin 30° one half, again?'
    const box = page.getByPlaceholder(/message/i).first()
    await box.fill(question)
    await box.press('Enter')
    await page.getByText(/no assistant is answering/).first().waitFor({ timeout: 8000 })
    // Past the answer's command and the conversation read back (the local bubbles are dropped then).
    await settle(7000)
    // In the thread's bubbles (the live region says the answer too, unseen).
    const asked = page.locator('[data-message-role="student"]').filter({ hasText: question })
    const answered = page.locator('[data-message-role="assistant"]').filter({ hasText: /no assistant is answering/ })
    if ((await asked.count()) !== 1 || !(await asked.first().isVisible())) throw new Error(`the question is on screen ${await asked.count()} times`)
    if ((await answered.count()) !== 1 || !(await answered.first().isVisible())) throw new Error(`the answer is on screen ${await answered.count()} times`)
    return 'question and answer once each, after 7 s'
  })

  await open({ surface: 'account-menu' })
  await flow('account menu logs out', async () => {
    await page.getByRole('menuitem', { name: /log out/i }).click()
    await page.waitForFunction(() => new URL(window.location.href).searchParams.get('path')?.startsWith('/login'), null, { timeout: 10_000 })
    await settle()
    if (!(await page.locator('input[type="password"]').first().isVisible())) throw new Error('no login form')
    if (await page.locator('[data-account-trigger]').count()) throw new Error('the account menu is still there')
    return `${await route()}`
  })

  await open({ surface: 'map', points: 2000 })
  await flow('the bell opens its notifications, Escape closes them', async () => {
    const bell = page.getByRole('button', { name: /^Notifications/ })
    await bell.click()
    const panel = page.getByText('Notifications', { exact: true })
    await panel.waitFor({ timeout: 5000 })
    await settle(500)
    if ((await bell.getAttribute('aria-expanded')) !== 'true' || !(await panel.isVisible())) throw new Error('the notifications did not open')
    await page.keyboard.press('Escape')
    await settle(500)
    if ((await bell.getAttribute('aria-expanded')) === 'true' || (await panel.isVisible())) throw new Error('Escape did not close them')
    return 'opened, then closed'
  })
  await open({ surface: 'map', points: 1000 })
  await flow('zoom: the wheel zooms in and out continuously; the route follows the star tapped, not the zoom (#134)', async () => {
    const stage = page.locator('[data-starmap-stage]')
    const band = () => stage.getAttribute('data-zoom-band')
    const start = await route()
    await page.mouse.move(660, 430)
    for (let i = 0; i < 10; i += 1) {
      await page.mouse.wheel(0, -100)
      await delay(60)
    }
    await settle(1000)
    if ((await band()) !== 'star' || (await route()) !== start) throw new Error(`zoomed in: band ${await band()}, at ${await route()}`)
    // The star link nearest the middle, where the parallel DOM puts it.
    const star = await page.evaluate(() => {
      let best = null
      for (const link of document.querySelectorAll('a[data-unit]')) {
        const box = link.getBoundingClientRect()
        const d = Math.hypot(box.left + box.width / 2 - 660, box.top + box.height / 2 - 430)
        if (!best || d < best.d) best = { x: box.left + box.width / 2, y: box.top + box.height / 2, d, unit: link.getAttribute('data-unit') }
      }
      return best
    })
    await page.mouse.click(star.x, star.y)
    await settle(1200)
    const chosen = await route()
    if (!chosen?.includes(`/${star.unit}`) || !(await page.locator('article[aria-labelledby="starmap-star-title"]').isVisible())) {
      throw new Error(`tapped ${star.unit}: at ${chosen}`)
    }
    for (let i = 0; i < 16; i += 1) {
      await page.mouse.wheel(0, 100)
      await delay(60)
    }
    await settle()
    const out = await route()
    if (out?.split('?')[0].split('/').length !== 3 || (await band()) !== 'panorama' || (await page.locator('article[aria-labelledby="starmap-star-title"]').count())) {
      throw new Error(`zoomed back out: at ${out}, band ${await band()}`)
    }
    return `${start ?? 'map'} -> ${chosen} -> ${out}`
  })
  await collect()

  await open({ surface: 'map-focus-star', points: 1000 })
  await flow('star drag: the star follows the mouse, its linked stars follow, all spring back; no route change, no card (#136)', async () => {
    await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
    await settle(800)
    const links = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('a[data-unit]')].map((link) => {
          const box = link.getBoundingClientRect()
          return { unit: link.getAttribute('data-unit'), x: box.left + box.width / 2, y: box.top + box.height / 2 }
        }),
      )
    /** The brightest the canvas is within 4 px of `(x, y)`: a star there is bright. */
    const light = (x, y) =>
      page.evaluate(([px, py]) => {
        const canvas = document.querySelector('[data-starmap-stage] canvas')
        const box = canvas.getBoundingClientRect()
        const k = canvas.width / box.width
        // Read through a copy, so the map's own canvas is never read back.
        const side = Math.round(9 * k)
        const copy = document.createElement('canvas')
        copy.width = side
        copy.height = side
        const ctx = copy.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(canvas, Math.round((px - box.left - 4) * k), Math.round((py - box.top - 4) * k), side, side, 0, 0, side, side)
        const data = ctx.getImageData(0, 0, side, side).data
        let most = 0
        for (let i = 0; i < data.length; i += 4) most = Math.max(most, (data[i] + data[i + 1] + data[i + 2]) / 3)
        return most
      }, [x, y])
    const before = await links()
    const star = before.find((s) => s.unit === POINT.unitId)
    if (!star) throw new Error('the demo knowledge point is not on screen')
    const start = await route()
    const to = { x: star.x - 180, y: star.y + 120 }
    const dark = await light(to.x, to.y)
    await page.mouse.move(star.x, star.y)
    await page.mouse.down()
    for (let i = 1; i <= 20; i += 1) {
      await page.mouse.move(star.x + ((to.x - star.x) * i) / 20, star.y + ((to.y - star.y) * i) / 20)
      await delay(16)
    }
    await delay(400)
    const held = await light(to.x, to.y)
    if (!(held > dark + 60)) throw new Error(`the star is not under the hand: brightness ${dark.toFixed(0)} -> ${held.toFixed(0)}`)
    await page.mouse.up()
    await settle()
    const after = new Map((await links()).map((s) => [s.unit, s]))
    const off = before.filter((s) => {
      const a = after.get(s.unit)
      return !a || Math.hypot(a.x - s.x, a.y - s.y) > 0.5
    })
    if (off.length) throw new Error(`${off.length} stars not back in place (${off[0].unit})`)
    if ((await route()) !== start) throw new Error(`the route changed: ${start} -> ${await route()}`)
    if (await page.locator('article[aria-labelledby="starmap-star-title"]').count()) throw new Error('a card opened')
    return `held at brightness ${held.toFixed(0)} (was ${dark.toFixed(0)}); ${before.length} stars back in place; route ${start ?? 'unchanged'}`
  })
  await collect()

  // Expected to FAIL until the star map engine's fix lands (another branch of
  // #123): the switcher snaps back to the galaxy it left.
  await flow('subject switch: the header stays on the galaxy clicked', async () => {
    await page.getByRole('link', { name: 'Physics', exact: true }).first().click()
    await page.waitForFunction(() => new URL(window.location.href).searchParams.get('path')?.includes('physics'), null, { timeout: 5000 })
    await settle()
    const heading = (await page.getByRole('heading', { level: 1 }).first().textContent())?.trim()
    const current = (await page.locator('a[aria-current="page"][href^="/map/"]').first().textContent())?.trim()
    const at = await route()
    if (heading !== 'Physics' || current !== 'Physics' || !at?.startsWith('/map/physics')) {
      throw new Error(`2 s later: heading "${heading}", switcher on "${current}", at ${at}`)
    }
    return `${at}`
  })
  await collect()

  await lightingFlows({ browser, API, flow, watch, open, collect, previewUrl, answer, feedback, button, settle })
} finally {
  await browser.close()
}

for (const line of results) console.log(line)
console.log(`requests outside the dev server: ${leaks.length}`)
for (const line of leaks) console.log(`  ${line}`)
console.log(`requests without a demo answer: ${unanswered.length}`)
for (const line of unanswered) console.log(`  ${line}`)
console.log(`console errors and warnings: ${problems.length}`)
for (const line of problems) console.log(`  ${line}`)
if (leaks.length || unanswered.length || problems.length || results.some((line) => line.startsWith('FAIL'))) process.exitCode = 1
