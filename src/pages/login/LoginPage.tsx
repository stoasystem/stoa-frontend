import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLayout } from '@/layouts/AuthLayout'

export function LoginPage() {
  return (
    <AuthLayout>
      <section className="mx-auto max-w-md rounded-xl border border-border/70 bg-card/90 p-6 shadow-xl">
        <h1 className="editorial-heading editorial-title-shell text-4xl font-semibold leading-tight">
          Enter <span className="editorial-accent">STOA</span>
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to continue to chat, parent reports, tutor requests, or admin operations.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </AuthLayout>
  )
}
