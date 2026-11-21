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
import { CurriculumRolloutPanel } from '@/components/practice/CurriculumRolloutPanel'
import { Button } from '@/components/ui/button'
import { teacherPracticePathFor } from '@/features/assignPractice/practicePath'
import { TeacherReplyComposer } from '@/features/teacherReply/TeacherReplyComposer'
import { useTeacherReply } from '@/features/teacherReply/useTeacherReply'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { useTeacherHelpRequestDetailQuery } from '@/hooks/teacher/useTeacherHelpRequestDetailQuery'
import { useUpdateTeacherHelpRequestMutation } from '@/hooks/teacher/useUpdateTeacherHelpRequestMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { normalizeCurriculumSubjectId } from '@/services/practice/practiceApi'
import { isHelpRequestConflict, isHelpRequestOutOfReach } from '@/lib/teacherHelpRequestConflict'
import { acceptsTeacherReply, awaitsTeacherAcceptance, helpModeOf } from '@/types/teacherHelp'

export function TeacherHelpRequestDetailPage() {
  const { t } = useTranslation('practice')
  const { t: tTeacher } = useTranslation('teacher')
  const { requestId } = useParams()
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
  // Held, the one change left is to finish it: no review step, no closing
  // note (it was stored and never read), one "Mark resolved" (#705).
  const resolvable = canAct && status === 'in_progress'
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
  const changeStatus = (next: 'in_progress' | 'resolved') =>
    requestId &&
    updateStatus.mutate(
      { requestId, status: next },
      {
        onSettled: (_request, error) => {
          if (focusLost()) setRefocus({ failed: Boolean(error) })
        },
      },
    )
  const accept = () => changeStatus('in_progress')
  const resolveButton = resolvable ? (
    <Button
      type="button"
      variant="outline"
      data-resolve-request
      disabled={readFailed || updateStatus.isPending || !requestId}
      onClick={() => changeStatus('resolved')}
    >
      {tTeacher('markResolved')}
    </Button>
  ) : null

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
            {/* Focus lands here after a status change: the button pressed is
                then disabled or gone, which would drop it on the page (#332).
                The card opens with the preparation table, the conversation
                folded under it (#704). */}
            <div ref={requestCardRef} tabIndex={-1} className="rounded-lg">
              <HelpRequestDetailCard request={requestQuery.data} />
            </div>
            {/* The exercise the student asked from: course context, under the request (#704). */}
            {requestQuery.data.practiceContext && (
              <PracticeRequestContextCard context={requestQuery.data.practiceContext} />
            )}
            {/* Practice for this student (#703): the backend lets the teacher holding
                the request, or who resolved it in the last 14 days, assign to its
                student (stoa-backend#495). Offered and not yet accepted is no relation.
                It is the page's one way to give the student exercises: the exercise
                draft card (stoa-backend#519) stays off, as it did the same (#704). */}
            {canAct && (status === 'in_progress' || status === 'resolved') && (
              <Button asChild variant="outline">
                <Link to={teacherPracticePathFor(requestQuery.data.student.id, requestQuery.data.requestId)}>
                  {tTeacher('assignPractice.entry.forStudent', { name: requestQuery.data.student.name })}
                </Link>
              </Button>
            )}
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
            {/* Accepted, a classroom request is answered there: the way in is the
                page's primary button; finishing it is here (#705). */}
            {resolvable && mode === 'classroom' && (
              <section
                aria-labelledby="classroom-help-title"
                data-classroom-help
                className="rounded-lg border bg-card p-4"
              >
                <h2 id="classroom-help-title" className="m-0 text-base font-semibold text-foreground">
                  {tTeacher('detail.classroomHelp.title')}
                </h2>
                <p className="mb-0 mt-1 text-sm leading-6 text-muted-foreground">{tTeacher('detail.classroomHelp.body')}</p>
                <div className="mt-3">{resolveButton}</div>
              </section>
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
                {/* Finished once answered: in the reply area, not a step of its own (#705). */}
                {resolveButton && (
                  <div className="flex flex-col items-start gap-1">
                    <p className="m-0 text-sm text-muted-foreground">{tTeacher('detail.resolveHint')}</p>
                    {resolveButton}
                  </div>
                )}
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
