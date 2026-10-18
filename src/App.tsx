import { installChunkReload } from '@/app/chunkReload'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary'

// Before any page's module is requested, so the first failure is heard too.
installChunkReload()

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </AppErrorBoundary>
  )
}
