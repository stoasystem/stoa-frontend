import { Bot, GraduationCap, MessageSquareText, Users } from 'lucide-react'

const steps = [
  {
    title: 'Ask a question',
    description: 'Students begin directly in chat with a homework question or uploaded assignment.',
    icon: MessageSquareText,
  },
  {
    title: 'Get an AI explanation',
    description: 'STOA gives a first explanation immediately, with the work still visible in context.',
    icon: Bot,
  },
  {
    title: 'Ask a teacher if needed',
    description: 'When the answer is not clear enough, a human tutor can step into the same thread.',
    icon: GraduationCap,
  },
  {
    title: 'Parents follow progress',
    description: 'Parents see learning history, reports, and teacher-help records without interrupting study.',
    icon: Users,
  },
]

export function HomeLearningFlow() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
          How STOA helps students
        </p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          One learning path, not three disconnected tools.
        </h2>
      </div>
      <div className="mt-9 grid gap-4 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon

          return (
            <article
              key={step.title}
              className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/78 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl"
            >
              <span className="text-xs font-semibold text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-[hsl(var(--accent))]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
