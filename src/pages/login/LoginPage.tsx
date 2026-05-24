import { AuthLayout } from '@/layouts/AuthLayout'

export function LoginPage() {
  return (
    <AuthLayout>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Authentication placeholder for a later milestone.</p>
      </section>
    </AuthLayout>
  )
}
