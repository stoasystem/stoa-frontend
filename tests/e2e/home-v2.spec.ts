import { expect, test } from '@playwright/test'

test('home v2 preview route renders the isolated section skeleton', async ({ page }) => {
  await page.goto('/home-v2')

  await expect(page.getByTestId('home-v2-hero')).toBeVisible()
  await expect(page.getByTestId('home-v2-learning-thread')).toBeVisible()
  await expect(page.getByTestId('home-v2-parent-confidence')).toBeVisible()
  await expect(page.getByTestId('home-v2-parent-note')).toBeVisible()
  await expect(page.getByText('Calmer at home')).toBeVisible()
  await expect(page.getByTestId('home-v2-trust-layer')).toBeVisible()
  await expect(page.getByTestId('home-v2-final-cta')).toBeVisible()
  await expect(page.getByRole('link', { name: /start learning|lernen starten/i }).first()).toBeVisible()
})

test('current homepage remains separate from the home v2 preview route', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('home-v2-hero')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /start learning|lernen starten/i }).first()).toBeVisible()
})
