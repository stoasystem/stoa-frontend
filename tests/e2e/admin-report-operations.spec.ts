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
    edit_artifact: { enabled: true, reason: null },
    rollback_artifact: { enabled: true, reason: null },
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
    edit_artifact: { enabled: false, reason: 'missing artifact metadata' },
    rollback_artifact: { enabled: false, reason: 'Report is missing rollback artifact metadata' },
  },
}

const reportAudit = {
  items: [
    {
      event_id: 'audit-1',
      event_at: '2026-06-04T11:00:00Z',
      action: 'resend_email',
      result: 'success',
      actor: 'admin-1',
      source: 'admin_api',
      error_message: null,
    },
  ],
  count: 1,
  next_token: null,
  scope: 'report',
}

test('admin can triage report operations and run selected recovery actions', async ({ page }) => {
  await loginAs(page, 'admin')

  const listRequests: string[] = []
  let jobCreated = false
  let generationJobCreated = false
  let generationPreviewStatus: string | null = null
  let resumeJobCreated = false
  let resumePreviewResults: string[] = []
  let editDraftCreated = false
  let editDraftApplied = false
  let artifactPreviewCreated = false
  let artifactEditApplied = false
  let rollbackPreviewCreated = false
  let rollbackApplied = false
  let releaseEvidenceValidated = false
  let fixtureStatusRequested = false
  let retentionStatusRequested = false
  let retentionManifestRequested = false
  let immutableStatusRequested = false
  let immutablePersistRequested = false
  let legalHoldStatusRequested = false
  let legalHoldRequested = false
  let governanceStatusRequested = false
  let governanceApprovalRequested = false
  let legalHoldReviewRequested = false
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
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/audit', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reportAudit) })
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
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/edit-drafts', async (route) => {
    const body = route.request().postDataJSON() as { proposed_fields?: Record<string, string> }
    editDraftCreated = body.proposed_fields?.admin_note === 'Reviewed for parent follow-up'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        draft_id: 'draft-1',
        report_id: reportOne.report_id,
        parent_id: reportOne.parent_id,
        student_id: reportOne.student_id,
        week_start: reportOne.week_start,
        source_updated_at: '2026-06-04T10:00:00Z',
        created_by: 'admin-1',
        created_at: '2026-06-05T10:00:00Z',
        updated_at: '2026-06-05T10:00:00Z',
        reason: 'Admin metadata correction',
        proposed_fields: { admin_note: 'Reviewed for parent follow-up' },
        status: 'draft',
        applied_by: null,
        applied_at: null,
      }),
    })
  })
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/edit-drafts/draft-1/apply', async (route) => {
    editDraftApplied = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'edit_report',
        operation_result: 'success',
        draft: {
          draft_id: 'draft-1',
          report_id: reportOne.report_id,
          parent_id: reportOne.parent_id,
          student_id: reportOne.student_id,
          week_start: reportOne.week_start,
          source_updated_at: '2026-06-04T10:00:00Z',
          created_by: 'admin-1',
          created_at: '2026-06-05T10:00:00Z',
          updated_at: '2026-06-05T10:01:00Z',
          reason: 'Admin metadata correction',
          proposed_fields: { admin_note: 'Reviewed for parent follow-up' },
          status: 'applied',
          applied_by: 'admin-1',
          applied_at: '2026-06-05T10:01:00Z',
        },
        report: {
          status: 'email_failed',
          email_status: 'failed',
          admin_note: 'Reviewed for parent follow-up',
          last_operation: 'edit_report',
          last_operation_result: 'success',
        },
      }),
    })
  })
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/artifact-edit-previews', async (route) => {
    const body = route.request().postDataJSON() as { proposed_fields?: Record<string, unknown> }
    artifactPreviewCreated = body.proposed_fields?.summary === 'Updated parent-facing summary'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        draft_id: 'artifact-draft-1',
        report_id: reportOne.report_id,
        parent_id: reportOne.parent_id,
        student_id: reportOne.student_id,
        week_start: reportOne.week_start,
        source_updated_at: '2026-06-04T10:00:00Z',
        source_artifact_version_id: null,
        created_by: 'admin-1',
        created_at: '2026-06-05T10:02:00Z',
        updated_at: '2026-06-05T10:02:00Z',
        reason: 'Parent-safe artifact wording correction',
        proposed_fields: { summary: 'Updated parent-facing summary' },
        diff: [{ field: 'summary', before: 'Original summary', after: 'Updated parent-facing summary', changed: true }],
        status: 'draft',
        applied_by: null,
        applied_at: null,
        artifact_version_id: null,
      }),
    })
  })
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/artifact-edit-previews/artifact-draft-1/apply', async (route) => {
    artifactEditApplied = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'edit_report_artifact',
        operation_result: 'success',
        draft: {
          draft_id: 'artifact-draft-1',
          report_id: reportOne.report_id,
          parent_id: reportOne.parent_id,
          student_id: reportOne.student_id,
          week_start: reportOne.week_start,
          source_updated_at: '2026-06-04T10:00:00Z',
          source_artifact_version_id: null,
          created_by: 'admin-1',
          created_at: '2026-06-05T10:02:00Z',
          updated_at: '2026-06-05T10:03:00Z',
          reason: 'Parent-safe artifact wording correction',
          proposed_fields: { summary: 'Updated parent-facing summary' },
          diff: [{ field: 'summary', before: 'Original summary', after: 'Updated parent-facing summary', changed: true }],
          status: 'applied',
          applied_by: 'admin-1',
          applied_at: '2026-06-05T10:03:00Z',
          artifact_version_id: 'v20260605T100300Z-safe',
        },
        report: {
          report_id: reportOne.report_id,
          status: 'email_failed',
          artifact_version_id: 'v20260605T100300Z-safe',
          previous_artifact_version_id: null,
          last_operation: 'edit_report_artifact',
          last_operation_result: 'success',
        },
      }),
    })
  })
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/artifact-rollback-previews', async (route) => {
    const body = route.request().postDataJSON() as { reason?: string }
    rollbackPreviewCreated = body.reason === 'Restore previous artifact version'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        preview_id: 'rollback-preview-1',
        report_id: reportOne.report_id,
        parent_id: reportOne.parent_id,
        student_id: reportOne.student_id,
        week_start: reportOne.week_start,
        source_updated_at: '2026-06-05T10:03:00Z',
        source_artifact_version_id: 'v20260605T100300Z-safe',
        target_artifact_version_id: 'original',
        created_by: 'admin-1',
        created_at: '2026-06-05T10:04:00Z',
        updated_at: '2026-06-05T10:04:00Z',
        reason: 'Restore previous artifact version',
        status: 'draft',
        validation_result: 'passed',
        applied_by: null,
        applied_at: null,
        artifact_version_id: null,
      }),
    })
  })
  await page.route('**/admin/reports/parent-1/student-1/2026-06-01/artifact-rollback-previews/rollback-preview-1/apply', async (route) => {
    rollbackApplied = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'rollback_report_artifact',
        operation_result: 'success',
        preview: {
          preview_id: 'rollback-preview-1',
          report_id: reportOne.report_id,
          parent_id: reportOne.parent_id,
          student_id: reportOne.student_id,
          week_start: reportOne.week_start,
          source_updated_at: '2026-06-05T10:03:00Z',
          source_artifact_version_id: 'v20260605T100300Z-safe',
          target_artifact_version_id: 'original',
          created_by: 'admin-1',
          created_at: '2026-06-05T10:04:00Z',
          updated_at: '2026-06-05T10:05:00Z',
          reason: 'Restore previous artifact version',
          status: 'applied',
          validation_result: 'passed',
          applied_by: 'admin-1',
          applied_at: '2026-06-05T10:05:00Z',
          artifact_version_id: 'original',
        },
        report: {
          report_id: reportOne.report_id,
          status: 'email_failed',
          artifact_version_id: 'original',
          previous_artifact_version_id: 'v20260605T100300Z-safe',
          last_operation: 'rollback_report_artifact',
          last_operation_result: 'success',
        },
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
  await page.route('**/admin/reports/recovery-jobs/resend-email/preview', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'resend_email',
        reason: 'Incident email delivery recovery',
        requested_by: 'admin-1',
        filters: { status: 'email_failed', week_start: '2026-06-01', parent_id: null, student_id: null },
        max_targets: 25,
        scanned_pages: 1,
        eligible_count: 1,
        refused_count: 0,
        missing_count: 0,
        sample: [
          {
            target_id: reportOne.report_id,
            report_id: reportOne.report_id,
            parent_id: reportOne.parent_id,
            student_id: reportOne.student_id,
            student_name: reportOne.student_name,
            week_start: reportOne.week_start,
            status: reportOne.status,
            email_status: reportOne.email_status,
            artifacts: { html_available: true, json_available: true },
            eligibility: 'eligible',
            refusal_reason: null,
          },
        ],
        preview_token: 'preview-token',
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/retry-generation/preview', async (route) => {
    const body = route.request().postDataJSON() as { filters?: { status?: string } }
    generationPreviewStatus = body.filters?.status ?? null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'retry_generation',
        reason: 'Incident generation retry recovery',
        requested_by: 'admin-1',
        filters: { status: 'generation_failed', week_start: '2026-06-01', parent_id: null, student_id: null },
        max_targets: 25,
        scanned_pages: 1,
        eligible_count: 1,
        refused_count: 0,
        missing_count: 0,
        sample: [
          {
            target_id: reportTwo.report_id,
            report_id: reportTwo.report_id,
            parent_id: reportTwo.parent_id,
            student_id: reportTwo.student_id,
            student_name: reportTwo.student_name,
            week_start: reportTwo.week_start,
            status: reportTwo.status,
            email_status: reportTwo.email_status,
            artifacts: { html_available: false, json_available: false },
            eligibility: 'eligible',
            refusal_reason: null,
          },
        ],
        preview_token: 'generation-preview-token',
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/resend-email', async (route) => {
    jobCreated = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'job-1',
        job_type: 'resend_email',
        status: 'queued',
        reason: 'Incident email delivery recovery',
        created_by: 'admin-1',
        created_at: '2026-06-04T11:05:00Z',
        updated_at: '2026-06-04T11:05:00Z',
        filters: { status: 'email_failed', week_start: '2026-06-01' },
        target_count: 1,
        pending_count: 1,
        attempted_count: 0,
        success_count: 0,
        refused_count: 0,
        not_found_count: 0,
        failed_count: 0,
        skipped_cancelled_count: 0,
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/retry-generation', async (route) => {
    generationJobCreated = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'job-2',
        job_type: 'retry_generation',
        status: 'queued',
        reason: 'Incident generation retry recovery',
        created_by: 'admin-1',
        created_at: '2026-06-04T11:10:00Z',
        updated_at: '2026-06-04T11:10:00Z',
        filters: { status: 'generation_failed', week_start: '2026-06-01' },
        target_count: 1,
        pending_count: 1,
        attempted_count: 0,
        success_count: 0,
        refused_count: 0,
        not_found_count: 0,
        failed_count: 0,
        skipped_cancelled_count: 0,
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-1/results', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            target_id: reportOne.report_id,
            report_id: reportOne.report_id,
            parent_id: reportOne.parent_id,
            student_id: reportOne.student_id,
            student_name: reportOne.student_name,
            week_start: reportOne.week_start,
            result: 'pending',
            status: 'email_failed',
            email_status: 'failed',
          },
        ],
        count: 1,
        next_token: null,
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-1/audit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            event_id: 'job-audit-1',
            event_at: '2026-06-04T11:05:00Z',
            action: 'create_resend_job',
            result: 'queued',
            actor: 'admin-1',
            source: 'admin_api',
          },
        ],
        count: 1,
        next_token: null,
        scope: 'recovery_job',
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-2/results', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            target_id: reportTwo.report_id,
            report_id: reportTwo.report_id,
            parent_id: reportTwo.parent_id,
            student_id: reportTwo.student_id,
            student_name: reportTwo.student_name,
            week_start: reportTwo.week_start,
            result: 'pending',
            status: 'generation_failed',
            email_status: 'not_sent',
          },
        ],
        count: 1,
        next_token: null,
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-2/audit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            event_id: 'job-audit-2',
            event_at: '2026-06-04T11:10:00Z',
            action: 'create_retry_generation_job',
            result: 'queued',
            actor: 'admin-1',
            source: 'admin_api',
          },
        ],
        count: 1,
        next_token: null,
        scope: 'recovery_job',
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-3/results', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            target_id: 'target-resume-1',
            report_id: reportTwo.report_id,
            parent_id: reportTwo.parent_id,
            student_id: reportTwo.student_id,
            student_name: reportTwo.student_name,
            week_start: reportTwo.week_start,
            result: 'failed',
            status: 'generation_failed',
            email_status: 'not_sent',
            detail: 'provider failed',
          },
        ],
        count: 1,
        next_token: null,
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-3/audit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            event_id: 'job-audit-3',
            event_at: '2026-06-04T11:12:00Z',
            action: 'complete_retry_generation_job',
            result: 'completed_with_failures',
            actor: 'weekly-report-worker',
            source: 'weekly_report_lambda',
          },
        ],
        count: 1,
        next_token: null,
        scope: 'recovery_job',
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-3/resume/preview', async (route) => {
    const body = route.request().postDataJSON() as { results?: string[] }
    resumePreviewResults = body.results ?? []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'resume_recovery_job',
        source_job_id: 'job-3',
        job_type: 'retry_generation',
        reason: 'Resume failed recovery targets',
        requested_by: 'admin-1',
        result_filters: ['failed', 'refused', 'not_found', 'skipped_cancelled'],
        max_targets: 25,
        scanned_targets: 1,
        eligible_count: 1,
        refused_count: 0,
        missing_count: 0,
        sample: [
          {
            target_id: 'target-resume-1',
            report_id: reportTwo.report_id,
            parent_id: reportTwo.parent_id,
            student_id: reportTwo.student_id,
            student_name: reportTwo.student_name,
            week_start: reportTwo.week_start,
            status: 'generation_failed',
            email_status: 'not_sent',
            source_result: 'failed',
            detail: 'provider failed',
            artifacts: { html_available: false, json_available: false },
            eligibility: 'eligible',
            refusal_reason: null,
          },
        ],
        preview_token: 'resume-preview-token',
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-3/resume', async (route) => {
    resumeJobCreated = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'job-4',
        job_type: 'retry_generation',
        status: 'queued',
        reason: 'Resume failed recovery targets',
        created_by: 'admin-1',
        created_at: '2026-06-04T11:15:00Z',
        updated_at: '2026-06-04T11:15:00Z',
        filters: { source_job_id: 'job-3', result_filters: ['failed'] },
        source_job_id: 'job-3',
        resume_result_filters: ['failed', 'refused', 'not_found', 'skipped_cancelled'],
        target_count: 1,
        pending_count: 1,
        attempted_count: 0,
        success_count: 0,
        refused_count: 0,
        not_found_count: 0,
        failed_count: 0,
        skipped_cancelled_count: 0,
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-3/support-package**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        exported_at: '2026-06-05T08:10:00Z',
        request_id: 'req-support-1',
        scope: 'support_package',
        complete: true,
        job: {
          job_id: 'job-3',
          job_type: 'retry_generation',
          status: 'completed_with_failures',
          reason: 'Incident resumable recovery',
          target_count: 1,
          pending_count: 0,
          attempted_count: 1,
          success_count: 0,
          refused_count: 0,
          not_found_count: 0,
          failed_count: 1,
          skipped_cancelled_count: 0,
        },
        source_job: null,
        rollup: { target_count: 1, failed_count: 1 },
        targets: [{ target_id: 'target-resume-1', result: 'failed', source_target_result: 'failed' }],
        job_audit: [],
        report_audit: [],
        operator_note: null,
        next_tokens: { targets: null, job_audit: null, report_audit: null },
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, redacted_operator_note: false },
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs/job-4/results', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], count: 0, next_token: null }) })
  })
  await page.route('**/admin/reports/recovery-jobs/job-4/audit', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], count: 0, next_token: null, scope: 'recovery_job' }) })
  })
  await page.route('**/admin/reports/recovery-jobs/job-1/cancel', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'job-1',
        job_type: 'resend_email',
        status: 'cancellation_requested',
        reason: 'Incident email delivery recovery',
        created_by: 'admin-1',
        created_at: '2026-06-04T11:05:00Z',
        updated_at: '2026-06-04T11:06:00Z',
        filters: { status: 'email_failed', week_start: '2026-06-01' },
        target_count: 1,
        pending_count: 1,
        attempted_count: 0,
        success_count: 0,
        refused_count: 0,
        not_found_count: 0,
        failed_count: 0,
        skipped_cancelled_count: 0,
      }),
    })
  })
  await page.route('**/admin/reports/recovery-evidence**', async (route) => {
    const url = new URL(route.request().url())
    const jobId = url.searchParams.get('job_id')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        exported_at: '2026-06-05T08:00:00Z',
        request_id: 'req-evidence-1',
        scope: jobId ? 'recovery_job' : 'recent_recovery_jobs',
        complete: true,
        filters: jobId ? { job_id: jobId } : { status: 'email_failed', limit: 25 },
        jobs: [
          {
            job_id: 'job-1',
            job_type: 'resend_email',
            status: 'queued',
            reason: 'Incident email delivery recovery',
            created_by: 'admin-1',
            created_at: '2026-06-04T11:05:00Z',
            updated_at: '2026-06-04T11:05:00Z',
            filters: { status: 'email_failed', week_start: '2026-06-01' },
            target_count: 1,
            pending_count: 1,
            attempted_count: 0,
            success_count: 0,
            refused_count: 0,
            not_found_count: 0,
            failed_count: 0,
            skipped_cancelled_count: 0,
          },
        ],
        targets: jobId
          ? [
              {
                target_id: reportOne.report_id,
                report_id: reportOne.report_id,
                parent_id: reportOne.parent_id,
                student_id: reportOne.student_id,
                student_name: reportOne.student_name,
                week_start: reportOne.week_start,
                result: 'pending',
                status: 'email_failed',
                email_status: 'failed',
              },
            ]
          : [],
        job_audit: jobId
          ? [
              {
                event_id: 'job-audit-1',
                event_at: '2026-06-04T11:05:00Z',
                action: 'create_resend_job',
                result: 'queued',
                actor: 'admin-1',
                source: 'admin_api',
              },
            ]
          : [],
        report_audit: [],
        next_tokens: { jobs: null, targets: null, job_audit: null, report_audit: null },
        privacy: { metadata_only: true, private_artifact_fields_omitted: true },
      }),
    })
  })
  await page.route('**/admin/reports/audit-retention/status', async (route) => {
    retentionStatusRequested = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        checked_at: '2026-06-07T12:00:00Z',
        request_id: 'req-retention-status-1',
        scope_count: 2,
        items: [
          {
            reference: { scope: 'recovery_job', job_id: 'job-1' },
            status: 'unsealed',
            reason: null,
            counts: { jobs: 1, targets: 1, job_audit: 1 },
            privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
          },
          {
            reference: { scope: 'report', parent_id: reportOne.parent_id, student_id: reportOne.student_id, week_start: reportOne.week_start },
            status: 'unsealed',
            reason: null,
            counts: { reports: 1, report_audit: 1 },
            privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
          },
        ],
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/audit-retention/manifest', async (route) => {
    retentionManifestRequested = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        manifest_id: 'audit-retention-1',
        generated_at: '2026-06-07T12:01:00Z',
        generated_by: 'admin-1',
        reason: 'Seal metadata-only audit evidence',
        scope: {
          references: [{ scope: 'recovery_job', job_id: 'job-1' }, { scope: 'report', parent_id: reportOne.parent_id, student_id: reportOne.student_id, week_start: reportOne.week_start }],
          reference_count: 2,
        },
        retention_category: 'incident',
        retention_clock: { source: 'audit_event_at', started_at: '2026-06-07T12:01:00Z' },
        items: [
          {
            item_id: 'recovery_job-abc123',
            scope: 'recovery_job',
            reference: { scope: 'recovery_job', job_id: 'job-1' },
            status: 'sealed',
            summary: { scope: 'recovery_job', complete: true },
            digest: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
          },
        ],
        verification: {
          item_count: 1,
          missing_references: [],
          skipped_references: [],
          refusal_reasons: [],
          privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
          manifest_digest: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
        },
        status: 'sealed',
      }),
    })
  })
  await page.route('**/admin/reports/immutable-evidence/status', async (route) => {
    immutableStatusRequested = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        checked_at: '2026-06-07T12:02:00Z',
        request_id: 'req-immutable-status-1',
        immutable_storage: {
          status: 'not_configured',
          mode: 'disabled',
          cdk_managed: false,
          resource_configured: false,
          prefix_configured: false,
          missing: ['immutable_audit_storage_mode'],
        },
        audit_retention: {
          schema_version: 'v1',
          checked_at: '2026-06-07T12:02:00Z',
          request_id: 'req-immutable-status-1',
          scope_count: 1,
          items: [],
          privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
        },
        legal_hold: {
          schema_version: 'v1',
          checked_at: '2026-06-07T12:02:00Z',
          request_id: 'req-immutable-status-1',
          scope_count: 1,
          items: [{ reference: { scope: 'recovery_job', job_id: 'job-1' }, scope_key: 'scope-1', status: 'none', policy_id: null, hold_id: null, reason: null, updated_at: null }],
          privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
        },
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/immutable-evidence/persist', async (route) => {
    immutablePersistRequested = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        manifest_id: 'audit-retention-immutable-1',
        generated_at: '2026-06-07T12:03:00Z',
        generated_by: 'admin-1',
        reason: 'Persist metadata-only immutable evidence',
        retention_category: 'incident',
        manifest_status: 'sealed',
        manifest_digest: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
        item_count: 1,
        immutable_storage: {
          status: 'not_configured',
          reason: 'immutable storage is not configured by CDK',
          storage: { status: 'not_configured', mode: 'disabled', cdk_managed: false, resource_configured: false, prefix_configured: false, missing: ['immutable_audit_storage_mode'] },
          privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
        },
        verification: { privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] }, refusal_reasons: [] },
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/legal-holds/status', async (route) => {
    legalHoldStatusRequested = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        checked_at: '2026-06-07T12:04:00Z',
        request_id: 'req-hold-status-1',
        scope_count: 1,
        items: [{ reference: { scope: 'recovery_job', job_id: 'job-1' }, scope_key: 'scope-1', status: 'active', policy_id: 'operational-default', hold_id: 'legal-hold-1', reason: 'Legal hold for report operations evidence', updated_at: '2026-06-07T12:04:00Z' }],
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/legal-holds', async (route) => {
    legalHoldRequested = true
    const body = JSON.parse(route.request().postData() || '{}')
    const status = body.action === 'release' ? 'released' : 'active'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        updated_at: '2026-06-07T12:05:00Z',
        request_id: 'req-hold-apply-1',
        action: body.action || 'apply',
        scope_count: 1,
        items: [{ reference: { scope: 'recovery_job', job_id: 'job-1' }, scope_key: 'scope-1', status, policy_id: 'operational-default', hold_id: 'legal-hold-1', reason: body.reason, updated_at: '2026-06-07T12:05:00Z' }],
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/retention-governance/status', async (route) => {
    governanceStatusRequested = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        checked_at: '2026-06-07T12:06:00Z',
        request_id: 'req-governance-status-1',
        immutable_storage: {
          status: 'ready',
          mode: 'cdk_managed',
          cdk_managed: true,
          resource_configured: true,
          prefix_configured: true,
          missing: [],
        },
        retention_approval: {
          approval_id: 'retention-approval-1',
          policy_version: 'retention-policy-v1',
          approval_state: 'pending_review',
          retention_mode: 'GOVERNANCE',
          retention_days: 365,
          policy_owner: 'report-operations-owner',
          legal_compliance_approver: 'legal-compliance-approver',
          reason: 'Record retention policy review evidence',
          evidence_references: [{ type: 'v2.8-object-lock-evidence', retention_mode: 'GOVERNANCE', retention_days: 365 }],
          next_review_due_at: '2027-06-07',
          approval_version: 1,
          updated_at: '2026-06-07T12:06:00Z',
          formal_approval_recorded: false,
          technical_object_lock_verified: true,
          broad_compliance_claims_allowed: false,
        },
        legal_hold_reviews: {
          scope_count: 1,
          items: [{
            reference: { scope: 'recovery_job', job_id: 'job-1' },
            scope_key: 'scope-1',
            legal_hold_status: 'active',
            review_status: 'reviewed',
            owner: 'report-operations-owner',
            reviewer: 'legal-compliance-reviewer',
            review_cadence: 'monthly',
            next_review_due_at: '2026-07-07',
            review_version: 1,
          }],
        },
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/retention-governance/approval', async (route) => {
    governanceApprovalRequested = true
    const body = JSON.parse(route.request().postData() || '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        updated_at: '2026-06-07T12:07:00Z',
        request_id: 'req-governance-approval-1',
        status: 'recorded',
        retention_approval: {
          approval_id: 'retention-approval-1',
          policy_version: body.policy_version,
          approval_state: body.approval_state,
          retention_mode: body.retention_mode,
          retention_days: body.retention_days,
          policy_owner: body.policy_owner,
          legal_compliance_approver: body.legal_compliance_approver,
          reason: body.reason,
          evidence_references: body.evidence_references,
          next_review_due_at: body.next_review_due_at,
          approval_version: 2,
          updated_at: '2026-06-07T12:07:00Z',
          formal_approval_recorded: body.approval_state === 'approved',
          technical_object_lock_verified: true,
          broad_compliance_claims_allowed: false,
        },
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/legal-holds/review', async (route) => {
    legalHoldReviewRequested = true
    const body = JSON.parse(route.request().postData() || '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        updated_at: '2026-06-07T12:08:00Z',
        request_id: 'req-hold-review-1',
        scope_count: 1,
        items: [{
          reference: { scope: 'recovery_job', job_id: 'job-1' },
          scope_key: 'scope-1',
          status: 'recorded',
          review_id: 'legal-hold-review-1',
          outcome: body.outcome,
          owner: body.owner,
          reviewer: body.reviewer,
          next_review_due_at: body.next_review_due_at,
          review_version: 2,
          privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
        }],
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/support-handoff-package', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}')
    const refused = body.destination_mode === 'external_write'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        package_id: refused ? 'support-handoff-refused' : 'support-handoff-1',
        generated_at: '2026-06-07T10:00:00Z',
        generated_by: 'admin-1',
        reason: 'Support ticket handoff',
        destination: {
          mode: body.destination_mode || 'preview',
          status: refused ? 'refused' : 'ready',
          refusal_reasons: refused ? ['direct external writes require approved connector or secret-backed credential path'] : [],
        },
        evidence_references: refused ? [] : [{ type: 'recovery_job', id: 'job-3' }, { type: 'safe_fixture', id: 'stoa-safe-fixture-v2-2-rollback-2026-06-06' }],
        sections: refused ? [] : [
          { type: 'recovery_job_support_package', reference: { type: 'recovery_job', id: 'job-3' }, status: 'included', data: { scope: 'support_package' } },
          { type: 'safe_fixture_status', reference: { type: 'safe_fixture', id: 'stoa-safe-fixture-v2-2-rollback-2026-06-06' }, status: 'ready', data: { status: 'ready' } },
          { type: 'operator_note', reference: null, status: 'included', data: { note: 'support note' } },
        ],
        validation: {
          status: refused ? 'refused' : 'passed',
          failures: refused ? ['direct external writes require approved connector or secret-backed credential path'] : [],
          missing_references: [],
          skipped_sections: [],
          privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
        },
        audit: { correlation_id: 'req-handoff-1', audit_event_refs: [{ event_id: 'audit-handoff-1', event_at: '2026-06-07T10:00:00Z', action: 'support_handoff_package', result: refused ? 'refused' : 'generated' }] },
        copy: { format: 'markdown', text: '# Support Handoff Package support-handoff-1' },
        download: { filename: 'support-handoff-1.json', content_type: 'application/json' },
      }),
    })
  })
  await page.route('**/admin/reports/release-evidence/validate', async (route) => {
    releaseEvidenceValidated = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'v1',
        validated_at: '2026-06-06T21:00:00Z',
        status: 'passed',
        missing_required_fields: [],
        schema_errors: [],
        status_errors: [],
        fixture_errors: [],
        privacy: { passed: true, violation_count: 0, violations: [], denylist: ['weekly-reports/'] },
        bundle: {
          schema_version: 'v1',
          milestone: 'v2.3',
          phase: 65,
          generated_at: '2026-06-06T21:00:00Z',
          environment: 'production',
          backend: { status: 'passed', commit_sha: 'abc123', deploy_run_id: 'backend-run-1' },
          frontend: { status: 'passed', commit_sha: 'def456', deploy_run_id: 'frontend-run-1' },
          infra: { status: 'passed', cdk_diff: 'lambda code asset drift only' },
          api_checks: [{ status: 'passed', request_id: 'req-release-1' }],
          browser_smoke: { status: 'passed', route: '/admin/report-operations' },
          privacy: { status: 'passed', violation_count: 0 },
          quality_gates: [{ status: 'passed', command: 'npm run build' }],
        },
      }),
    })
  })
  await page.route('**/admin/reports/release-evidence/fixture-status**', async (route) => {
    fixtureStatusRequested = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        generated_at: '2026-06-06T21:00:00Z',
        fixture_name: 'stoa-safe-fixture-v2-2-rollback-2026-06-06',
        approved: true,
        status: 'ready',
        identity: {
          parent_id: 'safe-fixture-parent-v2-2',
          student_id: 'safe-fixture-student-v2-2',
          week_start: '2026-06-01',
        },
        artifact_versions: {
          current: 'original',
          expected_baseline: 'original',
          previous: 'v20260606T184730Z-cb0b33d1',
          created_at: '2026-06-06T18:50:00Z',
          created_by: 'admin-1',
        },
        report: {
          report_id: 'report-safe-fixture',
          status: 'email_sent',
          email_status: 'sent',
          last_operation: 'rollback_report_artifact',
          updated_at: '2026-06-06T18:50:00Z',
        },
        audit_refs: [{ event_id: 'audit-fixture-1', event_at: '2026-06-06T18:50:00Z', action: 'apply_report_artifact_rollback', result: 'success' }],
        mutation_refusal: {
          would_refuse_without_fixture_name: true,
          would_refuse_without_mutation_mode: true,
          allowed_when_status: 'ready',
        },
        privacy: { metadata_only: true, private_artifact_fields_omitted: true, passed: true, violation_count: 0, violations: [] },
      }),
    })
  })
  await page.route('**/admin/reports/recovery-jobs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 1 + Number(jobCreated) + Number(generationJobCreated) + Number(resumeJobCreated),
        next_token: null,
        items: [
          {
            job_id: 'job-3',
            job_type: 'retry_generation',
            status: 'completed_with_failures',
            reason: 'Incident resumable recovery',
            created_by: 'admin-1',
            created_at: '2026-06-04T11:12:00Z',
            updated_at: '2026-06-04T11:13:00Z',
            filters: { status: 'generation_failed', week_start: '2026-06-01' },
            target_count: 1,
            pending_count: 0,
            attempted_count: 1,
            success_count: 0,
            refused_count: 0,
            not_found_count: 0,
            failed_count: 1,
            skipped_cancelled_count: 0,
          },
          ...(jobCreated
            ? [
                {
                  job_id: 'job-1',
                  job_type: 'resend_email',
                  status: 'queued',
                  reason: 'Incident email delivery recovery',
                  created_by: 'admin-1',
                  created_at: '2026-06-04T11:05:00Z',
                  updated_at: '2026-06-04T11:05:00Z',
                  filters: { status: 'email_failed', week_start: '2026-06-01' },
                  target_count: 1,
                  pending_count: 1,
                  attempted_count: 0,
                  success_count: 0,
                  refused_count: 0,
                  not_found_count: 0,
                  failed_count: 0,
                  skipped_cancelled_count: 0,
                },
              ]
            : []),
          ...(generationJobCreated
            ? [
                {
                  job_id: 'job-2',
                  job_type: 'retry_generation',
                  status: 'queued',
                  reason: 'Incident generation retry recovery',
                  created_by: 'admin-1',
                  created_at: '2026-06-04T11:10:00Z',
                  updated_at: '2026-06-04T11:10:00Z',
                  filters: { status: 'generation_failed', week_start: '2026-06-01' },
                  target_count: 1,
                  pending_count: 1,
                  attempted_count: 0,
                  success_count: 0,
                  refused_count: 0,
                  not_found_count: 0,
                  failed_count: 0,
                  skipped_cancelled_count: 0,
                },
              ]
            : []),
          ...(resumeJobCreated
            ? [
                {
                  job_id: 'job-4',
                  job_type: 'retry_generation',
                  status: 'queued',
                  reason: 'Resume failed recovery targets',
                  created_by: 'admin-1',
                  created_at: '2026-06-04T11:15:00Z',
                  updated_at: '2026-06-04T11:15:00Z',
                  filters: { source_job_id: 'job-3', result_filters: ['failed'] },
                  source_job_id: 'job-3',
                  resume_result_filters: ['failed', 'refused', 'not_found', 'skipped_cancelled'],
                  target_count: 1,
                  pending_count: 1,
                  attempted_count: 0,
                  success_count: 0,
                  refused_count: 0,
                  not_found_count: 0,
                  failed_count: 0,
                  skipped_cancelled_count: 0,
                },
              ]
            : []),
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
  await expect(page.getByText('Report edit draft')).toBeVisible()
  await page.getByLabel('Admin note').fill('Reviewed for parent follow-up')
  await page.getByRole('button', { name: /create draft/i }).click()
  await expect.poll(() => editDraftCreated).toBe(true)
  await expect(page.getByText('Draft created: draft-1')).toBeVisible()
  await page.getByRole('button', { name: /apply draft/i }).click()
  await expect.poll(() => editDraftApplied).toBe(true)
  await expect(page.getByText('Edit success: applied')).toBeVisible()
  await expect(page.getByText('Artifact edit preview')).toBeVisible()
  await page.getByLabel('Artifact summary').fill('Updated parent-facing summary')
  await page.getByRole('button', { name: /preview artifact edit/i }).click()
  await expect.poll(() => artifactPreviewCreated).toBe(true)
  await expect(page.getByText('Artifact preview created: artifact-draft-1')).toBeVisible()
  await expect(page.getByText('summary').first()).toBeVisible()
  await page.getByRole('button', { name: /apply artifact edit/i }).click()
  await expect.poll(() => artifactEditApplied).toBe(true)
  await expect(page.getByText('Artifact edit success: applied')).toBeVisible()
  await expect(page.getByText('Artifact rollback')).toBeVisible()
  await page.getByRole('button', { name: /preview rollback/i }).click()
  await expect.poll(() => rollbackPreviewCreated).toBe(true)
  await expect(page.getByText('Artifact rollback preview created: rollback-preview-1')).toBeVisible()
  await expect(page.getByText('v20260605T100300Z-safe')).toBeVisible()
  await expect(page.getByText('original')).toBeVisible()
  await expect(page.getByText('passed', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('weekly-reports')).toHaveCount(0)
  await expect(page.getByText('source_json_s3_key')).toHaveCount(0)
  await page.getByRole('button', { name: /apply rollback/i }).click()
  await expect.poll(() => rollbackApplied).toBe(true)
  await expect(page.getByText('Artifact rollback success: applied')).toBeVisible()

  await page.getByLabel(`Select ${reportOne.report_id}`).check()
  await page.getByRole('button', { name: /resend selected/i }).click()
  await expect(page.getByText('Bulk resend results')).toBeVisible()
  await expect(page.getByText('success').last()).toBeVisible()

  await expect(page.getByText('Report audit')).toBeVisible()
  await expect(page.getByText('resend email', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /preview async job/i }).click()
  await expect(page.getByText('Eligible', { exact: true })).toBeVisible()
  await expect(page.locator('section').filter({ hasText: 'Async recovery job' }).getByText('Student One')).toBeVisible()
  await page.getByRole('button', { name: /start job/i }).click()
  await expect(page.getByText(/Recovery job queued: job-1/i)).toBeVisible()
  await expect(page.getByText('Recovery jobs')).toBeVisible()
  await expect(page.getByText('Incident email delivery recovery').last()).toBeVisible()
  await expect(page.getByText('Job audit')).toBeVisible()
  await page.getByRole('button', { name: /^Cancel$/ }).click()
  await expect(page.getByText(/Cancellation requested/i)).toBeVisible()
  await page.getByRole('button', { name: /export selected job/i }).click()
  await expect(page.getByText('Evidence JSON', { exact: true })).toBeVisible()
  await expect(page.getByText('req-evidence-1', { exact: true })).toBeVisible()
  await expect(page.getByText('"scope": "recovery_job"')).toBeVisible()
  await page.getByRole('button', { name: /export recent jobs/i }).click()
  await expect(page.getByText('"scope": "recent_recovery_jobs"')).toBeVisible()
  await expect(page.getByText('Audit retention')).toBeVisible()
  await page.getByRole('button', { name: /check retention status/i }).click()
  await expect.poll(() => retentionStatusRequested).toBe(true)
  await expect(page.getByText('Retention status checked: 2 references')).toBeVisible()
  await expect(page.getByText('req-retention-status-1')).toBeVisible()
  await page.getByRole('button', { name: /^Generate manifest$/ }).click()
  await expect.poll(() => retentionManifestRequested).toBe(true)
  await expect(page.getByText(/Retention manifest sealed: audit-retention-1/i)).toBeVisible()
  await expect(page.getByText('audit-retention-1', { exact: true })).toBeVisible()
  await expect(page.getByText('sha256:2222222222222222222222222222222222222222222222222222222222222222', { exact: true })).toBeVisible()
  await page.getByRole('region', { name: 'Audit retention' }).getByRole('button', { name: /copy manifest/i }).click()
  await expect(page.getByText('Retention manifest copied')).toBeVisible()
  await expect(page.getByText('weekly-reports')).toHaveCount(0)
  await expect(page.getByText('presigned_url')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Immutable evidence' })).toBeVisible()
  await page.getByRole('button', { name: /check immutable status/i }).click()
  await expect.poll(() => immutableStatusRequested).toBe(true)
  await expect(page.getByText('Immutable status: not_configured')).toBeVisible()
  await expect(page.getByText('immutable_audit_storage_mode', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Persist manifest$/ }).click()
  await expect.poll(() => immutablePersistRequested).toBe(true)
  await expect(page.getByText(/Immutable persistence not_configured: audit-retention-immutable-1/i)).toBeVisible()
  await expect(page.getByText('sha256:3333333333333333333333333333333333333333333333333333333333333333', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /check legal hold/i }).click()
  await expect.poll(() => legalHoldStatusRequested).toBe(true)
  await expect(page.getByText('Legal hold status checked: 1 references')).toBeVisible()
  await expect(page.getByText('legal-hold-1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Apply hold$/ }).click()
  await expect.poll(() => legalHoldRequested).toBe(true)
  await expect(page.getByText('Legal hold apply: active')).toBeVisible()
  await page.getByRole('button', { name: /check governance/i }).click()
  await expect.poll(() => governanceStatusRequested).toBe(true)
  await expect(page.getByText('Governance status: pending_review')).toBeVisible()
  await expect(page.getByText('Retention approval')).toBeVisible()
  await expect(page.getByText('Formal approval')).toBeVisible()
  await expect(page.getByText('not recorded')).toBeVisible()
  await page.getByRole('button', { name: /record approval/i }).click()
  await expect.poll(() => governanceApprovalRequested).toBe(true)
  await expect(page.getByText('Retention approval recorded: pending_review')).toBeVisible()
  await page.getByRole('button', { name: /record review/i }).click()
  await expect.poll(() => legalHoldReviewRequested).toBe(true)
  await expect(page.getByText('Legal hold review: recorded')).toBeVisible()
  await expect(page.getByText('legal-compliance-reviewer', { exact: true })).toBeVisible()
  await page.getByRole('region', { name: 'Immutable evidence' }).getByRole('button', { name: /copy json/i }).click()
  await expect(page.getByText('Immutable evidence JSON copied')).toBeVisible()
  await expect(page.getByText('Support handoff')).toBeVisible()
  await page.getByRole('button', { name: /incident resumable recovery/i }).click()
  await page.getByRole('button', { name: /generate handoff package/i }).click()
  await expect(page.getByText(/Support handoff ready: support-handoff-1/i)).toBeVisible()
  await expect(page.getByText('support-handoff-1', { exact: true })).toBeVisible()
  await expect(page.getByText('recovery job support package')).toBeVisible()
  const handoffPanel = page.getByRole('region', { name: 'Support handoff' })
  await handoffPanel.getByRole('button', { name: /copy package/i }).click()
  await expect(page.getByText('Support handoff copied')).toBeVisible()
  await handoffPanel.getByRole('button', { name: 'External write' }).click()
  await handoffPanel.getByRole('button', { name: /generate handoff package/i }).click()
  await expect(page.getByText(/Support handoff refused: support-handoff-refused/i)).toBeVisible()
  await expect(handoffPanel.getByText(/direct external writes require approved connector/i).first()).toBeVisible()
  await handoffPanel.getByRole('button', { name: 'Preview', exact: true }).click()
  await page.getByRole('button', { name: /validate release evidence/i }).click()
  await expect.poll(() => releaseEvidenceValidated).toBe(true)
  await expect(page.getByText('Release evidence validation: passed')).toBeVisible()
  await expect(page.getByText('req-release-1')).toBeVisible()
  await expect(page.getByText('abc123', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /check fixture status/i }).click()
  await expect.poll(() => fixtureStatusRequested).toBe(true)
  await expect(page.getByText('Fixture status: ready')).toBeVisible()
  await expect(page.getByText('report-safe-fixture')).toBeVisible()
  await expect(page.getByText('original').first()).toBeVisible()

  await page.getByRole('button', { name: 'Retry generation', exact: true }).click()
  await expect(page.getByText('status fixed to generation_failed')).toBeVisible()
  await page.getByRole('button', { name: /preview async job/i }).click()
  await expect.poll(() => generationPreviewStatus).toBe('generation_failed')
  await expect(page.locator('section').filter({ hasText: 'Async recovery job' }).getByText('Student Two')).toBeVisible()
  await page.getByRole('button', { name: /start job/i }).click()
  await expect(page.getByText(/Recovery job queued: job-2/i)).toBeVisible()
  await expect(page.getByText('Incident generation retry recovery').last()).toBeVisible()

  await page.getByRole('button', { name: /incident resumable recovery/i }).click()
  await expect(page.getByText('complete retry generation job')).toBeVisible()
  await page.getByRole('button', { name: /support package/i }).click()
  await expect(page.getByText('Support package exported: job-3')).toBeVisible()
  await expect(page.getByText('"scope": "support_package"')).toBeVisible()
  await page.getByRole('button', { name: /preview resume/i }).click()
  await expect.poll(() => resumePreviewResults).toEqual(['failed', 'refused', 'not_found', 'skipped_cancelled'])
  await expect(page.getByText('Resume', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /start resume/i }).click()
  await expect(page.getByText(/Resume job queued: job-4/i)).toBeVisible()

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).toContain('Retry generation')
  expect(bodyText).not.toMatch(/weekly-reports\/|json_s3_key|html_s3_key|presignedUrl|https:\/\/s3/i)
})
