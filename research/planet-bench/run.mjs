/* global console, process, URL, setTimeout */
// Runs research/planet-bench/index.html through Playwright and prints one JSON
// line per run. Usage (from the repo root, node_modules present):
//   node research/planet-bench/run.mjs [--browsers chromium,webkit] [--headed] [--quick] [--rot 0] [--n 500,1000,2000] [--modes a,b]
// Not part of any npm script or CI gate.
import { chromium, webkit } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const page = 'file://' + path.join(here, 'index.html')
const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const browsers = opt('--browsers', 'chromium,webkit').split(',')
const headed = args.includes('--headed')
const quick = args.includes('--quick')
const modes = opt('--modes', 'svg-filter,svg-filter-front,svg-sprite,svg-sprite-front,canvas2d,webgl').split(',')
const counts = opt('--n', quick ? '1000' : '500,1000,2000').split(',').map(Number)
const secs = quick ? 2 : 4
const rot = opt('--rot', '1')   // 0 = idle: no rotation, only the breathe animation

// "phone" approximates a mid-range handset: 390x844 CSS px at 3x, CPU 4x slower
// (Chrome DevTools' "Mid-tier mobile" preset is 4x). Only Chromium exposes the throttle (CDP).
const profiles = [
  { name: 'desktop', viewport: { width: 1280, height: 800 }, dpr: 2, cpu: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, dpr: 3, cpu: 4 },
]

for (const b of browsers) {
  const launcher = b === 'webkit' ? webkit : chromium
  const browser = await launcher.launch({
    headless: !headed,
    args: b === 'chromium' ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-precise-memory-info'] : [],
  })
  for (const prof of profiles) {
    if (b === 'webkit' && prof.cpu !== 1) continue
    const ctx = await browser.newContext({ viewport: prof.viewport, deviceScaleFactor: prof.dpr, hasTouch: prof.name === 'phone' })
    const tab = await ctx.newPage()
    let cdp = null
    if (b === 'chromium' && prof.cpu !== 1) {
      cdp = await ctx.newCDPSession(tab)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu })
    }
    for (const mode of modes) {
      for (const n of counts) {
        const url = `${page}?mode=${mode}&n=${n}&secs=${secs}&rot=${rot}`
        await tab.goto(url)
        const r = await tab.evaluate(() => window.__bench)
        console.log(JSON.stringify({ browser: b, profile: prof.name, cpuThrottle: prof.cpu, ...r }))
        await new Promise((res) => setTimeout(res, 200))
      }
    }
    await ctx.close()
  }
  await browser.close()
}
