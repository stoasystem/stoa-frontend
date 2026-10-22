/*
 * Records the whole first sign-in on the design preview, as one video and a
 * screenshot per step (docs/research/user-onboarding-design.md):
 *
 *   1. the invitation link: choose a password, date of birth
 *   2. sign in
 *   3. plan B: which subject is school on now
 *   4. plan A: the first landing, Murmi beside the recommended star
 *   5. into its chapter
 *   6. its lessons done (fast-forwarded through the demo backend)
 *   7. back to the map: the first lighting, then the galaxy pulled back to,
 *      Murmi beside the next star
 *
 *   node scripts/record-onboarding.mjs --base http://127.0.0.1:5173 [--lang en] [--phone]
 *
 * Needs the dev server running. Output: .codex-screenshots/onboarding/<lang>-<viewport>/
 * (Git-ignored): onboarding.webm and NN-<step>.png.
 */
import { mkdir, rename, readdir } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

/* global window, document -- used inside page.evaluate, in the browser */

const args = process.argv.slice(2)
const arg = (name, fallback) => {
  const at = args.indexOf(`--${name}`)
  return at >= 0 ? args[at + 1] : fallback
}
const base = arg('base', 'http://127.0.0.1:5173')
const lang = arg('lang', 'en')
const phone = args.includes('--phone')
const viewport = phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }
const out = path.resolve('.codex-screenshots', 'onboarding', `${lang}-${phone ? 'phone' : 'desktop'}`)
await mkdir(out, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 1,
  isMobile: phone,
  hasTouch: phone,
  recordVideo: { dir: out, size: viewport },
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

// 3. Plan B.
await page.locator('[data-first-question]').waitFor({ timeout: 15000 })
await step('question', '3 · Which subject is school on? (plan B)', 2600)
await page.locator('[data-first-question] [data-subject="math"]').click()

// 4. Plan A: the first landing.
await page.locator('[data-first-landing] [data-shown]').waitFor({ timeout: 15000 })
await step('landing', '4 · First landing: Murmi beside the recommended star', 3200)
await page.locator('[data-first-landing] a[href^="/chapter/"]').click()

// 5. Its chapter.
await page.waitForURL(/chapter/, { timeout: 15000 }).catch(() => {})
await delay(1200)
await step('chapter', '5 · Into the star’s chapter', 2200)

// 6. Its lessons, fast-forwarded.
await page.evaluate(() => window.__stoaPreviewDemo.finishDemoKnowledgePoint())
await step('lessons-done', '6 · All lessons done (fast-forwarded for the demo)', 1500)
const back = page.locator('main a[href^="/map/"]').first()
await back.click()

// 7. The first lighting, then the galaxy.
await page.locator('[data-lighting="playing"]').waitFor({ timeout: 15000 }).catch(() => {})
await step('lighting', '7 · The first star lights up', 1400)
await page.locator('[data-first-landing] [data-shown]').waitFor({ timeout: 20000 })
await step('reveal', '7 · Pulled back to the whole galaxy: what comes next', 3500)

const video = page.video()
await context.close()
await browser.close()
const recorded = await video.path()
await rename(recorded, path.join(out, 'onboarding.webm'))
console.log(out)
console.log((await readdir(out)).join('\n'))
