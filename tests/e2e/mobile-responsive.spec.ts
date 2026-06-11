import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'

const mobileViewport = { width: 390, height: 844 }

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }))

  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2)
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2)
}

async function expectMobileShell(page: Page) {
  await expect(page.getByRole('navigation', { name: /mobile primary/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /language/i })).toBeVisible()
}

test.describe('mobile responsive core flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(mobileViewport)
  })

  test('student dashboard, practice, and chat fit a mobile viewport', async ({ page }) => {
    await loginAs(page, 'student')

    for (const route of ['/dashboard', '/practice']) {
      await page.goto(route)
      await expectMobileShell(page)
      await expectNoHorizontalOverflow(page)
    }
    await page.goto('/chat')
    await expectNoHorizontalOverflow(page)

    await expect(page.getByRole('textbox', { name: /first learning question|learning question/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /start conversation|send message/i }).first()).toBeVisible()
  })

  test('parent overview and report surfaces fit a mobile viewport', async ({ page }) => {
    await loginAs(page, 'parent')

    for (const route of ['/parent', '/parent/children/student-anna/report']) {
      await page.goto(route)
      await expectMobileShell(page)
      await expectNoHorizontalOverflow(page)
    }

    await expect(page.getByRole('heading', { name: /weekly report|parent dashboard|your children/i }).first()).toBeVisible()
  })

  test('tutor queue and AI teacher tools fit a mobile viewport', async ({ page }) => {
    await loginAs(page, 'tutor')

    for (const route of ['/tutor', '/tutor/requests/teacher-request-1']) {
      await page.goto(route)
      await expectMobileShell(page)
      await expectNoHorizontalOverflow(page)
    }

    await expect(page.getByRole('heading', { name: /ai teacher tools/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /generate summary draft/i })).toBeVisible()
  })

  test('admin dashboard and moderation surfaces fit a mobile viewport', async ({ page }) => {
    await loginAs(page, 'admin')

    for (const route of ['/admin', '/admin/moderation']) {
      await page.goto(route)
      await expectMobileShell(page)
      await expectNoHorizontalOverflow(page)
    }

    await expect(page.getByRole('heading', { name: /content moderation|pilot operations/i }).first()).toBeVisible()
  })
})
