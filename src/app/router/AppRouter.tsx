import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { AppRoutes } from '@/app/router/AppRoutes'
import { AuthBootstrap } from '@/app/router/AuthBootstrap'
import { RoleSwitcher } from '@/components/dev/RoleSwitcher'

// Routes, guards and navigation are all generated from `routeManifest.ts`;
// add or change a route there, not here.
export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <RoleSwitcher />
      {/* Every page is loaded on demand, so one boundary covers them all. */}
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  )
}
