import { type FormEvent, type RefObject, useMemo, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { AlertTriangle, CheckCircle2, FileText, GitCompare, History, Save, UploadCloud } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { formatDateTime } from '@/lib/formatDateTime'
import type { CurriculumAction, CurriculumReviewStep } from '@/pages/admin/CurriculumActionDialog'
import { CurriculumActionDialog } from '@/pages/admin/CurriculumActionDialog'
import { curriculumErrorCode, curriculumErrorMessage } from '@/pages/admin/curriculumErrorMessage'
import { isApiPathValue } from '@/services/api/apiPath'
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

// untranslated-ok: a starter manifest the admin edits as JSON; its lesson text is curriculum data, not interface copy.
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
  const { t } = useTranslation('admin')
  const [selected, setSelected] = useState<CurriculumVersion | null>(null)
  // #258: an empty patch, not an English "Updated title" a save would write.
  const [patchJson, setPatchJson] = useState('{}')
  const [patchJsonInvalid, setPatchJsonInvalid] = useState(false)
  const [fromVersionId, setFromVersionId] = useState('')
  const [toVersionId, setToVersionId] = useState('')
  const [validationEnabled, setValidationEnabled] = useState(false)
  const [auditEnabled, setAuditEnabled] = useState(false)
  const [diffEnabled, setDiffEnabled] = useState(false)
  const [manifestJson, setManifestJson] = useState(starterManifest)
  const [manifestJsonInvalid, setManifestJsonInvalid] = useState(false)
  // The manifest exactly as it was dry-run: apply sends this one, never the
  // editor's text, which may have changed since (#258).
  const [dryRunManifest, setDryRunManifest] = useState<Record<string, unknown> | null>(null)
  const [evidenceId, setEvidenceId] = useState('')
  // #450: the id the evidence is read for, trimmed, set by Load and by an
  // apply. The read used to follow the field, so after the first load every
  // keystroke sent a request with the raw, untrimmed id.
  const [evidenceReadId, setEvidenceReadId] = useState('')
  const [action, setAction] = useState<CurriculumAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  // #450: a publish refused as stale holds Confirm until the worklist is read again.
  const [liveVersionReading, setLiveVersionReading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  // #258: one write at a time. A double click sent two publishes; the ref
  // closes the gap before `isPending` reaches the next render.
  const inFlight = useRef(false)
  // #407: where focus goes when a confirmed step leaves its button disabled:
  // a publish while the worklist is read again, an apply for good.
  const reviewNotice = useRef<HTMLParagraphElement>(null)
  const applyHeading = useRef<HTMLHeadingElement>(null)

  const worklistQuery = useCurriculumWorklistQuery()
  const selectedPublicId = selected?.publicLessonId
  const selectedVersionId = selected?.versionId
  const previewQuery = useCurriculumPreviewQuery(selectedPublicId, selectedVersionId)
  const validationQuery = useCurriculumValidationQuery(selectedPublicId, selectedVersionId, validationEnabled)
  const auditQuery = useCurriculumAuditQuery(selectedPublicId, auditEnabled)
  const diffQuery = useCurriculumDiffQuery(selectedPublicId, fromVersionId, toVersionId, diffEnabled)
  // #418: a migration id of `..` or `.` would send the read a level up the
  // API, so it is not read; the panel says it is not valid.
  const evidenceIdInvalid = Boolean(evidenceReadId) && !isApiPathValue(evidenceReadId)
  const evidenceQuery = useCurriculumMigrationEvidenceQuery(evidenceReadId, !evidenceIdInvalid)

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
  const reviewBusy =
    action !== null ||
    submitReviewMutation.isPending ||
    approveMutation.isPending ||
    requestChangesMutation.isPending ||
    publishMutation.isPending
  const dryRun = dryRunManifest ? dryRunMutation.data : undefined

  function selectVersion(version: CurriculumVersion) {
    if (version.versionId !== selectedVersionId) {
      // #328: the editor belongs to one version. A patch typed (or loaded)
      // for lesson A and saved after opening lesson B wrote A's content,
      // exercises included, into B.
      setPatchJson('{}')
      setPatchJsonInvalid(false)
      setFromVersionId('')
      patchMutation.reset()
      submitReviewMutation.reset()
    }
    setSelected(version)
    setToVersionId(version.versionId)
    setValidationEnabled(false)
    setAuditEnabled(false)
    setDiffEnabled(false)
    setNotice(null)
  }

  function savePatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPublicId || !selectedVersionId) return
    const payload = parseJsonObject(patchJson)
    setPatchJsonInvalid(payload === null)
    if (!payload) return
    patchMutation.mutate({
      publicLessonId: selectedPublicId,
      versionId: selectedVersionId,
      payload,
    })
  }

  function changeManifest(value: string) {
    setManifestJson(value)
    setManifestJsonInvalid(false)
    // A dry run vouches for the manifest it read, not for this one.
    setDryRunManifest(null)
    dryRunMutation.reset()
    applyMutation.reset()
  }

  function runDryRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const manifest = parseJsonObject(manifestJson)
    setManifestJsonInvalid(manifest === null)
    if (!manifest) return
    setDryRunManifest(null)
    applyMutation.reset()
    dryRunMutation.mutate(manifest, {
      onSuccess: (data) => {
        setDryRunManifest(manifest)
        // Filled in, not read: the backend keeps evidence only for an
        // applied migration, and answers migration_not_found until then.
        setEvidenceId(data.migrationId)
      },
    })
  }

  function submitReview() {
    if (!selectedPublicId || !selectedVersionId || inFlight.current) return
    inFlight.current = true
    setNotice(null)
    submitReviewMutation.mutate(
      { publicLessonId: selectedPublicId, versionId: selectedVersionId },
      {
        onSettled: () => {
          inFlight.current = false
        },
        onSuccess: () => setNotice(t('curriculum.notice.submitted', { version: selectedVersionId })),
      },
    )
  }

  function openReviewStep(kind: CurriculumReviewStep) {
    if (!selectedPublicId || !selectedVersionId || reviewBusy) return
    setActionError(null)
    setNotice(null)
    setAction({
      kind,
      publicLessonId: selectedPublicId,
      versionId: selectedVersionId,
      liveVersionId: liveVersionOf(worklist, selectedPublicId),
    })
  }

  function openApply() {
    if (!dryRun || action) return
    setActionError(null)
    setAction({ kind: 'apply', migrationId: dryRun.migrationId, summary: dryRun.summary })
  }

  function confirmAction(chosen: CurriculumAction, reason: string) {
    if (inFlight.current) return
    inFlight.current = true
    setActionError(null)
    const settle = {
      onSettled: () => {
        inFlight.current = false
      },
      // The dialog sits over the page, so a refusal is said inside it and the
      // reason stays for a retry. Success closes it.
      onError: (error: unknown) => setActionError(curriculumErrorMessage(error, t)),
    }
    const done = (message?: string) => {
      setAction(null)
      if (message) setNotice(message)
    }
    if (chosen.kind === 'apply') {
      if (!dryRun || !dryRunManifest) {
        inFlight.current = false
        return
      }
      applyMutation.mutate(
        { migrationId: chosen.migrationId, manifest: dryRunManifest, confirmationToken: dryRun.confirmationToken },
        {
          ...settle,
          onSuccess: () => {
            done()
            // Its evidence exists from now on (#450).
            setEvidenceId(chosen.migrationId)
            setEvidenceReadId(chosen.migrationId)
          },
        },
      )
      return
    }
    const target = { publicLessonId: chosen.publicLessonId, versionId: chosen.versionId }
    if (chosen.kind === 'approve') {
      approveMutation.mutate(target, {
        ...settle,
        onSuccess: () => done(t('curriculum.notice.approved', { version: chosen.versionId })),
      })
    } else if (chosen.kind === 'requestChanges') {
      requestChangesMutation.mutate({ ...target, reason }, {
        ...settle,
        onSuccess: () => done(t('curriculum.notice.changesRequested', { version: chosen.versionId })),
      })
    } else {
      // The version believed live goes with the publish, so the backend
      // refuses it (409 stale_pointer) if someone else published since.
      publishMutation.mutate({ ...target, expectedPublishedVersionId: chosen.liveVersionId, reason }, {
        ...settle,
        onError: (error: unknown) => {
          settle.onError(error)
          if (curriculumErrorCode(error) === 'stale_pointer') showLiveVersionNow(chosen.publicLessonId, chosen.versionId)
        },
        onSuccess: () => done(t('curriculum.notice.published', { version: chosen.versionId })),
      })
    }
  }

  /**
   * After a stale_pointer refusal the open dialog held the live version the
   * backend had just refused, so Publish in it was refused again; only
   * cancelling and reopening read the new one (#450). The refusal re-reads the
   * worklist (#404). Confirm waits for that read, and the dialog then shows the
   * version live now, so the admin sees it before publishing over it: it is
   * never swapped in at confirm time.
   */
  function showLiveVersionNow(publicLessonId: string, versionId: string) {
    setLiveVersionReading(true)
    // `cancelRefetch: false` joins the read the refusal has already started.
    void worklistQuery.refetch({ cancelRefetch: false }).then((read) => {
      setLiveVersionReading(false)
      // A failed read leaves the version as it was; a retry is refused, and read, again.
      if (!read.isSuccess) return
      const liveVersionId = liveVersionOf(read.data.items, publicLessonId)
      setAction((current) =>
        current?.kind === 'publish' && current.versionId === versionId ? { ...current, liveVersionId } : current,
      )
    })
  }

  function cancelAction() {
    if (inFlight.current) return
    setAction(null)
    setActionError(null)
    setLiveVersionReading(false)
  }

  function loadEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = evidenceId.trim()
    // The same id again is read again, as the review panel's buttons do; an
    // invalid one never is.
    if (id === evidenceReadId && isApiPathValue(id)) void evidenceQuery.refetch()
    setEvidenceReadId(id)
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow={t('curriculum.eyebrow')}
          title={t('curriculum.title')}
          description={t('curriculum.description')}
          actions={<Button variant="outline" onClick={() => worklistQuery.refetch()}>{t('curriculum.refresh')}</Button>}
        />

        <CapabilityStrip />
        <ApiErrorPanel error={worklistQuery.error} />
        {worklistQuery.data?.permissionDenied && (
          <RestrictedPanel message={t('curriculum.denied')} />
        )}

        <Tabs defaultValue="worklist" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="worklist">{t('curriculum.tabs.worklist')}</TabsTrigger>
            <TabsTrigger value="editor">{t('curriculum.tabs.editor')}</TabsTrigger>
            <TabsTrigger value="review">{t('curriculum.tabs.review')}</TabsTrigger>
            <TabsTrigger value="migration">{t('curriculum.tabs.migration')}</TabsTrigger>
            <TabsTrigger value="evidence">{t('curriculum.tabs.evidence')}</TabsTrigger>
          </TabsList>

          <TabsContent value="worklist">
            <WorklistPanel
              isLoading={worklistQuery.isLoading}
              failed={worklistQuery.isError || Boolean(worklistQuery.data?.permissionDenied)}
              items={worklist}
              selectedVersionId={selectedVersionId}
              onSelect={selectVersion}
            />
          </TabsContent>

          <TabsContent value="editor">
            <EditorPanel
              version={selectedVersion}
              patchJson={patchJson}
              onPatchJsonChange={(value) => {
                setPatchJson(value)
                setPatchJsonInvalid(false)
              }}
              jsonInvalid={patchJsonInvalid}
              onSubmit={savePatch}
              isSaving={patchMutation.isPending}
              // #328: until the preview is read, the version's content is
              // unknown, not empty; loading or saving it would erase it.
              previewLoading={previewQuery.isPending}
              previewError={previewQuery.isError ? previewQuery.error : null}
              previewReady={previewQuery.isSuccess}
              onRetryPreview={() => void previewQuery.refetch()}
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
              onSubmitReview={submitReview}
              onApprove={() => openReviewStep('approve')}
              onRequestChanges={() => openReviewStep('requestChanges')}
              onPublish={() => openReviewStep('publish')}
              busy={reviewBusy}
              // Publish waits for a refreshed worklist: the live version is read from it.
              publishBusy={reviewBusy || worklistQuery.isFetching}
              notice={notice}
              noticeRef={reviewNotice}
              actionError={submitReviewMutation.error}
            />
          </TabsContent>

          <TabsContent value="migration">
            <MigrationPanel
              manifestJson={manifestJson}
              onManifestJsonChange={changeManifest}
              jsonInvalid={manifestJsonInvalid}
              onDryRun={runDryRun}
              dryRun={dryRun}
              dryRunError={dryRunMutation.error}
              dryRunLoading={dryRunMutation.isPending}
              onApply={openApply}
              applyResult={applyMutation.data}
              applyBusy={applyMutation.isPending || applyMutation.isSuccess || action !== null}
              headingRef={applyHeading}
            />
          </TabsContent>

          <TabsContent value="evidence">
            <EvidencePanel
              evidenceId={evidenceId}
              onEvidenceIdChange={setEvidenceId}
              onSubmit={loadEvidence}
              evidence={evidenceQuery.data}
              error={evidenceQuery.error}
              invalidId={evidenceIdInvalid}
              isLoading={evidenceQuery.isFetching}
            />
          </TabsContent>
        </Tabs>
        <CurriculumActionDialog
          action={action}
          pending={
            approveMutation.isPending ||
            requestChangesMutation.isPending ||
            publishMutation.isPending ||
            applyMutation.isPending
          }
          error={actionError}
          liveVersionReading={liveVersionReading}
          returnFocusFallback={action?.kind === 'apply' ? applyHeading : reviewNotice}
          onCancel={cancelAction}
          onConfirm={confirmAction}
        />
      </PageContainer>
    </DashboardLayout>
  )
}

