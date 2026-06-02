import type { ReactNode } from 'react'

export function NextStepCard({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-[var(--platform-shadow-soft)]">
      <p className="brand-section-kicker">Recommended next step</p>
      <h3 className="mt-2 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-4">{action}</div>
    </article>
  )
}
