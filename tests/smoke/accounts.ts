/**
 * The five accounts this platform is tested with, and where each one lands.
 *
 * `agent@` is a student whose profile grade is blank on purpose: it is the
 * account the blank-grade path (stoasystem/stoa-backend#50) is read on, so its
 * grade has to stay empty. `student@` is Grade 6 with math and physics.
 *
 * The password is not in the repository. Set `STOA_SMOKE_PASSWORD` before
 * running, and the suite refuses to run without it rather than signing in as
 * something else.
 */
export type SmokeRole = 'student' | 'parent' | 'teacher' | 'admin' | 'agent'

export const smokeAccounts: Record<SmokeRole, { email: string; landing: RegExp }> = {
  student: { email: 'student@test.stoaedu.ch', landing: /\/(chat|learn)/ },
  parent: { email: 'parent@test.stoaedu.ch', landing: /\/parent/ },
  teacher: { email: 'teacher@test.stoaedu.ch', landing: /\/tutor/ },
  admin: { email: 'admin@test.stoaedu.ch', landing: /\/admin/ },
  agent: { email: 'agent@test.stoaedu.ch', landing: /\/(chat|learn)/ },
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
