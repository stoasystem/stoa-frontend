import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useSetTeacherSupportAllowanceMutation,
  useTeacherSupportAllowanceQuery,
} from '@/hooks/admin/useAdminAccounts'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'

/**
 * How many teacher-support cases one student has in a week.
 *
 * Every student has the assigned figure without anybody doing anything, so the
 * editor opens on what is actually in force rather than on an empty box: an
 * administrator who types into a blank field is setting a number, not adjusting
 * one, and the two are different decisions.
 *
 * Zero is a real setting and takes teacher support away entirely, which is why
 * it is spelled out here instead of reading as "none configured".
 */
export function TeacherSupportAllowanceEditor({
  studentId,
  reason,
  onClose,
}: {
  studentId: string
  reason: string
  onClose: () => void
}) {
  const { t } = useTranslation('admin')
  const allowanceQuery = useTeacherSupportAllowanceQuery(studentId)
  const saveMutation = useSetTeacherSupportAllowanceMutation()
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const current = allowanceQuery.data

  useEffect(() => {
    if (current) setDraft(String(current.weeklyCases))
  }, [current])

  function save() {
    const parsed = Number(draft)
    if (!Number.isInteger(parsed) || parsed < 0 || (current && parsed > current.maximum)) {
      setNotice(t('accounts.teacherSupport.outOfRange', { maximum: current?.maximum ?? 0 }))
      return
    }
    if (!reason.trim()) {
      setNotice(t('accounts.reasonRequired'))
      return
    }
    setNotice(null)
    saveMutation.mutate(
      { studentId, weeklyCases: parsed, reason: reason.trim() },
      {
        onSuccess: (result) =>
          setNotice(t('accounts.teacherSupport.saved', { count: result.weeklyCases })),
        onError: (error) => {
          const code = error instanceof ApiError ? error.code : undefined
          setNotice(
            code
              ? t(`accounts.errors.${code}`, {
                  defaultValue: toUserFacingError(error, t('accounts.teacherSupport.saveFailed')),
                })
              : toUserFacingError(error, t('accounts.teacherSupport.saveFailed')),
          )
        },
      },
    )
  }

  if (allowanceQuery.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {toUserFacingError(allowanceQuery.error, t('accounts.teacherSupport.loadFailed'))}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mr-2">{t('accounts.teacherSupport.weeklyCases')}</span>
        <Input
          className="inline-block w-24"
          inputMode="numeric"
          value={draft}
          disabled={!current}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        {current
          ? current.source === 'administrator'
            ? t('accounts.teacherSupport.setByAdministrator', { count: current.weeklyCases })
            : t('accounts.teacherSupport.assignedDefault', { count: current.default })
          : t('accounts.teacherSupport.loading')}
      </p>
      <Button type="button" size="sm" onClick={save} disabled={!current || saveMutation.isPending}>
        {t('accounts.teacherSupport.save')}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onClose}>
        {t('accounts.teacherSupport.close')}
      </Button>
      {draft === '0' ? (
        <p className="w-full text-sm text-destructive">{t('accounts.teacherSupport.zeroWarning')}</p>
      ) : null}
      {notice ? <p className="w-full text-sm">{notice}</p> : null}
    </div>
  )
}
