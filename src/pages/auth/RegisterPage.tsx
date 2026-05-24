import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthLayout } from '@/layouts/AuthLayout'

export function RegisterPage() {
  return (
    <AuthLayout>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create a local Phase 6 test account.</p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </section>
    </AuthLayout>
  )
}
