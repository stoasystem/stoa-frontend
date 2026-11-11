import type { Locator, Page } from '@playwright/test'
import type { MockBackend } from './support/backend'
import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/*
 * The onboarding cards over the map keep clear of the map's own controls
 * (#625). "About you" lay over the map key at 840 x 760 (by 38 px) and
 * 1280 x 640 (89 px), over the phone's "?" at 375 x 667, and over the
 * where-you-are line there in German; #628 only painted the card on top.
 * jsdom lays nothing out, so this is checked in the built app, in English and
 * in German (longer words, a taller card).
 *
 * Four subjects, so the chips wrap to two rows and the card is at its
 * tallest. Where the card is taller than the room between the controls it
 * scrolls there: what is drawn of it (the card clipped by whatever clips it)
 * is what must keep clear, the wheel must scroll it (the map took every wheel
 * for its zoom), and "Done" must be reachable.
 *
 * Since #643 no key stays on the map at any width: a "?" bottom left, on the
 * zoom pair's line, opens it. The cards keep clear of the "?" and the zoom
 * pair as they kept clear of the key.
 */

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 375, height: 667 },
  { width: 840, height: 760 },
  { width: 1280, height: 800 },
  { width: 1280, height: 640 },
]

const LANGUAGES = [
  { locale: 'en', done: 'Done', unsure: 'Not sure' },
  { locale: 'de', done: 'Fertig', unsure: 'Weiss nicht' },
] as const

/** The map's controls the card must not cover, those drawn at this size. */
const CONTROLS: Record<string, (page: Page) => Locator> = {
  'the "?"': (page) => page.locator('[data-starmap-help-button]'),
  "Ask's button": (page) => page.locator('[data-ask-reopen]'),
  'the zoom pair': (page) => page.locator('[data-starmap-overlay][role=group]'),
  "Ask's docked composer": (page) => page.locator('[data-composer=docked]'),
  // The stage's first overlay: the where-you-are line, the subject switcher, the tally.
  'the top line': (page) => page.locator('[data-starmap-stage] > [data-starmap-overlay]').first().locator('> *'),
}

type Box = { x: number; y: number; width: number; height: number }

function intersection(a: Box, b: Box): Box | null {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const width = Math.min(a.x + a.width, b.x + b.width) - x
  const height = Math.min(a.y + a.height, b.y + b.height) - y
  return width > 0.5 && height > 0.5 ? { x, y, width, height } : null
}

/** Four galaxies, each with a star to start: the sky of a student on four subjects. */
function fourSubjects(backend: MockBackend) {
  const subjects = [
    ['math', 'Mathematics'],
    ['physics', 'Physics'],
    ['german', 'German'],
    ['english', 'English'],
  ]
  backend.on('GET', '/practice/knowledge-map', () => ({
    status: 200,
    body: {
      view: 'skeleton',
      subjectId: 'math',
      galaxies: subjects.map(([subjectId, name]) => ({ subjectId, name, lit: 0, total: 1, enrolled: true })),
      nebulae: subjects.map(([subjectId, name], order) => ({ topicId: `${subjectId}-basics`, name: `${name} basics`, order, subjectId })),
      stars: subjects.map(([subjectId], index) => ({
        unitId: `${subjectId}-first`,
        name: `First ${subjectId} star`,
        nebulaId: `${subjectId}-basics`,
        order: 0,
        state: 'ready',
        progress: 0,
        unmetExercises: 2,
        reviewDue: 0,
        recommendation: { source: 'system' },
        x: 0.2 + index * 0.2,
        y: 0.5,
        skills: [],
        chapter: { lessonCount: 2, lessonsDone: 0, nextLesson: null },
      })),
      prerequisites: [],
      summary: { lit: 0, total: 4, streakDays: 0, score: 0 },
    },
  }))
}

/** What is drawn of `selector`: its box clipped by every ancestor that clips. */
async function drawnBox(page: Page, selector: string): Promise<Box> {
  return page.evaluate(`(() => {
    const card = document.querySelector(${JSON.stringify(selector)})
    const r = card.getBoundingClientRect()
    let left = r.left, top = r.top, right = r.right, bottom = r.bottom
    for (let el = card.parentElement; el; el = el.parentElement) {
      const style = getComputedStyle(el)
      if (style.overflowX === 'visible' && style.overflowY === 'visible') continue
      const c = el.getBoundingClientRect()
      left = Math.max(left, c.left); top = Math.max(top, c.top); right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom)
    }
    return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
  })()`)
}

async function expectClearOfControls(page: Page, cardSelector: string, when: string) {
  const card = await drawnBox(page, cardSelector)
  expect(card.height, `the card is drawn (${when})`).toBeGreaterThan(40)
  for (const [name, controls] of Object.entries(CONTROLS)) {
    for (const control of await controls(page).all()) {
      if (!(await control.isVisible())) continue
      const box = await control.boundingBox()
      if (!box) continue
      expect(intersection(card, box), `the card against ${name} (${when})`).toBeNull()
    }
  }
}

/**
 * No key on the map; the "?" bottom left, its bottom on the zoom pair's
 * (#643), as large as one zoom button: 32 px on a wide stage, a 44 px touch
 * target on a phone. "Wide" is the stage's own width (768); these viewports
 * leave the stage the whole width, so a viewport under 768 is a phone.
 */
