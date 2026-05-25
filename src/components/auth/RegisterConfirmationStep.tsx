import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { AuthResponse } from '@/types/user'

function getContinueHref(data: AuthResponse) {
  if (data.user.role === 'student') return '/chat'
  if (data.user.role === 'parent') return '/parent'
  if (data.user.role === 'tutor') return '/tutor'
  return '/dashboard'
}

export function RegisterConfirmationStep({ data }: { data: AuthResponse }) {
  const tutorPending = data.verificationStatus === 'pending_review'

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-foreground">
        {tutorPending ? 'Tutor profile submitted' : 'Your STOA account is ready'}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        {tutorPending
          ? 'Your tutor profile is pending review. You can preview the tutor dashboard while real approval remains a future backend workflow.'
          : data.parentLinked
            ? 'Parent account prepared. Ask your first homework question below.'
            : 'Continue to your role dashboard to start the demo flow.'}
      </p>
      <Button asChild className="premium-button-lift mt-6 rounded-full">
        <Link to={getContinueHref(data)}>
          Continue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
