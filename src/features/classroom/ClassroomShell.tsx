import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels'
import { Button } from '@/components/base'
import { ClassroomTopBar, type ClassroomStatus } from '@/features/classroom/ClassroomTopBar'
import type { ClassroomPassState } from '@/features/classroom/useClassroomPass'
import { useClassroomVoice } from '@/features/classroom/useClassroomVoice'
import { Whiteboard } from '@/features/classroom/Whiteboard'

/** The sidebar's width as it opens, and its narrowest, in pixels. */
export const CLASSROOM_SIDEBAR = { width: 400, min: 300, max: '55%' } as const

/**
 * Said in place of the classroom when there is none to enter: not set up yet
 * (503 `classroom_unavailable`), the request over, or a failure -- with the
 * way back to the conversation, which goes on as it was (#696).
 */
function ClassroomUnavailable({ kind, backTo }: { kind: 'unavailable' | 'refused' | 'failed'; backTo: string }) {
  const { t } = useTranslation('chat')
  return (
    <main className="flex min-h-dvh items-center justify-center bg-fill p-6">
      <section
        role="alert"
        data-classroom-unavailable={kind}
        className="flex max-w-[440px] flex-col items-start gap-3 rounded-[16px] border border-[color:var(--card-border)] bg-surface p-6"
      >
        <h1 className="text-[20px] font-semibold text-ink">
          {kind === 'refused' ? t('classroom.refused.title') : t('classroom.unavailable.title')}
        </h1>
        <p className="text-[15px] leading-[1.45] text-caption">
          {kind === 'refused' ? t('classroom.refused.body') : t('classroom.unavailable.body')}
        </p>
        <Button asChild variant="filled">
          <Link to={backTo}>{t('classroom.unavailable.back')}</Link>
        </Button>
      </section>
    </main>
  )
}

/**
 * The classroom of one help request (#696; the stage-and-sidebar layout after
 * OpenMAIC): the bar on top, the shared whiteboard filling the stage, and the
 * conversation in a sidebar beside it, resizable and collapsible -- collapsed,
 * the board has the whole width. Desktop and tablet only.
 */
export function ClassroomShell({
  pass,
  status,
  sidebar,
  sidebarLabel,
  backTo,
}: {
  pass: ClassroomPassState
  status: ClassroomStatus
  sidebar: (controls: { collapse: () => void }) => ReactNode
  sidebarLabel: string
  /** The conversation this classroom is about: where leaving, or a classroom that cannot open, goes. */
  backTo: string
}) {
  const { t } = useTranslation('chat')
  const ready = pass.kind === 'ready' ? pass.pass : undefined
  const voice = useClassroomVoice(ready?.voice)
  const sidebarRef = usePanelRef()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const collapse = useCallback(() => sidebarRef.current?.collapse(), [sidebarRef])
  const toggle = useCallback(() => {
    const panel = sidebarRef.current
    if (!panel) return
    if (panel.isCollapsed()) panel.expand()
    else panel.collapse()
  }, [sidebarRef])

  if (pass.kind === 'unavailable' || pass.kind === 'refused' || pass.kind === 'failed') {
    return <ClassroomUnavailable kind={pass.kind} backTo={backTo} />
  }

  return (
    <div data-classroom className="flex h-dvh flex-col overflow-hidden bg-fill">
      <ClassroomTopBar
        status={status}
        voice={voice}
        whiteboardUrl={ready?.whiteboardUrl}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggle}
        leaveTo={backTo}
      />
      <Group orientation="horizontal" className="min-h-0 flex-1">
        <Panel id="board" minSize="40%">
          <main className="h-full" aria-label={t('classroom.board.title')}>
            {ready ? (
              <Whiteboard url={ready.whiteboardUrl} backTo={backTo} />
            ) : (
              <p role="status" className="flex h-full items-center justify-center text-[14px] text-caption">
                {t('classroom.entering')}
              </p>
            )}
          </main>
        </Panel>
        <Separator
          className="w-1.5 bg-separator transition-colors hover:bg-accent-tint data-[separator=active]:bg-accent-tint"
          aria-label={t('classroom.sidebar.resize')}
        />
        <Panel
          id="sidebar"
          panelRef={sidebarRef}
          collapsible
          collapsedSize={0}
          defaultSize={CLASSROOM_SIDEBAR.width}
          minSize={CLASSROOM_SIDEBAR.min}
          maxSize={CLASSROOM_SIDEBAR.max}
          onResize={(size) => setSidebarOpen(size.inPixels > 0)}
        >
          <aside aria-label={sidebarLabel} data-classroom-sidebar className="h-full min-w-0 overflow-hidden" hidden={!sidebarOpen}>
            {sidebar({ collapse })}
          </aside>
        </Panel>
      </Group>
    </div>
  )
}
