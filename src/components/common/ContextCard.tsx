import type { ReactNode } from 'react'

type ContextCardItem = {
  label: string
  value: ReactNode
}

export function ContextCard({
  eyebrow = 'Context',
  title,
  description,
  items,
}: {
  eyebrow?: string
  title: string
  description?: string
  items?: ContextCardItem[]
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-[var(--platform-shadow-soft)]">
      <p className="brand-section-kicker">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-semibold">{title}</h2>
      {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
      {items && items.length > 0 && (
        <dl className="mt-4 grid gap-3 text-sm">
          {items.map((item) => (
            <div key={item.label} className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 font-medium text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
