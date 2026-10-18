import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { TeacherApplicationListItem, TeacherReviewState } from '@/services/teacher/teacherApplicationApi'

const states: TeacherReviewState[] = ['pending_review', 'approved', 'rejected']

export function AdminTeacherApplicationsPage() {
  const { t } = useTranslation('admin')
  // Subject names live with the teacher copy; stored spellings read as the subject they name.
  const { t: tTeacher } = useTranslation('teacher')
  const subjectList = (subjects: readonly string[]) =>
    subjects.map((subject) => teacherSubjectLabel(subject, tTeacher)).join(', ')
  const [reviewState, setReviewState] = useState<TeacherReviewState>('pending_review')
  const [selected, setSelected] = useState<TeacherApplicationListItem | null>(null)
  // The review reason is stored with the decision, so its starting text is
  // data and stays in one language; the reviewer can overwrite it.
  const [reason, setReason] = useState('Reviewed against teacher onboarding criteria.')
  const [message, setMessage] = useState<string | null>(null)
  const listQuery = useTeacherApplicationsQuery(reviewState)
  const detailQuery = useTeacherApplicationDetailQuery(selected?.applicationId ?? null, selected?.version ?? null)
  const reviewMutation = useReviewTeacherApplicationMutation()
  const reissueMutation = useReissueTeacherInvitationMutation()
  const rows = listQuery.data?.items ?? []
  const detail = detailQuery.data
  // Only a pending application can be decided; the other tabs are a record.
  const decidable = reviewState === 'pending_review'
  let statement: string
  if (detailQuery.isError) statement = toUserFacingError(detailQuery.error, t('teacherApplications.statementFailed'))
  else if (detailQuery.isPending) statement = t('teacherApplications.loadingStatement')
  else statement = detail?.statement?.trim() || t('teacherApplications.noStatement')

  function decide(decision: 'approved' | 'rejected') {
    if (!selected) return
    setMessage(null)
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
          setSelected(null)
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
        onError: (error) => setMessage(toUserFacingError(error, t('teacherApplications.reviewFailed'))),
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
                setSelected(null)
                setMessage(null)
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
              {listQuery.isError && (
                <p className="text-sm text-destructive">
                  {toUserFacingError(listQuery.error, t('teacherApplications.loadFailed'))}
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
                      setSelected(row)
                      setMessage(null)
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
                  <p><span className="font-medium">{t('teacherApplications.name')}</span> {detail?.fullName || selected.fullName}</p>
                  <p><span className="font-medium">{t('teacherApplications.email')}</span> {selected.verifiedEmail}</p>
                  <p><span className="font-medium">{t('teacherApplications.subjects')}</span> {subjectList(detail?.subjects || selected.subjects || [])}</p>
                  <p className={`whitespace-pre-wrap ${detailQuery.isError ? 'text-destructive' : 'text-muted-foreground'}`}>{statement}</p>
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
                          onClick={() => decide('approved')}
                        >
                          {t('teacherApplications.approve')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={reviewMutation.isPending || !reason.trim()}
                          onClick={() => decide('rejected')}
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
              <p role="status" className="text-muted-foreground empty:hidden">{message}</p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
