import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function ParentHero() {
  return (
    <section className="grid gap-8 py-12 lg:grid-cols-[1fr_26rem] lg:items-center">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">For parents</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            STOA helps families see when homework support is working.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Students get immediate AI explanations, tutors step in when needed, and parents see
            concise learning signals without reading every chat.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            onClick={() => {
              trackEvent('parent_value_cta_clicked', { destination: 'pricing' })
            }}
          >
            <Link to="/pricing" className="gap-2">
              View pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/how-it-works">How it works</Link>
          </Button>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="space-y-4">
          {['Child is practicing this week', 'Weak topic: fractions', 'Teacher helped once', 'Recommended next action ready'].map((item) => (
            <div key={item} className="rounded-md border bg-background px-4 py-3 text-sm font-medium">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
