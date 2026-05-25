const notes = [
  ['Swiss school context', 'Designed around everyday homework questions, grade context, and family visibility.'],
  ['Calm progress signals', 'Parents see patterns, weak topics, and teacher-help moments without reading every chat.'],
  ['Built for routines', 'Students can ask quick questions after school, during homework, or before a tutoring session.'],
]

export function HomeTrustSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      <div className="grid gap-8 border-y border-border/70 py-10 lg:grid-cols-[1fr_0.72fr] lg:items-center">
        <div className="grid gap-6 md:grid-cols-3">
          {notes.map(([title, description]) => (
            <div key={title}>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-[1.25rem] border border-border/70 bg-[#152238]">
          <img
            src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1000&q=80"
            alt="Notebook and study materials on a desk"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[linear-gradient(130deg,hsl(217_45%_15%_/_0.72),transparent_62%)]" />
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-white/88 p-4 text-[#152238] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b08a4a]">
              Homework rhythm
            </p>
            <p className="mt-2 text-sm leading-6">
              A focused place for questions, explanations, tutor follow-up, and parent-ready
              learning signals.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
