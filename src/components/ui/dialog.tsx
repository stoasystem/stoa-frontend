import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm', className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /**
   * Where focus goes on close when the control that opened the dialog is gone
   * or disabled by then: the button of a row the action archived, say. Give it
   * `tabIndex={-1}` if it is not focusable already.
   */
  returnFocusFallback?: React.RefObject<HTMLElement | null>
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, returnFocusFallback, onCloseAutoFocus, ...props }, ref) => {
  const { t } = useTranslation('common')
  const opener = React.useRef<Element | null>(null)
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Never taller than the screen: on a phone with the keyboard open the
          // title and the footer stay reachable by scrolling (#276).
          'fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto overscroll-contain rounded-lg border bg-background p-6 shadow-lg',
          className,
        )}
        {...props}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event)
          // Radix gives focus back to a DialogTrigger only. A dialog opened from
          // state has none, so focus fell to the page and a keyboard user had
          // to find their row again from the top (#407). Focus somewhere other
          // than the page was put there on purpose and stays.
          const lost = !document.activeElement || document.activeElement === document.body
          if (event.defaultPrevented || !lost) return
          if (refocus(opener.current) || refocus(returnFocusFallback?.current)) event.preventDefault()
        }}
      >
        <RememberOpener into={opener} />
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">{t('a11y.close')}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

/**
 * Notes what had focus when the dialog's content mounted. It reads it while
 * rendering, before the commit moves focus into the dialog or disables the
 * button that was pressed (a page that locks its row actions while a dialog
 * is open), either of which leaves the page itself as the active element.
 */
function RememberOpener({ into }: { into: React.RefObject<Element | null> }) {
  const [active] = React.useState(() => document.activeElement)
  React.useEffect(() => {
    into.current = active
  }, [active, into])
  return null
}

/** Focuses `element` if it is still on the page and enabled, and says whether it took. */
function refocus(element: Element | null | undefined): boolean {
  if (!(element instanceof HTMLElement) || element === document.body) return false
  if (!element.isConnected || element.matches(':disabled')) return false
  element.focus()
  return document.activeElement === element
}

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-none', className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName
