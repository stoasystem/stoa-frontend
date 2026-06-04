import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

const reportOne = {
  report_id: 'report-parent-1-student-1-2026-06-01',
  parent_id: 'parent-1',
  student_id: 'student-1',
  student_name: 'Student One',
  week_start: '2026-06-01',
  status: 'email_failed',
  email_status: 'failed',
  artifacts: { json_available: true, html_available: true },
  generation: {
    generated_at: '2026-06-02T10:00:00Z',
    generation_failed_at: null,
    generation_error_class: null,
    generation_error_message: null,
  },
  delivery: {
    parent_email: 'parent@example.com',
    email_sent_at: null,
    email_failed_at: '2026-06-04T10:00:00Z',
    email_error_class: 'MessageRejected',
    email_error_message: 'bad address',
  },
  operations: {
    last_operation: 'resend_email',
    last_operation_result: 'failed',
    last_operation_by: 'admin-1',
    last_operation_at: '2026-06-04T10:00:00Z',
    updated_at: '2026-06-04T10:00:00Z',
  },
  actions: {
    resend_email: { enabled: true, reason: null },
    retry_generation: { enabled: false, reason: 'requires generation_failed' },
  },
}

const reportTwo = {
  report_id: 'report-parent-2-student-2-2026-06-01',
  parent_id: 'parent-2',
  student_id: 'student-2',
  student_name: 'Student Two',
  week_start: '2026-06-01',
  status: 'generation_failed',
  email_status: 'not_sent',
  artifacts: { json_available: false, html_available: false },
  generation: {
    generated_at: null,
    generation_failed_at: '2026-06-04T09:00:00Z',
    generation_error_class: 'RuntimeError',
    generation_error_message: 'bedrock failed',
  },
  delivery: {
    parent_email: 'parent2@example.com',
    email_sent_at: null,
    email_failed_at: null,
    email_error_class: null,
    email_error_message: null,
  },
  operations: {
    last_operation: 'retry_generation',
    last_operation_result: 'failed',
    last_operation_by: 'admin-1',
    last_operation_at: '2026-06-04T09:00:00Z',
    updated_at: '2026-06-04T09:00:00Z',
  },
  actions: {
    resend_email: { enabled: false, reason: 'requires email_failed' },
    retry_generation: { enabled: true, reason: null },
  },
}

test('admin can triage report operations and run selected recovery actions', async ({ page }) => {
  await loginAs(page, 'admin')

  const listRequests: string[] = []
  await page.route('**/admin/reports/ops**', async (route) => {
    listRequests.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 2,
        next_token: null,
        access_pattern: 'bounded_scan',
        items: [reportOne, reportTwo],
      }),
    })
  })
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/ops', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reportOne) })
  })
  await page.route('**/admin/reports/parent-2/student-2/2026-06-01/ops', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reportTwo) })
  })
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/resend', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        report_id: reportOne.report_id,
        status: 'email_sent',
        email_status: 'sent',
        operation: 'resend_email',
        operation_result: 'success',
        updated_at: '2026-06-04T11:00:00Z',
      }),
    })
  })
  await page.route('**/admin/reports/bulk-resend', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'bulk_resend_email',
        count: 1,
        results: [
          {
            parent_id: 'parent-1',
            student_id: 'student-1',
            week_start: '2026-06-01',
            result: 'success',
            report_id: reportOne.report_id,
            status: 'email_sent',
            email_status: 'sent',
            operation: 'resend_email',
            operation_result: 'success',
            updated_at: '2026-06-04T11:00:00Z',
          },
        ],
      }),
    })
  })

  await page.getByLabel('Primary', { exact: true }).getByRole('link', { name: /report ops/i }).click()
  await expect(page).toHaveURL(/\/admin\/report-operations/)
  await expect(page.getByRole('heading', { name: 'Report operations' })).toBeVisible()
  await expect(page.getByText('Student One')).toBeVisible()
  await expect(page.getByText('Student Two')).toBeVisible()

  await page.getByLabel('Week start').fill('2026-06-01')
  await page.getByRole('button', { name: /filter/i }).click()
  expect(listRequests.some((url) => url.includes('week_start=2026-06-01'))).toBeTruthy()

  await page.getByRole('button', { name: /inspect/i }).first().click()
  await expect(page.getByText('Report detail')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Retry$/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: /^Resend$/ })).toBeEnabled()
  await page.getByRole('button', { name: /^Resend$/ }).click()
  await expect(page.getByText('Resend success: email_sent')).toBeVisible()

  await page.getByLabel(`Select ${reportOne.report_id}`).check()
  await page.getByRole('button', { name: /resend selected/i }).click()
  await expect(page.getByText('Bulk resend results')).toBeVisible()
  await expect(page.getByText('success').last()).toBeVisible()

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/weekly-reports\/|json_s3_key|html_s3_key|presignedUrl|https:\/\/s3/i)
})
