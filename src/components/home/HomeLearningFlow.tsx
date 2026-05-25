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
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
            How STOA helps students
          </p>
          <h2 className="editorial-heading editorial-title-shell mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            One learning path, <span className="editorial-accent">not three disconnected tools</span>.
          </h2>
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-[1.25rem] border border-border/70 bg-[#152238] shadow-[0_24px_70px_hsl(217_45%_15%_/_0.12)]">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
            alt="Student using a laptop while studying at a desk"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(217_45%_15%_/_0.82),hsl(217_45%_15%_/_0.18)_58%,hsl(40_39%_49%_/_0.35))]" />
          <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/15 bg-white/88 p-4 text-[#152238] shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7e8f7c]">
              Learning room
            </p>
            <p className="mt-2 text-lg font-semibold leading-6">
              The student stays in one conversation while AI, tutor help, and parent visibility
              work around it.
            </p>
          </div>
        </div>
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
