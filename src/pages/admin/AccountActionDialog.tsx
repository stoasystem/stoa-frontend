import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { AccountRow, AccountStatus } from '@/services/admin/accountsApi'

export type AccountAction =
  | { kind: 'reset'; row: AccountRow }
  | { kind: 'status'; row: AccountRow; next: Exclude<AccountStatus, 'invited'> }

/** What the console calls an account: its name, with the number it is bound to. */
export function accountLabel(row: AccountRow): string {
  const name = row.name || row.email || row.userId
  return row.accountNumber ? `${name} (${row.accountNumber})` : name
}

/**
 * The one place a reasoned account change is confirmed (#259).
 *
 * Reset, suspend, reactivate and archive used to run on the first click, with
 * the reason taken from one field at the top of the page that nothing ever
 * emptied: after one change every row's buttons were live with that reason, so
 * a mis-click archived the wrong account for good under someone else's ticket.
 * The reason is now typed here, for the account the dialog names, and it goes
 * when the dialog does.
 */
export function AccountActionDialog({
  action,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  action: AccountAction | null
  pending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: (action: AccountAction, reason: string) => void
}) {
  return (
    <Dialog open={action !== null} onOpenChange={(open) => (open || pending ? null : onCancel())}>
      {action ? (
        // Keyed by account and action so a new dialog never opens on the last reason.
        <ActionForm
          key={`${action.row.userId}:${action.kind === 'status' ? action.next : 'reset'}`}
          action={action}
          pending={pending}
          error={error}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      ) : null}
    </Dialog>
  )
}

function ActionForm({
  action,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  action: AccountAction
  pending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: (action: AccountAction, reason: string) => void
}) {
  const { t } = useTranslation('admin')
  const [reason, setReason] = useState('')
  const account = accountLabel(action.row)
  const step = action.kind === 'reset' ? 'reset' : action.next
  const submitLabel =
    action.kind === 'reset' ? t('accounts.resetPassword') : t(`accounts.moveTo.${action.next}`)
  const ready = reason.trim().length > 0 && !pending

  return (
    <DialogContent>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (ready) onConfirm(action, reason.trim())
        }}
      >
        <DialogHeader>
          <DialogTitle>{t(`accounts.confirm.title.${step}`, { account })}</DialogTitle>
          <DialogDescription>{t(`accounts.confirm.body.${step}`)}</DialogDescription>
        </DialogHeader>
        {step === 'archived' ? (
          <p className="text-sm font-medium text-destructive">{t('accounts.confirm.irreversible')}</p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          {t('accounts.reasonPrompt')}
          <Input value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {t('accounts.cancel')}
          </Button>
          <Button
            type="submit"
            variant={step === 'archived' ? 'destructive' : 'default'}
            disabled={!ready}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
