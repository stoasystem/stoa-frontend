/**
 * The five accounts this platform is tested with, and where each one lands.
 *
 * `agent@` is the student the blank-grade path (stoasystem/stoa-backend#50) is
 * read on. Its grade may be set for other work; item 5 blanks it for the run
 * and puts it back. `student@` is Grade 6 with math and physics.
 *
 * The password is not in the repository. Set `STOA_SMOKE_PASSWORD` before
 * running, and the suite refuses to run without it rather than signing in as
 * something else.
 */
export type SmokeRole = 'student' | 'parent' | 'teacher' | 'admin' | 'agent'

/**
 * Each role's home, from `roleHomePaths` in src/app/router/routeManifest.ts.
 * A student's is the star map at `/`, which is why this is a path and not a
 * pattern: `/` is a prefix of every other one.
 */
export const smokeAccounts: Record<SmokeRole, { email: string; landing: string }> = {
  student: { email: 'student@test.stoaedu.ch', landing: '/' },
  parent: { email: 'parent@test.stoaedu.ch', landing: '/parent' },
  teacher: { email: 'teacher@test.stoaedu.ch', landing: '/teacher' },
  admin: { email: 'admin@test.stoaedu.ch', landing: '/admin' },
  agent: { email: 'agent@test.stoaedu.ch', landing: '/' },
}

/**
 * The password for one role. Four of the accounts share `STOA_SMOKE_PASSWORD`;
 * `agent@` has its own, so `STOA_SMOKE_PASSWORD_AGENT` overrides it for that
 * role. Without the override the shared one is tried, which is what the suite
 * did before the override existed.
 */
export function smokePassword(role?: SmokeRole): string {
  const own = role === 'agent' ? process.env.STOA_SMOKE_PASSWORD_AGENT : undefined
  const password = own || process.env.STOA_SMOKE_PASSWORD
  if (!password) {
    throw new Error(
      'STOA_SMOKE_PASSWORD is not set. These tests sign in to a real deployment; ' +
        'refusing to guess a credential.',
    )
  }
  return password
}
