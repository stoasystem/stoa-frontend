const notes = [
  ['Swiss school context', 'Designed around everyday homework questions, grade context, and family visibility.'],
  ['Demo-ready today', 'Fixed demo accounts, resettable data, billing mock, support, referrals, and admin overview are available.'],
  ['Backend-ready later', 'Frontend depends on API contracts so the demo backend can be replaced by the real backend.'],
]

export function HomeTrustSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      <div className="border-y border-border/70 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          {notes.map(([title, description]) => (
            <div key={title}>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
