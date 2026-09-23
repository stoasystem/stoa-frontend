/**
 * The five accounts this platform is tested with, and where each one lands.
 *
 * The password is not in the repository. Set `STOA_SMOKE_PASSWORD` before
 * running, and the suite refuses to run without it rather than signing in as
 * something else.
 */
export type SmokeRole = 'student' | 'parent' | 'teacher' | 'admin'

export const smokeAccounts: Record<SmokeRole, { email: string; landing: RegExp }> = {
  student: { email: 'student@test.stoaedu.ch', landing: /\/(chat|learn)/ },
  parent: { email: 'parent@test.stoaedu.ch', landing: /\/parent/ },
  teacher: { email: 'teacher@test.stoaedu.ch', landing: /\/tutor/ },
  admin: { email: 'admin@test.stoaedu.ch', landing: /\/admin/ },
}

export function smokePassword(): string {
  const password = process.env.STOA_SMOKE_PASSWORD
  if (!password) {
    throw new Error(
      'STOA_SMOKE_PASSWORD is not set. These tests sign in to a real deployment; ' +
        'refusing to guess a credential.',
    )
  }
  return password
}
