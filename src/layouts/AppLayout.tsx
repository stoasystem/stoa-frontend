import type { ReactNode } from 'react'
import {
  BarChart3,
  BookOpen,
  CreditCard,
  GraduationCap,
  HelpCircle,
  History,
  LayoutDashboard,
  LibraryBig,
  MessageCircle,
  Route,
  Settings,
  TicketCheck,
  User,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import type { AppNavIcon } from '@/app/router/routeManifest'
import { InternalDebugPanel } from '@/components/internal/InternalDebugPanel'
import { activeNavIndex, shellNavigationFor } from '@/components/shell/shellNavigation'
import { SourceList } from '@/components/shell/SourceList'
import { TopBar } from '@/components/shell/TopBar'
import { SOURCE_LIST_QUERY, WIDE_QUERY, useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import type { AppNavItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const navIcons: Record<AppNavIcon, LucideIcon> = {
  analytics: BarChart3,
  billing: CreditCard,
  chat: MessageCircle,
  classroom: Video,
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

export type AppSurface = 'light' | 'sky'

/*
 * The app shell (#18; #13 points 5 and 6). A 56 top bar with the logo, the
 * bell and the avatar, for every role; no sidebar and no bottom tab bar. A
 * teacher or parent gets their pages as a segmented control, an administrator
 * a source list. Everything the account needs (profile, language, password,
 * help, sign-out) is behind the avatar, at every width.
 *
 * `surface="sky"` paints the page area as the dark sky (the planet, the stage)
 * and scopes the sky tokens to it; the bar stays light, as every board draws it.
 *
 * `bleed` hands the page area to the page whole: no padding, exactly the height
 * under the bar, nothing scrolls. The planet uses it, with Ask beside or over
 * it (#49); the page then paints its own surfaces.
 */
export function AppLayout({
  children,
  surface = 'light',
  bleed = false,
}: {
  children: ReactNode
  surface?: AppSurface
  bleed?: boolean
}) {
  const { t } = useTranslation('common')
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const wide = useMediaQuery(WIDE_QUERY)
  const roomForSourceList = useMediaQuery(SOURCE_LIST_QUERY)
  const homePath = user ? getDefaultRouteForRole(user.role) : '/'
  const navigation = user ? shellNavigationFor(user.role) : ({ kind: 'none' } as const)
  const items: readonly AppNavItem[] = navigation.kind === 'none' ? [] : navigation.items
  const activeIndex = activeNavIndex(items, location.pathname)
  const label = (item: AppNavItem) => t(item.labelKey ?? item.label, { defaultValue: item.label })

  const page = (
    <main
      data-surface={surface === 'sky' ? 'sky' : undefined}
      className={cn(
        'min-w-0 flex-1',
        bleed && 'relative flex min-h-0 flex-col overflow-hidden',
        surface === 'sky' ? 'bg-sky text-on-sky' : 'bg-ground text-ink',
      )}
    >
      {bleed ? (
        children
      ) : (
        /* Placement: page padding 36 top and 48 at the sides; 8 and 16 on a phone. */
        <div className={cn(wide ? 'px-12 pt-9 pb-12' : 'px-4 pt-2 pb-8')}>{children}</div>
      )}
    </main>
  )

  return (
    <div className={cn('flex flex-col bg-ground text-ink', bleed ? 'h-dvh overflow-hidden' : 'min-h-screen')}>
      <TopBar
        homePath={homePath}
        wide={wide}
        signedIn={Boolean(user)}
        segments={
          navigation.kind === 'segmented'
            ? navigation.items.map((item) => ({ to: item.path, label: label(item) }))
            : undefined
        }
        activeIndex={activeIndex}
      />
      {navigation.kind === 'sourceList' ? (
        <div className={cn('flex flex-1', roomForSourceList ? 'flex-row' : 'flex-col')}>
          <SourceList
            wide={roomForSourceList}
            activeIndex={activeIndex}
            items={navigation.items.map((item) => ({ to: item.path, label: label(item), icon: navIcons[item.icon] }))}
          />
          {page}
        </div>
      ) : (
        <div className={cn('flex flex-1', bleed && 'min-h-0')}>{page}</div>
      )}
      <InternalDebugPanel />
    </div>
  )
}
