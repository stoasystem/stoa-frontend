import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { showDemoSurfaces } from '@/lib/env'

export function DemoSurfaceRoute({ children }: { children: ReactNode }) {
  if (!showDemoSurfaces) {
    return <Navigate to="/not-found" replace />
  }

  return children
}
