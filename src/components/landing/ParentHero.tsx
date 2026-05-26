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
          <h1 className="editorial-heading editorial-title-shell max-w-3xl text-4xl font-semibold leading-tight text-foreground md:text-6xl">
            STOA helps families see when{' '}
            <span className="editorial-accent">homework support is working</span>.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Students get immediate explanations, teachers step in when needed, and parents see
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
      <div className="brand-image-panel relative min-h-[27rem] overflow-hidden shadow-[0_24px_70px_hsl(var(--stoa-shadow-color)_/_0.12)]">
        <img
          src="https://images.pexels.com/photos/10109025/pexels-photo-10109025.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Smiling child writing homework at a study desk"
          className="absolute inset-0 h-full w-full object-cover opacity-72"
        />
        <div className="brand-image-overlay-vertical absolute inset-0" />
        <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/15 bg-[hsl(var(--stoa-brand-card)_/_0.92)] p-4 text-[hsl(var(--stoa-brand-ink))] shadow-2xl backdrop-blur">
          <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
            Growth this week
          </p>
          <div className="mt-3 space-y-2">
            {['Completed 3 focused practice sessions', 'Confidence improving in fractions', 'Next step ready for tomorrow'].map((item) => (
              <div key={item} className="rounded-md border border-border/70 bg-[hsl(var(--stoa-brand-paper))] px-3 py-2 text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
