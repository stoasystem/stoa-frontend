#!/usr/bin/env node
/*
 * End-state checks of the design preview (#123, the audit of `eab0ce3`):
 * each one opens the preview the way a reviewer would and asserts where the
 * page really ends up, after a settle delay. With the dev server running:
 *
 *   node scripts/design-preview-checks.mjs --base http://127.0.0.1:5173 [--only 1,5]
 *
 *   1  lighting the demo point counts on math's map only, not physics' or chemistry's
 *   2  after it, each galaxy recommends at most one star, math its own next one
 *   3  a lit point whose star is off screen is not acknowledged (nor announced)
 *   4  the French and Italian announcement names the star it agrees with
 *   5  a message sent in Ask, and its answer, stay in the thread, and after a reload
 *   6  back on the surface's first route, a reload opens that route
 *   8  the comparison page says a star-count tier is missing instead of showing another
 *
 * Fails (exit 1) on a failed check or a request outside the dev server.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { URL } from 'node:url'
import { chromium } from '@playwright/test'


function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const base = new URL(option('base', 'http://127.0.0.1:5173'))
const only = option('only', '')
const wanted = only ? new Set(only.split(',')) : null
const results = []
const leaks = []
const SETTLE_MS = 2000

const browser = await chromium.launch()

async function tab(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
  const page = await context.newPage()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol === 'data:' || url.protocol === 'blob:') return
    if (url.origin !== base.origin || url.pathname.startsWith('/api')) leaks.push(`${request.method()} ${request.url()}`)
  })
  return { context, page }
}

function previewUrl(query, file = 'preview.html') {
  const url = new URL(`/src/dev/${file}`, base)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value))
  return url.href
}

async function open(page, query) {
  await page.goto(previewUrl(query))
  await page.waitForSelector('html[data-preview-ready="1"]', { timeout: 30_000 })
}

async function check(id, name, run) {
  if (wanted && !wanted.has(id)) return
  try {
    const detail = await run()
    results.push(`ok    #${id} ${name}${detail ? ` - ${detail}` : ''}`)
  } catch (error) {
    results.push(`FAIL  #${id} ${name} - ${String(error.message).split('\n')[0]}`)
  }
}

/** The header's "<lit> of <total> lit" for the galaxy in focus. */
async function litCount(page, subjectId) {
  await page.getByRole('link', { name: { math: 'Mathematics', physics: 'Physics', chemistry: 'Chemistry' }[subjectId], exact: true }).first().waitFor({ timeout: 10_000 })
  await delay(SETTLE_MS)
  const text = await page.getByText(/^\d+ of \d+ lit$/).first().textContent()
  return Number(text.split(' ')[0])
}

/** The demo backend's lit points not acknowledged yet, read from the page's own module. */
const unacknowledged = (page) =>
  page.evaluate(async (file) => (await import(file)).unacknowledgedLit().map((event) => event.unitId), '/src/dev/preview/demoSource.ts')

