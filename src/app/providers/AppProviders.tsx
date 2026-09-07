import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import { queryClient } from '@/app/query/queryClient'
import { captureAttributionFromUrl } from '@/lib/utm'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const { i18n } = useTranslation()

  useEffect(() => {
    captureAttributionFromUrl()
  }, [])

  /**
   * Refetch server-rendered content when the reader changes language.
   *
   * Requests carry `Accept-Language`, so curriculum titles, question history
   * and assistant answers come back in the language the app is being read in.
   * Cached responses are in the previous one, and this is the single place
   * that retires them.
   *
   * `invalidateQueries` rather than `removeQueries` or a language-keyed cache
   * key: the content already on screen stays while the refetch runs, so the
   * switch reads as the text updating rather than the whole page reloading
   * behind skeletons.
   */
  useEffect(() => {
    function handleLanguageChanged() {
      void queryClient.invalidateQueries()
    }

    i18n.on('languageChanged', handleLanguageChanged)
    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [i18n])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  )
}
