import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

function getHref(role?: string | null) {
  if (role === 'student') return '/chat'
  if (role === 'parent') return '/parent'
  if (role === 'tutor') return '/tutor'
  if (role === 'admin') return '/admin'
  return '/login?next=/chat'
}

export function HomeCTASection() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-6">
      <div className="rounded-[1.25rem] bg-[#152238] p-7 text-primary-foreground md:p-10">
        <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c2a15a]">
              Start with one question
            </p>
            <h2 className="editorial-heading mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              Enter the learning platform and ask your{' '}
              <span className="text-[#c2a15a]">first question</span>.
            </h2>
          </div>
          <Button asChild variant="secondary" size="lg" className="premium-button-lift premium-light-button h-12 rounded-full bg-[#f7f3ec] px-7 hover:bg-white">
            <Link to={getHref(isAuthenticated ? user?.role : null)}>
              Start Learning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
