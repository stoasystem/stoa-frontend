import { expect, test } from '@playwright/test'

test('home v2 preview route renders the isolated section skeleton', async ({ page }) => {
  await page.goto('/home-v2')

  await expect(page.getByTestId('home-v2-hero')).toBeVisible()
  await expect(page.getByTestId('home-v2-learning-thread')).toBeVisible()
  await expect(page.getByTestId('home-v2-parent-confidence')).toBeVisible()
  await expect(page.getByTestId('home-v2-parent-note')).toBeVisible()
  await expect(page.getByText('Fractions are in focus')).toBeVisible()
  await expect(page.getByTestId('home-v2-trust-layer')).toBeVisible()
  await expect(page.getByText('Support, with a sense of proportion.')).toBeVisible()
  await expect(page.getByTestId('home-v2-trust-principles')).toContainText('A teacher when it matters')
  await expect(page.getByTestId('home-v2-final-cta')).toBeVisible()
  await expect(page.getByRole('link', { name: /start learning|lernen starten/i }).first()).toBeVisible()
})

test('home v2 premium language controls switch all launch languages', async ({ page }) => {
  await page.goto('/home-v2')

  const languageControl = page.getByRole('group', { name: /language/i }).first()
  await expect(languageControl.getByRole('button', { name: 'EN' })).toBeVisible()
  await expect(languageControl.getByRole('button', { name: 'DE' })).toBeVisible()
  await expect(languageControl.getByRole('button', { name: 'FR' })).toBeVisible()
  await expect(languageControl.getByRole('button', { name: 'IT' })).toBeVisible()

  await languageControl.getByRole('button', { name: 'FR' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await expect(page.getByTestId('home-v2-hero').getByRole('heading', { name: /commencer par la question/i })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: /open navigation|close navigation/i }).click()
  await page.getByRole('button', { name: 'IT' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'it')
  await expect(page.getByTestId('home-v2-hero').getByRole('heading', { name: /inizia dalla domanda/i })).toBeVisible()
})

test('current homepage remains separate from the home v2 preview route', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('home-v2-hero')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /start learning|lernen starten/i }).first()).toBeVisible()
})
