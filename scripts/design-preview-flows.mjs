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
 * log out from the account menu; open the bell; switch subject. Then the
 * lighting moment (#51), in `design-preview-lighting-flows.mjs`.
 *
 * The page after finishing the lesson is saved as
 * .codex-screenshots/design-preview/flows/lesson-finished.png.
 *
 * Fails (exit 1) on a failed flow, a request outside the dev server, a request
 * the preview had no demo answer for, or a console error or warning.
 */
import { setTimeout as delay } from 'node:timers/promises'
import { URL } from 'node:url'
import { chromium } from '@playwright/test'
import { lightingFlows } from './design-preview-lighting-flows.mjs'

/* global window, fetch -- used inside page.evaluate, in the browser */

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const base = new URL(option('base', 'http://127.0.0.1:5173'))
const API = 'https://api.design-preview.invalid'
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
    if (url.origin !== base.origin || url.pathname.startsWith('/api/')) leaks.push(`${request.method()} ${request.url()}`)
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
    await page.waitForFunction(() => !new URL(window.location.href).searchParams.get('path')?.startsWith('/login'), null, { timeout: 8000 })
    await page.locator('[data-account-trigger]').first().waitFor({ timeout: 8000 })
    return `now at ${await route()}`
  })

  await open({ surface: 'map-star', points: 1000 })
  await flow('star card of the demo knowledge point opens its chapter', async () => {
    const link = page.locator('a[href^="/chapter/"]').first()
    await link.waitFor({ timeout: 8000 })
    await link.click()
    await page.waitForFunction(() => new URL(window.location.href).searchParams.get('path')?.startsWith('/chapter/'), null, { timeout: 8000 })
    await page.getByRole('heading').first().waitFor()
    return `${await route()}`
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
    await delay(1000)
    await page.screenshot({ path: '.codex-screenshots/design-preview/flows/lesson-finished.png' })
    const journal = await page.evaluate(() => window.__stoaPreview.answered)
    const completed = journal.find((entry) => entry.url === `/practice/lessons/${lessonId}/complete`)
    if (!completed || completed.status !== 200) throw new Error('the lesson was not completed')
    const expected = lesson.challenges.flatMap(() => ['wrong', 'correct'])
    if (JSON.stringify(verdicts) !== JSON.stringify(expected)) throw new Error(`verdicts ${verdicts.join(',')}`)
    // The chapter counts it: the roadmap the chapter reads, in this same page.
    const roadmap = await page.evaluate(async ([api, l]) => (await fetch(`${api}/practice/${l.subjectId}/${l.topicId}/roadmap`)).json(), [API, lesson])
    const lessons = roadmap.units[0].lessons
    if (lessons.find((item) => item.id === lessonId)?.status !== 'completed') throw new Error('the roadmap does not count the lesson')
    const done = lessons.filter((item) => item.status === 'completed').length
    return `${lesson.challenges.length} exercises (${lesson.challenges.map((c) => c.type).join(', ')}); roadmap ${done} of ${lessons.length} done; page now at ${await route()}`
  })

  await open({ surface: 'ask-conversation', points: 1000 })
  await flow('Ask sends a message and streams the answer', async () => {
    const box = page.getByPlaceholder(/message/i).first()
    await box.fill('Why is sin 30° one half?')
    await box.press('Enter')
    await page.getByText(/no assistant is answering/).first().waitFor({ timeout: 8000 })
  })

  await open({ surface: 'account-menu' })
  await flow('account menu logs out', async () => {
    await page.getByRole('menuitem', { name: /log out/i }).click()
    await page.waitForFunction(() => new URL(window.location.href).searchParams.get('path')?.startsWith('/login'), null, { timeout: 10_000 })
  })

  await open({ surface: 'map', points: 2000 })
  await flow('the bell opens', async () => {
    await page.locator('[data-top-bar] button').filter({ hasNot: page.locator('[data-account-trigger]') }).first().click()
    await delay(500)
    await page.keyboard.press('Escape')
  })
  await flow('subject switch', async () => {
    await page.getByRole('link', { name: 'Physics', exact: true }).first().click()
    await page.waitForFunction(() => new URL(window.location.href).searchParams.get('path')?.includes('physics'), null, { timeout: 5000 })
    return `${await route()}`
  })
  await collect()

  await lightingFlows({ browser, API, flow, watch, open, collect, previewUrl, answer, feedback, button })
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
