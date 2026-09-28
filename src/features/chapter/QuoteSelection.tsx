import { Quote } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Pill } from '@/components/base'
import { ICON } from '@/components/base/sizes'

/*
 * 「问这段」, ask about this (#12 point 5, #50 point 4). Select text in the
 * exercise or in an answer beside it and a small button appears by the
 * selection, to ask about just that passage.
 *
 * The quote is meant to go out as a structured `quote: { text, source }`
 * field, shown as a quote block on top of the student's message. The backend
 * has no such field yet (stoasystem/stoa-backend#61), so -- by the user's rule
 * that the entry stays and says it is coming -- the button is here, disabled,
 * and marked 「即将推出」 (coming soon). #56 turns it on.
 */

export type QuoteSource = 'exercise' | 'answer'

type Quotable = { text: string; source: QuoteSource; top: number; left: number }

/** How far from the selection the chip sits, and how tall it is. */
const GAP = 4
const CHIP_HEIGHT = 36
/** The least room kept between the chip and the edge of the window. */
const EDGE = 8

/**
 * Where the chip goes: inside the passage's own block, above the selection or
 * else below it, so it never lies over the message next to it (Ask's bubbles
 * are 12 px apart, less than the chip is tall). With no clear room either
 * side it may lie a little over the selection's edge, still inside the block;
 * only a selection that would be mostly hidden puts it outside the block,
 * above when there is room.
 */
export function chipTop(rect: Pick<DOMRect, 'top' | 'bottom'>, block: Pick<DOMRect, 'top' | 'bottom'>) {
  const above = rect.top - GAP - CHIP_HEIGHT
  const below = rect.bottom + GAP
  if (above >= block.top) return above
  if (below + CHIP_HEIGHT <= block.bottom) return below
  const lowest = block.bottom - CHIP_HEIGHT
  if (lowest >= block.top) {
    const overBelow = Math.max(0, rect.bottom - lowest)
    const overAbove = Math.max(0, block.top + CHIP_HEIGHT - rect.top)
    const least = Math.min(overBelow, overAbove)
    if (least <= CHIP_HEIGHT / 2) return overBelow <= overAbove ? lowest : block.top
  }
  const outsideAbove = block.top - GAP - CHIP_HEIGHT
  return outsideAbove >= EDGE ? outsideAbove : block.bottom + GAP
}

function quotableSelection(scope: HTMLElement | null): Quotable | null {
  if (!scope || typeof window.getSelection !== 'function') return null
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null
  const text = selection.toString().trim()
  if (!text) return null
  const range = selection.getRangeAt(0)
  const node = range.commonAncestorContainer
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  const source = element?.closest<HTMLElement>('[data-quote-source]')
  if (!source || !scope.contains(source)) return null
  const kind = source.dataset.quoteSource
  if (kind !== 'exercise' && kind !== 'answer') return null

  // jsdom and some older engines have no geometry for a range: use its block.
  const block = source.getBoundingClientRect()
  const measured = typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null
  const rect = measured && (measured.width > 0 || measured.height > 0) ? measured : block
  return { text, source: kind, top: chipTop(rect, block), left: rect.left + rect.width / 2 }
}

/** Watches the selection inside `scope` and offers 「问这段」 beside it. */
export function QuoteSelection({ scope }: { scope: RefObject<HTMLElement | null> }) {
  const { t } = useTranslation('chapter')
  const soonId = useId()
  const [quotable, setQuotable] = useState<Quotable | null>(null)
  const chip = useRef<HTMLDivElement>(null)

  // Centred on the selection, kept whole inside the window once its width is known.
  useLayoutEffect(() => {
    const node = chip.current
    if (!node || !quotable) return
    const half = node.offsetWidth / 2
    const centre = Math.min(Math.max(quotable.left, half + EDGE), window.innerWidth - half - EDGE)
    node.style.left = `${centre}px`
  }, [quotable])

  useEffect(() => {
    const update = () => setQuotable(quotableSelection(scope.current))
    document.addEventListener('selectionchange', update)
    document.addEventListener('pointerup', update)
    document.addEventListener('keyup', update)
    window.addEventListener('resize', update)
    return () => {
      document.removeEventListener('selectionchange', update)
      document.removeEventListener('pointerup', update)
      document.removeEventListener('keyup', update)
      window.removeEventListener('resize', update)
    }
  }, [scope])

  if (!quotable) return null

  return createPortal(
    <div
      ref={chip}
      role="group"
      aria-label={t('quote.label')}
      data-quote-chip={quotable.source}
      // Pressing the chip must not clear the selection it is about.
      onPointerDown={(event) => event.preventDefault()}
      onMouseDown={(event) => event.preventDefault()}
      className="fixed z-40 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[color:var(--float-border)] bg-surface text-ink"
      style={{
        top: quotable.top,
        left: quotable.left,
        height: CHIP_HEIGHT,
        padding: '0 6px 0 12px',
        boxShadow: 'var(--shadow-float)',
      }}
    >
      <button
        type="button"
        disabled
        aria-describedby={soonId}
        className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-accent disabled:opacity-40"
      >
        <Quote size={ICON.chip} strokeWidth={ICON.stroke} aria-hidden="true" />
        {t('quote.ask')}
      </button>
      <span id={soonId}>
        <Pill tone="neutral">{t('quote.comingSoon')}</Pill>
      </span>
    </div>,
    document.body,
  )
}
