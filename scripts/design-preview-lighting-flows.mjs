/*
 * The lighting moment's flows (#51), run by design-preview-flows.mjs after
 * the others. Each runs in a browser context of its own, because the demo
 * backend keeps its state per tab (docs/agents/design-preview.md):
 *
 *   1. finish the demo knowledge point's remaining lessons, go back to the
 *      map from the chapter: the map opens on the star's nebula seen whole
 *      (#140 F2, the route the nebula's), the star still in progress as the
 *      flare starts and lit after it (F1), the flare plays once and the live
 *      region announces it;
 *   2. Ask, opened from the map's composer: a conversation shows the lit card;
 *   3. physics' Refraction now reads "Ready to start";
 *   4. a reload of the tab does not replay it, and the star stays lit;
 *   5. with reduced motion: no animation, the announcement all the same, and
 *      a still "<name> is lit" label beside the star that goes after a few
 *      seconds, at once, never faded (#140 F3);
 *   6. the flare on a phone, and the card in the Ask sheet;
 *   7. a tap on the star while its lighting is still to come, from the
 *      galaxy, on a desktop and a phone: it lands on the nebula seen whole,
 *      decided before take-off, the star coming straight on to where it
 *      rests -- never turning on the way (#145 C6).
 *
 * Throughout: the recommendation marker stays on the star until the flare's
 * brightest moment and moves on with the gold (#145 C11); the flare's title
 * and the still label say which side of the star they went to
 * (`data-side`), clear of the names at the screen's edge (#145 C14).
 *
 * Frames and states land in .codex-screenshots/design-preview/lighting/.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'

/* global window, document, fetch, MutationObserver, URLSearchParams, getComputedStyle -- used inside the browser */

