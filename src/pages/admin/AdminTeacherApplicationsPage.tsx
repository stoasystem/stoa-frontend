import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  useReissueTeacherInvitationMutation,
  useReviewTeacherApplicationMutation,
  useTeacherApplicationDetailQuery,
  useTeacherApplicationsQuery,
} from '@/hooks/teacher/useTeacherApplication'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { teacherSubjectLabel } from '@/lib/subjects'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'
import type { TeacherApplicationListItem, TeacherReviewState } from '@/services/teacher/teacherApplicationApi'

const states: TeacherReviewState[] = ['pending_review', 'approved', 'rejected']

type Decision = 'approved' | 'rejected'

export function AdminTeacherApplicationsPage() {
  const { t } = useTranslation('admin')
  // Subject names live with the teacher copy; stored spellings read as the subject they name.
  const { t: tTeacher } = useTranslation('teacher')
  const subjectList = (subjects: readonly string[]) =>
    subjects.map((subject) => teacherSubjectLabel(subject, tTeacher)).join(', ')
  const [reviewState, setReviewState] = useState<TeacherReviewState>('pending_review')
  const [selected, setSelected] = useState<TeacherApplicationListItem | null>(null)
  // The reason belongs to one application (#334). It used to start as an English
  // sentence and outlive every decision, so the next applicant was approved or
  // rejected under the last one's reason; it now starts empty and is emptied
  // whenever the application in view changes.
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  // A decision is confirmed in a dialog that names the applicant (#334): both
  // buttons used to act on the first click, and neither can be undone here.
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null)
  const [decisionError, setDecisionError] = useState<string | null>(null)
  // #407: a decision takes the application, and the buttons with it, out of
  // view, so focus goes to the line that says what happened.
  const messageLine = useRef<HTMLParagraphElement>(null)
  const listQuery = useTeacherApplicationsQuery(reviewState)
  const detailQuery = useTeacherApplicationDetailQuery(selected?.applicationId ?? null, selected?.version ?? null)
  const reviewMutation = useReviewTeacherApplicationMutation()
  const reissueMutation = useReissueTeacherInvitationMutation()
  const rows = listQuery.data?.items ?? []
  const detail = detailQuery.data
  // Only a pending application can be decided; the other tabs are a record.
  const decidable = reviewState === 'pending_review'
  const applicantName = selected ? detail?.fullName || selected.fullName || selected.applicationId : ''
  // A statement on hand stays when it cannot be read again; the line under it
  // says so (#457).
  const statementFailed = detailQuery.isError && !detail
  let statement: string
  if (statementFailed) statement = toUserFacingError(detailQuery.error, t('teacherApplications.statementFailed'))
  else if (detailQuery.isPending) statement = t('teacherApplications.loadingStatement')
  else statement = detail?.statement?.trim() || t('teacherApplications.noStatement')

  function select(row: TeacherApplicationListItem | null) {
    setSelected(row)
    setReason('')
    setMessage(null)
  }

  function decide(decision: Decision) {
    if (!selected) return
    setMessage(null)
    setDecisionError(null)
    reviewMutation.mutate(
      {
        applicationId: selected.applicationId,
        version: selected.version,
        decision,
        reason: reason.trim(),
      },
      {
        onSuccess: (result) => {
          // The decision moves the application out of this queue; leaving it
          // selected kept Approve and Reject live for a case already decided.
          setPendingDecision(null)
          select(null)
          if (decision === 'approved') {
            setMessage(
              result.invitationDelivered
                ? t('teacherApplications.approvedSent')
                : t('teacherApplications.approvedNotDelivered'),
            )
          } else {
            setMessage(t('teacherApplications.rejected'))
          }
        },
        onError: (error) => setDecisionError(toUserFacingError(error, t('teacherApplications.reviewFailed'))),
      },
    )
  }

  function resend() {
    if (!selected) return
    setMessage(null)
    reissueMutation.mutate(
      { applicationId: selected.applicationId, version: selected.version },
      {
        onSuccess: (result) => {
          setMessage(
            result.invitationDelivered
              ? t('teacherApplications.resent')
              : t('teacherApplications.resentNotDelivered'),
          )
        },
        onError: (error) => setMessage(toUserFacingError(error, t('teacherApplications.resendFailed'))),
      },
    )
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('teacherApplications.eyebrow')}
          title={t('teacherApplications.title')}
          description={t('teacherApplications.description')}
          actions={
            // A count only once the queue has been read: "0 in queue" after a
            // failed request would say there is nothing to review.
            listQuery.isSuccess ? (
              <Badge variant="secondary">
                {t('teacherApplications.inQueue', { count: listQuery.data.count })}
              </Badge>
            ) : undefined
          }
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {states.map((state) => (
            <Button
              key={state}
              type="button"
              size="sm"
              variant={reviewState === state ? 'default' : 'outline'}
              onClick={() => {
                setReviewState(state)
                select(null)
              }}
            >
              {t(`teacherApplications.states.${state}`)}
            </Button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('teacherApplications.queue')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* The queue said nothing while it loaded, and every failure read as
                  missing reviewer access, unannounced (#334). */}
              {listQuery.isPending && (
                <p role="status" className="text-sm text-muted-foreground">
                  {t('teacherApplications.loading')}
                </p>
              )}
              {listQuery.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {listQuery.error instanceof ApiError && listQuery.error.status === 403
                    ? t('teacherApplications.forbidden')
                    : toUserFacingError(listQuery.error, t('teacherApplications.loadFailed'))}
                </p>
              )}
              {listQuery.isSuccess && rows.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('teacherApplications.empty')}</p>
              )}
              {rows.map((row) => {
                const isSelected = selected?.applicationId === row.applicationId && selected.version === row.version
                return (
                  <button
                    key={`${row.applicationId}-${row.version}`}
                    type="button"
                    aria-pressed={isSelected}
                    className={`flex w-full flex-col rounded-lg border p-3 text-left hover:border-primary/40 ${
                      isSelected ? 'border-primary bg-primary/5' : 'bg-background/70'
                    }`}
                    onClick={() => {
                      if (!isSelected) select(row)
                    }}
                  >
                    <span className="font-medium text-foreground">{row.fullName || row.applicationId}</span>
                    <span className="text-sm text-muted-foreground">{row.verifiedEmail}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {subjectList(row.subjects ?? []) || t('teacherApplications.noSubjects')} · v{row.version}
                    </span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('teacherApplications.review')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!selected && <p className="text-muted-foreground">{t('teacherApplications.selectPrompt')}</p>}
              {selected && (
                <>
                  <p><span className="font-medium">{t('teacherApplications.name')}</span> {applicantName}</p>
                  <p><span className="font-medium">{t('teacherApplications.email')}</span> {selected.verifiedEmail}</p>
                  <p><span className="font-medium">{t('teacherApplications.subjects')}</span> {subjectList(detail?.subjects || selected.subjects || [])}</p>
                  <p className={`whitespace-pre-wrap ${statementFailed ? 'text-destructive' : 'text-muted-foreground'}`}>{statement}</p>
                  {detailQuery.isError && detail && (
                    <p role="alert" className="text-destructive">{t('teacherApplications.statementRefreshFailed')}</p>
                  )}
                  {decidable && (
                    <Textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      className="min-h-24"
                      aria-label={t('teacherApplications.reasonLabel')}
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {decidable && (
                      <>
                        <Button
                          type="button"
                          disabled={reviewMutation.isPending || !reason.trim()}
                          onClick={() => {
                            setDecisionError(null)
                            setPendingDecision('approved')
                          }}
                        >
                          {t('teacherApplications.approve')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={reviewMutation.isPending || !reason.trim()}
                          onClick={() => {
                            setDecisionError(null)
                            setPendingDecision('rejected')
                          }}
                        >
                          {t('teacherApplications.reject')}
                        </Button>
                      </>
                    )}
                    {reviewState === 'approved' && (
                      <Button type="button" variant="secondary" disabled={reissueMutation.isPending} onClick={resend}>
                        {t('teacherApplications.resend')}
                      </Button>
                    )}
                  </div>
                </>
              )}
              {/* In the accessibility tree while empty: a live region that
                  appears with its text is not announced, and `empty:hidden`
                  took this one out until then (#450). */}
              <p ref={messageLine} tabIndex={-1} role="status" className={message ? 'text-muted-foreground' : 'sr-only'}>
                {message}
              </p>
            </CardContent>
          </Card>
        </div>
        <Dialog
          open={pendingDecision !== null && selected !== null}
          onOpenChange={(open) => (open || reviewMutation.isPending ? null : setPendingDecision(null))}
        >
          {pendingDecision && selected ? (
            <DialogContent returnFocusFallback={messageLine}>
              <DialogHeader>
                <DialogTitle>
                  {t(`teacherApplications.confirm.title.${pendingDecision}`, { name: applicantName })}
                </DialogTitle>
                <DialogDescription>
                  {t(`teacherApplications.confirm.body.${pendingDecision}`, { email: selected.verifiedEmail })}
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm">
                <p className="font-medium">{t('teacherApplications.confirm.reason')}</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{reason.trim()}</p>
              </div>
              {decisionError ? (
                <p role="alert" className="text-sm text-destructive">
                  {decisionError}
                </p>
              ) : null}
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={reviewMutation.isPending}
                  onClick={() => setPendingDecision(null)}
                >
                  {t('teacherApplications.confirm.cancel')}
                </Button>
                <Button
                  type="button"
                  variant={pendingDecision === 'rejected' ? 'destructive' : 'default'}
                  disabled={reviewMutation.isPending || !reason.trim()}
                  onClick={() => decide(pendingDecision)}
                >
                  {t(pendingDecision === 'approved' ? 'teacherApplications.approve' : 'teacherApplications.reject')}
                </Button>
              </DialogFooter>
            </DialogContent>
          ) : null}
        </Dialog>
      </PageContainer>
    </DashboardLayout>
  )
}