function CapabilityStrip() {
  const { t } = useTranslation('admin')
  const capabilities = ['curriculum_author', 'curriculum_reviewer', 'curriculum_publisher', 'migration_operator']
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border/70 bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="brand-section-kicker">{t('curriculum.capabilities.kicker')}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('curriculum.capabilities.description')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {capabilities.map((capability) => (
          <Badge key={capability} variant="outline">{t(`curriculum.capabilities.names.${capability}`)}</Badge>
        ))}
      </div>
    </section>
  )
}

function WorklistPanel({
  isLoading,
  failed,
  items,
  selectedVersionId,
  onSelect,
}: {
  isLoading: boolean
  /** The page already says why there is no list; an empty one would contradict it. */
  failed: boolean
  items: CurriculumVersion[]
  selectedVersionId?: string
  onSelect: (version: CurriculumVersion) => void
}) {
  const { t } = useTranslation('admin')
  if (isLoading) return <Card><CardContent className="p-5 text-sm text-muted-foreground">{t('curriculum.worklist.loading')}</CardContent></Card>
  if (failed) return null
  if (items.length === 0) {
    return <Card><CardContent className="p-5 text-sm text-muted-foreground">{t('curriculum.worklist.empty')}</CardContent></Card>
  }
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.versionId} className={selectedVersionId === item.versionId ? 'border-primary/50' : undefined}>
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{item.publicLessonId}</h2>
                <Badge variant="outline">{translatedValue('curriculum.state', item.state, t)}</Badge>
                {item.reviewState && <Badge variant="secondary">{translatedValue('curriculum.reviewState', item.reviewState, t)}</Badge>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.versionId} · {t('curriculum.worklist.updated', {
                  at: item.updatedAt ? formatDateTime(item.updatedAt) : t('curriculum.worklist.unknown'),
                  by: item.updatedBy ?? t('curriculum.worklist.unknown'),
                })}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => onSelect(item)}>{t('curriculum.worklist.open')}</Button>
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
  jsonInvalid,
  onSubmit,
  isSaving,
  previewLoading,
  previewError,
  previewReady,
  onRetryPreview,
  error,
  result,
}: {
  version?: CurriculumVersion | null
  patchJson: string
  onPatchJsonChange: (value: string) => void
  jsonInvalid: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSaving: boolean
  previewLoading: boolean
  previewError: unknown
  previewReady: boolean
  onRetryPreview: () => void
  error: unknown
  result?: CurriculumVersion
}) {
  const { t } = useTranslation('admin')
  if (!version) return <SelectItemPanel />
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('curriculum.editor.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label={t('curriculum.editor.publicLesson')} value={version.publicLessonId} />
              <ReadOnlyField label={t('curriculum.editor.version')} value={version.versionId} />
            </div>
            <Textarea
              value={patchJson}
              onChange={(event) => onPatchJsonChange(event.target.value)}
              aria-label={t('curriculum.editor.title')}
              aria-invalid={jsonInvalid || undefined}
              className="min-h-72 font-mono text-xs"
            />
            <InvalidJson show={jsonInvalid} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving || !previewReady}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {t('curriculum.editor.save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!previewReady}
                onClick={() => onPatchJsonChange(JSON.stringify({ lesson: version.lesson ?? {}, exercises: version.exercises ?? [] }, null, 2))}
              >
                {t('curriculum.editor.loadCurrent')}
              </Button>
            </div>
          </form>
          <ApiErrorPanel error={error} />
          {result && <SuccessPanel message={t('curriculum.editor.saved', { version: result.versionId })} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">{t('curriculum.editor.current')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {previewReady ? (
            <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {JSON.stringify({ lesson: version.lesson ?? {}, exercises: version.exercises ?? [] }, null, 2)}
            </pre>
          ) : previewError ? (
            <>
              <ApiErrorPanel error={previewError} />
              <p className="text-sm text-muted-foreground">{t('curriculum.editor.currentFailed')}</p>
              <Button type="button" variant="outline" onClick={onRetryPreview}>{t('curriculum.editor.currentRetry')}</Button>
            </>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              {previewLoading ? t('curriculum.editor.currentLoading') : null}
            </p>
          )}
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
  busy: boolean
  publishBusy: boolean
  notice: string | null
  noticeRef: RefObject<HTMLParagraphElement | null>
  actionError: unknown
}) {
  const { t } = useTranslation('admin')
  if (!props.version) return <SelectItemPanel />
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" /> {t('curriculum.review.validation')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" onClick={props.onValidate} disabled={props.validationLoading}>{t('curriculum.review.runValidation')}</Button>
          <ApiErrorPanel error={props.validationError} />
          {props.validation && (
            <div className="space-y-2">
              <Badge variant={props.validation.publishReady ? 'secondary' : 'outline'}>{translatedValue('curriculum.review.status', props.validation.status, t)}</Badge>
              {props.validation.issues.map((issue) => (
                <div key={`${issue.field}-${issue.message}`} className="rounded-md border border-border/70 p-3 text-sm">
                  <p className="font-medium text-foreground">
                    {t('curriculum.review.issue', {
                      severity: translatedValue('curriculum.review.severity', issue.severity, t),
                      field: issue.field,
                    })}
                  </p>
                  {/* The backend writes this detail in English and sends no code for it yet. */}
                  <p className="mt-1 text-muted-foreground">
                    {t('curriculum.review.serverDetail')} <span lang="en">{issue.message}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitCompare className="h-4 w-4" /> {t('curriculum.review.diff')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {/* Visible labels, not placeholders: a placeholder is gone once the
              field has text, and with it the field's only name (#410). */}
          <label className="block space-y-2 text-sm font-medium text-foreground">
            {t('curriculum.review.fromVersion')}
            <Input value={props.fromVersionId} onChange={(event) => props.onFromVersionIdChange(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm font-medium text-foreground">
            {t('curriculum.review.toVersion')}
            <Input value={props.toVersionId} onChange={(event) => props.onToVersionIdChange(event.target.value)} />
          </label>
          <Button type="button" variant="outline" onClick={props.onDiff} disabled={props.diffLoading}>{t('curriculum.review.compare')}</Button>
          <ApiErrorPanel error={props.diffError} />
          <CompactJson value={props.diff?.changes ?? []} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> {t('curriculum.review.title')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={props.onSubmitReview} disabled={props.busy}>{t('curriculum.review.submit')}</Button>
            <Button type="button" variant="outline" onClick={props.onApprove} disabled={props.busy}>{t('curriculum.review.approve')}</Button>
            <Button type="button" variant="outline" onClick={props.onRequestChanges} disabled={props.busy}>{t('curriculum.review.requestChanges')}</Button>
            <Button type="button" onClick={props.onPublish} disabled={props.publishBusy}>{t('curriculum.review.publish')}</Button>
          </div>
          {/* In the accessibility tree while empty: a live region that appears
              with its text is not announced, and `empty:hidden` took this one
              out until then (#450). */}
          <p ref={props.noticeRef} tabIndex={-1} role="status" className={props.notice ? 'text-sm text-foreground' : 'sr-only'}>
            {props.notice}
          </p>
          <Button type="button" variant="outline" onClick={props.onLoadAudit} disabled={props.auditLoading}>{t('curriculum.review.loadAudit')}</Button>
          <ApiErrorPanel error={props.actionError ?? props.auditError} />
          {props.audit?.permissionDenied && <RestrictedPanel message={t('curriculum.review.missingCapability')} />}
          <CompactJson value={props.audit?.items ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}

function MigrationPanel(props: {
  manifestJson: string
  onManifestJsonChange: (value: string) => void
  jsonInvalid: boolean
  onDryRun: (event: FormEvent<HTMLFormElement>) => void
  dryRun?: CurriculumMigrationDryRunResponse
  dryRunError: unknown
  dryRunLoading: boolean
  onApply: () => void
  applyResult?: CurriculumMigrationEvidenceResponse
  applyBusy: boolean
  headingRef: RefObject<HTMLHeadingElement | null>
}) {
  const { t } = useTranslation('admin')
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UploadCloud className="h-4 w-4" /> {t('curriculum.migration.manifest')}</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={props.onDryRun}>
            {/* Held while the dry run reads it, so the result belongs to this text. */}
            <Textarea
              value={props.manifestJson}
              onChange={(event) => props.onManifestJsonChange(event.target.value)}
              readOnly={props.dryRunLoading}
              aria-label={t('curriculum.migration.manifest')}
              aria-invalid={props.jsonInvalid || undefined}
              className="min-h-[32rem] font-mono text-xs"
            />
            <InvalidJson show={props.jsonInvalid} />
            <Button type="submit" disabled={props.dryRunLoading}>{t('curriculum.migration.dryRun')}</Button>
          </form>
          <ApiErrorPanel error={props.dryRunError} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle ref={props.headingRef} tabIndex={-1} className="text-base">
            {t('curriculum.migration.dryRunAndApply')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.dryRun ? (
            <>
              <SummaryGrid summary={props.dryRun.summary} t={t} />
              <Badge variant={props.dryRun.publishReady ? 'secondary' : 'outline'}>
                {props.dryRun.publishReady ? t('curriculum.migration.ready') : t('curriculum.migration.blocked')}
              </Badge>
              <CompactJson value={props.dryRun.rows} />
              <Button type="button" onClick={props.onApply} disabled={props.applyBusy || !props.dryRun.publishReady}>{t('curriculum.migration.apply')}</Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('curriculum.migration.hint')}</p>
          )}
          {props.applyResult && <SuccessPanel message={t('curriculum.migration.applied', { migration: props.applyResult.migrationId })} />}
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
  invalidId: boolean
  isLoading: boolean
}) {
  const { t } = useTranslation('admin')
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> {t('curriculum.evidence.title')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={props.onSubmit}>
          {/* A visible label, not a placeholder (#410). */}
          <label className="block flex-1 space-y-2 text-sm font-medium text-foreground">
            {t('curriculum.evidence.idLabel')}
            <Input value={props.evidenceId} onChange={(event) => props.onEvidenceIdChange(event.target.value)} />
          </label>
          <Button type="submit" disabled={props.isLoading}>{t('curriculum.evidence.load')}</Button>
        </form>
        {props.invalidId && <p role="alert" className="text-sm text-destructive">{t('curriculum.evidence.invalidId')}</p>}
        <ApiErrorPanel error={props.error} />
        {props.evidence?.permissionDenied && <RestrictedPanel message={t('curriculum.evidence.missingCapability')} />}
        {props.evidence && <CompactJson value={props.evidence} />}
      </CardContent>
    </Card>
  )
}

function SummaryGrid({ summary, t }: { summary: Record<string, number>; t: TFunction }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(summary).map(([key, value]) => (
        <div key={key} className="rounded-md border border-border/70 p-3">
          <p className="text-xs text-muted-foreground">{translatedValue('curriculum.migration.summary', key, t)}</p>
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
  const { t } = useTranslation('admin')
  return <Card><CardContent className="p-5 text-sm text-muted-foreground">{t('curriculum.selectItem')}</CardContent></Card>
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
  const { t } = useTranslation('admin')
  if (!error) return null
  const message = curriculumErrorMessage(error, t)
  return <div role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{message}</div>
}

function InvalidJson({ show }: { show: boolean }) {
  const { t } = useTranslation('admin')
  if (!show) return null
  return <p role="alert" className="text-sm text-destructive">{t('curriculum.invalidJson')}</p>
}

/**
 * The JSON object in an editor, or `null` when it is not one. It used to throw
 * from the click handler, outside the mutation, so the button did nothing and
 * the error reached only the console (#258).
 */
function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/**
 * The version the console believes is live: the newest published one in the
 * worklist, `null` when there is none. The backend checks it against its own
 * pointer and refuses the publish with `stale_pointer` if it is wrong, so a
 * wrong guess is a refusal, never an overwrite (#258).
 */
function liveVersionOf(items: CurriculumVersion[], publicLessonId: string): string | null {
  const published = items
    .filter((item) => item.publicLessonId === publicLessonId && item.state === 'published')
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
  return published[0]?.versionId ?? null
}

/** A backend value in the reader's language; one the console has no words for yet is shown as sent. */
function translatedValue(group: string, value: string | null | undefined, t: TFunction) {
  if (!value) return t('curriculum.worklist.unknown')
  return t(`${group}.${value}`, { defaultValue: value.replace(/_/g, ' ') })
}

export default AdminCurriculumPage