try {
  await check('1', 'lighting counts only on its own galaxy', async () => {
    const counts = {}
    for (const [label, query] of [['before', { fresh: 1 }], ['after', { surface: 'lighting' }]]) {
      const { context, page } = await tab()
      await open(page, query)
      counts[label] = {}
      for (const subjectId of ['math', 'physics', 'chemistry']) {
        await open(page, { path: `/map/${subjectId}?points=1000` })
        counts[label][subjectId] = await litCount(page, subjectId)
      }
      await context.close()
    }
    const { before, after } = counts
    const expected = { math: before.math + 1, physics: before.physics, chemistry: before.chemistry }
    if (JSON.stringify(after) !== JSON.stringify(expected)) {
      throw new Error(`before ${JSON.stringify(before)}, after ${JSON.stringify(after)}, expected ${JSON.stringify(expected)}`)
    }
    return JSON.stringify(after)
  })

  await check('2', 'at most one recommendation per galaxy, math re-picks its own', async () => {
    const { context, page } = await tab()
    const out = []
    for (const points of [10, 1000]) {
      await open(page, { surface: 'lighting', points })
      const files = ['/src/dev/preview/lighting.tsx', '/src/dev/demo/sky/demoStarMap.ts', '/src/features/starmap/model/starMap.ts', '/src/dev/preview/demoSource.ts', '/src/i18n/index.ts']
      const picked = await page.evaluate(async ([size, modules]) => {
        const [{ demoStarMapOverride }, { demoStarMap }, { subjectOfNebula, orderedStars }, { completedLessons }, { default: i18n }] = await Promise.all(modules.map((file) => import(file)))
        const map = demoStarMapOverride(demoStarMap('math', size, i18n.getFixedT('en', 'starmap'), { language: 'en' }), size, completedLessons())
        const bySubject = {}
        for (const star of map.stars) {
          if (!star.recommendation) continue
          const subjectId = subjectOfNebula(map, star.nebulaId)
          ;(bySubject[subjectId] ??= []).push(star.unitId)
        }
        const math = orderedStars(map).filter((star) => subjectOfNebula(map, star.nebulaId) === 'math')
        const next = math.find((star) => star.state === 'in_progress') ?? math.find((star) => star.state === 'ready')
        return { bySubject, next: next?.unitId ?? null }
      }, [points, files])
      const over = Object.entries(picked.bySubject).filter(([, ids]) => ids.length > 1)
      if (over.length) throw new Error(`${points} stars: ${JSON.stringify(picked.bySubject)}`)
      if ((picked.bySubject.math ?? [])[0] !== picked.next) throw new Error(`${points} stars: math recommends ${picked.bySubject.math ?? 'nothing'}, expected ${picked.next}`)
      out.push(`${points}: ${JSON.stringify(picked.bySubject)}`)
    }
    await context.close()
    return out.join('; ')
  })

  for (const reducedMotion of ['no-preference', 'reduce']) {
    await check('3', `an off-screen lit star is not acknowledged (${reducedMotion})`, async () => {
      const { context, page } = await tab({ reducedMotion })
      // The lighting surface's backend state, on math's Numbers nebula: the
      // galaxy in focus is the point's, but its star (in Trigonometry) is off screen.
      await open(page, { surface: 'lighting', path: '/map/math/numbers?points=1000' })
      await delay(6000)
      const waiting = await unacknowledged(page)
      const phase = await page.locator('[data-lighting]').getAttribute('data-lighting')
      const said = (await page.locator('[data-lighting-announcer]').textContent()) ?? ''
      if (!waiting.includes('demo-sine-cosine') || phase !== 'idle' || said) {
        throw new Error(`off screen: unacknowledged ${JSON.stringify(waiting)}, phase ${phase}, announced "${said}"`)
      }
      // Its own star, on screen: shown, then acknowledged.
      await open(page, { path: '/map/math/trigonometry/demo-sine-cosine?points=1000' })
      await page.waitForSelector('[data-lighting="done"]', { timeout: 15_000 })
      const after = await unacknowledged(page)
      await context.close()
      if (after.length) throw new Error(`shown but still unacknowledged: ${JSON.stringify(after)}`)
      return `waited off screen; shown and acknowledged in math`
    })
  }

  await check('4', 'French and Italian announcements agree with the star', async () => {
    const out = []
    for (const [lang, pattern] of [['fr', /^L’étoile Sinus et cosinus est allumée$/], ['it', /^La stella Seno e coseno è accesa$/]]) {
      const { context, page } = await tab({ reducedMotion: 'reduce' })
      await open(page, { surface: 'lighting', lang })
      const said = (await page.locator('[data-lighting-announcer]').textContent()) ?? ''
      await context.close()
      if (!pattern.test(said)) throw new Error(`${lang}: "${said}"`)
      out.push(said)
    }
    return out.join(' | ')
  })

  for (const surface of ['ask-conversation', 'ask']) {
    await check('5', `Ask keeps what was sent and answered (${surface})`, async () => {
      const { context, page } = await tab()
      await open(page, { surface, points: 1000 })
      const question = `Why is sin 30° one half? (${surface})`
      const box = page.locator('[data-composer-field], textarea').first()
      await box.fill(question)
      await box.press('Enter')
      const seen = async () => ({
        question: await page.getByText(question).first().isVisible().catch(() => false),
        answer: await page.getByText(/no assistant is answering/).first().isVisible().catch(() => false),
      })
      await page.getByText(/no assistant is answering/).first().waitFor({ timeout: 10_000 }).catch(() => {})
      await delay(7000) // past the answer's command and the conversation read back
      const settled = await seen()
      await page.reload()
      await page.waitForSelector('html[data-preview-ready="1"]', { timeout: 30_000 })
      await delay(SETTLE_MS)
      const reloaded = await seen()
      await context.close()
      if (!settled.question || !settled.answer) throw new Error(`after it settled: ${JSON.stringify(settled)}`)
      if (!reloaded.question || !reloaded.answer) throw new Error(`after a reload: ${JSON.stringify(reloaded)}`)
      return 'question and answer in the thread, after a reload too'
    })
  }

  await check('6', 'back on the first route, a reload stays there', async () => {
    const { context, page } = await tab()
    await open(page, { surface: 'chapter' })
    await page.getByRole('link', { name: /^Continue:/ }).first().click()
    await page.getByRole('button', { name: 'Check answer', exact: true }).waitFor({ timeout: 10_000 })
    await page.getByRole('link', { name: /^Back to / }).first().click()
    await page.getByRole('link', { name: /^Continue:/ }).first().waitFor({ timeout: 10_000 })
    const written = new URL(page.url()).search
    await page.reload()
    await page.waitForSelector('html[data-preview-ready="1"]', { timeout: 30_000 })
    await delay(SETTLE_MS)
    const onChapter = await page.getByRole('link', { name: /^Continue:/ }).first().isVisible().catch(() => false)
    const onLesson = await page.getByRole('button', { name: 'Check answer', exact: true }).isVisible().catch(() => false)
    await context.close()
    if (!onChapter || onLesson) throw new Error(`address ${written} reloads to ${onLesson ? 'the lesson' : 'somewhere else'}`)
    return `address ${written}`
  })

  await check('6', 'signed out from the account menu, a reload stays on the login page', async () => {
    const { context, page } = await tab()
    await open(page, { surface: 'account-menu' })
    await page.getByRole('menuitem', { name: /log out/i }).click()
    await page.locator('input[type="password"]').first().waitFor({ timeout: 10_000 })
    const written = new URL(page.url()).search
    await page.reload()
    await page.waitForSelector('html[data-preview-ready="1"]', { timeout: 30_000 })
    await delay(SETTLE_MS)
    const onLogin = await page.locator('input[type="password"]').first().isVisible().catch(() => false)
    const signedIn = await page.locator('[data-account-trigger]').first().isVisible().catch(() => false)
    await context.close()
    if (!onLogin || signedIn) throw new Error(`address ${written} reloads ${signedIn ? 'signed in' : 'off the login page'}`)
    return `address ${written}`
  })

  await check('6', 'a language chosen on the page survives a reload', async () => {
    const { context, page } = await tab()
    await open(page, { surface: 'me', lang: 'en' })
    const before = await page.evaluate(async (file) => (await import(file)).default.resolvedLanguage, '/src/i18n/index.ts')
    await page.evaluate(async (file) => (await import(file)).default.changeLanguage('de'), '/src/i18n/index.ts')
    await delay(500)
    const written = new URL(page.url()).search
    await page.reload()
    await page.waitForSelector('html[data-preview-ready="1"]', { timeout: 30_000 })
    const after = await page.evaluate(async (file) => (await import(file)).default.resolvedLanguage, '/src/i18n/index.ts')
    await context.close()
    if (after !== 'de') throw new Error(`${before} -> de, address ${written} reloads in ${after}`)
    return `address ${written}`
  })

  await check('8', 'the comparison page shows a missing star-count tier as missing', async () => {
    const indexFile = path.resolve('.codex-screenshots/design-preview/index.json')
    await mkdir(path.dirname(indexFile), { recursive: true })
    const saved = await readFile(indexFile, 'utf8').catch(() => null)
    const set = 'zz-audit-check'
    const index = saved ? JSON.parse(saved) : {}
    index[set] = {
      createdAt: new Date().toISOString(),
      shots: ['desktop', 'phone', 'narrow'].map((viewport) => ({ surface: 'map', viewport, points: 1000, file: `map__${viewport}__1000.png` })),
      leaks: [],
      unanswered: [],
    }
    await writeFile(indexFile, `${JSON.stringify(index, null, 2)}\n`)
    try {
      const { context, page } = await tab()
      await page.goto(previewUrl({ mode: 'shots', surface: 'map', points: 2000, before: set }, 'preview-compare.html'))
      await page.getByRole('heading', { name: new RegExp(set) }).waitFor({ timeout: 10_000 })
      await delay(500)
      const images = await page.locator('section img').count()
      const text = await page.locator('section').first().innerText()
      await context.close()
      if (images > 0) throw new Error(`${images} screenshots of another tier shown for 2000 stars`)
      if (!/2000/.test(text)) throw new Error(`no word of the missing 2000 tier: "${text.replace(/\s+/g, ' ').slice(0, 160)}"`)
      return 'missing tier named, nothing substituted'
    } finally {
      if (saved === null) {
        delete index[set]
        await writeFile(indexFile, `${JSON.stringify(index, null, 2)}\n`)
      } else {
        await writeFile(indexFile, saved)
      }
    }
  })
} finally {
  await browser.close()
}

for (const line of results) console.log(line)
console.log(`requests outside the dev server: ${leaks.length}`)
for (const line of leaks) console.log(`  ${line}`)
if (leaks.length || results.some((line) => line.startsWith('FAIL'))) process.exitCode = 1
