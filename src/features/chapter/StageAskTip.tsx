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
 * It does not stack with Ask's first-time tour (#677, `AskTour.tsx`), which
 * points at the + too. Beside the exercise on a wide screen both would come at
 * once: the tour wins, and the tip waits while the tour is on Ask's composer
 * (the microphone, the +). Once the tour has begun in this tab, the tip says
 * only "ask me here" -- not the photo point again -- and highlights nothing.
 *
 * Not a modal: it takes no focus, the exercise stays usable, and what it says
 * is read out once (`role="status"`). It fades in; nothing moves with reduced
 * motion (`askGuide.css`).
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import { dismissStageTip, stageTipDismissed } from '@/features/ask/askGuide'
import { useAskTourProgress } from '@/features/ask/AskTour'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import '@/features/ask/askGuide.css'

export type StageAskTip = {
  /** Whether Murmi points at Ask now. */
  shown: boolean
  /** Whether it makes the photo point too: not once Ask's tour has (#677). */
  photo: boolean
  dismiss: () => void
}

/**
 * Whether the tip is due: Ask on, no Ask conversation on the server, not
 * waved away in this tab, and Ask's tour not on the composer now.
 */
export function useStageAskTip(off: boolean): StageAskTip {
  const ownerId = useAuthStore((state) => state.user?.id ?? null)
  const conversations = useConversationsQuery()
  const [dismissed, setDismissed] = useState(() => ownerId === null || stageTipDismissed(ownerId))
  const newToAsk = conversations.isSuccess && conversations.data.items.length === 0
  const tour = useAskTourProgress(ownerId)
  const touring = tour === 'mic' || tour === 'add'
  const dismiss = useCallback(() => {
    if (ownerId) dismissStageTip(ownerId)
    setDismissed(true)
  }, [ownerId])
  return { shown: !off && !dismissed && !touring && newToAsk, photo: tour === null, dismiss }
}

/**
 * What Murmi says, read out once as it arrives: a live region that is always
 * there, so the words arriving in it are announced.
 */
export function StageAskTipStatus({ shown, photo = true }: { shown: boolean; photo?: boolean }) {
  const { t } = useTranslation('chat')
  return (
    <p role="status" data-stage-ask-tip-status className="sr-only">
      {shown ? (photo ? `${t('ask.stageTip.title')} ${t('ask.stageTip.body')}` : t('ask.stageTip.title')) : ''}
    </p>
  )
}

/** Beside: how far above the panel's composer area the tip stands. */
export const STAGE_TIP_GAP = 14
/** Beside, before the composer area is measured: its usual height (a 46 composer, 16 under it) and the gap. */
const STAGE_TIP_BOTTOM_FALLBACK = 76

/**
 * Beside: how far up from the panel's bottom the tip stands -- clear of all of
 * the composer area, as tall as it is now (#598): the tray of pictures added
 * with "+", a passage waiting to go out, a composer grown to several lines.
 */
function useAboveComposerArea(tip: RefObject<HTMLElement | null>, beside: boolean): number {
  const [bottom, setBottom] = useState(STAGE_TIP_BOTTOM_FALLBACK)
  useLayoutEffect(() => {
    const panel = tip.current?.parentElement
    const area = panel?.querySelector<HTMLElement>('[data-ask-composer-area]')
    if (!beside || !panel || !area) return
    const measure = () => {
      const height = panel.getBoundingClientRect().bottom - area.getBoundingClientRect().top
      if (height > 0) setBottom(Math.round(height) + STAGE_TIP_GAP)
    }
    measure()
    // A tray or a passage arriving changes what is in the area; the panel or a
    // growing composer changes its size.
    const contents = new MutationObserver(measure)
    contents.observe(area, { childList: true, subtree: true })
    const size = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    size?.observe(area)
    size?.observe(panel)
    return () => {
      contents.disconnect()
      size?.disconnect()
    }
  }, [tip, beside])
  return bottom
}

/**
 * Murmi's line. `beside`: the panel is open beside the stage, and the tip
 * stands in it, just above its composer area -- tray and all, as tall as it
 * is now; otherwise it sits over the docked composer, in the flow.
 */
export function StageAskTipBubble({
  beside,
  onDismiss,
  photo = true,
}: {
  beside: boolean
  onDismiss: () => void
  /** The photo point too; not once Ask's tour has made it in this tab (#677). */
  photo?: boolean
}) {
  const { t } = useTranslation('chat')
  const titleId = useId()
  const own = useRef<HTMLElement>(null)
  const bottom = useAboveComposerArea(own, beside)

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
      ref={own}
      data-stage-ask-tip={beside ? 'beside' : 'docked'}
      data-ask-guide-in
      aria-labelledby={titleId}
      className={cn(
        'z-10 space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky',
        // Over the panel's own composer (its way to add a photo on the left), clear of the exercise.
        beside ? 'absolute inset-x-[14px]' : 'w-full',
      )}
      style={{ bottom: beside ? bottom : undefined, background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
    >
      <div className="flex items-center gap-2">
        <Murmi mood="watching" size={32} />
        <h2 id={titleId} className="m-0 min-w-0 flex-1 text-[15px] font-semibold text-[color:var(--on-sky-text)]">
          {t('ask.stageTip.title')}
        </h2>
      </div>
      {photo && <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{t('ask.stageTip.body')}</p>}
      <div className="flex justify-end">
        <Button variant="onSkyPlain" size="small" onClick={onDismiss}>
          {t('ask.stageTip.close')}
        </Button>
      </div>
    </aside>
  )
}
