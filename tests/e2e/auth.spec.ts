import { expect, test } from '@playwright/test'
import { demoUsers, loginAs, logout } from './helpers'

test('student can login and logout', async ({ page }) => {
  await loginAs(page, 'student')
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

  await logout(page)
  await expect(page).toHaveURL(/\/login/)
})

test('student lands on dashboard after protected chat login', async ({ page }) => {
  await page.goto('/chat')
  await expect(page).toHaveURL(/\/login/)

  await page.getByLabel('Email').fill(demoUsers.student.email)
  await page.getByLabel('Password').fill(demoUsers.student.password)
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/chat/)
  await expect(page.getByRole('heading', { name: /new conversation/i })).toBeVisible()
})

test('registration pending verification shows code and resend actions', async ({ page }) => {
  await page.route('**/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: '',
        onboardingStatus: 'email_verification_required',
        emailVerificationStatus: 'pending_verification',
        emailVerificationRequired: true,
        accountActivationStatus: 'pending_email_verification',
        user: {
          id: 'student-new',
          name: 'Student New',
          email: 'new-student@example.com',
          role: 'student',
          preferredLocale: 'en',
          effectiveLocale: 'en',
          subscriptionStatus: 'trial',
          plan: 'free_trial',
          emailVerificationStatus: 'pending_verification',
          emailVerificationRequired: true,
          accountActivationStatus: 'pending_email_verification',
        },
      }),
    })
  })
  await page.route('**/auth/email-verification/resend', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'sent',
        emailVerificationStatus: 'pending_verification',
        emailVerificationRequired: true,
        accountActivationStatus: 'pending_email_verification',
        resendAllowed: false,
      }),
    })
  })

  await page.goto('/register')
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.getByText(/include uppercase and lowercase letters, a number, and a symbol/i)).toBeVisible()
  await page.getByLabel('Name').fill('Student New')
  await page.getByLabel('Email').fill('new-student@example.com')
  await page.getByLabel('Password').fill('ValidPass123!')
  await page.getByLabel(/privacy policy and terms/i).check()
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByLabel('Parent name').fill('Parent New')
  await page.getByLabel('Parent email').fill('parent-new@example.com')
  await page.getByRole('button', { name: /create account/i }).click()

  await expect(page.getByRole('heading', { name: /verify your email/i })).toBeVisible()
  await expect(page.getByText(/not signed in yet/i)).toBeVisible()
  await page.getByRole('button', { name: /send code again/i }).click()
  await expect(page.getByText(/new verification code has been sent/i)).toBeVisible()
})

test('login blocked by email verification supports resend and confirm', async ({ page }) => {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: {
          code: 'email_verification_required',
          message: 'Email verification is required before login.',
          emailVerificationStatus: 'pending_verification',
          accountActivationStatus: 'pending_email_verification',
        },
      }),
    })
  })
  await page.route('**/auth/email-verification/resend', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'already_requested',
        emailVerificationStatus: 'pending_verification',
        emailVerificationRequired: true,
        accountActivationStatus: 'pending_email_verification',
        resendAllowed: false,
      }),
    })
  })
  await page.route('**/auth/email-verification/confirm', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'confirmed',
        emailVerificationStatus: 'verified',
        emailVerificationRequired: false,
        accountActivationStatus: 'active',
        resendAllowed: false,
      }),
    })
  })

  await page.goto('/login')
  await page.getByLabel('Email').fill('blocked@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page.getByRole('heading', { name: /verify your email/i })).toBeVisible()
  await expect(page.getByText(/required before sign-in/i)).toBeVisible()
  await page.getByRole('button', { name: /send code again/i }).click()
  await expect(page.getByText(/already requested recently/i)).toBeVisible()
  await page.getByLabel('Verification code').fill('123456')
  await page.getByRole('button', { name: /verify email/i }).click()
  await expect(page.getByRole('heading', { name: /email verified/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
})

test('email verification explains expired and rate-limited states', async ({ page }) => {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: {
          code: 'email_verification_required',
          message: 'Email verification is required before login.',
        },
      }),
    })
  })
  await page.route('**/auth/email-verification/confirm', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Verification code expired' }),
    })
  })
  await page.route('**/auth/email-verification/resend', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: {
          code: 'verification_resend_limited',
          message: 'Too many verification attempts',
        },
      }),
    })
  })

  await page.goto('/login')
  await page.getByLabel('Email').fill('expired@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByLabel('Verification code').fill('000000')
  await page.getByRole('button', { name: /verify email/i }).click()
  await expect(page.getByText(/verification code has expired/i)).toBeVisible()

  await page.getByRole('button', { name: /send code again/i }).click()
  await expect(page.getByText(/too many verification attempts/i)).toBeVisible()
})
