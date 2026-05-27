import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type PracticeEntryCardProps = {
  eyebrow: string
  title: string
  body: string
  primaryCta: string
  secondaryCta: string
  startPracticePath: string
}

export function PracticeEntryCard({
  eyebrow,
  title,
  body,
  primaryCta,
  secondaryCta,
  startPracticePath,
}: PracticeEntryCardProps) {
  return (
    <div className="min-w-0 rounded-lg border border-primary/15 bg-card/88 p-5 shadow-[var(--platform-shadow-soft)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5 sm:p-6">
      <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
        {eyebrow}
      </p>
      <h2 className="editorial-heading editorial-title-shell mt-5 break-words text-4xl font-semibold leading-tight text-foreground [overflow-wrap:anywhere] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-muted-foreground">
        {body}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="premium-primary-button h-auto min-h-11 whitespace-normal px-5 py-3 text-center"
        >
          <Link to={startPracticePath}>
            {primaryCta}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-auto min-h-11 whitespace-normal px-5 py-3 text-center"
        >
          <Link to="/how-it-works">
            {secondaryCta}
          </Link>
        </Button>
      </div>
    </div>
  )
}
