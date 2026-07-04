import { type FormEvent, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileText, GitCompare, History, Save, UploadCloud } from 'lucide-react'
import { ApiError } from '@/services/api/httpClient'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import {
  useApplyCurriculumMigrationMutation,
  useApproveCurriculumVersionMutation,
  useCurriculumAuditQuery,
  useCurriculumDiffQuery,
  useCurriculumMigrationEvidenceQuery,
  useCurriculumPreviewQuery,
  useCurriculumValidationQuery,
  useCurriculumWorklistQuery,
  useDryRunCurriculumMigrationMutation,
  usePatchCurriculumDraftMutation,
  usePublishCurriculumVersionMutation,
  useRequestCurriculumChangesMutation,
  useSubmitCurriculumReviewMutation,
} from '@/hooks/admin/useCurriculumOperationsQuery'
import type {
  CurriculumAuditResponse,
  CurriculumDiffResponse,
  CurriculumMigrationDryRunResponse,
  CurriculumMigrationEvidenceResponse,
  CurriculumValidationPreview,
  CurriculumVersion,
} from '@/types/curriculumOperations'

const starterManifest = JSON.stringify(
  {
    source: {
      sourceId: 'approved-curriculum-pack',
      sourceVersion: '2026-07',
      sourceType: 'manifest',
    },
    operatorNote: 'approved import',
    lessons: [
      {
        publicLessonId: 'lesson-linear-ops',
        title: 'Linear equations operations',
        objective: 'Solve one-step equations safely.',
        description: 'Use inverse operations.',
        subjectId: 'math',
        topicId: 'linear-equations',
        gradeLevel: 'lower_secondary',
        publish: true,
        expectedPublishedVersionId: null,
        rollbackHint: 'restore previous published pointer',
        exercises: [
          {
            exerciseId: 'exercise-linear-ops-1',
            prompt: 'Solve x + 4 = 9.',
            answerKey: 'x = 5',
            explanation: 'Subtract 4 from both sides.',
            difficulty: 'standard',
            order: 1,
          },
        ],
      },
    ],
  },
  null,
  2,
)

