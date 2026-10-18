import { ErrorBoundary } from 'react-error-boundary'
import type { ErrorInfo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { retryFailedPageLoads } from '@/app/router/lazyPage'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/layouts/AppLayout'
import { reportFrontendError } from '@/services/monitoring'

/*
 * "Try again" renders the failed part afresh, and a page whose module failed
 * to load loads it again (#272). "Reload page" is there for whatever a fresh
 * render cannot fix.
 */
function Recovery({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('common')
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Button onClick={onRetry}>{t('actions.tryAgain')}</Button>
      <Button variant="plain" onClick={() => window.location.reload()}>
        {t('errorBoundary.reload')}
      </Button>
    </div>
  )
}

function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-xl font-semibold">{t('errorBoundary.title')}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('errorBoundary.body')}
        </p>
        <Recovery onRetry={resetErrorBoundary} />
      </div>
    </div>
  )
}

// Both boundaries report as the one source the monitoring endpoint knows; the
// report carries the route, which tells a page's failure apart.
function handleError(error: unknown, info: ErrorInfo) {
  const normalizedError = error instanceof Error ? error : new Error('Unknown application error')

  void reportFrontendError(normalizedError, {
    componentStack: info.componentStack,
    source: 'app-error-boundary',
  })
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={retryFailedPageLoads}
    >
      {children}
    </ErrorBoundary>
  )
}

/*
 * The page's part of the screen, when the page failed. It stands in the app
 * shell, so the top bar, the navigation and the account menu still work and
 * the reader can go somewhere else.
 */
function PageErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  const { t } = useTranslation('common')

  return (
    <AppLayout>
      <div role="alert" className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">{t('errorBoundary.pageTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-caption">{t('errorBoundary.pageBody')}</p>
        <Recovery onRetry={resetErrorBoundary} />
      </div>
    </AppLayout>
  )
}

/**
 * One page's error boundary (#272). Before this, the only boundary sat above
 * the router, so one page failing to render replaced the whole application.
 *
 * It sits inside the route guards, so a guard's redirect is never caught
 * here, and it starts over when the reader goes to another address.
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <ErrorBoundary
      FallbackComponent={PageErrorFallback}
      onError={handleError}
      onReset={retryFailedPageLoads}
      resetKeys={[pathname]}
    >
      {children}
    </ErrorBoundary>
  )
}
