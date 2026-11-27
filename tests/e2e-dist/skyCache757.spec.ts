import type { MockBackend } from './support/backend'
import { expect, test } from './support/fixtures'
import { guideAlreadySeen } from './support/guide'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// The star map on a return visit (#757). The skeleton can take a couple of seconds on a slow
// backend; the sky a student saw last time is drawn at once instead of the loading screen, and the
// stars around where they last practised are asked for beside the skeleton, not after it.

const SKELETON = '/practice/knowledge-map'
const AROUND = '/practice/knowledge-map/stars'

/** A skeleton the test answers when it says so: a slow backend. */
function holdSkeleton(backend: MockBackend) {
  let release!: () => void
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  backend.holdUntil('GET', SKELETON, () => released)
  return release
}

test('back on the map, the last sky is drawn before the skeleton comes, and the stars around are asked for beside it', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.install()
  await guideAlreadySeen(page)
  await signInAsStudent(page)
  await expect(page.locator('[data-starmap-stage]')).toBeVisible()
  // Kept for the account, for next time.
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('stoa.starmap.sky.')).length)).toBe(1)

  const release = holdSkeleton(backend)
  const skeletonsBefore = backend.callsTo('GET', SKELETON).length
  const aroundBefore = backend.callsTo('GET', AROUND).length
  await page.reload()

  // The skeleton is on the wire and held: the sky is drawn all the same, from the cache.
  await expect.poll(() => backend.callsTo('GET', SKELETON).length).toBeGreaterThan(skeletonsBefore)
  await expect(page.locator('[data-starmap-stage]')).toBeVisible()
  await expect(page.locator('[data-starmap-loading]')).toHaveCount(0)
  // And the stars around were asked for before the skeleton came back.
  await expect.poll(() => backend.callsTo('GET', AROUND).length).toBeGreaterThan(aroundBefore)

  release()
  await expect(page.locator('[data-starmap-stage]')).toBeVisible()
})

test('on a galaxy’s own address, with nothing kept, the stars around are asked for beside the skeleton', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.install()
  await guideAlreadySeen(page)
  await signInAsStudent(page)
  await expect(page.locator('[data-starmap-stage]')).toBeVisible()
  // Nothing kept: as on a first visit.
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('stoa.starmap.sky.')) localStorage.removeItem(key)
  })

  const release = holdSkeleton(backend)
  const skeletonsBefore = backend.callsTo('GET', SKELETON).length
  const aroundBefore = backend.callsTo('GET', AROUND).length
  await page.goto('/map/math')

  await expect.poll(() => backend.callsTo('GET', SKELETON).length).toBeGreaterThan(skeletonsBefore)
  await expect(page.locator('[data-starmap-loading]')).toBeVisible()
  await expect.poll(() => backend.callsTo('GET', AROUND).length).toBeGreaterThan(aroundBefore)
  const around = backend.callsTo('GET', AROUND).at(-1)!
  expect(around.query.get('subjectId')).toBe('math')

  release()
  await expect(page.locator('[data-starmap-stage]')).toBeVisible()
})

test('signing out leaves no sky behind', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.install()
  await guideAlreadySeen(page)
  await signInAsStudent(page)
  await expect(page.locator('[data-starmap-stage]')).toBeVisible()
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('stoa.starmap.sky.')).length)).toBe(1)

  await page.getByRole('button', { name: 'Account' }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await expect(page).toHaveURL('/login')
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('stoa.starmap.sky.')).length)).toBe(0)
})
