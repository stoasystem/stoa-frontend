import { AuthLayout } from '@/layouts/AuthLayout'

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Password reset is intentionally deferred beyond Phase 6.
        </p>
      </section>
    </AuthLayout>
  )
}
