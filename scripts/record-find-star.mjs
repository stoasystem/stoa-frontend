/*
 * PROTOTYPE #476 -- throwaway. Records the find-a-star prototype on the
 * design preview, as one video and a screenshot per step: the three
 * variants, a plain question, Chinese with each recogniser.
 *
 *   node scripts/record-find-star.mjs --base http://127.0.0.1:5173
 *
 * Needs the dev server running. Output: .codex-screenshots/find-star/
 * (Git-ignored): find-star.webm and NN-<step>.png. Captions are Chinese:
 * the recording is for the discussion on #476.
 */
import { mkdir, rename, readdir, rm } from 'node:fs/promises'
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
const viewport = { width: 1280, height: 800 }
const out = path.resolve('.codex-screenshots', 'find-star')
await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport, deviceScaleFactor: 1, recordVideo: { dir: out, size: viewport } })
const page = await context.newPage()
let shot = 0
const problems = []
page.on('console', (message) => {
  if (message.type() === 'error') problems.push(message.text())
})
page.on('pageerror', (error) => problems.push(String(error)))

async function caption(text) {
  await page.evaluate((words) => {
    let box = document.getElementById('find-star-recording-caption')
    if (!box) {
      box = document.createElement('div')
      box.id = 'find-star-recording-caption'
      Object.assign(box.style, {
        position: 'fixed', left: '50%', top: '12px', transform: 'translateX(-50%)', zIndex: 2147483647,
        padding: '6px 14px', borderRadius: '999px', background: 'rgba(0,0,0,0.78)', color: '#fff',
        font: '600 14px system-ui, sans-serif', pointerEvents: 'none', whiteSpace: 'nowrap',
      })
      document.body.append(box)
    }
    box.textContent = words
  }, text)
}

async function step(name, text, hold = 2200) {
  await caption(text)
  await delay(hold)
  shot += 1
  await page.screenshot({ path: path.join(out, `${String(shot).padStart(2, '0')}-${name}.png`) })
}

async function open(variant, recognizer = 'local') {
  await page.goto(`${base}/src/dev/preview.html?surface=find-star&points=1000&lang=en&fresh=1&variant=${variant}&recognizer=${recognizer}`)
  await page.locator('[data-ask-docked] [data-composer-field]').waitFor({ timeout: 20000 })
  await delay(1500)
}

const docked = () => page.locator('[data-ask-docked] [data-composer-field]')
const askField = () => page.locator('[data-ask-surface] [data-composer-field]')

/** Types into the box under the map as a student would: the first key opens Ask (A, C), the rest goes on there. */
async function typeUnderMap(text, { staysDocked = false } = {}) {
  await docked().click()
  const [first, ...rest] = [...text]
  await page.keyboard.type(first)
  if (!staysDocked) await askField().waitFor()
  await delay(150)
  await page.keyboard.type(rest.join(''), { delay: 45 })
}

// A: Enter decides.
await open('A')
await step('a-start', 'A · 回车分流：学生练完三角函数，回到星图', 1500)
await typeUnderMap('I want to keep practising derivatives')
await step('a-typing', 'A · 一打字就进 Ask（现状）；回车时判断是不是「找星」', 1500)
await page.keyboard.press('Enter')
await page.locator('[data-find-star-bubble]').waitFor()
await step('a-found', 'A · 识别为找星：Ask 收起，镜头飞到「导数」，缺的两颗星连成亮路径', 3500)
await page.getByRole('button', { name: 'Skip with a quiz' }).click()
await step('a-quiz', 'A · 「用测验跳过」：说明会发生什么（还没有测验）', 2500)
await page.getByRole('button', { name: /^Start / }).click()
await step('a-start-first', 'A · 「开始第一颗缺的星」：飞到 Rate of change，开它的星卡片，路径留着', 3000)

await open('A')
await typeUnderMap('What is a derivative?')
await page.keyboard.press('Enter')
await step('a-question', 'A · 普通提问「What is a derivative?」：没有练习词 → 照常进 Ask 对话', 3000)

await open('A')
await typeUnderMap('我想继续练导数')
await page.keyboard.press('Enter')
await step('a-zh-local', 'A · 本地识别桩 + 中文「我想继续练导数」：星名只有 de/en/fr/it，对不上 → 退回 Ask', 3200)

await open('A', 'backend')
await typeUnderMap('我想继续练导数')
await page.keyboard.press('Enter')
await page.locator('[data-find-star-bubble]').waitFor()
await step('a-zh-backend', 'A · 模拟后端（target_unit_id）：中文也能找到「导数」', 3200)

// B: suggest while typing.
await open('B')
await typeUnderMap('I want to keep practising derivatives', { staysDocked: true })
await page.locator('[data-find-star-suggest]').waitFor()
await step('b-suggest', 'B · 边打边提示：输入框不弹 Ask，上方出现「在星图上找」提示条；回车仍是提问', 3200)
await page.locator('[data-find-star-suggest] button').click()
await page.locator('[data-find-star-strip]').waitFor()
await step('b-strip', 'B · 点提示条：镜头飞到目标星，路径用输入框上方的步骤条讲', 3800)

await open('B')
await typeUnderMap('What is a derivative?', { staysDocked: true })
await page.locator('[data-find-star-suggest]').waitFor()
await step('b-question', 'B · 提问里出现星名也会给提示条，由学生选；回车 = 提问', 2600)
await page.keyboard.press('Enter')
await askField().waitFor()
await step('b-asked', 'B · 回车：照常进 Ask（草稿带过去）', 2200)

// C: Ask answers.
await open('C', 'backend')
await typeUnderMap('I want to keep practising derivatives')
await page.keyboard.press('Enter')
await page.locator('[data-find-star-card]').waitFor({ timeout: 15000 })
await delay(1500)
await step('c-card', 'C · 全进 Ask：回答带回目标星，对话里附「在星图上看路径」卡片', 3500)
await page.getByRole('button', { name: 'Show the way on the map' }).click()
await page.locator('[data-find-star-bubble]').waitFor()
await step('c-found', 'C · 点卡片：Ask 收起，镜头飞到目标星，路径与 Murmi 同 A', 3500)

const video = page.video()
await context.close()
await browser.close()
await rename(await video.path(), path.join(out, 'find-star.webm'))
console.log(out)
console.log((await readdir(out)).join('\n'))
if (problems.length) {
  console.log('Console errors:')
  for (const problem of problems) console.log(`  ${problem}`)
}
