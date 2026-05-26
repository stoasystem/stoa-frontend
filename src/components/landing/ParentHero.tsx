import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, MessageCircle, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/services/analytics/analyticsClient'

const parentHomeworkImageUrl = new URL('../../../img/parent-homework.jpeg', import.meta.url).href

const parentWeeklySignals = [
  {
    label: 'Questions',
    value: '18',
    helper: 'asked this week',
    Icon: MessageCircle,
  },
  {
    label: 'Mastery',
    value: '+24%',
    helper: 'fractions topic',
    Icon: TrendingUp,
  },
  {
    label: 'Practice',
    value: '3/4',
    helper: 'focused sessions',
    Icon: CheckCircle2,
  },
]

const topicProgress = [
  { label: 'Fractions', before: 42, after: 76, gain: 34 },
  { label: 'Word problems', before: 48, after: 63, gain: 15 },
]

export function ParentHero() {
  return (
    <section className="grid gap-8 py-12 lg:grid-cols-[1fr_26rem] lg:items-center">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">For parents</p>
          <h1 className="editorial-heading editorial-title-shell max-w-3xl text-4xl font-semibold leading-tight text-foreground md:text-6xl">
            STOA helps families see how their{' '}
            <span className="editorial-accent">child is growing</span>.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Students get clear explanations and steady practice, while parents see effort,
            weak topics, confidence signals, and the next useful step without reading every chat.
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
      <div className="brand-image-panel relative min-h-[31rem] overflow-hidden shadow-[0_24px_70px_hsl(var(--stoa-shadow-color)_/_0.12)]">
        <img
          src={parentHomeworkImageUrl}
          alt="Smiling child writing homework at a study desk"
          className="absolute inset-0 h-full w-full object-cover opacity-72"
        />
        <div className="brand-image-overlay-vertical absolute inset-0" />
        <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/15 bg-[hsl(var(--stoa-brand-card)_/_0.94)] p-4 text-[hsl(var(--stoa-brand-ink))] shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
              Weekly learning snapshot
            </p>
            <span className="rounded-full bg-[hsl(var(--stoa-brand-burgundy-soft))] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--stoa-brand-burgundy-strong))]">
              Parent view
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {parentWeeklySignals.map(({ label, value, helper, Icon }) => (
              <div key={label} className="min-w-0 rounded-md border border-border/70 bg-[hsl(var(--stoa-brand-paper))] p-2.5">
                <div className="flex min-w-0 items-center gap-1.5 text-[0.68rem] font-semibold text-muted-foreground sm:text-xs">
                  <Icon className="h-3.5 w-3.5 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </div>
                <div className="mt-2 text-xl font-semibold leading-none text-foreground sm:text-2xl">{value}</div>
                <p className="mt-1 text-[0.68rem] leading-4 text-muted-foreground sm:text-xs sm:leading-5">{helper}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-border/70 bg-[hsl(var(--stoa-brand-paper))] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
              <span>Topic progress this week</span>
            </div>
            <div className="mt-3 space-y-3">
              {topicProgress.map((topic) => (
                <div key={topic.label}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-foreground">{topic.label}</span>
                    <span className="font-semibold text-[hsl(var(--stoa-brand-burgundy))]">+{topic.gain} pts</span>
                  </div>
                  <div className="relative mt-1.5 h-2 rounded-full bg-border/70" aria-hidden="true">
                    <div
                      className="absolute inset-y-0 rounded-full bg-[hsl(var(--stoa-brand-burgundy)_/_0.32)]"
                      style={{ left: `${topic.before}%`, width: `${topic.after - topic.before}%` }}
                    />
                    <div
                      className="absolute inset-y-0 w-2 rounded-full bg-[hsl(var(--stoa-brand-burgundy))]"
                      style={{ left: `calc(${topic.after}% - 0.25rem)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-end gap-2" aria-label="Question activity over five study days">
            {[3, 5, 4, 7, 9].map((height, index) => (
              <div key={`${height}-${index}`} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-[hsl(var(--stoa-brand-burgundy))]"
                  style={{ height: `${height * 0.42}rem` }}
                  aria-hidden="true"
                />
                <span className="text-[0.65rem] font-semibold text-muted-foreground">D{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