async function expectHelpInTheCorner(page: Page, viewport: { width: number; height: number }) {
  await expect(page.locator('[data-starmap-legend]')).toHaveCount(0)
  const help = page.locator('[data-starmap-help-button]')
  await expect(help).toBeVisible()
  const box = (await help.boundingBox())!
  if (viewport.width < 768) {
    expect(box.width, 'the "?" keeps a 44 px target on a phone').toBeGreaterThanOrEqual(44)
    expect(box.height, 'the "?" keeps a 44 px target on a phone').toBeGreaterThanOrEqual(44)
  }
  expect(box.x, 'the "?" is on the left').toBeLessThan(viewport.width / 2)
  const zoomButton = page.locator('[data-starmap-overlay][role=group] button').first()
  if (await zoomButton.isVisible()) {
    const button = (await zoomButton.boundingBox())!
    expect(Math.abs(box.width - button.width), 'the "?" as wide as a zoom button').toBeLessThanOrEqual(0.5)
    expect(Math.abs(box.height - button.height), 'the "?" as tall as a zoom button').toBeLessThanOrEqual(0.5)
  }
  const zoom = await page.locator('[data-starmap-overlay][role=group]').boundingBox()
  if (zoom) {
    // The frames, not the buttons: each sits 3 px inside a 1 px border.
    expect(Math.abs(box.y + box.height - (zoom.y + zoom.height)), 'the "?" on the zoom pair\'s line').toBeLessThanOrEqual(5)
  }
}

/** `target` is scrolled into view and is what the page has at its centre. */
async function expectHitAtCentre(page: Page, target: Locator, selector: string) {
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  expect(box, 'the button is laid out').not.toBeNull()
  const hit = await page.evaluate(`(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    const at = document.elementFromPoint(${box!.x + box!.width / 2}, ${box!.y + box!.height / 2})
    return Boolean(at && target.contains(at))
  })()`)
  expect(hit, 'the element at the button\'s centre is the button').toBe(true)
}

async function expectNoSidewaysScroll(page: Page, width: number) {
  expect(await page.locator('html').evaluate((root) => root.scrollWidth), 'the page does not scroll sideways').toBeLessThanOrEqual(width)
}

/**
 * The card has the same room on both sides (#645): a phone kept the right
 * edge for Ask's button there, which is in the composer's row now.
 */
async function expectCentred(page: Page, cardSelector: string, width: number) {
  const card = (await page.locator(cardSelector).boundingBox())!
  const left = card.x
  const right = width - (card.x + card.width)
  expect(Math.abs(left - right), `the card's room left (${left}) and right (${right})`).toBeLessThanOrEqual(1)
}

for (const language of LANGUAGES) {
  for (const viewport of VIEWPORTS) {
    const size = `${viewport.width} x ${viewport.height}`

    test(`"About you" keeps clear of the map's controls at ${size}, in ${language.locale}`, async ({ page, backend }) => {
      const world = new StudentWorld(backend)
      world.newcomer = true
      world.grade = ''
      world.primarySubjects = []
      world.locale = language.locale
      world.install()
      fourSubjects(backend)
      await page.setViewportSize(viewport)
      await signInAsStudent(page)

      const card = page.locator('[data-about-you] section')
      await expect(card).toBeVisible()
      await expect(card.getByRole('checkbox')).toHaveCount(4)
      await expectHelpInTheCorner(page, viewport)
      await expectClearOfControls(page, '[data-about-you] section', 'as it opens')
      await expectCentred(page, '[data-about-you] section', viewport.width)

      // The buttons keep a gap under the subjects (#625: "Done" touched the chips).
      const done = card.getByRole('button', { name: language.done, exact: true })
      const fieldset = (await card.locator('fieldset').boundingBox())!
      const buttons = (await done.locator('..').boundingBox())!
      expect(buttons.y - (fieldset.y + fieldset.height), 'the gap over the buttons').toBeGreaterThanOrEqual(12)

      // Taller than the room it has, the card scrolls under the wheel (or a finger),
      // whichever of it and its wrapper holds the overflow.
      const scrollers = [card, card.locator('..')]
      let scroller: Locator | null = null
      for (const candidate of scrollers) {
        if (await candidate.evaluate((el) => el.scrollHeight > el.clientHeight + 1)) scroller = candidate
      }
      if (scroller) {
        const drawn = await drawnBox(page, '[data-about-you] section')
        await page.mouse.move(drawn.x + drawn.width / 2, drawn.y + drawn.height / 2)
        await page.mouse.wheel(0, 400)
        await expect.poll(() => scroller.evaluate((el) => el.scrollTop), 'the card scrolls under the wheel').toBeGreaterThan(0)
        await expectClearOfControls(page, '[data-about-you] section', 'scrolled')
      }

      await expectHitAtCentre(page, done, '[data-about-you] button[type=submit]')
      await expectClearOfControls(page, '[data-about-you] section', '"Done" in view')
      await expectNoSidewaysScroll(page, viewport.width)
    })

    test(`the first question keeps clear of the map's controls at ${size}, in ${language.locale}`, async ({ page, backend }) => {
      const world = new StudentWorld(backend)
      world.newcomer = true
      world.primarySubjects = []
      world.locale = language.locale
      world.install()
      fourSubjects(backend)
      await page.setViewportSize(viewport)
      await signInAsStudent(page)

      const card = page.locator('[data-first-question] section')
      await expect(card).toBeVisible()
      await expectHelpInTheCorner(page, viewport)
      await expectClearOfControls(page, '[data-first-question] section', 'as it opens')
      await expectCentred(page, '[data-first-question] section', viewport.width)
      const unsure = card.getByRole('button', { name: language.unsure })
      await expectHitAtCentre(page, unsure, '[data-first-question] section > button:last-child')
      await expectClearOfControls(page, '[data-first-question] section', '"Not sure" in view')
      await expectNoSidewaysScroll(page, viewport.width)
    })
  }
}
