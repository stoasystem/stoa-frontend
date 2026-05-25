import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthLayout } from '@/layouts/AuthLayout'

export function RegisterPage() {
  return (
    <AuthLayout>
      <section className="rounded-xl border border-border/70 bg-card/90 p-6 shadow-xl md:p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
            Create your STOA account
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground">
            Set up the right learning path before the first question.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Students, parents, and tutors each get a different demo onboarding path. Admin
            accounts are not created publicly.
          </p>
        </div>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </section>
    </AuthLayout>
  )
}
