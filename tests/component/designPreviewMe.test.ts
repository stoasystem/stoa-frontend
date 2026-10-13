/**
 * The design preview's demo backend answers /me's password change (#184): the
 * code is "sent" to the demo student's masked address and the change goes
 * through, and the marker refuses the current password or the code the way
 * the backend does, so each state of the form can be seen.
 */
import { describe, expect, it } from 'vitest'
import { demoHeldAccounts } from '@/dev/demo/data'
import { answer, DEMO_FAIL_ONCE } from '@/dev/preview/handlers'

const post = (path: string, body: unknown) => Promise.resolve(answer({ method: 'POST', path, query: new URLSearchParams(), body }))

describe('the password change in the design preview', () => {
  it('sends a code to the masked address and changes the password', async () => {
    const sent = await post('/auth/password-change/request', { currentPassword: 'Alt-Passwort1' })
    expect(sent).toMatchObject({ status: 200, data: { status: 'sent', maskedRecipient: 'l**********@example.com' } })
    const changed = await post('/auth/password-change/confirm', { currentPassword: 'Alt-Passwort1', code: '123456', newPassword: 'Neu-Passwort1' })
    expect(changed).toEqual({ status: 200, data: { status: 'changed' } })
  })

  it('refuses a marked current password or code with the backend\'s codes, as a 400 that does not sign out', async () => {
    const refused = await post('/auth/password-change/request', { currentPassword: `x${DEMO_FAIL_ONCE}` })
    expect(refused).toMatchObject({ status: 400, data: { detail: { code: 'password_change_credentials_invalid' } } })
    const badCode = await post('/auth/password-change/confirm', { currentPassword: 'x', code: DEMO_FAIL_ONCE, newPassword: 'Neu-Passwort1' })
    expect(badCode).toMatchObject({ status: 400, data: { detail: { code: 'password_change_verification_failed' } } })
  })
})

describe('the accounts the preview holds', () => {
  it('holds another account, never the demo student', () => {
    expect(demoHeldAccounts.length).toBeGreaterThan(0)
    expect(demoHeldAccounts.map((account) => account.email)).not.toContain('lena.muster@example.com')
  })
})
