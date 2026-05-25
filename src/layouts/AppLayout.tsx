import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppLogo } from '@/components/common/AppLogo'
import { FeedbackButton } from '@/components/feedback/FeedbackButton'
import { UserMenu } from '@/components/common/UserMenu'
import { enableFeedback } from '@/lib/env'
import { useAuthStore } from '@/store/authStore'

const roleNavigation = {
  student: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Chat', to: '/chat' },
    { label: 'Learning History', to: '/learning-history' },
    { label: 'Profile', to: '/profile' },
    { label: 'Onboarding', to: '/onboarding' },
    { label: 'Support', to: '/support' },
  ],
  parent: [
    { label: 'Parent Dashboard', to: '/parent' },
    { label: 'Children', to: '/parent' },
    { label: 'Onboarding', to: '/onboarding' },
    { label: 'Support', to: '/support' },
  ],
  tutor: [
    { label: 'Tutor Dashboard', to: '/tutor' },
    { label: 'Help Requests', to: '/tutor' },
    { label: 'Onboarding', to: '/onboarding' },
    { label: 'Support', to: '/support' },
  ],
  admin: [
    { label: 'Admin Dashboard', to: '/admin' },
    { label: 'Onboarding', to: '/onboarding' },
    { label: 'Support', to: '/support' },
  ],
}

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const items = user ? roleNavigation[user.role] : []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r bg-background/90 p-4 md:flex">
          <Link to="/" className="font-semibold tracking-tight">
            <AppLogo />
          </Link>
          <nav className="mt-6 flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
            {items.map((item) => (
              <Link
                key={`${item.to}-${item.label}`}
                className="rounded-md px-2 py-1.5 hover:bg-secondary hover:text-foreground"
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {enableFeedback && (
            <div className="mb-3">
              <FeedbackButton />
            </div>
          )}
          <UserMenu />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