export function AdminCurriculumPage() {
  const [selected, setSelected] = useState<CurriculumVersion | null>(null)
  const [patchJson, setPatchJson] = useState('{\n  "title": "Updated title"\n}')
  const [fromVersionId, setFromVersionId] = useState('')
  const [toVersionId, setToVersionId] = useState('')
  const [validationEnabled, setValidationEnabled] = useState(false)
  const [auditEnabled, setAuditEnabled] = useState(false)
  const [diffEnabled, setDiffEnabled] = useState(false)
  const [manifestJson, setManifestJson] = useState(starterManifest)
  const [confirmationToken, setConfirmationToken] = useState('')
  const [evidenceId, setEvidenceId] = useState('')
  const [evidenceEnabled, setEvidenceEnabled] = useState(false)

  const worklistQuery = useCurriculumWorklistQuery()
  const selectedPublicId = selected?.publicLessonId
  const selectedVersionId = selected?.versionId
  const previewQuery = useCurriculumPreviewQuery(selectedPublicId, selectedVersionId)
  const validationQuery = useCurriculumValidationQuery(selectedPublicId, selectedVersionId, validationEnabled)
  const auditQuery = useCurriculumAuditQuery(selectedPublicId, auditEnabled)
  const diffQuery = useCurriculumDiffQuery(selectedPublicId, fromVersionId, toVersionId, diffEnabled)
  const evidenceQuery = useCurriculumMigrationEvidenceQuery(evidenceId, evidenceEnabled)

  const patchMutation = usePatchCurriculumDraftMutation()
  const submitReviewMutation = useSubmitCurriculumReviewMutation()
  const approveMutation = useApproveCurriculumVersionMutation()
  const requestChangesMutation = useRequestCurriculumChangesMutation()
  const publishMutation = usePublishCurriculumVersionMutation()
  const dryRunMutation = useDryRunCurriculumMigrationMutation()
  const applyMutation = useApplyCurriculumMigrationMutation()

  const selectedPreview = previewQuery.data
  const worklist = worklistQuery.data?.items ?? []
  const selectedVersion = selectedPreview ?? selected

  function selectVersion(version: CurriculumVersion) {
    setSelected(version)
    setToVersionId(version.versionId)
    setValidationEnabled(false)
    setAuditEnabled(false)
    setDiffEnabled(false)
  }

  function savePatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPublicId || !selectedVersionId) return
    patchMutation.mutate({
      publicLessonId: selectedPublicId,
      versionId: selectedVersionId,
      payload: parseJson(patchJson),
    })
  }

  function runDryRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    dryRunMutation.mutate(parseJson(manifestJson), {
      onSuccess: (data) => {
        setConfirmationToken(data.confirmationToken)
        setEvidenceId(data.migrationId)
      },
    })
  }

  function applyMigration() {
    if (!dryRunMutation.data) return
    applyMutation.mutate({
      migrationId: dryRunMutation.data.migrationId,
      manifest: parseJson(manifestJson),
      confirmationToken,
    })
  }

  function loadEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEvidenceEnabled(Boolean(evidenceId.trim()))
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow="Curriculum operations"
          title="Curriculum editor"
          description="Patch drafts, validate content, review lifecycle evidence, and apply migration manifests against backend-authorized curriculum APIs."
          actions={<Button variant="outline" onClick={() => worklistQuery.refetch()}>Refresh worklist</Button>}
        />

        <CapabilityStrip />
        <ApiErrorPanel error={worklistQuery.error} />
        {worklistQuery.data?.permissionDenied && (
          <RestrictedPanel message="The backend did not grant access to curriculum operations." />
        )}

        <Tabs defaultValue="worklist" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="worklist">Worklist</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="migration">Migration</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>

          <TabsContent value="worklist">
            <WorklistPanel
              isLoading={worklistQuery.isLoading}
              items={worklist}
              selectedVersionId={selectedVersionId}
              onSelect={selectVersion}
            />
          </TabsContent>

          <TabsContent value="editor">
            <EditorPanel
              version={selectedVersion}
              patchJson={patchJson}
              onPatchJsonChange={setPatchJson}
              onSubmit={savePatch}
              isSaving={patchMutation.isPending}
              error={patchMutation.error}
              result={patchMutation.data}
            />
          </TabsContent>

          <TabsContent value="review">
            <ReviewPanel
              version={selectedVersion}
              validation={validationQuery.data}
              validationError={validationQuery.error}
              validationLoading={validationQuery.isFetching}
              onValidate={() => {
                setValidationEnabled(true)
                void validationQuery.refetch()
              }}
              audit={auditQuery.data}
              auditError={auditQuery.error}
              auditLoading={auditQuery.isFetching}
              onLoadAudit={() => {
                setAuditEnabled(true)
                void auditQuery.refetch()
              }}
              fromVersionId={fromVersionId}
              toVersionId={toVersionId}
              onFromVersionIdChange={setFromVersionId}
              onToVersionIdChange={setToVersionId}
              diff={diffQuery.data}
              diffError={diffQuery.error}
              diffLoading={diffQuery.isFetching}
              onDiff={() => {
                setDiffEnabled(true)
                void diffQuery.refetch()
              }}
              onSubmitReview={() => selectedPublicId && selectedVersionId && submitReviewMutation.mutate({ publicLessonId: selectedPublicId, versionId: selectedVersionId })}
              onApprove={() => selectedPublicId && selectedVersionId && approveMutation.mutate({ publicLessonId: selectedPublicId, versionId: selectedVersionId })}
              onRequestChanges={() => selectedPublicId && selectedVersionId && requestChangesMutation.mutate({ publicLessonId: selectedPublicId, versionId: selectedVersionId, reason: 'Requested from curriculum console' })}
              onPublish={() => selectedPublicId && selectedVersionId && publishMutation.mutate({ publicLessonId: selectedPublicId, versionId: selectedVersionId, expectedPublishedVersionId: null, reason: 'Published from curriculum console' })}
              actionError={submitReviewMutation.error ?? approveMutation.error ?? requestChangesMutation.error ?? publishMutation.error}
            />
          </TabsContent>

          <TabsContent value="migration">
            <MigrationPanel
              manifestJson={manifestJson}
              onManifestJsonChange={setManifestJson}
              onDryRun={runDryRun}
              dryRun={dryRunMutation.data}
              dryRunError={dryRunMutation.error}
              dryRunLoading={dryRunMutation.isPending}
              confirmationToken={confirmationToken}
              onConfirmationTokenChange={setConfirmationToken}
              onApply={applyMigration}
              applyResult={applyMutation.data}
              applyError={applyMutation.error}
              applyLoading={applyMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="evidence">
            <EvidencePanel
              evidenceId={evidenceId}
              onEvidenceIdChange={setEvidenceId}
              onSubmit={loadEvidence}
              evidence={evidenceQuery.data}
              error={evidenceQuery.error}
              isLoading={evidenceQuery.isFetching}
            />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </DashboardLayout>
  )
}

