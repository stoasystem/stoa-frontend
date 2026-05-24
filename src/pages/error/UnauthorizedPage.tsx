import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/layouts/AuthLayout'

export function UnauthorizedPage() {
  return (
    <AuthLayout>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Unauthorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to continue.</p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Go to login</Link>
        </Button>
      </section>
    </AuthLayout>
  )
}