const SHOTS = process.env.LIGHTING_SHOTS || '.codex-screenshots/design-preview/lighting'

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

  /** Screenshots while the flare plays, every `step` ms; `files.sides`: the side of the star its title went to in each (#145 C14). */
  async function frames(page, name, count = 14, step = 150) {
    await page.waitForSelector('[data-lighting="playing"]', { timeout: 10_000 })
    const files = []
    files.sides = new Set()
    for (let i = 0; i < count; i += 1) {
      const file = `${SHOTS}/${name}-${String(i).padStart(2, '0')}.png`
      await page.screenshot({ path: file })
      files.push(file)
      const side = await page.locator('[data-lighting-caption]').getAttribute('data-side', { timeout: 200 }).catch(() => null)
      if (side) files.sides.add(side)
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
  /** The star's own link in the parallel DOM: its name and state, as the map draws it now. */
  const starReads = (page) => page.locator(`a[data-unit="${point.unitId}"]`).first().textContent({ timeout: 4000 }).catch(() => '')
  /** Where the map is: the route the preview wrote back, what is chosen, and the zoom band. */
  const where = (page) =>
    page.evaluate(() => {
      const stage = document.querySelector('[data-starmap-stage]')
      return { path: new URLSearchParams(window.location.search).get('path') ?? '', layer: stage?.getAttribute('data-layer'), band: stage?.getAttribute('data-zoom-band') }
    })
  /** #140: back from the lighting, on the star's nebula seen whole, the star drawn in progress until the peak and lit after. */
  const nebulaPath = `/map/math/${point.topicId}`
  async function landedInProgress(page) {
    await page.waitForSelector('[data-lighting="playing"]', { timeout: 10_000 })
    const before = (await starReads(page)) ?? ''
    const at = await where(page)
    if (!at.path.startsWith(nebulaPath) || at.path.includes(point.unitId) || at.layer !== 'nebula' || at.band === 'panorama') {
      throw new Error(`landed at ${JSON.stringify(at)}, expected ${nebulaPath} seen whole`)
    }
    if (!before.includes('In progress')) throw new Error(`as the flare starts the star reads "${before}"`)
    // #145 C11: still the recommendation until the brightest moment.
    if (!before.includes('Suggested next')) throw new Error(`as the flare starts the star is not the recommendation: "${before}"`)
    return { at, before }
  }
  async function litAfter(page) {
    const after = (await starReads(page)) ?? ''
    if (!after.includes('Lit')) throw new Error(`after the flare the star reads "${after}"`)
    if (after.includes('Suggested next')) throw new Error(`after the flare the star is still the recommendation: "${after}"`)
    return after
  }

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
    const landed = await landedInProgress(walk)
    const files = await frames(walk, 'walk-desktop')
    await walk.waitForSelector('[data-lighting="done"]', { timeout: 10_000 })
    const lit = await litAfter(walk)
    await walk.screenshot({ path: `${SHOTS}/walk-desktop-after.png` })
    const said = await announced(walk)
    if (said !== litText) throw new Error(`announced "${said}"`)
    const seen = await phases(walk)
    if (seen.filter((phase) => phase === 'playing').length !== 1) throw new Error(`phases ${seen.join(',')}`)
    return `landed on ${landed.at.path} (${landed.at.band}); "${landed.before}" -> "${lit}"; ${files.length} frames, title ${[...files.sides].join('/')}; announced "${said}"; phases ${seen.join(' -> ')}`
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
  await flow('lighting: reduced motion, no animation, still announced, a still label for a few seconds', async () => {
    await open({ surface: 'lighting' }, reduced.page)
    const label = reduced.page.locator('[data-lighting-label]')
    await label.waitFor({ timeout: 10_000 })
    await delay(300)
    const shown = { text: (await label.textContent())?.trim(), visible: await label.isVisible(), opacity: await label.evaluate((element) => element.style.opacity + getComputedStyle(element).transitionDuration), side: await label.getAttribute('data-side') }
    await reduced.page.screenshot({ path: `${SHOTS}/reduced-motion-desktop.png` })
    if (shown.text !== litText || !shown.visible) throw new Error(`the label ${JSON.stringify(shown)}`)
    if (shown.opacity !== '0s') throw new Error(`the label fades: ${shown.opacity}`)
    const at = await where(reduced.page)
    await label.waitFor({ state: 'detached', timeout: 8000 })
    await reduced.page.screenshot({ path: `${SHOTS}/reduced-motion-desktop-after.png` })
    const seen = await phases(reduced.page)
    const said = await announced(reduced.page)
    const lit = await litAfter(reduced.page)
    if (seen.includes('playing')) throw new Error(`phases ${seen.join(',')}`)
    if (said !== litText) throw new Error(`announced "${said}"`)
    return `label "${shown.text}" (${shown.side}), then gone; on ${at.path}; "${lit}"; phases ${seen.join(' -> ')}; announced "${said}"`
  })
  await collect(reduced.page)
  await reduced.context.close()

  const phone = await tab({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
  await flow('lighting: the flare on a phone, and the card in the Ask sheet', async () => {
    await phone.page.goto(previewUrl({ surface: 'lighting' }))
    const landed = await landedInProgress(phone.page)
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
    if (files.sides.size === 0) throw new Error('the title was never placed')
    return `landed on ${landed.at.path}; ${files.length} frames, title ${[...files.sides].join('/')}; announced "${said}"; the card in the sheet`
  })
  await collect(phone.page)
  await phone.context.close()

  // #145 C6: from the galaxy, the star tapped while its lighting is still to come (its flare just
  // started, the star still in progress). The page taps it itself, in the frame the flare starts,
  // and keeps where the star is drawn every frame after (the flare's title follows it).
  for (const [name, options] of [
    ['desktop', { viewport: { width: 1440, height: 900 } }],
    ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }],
  ]) {
    const tapped = await tab(options)
    await tapped.context.addInitScript((unitId) => {
      window.__tapTrace = []
      let at = null
      const frame = (now) => {
        const phase = document.querySelector('[data-lighting]')?.getAttribute('data-lighting')
        const link = document.querySelector(`a[data-unit="${unitId}"]`)
        if (at === null && phase === 'playing' && link) {
          at = now
          window.__tapped = link.textContent
          link.click()
        }
        const caption = document.querySelector('[data-lighting-caption]')
        if (at !== null && caption?.style.transform) {
          const [x, y] = caption.style.transform.match(/-?[\d.]+/g).map(Number)
          window.__tapTrace.push({ t: Math.round(now - at), x, y, side: caption.dataset.side, path: new URLSearchParams(window.location.search).get('path') })
        }
        window.requestAnimationFrame(frame)
      }
      window.requestAnimationFrame(frame)
    }, point.unitId)
    await flow(`lighting: the star tapped before its lighting lands on its nebula seen whole, never turning (${name})`, async () => {
      await tapped.page.goto(previewUrl({ surface: 'lighting', path: '/map/math?points=1000' }))
      await tapped.page.waitForFunction(() => window.__tapped !== undefined, null, { timeout: 15_000 })
      const files = []
      for (let i = 0; i < 10; i += 1) {
        const file = `${SHOTS}/tap-${name}-${String(i).padStart(2, '0')}.png`
        await tapped.page.screenshot({ path: file })
        files.push(file)
        await delay(100)
      }
      await tapped.page.waitForSelector('[data-lighting="done"]', { timeout: 10_000 })
      await settle()
      await tapped.page.screenshot({ path: `${SHOTS}/tap-${name}-after.png` })
      const at = await where(tapped.page)
      const said = await tapped.page.evaluate(() => window.__tapped)
      if (!said.includes('In progress')) throw new Error(`tapped a star that read "${said}"`)
      if (at.path !== `${nebulaPath}?points=1000` || at.layer !== 'nebula') throw new Error(`landed at ${JSON.stringify(at)}, expected ${nebulaPath} seen whole`)
      // Where the star was drawn, frame by frame (one side of it, so the title's offset is the same):
      // every frame as close to where it rests as the frame before, or closer.
      const trace = await tapped.page.evaluate(() => window.__tapTrace)
      const side = trace.at(-1)?.side
      const same = trace.filter((entry) => entry.side === side)
      const end = same.at(-1)
      const away = same.map((entry) => Math.hypot(entry.x - end.x, entry.y - end.y))
      const turned = away.findIndex((distance, i) => i > 0 && distance > away[i - 1] + 1)
      if (turned >= 0) throw new Error(`the star turned back ${same[turned].t} ms after the tap: ${JSON.stringify(same.slice(Math.max(0, turned - 2), turned + 2))}`)
      if (trace.some((entry) => entry.path?.includes(point.unitId))) throw new Error('the route went to the star on the way')
      const lit = await litAfter(tapped.page)
      return `tapped "${said}"; landed on ${at.path} (${at.band}); ${same.length} frames straight on (${Math.round(away[0] ?? 0)} px to go at the first); ${files.length} shots; "${lit}"`
    })
    await collect(tapped.page)
    await tapped.context.close()
  }
}
