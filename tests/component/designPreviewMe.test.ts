/**
 * The design preview's demo backend answers /me's password change (#184): the
 * code is "sent" to the demo student's masked address and the change goes
 * through, and the marker refuses the current password or the code the way
 * the backend does, so each state of the form can be seen.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { demoHeldAccounts } from '@/dev/demo/data'
import { resetDemoServer } from '@/dev/preview/demoSource'
import { answer, DEMO_FAIL_ONCE } from '@/dev/preview/handlers'

const call = (method: string, path: string, body: unknown = null) => Promise.resolve(answer({ method, path, query: new URLSearchParams(), body }))
const post = (path: string, body: unknown) => call('POST', path, body)

beforeEach(() => {
  resetDemoServer()
})

describe('what /me saves in the design preview', () => {
  it('reads back the year group it saved', async () => {
    await call('PATCH', '/students/me/profile', { grade: '10. Klasse' })
    expect((await call('GET', '/students/me/profile'))?.data).toMatchObject({ grade: '10. Klasse' })
  })

  it('answers the backend\'s whole matrix, every category and channel at its default (#184 review)', async () => {
    const read = (await call('GET', '/notifications/preferences'))?.data as { preferences: Record<string, object>; supportedCategories: string[]; supportedChannels: string[] }
    expect(read.supportedCategories).toEqual(['admin_operations', 'assignments', 'learning_updates', 'teacher_responses', 'weekly_reports'])
    expect(read.supportedChannels).toEqual(['email_digest', 'in_app', 'push', 'realtime'])
    for (const category of read.supportedCategories) {
      expect(read.preferences[category]).toEqual({ in_app: true, realtime: true, email_digest: false, push: false })
    }
  })

  it('rebuilds a saved matrix from the defaults, as the backend does: what is left out goes back to its default', async () => {
    await call('PATCH', '/notifications/preferences', { preferences: { assignments: { push: true } } })
    await call('PATCH', '/notifications/preferences', { preferences: { teacher_responses: { in_app: false } } })
    const read = (await call('GET', '/notifications/preferences'))?.data as { preferences: Record<string, object> }
    expect(read.preferences.teacher_responses).toEqual({ in_app: false, realtime: true, email_digest: false, push: false })
    expect(read.preferences.assignments).toEqual({ in_app: true, realtime: true, email_digest: false, push: false })
  })

  it('answers a saved notification switch whole, so the switch stays on the page', async () => {
    const before = (await call('GET', '/notifications/preferences'))?.data as { preferences: Record<string, object> }
    const preferences = { ...before.preferences, teacher_responses: { in_app: false, realtime: false } }
    const saved = (await call('PATCH', '/notifications/preferences', { preferences }))?.data
    expect(saved).toMatchObject({ preferences, supportedCategories: expect.arrayContaining(['teacher_responses']) })
    expect((await call('GET', '/notifications/preferences'))?.data).toMatchObject({ preferences })
  })
})

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
  it('refuses a held account\'s session, so switching to it stays in the preview (#184 review)', async () => {
    // Accepted, the switch would load the real app's start page off the
    // preview, where the real backend is. Refused, it takes the app's own
    // "session expired" path and stays here.
    const [held] = demoHeldAccounts
    const asHeld = await Promise.resolve(answer({ method: 'GET', path: '/auth/me', query: new URLSearchParams(), body: null, token: held.accessToken }))
    expect(asHeld?.status).toBe(401)
    expect(held.refreshToken).toBeUndefined()
    const asDemo = await Promise.resolve(answer({ method: 'GET', path: '/auth/me', query: new URLSearchParams(), body: null, token: 'design-preview' }))
    expect(asDemo?.status).toBe(200)
  })
})
