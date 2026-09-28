import { useRef, useState, type PointerEvent, type RefObject } from 'react'
import { ASK_SHEET } from '@/features/ask/askLayout'

/**
 * Drag the phone sheet down to close it (#12 point 6). The grabber and the
 * header are the handle; past a quarter of the sheet's height, or a quick
 * flick, it closes; otherwise it springs back.
 */
export function useSheetDrag(sheet: RefObject<HTMLElement | null>, onDismiss: () => void) {
  const [offset, setOffset] = useState(0)
  const start = useRef<{ y: number; at: number; id: number } | null>(null)

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    // A button in the header is pressed, not dragged.
    if ((event.target as HTMLElement).closest('button, a, textarea, input')) return
    start.current = { y: event.clientY, at: event.timeStamp, id: event.pointerId }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!start.current || start.current.id !== event.pointerId) return
    setOffset(Math.max(0, event.clientY - start.current.y))
  }

  function finish(event: PointerEvent<HTMLElement>) {
    if (!start.current || start.current.id !== event.pointerId) return
    const distance = Math.max(0, event.clientY - start.current.y)
    const elapsed = Math.max(1, event.timeStamp - start.current.at)
    start.current = null
    const height = sheet.current?.getBoundingClientRect().height ?? 0
    const flick = distance > 24 && distance / elapsed > 0.8
    setOffset(0)
    if (flick || (height > 0 && distance > height * ASK_SHEET.dismissFraction)) onDismiss()
  }

  return {
    offset,
    dragging: offset > 0,
    handle: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: () => {
        start.current = null
        setOffset(0)
      },
    },
  }
}
