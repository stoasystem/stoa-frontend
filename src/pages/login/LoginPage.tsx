import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLayout } from '@/layouts/AuthLayout'

export function LoginPage() {
  return (
    <AuthLayout>
      <section className="mx-auto max-w-md rounded-xl border border-border/70 bg-card/90 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold">Enter STOA</h1>
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
