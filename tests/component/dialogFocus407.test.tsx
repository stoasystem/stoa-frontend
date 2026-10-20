/**
 * Where focus goes when a dialog closes (#407, 2026-10-20 audit; WCAG 2.4.3).
 *
 * Radix gives focus back to a DialogTrigger, and most dialogs here have none:
 * they open from page state, an action on a table row. Esc, Cancel or Confirm
 * left focus on the page itself, and a keyboard user had to Tab down from the
 * top to find the row again. The shared DialogContent now hands focus back to
 * what opened it, or to a fallback the page names when that is gone or
 * disabled, and leaves a dialog with a trigger as it was.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useRef, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import i18n from '@/i18n'

type Outcome = 'stays' | 'removed' | 'disabled'

/** A row action confirmed in a dialog the page opens from state, as the admin consoles do. */
function RowAction({
  onConfirm = 'stays',
  withFallback = false,
  lockWhileOpen = false,
}: {
  onConfirm?: Outcome
  withFallback?: boolean
  lockWhileOpen?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>('stays')
  const heading = useRef<HTMLHeadingElement>(null)
  return (
    <>
      <h2 ref={heading} tabIndex={-1}>
        Accounts
      </h2>
      <button type="button">Filter</button>
      {outcome === 'removed' ? null : (
        <button
          type="button"
          disabled={outcome === 'disabled' || (lockWhileOpen && open)}
          onClick={() => setOpen(true)}
        >
          Archive Lea
        </button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent returnFocusFallback={withFallback ? heading : undefined}>
          <DialogTitle>Archive Lea?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
          <button type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setOutcome(onConfirm)
            }}
          >
            Confirm
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}

function inApp(ui: React.ReactNode) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

const opener = () => screen.getByRole('button', { name: 'Archive Lea' })
const inDialog = (name: string) => within(screen.getByRole('dialog')).getByRole('button', { name })

/** Opens the dialog from the keyboard, the way the audit walked it. */
async function openFromKeyboard(user: ReturnType<typeof userEvent.setup>) {
  opener().focus()
  await user.keyboard('{Enter}')
  await screen.findByRole('dialog')
  // Radix has moved focus into the dialog.
  await waitFor(() => expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement))
}

async function closed() {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('a dialog opened from state gives focus back to what opened it', () => {
  it('after Esc', async () => {
    const user = userEvent.setup()
    inApp(<RowAction />)
    await openFromKeyboard(user)

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(opener()).toHaveFocus())
  })

  it('after Cancel', async () => {
    const user = userEvent.setup()
    inApp(<RowAction />)
    await openFromKeyboard(user)

    await user.click(inDialog('Cancel'))

    await closed()
    await waitFor(() => expect(opener()).toHaveFocus())
  })

  it('after Confirm', async () => {
    const user = userEvent.setup()
    inApp(<RowAction />)
    await openFromKeyboard(user)

    await user.click(inDialog('Confirm'))

    await closed()
    await waitFor(() => expect(opener()).toHaveFocus())
  })

  it('when the page locks its row actions while the dialog is open', async () => {
    // The accounts console disables every row button while a dialog is open,
    // so the opener is disabled from the moment the dialog mounts.
    const user = userEvent.setup()
    inApp(<RowAction lockWhileOpen />)
    await openFromKeyboard(user)
    // Hidden from the accessibility tree behind the modal dialog.
    expect(screen.getByRole('button', { name: 'Archive Lea', hidden: true })).toBeDisabled()

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(opener()).toHaveFocus())
  })

  it('under StrictMode, as the dev server renders it', async () => {
    // StrictMode runs every effect twice on mount, the remembering one too.
    const user = userEvent.setup()
    inApp(
      <StrictMode>
        <RowAction />
      </StrictMode>,
    )
    await openFromKeyboard(user)
    await new Promise((done) => setTimeout(done, 20))

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(opener()).toHaveFocus())
  })

  it('opened by a pointer, too', async () => {
    const user = userEvent.setup()
    inApp(<RowAction />)
    await user.click(opener())
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(opener()).toHaveFocus())
  })
})

describe('when what opened the dialog cannot take focus back', () => {
  it('focus goes to the fallback once the opener is gone', async () => {
    const user = userEvent.setup()
    inApp(<RowAction onConfirm="removed" withFallback />)
    await openFromKeyboard(user)

    await user.click(inDialog('Confirm'))

    await closed()
    expect(screen.queryByRole('button', { name: 'Archive Lea' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Accounts' })).toHaveFocus())
  })

  it('focus goes to the fallback once the opener is disabled', async () => {
    const user = userEvent.setup()
    inApp(<RowAction onConfirm="disabled" withFallback />)
    await openFromKeyboard(user)

    await user.click(inDialog('Confirm'))

    await closed()
    expect(opener()).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Accounts' })).toHaveFocus())
  })

  it('the opener still wins over the fallback while it is there', async () => {
    const user = userEvent.setup()
    inApp(<RowAction withFallback />)
    await openFromKeyboard(user)

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(opener()).toHaveFocus())
  })

  it('without a fallback, Radix decides as before', async () => {
    const user = userEvent.setup()
    inApp(<RowAction onConfirm="removed" />)
    await openFromKeyboard(user)

    await user.click(inDialog('Confirm'))

    await closed()
    // Let Radix's close timer run, then look: nothing to give focus to.
    await new Promise((done) => setTimeout(done, 20))
    expect(document.activeElement).toBe(document.body)
  })
})

describe('the rest is as it was', () => {
  function WithTrigger() {
    return (
      <>
        <button type="button">Elsewhere</button>
        <Dialog>
          <DialogTrigger asChild>
            <button type="button">Report</button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Report this message</DialogTitle>
            <DialogDescription>Say what is wrong.</DialogDescription>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  it('a dialog with a trigger gives focus back to its trigger', async () => {
    const user = userEvent.setup()
    inApp(<WithTrigger />)
    await user.click(screen.getByRole('button', { name: 'Report' }))
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Report' })).toHaveFocus())
  })

  it('a trigger clicked without taking focus still gets it back', async () => {
    // Safari does not focus a button on click, so the page itself is active
    // when the dialog opens: Radix's own return to the trigger has to stand.
    const user = userEvent.setup()
    inApp(<WithTrigger />)
    expect(document.activeElement).toBe(document.body)
    fireEvent.click(screen.getByRole('button', { name: 'Report' }))
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Report' })).toHaveFocus())
  })

  it.each([
    ['and says so', true],
    ['without saying so', false],
  ])('a caller that places focus itself on close keeps it there, %s', async (_, prevent) => {
    function OwnFocus() {
      const [open, setOpen] = useState(false)
      const elsewhere = useRef<HTMLButtonElement>(null)
      return (
        <>
          <button type="button" ref={elsewhere}>
            Elsewhere
          </button>
          <button type="button" onClick={() => setOpen(true)}>
            Archive Lea
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              onCloseAutoFocus={(event) => {
                if (prevent) event.preventDefault()
                elsewhere.current?.focus()
              }}
            >
              <DialogTitle>Archive Lea?</DialogTitle>
              <DialogDescription>This cannot be undone.</DialogDescription>
            </DialogContent>
          </Dialog>
        </>
      )
    }
    const user = userEvent.setup()
    inApp(<OwnFocus />)
    await openFromKeyboard(user)

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus())
    await new Promise((done) => setTimeout(done, 20))
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus()
  })
})
