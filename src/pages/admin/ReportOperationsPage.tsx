import { type FormEvent, useMemo, useState } from 'react'
import {
  ClipboardList,
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  FilePenLine,
  FileJson,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { AdminUnavailableCard } from '@/components/admin/AdminUnavailableCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useBulkResendReportEmailsMutation,
  useApplyReportArtifactEditPreviewMutation,
  useApplyReportArtifactRollbackPreviewMutation,
  useApplyReportEditDraftMutation,
  useCancelRecoveryJobMutation,
  useCreateReportArtifactEditPreviewMutation,
  useCreateReportArtifactRollbackPreviewMutation,
  useCreateReportEditDraftMutation,
  useCreateGenerationRetryRecoveryJobMutation,
  useCreateResendRecoveryJobMutation,
  useCreateResumeRecoveryJobMutation,
  usePreviewGenerationRetryRecoveryJobMutation,
  usePreviewResendRecoveryJobMutation,
  usePreviewResumeRecoveryJobMutation,
  useRecoveryEvidenceExportMutation,
  useReleaseEvidenceValidationMutation,
  useReleaseFixtureStatusMutation,
  useRecoveryJobAuditEventsQuery,
  useRecoveryJobResultsQuery,
  useRecoveryJobsQuery,
  useRecoveryJobSupportPackageMutation,
  useSupportHandoffPackageMutation,
  useReportAuditEventsQuery,
  useReportOperationDetailQuery,
  useReportOperationsQuery,
  useResendReportEmailMutation,
  useRetryReportGenerationMutation,
} from '@/hooks/admin/useAdminReportOperations'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type {
  BulkReportResendItemResult,
  RecoveryEvidenceExport,
  RecoveryJob,
  RecoveryJobPreviewResponse,
  RecoveryJobResumePreviewResponse,
  RecoveryJobSupportPackage,
  RecoveryJobTarget,
  RecoveryJobType,
  ReleaseEvidenceValidationResult,
  ReleaseFixtureStatus,
  ReportArtifactEditPreview,
  ReportArtifactRollbackPreview,
  ReportAuditEvent,
  ReportEditDraft,
  ReportOperationRow,
  ReportOperationTarget,
  ReportOperationsListFilters,
  SupportHandoffDestinationMode,
  SupportHandoffPackage,
} from '@/services/admin/adminApi'

type FilterDraft = {
  status: string
  weekStart: string
  parentId: string
  studentId: string
}

const statusOptions = [
  { label: 'Any status', value: '' },
  { label: 'Generation failed', value: 'generation_failed' },
  { label: 'Email failed', value: 'email_failed' },
  { label: 'Email sent', value: 'email_sent' },
  { label: 'Generated', value: 'generated' },
]

const jobTypeOptions: { label: string; value: RecoveryJobType; reason: string; status: string }[] = [
  {
    label: 'Resend email',
    value: 'resend_email',
    reason: 'Incident email delivery recovery',
    status: 'email_failed',
  },
  {
    label: 'Retry generation',
    value: 'retry_generation',
    reason: 'Incident generation retry recovery',
    status: 'generation_failed',
  },
]

const approvedFixtureName = 'stoa-safe-fixture-v2-2-rollback-2026-06-06'

const defaultReleaseEvidenceBundle = {
  schema_version: 'v1',
  milestone: 'v2.3',
  phase: 65,
  generated_at: new Date().toISOString(),
  environment: 'production',
  backend: { status: 'passed', commit_sha: 'pending-backend-sha', deploy_run_id: 'pending-backend-run' },
  frontend: { status: 'passed', commit_sha: 'pending-frontend-sha', deploy_run_id: 'pending-frontend-run' },
  infra: { status: 'passed', cdk_diff: 'pending classification' },
  api_checks: [{ status: 'passed', request_id: 'pending-api-request-id', note: 'admin-only checks pending' }],
  browser_smoke: { status: 'passed', route: '/admin/report-operations', note: 'read-only smoke pending' },
  privacy: { status: 'passed', denylist_checked: true, violation_count: 0 },
  quality_gates: [{ status: 'passed', command: 'pending', note: 'quality gate pending' }],
}

