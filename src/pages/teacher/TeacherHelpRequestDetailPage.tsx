import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { classroomPathFor } from '@/app/router/routeManifest'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { HelpRequestDetailCard } from '@/components/teacher/HelpRequestDetailCard'
import { PracticeRequestContextCard } from '@/components/teacher/PracticeRequestContextCard'
import { TeacherDashboardSkeleton } from '@/components/teacher/TeacherDashboardSkeleton'
import { TeacherRequestTimeline } from '@/components/teacher/TeacherRequestTimeline'
import { TeacherAssistanceSummaryCard } from '@/components/teacher/TeacherAssistanceSummaryCard'
import { CurriculumRolloutPanel } from '@/components/practice/CurriculumRolloutPanel'
import { Button } from '@/components/ui/button'
import { TeacherReplyComposer } from '@/features/teacherReply/TeacherReplyComposer'
import { useTeacherReply } from '@/features/teacherReply/useTeacherReply'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { useTeacherHelpRequestDetailQuery } from '@/hooks/teacher/useTeacherHelpRequestDetailQuery'
import { useUpdateTeacherHelpRequestMutation } from '@/hooks/teacher/useUpdateTeacherHelpRequestMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { normalizeCurriculumSubjectId } from '@/services/practice/practiceApi'
import { isHelpRequestConflict, isHelpRequestOutOfReach } from '@/lib/teacherHelpRequestConflict'
import { acceptsTeacherReply, awaitsTeacherAcceptance, helpModeOf, teacherStatusActions } from '@/types/teacherHelp'

const statusActionKey: Record<string, string> = {
  in_progress: 'markInProgress',
  resolved: 'markResolved',
}

