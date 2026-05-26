import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  HeartHandshake,
  Lightbulb,
  MessageSquareText,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const parentHomeworkImageUrl = new URL('../../../img/family-learning.jpeg', import.meta.url).href

const growthSignals = [
  {
    title: 'Learning rhythm',
    description: 'See whether your child is asking questions, returning to practice, and building a steady study habit.',
    Icon: CalendarCheck,
  },
  {
    title: 'Weak topics',
    description: 'Reports translate mistakes and repeated questions into clear topics that need attention.',
    Icon: Target,
  },
  {
    title: 'Confidence signals',
    description: 'Notice when your child starts moving from “I am stuck” to “I know the next step.”',
    Icon: HeartHandshake,
  },
]

const weeklyViewItems = [
  {
    label: 'Questions asked',
    value: '18',
    helper: 'Child is actively seeking help instead of staying blocked.',
    Icon: MessageSquareText,
  },
  {
    label: 'Topic improving',
    value: 'Fractions',
    helper: 'Practice and explanations are turning into measurable progress.',
    Icon: TrendingUp,
  },
  {
    label: 'Next parent action',
    value: 'Review word problems',
    helper: 'One practical step replaces a long list of chat transcripts.',
    Icon: Lightbulb,
  },
]

const parentActions = [
  'Know when your child has been practicing consistently, not just finishing homework once.',
  'Understand which topics need calm review at home and which can continue with STOA support.',
  'See teacher-support events as learning context without needing private chat-level detail.',
  'Use weekly summaries to encourage progress, plan support, and avoid guessing where the problem is.',
]

export function ParentGrowthExplainer() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-3">
        {growthSignals.map(({ title, description, Icon }) => (
          <Card key={title}>
            <CardHeader>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              <p>{description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-lg border bg-card shadow-[var(--platform-shadow-soft)]">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="brand-image-panel relative min-h-80 overflow-hidden rounded-b-none rounded-t-lg lg:rounded-l-lg lg:rounded-r-none">
            <img
              src={parentHomeworkImageUrl}
              alt="Parent and child reviewing schoolwork together"
              className="absolute inset-0 h-full w-full object-cover opacity-78"
            />
            <div className="brand-image-overlay absolute inset-0" />
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/15 bg-[hsl(var(--stoa-brand-card)_/_0.92)] p-4 text-[hsl(var(--stoa-brand-ink))] backdrop-blur">
              <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
                Parent clarity
              </p>
              <p className="mt-2 text-sm leading-6">
                You do not need to read every answer. STOA turns learning activity into a few signals you can act on.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
              How STOA supports growth at home
            </p>
            <h2 className="editorial-heading mt-3 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              See what is changing for your child, not just what was submitted.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              The parent view focuses on the pattern behind homework: where your child asks for help,
              which topics are improving, and where a short parent check-in can make the next week easier.
            </p>

            <div className="mt-6 grid gap-3">
              {weeklyViewItems.map(({ label, value, helper, Icon }) => (
                <div key={label} className="flex gap-4 rounded-lg border bg-background/70 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-[hsl(var(--stoa-brand-burgundy-strong))]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-semibold text-foreground">{label}</h3>
                      <span className="text-sm font-semibold text-[hsl(var(--stoa-brand-burgundy))]">{value}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{helper}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
            What parents can do with it
          </p>
          <h2 className="editorial-heading mt-3 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Turn learning data into a calm conversation.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {parentActions.map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border bg-card p-4 text-sm leading-6 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
              Weekly parent report
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              A short summary of effort, progress, and the next useful action.
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">Growth snapshot</p>
              <p className="text-xs text-muted-foreground">Built for parent decisions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
