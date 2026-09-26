import { expect, test, type Response } from '@playwright/test'
import { smokeAccounts, type SmokeRole } from './accounts'
import { SmokeApi, apiOrigin } from './api'
import {
  apiSettled,
  expectApiClean,
  isApiUrl,
  pathOf,
  signIn,
  watchApiFailures,
  watchPageErrors,
} from './helpers'
import { deploymentState, record, rememberConversations, runId } from './run'
import { expectedReportWeek } from './week'

// Read-only, and first (#44): nothing in this file writes to production.
//
// The two role passes are from before card 077. They run against a real
// deployment with real accounts because that is where every defect found on
// 2026-09-23 actually lived, each with a green unit suite behind it:
//
//   * a student an administrator opened could not sign in at all
//   * their own profile answered 503 because nobody had set a year group
//   * the account console listed nothing, on a table of thousands of rows

const ROLES = Object.keys(smokeAccounts) as SmokeRole[]

test.describe('every role can sign in and land on its own screen', { tag: '@readonly' }, () => {
  for (const role of ROLES) {
    test(`${role} signs in and the screen comes up clean`, async ({ page }) => {
      const failures = watchApiFailures(page)
      const errors = watchPageErrors(page)

      await signIn(page, role)
      await page.waitForTimeout(4000)

      expect(errors, 'uncaught page errors').toEqual([])
      await expectApiClean(failures)
      // A page that rendered nothing also has no failures.
      expect((await page.locator('body').innerText()).length).toBeGreaterThan(200)
    })
  }
})

test('an administrator sees the accounts that exist', { tag: '@readonly' }, async ({ page }) => {
  const failures = watchApiFailures(page)
  await signIn(page, 'admin')

  await page.goto('/admin/users')
  await page.waitForTimeout(6000)
  const body = await page.locator('body').innerText()

  // The console reads every page of a filtered scan, so the accounts behind the
  // first one have to be here too - the administrator's own was on page two.
  for (const account of Object.values(smokeAccounts)) {
    expect(body, `${account.email} is missing from the console`).toContain(account.email)
  }
  await expectApiClean(failures)
})

