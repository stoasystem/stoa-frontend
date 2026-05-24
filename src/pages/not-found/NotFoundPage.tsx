import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MarketingLayout } from '@/layouts/MarketingLayout'

export function NotFoundPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The route you opened does not exist yet.</p>
        <Button asChild className="mt-6">
          <Link to="/">Return home</Link>
        </Button>
      </section>
    </MarketingLayout>
  )
}