export function AdminReportOperationsPage() {
  const [draft, setDraft] = useState<FilterDraft>({
    status: 'email_failed',
    weekStart: '',
    parentId: '',
    studentId: '',
  })
  const [filters, setFilters] = useState<ReportOperationsListFilters>({
    status: 'email_failed',
    limit: 25,
  })
  const [pageToken, setPageToken] = useState<string | null>(null)
  const [tokenHistory, setTokenHistory] = useState<(string | null)[]>([])
  const [selectedTarget, setSelectedTarget] = useState<ReportOperationTarget | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [singleActionResult, setSingleActionResult] = useState<string | null>(null)
  const [bulkResults, setBulkResults] = useState<BulkReportResendItemResult[]>([])
  const [jobType, setJobType] = useState<RecoveryJobType>('resend_email')
  const [jobReason, setJobReason] = useState('Incident email delivery recovery')
  const [jobPreview, setJobPreview] = useState<RecoveryJobPreviewResponse | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [evidenceExport, setEvidenceExport] = useState<RecoveryEvidenceExport | null>(null)
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null)
  const [releaseFixtureName, setReleaseFixtureName] = useState(approvedFixtureName)
  const [releaseEvidenceInput, setReleaseEvidenceInput] = useState(() =>
    JSON.stringify(defaultReleaseEvidenceBundle, null, 2),
  )
  const [releaseEvidenceValidation, setReleaseEvidenceValidation] =
    useState<ReleaseEvidenceValidationResult | null>(null)
  const [releaseFixtureStatus, setReleaseFixtureStatus] = useState<ReleaseFixtureStatus | null>(null)
  const [releaseEvidenceMessage, setReleaseEvidenceMessage] = useState<string | null>(null)
  const [resumeReason, setResumeReason] = useState('Resume failed recovery targets')
  const [resumePreview, setResumePreview] = useState<RecoveryJobResumePreviewResponse | null>(null)
  const [supportPackage, setSupportPackage] = useState<RecoveryJobSupportPackage | null>(null)
  const [supportMessage, setSupportMessage] = useState<string | null>(null)
  const [handoffReason, setHandoffReason] = useState('Support ticket handoff')
  const [handoffNote, setHandoffNote] = useState('')
  const [handoffDestination, setHandoffDestination] = useState<SupportHandoffDestinationMode>('preview')
  const [handoffIncludeJob, setHandoffIncludeJob] = useState(true)
  const [handoffIncludeRelease, setHandoffIncludeRelease] = useState(false)
  const [handoffIncludeFixture, setHandoffIncludeFixture] = useState(true)
  const [handoffPackage, setHandoffPackage] = useState<SupportHandoffPackage | null>(null)
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null)
  const [editReason, setEditReason] = useState('Admin metadata correction')
  const [editFields, setEditFields] = useState({
    admin_note: '',
    editor_summary: '',
    status_note: '',
  })
  const [activeEditDraft, setActiveEditDraft] = useState<ReportEditDraft | null>(null)
  const [editMessage, setEditMessage] = useState<string | null>(null)
  const [artifactEditReason, setArtifactEditReason] = useState('Parent-safe artifact wording correction')
  const [artifactEditFields, setArtifactEditFields] = useState({
    summary: '',
    recommendations: '',
  })
  const [activeArtifactPreview, setActiveArtifactPreview] = useState<ReportArtifactEditPreview | null>(null)
  const [artifactEditMessage, setArtifactEditMessage] = useState<string | null>(null)
  const [artifactRollbackReason, setArtifactRollbackReason] = useState('Restore previous artifact version')
  const [activeRollbackPreview, setActiveRollbackPreview] = useState<ReportArtifactRollbackPreview | null>(null)
  const [artifactRollbackMessage, setArtifactRollbackMessage] = useState<string | null>(null)

  const activeFilters = useMemo(
    () => ({
      ...filters,
      nextToken: pageToken,
    }),
    [filters, pageToken],
  )
  const reportsQuery = useReportOperationsQuery(activeFilters)
  const detailQuery = useReportOperationDetailQuery(selectedTarget)
  const reportAuditQuery = useReportAuditEventsQuery(selectedTarget)
  const jobsQuery = useRecoveryJobsQuery()
  const jobResultsQuery = useRecoveryJobResultsQuery(selectedJobId)
  const jobAuditQuery = useRecoveryJobAuditEventsQuery(selectedJobId)
  const retryMutation = useRetryReportGenerationMutation()
  const resendMutation = useResendReportEmailMutation()
  const bulkResendMutation = useBulkResendReportEmailsMutation()
  const previewResendJobMutation = usePreviewResendRecoveryJobMutation()
  const previewGenerationRetryJobMutation = usePreviewGenerationRetryRecoveryJobMutation()
  const createResendJobMutation = useCreateResendRecoveryJobMutation()
  const createGenerationRetryJobMutation = useCreateGenerationRetryRecoveryJobMutation()
  const previewResumeJobMutation = usePreviewResumeRecoveryJobMutation()
  const createResumeJobMutation = useCreateResumeRecoveryJobMutation()
  const supportPackageMutation = useRecoveryJobSupportPackageMutation()
  const supportHandoffMutation = useSupportHandoffPackageMutation()
  const cancelJobMutation = useCancelRecoveryJobMutation()
  const evidenceMutation = useRecoveryEvidenceExportMutation()
  const releaseEvidenceValidationMutation = useReleaseEvidenceValidationMutation()
  const releaseFixtureStatusMutation = useReleaseFixtureStatusMutation()
  const createEditDraftMutation = useCreateReportEditDraftMutation()
  const applyEditDraftMutation = useApplyReportEditDraftMutation()
  const createArtifactPreviewMutation = useCreateReportArtifactEditPreviewMutation()
  const applyArtifactPreviewMutation = useApplyReportArtifactEditPreviewMutation()
  const createRollbackPreviewMutation = useCreateReportArtifactRollbackPreviewMutation()
  const applyRollbackPreviewMutation = useApplyReportArtifactRollbackPreviewMutation()

  const rows = reportsQuery.data?.items ?? []
  const detail = detailQuery.data ?? rows.find((row) => selectedTarget && targetKey(row) === targetKey(selectedTarget))
  const selectedBulkTargets = rows
    .filter((row) => selectedKeys.has(targetKey(row)) && row.actions.resend_email.enabled)
    .map(targetFromReport)
  const jobTypeOption = jobTypeOptions.find((option) => option.value === jobType) ?? jobTypeOptions[0]
  const activePreviewJobMutation =
    jobType === 'retry_generation' ? previewGenerationRetryJobMutation : previewResendJobMutation
  const activeCreateJobMutation =
    jobType === 'retry_generation' ? createGenerationRetryJobMutation : createResendJobMutation

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters({
      status: draft.status || undefined,
      weekStart: draft.weekStart || undefined,
      parentId: draft.parentId || undefined,
      studentId: draft.studentId || undefined,
      limit: 25,
    })
    setPageToken(null)
    setTokenHistory([])
    setSelectedKeys(new Set())
    setBulkResults([])
    setJobPreview(null)
  }

  function resetFilters() {
    const nextDraft = { status: 'email_failed', weekStart: '', parentId: '', studentId: '' }
    setDraft(nextDraft)
    setFilters({ status: 'email_failed', limit: 25 })
    setPageToken(null)
    setTokenHistory([])
    setSelectedKeys(new Set())
    setBulkResults([])
    setJobPreview(null)
  }

  function goNextPage() {
    if (!reportsQuery.data?.next_token) return
    setTokenHistory((history) => [...history, pageToken])
    setPageToken(reportsQuery.data.next_token)
    setSelectedKeys(new Set())
  }

  function goPreviousPage() {
    setTokenHistory((history) => {
      const previous = history[history.length - 1] ?? null
      setPageToken(previous)
      return history.slice(0, -1)
    })
    setSelectedKeys(new Set())
  }

  function toggleSelection(row: ReportOperationRow) {
    const key = targetKey(row)
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function retrySelectedReport() {
    if (!detail) return
    retryMutation.mutate(targetFromReport(detail), {
      onSuccess: (result) => {
        setSingleActionResult(`Retry ${result.operation_result}: ${result.status}`)
      },
      onError: (error) => {
        setSingleActionResult(error.message)
      },
    })
  }

  function resendSelectedReport() {
    if (!detail) return
    resendMutation.mutate(targetFromReport(detail), {
      onSuccess: (result) => {
        setSingleActionResult(`Resend ${result.operation_result}: ${result.status}`)
      },
      onError: (error) => {
        setSingleActionResult(error.message)
      },
    })
  }

  function resendSelectedBulk() {
    if (selectedBulkTargets.length === 0) return
    bulkResendMutation.mutate(selectedBulkTargets, {
      onSuccess: (result) => {
        setBulkResults(result.results)
        setSelectedKeys(new Set())
      },
      onError: (error) => {
        setSingleActionResult(error.message)
      },
    })
  }

  function updateEditField(field: keyof typeof editFields, value: string) {
    setEditFields((current) => ({ ...current, [field]: value }))
    setEditMessage(null)
  }

  function updateArtifactEditField(field: keyof typeof artifactEditFields, value: string) {
    setArtifactEditFields((current) => ({ ...current, [field]: value }))
    setArtifactEditMessage(null)
  }

  function updateArtifactRollbackReason(value: string) {
    setArtifactRollbackReason(value)
    setArtifactRollbackMessage(null)
  }

  function createEditDraft() {
    if (!detail) return
    const proposedFields = Object.fromEntries(
      Object.entries(editFields)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value.length > 0),
    ) as Record<string, string>
    if (Object.keys(proposedFields).length === 0) {
      setEditMessage('Add at least one edit field')
      return
    }
    createEditDraftMutation.mutate(
      {
        ...targetFromReport(detail),
        reason: editReason,
        proposed_fields: proposedFields,
      },
      {
        onSuccess: (draftResult) => {
          setActiveEditDraft(draftResult)
          setEditMessage(`Draft created: ${draftResult.draft_id}`)
        },
        onError: (error) => setEditMessage(error.message),
      },
    )
  }

  function applyEditDraft() {
    if (!detail || !activeEditDraft) return
    applyEditDraftMutation.mutate(
      {
        ...targetFromReport(detail),
        draft_id: activeEditDraft.draft_id,
      },
      {
        onSuccess: (result) => {
          setActiveEditDraft(result.draft)
          setEditMessage(`Edit ${result.operation_result}: ${result.draft.status}`)
          void reportAuditQuery.refetch()
        },
        onError: (error) => setEditMessage(error.message),
      },
    )
  }

  function createArtifactEditPreview() {
    if (!detail) return
    const proposedFields: Record<string, unknown> = {}
    const summary = artifactEditFields.summary.trim()
    const recommendations = artifactEditFields.recommendations
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
    if (summary.length > 0) proposedFields.summary = summary
    if (recommendations.length > 0) proposedFields.recommendations = recommendations
    if (Object.keys(proposedFields).length === 0) {
      setArtifactEditMessage('Add a summary or recommendation change')
      return
    }
    createArtifactPreviewMutation.mutate(
      {
        ...targetFromReport(detail),
        reason: artifactEditReason,
        proposed_fields: proposedFields,
      },
      {
        onSuccess: (preview) => {
          setActiveArtifactPreview(preview)
          setArtifactEditMessage(`Artifact preview created: ${preview.draft_id}`)
        },
        onError: (error) => setArtifactEditMessage(error.message),
      },
    )
  }

  function applyArtifactEditPreview() {
    if (!detail || !activeArtifactPreview) return
    applyArtifactPreviewMutation.mutate(
      {
        ...targetFromReport(detail),
        draft_id: activeArtifactPreview.draft_id,
        reason: artifactEditReason,
      },
      {
        onSuccess: (result) => {
          setActiveArtifactPreview(result.draft)
          setArtifactEditMessage(`Artifact edit ${result.operation_result}: ${result.draft.status}`)
          void reportAuditQuery.refetch()
        },
        onError: (error) => setArtifactEditMessage(error.message),
      },
    )
  }

  function createArtifactRollbackPreview() {
    if (!detail) return
    createRollbackPreviewMutation.mutate(
      {
        ...targetFromReport(detail),
        reason: artifactRollbackReason,
      },
      {
        onSuccess: (preview) => {
          setActiveRollbackPreview(preview)
          setArtifactRollbackMessage(`Artifact rollback preview created: ${preview.preview_id}`)
        },
        onError: (error) => setArtifactRollbackMessage(error.message),
      },
    )
  }

  function applyArtifactRollbackPreview() {
    if (!detail || !activeRollbackPreview) return
    applyRollbackPreviewMutation.mutate(
      {
        ...targetFromReport(detail),
        preview_id: activeRollbackPreview.preview_id,
        reason: artifactRollbackReason,
      },
      {
        onSuccess: (result) => {
          setActiveRollbackPreview(result.preview)
          setArtifactRollbackMessage(`Artifact rollback ${result.operation_result}: ${result.preview.status}`)
          void reportAuditQuery.refetch()
        },
        onError: (error) => setArtifactRollbackMessage(error.message),
      },
    )
  }

  function changeJobType(nextJobType: RecoveryJobType) {
    setJobType(nextJobType)
    setJobPreview(null)
    const nextOption = jobTypeOptions.find((option) => option.value === nextJobType)
    if (nextOption) {
      setJobReason(nextOption.reason)
    }
  }

  function previewAsyncJob() {
    activePreviewJobMutation.mutate(
      {
        reason: jobReason,
        filters: {
          status: jobTypeOption.status,
          week_start: filters.weekStart ?? null,
          parent_id: filters.parentId ?? null,
          student_id: filters.studentId ?? null,
        },
        max_targets: 25,
      },
      {
        onSuccess: setJobPreview,
        onError: (error) => setSingleActionResult(error.message),
      },
    )
  }

  function createAsyncJob() {
    if (!jobPreview) return
    activeCreateJobMutation.mutate(
      {
        reason: jobPreview.reason,
        filters: jobPreview.filters,
        preview_token: jobPreview.preview_token,
        max_targets: jobPreview.max_targets,
      },
      {
        onSuccess: (job) => {
          setSelectedJobId(job.job_id)
          setJobPreview(null)
          setSingleActionResult(`Recovery job queued: ${job.job_id}`)
        },
        onError: (error) => setSingleActionResult(error.message),
      },
    )
  }

  function cancelSelectedJob(jobId: string) {
    cancelJobMutation.mutate(jobId, {
      onSuccess: (job) => setSingleActionResult(`Cancellation requested: ${job.status}`),
      onError: (error) => setSingleActionResult(error.message),
    })
  }

  function selectRecoveryJob(jobId: string) {
    setSelectedJobId(jobId)
    setResumePreview(null)
    setSupportPackage(null)
    setSupportMessage(null)
  }

  function previewResumeJob(jobId: string) {
    previewResumeJobMutation.mutate(
      {
        jobId,
        reason: resumeReason,
        results: ['failed', 'refused', 'not_found', 'skipped_cancelled'],
        max_targets: 25,
      },
      {
        onSuccess: setResumePreview,
        onError: (error) => setSingleActionResult(error.message),
      },
    )
  }

  function createResumeJob(jobId: string) {
    if (!resumePreview) return
    createResumeJobMutation.mutate(
      {
        jobId,
        reason: resumePreview.reason,
        results: resumePreview.result_filters,
        preview_token: resumePreview.preview_token,
        max_targets: resumePreview.max_targets,
      },
      {
        onSuccess: (job) => {
          setSelectedJobId(job.job_id)
          setResumePreview(null)
          setSingleActionResult(`Resume job queued: ${job.job_id}`)
        },
        onError: (error) => setSingleActionResult(error.message),
      },
    )
  }

  function exportSupportPackage(jobId: string) {
    supportPackageMutation.mutate(
      {
        jobId,
        includeTargets: true,
        includeJobAudit: true,
        includeReportAudit: false,
        targetLimit: 50,
        auditLimit: 50,
      },
      {
        onSuccess: (result) => {
          setSupportPackage(result)
          setSupportMessage(`Support package exported: ${result.job.job_id}`)
        },
        onError: (error) => setSupportMessage(error.message),
      },
    )
  }

  function exportSelectedJobEvidence() {
    if (!selectedJobId) return
    evidenceMutation.mutate(
      {
        jobId: selectedJobId,
        includeTargets: true,
        includeJobAudit: true,
        targetLimit: 50,
        auditLimit: 50,
      },
      {
        onSuccess: (result) => {
          setEvidenceExport(result)
          setEvidenceMessage(`Exported ${result.jobs.length} job`)
        },
        onError: (error) => setEvidenceMessage(error.message),
      },
    )
  }

  function exportRecentEvidence() {
    evidenceMutation.mutate(
      {
        status: filters.status,
        limit: 25,
      },
      {
        onSuccess: (result) => {
          setEvidenceExport(result)
          setEvidenceMessage(`Exported ${result.jobs.length} jobs`)
        },
        onError: (error) => setEvidenceMessage(error.message),
      },
    )
  }

  async function copyEvidenceJson() {
    if (!evidenceExport) return
    await navigator.clipboard.writeText(JSON.stringify(evidenceExport, null, 2))
    setEvidenceMessage('Evidence JSON copied')
  }

  function downloadEvidenceJson() {
    if (!evidenceExport) return
    const blob = new Blob([JSON.stringify(evidenceExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stoa-recovery-evidence-${evidenceExport.scope}-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setEvidenceMessage('Evidence JSON downloaded')
  }

  function inspectReleaseFixtureStatus() {
    releaseFixtureStatusMutation.mutate(
      { fixtureName: releaseFixtureName },
      {
        onSuccess: (result) => {
          setReleaseFixtureStatus(result)
          setReleaseEvidenceMessage(`Fixture status: ${result.status}`)
        },
        onError: (error) => setReleaseEvidenceMessage(error.message),
      },
    )
  }

  function createSupportHandoff() {
    let releaseEvidence: Record<string, unknown> | null = null
    if (handoffIncludeRelease) {
      try {
        const parsed = JSON.parse(releaseEvidenceInput)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setHandoffMessage('Release evidence JSON must be an object')
          return
        }
        releaseEvidence = parsed as Record<string, unknown>
      } catch {
        setHandoffMessage('Release evidence JSON is invalid')
        return
      }
    }

    supportHandoffMutation.mutate(
      {
        reason: handoffReason,
        destination_mode: handoffDestination,
        recovery_job_ids: handoffIncludeJob && selectedJobId ? [selectedJobId] : [],
        include_targets: true,
        include_job_audit: true,
        include_report_audit: false,
        target_limit: 50,
        audit_limit: 50,
        release_evidence: releaseEvidence,
        fixture: handoffIncludeFixture ? { fixture_name: releaseFixtureName } : null,
        operator_note: handoffNote.trim() || null,
      },
      {
        onSuccess: (result) => {
          setHandoffPackage(result)
          setHandoffMessage(`Support handoff ${result.destination.status}: ${result.package_id}`)
        },
        onError: (error) => setHandoffMessage(error.message),
      },
    )
  }

  async function copySupportHandoff() {
    if (!handoffPackage) return
    try {
      await navigator.clipboard.writeText(handoffPackage.copy?.text || JSON.stringify(handoffPackage, null, 2))
    } catch {
      // Clipboard can be unavailable in locked-down browser contexts; keep the package visible for manual copy.
    }
    setHandoffMessage('Support handoff copied')
  }

  function downloadSupportHandoff() {
    if (!handoffPackage) return
    const blob = new Blob([JSON.stringify(handoffPackage, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = handoffPackage.download?.filename || `stoa-support-handoff-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setHandoffMessage('Support handoff downloaded')
  }

  function validateReleaseEvidenceInput() {
    let parsed: Record<string, unknown>
    try {
      const value = JSON.parse(releaseEvidenceInput)
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        setReleaseEvidenceMessage('Release evidence JSON must be an object')
        return
      }
      parsed = value as Record<string, unknown>
    } catch {
      setReleaseEvidenceMessage('Release evidence JSON is invalid')
      return
    }
    releaseEvidenceValidationMutation.mutate(parsed, {
      onSuccess: (result) => {
        setReleaseEvidenceValidation(result)
        setReleaseEvidenceMessage(`Release evidence validation: ${result.status}`)
      },
      onError: (error) => setReleaseEvidenceMessage(error.message),
    })
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0" size="wide">
        <PageHeader
          eyebrow="Admin operations"
          title="Report operations"
          description="Triage weekly report generation and delivery recovery from the admin backend."
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => void reportsQuery.refetch()}
              disabled={reportsQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />

        <form className="rounded-md border bg-card/70 p-4" onSubmit={applyFilters}>
          <div className="grid gap-3 md:grid-cols-[minmax(150px,0.8fr),repeat(3,minmax(150px,1fr)),auto]">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
              <select
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                className="h-10 w-full rounded-md border border-border/90 bg-card/75 px-3 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Week start
              <Input
                type="date"
                value={draft.weekStart}
                onChange={(event) => setDraft((current) => ({ ...current, weekStart: event.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Parent ID
              <Input
                value={draft.parentId}
                onChange={(event) => setDraft((current) => ({ ...current, parentId: event.target.value }))}
                placeholder="parent id"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Student ID
              <Input
                value={draft.studentId}
                onChange={(event) => setDraft((current) => ({ ...current, studentId: event.target.value }))}
                placeholder="student id"
              />
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit">
                <Search className="h-4 w-4" />
                Filter
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </form>

        <RecoveryJobControlPanel
          jobType={jobType}
          jobStatus={jobTypeOption.status}
          reason={jobReason}
          onJobTypeChange={changeJobType}
          onReasonChange={setJobReason}
          preview={jobPreview}
          filters={filters}
          isPreviewing={activePreviewJobMutation.isPending}
          isCreating={activeCreateJobMutation.isPending}
          onPreview={previewAsyncJob}
          onCreate={createAsyncJob}
        />

        <RecoveryEvidencePanel
          exportData={evidenceExport}
          selectedJobId={selectedJobId}
          isExporting={evidenceMutation.isPending}
          message={evidenceMessage}
          onExportSelectedJob={exportSelectedJobEvidence}
          onExportRecent={exportRecentEvidence}
          onCopy={copyEvidenceJson}
          onDownload={downloadEvidenceJson}
        />

        <SupportHandoffPanel
          selectedJobId={selectedJobId}
          reason={handoffReason}
          note={handoffNote}
          destination={handoffDestination}
          includeJob={handoffIncludeJob}
          includeRelease={handoffIncludeRelease}
          includeFixture={handoffIncludeFixture}
          packageData={handoffPackage}
          message={handoffMessage}
          isGenerating={supportHandoffMutation.isPending}
          onReasonChange={setHandoffReason}
          onNoteChange={setHandoffNote}
          onDestinationChange={setHandoffDestination}
          onIncludeJobChange={setHandoffIncludeJob}
          onIncludeReleaseChange={setHandoffIncludeRelease}
          onIncludeFixtureChange={setHandoffIncludeFixture}
          onGenerate={createSupportHandoff}
          onCopy={copySupportHandoff}
          onDownload={downloadSupportHandoff}
        />

        <ReleaseEvidenceAutomationPanel
          fixtureName={releaseFixtureName}
          evidenceInput={releaseEvidenceInput}
          validation={releaseEvidenceValidation}
          fixtureStatus={releaseFixtureStatus}
          message={releaseEvidenceMessage}
          isValidating={releaseEvidenceValidationMutation.isPending}
          isLoadingFixture={releaseFixtureStatusMutation.isPending}
          onFixtureNameChange={setReleaseFixtureName}
          onEvidenceInputChange={setReleaseEvidenceInput}
          onValidate={validateReleaseEvidenceInput}
          onInspectFixture={inspectReleaseFixtureStatus}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
          <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {reportsQuery.isFetching ? 'Loading reports' : `${reportsQuery.data?.count ?? 0} reports`}
                {reportsQuery.data?.access_pattern && (
                  <span className="ml-2 rounded-md border px-2 py-1 text-xs">
                    {reportsQuery.data.access_pattern}
                  </span>
                )}
              </div>
              <Button
                type="button"
                onClick={resendSelectedBulk}
                disabled={selectedBulkTargets.length === 0 || bulkResendMutation.isPending}
              >
                <Send className="h-4 w-4" />
                Resend selected ({selectedBulkTargets.length})
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border bg-card">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-10 px-3 py-3">Pick</th>
                    <th className="px-3 py-3">Report</th>
                    <th className="px-3 py-3">Student</th>
                    <th className="px-3 py-3">Week</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Delivery</th>
                    <th className="px-3 py-3">Last operation</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsQuery.isLoading && (
                    <tr>
                      <td className="px-3 py-8 text-muted-foreground" colSpan={8}>
                        Loading report operations.
                      </td>
                    </tr>
                  )}
                  {!reportsQuery.isLoading && rows.length === 0 && (
                    <tr>
                      <td className="px-3 py-8 text-muted-foreground" colSpan={8}>
                        No reports match current filters.
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => {
                    const key = targetKey(row)
                    const resendEnabled = row.actions.resend_email.enabled
                    return (
                      <tr key={key} className="border-b last:border-0">
                        <td className="px-3 py-3 align-top">
                          <input
                            type="checkbox"
                            aria-label={`Select ${row.report_id}`}
                            checked={selectedKeys.has(key)}
                            disabled={!resendEnabled}
                            onChange={() => toggleSelection(row)}
                            className="h-4 w-4 rounded border-border"
                          />
                        </td>
                        <td className="max-w-[220px] px-3 py-3 align-top">
                          <p className="truncate font-medium">{row.report_id}</p>
                          <p className="truncate text-xs text-muted-foreground">{row.parent_id}</p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="font-medium">{row.student_name || row.student_id}</p>
                          <p className="text-xs text-muted-foreground">{row.student_id}</p>
                        </td>
                        <td className="px-3 py-3 align-top">{row.week_start}</td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge status={row.email_status} />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p>{row.operations.last_operation || 'None'}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.operations.last_operation_result || 'No result'}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTarget(targetFromReport(row))
                              setSingleActionResult(null)
                              setActiveEditDraft(null)
                              setEditMessage(null)
                              setActiveArtifactPreview(null)
                              setArtifactEditMessage(null)
                              setActiveRollbackPreview(null)
                              setArtifactRollbackMessage(null)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" disabled={tokenHistory.length === 0} onClick={goPreviousPage}>
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {tokenHistory.length + 1}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={!reportsQuery.data?.next_token}
                onClick={goNextPage}
              >
                Next
              </Button>
            </div>
          </section>

          <aside className="min-w-0 space-y-4">
            <ReportDetailPanel
              report={detail}
              isLoading={detailQuery.isLoading}
              auditEvents={reportAuditQuery.data?.items ?? []}
              auditLoading={reportAuditQuery.isLoading}
              onRetry={retrySelectedReport}
              onResend={resendSelectedReport}
              editReason={editReason}
              editFields={editFields}
              editDraft={activeEditDraft}
              editMessage={editMessage}
              artifactEditReason={artifactEditReason}
              artifactEditFields={artifactEditFields}
              artifactPreview={activeArtifactPreview}
              artifactEditMessage={artifactEditMessage}
              artifactRollbackReason={artifactRollbackReason}
              rollbackPreview={activeRollbackPreview}
              artifactRollbackMessage={artifactRollbackMessage}
              onEditReasonChange={setEditReason}
              onEditFieldChange={updateEditField}
              onArtifactEditReasonChange={setArtifactEditReason}
              onArtifactEditFieldChange={updateArtifactEditField}
              onArtifactRollbackReasonChange={updateArtifactRollbackReason}
              onCreateEditDraft={createEditDraft}
              onApplyEditDraft={applyEditDraft}
              onCreateArtifactPreview={createArtifactEditPreview}
              onApplyArtifactPreview={applyArtifactEditPreview}
              onCreateRollbackPreview={createArtifactRollbackPreview}
              onApplyRollbackPreview={applyArtifactRollbackPreview}
              retryPending={retryMutation.isPending}
              resendPending={resendMutation.isPending}
              createEditPending={createEditDraftMutation.isPending}
              applyEditPending={applyEditDraftMutation.isPending}
              createArtifactPreviewPending={createArtifactPreviewMutation.isPending}
              applyArtifactPreviewPending={applyArtifactPreviewMutation.isPending}
              createRollbackPreviewPending={createRollbackPreviewMutation.isPending}
              applyRollbackPreviewPending={applyRollbackPreviewMutation.isPending}
              actionResult={singleActionResult}
            />
            <RecoveryJobsPanel
              jobs={jobsQuery.data?.items ?? []}
              isLoading={jobsQuery.isLoading}
              selectedJobId={selectedJobId}
              selectedResults={jobResultsQuery.data?.items ?? []}
              selectedAuditEvents={jobAuditQuery.data?.items ?? []}
              resumeReason={resumeReason}
              resumePreview={resumePreview}
              supportPackage={supportPackage}
              supportMessage={supportMessage}
              onSelect={selectRecoveryJob}
              onCancel={cancelSelectedJob}
              onResumeReasonChange={setResumeReason}
              onPreviewResume={previewResumeJob}
              onCreateResume={createResumeJob}
              onExportSupportPackage={exportSupportPackage}
              cancelPending={cancelJobMutation.isPending}
              resumePreviewPending={previewResumeJobMutation.isPending}
              resumeCreatePending={createResumeJobMutation.isPending}
              supportPackagePending={supportPackageMutation.isPending}
            />
            {bulkResults.length > 0 && <BulkResultPanel results={bulkResults} />}
          </aside>
        </div>

        {reportsQuery.isError && (
          <AdminUnavailableCard
            title="Report operations unavailable"
            description="We could not load report operations right now. Please try again in a moment."
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function ReleaseEvidenceAutomationPanel({
  fixtureName,
  evidenceInput,
  validation,
  fixtureStatus,
  message,
  isValidating,
  isLoadingFixture,
  onFixtureNameChange,
  onEvidenceInputChange,
  onValidate,
  onInspectFixture,
}: {
  fixtureName: string
  evidenceInput: string
  validation: ReleaseEvidenceValidationResult | null
  fixtureStatus: ReleaseFixtureStatus | null
  message: string | null
  isValidating: boolean
  isLoadingFixture: boolean
  onFixtureNameChange: (value: string) => void
  onEvidenceInputChange: (value: string) => void
  onValidate: () => void
  onInspectFixture: () => void
}) {
  const bundle = objectValue(validation?.bundle)
  const backend = objectValue(bundle.backend)
  const frontend = objectValue(bundle.frontend)
  const infra = objectValue(bundle.infra)
  const apiCheck = firstRecord(bundle.api_checks)
  const browserSmoke = objectValue(bundle.browser_smoke)
  const validationIssues = validation
    ? [
        ...validation.missing_required_fields.map((item) => `Missing: ${item}`),
        ...validation.schema_errors,
        ...validation.status_errors,
        ...validation.fixture_errors,
      ]
    : []
  const privacyIssues =
    validation?.privacy.violations.map((item) => `${item.path || 'unknown'}: ${item.marker || 'private marker'}`) ?? []
  const fixturePrivacyIssues =
    fixtureStatus?.privacy.violations.map((item) => `${item.path || 'unknown'}: ${item.marker || 'private marker'}`) ?? []
  return (
    <section className="rounded-md border bg-card/70 p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),420px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Release evidence automation</h2>
            <Badge variant="outline">Read only</Badge>
            <Badge variant="outline">Fixture safe</Badge>
          </div>
          <details className="rounded-md border bg-muted/20 p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Release bundle JSON
            </summary>
            <textarea
              value={evidenceInput}
              onChange={(event) => onEvidenceInputChange(event.target.value)}
              className="mt-3 min-h-36 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 font-mono text-xs normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
            />
          </details>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),minmax(240px,0.45fr)]">
            <div className="grid gap-2 sm:grid-cols-4">
              <MetricPill label="Missing" value={validation?.missing_required_fields.length ?? 0} />
              <MetricPill label="Violations" value={validation?.privacy.violation_count ?? 0} />
              <MetricPill label="Approved" value={fixtureStatus?.approved ? 1 : 0} />
              <MetricPill label="Audit refs" value={fixtureStatus?.audit_refs.length ?? 0} />
            </div>
            <div className="space-y-3">
              <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Safe fixture
                <Input value={fixtureName} onChange={(event) => onFixtureNameChange(event.target.value)} />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={onValidate} disabled={isValidating}>
                  <ShieldCheck className="h-4 w-4" />
                  Validate release evidence
                </Button>
                <Button type="button" variant="outline" onClick={onInspectFixture} disabled={isLoadingFixture}>
                  <Eye className="h-4 w-4" />
                  Check fixture status
                </Button>
              </div>
              {message && <p className="text-xs text-muted-foreground">{message}</p>}
            </div>
          </div>
        </div>
        <div className="min-w-0 rounded-md border bg-muted/25 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Release status</p>
            <div className="flex flex-wrap gap-1">
              {validation && <StatusBadge status={validation.status} />}
              {fixtureStatus && <StatusBadge status={fixtureStatus.status} />}
            </div>
          </div>
          {validation && (
            <div className="mb-3 space-y-2">
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <DetailItem label="Backend SHA" value={stringValue(backend.commit_sha)} />
                <DetailItem label="Backend run" value={stringValue(backend.deploy_run_id)} />
                <DetailItem label="Frontend SHA" value={stringValue(frontend.commit_sha)} />
                <DetailItem label="Frontend run" value={stringValue(frontend.deploy_run_id)} />
                <DetailItem label="CDK diff" value={stringValue(infra.cdk_diff)} />
                <DetailItem label="API request" value={stringValue(apiCheck.request_id)} />
                <DetailItem label="Browser route" value={stringValue(browserSmoke.route)} />
                <DetailItem label="Validated" value={formatDate(validation.validated_at)} />
              </div>
              <IssueRows title="Validation issues" items={validationIssues} emptyText="No validation issues." />
              <IssueRows title="Privacy violations" items={privacyIssues} emptyText="No privacy violations." />
            </div>
          )}
          {fixtureStatus && (
            <div className="mb-3 grid gap-2 text-xs">
              <DetailItem label="Fixture" value={fixtureStatus.fixture_name} />
              <DetailItem label="Current version" value={versionLabel(fixtureStatus.artifact_versions.current)} />
              <DetailItem label="Expected baseline" value={versionLabel(fixtureStatus.artifact_versions.expected_baseline)} />
              <DetailItem label="Report" value={fixtureStatus.report.report_id} />
              <DetailItem label="Fixture privacy" value={fixtureStatus.privacy.passed ? 'passed' : 'failed'} />
              <DetailItem
                label="Mutation refusal"
                value={String(Boolean(fixtureStatus.mutation_refusal.would_refuse_without_mutation_mode))}
              />
            </div>
          )}
          {fixtureStatus && (
            <IssueRows title="Fixture privacy issues" items={fixturePrivacyIssues} emptyText="No fixture privacy issues." />
          )}
          {!validation && !fixtureStatus && (
            <p className="text-sm text-muted-foreground">Validate a release evidence bundle to preview redacted output.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function firstRecord(value: unknown): Record<string, unknown> {
  if (!Array.isArray(value)) return {}
  return objectValue(value[0])
}

function stringValue(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

function IssueRows({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-md border bg-background/60 p-2">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-1">
          {items.slice(0, 6).map((item) => (
            <p key={item} className="break-words rounded-md bg-muted/35 px-2 py-1 text-xs text-muted-foreground">
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function RecoveryEvidencePanel({
  exportData,
  selectedJobId,
  isExporting,
  message,
  onExportSelectedJob,
  onExportRecent,
  onCopy,
  onDownload,
}: {
  exportData: RecoveryEvidenceExport | null
  selectedJobId: string | null
  isExporting: boolean
  message: string | null
  onExportSelectedJob: () => void
  onExportRecent: () => void
  onCopy: () => void
  onDownload: () => void
}) {
  const jsonPreview = exportData ? JSON.stringify(exportData, null, 2) : ''
  return (
    <section className="rounded-md border bg-card/70 p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),420px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <FileJson className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Recovery evidence export</h2>
            <Badge variant="outline">Read only</Badge>
            <Badge variant="outline">Metadata only</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onExportSelectedJob}
              disabled={!selectedJobId || isExporting}
            >
              <FileJson className="h-4 w-4" />
              Export selected job
            </Button>
            <Button type="button" variant="outline" onClick={onExportRecent} disabled={isExporting}>
              <ClipboardList className="h-4 w-4" />
              Export recent jobs
            </Button>
            <Button type="button" variant="outline" onClick={onCopy} disabled={!exportData}>
              <Copy className="h-4 w-4" />
              Copy JSON
            </Button>
            <Button type="button" variant="outline" onClick={onDownload} disabled={!exportData}>
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
          {exportData && (
            <div className="grid gap-2 sm:grid-cols-4">
              <MetricPill label="Jobs" value={exportData.jobs.length} />
              <MetricPill label="Targets" value={exportData.targets.length} />
              <MetricPill label="Audit" value={exportData.job_audit.length + exportData.report_audit.length} />
              <MetricPill label="Complete" value={exportData.complete ? 1 : 0} />
            </div>
          )}
        </div>
        <div className="min-w-0 rounded-md border bg-muted/25 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence JSON</p>
            {exportData?.request_id && (
              <span className="max-w-[180px] truncate rounded-md border px-2 py-1 text-[10px] text-muted-foreground">
                {exportData.request_id}
              </span>
            )}
          </div>
          {exportData ? (
            <pre className="max-h-56 overflow-auto rounded-md bg-background/80 p-3 text-xs">
              {jsonPreview}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No evidence export loaded.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function ReportDetailPanel({
  report,
  isLoading,
  auditEvents,
  auditLoading,
  onRetry,
  onResend,
  editReason,
  editFields,
  editDraft,
  editMessage,
  artifactEditReason,
  artifactEditFields,
  artifactPreview,
  artifactEditMessage,
  artifactRollbackReason,
  rollbackPreview,
  artifactRollbackMessage,
  onEditReasonChange,
  onEditFieldChange,
  onArtifactEditReasonChange,
  onArtifactEditFieldChange,
  onArtifactRollbackReasonChange,
  onCreateEditDraft,
  onApplyEditDraft,
  onCreateArtifactPreview,
  onApplyArtifactPreview,
  onCreateRollbackPreview,
  onApplyRollbackPreview,
  retryPending,
  resendPending,
  createEditPending,
  applyEditPending,
  createArtifactPreviewPending,
  applyArtifactPreviewPending,
  createRollbackPreviewPending,
  applyRollbackPreviewPending,
  actionResult,
}: {
  report?: ReportOperationRow
  isLoading: boolean
  auditEvents: ReportAuditEvent[]
  auditLoading: boolean
  onRetry: () => void
  onResend: () => void
  editReason: string
  editFields: { admin_note: string; editor_summary: string; status_note: string }
  editDraft: ReportEditDraft | null
  editMessage: string | null
  artifactEditReason: string
  artifactEditFields: { summary: string; recommendations: string }
  artifactPreview: ReportArtifactEditPreview | null
  artifactEditMessage: string | null
  artifactRollbackReason: string
  rollbackPreview: ReportArtifactRollbackPreview | null
  artifactRollbackMessage: string | null
  onEditReasonChange: (value: string) => void
  onEditFieldChange: (field: 'admin_note' | 'editor_summary' | 'status_note', value: string) => void
  onArtifactEditReasonChange: (value: string) => void
  onArtifactEditFieldChange: (field: 'summary' | 'recommendations', value: string) => void
  onArtifactRollbackReasonChange: (value: string) => void
  onCreateEditDraft: () => void
  onApplyEditDraft: () => void
  onCreateArtifactPreview: () => void
  onApplyArtifactPreview: () => void
  onCreateRollbackPreview: () => void
  onApplyRollbackPreview: () => void
  retryPending: boolean
  resendPending: boolean
  createEditPending: boolean
  applyEditPending: boolean
  createArtifactPreviewPending: boolean
  applyArtifactPreviewPending: boolean
  createRollbackPreviewPending: boolean
  applyRollbackPreviewPending: boolean
  actionResult: string | null
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Loading report detail.</CardContent>
      </Card>
    )
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Select a report to inspect operations.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">Report detail</CardTitle>
        <p className="break-words text-xs text-muted-foreground">{report.report_id}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Status" value={report.status} />
          <DetailItem label="Email" value={report.email_status} />
          <DetailItem label="Student" value={report.student_name || report.student_id} />
          <DetailItem label="Week" value={report.week_start} />
        </div>
        <div className="rounded-md border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artifacts</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={report.artifacts.json_available ? 'secondary' : 'outline'}>JSON metadata</Badge>
            <Badge variant={report.artifacts.html_available ? 'secondary' : 'outline'}>HTML available</Badge>
          </div>
        </div>
        <div className="space-y-2">
          <DetailItem label="Generation error" value={report.generation.generation_error_message} />
          <DetailItem label="Delivery error" value={report.delivery.email_error_message} />
          <DetailItem label="Last operator" value={report.operations.last_operation_by} />
          <DetailItem label="Last updated" value={formatDate(report.operations.updated_at)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={!report.actions.retry_generation.enabled || retryPending}
            title={report.actions.retry_generation.reason ?? undefined}
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onResend}
            disabled={!report.actions.resend_email.enabled || resendPending}
            title={report.actions.resend_email.reason ?? undefined}
          >
            <Mail className="h-4 w-4" />
            Resend
          </Button>
        </div>
        {actionResult && (
          <div className="rounded-md border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
            {actionResult}
          </div>
        )}
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <FileJson className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artifact edit preview</p>
            <Badge variant="outline">Versioned apply</Badge>
          </div>
          <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Artifact edit reason
            <textarea
              value={artifactEditReason}
              onChange={(event) => onArtifactEditReasonChange(event.target.value)}
              className="min-h-16 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
            />
          </label>
          <div className="grid gap-2">
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Artifact summary
              <textarea
                value={artifactEditFields.summary}
                onChange={(event) => onArtifactEditFieldChange('summary', event.target.value)}
                className="min-h-16 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Artifact recommendations
              <textarea
                value={artifactEditFields.recommendations}
                onChange={(event) => onArtifactEditFieldChange('recommendations', event.target.value)}
                className="min-h-16 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCreateArtifactPreview}
              disabled={createArtifactPreviewPending || artifactEditReason.trim().length === 0 || report.actions.edit_artifact?.enabled === false}
              title={report.actions.edit_artifact?.reason ?? undefined}
            >
              <Eye className="h-4 w-4" />
              Preview artifact edit
            </Button>
            <Button
              type="button"
              onClick={onApplyArtifactPreview}
              disabled={!artifactPreview || artifactPreview.status !== 'draft' || applyArtifactPreviewPending}
            >
              <Send className="h-4 w-4" />
              Apply artifact edit
            </Button>
          </div>
          {artifactPreview && (
            <div className="space-y-2 rounded-md border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
              <p className="truncate font-medium text-foreground">{artifactPreview.draft_id}</p>
              <div className="grid gap-1">
                {artifactPreview.diff.map((item) => (
                  <div key={item.field} className="rounded-md bg-background/70 px-2 py-1">
                    <span className="font-medium text-foreground">{item.field}</span>
                    <span> {item.changed ? 'changed' : 'unchanged'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {artifactEditMessage && (
            <div className="rounded-md border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
              {artifactEditMessage}
            </div>
          )}
        </div>
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artifact rollback</p>
            <Badge variant="outline">Pointer restore</Badge>
            <Badge variant="outline">Metadata only</Badge>
          </div>
          <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Rollback reason
            <textarea
              value={artifactRollbackReason}
              onChange={(event) => onArtifactRollbackReasonChange(event.target.value)}
              className="min-h-16 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCreateRollbackPreview}
              disabled={
                createRollbackPreviewPending ||
                artifactRollbackReason.trim().length === 0 ||
                report.actions.rollback_artifact?.enabled === false
              }
              title={report.actions.rollback_artifact?.reason ?? undefined}
            >
              <Eye className="h-4 w-4" />
              Preview rollback
            </Button>
            <Button
              type="button"
              onClick={onApplyRollbackPreview}
              disabled={!rollbackPreview || rollbackPreview.status !== 'draft' || applyRollbackPreviewPending}
            >
              <Send className="h-4 w-4" />
              Apply rollback
            </Button>
          </div>
          {rollbackPreview && (
            <div className="space-y-2 rounded-md border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
              <p className="truncate font-medium text-foreground">{rollbackPreview.preview_id}</p>
              <div className="grid gap-1 sm:grid-cols-2">
                <DetailItem label="Current version" value={versionLabel(rollbackPreview.source_artifact_version_id)} />
                <DetailItem label="Rollback target" value={versionLabel(rollbackPreview.target_artifact_version_id)} />
                <DetailItem label="Validation" value={rollbackPreview.validation_result} />
                <DetailItem label="Status" value={rollbackPreview.status} />
              </div>
            </div>
          )}
          {artifactRollbackMessage && (
            <div className="rounded-md border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
              {artifactRollbackMessage}
            </div>
          )}
        </div>
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilePenLine className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Report edit draft</p>
            <Badge variant="outline">Metadata only</Badge>
          </div>
          <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Edit reason
            <textarea
              value={editReason}
              onChange={(event) => onEditReasonChange(event.target.value)}
              className="min-h-16 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
            />
          </label>
          <div className="grid gap-2">
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Admin note
              <textarea
                value={editFields.admin_note}
                onChange={(event) => onEditFieldChange('admin_note', event.target.value)}
                className="min-h-14 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Editor summary
              <textarea
                value={editFields.editor_summary}
                onChange={(event) => onEditFieldChange('editor_summary', event.target.value)}
                className="min-h-14 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status note
              <textarea
                value={editFields.status_note}
                onChange={(event) => onEditFieldChange('status_note', event.target.value)}
                className="min-h-14 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCreateEditDraft}
              disabled={createEditPending || editReason.trim().length === 0}
            >
              <ClipboardList className="h-4 w-4" />
              Create draft
            </Button>
            <Button
              type="button"
              onClick={onApplyEditDraft}
              disabled={!editDraft || editDraft.status !== 'draft' || applyEditPending}
            >
              <Send className="h-4 w-4" />
              Apply draft
            </Button>
          </div>
          {editDraft && (
            <div className="rounded-md border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
              <p className="truncate font-medium text-foreground">{editDraft.draft_id}</p>
              <p>
                {editDraft.status} · {Object.keys(editDraft.proposed_fields).join(', ')}
              </p>
            </div>
          )}
          {editMessage && (
            <div className="rounded-md border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
              {editMessage}
            </div>
          )}
        </div>
        <AuditTimeline
          title="Report audit"
          events={auditEvents}
          isLoading={auditLoading}
          emptyText="No report audit events yet."
        />
      </CardContent>
    </Card>
  )
}

function RecoveryJobControlPanel({
  jobType,
  jobStatus,
  reason,
  onJobTypeChange,
  onReasonChange,
  preview,
  filters,
  isPreviewing,
  isCreating,
  onPreview,
  onCreate,
}: {
  jobType: RecoveryJobType
  jobStatus: string
  reason: string
  onJobTypeChange: (value: RecoveryJobType) => void
  onReasonChange: (value: string) => void
  preview: RecoveryJobPreviewResponse | null
  filters: ReportOperationsListFilters
  isPreviewing: boolean
  isCreating: boolean
  onPreview: () => void
  onCreate: () => void
}) {
  return (
    <section className="rounded-md border bg-card/70 p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),340px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Async recovery job</h2>
            <Badge variant="outline">Metadata only</Badge>
            <Badge variant="outline">Cooperative cancellation</Badge>
          </div>
          <div className="inline-flex rounded-md border bg-muted/25 p-1">
            {jobTypeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={jobType === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onJobTypeChange(option.value)}
              >
                {option.value === 'retry_generation' ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {option.label}
              </Button>
            ))}
          </div>
          <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Operator reason
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              className="min-h-20 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onPreview} disabled={isPreviewing || reason.trim().length === 0}>
              <ClipboardList className="h-4 w-4" />
              Preview async job
            </Button>
            <Button type="button" onClick={onCreate} disabled={!preview || isCreating}>
              <Send className="h-4 w-4" />
              Start job
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Scope uses current week, parent, and student filters with status fixed to {jobStatus}.
            {filters.weekStart ? ` Week ${filters.weekStart}.` : ''}
          </p>
        </div>
        <div className="rounded-md border bg-muted/25 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
          {!preview && <p className="text-sm text-muted-foreground">Run a preview before starting an async job.</p>}
          {preview && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <MetricPill label="Eligible" value={preview.eligible_count} />
                <MetricPill label="Refused" value={preview.refused_count} />
                <MetricPill label="Pages" value={preview.scanned_pages} />
              </div>
              <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                {preview.sample.map((target) => (
                  <div key={target.target_id} className="flex items-center justify-between gap-2 rounded-md border bg-card/70 px-2 py-1.5">
                    <span className="min-w-0 truncate">{target.student_name || target.student_id}</span>
                    <StatusBadge status={target.eligibility} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function SupportHandoffPanel({
  selectedJobId,
  reason,
  note,
  destination,
  includeJob,
  includeRelease,
  includeFixture,
  packageData,
  message,
  isGenerating,
  onReasonChange,
  onNoteChange,
  onDestinationChange,
  onIncludeJobChange,
  onIncludeReleaseChange,
  onIncludeFixtureChange,
  onGenerate,
  onCopy,
  onDownload,
}: {
  selectedJobId: string | null
  reason: string
  note: string
  destination: SupportHandoffDestinationMode
  includeJob: boolean
  includeRelease: boolean
  includeFixture: boolean
  packageData: SupportHandoffPackage | null
  message: string | null
  isGenerating: boolean
  onReasonChange: (value: string) => void
  onNoteChange: (value: string) => void
  onDestinationChange: (value: SupportHandoffDestinationMode) => void
  onIncludeJobChange: (value: boolean) => void
  onIncludeReleaseChange: (value: boolean) => void
  onIncludeFixtureChange: (value: boolean) => void
  onGenerate: () => void
  onCopy: () => void
  onDownload: () => void
}) {
  const destinationOptions: { value: SupportHandoffDestinationMode; label: string }[] = [
    { value: 'preview', label: 'Preview' },
    { value: 'copy', label: 'Copy' },
    { value: 'download', label: 'Download' },
    { value: 'external_write', label: 'External write' },
  ]
  return (
    <section role="region" aria-label="Support handoff" className="rounded-md border bg-card/70 p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Support handoff</h2>
            <Badge variant="outline">Manual destinations</Badge>
            <Badge variant="outline">Metadata only</Badge>
          </div>
          <div className="inline-flex flex-wrap rounded-md border bg-muted/25 p-1">
            {destinationOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={destination === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onDestinationChange(option.value)}
                aria-pressed={destination === option.value}
              >
                {option.value === 'download' ? <Download className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                {option.label}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Handoff reason
              <textarea
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                className="min-h-20 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Operator note
              <textarea
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                className="min-h-20 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <label className="inline-flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
              <input type="checkbox" checked={includeJob} onChange={(event) => onIncludeJobChange(event.target.checked)} />
              Selected job
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
              <input type="checkbox" checked={includeRelease} onChange={(event) => onIncludeReleaseChange(event.target.checked)} />
              Release evidence JSON
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
              <input type="checkbox" checked={includeFixture} onChange={(event) => onIncludeFixtureChange(event.target.checked)} />
              Safe fixture
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onGenerate} disabled={isGenerating || reason.trim().length === 0}>
              <FileJson className="h-4 w-4" />
              {isGenerating ? 'Generating handoff package' : 'Generate handoff package'}
            </Button>
            <Button type="button" variant="outline" onClick={onCopy} disabled={!packageData}>
              <Copy className="h-4 w-4" />
              Copy package
            </Button>
            <Button type="button" variant="outline" onClick={onDownload} disabled={!packageData}>
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </div>
        <div className="rounded-md border bg-muted/25 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Package preview</p>
          {isGenerating && <p className="text-sm text-muted-foreground">Generating handoff package.</p>}
          {!isGenerating && !packageData && (
            <p className="text-sm text-muted-foreground">Generate a handoff package for ticket copy or download.</p>
          )}
          {packageData && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <MetricPill label="Refs" value={packageData.evidence_references.length} />
                <MetricPill label="Sections" value={packageData.sections.length} />
                <MetricPill label="Privacy" value={packageData.validation.privacy.passed ? 1 : 0} />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <DetailItem label="Package" value={packageData.package_id} />
                <DetailItem label="Destination" value={`${packageData.destination.mode} · ${packageData.destination.status}`} />
                <DetailItem label="Validation" value={packageData.validation.status} />
                <DetailItem label="Generated" value={formatDate(packageData.generated_at)} />
                {selectedJobId && <DetailItem label="Selected job" value={selectedJobId} />}
                {packageData.download && <DetailItem label="Download" value={packageData.download.filename} />}
                {packageData.copy && <DetailItem label="Copy format" value={packageData.copy.format} />}
              </div>
              {packageData.destination.refusal_reasons.length > 0 && (
                <div className="rounded-md border bg-background/70 px-2 py-1.5 text-xs text-muted-foreground">
                  {packageData.destination.refusal_reasons.join('; ')}
                </div>
              )}
              {packageData.evidence_references.length > 0 && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold uppercase tracking-wide">Evidence refs</p>
                  {packageData.evidence_references.map((reference) => (
                    <DetailItem key={`${reference.type}-${reference.id}`} label={reference.type.replace(/_/g, ' ')} value={reference.id} />
                  ))}
                </div>
              )}
              {packageData.sections.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {packageData.sections.map((section) => (
                    <Badge key={`${section.type}-${section.status}`} variant="outline">
                      {section.type.replace(/_/g, ' ')} · {section.status}
                    </Badge>
                  ))}
                </div>
              )}
              {packageData.audit.audit_event_refs.length > 0 && (
                <div className="rounded-md border bg-background/70 px-2 py-1.5 text-xs text-muted-foreground">
                  Audit refs: {packageData.audit.audit_event_refs.map((event) => event.event_id).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function RecoveryJobsPanel({
  jobs,
  isLoading,
  selectedJobId,
  selectedResults,
  selectedAuditEvents,
  resumeReason,
  resumePreview,
  supportPackage,
  supportMessage,
  onSelect,
  onCancel,
  onResumeReasonChange,
  onPreviewResume,
  onCreateResume,
  onExportSupportPackage,
  cancelPending,
  resumePreviewPending,
  resumeCreatePending,
  supportPackagePending,
}: {
  jobs: RecoveryJob[]
  isLoading: boolean
  selectedJobId: string | null
  selectedResults: RecoveryJobTarget[]
  selectedAuditEvents: ReportAuditEvent[]
  resumeReason: string
  resumePreview: RecoveryJobResumePreviewResponse | null
  supportPackage: RecoveryJobSupportPackage | null
  supportMessage: string | null
  onSelect: (jobId: string) => void
  onCancel: (jobId: string) => void
  onResumeReasonChange: (value: string) => void
  onPreviewResume: (jobId: string) => void
  onCreateResume: (jobId: string) => void
  onExportSupportPackage: (jobId: string) => void
  cancelPending: boolean
  resumePreviewPending: boolean
  resumeCreatePending: boolean
  supportPackagePending: boolean
}) {
  const selectedJob = jobs.find((job) => job.job_id === selectedJobId) ?? jobs[0]
  const canCancel = selectedJob && ['queued', 'running', 'cancellation_requested'].includes(selectedJob.status)
  const resumableCount = selectedResults.filter((target) => isResumableTargetResult(target.result)).length
  const canResume = Boolean(selectedJob && resumableCount > 0 && !['queued', 'running', 'cancellation_requested'].includes(selectedJob.status))
  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">Recovery jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        {isLoading && <p className="text-sm text-muted-foreground">Loading recovery jobs.</p>}
        {!isLoading && jobs.length === 0 && <p className="text-sm text-muted-foreground">No async recovery jobs yet.</p>}
        <div className="space-y-2">
          {jobs.slice(0, 5).map((job) => {
            const issueCount = job.failed_count + job.refused_count + job.not_found_count
            return (
              <button
                key={job.job_id}
                type="button"
                onClick={() => onSelect(job.job_id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted/40 ${job.job_id === selectedJob?.job_id ? 'border-primary/60 bg-muted/35' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{job.reason || job.job_id}</span>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{recoveryJobTypeLabel(job.job_type)}</span>
                  <span>
                    {job.success_count}/{job.target_count} succeeded · {issueCount} issues
                  </span>
                </p>
              </button>
            )
          })}
        </div>
        {selectedJob && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold">{selectedJob.job_id}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canCancel || cancelPending}
                onClick={() => onCancel(selectedJob.job_id)}
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MetricPill label="Pending" value={selectedJob.pending_count} />
              <MetricPill label="Attempted" value={selectedJob.attempted_count} />
              <MetricPill label="Skipped" value={selectedJob.skipped_cancelled_count} />
            </div>
            <div className="space-y-2 rounded-md border bg-muted/20 p-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canResume || resumePreviewPending || resumeReason.trim().length === 0}
                  onClick={() => onPreviewResume(selectedJob.job_id)}
                >
                  <ClipboardList className="h-4 w-4" />
                  Preview resume
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!resumePreview || resumePreview.source_job_id !== selectedJob.job_id || resumeCreatePending}
                  onClick={() => onCreateResume(selectedJob.job_id)}
                >
                  <Send className="h-4 w-4" />
                  Start resume
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={supportPackagePending}
                  onClick={() => onExportSupportPackage(selectedJob.job_id)}
                >
                  <FileJson className="h-4 w-4" />
                  Support package
                </Button>
              </div>
              <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resume reason
                <textarea
                  value={resumeReason}
                  onChange={(event) => onResumeReasonChange(event.target.value)}
                  className="min-h-16 w-full rounded-md border border-border/90 bg-card/75 px-2 py-1.5 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
                />
              </label>
              {resumePreview && resumePreview.source_job_id === selectedJob.job_id && (
                <div className="grid grid-cols-3 gap-2">
                  <MetricPill label="Resume" value={resumePreview.eligible_count} />
                  <MetricPill label="Scanned" value={resumePreview.scanned_targets} />
                  <MetricPill label="Issues" value={resumableCount} />
                </div>
              )}
              {supportMessage && <p className="text-xs text-muted-foreground">{supportMessage}</p>}
              {supportPackage && supportPackage.job.job_id === selectedJob.job_id && (
                <pre className="max-h-40 overflow-auto rounded-md bg-background p-2 text-[11px] leading-relaxed text-muted-foreground">
                  {JSON.stringify(supportPackage, null, 2)}
                </pre>
              )}
            </div>
            <div className="space-y-2">
              {selectedResults.slice(0, 4).map((target) => (
                <div key={target.target_id} className="flex items-start justify-between gap-2 rounded-md border px-2 py-1.5 text-xs">
                  <span className="min-w-0 truncate">{target.student_name || target.student_id || target.target_id}</span>
                  <StatusBadge status={target.result} />
                </div>
              ))}
            </div>
            <AuditTimeline
              title="Job audit"
              events={selectedAuditEvents}
              isLoading={false}
              emptyText="No job audit events yet."
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function recoveryJobTypeLabel(jobType?: string | null) {
  if (jobType === 'retry_generation') return 'Retry generation'
  return 'Resend email'
}

function isResumableTargetResult(result?: string | null) {
  return result === 'failed' || result === 'refused' || result === 'not_found' || result === 'skipped_cancelled'
}

function AuditTimeline({
  title,
  events,
  isLoading,
  emptyText,
}: {
  title: string
  events: ReportAuditEvent[]
  isLoading: boolean
  emptyText: string
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {isLoading && <p className="text-xs text-muted-foreground">Loading audit timeline.</p>}
      {!isLoading && events.length === 0 && <p className="text-xs text-muted-foreground">{emptyText}</p>}
      <div className="space-y-2">
        {events.slice(0, 5).map((event) => (
          <div key={event.event_id} className="rounded-md bg-muted/35 px-2 py-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{event.action.replace(/_/g, ' ')}</span>
              <StatusBadge status={event.result} />
            </div>
            <p className="mt-1 text-muted-foreground">
              {event.actor || event.source || 'system'} · {formatDate(event.event_at)}
            </p>
            {event.error_message && <p className="mt-1 break-words text-muted-foreground">{event.error_message}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card/70 px-2 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  )
}

function BulkResultPanel({ results }: { results: BulkReportResendItemResult[] }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">Bulk resend results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {results.map((result) => (
          <div
            key={targetKey(result)}
            className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{result.student_id}</p>
              <p className="text-xs text-muted-foreground">{result.detail || result.status || result.week_start}</p>
            </div>
            <StatusBadge status={result.result} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm">{value || 'Unavailable'}</p>
    </div>
  )
}

function versionLabel(value?: string | null) {
  return value || 'original'
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = status || 'unknown'
  const variant = normalized.includes('failed') ? 'destructive' : normalized.includes('sent') ? 'secondary' : 'outline'
  return <Badge variant={variant}>{normalized.replace(/_/g, ' ')}</Badge>
}

function targetFromReport(report: ReportOperationRow): ReportOperationTarget {
  return {
    parent_id: report.parent_id,
    student_id: report.student_id,
    week_start: report.week_start,
  }
}

function targetKey(target: ReportOperationTarget) {
  return `${target.parent_id}:${target.student_id}:${target.week_start}`
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default AdminReportOperationsPage
