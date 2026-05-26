import { ArrowRight, CheckCircle2, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { AuthResponse } from '@/types/user'

function getContinueHref(data: AuthResponse) {
  if (data.user.role === 'student') return '/chat'
  if (data.user.role === 'parent') return '/parent'
  if (data.user.role === 'tutor') return '/tutor'
  return '/dashboard'
}

export function RegisterConfirmationStep({ data }: { data: AuthResponse }) {
  const { t } = useTranslation(['auth', 'common'])
  const tutorPending = data.verificationStatus === 'pending_review'
  const Icon = tutorPending ? Clock3 : CheckCircle2

  if (tutorPending) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/90 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <p className="brand-section-kicker mt-5">
          {t('auth:register.applicationSubmittedEyebrow')}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">
          {t('auth:register.pendingReviewTitle')}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          {t('auth:register.pendingReviewBody')}
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
          <Button asChild className="premium-button-lift rounded-full">
            <Link to="/teacher-support">
              {t('auth:register.teacherSupportCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="rounded-full" variant="outline">
            <Link to="/login">
              {t('auth:register.signInAfterApproval')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-foreground">
        {t('auth:register.studentDone')}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        {data.parentLinked
          ? t('auth:register.parentLinked')
          : t('auth:register.studentDone')}
      </p>
      <Button asChild className="premium-button-lift mt-6 rounded-full">
        <Link to={getContinueHref(data)}>
          {t('common:actions.continue')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
