import { ArrowRight, CheckCircle2 } from 'lucide-react'
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

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-foreground">
        {tutorPending ? t('auth:register.pendingReview') : t('auth:register.studentDone')}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        {tutorPending
          ? t('auth:register.pendingReview')
          : data.parentLinked
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
