import { ExternalLink, LogOut, Mic, MicOff, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, IconButton } from '@/components/base'
import type { ClassroomVoice } from '@/features/classroom/useClassroomVoice'
import { cn } from '@/lib/utils'

/** Where the help request stands, as the bar says it. */
export type ClassroomStatus =
  | { kind: 'waiting' }
  | { kind: 'coming' | 'joined'; teacherName: string }
  | { kind: 'teaching'; studentName: string }
  | { kind: 'ended' }

const DOT: Record<ClassroomStatus['kind'], string> = {
  waiting: 'bg-gold',
  coming: 'bg-gold',
  joined: 'bg-green',
  teaching: 'bg-green',
  ended: 'bg-tertiary',
}

function SpeakingBars({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className="inline-flex h-3.5 items-end gap-[2px]">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className={cn('w-[3px] rounded-full bg-green', on ? 'animate-pulse' : 'opacity-40')}
          style={{ height: on ? [8, 14, 10][bar] : 4, animationDelay: `${bar * 120}ms` }}
        />
      ))}
    </span>
  )
}

/**
 * The bar over the classroom (#696; the stage and its control bar after
 * OpenMAIC): where the request stands, the voice -- whoever else is in it and
 * whether they are speaking, and the microphone -- the sidebar, and leaving.
 */
export function ClassroomTopBar({
  status,
  voice,
  whiteboardUrl,
  sidebarOpen,
  onToggleSidebar,
  leaveTo,
}: {
  status: ClassroomStatus
  voice: ClassroomVoice
  whiteboardUrl?: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  leaveTo: string
}) {
  const { t } = useTranslation('chat')
  const statusText =
    status.kind === 'waiting'
      ? t('classroom.status.waiting')
      : status.kind === 'coming'
        ? t('classroom.status.coming', { name: status.teacherName })
        : status.kind === 'joined'
          ? t('classroom.status.joined', { name: status.teacherName })
          : status.kind === 'teaching'
            ? t('classroom.status.teaching', { name: status.studentName })
            : t('classroom.status.ended')

  const voiceText =
    voice.status === 'connecting'
      ? t('classroom.voice.connecting')
      : voice.status === 'failed'
        ? t('classroom.voice.failed')
        : voice.status === 'micDenied'
          ? t('classroom.voice.micDenied')
          : voice.remoteName
            ? voice.remoteSpeaking
              ? t('classroom.voice.speaking', { name: voice.remoteName })
              : t('classroom.voice.inRoom', { name: voice.remoteName })
            : voice.status === 'connected'
              ? t('classroom.voice.alone')
              : null

  const micUsable = voice.status === 'connected'
  return (
    <header
      data-classroom-bar
      className="flex h-14 shrink-0 items-center gap-3 border-b border-separator bg-surface px-4 text-ink"
    >
      <div className="flex max-w-[50%] shrink-0 items-center gap-2" role="status" aria-live="polite" data-classroom-status={status.kind}>
        <span aria-hidden="true" className={cn('h-2.5 w-2.5 shrink-0 rounded-full', DOT[status.kind], status.kind === 'waiting' && 'animate-pulse')} />
        <p className="truncate text-[15px] font-semibold">{statusText}</p>
      </div>

      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
        {voiceText && (
          <span
            role="status"
            data-classroom-voice={voice.status}
            data-remote-speaking={voice.remoteSpeaking ? 'true' : 'false'}
            title={voiceText}
            className={cn(
              'hidden min-w-0 items-center gap-2 truncate text-[13px] md:inline-flex',
              voice.status === 'micDenied' || voice.status === 'failed' ? 'text-red' : 'text-caption',
            )}
          >
            {voice.remoteName && micUsable && <SpeakingBars on={voice.remoteSpeaking} />}
            <span className="truncate">{voiceText}</span>
          </span>
        )}
        <IconButton
          label={voice.micOn && micUsable ? t('classroom.mic.mute') : t('classroom.mic.unmute')}
          icon={voice.micOn && micUsable ? Mic : MicOff}
          variant={voice.micOn && micUsable ? 'tinted' : 'gray'}
          aria-pressed={voice.micOn && micUsable}
          disabled={!micUsable}
          onClick={voice.toggleMic}
          data-classroom-mic={voice.micOn ? 'on' : 'off'}
        />
        {whiteboardUrl && (
          <IconButton
            label={t('classroom.board.openInTab')}
            icon={ExternalLink}
            variant="gray"
            onClick={() => window.open(whiteboardUrl, '_blank', 'noopener,noreferrer')}
          />
        )}
        <IconButton
          label={sidebarOpen ? t('classroom.sidebar.hide') : t('classroom.sidebar.show')}
          icon={sidebarOpen ? PanelRightClose : PanelRightOpen}
          variant="gray"
          aria-expanded={sidebarOpen}
          onClick={onToggleSidebar}
          data-classroom-sidebar-toggle
        />
        <Button asChild variant="gray" size="small">
          <Link to={leaveTo} data-classroom-leave>
            <LogOut size={16} aria-hidden="true" />
            {t('classroom.leave')}
          </Link>
        </Button>
      </div>
    </header>
  )
}
