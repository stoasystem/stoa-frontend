import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/base'

/** Not loaded by then, the board counts as failed. */
export const WHITEBOARD_LOAD_TIMEOUT_MS = 20_000

/**
 * The shared whiteboard (#696): the board the backend's address opens, its
 * token in the query string, in a frame filling the stage.
 *
 * A frame the board's server refuses to be shown in still says it loaded, so
 * the board can always be opened in a tab of its own as well, from here once
 * it failed and from the bar above it.
 */
export function Whiteboard({ url, backTo }: { url: string; backTo: string }) {
  const { t } = useTranslation('chat')
  const [state, setState] = useState<{ url: string; loaded: boolean; failed: boolean }>({ url, loaded: false, failed: false })
  if (state.url !== url) setState({ url, loaded: false, failed: false })

  useEffect(() => {
    if (state.loaded || state.failed) return
    const timer = window.setTimeout(
      () => setState((current) => (current.url === url && !current.loaded ? { ...current, failed: true } : current)),
      WHITEBOARD_LOAD_TIMEOUT_MS,
    )
    return () => window.clearTimeout(timer)
  }, [state.failed, state.loaded, url])

  if (state.failed) {
    return (
      <div role="alert" data-whiteboard="failed" className="flex h-full items-center justify-center bg-fill p-6">
        <div className="flex max-w-[420px] flex-col items-start gap-3 rounded-[14px] border border-[color:var(--card-border)] bg-surface p-5">
          <h2 className="text-[17px] font-semibold text-ink">{t('classroom.board.failedTitle')}</h2>
          <p className="text-[14px] leading-[1.45] text-caption">{t('classroom.board.failedBody')}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="tinted" size="small">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} aria-hidden="true" />
                {t('classroom.board.openInTab')}
              </a>
            </Button>
            <Button asChild variant="plain" size="small">
              <Link to={backTo}>{t('classroom.unavailable.back')}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full bg-white" data-whiteboard={state.loaded ? 'loaded' : 'loading'}>
      {!state.loaded && (
        <p role="status" className="absolute inset-0 flex items-center justify-center text-[14px] text-caption">
          {t('classroom.board.loading')}
        </p>
      )}
      <iframe
        key={url}
        src={url}
        title={t('classroom.board.title')}
        allow="clipboard-read; clipboard-write; fullscreen"
        referrerPolicy="no-referrer"
        onLoad={() => setState((current) => (current.url === url ? { ...current, loaded: true } : current))}
        className="relative block h-full w-full border-0"
      />
    </div>
  )
}
