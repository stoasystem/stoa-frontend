import { AuthLayout } from '@/layouts/AuthLayout'

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="editorial-heading editorial-title-shell text-4xl font-semibold leading-tight">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Password reset is not available from this page yet. Contact support if you need account help.
        </p>
      </section>
    </AuthLayout>
  )
}
