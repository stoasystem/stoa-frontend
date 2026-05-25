import type { ReactNode } from 'react'
import {
  BarChart3,
  BookOpen,
  CreditCard,
  GraduationCap,
  HelpCircle,
  History,
  LayoutDashboard,
  MessageCircle,
  Settings,
  TicketCheck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLogo } from '@/components/common/AppLogo'
import { FeedbackButton } from '@/components/feedback/FeedbackButton'
import { InternalDebugPanel } from '@/components/internal/InternalDebugPanel'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { UserMenu } from '@/components/common/UserMenu'
import type { AppNavIcon, AppNavItem } from '@/app/router/routeConfig'
import { enableFeedback } from '@/lib/env'
import { cn } from '@/lib/utils'
import { getNavItemsForUserRole } from '@/lib/navigation'
import { useAuthStore } from '@/store/authStore'

const navIcons: Record<AppNavIcon, LucideIcon> = {
  analytics: BarChart3,
  billing: CreditCard,
  chat: MessageCircle,
  dashboard: LayoutDashboard,
  history: History,
  profile: User,
  reports: BookOpen,
  requests: TicketCheck,
  settings: Settings,
  students: Users,
  support: HelpCircle,
  tutors: GraduationCap,
}

const navLabelKeys: Record<string, string> = {
  'Advanced Analytics': 'navigation.analytics',
  Analytics: 'navigation.analytics',
  Availability: 'navigation.availability',
  Billing: 'navigation.billing',
  Chat: 'navigation.chat',
  Dashboard: 'navigation.dashboard',
  'Help Requests': 'navigation.helpRequests',
  'Learning Activity': 'navigation.learningActivity',
  'Learning History': 'navigation.learningHistory',
  Overview: 'navigation.overview',
  Profile: 'navigation.profile',
  Referrals: 'navigation.referrals',
  Reports: 'navigation.reports',
  Requests: 'navigation.requests',
  Retention: 'navigation.analytics',
  Students: 'navigation.users',
  Support: 'navigation.support',
  'Support Inbox': 'navigation.supportInbox',
  Tutors: 'navigation.tutors',
  Users: 'navigation.users',
}

function NavItemLink({ item, compact = false }: { item: AppNavItem; compact?: boolean }) {
  const Icon = navIcons[item.icon]
  const { t } = useTranslation('common')
  const label = t(navLabelKeys[item.label] ?? item.label, { defaultValue: item.label })

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md text-sm font-medium transition-colors',
          compact ? 'min-w-0 flex-1 justify-center px-2 py-2 text-xs' : 'px-2 py-1.5',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )
      }
      end={item.path === '/'}
      to={item.path}
    >
      <Icon aria-hidden="true" className={compact ? 'h-4 w-4 shrink-0' : 'h-4 w-4'} />
      <span className={compact ? 'truncate' : undefined}>{label}</span>
    </NavLink>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  const user = useAuthStore((state) => state.user)
  const items = user ? getNavItemsForUserRole(user.role, { includeSecondary: true }) : []
  const primaryItems = items.filter((item) => item.priority === 'primary')
  const secondaryItems = items.filter((item) => item.priority === 'secondary')
  const mobileItems = user ? getNavItemsForUserRole(user.role, { mobileOnly: true }).slice(0, 5) : []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r bg-background/90 p-4 md:flex">
          <Link to="/" className="font-semibold tracking-tight">
            <AppLogo />
          </Link>
          <nav aria-label="Primary" className="mt-6 flex flex-1 flex-col gap-2">
            {primaryItems.map((item) => (
              <NavItemLink item={item} key={`${item.path}-${item.label}`} />
            ))}
            {secondaryItems.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 px-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  {t('navigation.more')}
                </p>
                <div className="flex flex-col gap-2">
                  {secondaryItems.map((item) => (
                    <NavItemLink item={item} key={`${item.path}-${item.label}`} />
                  ))}
                </div>
              </div>
            )}
          </nav>
          {enableFeedback && (
            <div className="mb-3">
              <FeedbackButton />
            </div>
          )}
          <div className="mb-3">
            <LanguageSwitcher compact />
          </div>
          <div className="mb-3 flex gap-3 text-xs text-muted-foreground">
            <Link className="hover:text-foreground" to="/privacy">
              {t('navigation.privacy')}
            </Link>
            <Link className="hover:text-foreground" to="/terms">
              {t('navigation.terms')}
            </Link>
          </div>
          <UserMenu />
        </aside>
        <main className="min-w-0 flex-1 p-4 pb-24 md:p-6">{children}</main>
      </div>
      {mobileItems.length > 0 && (
        <nav
          aria-label="Mobile primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 py-2 shadow-lg backdrop-blur md:hidden"
        >
          <div className="mx-auto flex max-w-md gap-1">
            {mobileItems.map((item) => (
              <NavItemLink compact item={item} key={`${item.path}-${item.label}-mobile`} />
            ))}
          </div>
        </nav>
      )}
      <InternalDebugPanel />
    </div>
  )
}
