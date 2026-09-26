import { expect, test } from '@playwright/test'
import { SmokeApi, servedRelease } from './api'
import { readStateFile, record } from './run'

/*
 * The smoke against the real deployment (card 077, stoasystem/stoa-backend#44).
 * The scope, the budget and how an answer is judged are decided in #27:
 * https://github.com/stoasystem/stoa-backend/issues/27#issuecomment-5846611751
 * - when it has to be run is that comment's 「频率」 section.
 *
 * It hits production, so it only finds a bad deployment after the fact; it
 * cannot stop one. It is not in CI. A person runs it after a deploy:
 *
 *   1. Confirm what is live. `curl -s https://app.stoaedu.ch/served-release.json`
 *      gives the releaseId; check against the deploy run that it is the release
 *      you mean. Item 8 needs the frontend at 5899088 or later (#49).
 *   2. Record the five functions (read-only AWS, by hand):
 *        tests/smoke/record-lambda-versions.sh <deploy-run> <backend-commit> <artifact>
 *   3. Run, from the repository root:
 *        STOA_SMOKE_PASSWORD=... STOA_SMOKE_EXPECT_RELEASE_ID=<releaseId or a prefix> \
 *          npm run test:smoke
 *      Only the items a change touches: `-- --grep @item3` (tags below). The
 *      `offline` project always runs first; `-- --project=offline` runs only it.
 *      Item 7 means something only after Monday's 06:00 Zurich report run.
 *   4. Read .smoke/runs/<runId>.json. Every entry with `needsHumanConfirmation`
 *      is an AI answer, and #27 has a person confirm each one: is it in the
 *      right language, does it actually explain rather than refuse, and does
 *      the out-of-curriculum answer give an example or an analogy. That goes
 *      on #44 with the run's versions, linked to #27's log baseline.
 *
 * Files run in name order on one worker, never retried:
 *   01 preflight  release, function versions, the two student profiles    read-only
 *   02 read-only  roles sign in, admin console, item 1, 9 (404 control), 6, 7
 *   03 writes     item 5 (no model), 4 (PDF), 2 (E03), 3 (E01 x2)         3 generations
 *   04 logout     item 8, last, because it revokes every parent@ session
 * Item 10 is the removal of the old `3x + 5 = 20` question; item 3 replaces it.
 *
 * Generation budget: three requests in a normal run (items 2 and 3), at most
 * five per run counting any repeat; run.ts refuses the sixth.
 */

const FUNCTIONS = [
  'stoa-api',
  'stoa-weekly-report',
  'stoa-dispatch-reconciler',
  'stoa-account-deletion',
  'stoa-conversation-generation',
]

test.describe('preflight', { tag: ['@preflight', '@readonly'] }, () => {
  test('the served release is the one that was confirmed', async ({ request, baseURL }, testInfo) => {
    const served = await servedRelease(request, baseURL!)
    const expected = process.env.STOA_SMOKE_EXPECT_RELEASE_ID
    await record(testInfo, 'preflight-release', {
      baseURL,
      environment: served.environment,
      release: served.release,
      confirmedAgainst: expected ?? null,
    })
    expect(served.release.releaseId, 'served-release.json names a release').toMatch(/^[0-9a-f]{16,}$/)
    if (expected) {
      expect(served.release.releaseId, 'the release confirmed against the deploy run').toMatch(
        new RegExp(`^${expected.toLowerCase()}`),
      )
    } else {
      testInfo.annotations.push({
        type: 'unconfirmed',
        description: 'STOA_SMOKE_EXPECT_RELEASE_ID is not set: the served release was recorded, not checked',
      })
    }
  })

  test('the five functions were recorded for this run', async ({ baseURL }, testInfo) => {
    type Versions = {
      recordedAt?: string
      deployRun?: string
      backendCommit?: string
      artifact?: string
      functions?: Record<string, { version?: string; codeSha256?: string }>
    }
    const versions = readStateFile<Versions>('lambda-versions.json')
    expect(
      versions,
      'no .smoke/lambda-versions.json: run tests/smoke/record-lambda-versions.sh first (#27, 频率)',
    ).not.toBeNull()
    await record(testInfo, 'preflight-functions', { baseURL, ...versions })
    const age = Date.now() - Date.parse(versions?.recordedAt ?? '')
    expect(age, 'lambda-versions.json is from before this run; record it again').toBeLessThan(12 * 3600_000)
    for (const field of ['deployRun', 'backendCommit', 'artifact'] as const) {
      expect(versions?.[field], `lambda-versions.json names the ${field}`).toBeTruthy()
    }
    for (const name of FUNCTIONS) {
      const entry = versions?.functions?.[name]
      expect(entry?.version, `${name}: alias target version`).toMatch(/^\d+$/)
      expect(entry?.codeSha256, `${name}: CodeSha256`).toMatch(/^[A-Za-z0-9+/]{43}=$/)
    }
  })

  test('student@ is Grade 6 with math and physics (#50)', async ({ request, baseURL }, testInfo) => {
    const api = await SmokeApi.signIn(request, baseURL!, 'student')
    const { body } = await api.call<{ grade: string; primarySubjects: string[] }>('GET', '/students/me/profile', {
      expect: 200,
    })
    await record(testInfo, 'preflight-student-profile', { grade: body.grade, primarySubjects: body.primarySubjects })
    expect(body.grade, 'student@ grade').toMatch(/(^|\D)6(\D|$)/)
    expect(body.primarySubjects, 'student@ subjects').toEqual(expect.arrayContaining(['math', 'physics']))
  })

  test('agent@ still has a blank grade (#50)', async ({ request, baseURL }, testInfo) => {
    const api = await SmokeApi.signIn(request, baseURL!, 'agent')
    const { body } = await api.call<{ grade: string | null }>('GET', '/students/me/profile', { expect: 200 })
    await record(testInfo, 'preflight-agent-profile', { grade: body.grade })
    expect((body.grade ?? '').trim(), 'agent@ grade has to stay empty for item 5').toBe('')
  })
})
