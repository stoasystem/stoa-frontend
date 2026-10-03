/*
 * The lighting moment's flows (#51), run by design-preview-flows.mjs after
 * the others. Each runs in a browser context of its own, because the demo
 * backend keeps its state per tab (docs/agents/design-preview.md):
 *
 *   1. finish the demo knowledge point's remaining lessons, go back to the
 *      map from the chapter: the flare plays once on its star and the live
 *      region announces it;
 *   2. Ask, opened from the map's composer: a conversation shows the lit card;
 *   3. physics' Refraction now reads "Ready to start";
 *   4. a reload of the tab does not replay it, and the star stays lit;
 *   5. with reduced motion: no animation, the announcement all the same;
 *   6. the flare on a phone, and the card in the Ask sheet.
 *
 * Frames and states land in .codex-screenshots/design-preview/lighting/.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'

/* global window, document, fetch, MutationObserver -- used inside the browser */

const SHOTS = '.codex-screenshots/design-preview/lighting'

export async function lightingFlows({ browser, API, flow, watch, open, collect, previewUrl, answer, feedback, button, settle }) {
  mkdirSync(SHOTS, { recursive: true })
  const sky = JSON.parse(readFileSync('src/dev/demo/sky/demo-sky.json', 'utf8'))
  const point = sky.knowledgePoint
  const bridge = sky.bridge
  const litText = `${point.name.en} is lit`

  /** A browser context of its own: a tab whose demo backend starts from #116's opening state. */
  async function tab(options) {
    const context = await browser.newContext(options)
    // Every value `data-lighting` takes, from the first load on.
    await context.addInitScript(() => {
      window.__lightingPhases = []
      new MutationObserver(() => {
        const phase = document.querySelector('[data-lighting]')?.getAttribute('data-lighting')
        if (phase && window.__lightingPhases.at(-1) !== phase) window.__lightingPhases.push(phase)
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-lighting'] })
    })
    const page = await context.newPage()
    watch(page)
    return { context, page }
  }

  /** Screenshots while the flare plays, every `step` ms. */
  async function frames(page, name, count = 14, step = 150) {
    await page.waitForSelector('[data-lighting="playing"]', { timeout: 10_000 })
    const files = []
    for (let i = 0; i < count; i += 1) {
      const file = `${SHOTS}/${name}-${String(i).padStart(2, '0')}.png`
      await page.screenshot({ path: file })
      files.push(file)
      await delay(step)
    }
    return files
  }

  /** Ask from the map: typing in the docked composer opens it on the list; then a conversation. */
  async function openConversation(page) {
    await page.locator('[data-composer-field]').first().fill('What can I learn next?')
    const first = page.getByRole('button', { name: /sin 30/ }).first()
    await first.waitFor({ timeout: 8000 })
    await first.click()
  }

  const phases = (page) => page.evaluate(() => window.__lightingPhases)
  const announced = (page) => page.locator('[data-lighting-announcer]').textContent()

  const desktop = await tab({ viewport: { width: 1440, height: 900 } })
  const walk = desktop.page
  await flow('lighting: finish the demo knowledge point, back to the map, the flare plays once', async () => {
    for (const lesson of point.lessons.slice(point.lessonsDone)) {
      await open({ path: `/chapter/${point.unitId}/${lesson.lessonId}` }, walk)
      const detail = await walk.evaluate(async ([api, id]) => (await fetch(`${api}/practice/lessons/${id}`)).json(), [API, lesson.lessonId])
      for (const [index, challenge] of detail.challenges.entries()) {
        await answer(challenge, true, walk)
        await button('Check answer', walk).click()
        if ((await feedback(walk)) !== 'correct') throw new Error(`${challenge.id} not accepted`)
        await button(index === detail.challenges.length - 1 ? 'Finish lesson' : 'Next question', walk).click()
      }
      await walk.waitForFunction(
        (id) => window.__stoaPreview.answered.some((entry) => entry.url === `/practice/lessons/${id}/complete`),
        lesson.lessonId,
        { timeout: 8000 },
      )
    }
    await open({ path: `/chapter/${point.unitId}` }, walk)
    if ((await phases(walk)).length) throw new Error('the chapter page celebrated')
    await walk.getByRole('link', { name: 'Star map' }).first().click()
    const files = await frames(walk, 'walk-desktop')
    await walk.waitForSelector('[data-lighting="done"]', { timeout: 10_000 })
    await walk.screenshot({ path: `${SHOTS}/walk-desktop-after.png` })
    const said = await announced(walk)
    if (said !== litText) throw new Error(`announced "${said}"`)
    const seen = await phases(walk)
    if (seen.filter((phase) => phase === 'playing').length !== 1) throw new Error(`phases ${seen.join(',')}`)
    return `${files.length} frames; announced "${said}"; phases ${seen.join(' -> ')}`
  })

  // Before anything reloads the page: the cards are kept in memory (store/litMomentsStore.ts).
  await flow('lighting: Ask shows the lit card', async () => {
    await openConversation(walk)
    const card = walk.locator(`[data-message-role="lit"][data-lit-unit="${point.unitId}"]`)
    await card.waitFor({ timeout: 8000 })
    await settle()
    await walk.screenshot({ path: `${SHOTS}/ask-card-desktop.png` })
    if (!(await card.isVisible())) throw new Error('the card went away')
    const text = (await card.textContent())?.trim() ?? ''
    if (!text.startsWith(litText)) throw new Error(`the card reads "${text}"`)
    return text
  })

  await flow('lighting: Refraction is now ready to start', async () => {
    // Its own nebula, opened by address: the switcher has a step of its own, and the
    // whole sky holds Refraction's star whichever galaxy is in focus.
    await open({ path: `/map/physics/${bridge.topicId}?points=1000` }, walk)
    const star = walk.locator(`a[data-unit="${bridge.unitId}"]`)
    await star.waitFor({ state: 'attached', timeout: 8000 })
    await settle()
    const heading = (await walk.getByRole('heading', { level: 1 }).first().textContent())?.trim()
    const label = (await star.textContent()) ?? ''
    if (!label.includes('Ready to start')) throw new Error(`Refraction reads "${label}"`)
    await walk.screenshot({ path: `${SHOTS}/refraction-ready-desktop.png` })
    return `${label} (heading "${heading}")`
  })

  await flow('lighting: a reload does not replay it', async () => {
    await open({ path: `/map/${'math'}/${point.topicId}/${point.unitId}` }, walk)
    await delay(3000)
    const seen = await phases(walk)
    const said = await announced(walk)
    // The card open is the demo point's own, and it reads Lit.
    const named = await walk.getByRole('heading', { name: point.name.en }).first().isVisible().catch(() => false)
    const state = (await walk.getByText(/· (Lit|In progress|Ready to start|Locked)$/).first().textContent().catch(() => '')) ?? ''
    await walk.screenshot({ path: `${SHOTS}/after-reload-desktop.png` })
    if (seen.some((phase) => phase !== 'idle') || said) throw new Error(`phases ${seen.join(',')}; announced "${said}"`)
    if (!named || !state.endsWith('· Lit')) throw new Error(`the card ${named ? '' : 'of another star '}reads "${state}" after the reload`)
    return `phases ${seen.join(' -> ')}; the star card reads "${state}"`
  })

  await flow('lighting: Refraction\'s star card reads Ready to start', async () => {
    await open({ path: `/map/physics/${bridge.topicId}/${bridge.unitId}` }, walk)
    const card = walk.getByRole('heading', { name: bridge.name.en })
    await card.first().waitFor({ timeout: 8000 })
    await settle()
    const ready = await walk.getByText(/· Ready to start$/).count()
    await walk.screenshot({ path: `${SHOTS}/refraction-card-desktop.png` })
    if (!ready) throw new Error('the card does not read Ready to start')
    return 'yes'
  })
  await collect(walk)
  await desktop.context.close()

  const reduced = await tab({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await flow('lighting: reduced motion, no animation, still announced', async () => {
    await open({ surface: 'lighting' }, reduced.page)
    await settle()
    const seen = await phases(reduced.page)
    const said = await announced(reduced.page)
    await reduced.page.screenshot({ path: `${SHOTS}/reduced-motion-desktop.png` })
    if (seen.includes('playing')) throw new Error(`phases ${seen.join(',')}`)
    if (said !== litText) throw new Error(`announced "${said}"`)
    return `phases ${seen.join(' -> ')}; announced "${said}"`
  })
  await collect(reduced.page)
  await reduced.context.close()

  const phone = await tab({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
  await flow('lighting: the flare on a phone, and the card in the Ask sheet', async () => {
    await phone.page.goto(previewUrl({ surface: 'lighting' }))
    const files = await frames(phone.page, 'phone')
    await phone.page.waitForSelector('[data-lighting="done"]', { timeout: 10_000 })
    await phone.page.screenshot({ path: `${SHOTS}/phone-after.png` })
    const said = await announced(phone.page)
    if (said !== litText) throw new Error(`announced "${said}"`)
    await openConversation(phone.page)
    const card = phone.page.locator(`[data-message-role="lit"][data-lit-unit="${point.unitId}"]`)
    await card.waitFor({ timeout: 8000 })
    await settle()
    await phone.page.screenshot({ path: `${SHOTS}/ask-card-phone.png` })
    if (!(await card.isVisible())) throw new Error('the card is not on screen in the sheet')
    return `${files.length} frames; announced "${said}"; the card in the sheet`
  })
  await collect(phone.page)
  await phone.context.close()
}
