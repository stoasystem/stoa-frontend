import { MarketingLayout } from '@/layouts/MarketingLayout'

export function HomePage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground">
          STOA Learning Platform
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          AI-assisted learning with human teacher support.
        </p>
      </section>
    </MarketingLayout>
  )
}
