import { Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useTeacherApplicationStatusQuery } from '@/hooks/teacher/useTeacherApplication'
import type { TeacherApplicationSubmitResponse } from '@/services/teacher/teacherApplicationApi'

export function TeacherApplicationSubmitted({
  application,
}: {
  application: TeacherApplicationSubmitResponse
}) {
  const { t } = useTranslation(['auth', 'common'])
  const statusQuery = useTeacherApplicationStatusQuery(application.applicationId)
  const reviewState = statusQuery.data?.reviewState ?? 'pending_review'

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Clock3 className="h-6 w-6" />
      </div>
      <p className="brand-section-kicker mt-5">{t('auth:register.applicationSubmittedEyebrow')}</p>
      <h2 className="mt-3 text-2xl font-semibold text-foreground">
        {t('auth:register.pendingReviewTitle')}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        {t('auth:register.pendingReviewBody')}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        {t('auth:register.applicationStatusLabel')}:{' '}
        <span className="font-medium text-foreground">
          {t(`auth:register.reviewStates.${reviewState}`, { defaultValue: reviewState })}
        </span>
      </p>
      <div className="mx-auto mt-5 grid max-w-lg gap-3 text-left text-sm text-muted-foreground sm:grid-cols-3">
        <div className="rounded-lg border bg-background/70 p-3">
          <div className="font-semibold text-foreground">{t('auth:register.reviewStep')}</div>
          <p className="mt-1">{t('auth:register.reviewStepBody')}</p>
        </div>
        <div className="rounded-lg border bg-background/70 p-3">
          <div className="font-semibold text-foreground">{t('auth:register.interviewStep')}</div>
          <p className="mt-1">{t('auth:register.interviewStepBody')}</p>
        </div>
        <div className="rounded-lg border bg-background/70 p-3">
          <div className="font-semibold text-foreground">{t('auth:register.approvalStep')}</div>
          <p className="mt-1">{t('auth:register.approvalStepBody')}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild className="rounded-full" variant="outline">
          <Link to="/login">{t('auth:register.waitForInvitation')}</Link>
        </Button>
      </div>
    </div>
  )
}
