import { beforeEach, expect, it } from 'vitest'
import { resetDemoServer } from '@/dev/preview/demoSource'
import { answer } from '@/dev/preview/handlers'

const post = (path: string, body: unknown) => answer({ method: 'POST', path, query: new URLSearchParams(), body })
beforeEach(() => resetDemoServer())

it('refuses the marked login so its failure state can be reviewed', async () => {
  const reply = await post('/auth/login', { email: 'lena.muster@example.com', password: 'Demo#fail' })
  expect(reply).toMatchObject({ status: 401, data: { detail: { code: 'invalid_credentials' } } })
})

it('shows email verification for the unverified demo account', async () => {
  expect(await post('/auth/login', { email: 'unverified@example.com', password: 'Demo-password1!' }))
    .toMatchObject({ status: 403, data: { detail: { code: 'email_verification_required' } } })
})

it('returns the resend state used by the verification panel', async () => {
  expect(await post('/auth/email-verification/resend', { email: 'unverified@example.com' }))
    .toMatchObject({ status: 200, data: { status: 'sent', emailVerificationStatus: 'pending_verification', emailVerificationRequired: true, accountActivationStatus: 'pending_email_verification', resendAllowed: true } })
})

it('rejects a marked verification code', async () => {
  expect(await post('/auth/email-verification/confirm', { email: 'unverified@example.com', confirmationCode: '#fail' }))
    .toMatchObject({ status: 400, data: { detail: { code: 'verification_code_invalid' } } })
})

it('confirms a valid demo verification code', async () => {
  expect(await post('/auth/email-verification/confirm', { email: 'unverified@example.com', confirmationCode: '123456' }))
    .toMatchObject({ status: 200, data: { status: 'confirmed', emailVerificationStatus: 'verified', emailVerificationRequired: false, accountActivationStatus: 'active', resendAllowed: false } })
})
