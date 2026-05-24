import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppLogo } from '@/components/common/AppLogo'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center text-lg font-semibold tracking-tight">
          <AppLogo />
        </Link>
        {children}
      </div>
    </div>
  )
}
