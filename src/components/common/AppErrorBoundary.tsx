import { ErrorBoundary } from 'react-error-boundary'
import type { ErrorInfo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { reportFrontendError } from '@/services/monitoring'

function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">{t('errorBoundary.title')}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('errorBoundary.body')}
        </p>
        <Button className="mt-4" onClick={resetErrorBoundary}>
          {t('actions.tryAgain')}
        </Button>
      </div>
    </div>
  )
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  function handleError(error: unknown, info: ErrorInfo) {
    const normalizedError = error instanceof Error ? error : new Error('Unknown application error')

    void reportFrontendError(normalizedError, {
      componentStack: info.componentStack,
      source: 'app-error-boundary',
    })
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}
