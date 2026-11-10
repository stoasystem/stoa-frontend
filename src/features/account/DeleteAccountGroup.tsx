import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/base/Button'
import { TextField } from '@/components/base/TextField'
import { ROW } from '@/components/base/sizes'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { useAddressContext } from '@/lib/addressForm'
import { deleteAccount } from '@/services/auth/authApi'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

/** Typed the same as `word`, ignoring case and the spaces around it. */
export function confirmsDeletion(typed: string, word: string): boolean {
  const expected = word.trim().toLowerCase()
  return expected !== '' && typed.trim().toLowerCase() === expected
}

/*
 * The account deletes itself (#651): `DELETE /auth/me` (stoa-backend
 * `delete_me`), which takes nothing but the verified token and answers 202
 * with a receipt; the deletion itself runs on the backend afterwards, and only
 * then is the address free again. Every role has it, at the bottom of its own
 * account page: /me, /teacher/profile and /parent/account-operations.
 *
 * Nothing is sent until the reader has typed their own email address (any
 * case), or the fixed word where the account shows none. Accepted, the device
 * is signed out as by the account menu, but without the logout call: the
 * account it would name is being deleted. The way to the sign-in page carries
 * the "accepted" toast. A failure says only that it did not work: the backend's
 * reason is not the reader's to act on.
 */
export function DeleteAccountGroup() {
  const user = useAuthStore((state) => state.user)
  // Nobody signed in has no account to delete.
  return user ? <DeleteAccountForm user={user} /> : null
}

function DeleteAccountForm({ user }: { user: CurrentUser }) {
  const { t } = useTranslation('common')
  const context = useAddressContext()
  const { signOut } = useSignOut()
  const [typed, setTyped] = useState('')

  const remove = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success(t('me.deleteAccount.accepted', { context }))
      void signOut({ endedOnServer: true })
    },
  })

  const word = user.email.trim() || t('me.deleteAccount.fallbackWord')
  const confirmed = confirmsDeletion(typed, word)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!confirmed || remove.isPending || remove.isSuccess) return
    remove.mutate()
  }

  return (
    <section aria-labelledby="me-delete-account-heading" className="flex flex-col">
      <h2
        id="me-delete-account-heading"
        className="m-0 text-caption uppercase"
        style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)', padding: '0 16px 8px' }}
      >
        {t('me.deleteAccount.heading')}
      </h2>
      <div
        className="flex flex-col gap-4 border border-[color:var(--card-border)] bg-surface"
        style={{ borderRadius: ROW.groupRadius, padding: ROW.paddingX }}
      >
        <p className="m-0 text-[15px] leading-[1.45] text-ink">{t('me.deleteAccount.consequences', { context })}</p>
        {user.role === 'parent' && (
          <p className="m-0 text-[15px] leading-[1.45] text-ink">{t('me.deleteAccount.parentLinks', { context })}</p>
        )}
        <form className="grid max-w-md gap-4" onSubmit={submit} noValidate>
          <TextField
            id="me-delete-account-confirm"
            label={t('me.deleteAccount.confirmLabel', { context, word })}
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value)
              if (remove.isError) remove.reset()
            }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={remove.isPending || remove.isSuccess}
          />
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" variant="gray" className="text-red" disabled={!confirmed || remove.isPending || remove.isSuccess}>
              {remove.isPending ? t('me.deleteAccount.deleting') : t('me.deleteAccount.submit')}
            </Button>
            {/* Always mounted, only its text changes: a live region added with its words is not announced (#410). */}
            <p className="m-0 text-[13px] leading-[1.35] text-caption" role="status">
              {remove.isSuccess ? t('me.deleteAccount.accepted', { context }) : null}
            </p>
          </div>
          {remove.isError && (
            <p className="m-0 text-[13px] leading-[1.35] text-red" role="alert">
              {t('me.deleteAccount.failed', { context })}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
