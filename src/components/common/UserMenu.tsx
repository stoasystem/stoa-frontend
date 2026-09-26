import { KeyRound, LogOut, UserCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Button } from '@/components/ui/button'
// The self-service password change gets its entry here rather than in `navItems`:
// that model filters by exact role and has no shared bucket, so one entry beside
// the account identity reaches every role without four duplicated copies and
// without competing for the five slots in the mobile bar.
import { CHANGE_PASSWORD_PATH } from '@/lib/authRoutes'
import { logout } from '@/services/auth/authApi'
import { logger } from '@/services/logging/logger'
import { useAuthStore } from '@/store/authStore'


export function UserMenu({ variant = 'sidebar' }: { variant?: 'sidebar' | 'top' }) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  if (!user) return null

  // The backend is told first, so the token it revokes is still the one in
  // hand. A failed call must not keep anyone signed in on this device.
  const signOut = async () => {
    try {
      await logout()
    } catch (error) {
      logger.warn('Backend logout failed; signing out locally', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
    }
    clearAuth()
    navigate('/login')
  }

  if (variant === 'top') {
    return (
      <div
        className="flex items-center gap-1 rounded-full border bg-card/70 px-1.5 py-1"
        aria-label={`${user.name} account`}
      >
        <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="max-w-32 truncate px-1 text-sm font-medium text-foreground">
          {user.name}
        </span>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label={t('actions.changePassword')}
        >
          <Link to={CHANGE_PASSWORD_PATH}>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label={t('actions.logOut')}
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <UserCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <RoleBadge role={user.role} />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('actions.logOut')}
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 px-2 text-muted-foreground"
      >
        <Link to={CHANGE_PASSWORD_PATH}>
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {t('actions.changePassword')}
        </Link>
      </Button>
    </div>
  )
}
