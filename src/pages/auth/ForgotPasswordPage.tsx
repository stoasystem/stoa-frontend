import { AuthLayout } from '@/layouts/AuthLayout'

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Password reset is not available from this demo screen yet. Contact support if you need account help.
        </p>
      </section>
    </AuthLayout>
  )
}