function CapabilityStrip() {
  const capabilities = ['curriculum_author', 'curriculum_reviewer', 'curriculum_publisher', 'migration_operator']
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border/70 bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="brand-section-kicker">Backend authorization</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The console shows controls, but backend capability checks decide every mutation.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {capabilities.map((capability) => (
          <Badge key={capability} variant="outline">{capability}</Badge>
        ))}
      </div>
    </section>
  )
}

function WorklistPanel({
  isLoading,
  items,
  selectedVersionId,
  onSelect,
}: {
  isLoading: boolean
  items: CurriculumVersion[]
  selectedVersionId?: string
  onSelect: (version: CurriculumVersion) => void
}) {
  if (isLoading) return <Card><CardContent className="p-5 text-sm text-muted-foreground">Loading curriculum worklist.</CardContent></Card>
  if (items.length === 0) {
    return <Card><CardContent className="p-5 text-sm text-muted-foreground">No curriculum items are available.</CardContent></Card>
  }
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.versionId} className={selectedVersionId === item.versionId ? 'border-primary/50' : undefined}>
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{item.publicLessonId}</h2>
                <Badge variant="outline">{formatStatus(item.state)}</Badge>
                {item.reviewState && <Badge variant="secondary">{formatStatus(item.reviewState)}</Badge>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.versionId} · Updated {item.updatedAt ?? 'unknown'} by {item.updatedBy ?? 'unknown'}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => onSelect(item)}>Open</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EditorPanel({
  version,
  patchJson,
  onPatchJsonChange,
  onSubmit,
  isSaving,
  error,
  result,
}: {
  version?: CurriculumVersion | null
  patchJson: string
  onPatchJsonChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSaving: boolean
  error: unknown
  result?: CurriculumVersion
}) {
  if (!version) return <SelectItemPanel />
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Draft patch</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="Public lesson" value={version.publicLessonId} />
              <ReadOnlyField label="Version" value={version.versionId} />
            </div>
            <Textarea value={patchJson} onChange={(event) => onPatchJsonChange(event.target.value)} className="min-h-72 font-mono text-xs" />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Save draft
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onPatchJsonChange(JSON.stringify({ lesson: version.lesson ?? {}, exercises: version.exercises ?? [] }, null, 2))}
              >
                Load current content
              </Button>
            </div>
          </form>
          <ApiErrorPanel error={error} />
          {result && <SuccessPanel message={`Saved ${result.versionId}.`} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Current content</CardTitle></CardHeader>
        <CardContent>
          <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {JSON.stringify({ lesson: version.lesson ?? {}, exercises: version.exercises ?? [] }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewPanel(props: {
  version?: CurriculumVersion | null
  validation?: CurriculumValidationPreview
  validationError: unknown
  validationLoading: boolean
  onValidate: () => void
  audit?: CurriculumAuditResponse
  auditError: unknown
  auditLoading: boolean
  onLoadAudit: () => void
  fromVersionId: string
  toVersionId: string
  onFromVersionIdChange: (value: string) => void
  onToVersionIdChange: (value: string) => void
  diff?: CurriculumDiffResponse
  diffError: unknown
  diffLoading: boolean
  onDiff: () => void
  onSubmitReview: () => void
  onApprove: () => void
  onRequestChanges: () => void
  onPublish: () => void
  actionError: unknown
}) {
  if (!props.version) return <SelectItemPanel />
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" /> Validation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" onClick={props.onValidate} disabled={props.validationLoading}>Run validation</Button>
          <ApiErrorPanel error={props.validationError} />
          {props.validation && (
            <div className="space-y-2">
              <Badge variant={props.validation.publishReady ? 'secondary' : 'outline'}>{props.validation.status}</Badge>
              {props.validation.issues.map((issue) => (
                <div key={`${issue.field}-${issue.message}`} className="rounded-md border border-border/70 p-3 text-sm">
                  <p className="font-medium text-foreground">{issue.field}</p>
                  <p className="mt-1 text-muted-foreground">{issue.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitCompare className="h-4 w-4" /> Diff</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="from version" value={props.fromVersionId} onChange={(event) => props.onFromVersionIdChange(event.target.value)} />
          <Input placeholder="to version" value={props.toVersionId} onChange={(event) => props.onToVersionIdChange(event.target.value)} />
          <Button type="button" variant="outline" onClick={props.onDiff} disabled={props.diffLoading}>Compare</Button>
          <ApiErrorPanel error={props.diffError} />
          <CompactJson value={props.diff?.changes ?? []} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Review and audit</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={props.onSubmitReview}>Submit</Button>
            <Button type="button" variant="outline" onClick={props.onApprove}>Approve</Button>
            <Button type="button" variant="outline" onClick={props.onRequestChanges}>Request changes</Button>
            <Button type="button" onClick={props.onPublish}>Publish</Button>
          </div>
          <Button type="button" variant="outline" onClick={props.onLoadAudit} disabled={props.auditLoading}>Load audit</Button>
          <ApiErrorPanel error={props.actionError ?? props.auditError} />
          {props.audit?.permissionDenied && <RestrictedPanel message="Missing reviewer or publisher capability." />}
          <CompactJson value={props.audit?.items ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}

function MigrationPanel(props: {
  manifestJson: string
  onManifestJsonChange: (value: string) => void
  onDryRun: (event: FormEvent<HTMLFormElement>) => void
  dryRun?: CurriculumMigrationDryRunResponse
  dryRunError: unknown
  dryRunLoading: boolean
  confirmationToken: string
  onConfirmationTokenChange: (value: string) => void
  onApply: () => void
  applyResult?: CurriculumMigrationEvidenceResponse
  applyError: unknown
  applyLoading: boolean
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UploadCloud className="h-4 w-4" /> Manifest</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={props.onDryRun}>
            <Textarea value={props.manifestJson} onChange={(event) => props.onManifestJsonChange(event.target.value)} className="min-h-[32rem] font-mono text-xs" />
            <Button type="submit" disabled={props.dryRunLoading}>Dry-run</Button>
          </form>
          <ApiErrorPanel error={props.dryRunError} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Dry-run and apply</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {props.dryRun ? (
            <>
              <SummaryGrid summary={props.dryRun.summary} />
              <Badge variant={props.dryRun.publishReady ? 'secondary' : 'outline'}>
                {props.dryRun.publishReady ? 'Ready' : 'Blocked'}
              </Badge>
              <CompactJson value={props.dryRun.rows} />
              <Input value={props.confirmationToken} onChange={(event) => props.onConfirmationTokenChange(event.target.value)} placeholder="confirmation token" />
              <Button type="button" onClick={props.onApply} disabled={props.applyLoading || !props.dryRun.publishReady}>Apply migration</Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Run dry-run to inspect row actions and confirmation token.</p>
          )}
          <ApiErrorPanel error={props.applyError} />
          {props.applyResult && <SuccessPanel message={`Applied ${props.applyResult.migrationId}.`} />}
        </CardContent>
      </Card>
    </div>
  )
}

function EvidencePanel(props: {
  evidenceId: string
  onEvidenceIdChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  evidence?: CurriculumMigrationEvidenceResponse
  error: unknown
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> Migration evidence</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={props.onSubmit}>
          <Input value={props.evidenceId} onChange={(event) => props.onEvidenceIdChange(event.target.value)} placeholder="migration id" />
          <Button type="submit" disabled={props.isLoading}>Load evidence</Button>
        </form>
        <ApiErrorPanel error={props.error} />
        {props.evidence?.permissionDenied && <RestrictedPanel message="Missing migration operator or publisher capability." />}
        {props.evidence && <CompactJson value={props.evidence} />}
      </CardContent>
    </Card>
  )
}

function SummaryGrid({ summary }: { summary: Record<string, number> }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(summary).map(([key, value]) => (
        <div key={key} className="rounded-md border border-border/70 p-3">
          <p className="text-xs text-muted-foreground">{formatStatus(key)}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  return (
    <label className="space-y-2 text-sm font-medium text-foreground">
      {label}
      <Input value={value ?? ''} readOnly />
    </label>
  )
}

function CompactJson({ value }: { value: unknown }) {
  const rendered = useMemo(() => JSON.stringify(value, null, 2), [value])
  return <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">{rendered}</pre>
}

function SelectItemPanel() {
  return <Card><CardContent className="p-5 text-sm text-muted-foreground">Select a curriculum item from the worklist.</CardContent></Card>
}

function SuccessPanel({ message }: { message: string }) {
  return <div className="mt-4 rounded-md border border-border/70 bg-secondary/40 p-3 text-sm text-foreground">{message}</div>
}

function RestrictedPanel({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertTriangle className="mr-2 inline h-4 w-4" aria-hidden="true" />
      {message}
    </div>
  )
}

function ApiErrorPanel({ error }: { error: unknown }) {
  if (!error) return null
  const message = error instanceof ApiError ? error.message : 'Curriculum API request failed.'
  return <div role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{message}</div>
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    throw new ApiError('JSON is invalid')
  }
}

function formatStatus(value?: string | null) {
  return String(value ?? 'unknown').replace(/_/g, ' ')
}

export default AdminCurriculumPage
