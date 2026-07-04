import { MarketingLayout } from '@/layouts/MarketingLayout'

export function HomeV2Page() {
  return (
    <MarketingLayout>
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-5 py-20 sm:px-6">
        <p className="stoa-type-label text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--stoa-brand-burgundy))]">
          Home V2 preview
        </p>
        <h1 className="stoa-type-display mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
          STOA learning support for Swiss families.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          This isolated preview route will host the new Swiss-parent homepage skeleton before any current homepage switch-over.
        </p>
      </section>
    </MarketingLayout>
  )
}
