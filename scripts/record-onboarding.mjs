/*
 * Records the whole first sign-in on the design preview, as one video and a
 * screenshot per step (docs/research/user-onboarding-design.md):
 *
 *   1. the invitation link: choose a password, date of birth
 *   2. sign in
 *   3. "About you" (#591): year 9, the subjects already ticked
 *   4. plan A: the first landing on the first year-9 star, the demo
 *      knowledge point, Murmi beside it saying it is by year group (plan B's
 *      question is answered by the subjects ticked)
 *   5. "Look around first": Murmi goes, the camera stays
 *
 * The chapter, the first lighting and the reveal are not in this walk-through.
 *
 *   node scripts/record-onboarding.mjs --base http://127.0.0.1:5173 [--lang en] [--phone] [--reduced]
 *
 * `--reduced` records it as a student who asked for less motion
 * (prefers-reduced-motion): crossfades instead of flights.
 *
 * Needs the dev server running. Output: .codex-screenshots/onboarding/<lang>-<viewport>/
 * (Git-ignored): onboarding.webm and NN-<step>.png.
 */
import { mkdir, rename, readdir } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

/* global document -- used inside page.evaluate, in the browser */

const args = process.argv.slice(2)
const arg = (name, fallback) => {
  const at = args.indexOf(`--${name}`)
  return at >= 0 ? args[at + 1] : fallback
}
const base = arg('base', 'http://127.0.0.1:5173')
const lang = arg('lang', 'en')
const phone = args.includes('--phone')
const reduced = args.includes('--reduced')
const viewport = phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }
const out = path.resolve('.codex-screenshots', 'onboarding', `${lang}-${phone ? 'phone' : 'desktop'}${reduced ? '-reduced' : ''}`)
await mkdir(out, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 1,
  isMobile: phone,
  hasTouch: phone,
  recordVideo: { dir: out, size: viewport },
  reducedMotion: reduced ? 'reduce' : 'no-preference',
})
const page = await context.newPage()
let shot = 0

/** A caption along the top of the video: which step this is. Not part of the app. */
async function caption(text) {
  await page.evaluate((words) => {
    let box = document.getElementById('onboarding-recording-caption')
    if (!box) {
      box = document.createElement('div')
      box.id = 'onboarding-recording-caption'
      Object.assign(box.style, {
        position: 'fixed', left: '50%', top: '12px', transform: 'translateX(-50%)', zIndex: 2147483647,
        padding: '6px 14px', borderRadius: '999px', background: 'rgba(0,0,0,0.72)', color: '#fff',
        font: '600 13px system-ui, sans-serif', pointerEvents: 'none', whiteSpace: 'nowrap',
      })
      document.body.append(box)
    }
    box.textContent = words
  }, text)
}

async function step(name, text, hold = 1800) {
  await caption(text)
  await delay(hold)
  shot += 1
  await page.screenshot({ path: path.join(out, `${String(shot).padStart(2, '0')}-${name}.png`) })
}

await page.goto(`${base}/src/dev/preview.html?surface=onboarding&lang=${lang}&fresh=1`)

// 1. The invitation link.
await page.locator('#activation-password').waitFor()
await step('invitation', '1 · The invitation link: choose a password')
await page.locator('#activation-password').pressSequentially('Sternkarte2026', { delay: 25 })
await page.locator('#activation-password-confirm').pressSequentially('Sternkarte2026', { delay: 25 })
await page.locator('#activation-date-of-birth').fill('2011-05-14')
await page.locator('form button[type="submit"]').click()
// The form goes once the claim succeeds; its sign-in link is the page's last one to /login.
await page.locator('#activation-password').waitFor({ state: 'detached' })
await step('activated', '1 · Account activated')
await page.locator('a[href="/login"]').last().click()

// 2. Sign in.
await page.locator('#email').waitFor()
await page.locator('#email').pressSequentially('lea.muster@example.com', { delay: 20 })
await page.locator('#password').pressSequentially('Sternkarte2026', { delay: 20 })
await step('sign-in', '2 · First sign-in', 600)
await page.locator('form button[type="submit"]').click()

// 3. About you (#591).
await page.locator('[data-about-you]').waitFor({ timeout: 15000 })
await step('about-you', '3 · About you: year group and subjects', 2200)
await page.locator('[data-about-you] select').selectOption('grade_9_secondary')
await step('about-you-answered', '3 · Year 9, mathematics and physics', 1200)
await page.locator('[data-about-you] button[type="submit"]').click()

// 4. Plan A: the first landing, by year group.
await page.locator('[data-first-landing] [data-shown]').waitFor({ timeout: 15000 })
await step('landing', '4 · First landing by year group: Murmi beside the recommended star', 3200)
// 5. Looking around first: Murmi goes, the camera stays.
await page.locator('[data-first-landing] button').last().click()
await page.locator('[data-first-landing]').waitFor({ state: 'detached' })
await step('look-around', '5 · Look around first: Murmi goes, the camera stays', 1800)

const video = page.video()
await context.close()
await browser.close()
const recorded = await video.path()
await rename(recorded, path.join(out, 'onboarding.webm'))
console.log(out)
console.log((await readdir(out)).join('\n'))
