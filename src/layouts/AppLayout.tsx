import type { ReactNode } from 'react'
import {
  BarChart3,
  BookOpen,
  LibraryBig,
  CreditCard,
  GraduationCap,
  HelpCircle,
  History,
  Home,
  LayoutDashboard,
  MessageCircle,
  Route,
  Settings,
  TicketCheck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
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
  practice: Route,
  questionBank: LibraryBig,
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
  'Ask a question': 'navigation.chat',
  Billing: 'navigation.billing',
  Chat: 'navigation.chat',
  Contact: 'navigation.contact',
  Dashboard: 'navigation.dashboard',
  'Help Requests': 'navigation.helpRequests',
  'Learning Activity': 'navigation.learningActivity',
  'Learning History': 'navigation.learningHistory',
  Overview: 'navigation.overview',
  Profile: 'navigation.profile',
  Practice: 'navigation.practice',
  'Question Bank': 'navigation.questionBank',
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

function NavItemLink({
  item,
  items,
  compact = false,
}: {
  item: AppNavItem
  items: AppNavItem[]
  compact?: boolean
}) {
  const Icon = navIcons[item.icon]
  const { t } = useTranslation('common')
  const location = useLocation()
  const label = t(navLabelKeys[item.label] ?? item.label, { defaultValue: item.label })
  const active = isActiveNavItem(item, items, location.pathname)

  return (
    <NavLink
      className={() =>
        cn(
          'flex items-center gap-2 rounded-md text-sm font-medium transition-colors',
          compact ? 'min-w-0 flex-1 justify-center px-2 py-2 text-xs' : 'px-2 py-1.5',
          active
            ? 'platform-nav-active shadow-sm'
            : 'text-muted-foreground hover:bg-[hsl(var(--stoa-brand-burgundy-soft))] hover:text-foreground',
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

function TopNavItemLink({ item, items }: { item: AppNavItem; items: AppNavItem[] }) {
  const { t } = useTranslation('common')
  const location = useLocation()
  const label = t(navLabelKeys[item.label] ?? item.label, { defaultValue: item.label })
  const active = isActiveNavItem(item, items, location.pathname)

  return (
    <NavLink
      className={() =>
        cn(
          'inline-flex min-h-9 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition-colors',
          active
            ? 'platform-nav-active shadow-sm'
            : 'text-muted-foreground hover:bg-[hsl(var(--stoa-brand-burgundy-soft))] hover:text-foreground',
        )
      }
      end={item.path === '/'}
      to={item.path}
    >
      {label}
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
    <div className="platform-app-shell min-h-screen text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r bg-card/85 p-4 shadow-[8px_0_30px_rgba(33,33,33,0.04)] md:flex">
          <Link to="/" className="font-semibold">
            <AppLogo />
          </Link>
          <nav aria-label="Primary" className="mt-6 flex flex-1 flex-col gap-2">
            {primaryItems.map((item) => (
              <NavItemLink item={item} items={primaryItems} key={`${item.path}-${item.label}`} />
            ))}
            {secondaryItems.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="brand-section-kicker mb-2 px-2">
                  {t('navigation.more')}
                </p>
                <div className="flex flex-col gap-2">
                  {secondaryItems.map((item) => (
                    <NavItemLink item={item} items={items} key={`${item.path}-${item.label}`} />
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
          <UserMenu />
        </aside>
        <main className="min-w-0 flex-1 pb-24">
          <header className="sticky top-0 z-30 border-b bg-[hsl(var(--platform-surface-app)_/_0.94)] px-4 py-3 shadow-[0_10px_30px_hsl(var(--stoa-brand-charcoal)_/_0.04)] backdrop-blur md:px-6">
            <div className="flex min-h-11 items-center gap-3">
              <Link
                to="/"
                className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-border/80 bg-card/60 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-[hsl(var(--stoa-brand-burgundy-soft))]"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                {t('navigation.home')}
              </Link>
              <nav
                aria-label="App top navigation"
                className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex"
              >
                {primaryItems.map((item) => (
                  <TopNavItemLink item={item} items={primaryItems} key={`${item.path}-${item.label}-top`} />
                ))}
              </nav>
              <div className="ml-auto flex shrink-0 items-center gap-3">
                <LanguageSwitcher compact />
                <div className="hidden sm:block">
                  <UserMenu variant="top" />
                </div>
              </div>
            </div>
          </header>
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
      {mobileItems.length > 0 && (
        <nav
          aria-label="Mobile primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-2 py-2 shadow-lg backdrop-blur md:hidden"
        >
          <div className="mx-auto flex max-w-md gap-1">
            {mobileItems.map((item) => (
              <NavItemLink compact item={item} items={mobileItems} key={`${item.path}-${item.label}-mobile`} />
            ))}
          </div>
        </nav>
      )}
      <InternalDebugPanel />
    </div>
  )
}

function isActiveNavItem(item: AppNavItem, items: AppNavItem[], pathname: string) {
  if (pathname === item.path) return true
  if (!pathname.startsWith(`${item.path}/`)) return false

  return !items.some(
    (candidate) =>
      candidate.path !== item.path &&
      candidate.path.startsWith(`${item.path}/`) &&
      (pathname === candidate.path || pathname.startsWith(`${candidate.path}/`)),
  )
}
