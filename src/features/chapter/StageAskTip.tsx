/*
 * The first time on the practice stage (#586, docs/research/user-onboarding-design.md
 * section 5, progressive disclosure): Murmi points at Ask beside the exercise
 * once -- stuck, ask here; a photo of your working or a homework problem works
 * too -- and Ask's way to add a photo is highlighted with it.
 *
 * Who is new to Ask is read from the server alone: a student with no Ask
 * conversation at all -- one started from a "Find my own star" example counts
 * too. Nothing says "seen" anywhere; waved
 * away -- "Got it" or Escape -- it stays away in this tab only, as the first
 * landing does. Never during a quiz, where Ask is off.
 *
 * Not a modal: it takes no focus, the exercise stays usable, and what it says
 * is read out once (`role="status"`). It fades in; nothing moves with reduced
 * motion (`askGuide.css`).
 */
import { useCallback, useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import { dismissStageTip, stageTipDismissed } from '@/features/ask/askGuide'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import '@/features/ask/askGuide.css'

export type StageAskTip = {
  /** Whether Murmi points at Ask now. */
  shown: boolean
  dismiss: () => void
}

/** Whether the tip is due: Ask on, no Ask conversation on the server, not waved away in this tab. */
export function useStageAskTip(off: boolean): StageAskTip {
  const ownerId = useAuthStore((state) => state.user?.id ?? null)
  const conversations = useConversationsQuery()
  const [dismissed, setDismissed] = useState(() => ownerId === null || stageTipDismissed(ownerId))
  const newToAsk = conversations.isSuccess && conversations.data.items.length === 0
  const dismiss = useCallback(() => {
    if (ownerId) dismissStageTip(ownerId)
    setDismissed(true)
  }, [ownerId])
  return { shown: !off && !dismissed && newToAsk, dismiss }
}

/**
 * What Murmi says, read out once as it arrives: a live region that is always
 * there, so the words arriving in it are announced.
 */
export function StageAskTipStatus({ shown }: { shown: boolean }) {
  const { t } = useTranslation('chat')
  return (
    <p role="status" data-stage-ask-tip-status className="sr-only">
      {shown ? `${t('ask.stageTip.title')} ${t('ask.stageTip.body')}` : ''}
    </p>
  )
}

/**
 * Murmi's line. `beside`: the panel is open beside the stage, and the tip
 * stands in it, just above its composer; otherwise it sits over the docked
 * composer, in the flow.
 */
export function StageAskTipBubble({ beside, onDismiss }: { beside: boolean; onDismiss: () => void }) {
  const { t } = useTranslation('chat')
  const titleId = useId()

  // Escape waves Murmi away wherever focus is -- the tip does not take it -- and only Murmi:
  // Ask's own Escape waits for the next press. Not while a dialog (Ask's sheet) is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      event.stopPropagation()
      onDismiss()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onDismiss])

  return (
    <aside
      data-stage-ask-tip={beside ? 'beside' : 'docked'}
      data-ask-guide-in
      aria-labelledby={titleId}
      className={cn(
        'z-10 space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky',
        // Over the panel's own composer (its way to add a photo on the left), clear of the exercise.
        beside ? 'absolute inset-x-[14px] bottom-[76px]' : 'w-full',
      )}
      style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
    >
      <div className="flex items-center gap-2">
        <Murmi mood="watching" size={32} />
        <h2 id={titleId} className="m-0 min-w-0 flex-1 text-[15px] font-semibold text-[color:var(--on-sky-text)]">
          {t('ask.stageTip.title')}
        </h2>
      </div>
      <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{t('ask.stageTip.body')}</p>
      <div className="flex justify-end">
        <Button variant="onSkyPlain" size="small" onClick={onDismiss}>
          {t('ask.stageTip.close')}
        </Button>
      </div>
    </aside>
  )
}
