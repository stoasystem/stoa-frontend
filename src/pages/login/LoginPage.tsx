import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLayout } from '@/layouts/AuthLayout'

export function LoginPage() {
  return (
    <AuthLayout>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with a Phase 6 test account.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </AuthLayout>
  )
}
