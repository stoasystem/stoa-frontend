import { LogOut, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export function UserMenu() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  if (!user) return null

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
