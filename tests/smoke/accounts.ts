/**
 * The five accounts this platform is tested with, and where each one lands.
 *
 * The password is not in the repository. Set `STOA_SMOKE_PASSWORD` before
 * running, and the suite refuses to run without it rather than signing in as
 * something else.
 */
export type SmokeRole = 'student' | 'parent' | 'teacher' | 'admin'

export const smokeAccounts: Record<SmokeRole, { email: string; landing: RegExp }> = {
  // The star map at the root: /chat and /learn were the old student pages,
  // withdrawn in #45 and deleted in #54, and now only redirect.
  student: { email: 'student@test.stoaedu.ch', landing: /\/$/ },
  parent: { email: 'parent@test.stoaedu.ch', landing: /\/parent/ },
  teacher: { email: 'teacher@test.stoaedu.ch', landing: /\/teacher/ },
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
