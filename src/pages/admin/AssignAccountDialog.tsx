import { useEffect, useState } from 'react'
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
import { AccountDraftFields, BlockedReason } from '@/pages/admin/AccountFormFields'
import type { AccountDraft } from '@/pages/admin/accountFormRules'
import { accountDraftIssues, blockingIssues } from '@/pages/admin/accountFormRules'

type Props = {
  open: boolean
  initial: AccountDraft
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: AccountDraft) => void
}

/**
 * Card 014: "assign directly" opens the registration form it always implied.
 *
 * The administrator fills in everything the invitee would have filled in, so
 * the form has to show the whole list, mark what is required for the role at
 * hand, and say that the password comes back once and only once.
 */
export function AssignAccountDialog({ open, initial, pending, onOpenChange, onSubmit }: Props) {
  const { t } = useTranslation('admin')
  const [draft, setDraft] = useState<AccountDraft>(initial)
  const [touched, setTouched] = useState<Partial<Record<keyof AccountDraft, boolean>>>({})

  useEffect(() => {
    if (open) {
      setDraft(initial)
      setTouched({})
    }
    // Seeded once per opening: later keystrokes in the card behind the dialog
    // must not overwrite what is being typed here.
  }, [open])

  const issues = accountDraftIssues(draft)
  const blocking = blockingIssues(draft)
  const reasons = blocking.map((issue) => t(`accounts.fieldIssues.${issue}`))
  const blocked = blocking.length > 0 || pending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('accounts.assignDialogTitle')}</DialogTitle>
          <DialogDescription>{t('accounts.assignDialogDescription')}</DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">{t('accounts.requiredLegend')}</p>
        <p className="text-xs text-muted-foreground">
          {t(`accounts.roleFieldsHint.${draft.role}`)}
        </p>

        <form
          className="flex flex-wrap items-start gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (blocked) return
            onSubmit(draft)
          }}
        >
          <AccountDraftFields
            idPrefix="assign"
            draft={draft}
            issues={issues}
            touched={touched}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
            onTouch={(field) => setTouched((current) => ({ ...current, [field]: true }))}
          />

          <BlockedReason id="assign-blocked" reasons={reasons} />

          <DialogFooter className="w-full gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('accounts.cancel')}
            </Button>
            <span title={blocking.length > 0 ? reasons.join(' · ') : undefined}>
              <Button
                type="submit"
                disabled={blocked}
                title={blocking.length > 0 ? reasons.join(' · ') : undefined}
                aria-describedby={blocking.length > 0 ? 'assign-blocked' : undefined}
              >
                {t('accounts.assignDialogSubmit')}
              </Button>
            </span>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
