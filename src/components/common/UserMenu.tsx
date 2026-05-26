import { LogOut, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export function UserMenu({ variant = 'sidebar' }: { variant?: 'sidebar' | 'top' }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  if (!user) return null

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
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label="Log out"
          onClick={() => {
            clearAuth()
            navigate('/login')
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 border-t pt-4">
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
        aria-label="Log out"
        onClick={() => {
          clearAuth()
          navigate('/login')
        }}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