test('item 1: a student is refused the account console', { tag: ['@item1', '@readonly'] }, async ({
  page,
  request,
  baseURL,
}, testInfo) => {
  const failures = watchApiFailures(page)
  const adminAnswers: Array<{ status: number; path: string }> = []
  page.on('response', (response: Response) => {
    if (isApiUrl(response.url()) && pathOf(response.url()).startsWith('/admin/')) {
      adminAnswers.push({ status: response.status(), path: pathOf(response.url()) })
    }
  })
  await signIn(page, 'student')

  await page.goto('/admin/users')
  await page.waitForLoadState('networkidle').catch(() => undefined)
  await page.waitForTimeout(2000)
  const landedOn = new URL(page.url()).pathname

  // Redirected away, or every admin read the page made was refused. Either
  // way no admin read may have succeeded, and no account list is on screen.
  expect(adminAnswers.filter((answer) => answer.status < 400), 'admin reads that succeeded for a student').toEqual([])
  const redirected = !landedOn.startsWith('/admin')
  expect(
    redirected || (adminAnswers.length > 0 && adminAnswers.every((answer) => answer.status === 403)),
    `student stayed on ${landedOn} without a 403 (admin reads: ${JSON.stringify(adminAnswers)})`,
  ).toBe(true)
  expect(await page.locator('body').innerText(), 'an account list on the student screen').not.toContain(
    smokeAccounts.admin.email,
  )
  await expectApiClean(failures, [
    { method: 'GET', path: /^\/admin\//, status: 403, optional: true, times: 10, why: 'item 1: a student reads the account console' },
  ])

  // The server's own answer, whatever the screen did.
  const api = await SmokeApi.signIn(request, baseURL!, 'student')
  const direct = await api.call('GET', '/admin/users', { expect: 403 })
  await record(testInfo, 'item1-authorization', { landedOn, redirected, adminAnswers, apiStatus: direct.status, apiBody: direct.body })
})

test('item 9: the watcher sees a 404 the deployment is certain to give', { tag: ['@item9', '@readonly'] }, async ({
  page,
  request,
  baseURL,
}, testInfo) => {
  // The negative control: a clean run means something only if the watcher
  // demonstrably sees a failure on this deployment. No sign-in, nothing written.
  const failures = watchApiFailures(page)
  const origin = await apiOrigin(request, baseURL!)
  const path = `/smoke-negative-control/${runId()}`
  await page.goto('/login')

  const status = await page.evaluate(async (url) => (await fetch(url)).status, `${origin}${path}`)
  await apiSettled(failures)

  await record(testInfo, 'item9-negative-control', { url: `${origin}${path}`, status, seen: [...failures] })
  expect(status, 'the control URL answered 404').toBe(404)
  expect(failures, 'watchApiFailures missed the 404 - its clean results mean nothing').toContain(`404 GET ${path}`)
  await expectApiClean(failures, [{ method: 'GET', path, status: 404, why: 'item 9: the negative control' }])
})

test('item 6: the student still sees every conversation seen before (#11)', { tag: ['@item6', '@readonly'] }, async ({
  request,
  baseURL,
}, testInfo) => {
  // A history-visibility smoke only: nothing here shows the list crossed the
  // index's page boundary (#27, item 6).
  const api = await SmokeApi.signIn(request, baseURL!, 'student')
  const { body } = await api.call<{ items: Array<{ id: string }>; truncated?: boolean }>('GET', '/conversations', {
    expect: 200,
  })
  const ids = body.items.map((item) => item.id)
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  const previous = deploymentState(baseURL!).studentConversationIds
  const listed = new Set(ids)
  const missing = previous.filter((id) => !listed.has(id))
  const truncated = body.truncated === true

  await record(testInfo, 'item6-conversation-list', {
    count: ids.length,
    truncated,
    previouslySeen: previous.length,
    missing,
    duplicates,
    ids,
    note: previous.length === 0
      ? '无历史记录：本次只建立基线'
      : truncated
        ? '完整性覆盖不足：truncated=true，缺失不能直接认定为丢失'
        : '历史可见性冒烟',
  })
  rememberConversations(baseURL!, ids)

  expect(duplicates, 'conversations listed twice').toEqual([])
  if (truncated) {
    testInfo.annotations.push({ type: 'coverage', description: '完整性覆盖不足 (truncated=true)' })
  } else {
    expect(missing, 'conversations seen on an earlier run and no longer listed').toEqual([])
  }
})

test('item 7: the parent sees the student\'s report for last week (#8)', { tag: ['@item7', '@readonly'] }, async ({
  request,
  baseURL,
}, testInfo) => {
  // A report-visibility smoke only (#27, item 7), read after Monday's run.
  const api = await SmokeApi.signIn(request, baseURL!, 'parent')
  const children = await api.call<{ items: Array<{ id: string; userId: string; email: string }> }>(
    'GET',
    '/parents/me/children',
    { expect: 200 },
  )
  const child = children.body.items.find((item) => item.email === smokeAccounts.student.email)
  if (!child) {
    await record(testInfo, 'item7-weekly-report', {
      observed: false,
      note: '未观测，需要先建立关系 (parent@ has no current link to student@)',
    })
    test.skip(true, '未观测，需要先建立关系')
    return
  }

  const week = expectedReportWeek(new Date())
  const byWeek = await api.call<{
    status: string
    report: { reportId: string; studentId: string; weekStart: string; generatedAt?: string | null } | null
    message?: string | null
  }>('GET', `/parents/me/children/${child.id}/reports/${week.weekStart}`, { expect: 200 })
  const latest = await api.call<{ status: string; report: { weekStart: string } | null }>(
    'GET',
    `/parents/me/children/${child.id}/report`,
    { expect: 200 },
  )
  await record(testInfo, 'item7-weekly-report', {
    observed: true,
    expectedWeekStart: week.weekStart,
    runDate: week.runDate,
    settling: week.settling,
    status: byWeek.body.status,
    reportId: byWeek.body.report?.reportId ?? null,
    generatedAt: byWeek.body.report?.generatedAt ?? null,
    weekStart: byWeek.body.report?.weekStart ?? null,
    latestWeekStart: latest.body.report?.weekStart ?? null,
    note: '周报可见性冒烟',
  })
  if (week.settling) {
    testInfo.annotations.push({ type: 'timing', description: `within two hours of the ${week.runDate} run` })
  }

  expect(byWeek.body.status, `report for the week of ${week.weekStart}: ${byWeek.body.message ?? ''}`).toBe('available')
  const report = byWeek.body.report!
  expect([child.id, child.userId], 'the report is the student\'s').toContain(report.studentId)
  expect(report.weekStart, 'the report is for last week').toBe(week.weekStart)
  expect(report.reportId, 'reportId').toBeTruthy()
  expect(Number.isNaN(Date.parse(report.generatedAt ?? '')), 'generatedAt is a time').toBe(false)
})
