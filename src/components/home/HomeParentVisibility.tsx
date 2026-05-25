import { BarChart3, Eye, ShieldCheck } from 'lucide-react'

const items = [
  ['Recent questions', 'See what your child is practicing without interrupting the study session.', Eye],
  ['Weekly reports', 'Review strengths, weak topics, and next actions from the learning history.', BarChart3],
  ['Support records', 'Understand when a teacher was requested and how the request moved forward.', ShieldCheck],
] as const

export function HomeParentVisibility() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      <div className="grid gap-8 rounded-[1.25rem] border border-border/70 bg-[#efeae2] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7e8f7c]">
            Parent visibility
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground">
            Parents get the pattern, not another student dashboard to manage.
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            STOA keeps the student learning path focused while giving parents a calm view of
            progress, recurring weak topics, and teacher-help moments.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1491308056676-205b7c9a7dc1?auto=format&fit=crop&w=1000&q=80"
              alt="Parent and child reviewing schoolwork together"
              className="h-56 w-full object-cover"
            />
          </div>
        </div>
        <div className="grid gap-3">
          {items.map(([title, description, Icon]) => (
            <div key={title} className="rounded-lg border border-border/70 bg-card/82 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