export function TeacherHelpRequestDetailPage() {
  const { t } = useTranslation('practice')
  const { t: tTeacher } = useTranslation('teacher')
  const { requestId } = useParams()
  const [resolutionNote, setResolutionNote] = useState('')
  const requestCardRef = useRef<HTMLDivElement>(null)
  // A change that failed takes focus to the failure, not to the request: there a
  // screen reader read the card out and the teacher took it for done (#410).
  // Moved after the commit, when the failure line is on the page.
  const failureLine = useRef<HTMLParagraphElement>(null)
  const [refocus, setRefocus] = useState<{ failed: boolean } | null>(null)
  const requestQuery = useTeacherHelpRequestDetailQuery(requestId)
  const updateStatus = useUpdateTeacherHelpRequestMutation()
  const reply = useTeacherReply(requestId)
  // Read once the request has said its subject: read before, it was the whole
  // catalog with its previews, and then again for the subject (#416).
  const curriculumQuery = useCurriculumCatalogQuery({
    subjectId: normalizeCurriculumSubjectId(requestQuery.data?.subject),
    includePreview: true,
    enabled: requestQuery.data !== undefined,
  })

  useEffect(() => {
    if (!requestId) return
    trackEvent('teacher_request_opened', { requestId })
  }, [requestId])

  useEffect(() => {
    if (refocus) (refocus.failed ? failureLine.current : requestCardRef.current)?.focus()
  }, [refocus])

  // A failed read keeps the last copy on screen. Refused (403/404), that copy is
  // no longer this teacher's: show it, offer nothing on it (#269). Any other
  // failure may pass at the next poll: keep everything, the reply draft above
  // all, but take nothing until a read succeeds again (#331).
  const canAct = !isHelpRequestOutOfReach(requestQuery.error)
  // Refused before any copy was read: there is nothing to keep (#670).
  const gone = !canAct && requestQuery.data === undefined
  const readFailed = requestQuery.isError && canAct
  const status = requestQuery.data?.status
  // Offered and not yet accepted, the request is only read: accepting it is
  // the one step, and nothing else is offered until then (#705). The backend
  // refuses a reply before it (stoa-backend#479).
  const awaitingAcceptance = canAct && awaitsTeacherAcceptance(status)
  const statusActions = canAct && !awaitingAcceptance ? teacherStatusActions(status) : []
  const changedElsewhere = isHelpRequestConflict(updateStatus.error) || reply.conflict
  // A reply refused as not accepted yet (409 `accept_help_request`): the copy
  // on screen said otherwise, so the teacher is led to accept it, the draft
  // kept, until an acceptance here goes through.
  const acceptedHere = updateStatus.isSuccess && updateStatus.data?.status === 'in_progress'
  const replyNeedsAcceptance = canAct && reply.notAccepted && !acceptedHere
  const ended = status === 'withdrawn' || status === 'expired' ? status : null
  // How the student asked to be helped (#705): a text answer is written here,
  // a classroom request is answered in the classroom. An older request is text.
  const mode = helpModeOf(requestQuery.data)
  const repliesHere = mode === 'text' || status === 'resolved'
  const accept = () =>
    requestId &&
    updateStatus.mutate(
      { requestId, status: 'in_progress' },
      {
        onSettled: (_request, error) => {
          if (focusLost()) setRefocus({ failed: Boolean(error) })
        },
      },
    )

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          title={tTeacher('detail.title')}
          description={tTeacher('detail.description')}
          actions={
            <PageActions
              secondary={<BackButton label={tTeacher('detail.backLabel')} to="/teacher" />}
              primary={
                // Offered and not yet accepted: accepting is the one step, and it
                // goes nowhere (#705). Refused or failed, the page says so as for
                // any status change.
                awaitingAcceptance ? (
                  <Button
                    type="button"
                    data-accept-request-button
                    disabled={readFailed || updateStatus.isPending || !requestId}
                    onClick={accept}
                  >
                    {tTeacher('detail.accept.button')}
                  </Button>
                ) : canAct && status === 'in_progress' && mode === 'classroom' && requestQuery.data ? (
                  // Accepted, a classroom request is answered there; the backend
                  // lets a teacher in only once they hold it (#696). A text
                  // request has no classroom: its reply box is below.
                  <Button asChild>
                    <Link to={classroomPathFor(requestQuery.data.conversationId, requestQuery.data.requestId)} data-enter-classroom>
                      {tTeacher('detail.enterClassroom')}
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          }
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: tTeacher('detail.breadcrumbRoot'), to: '/teacher' },
            { label: tTeacher('detail.backLabel'), to: '/teacher' },
            { label: requestQuery.data?.student.name ?? tTeacher('detail.breadcrumbFallback') },
          ]}
        />
        {requestQuery.isLoading && <TeacherDashboardSkeleton showHeader={false} />}
        {/* Refused with nothing on screen: an offer that lapsed or went to
            someone else, opened from an old notification or a saved link.
            That is no failure, and it says so, with the way back (#670). */}
        {gone && (
          <section
            role="status"
            aria-labelledby="request-out-of-reach"
            data-request-out-of-reach
            className="rounded-lg border bg-card p-5"
          >
            <h2 id="request-out-of-reach" className="m-0 text-base font-semibold text-foreground">
              {tTeacher('detail.outOfReach.title')}
            </h2>
            <p className="mb-0 mt-1 text-sm leading-6 text-muted-foreground">{tTeacher('detail.outOfReach.body')}</p>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link to="/teacher">{tTeacher('detail.outOfReach.back')}</Link>
              </Button>
            </div>
          </section>
        )}
        {requestQuery.isError && !gone && (
          <p role="alert" className="text-sm text-destructive">{tTeacher('detail.loadFailed')}</p>
        )}
        {requestQuery.data && (
          <div className="space-y-6">
            {requestQuery.data.practiceContext && (
              <PracticeRequestContextCard context={requestQuery.data.practiceContext} />
            )}
            {/* Focus lands here after a status change: the button pressed is
                then disabled or gone, which would drop it on the page (#332). */}
            <div ref={requestCardRef} tabIndex={-1} className="rounded-lg">
              <HelpRequestDetailCard request={requestQuery.data} />
            </div>
            <TeacherAssistanceSummaryCard request={requestQuery.data} />
            {/* No "AI teacher tools" card: hidden from teachers (#704). */}
            {/* No "open automation" link: the console is hidden from teachers until #703. */}
            <CurriculumRolloutPanel
              title={t('curriculumRollout.teacherTitle')}
              description={t('curriculumRollout.teacherDescription')}
              catalog={curriculumQuery.data}
              isLoading={curriculumQuery.isLoading}
              isError={curriculumQuery.isError}
              contextLabel={t('curriculumRollout.teacherContext')}
            />
            {/* Ended before any teacher took it: said, with nothing to do on it (#705). */}
            {ended && (
              <section role="status" data-request-ended={ended} className="rounded-lg border bg-card p-4">
                <p className="m-0 text-sm leading-6 text-muted-foreground">{tTeacher(`detail.ended.${ended}`)}</p>
              </section>
            )}
            {(awaitingAcceptance || replyNeedsAcceptance) && (
              <section
                aria-labelledby="accept-request-title"
                data-accept-request
                className="rounded-lg border bg-card p-4"
              >
                <h2 id="accept-request-title" className="m-0 text-base font-semibold text-foreground">
                  {tTeacher('detail.accept.title')}
                </h2>
                <p
                  role={replyNeedsAcceptance ? 'alert' : undefined}
                  className="mb-0 mt-1 text-sm leading-6 text-muted-foreground"
                >
                  {tTeacher(
                    replyNeedsAcceptance
                      ? 'detail.accept.replyRefused'
                      : mode === 'classroom'
                        ? 'detail.accept.bodyClassroom'
                        : 'detail.accept.body',
                  )}
                </p>
                {/* Offered, the page's one button is at the top. A reply refused as
                    not accepted on a copy that said otherwise has none there. */}
                {replyNeedsAcceptance && !awaitingAcceptance && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      data-accept-request-button
                      disabled={readFailed || updateStatus.isPending || !requestId}
                      onClick={accept}
                    >
                      {tTeacher('detail.accept.button')}
                    </Button>
                  </div>
                )}
              </section>
            )}
            {changedElsewhere && (
              <p ref={failureLine} tabIndex={-1} role="alert" className="text-sm text-destructive">
                {tTeacher('detail.changedElsewhere')}
              </p>
            )}
            {/* Only the changes the server takes in this status: a finished request
                takes none (#162), one in progress can only be finished (#269). */}
            {statusActions.length > 0 && (
              <>
              <div className="rounded-lg border p-4">
                <label className="text-sm font-medium" htmlFor="resolution-note">
                  {tTeacher('detail.resolutionNote')}
                </label>
                {/* That it is required is said in text, not only in a placeholder
                    that disappears as soon as the teacher types (#332). */}
                <p id="resolution-note-hint" className="mt-1 text-xs text-muted-foreground">
                  {tTeacher('detail.resolutionNotePlaceholder')}
                </p>
                <textarea
                  id="resolution-note"
                  className="mt-2 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  aria-describedby="resolution-note-hint"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {statusActions.map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant="outline"
                    aria-describedby={status === 'resolved' ? 'resolution-note-hint' : undefined}
                    disabled={
                      readFailed ||
                      updateStatus.isPending ||
                      !requestId ||
                      (status === 'resolved' && resolutionNote.trim().length === 0)
                    }
                    onClick={() =>
                      requestId &&
                      updateStatus.mutate(
                        {
                          requestId,
                          status,
                          resolutionNote: status === 'resolved' ? resolutionNote.trim() : undefined,
                        },
                        {
                          // Whether focus was lost is read now, while the pressed
                          // button is still disabled; where it goes, once rendered.
                          onSettled: (_request, error) => {
                            if (focusLost()) setRefocus({ failed: Boolean(error) })
                          },
                        },
                      )
                    }
                  >
                    {tTeacher(statusActionKey[status] ?? 'markResolved')}
                  </Button>
                ))}
              </div>
              </>
            )}
            {updateStatus.isError && !changedElsewhere && (
              <p ref={failureLine} tabIndex={-1} role="alert" className="text-sm text-destructive">
                {tTeacher('detail.updateFailed')}
              </p>
            )}
            {/* A resolved request still takes its teacher's follow-up (#222); one
                withdrawn or expired has no teacher and the server refuses the reply. */}
            {canAct && acceptsTeacherReply(requestQuery.data.status) && repliesHere && (
              <>
                <SectionHeader
                  title={tTeacher('detail.replyTitle')}
                  description={tTeacher('detail.replyDescription')}
                />
                {readFailed && (
                  <p role="status" className="text-sm text-muted-foreground">{tTeacher('detail.replyPaused')}</p>
                )}
                {/* Pictures go up the way a student's do (#513). */}
                <TeacherReplyComposer reply={reply} disabled={readFailed} />
              </>
            )}
            <TeacherRequestTimeline requestId={requestQuery.data.requestId} notes={requestQuery.data.notes ?? []} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

// Lost: on the page itself, or still on a control that is now disabled or
// gone (browsers differ in which).
function focusLost() {
  const active = document.activeElement as (HTMLElement & { disabled?: boolean }) | null
  return !active || active === document.body || Boolean(active.disabled) || !active.isConnected
}
