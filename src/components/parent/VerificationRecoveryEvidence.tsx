import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAccountStateLabel } from '@/components/parent/accountOperationsView'
import type { AccountOperationsChild, AccountOperationsProfile, AccountOperationsVerification } from '@/types/parentAccountOperations'

type VerificationRecoveryEvidenceProps = {
  parent: AccountOperationsProfile
  children: AccountOperationsChild[]
  admin?: boolean
}

export function VerificationRecoveryEvidence({
  parent,
  children,
  admin = false,
}: VerificationRecoveryEvidenceProps) {
  const { t } = useTranslation('parent')

  return (
    <Card className="brand-rule">
      <CardHeader>
        <CardTitle className="text-base">{t('accountOps.evidence.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <VerificationRow
          label={t('accountOps.evidence.parent')}
          name={parent.name || parent.email}
          email={parent.email}
          verification={parent.verification}
          admin={admin}
        />
        {children.map((child) => (
          <VerificationRow
            key={child.studentId}
            label={t('accountOps.evidence.child')}
            name={child.profile.name || child.profile.email}
            email={child.profile.email}
            verification={child.profile.verification ?? child.verification}
            admin={admin}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function VerificationRow({
  label,
  name,
  email,
  verification,
  admin,
}: {
  label: string
  name: string
  email: string
  verification?: AccountOperationsVerification
  admin: boolean
}) {
  const { t, i18n } = useTranslation('parent')
  const date = (value?: string | null) => formatDate(value, i18n.resolvedLanguage, t)

  return (
    <div className="rounded-md border border-border/70 bg-background/80 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <p className="mt-1 truncate font-semibold text-foreground">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <p className="text-sm font-medium text-foreground">
          {getAccountStateLabel(verification?.supportAction, t)}
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <EvidenceItem label={t('accountOps.evidence.status')} value={getAccountStateLabel(verification?.emailVerificationStatus, t)} />
        <EvidenceItem label={t('accountOps.evidence.activation')} value={getAccountStateLabel(verification?.accountActivationStatus, t)} />
        <EvidenceItem label={t('accountOps.evidence.recovery')} value={getAccountStateLabel(verification?.supportRecoveryState, t)} />
        <EvidenceItem
          label={t('accountOps.evidence.resend')}
          value={t(verification?.resendAllowed ? 'accountOps.evidence.resendAllowed' : 'accountOps.evidence.resendNotAvailable')}
        />
        <EvidenceItem label={t('accountOps.evidence.resendCount')} value={String(verification?.emailVerificationResendCount ?? 0)} />
        <EvidenceItem
          label={t(admin ? 'accountOps.evidence.lastResend' : 'accountOps.evidence.updated')}
          value={date(verification?.emailVerificationLastResendAt ?? verification?.emailVerifiedAt)}
        />
      </div>
      {admin && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <EvidenceItem label={t('accountOps.evidence.policy')} value={getAccountStateLabel(verification?.emailVerificationPolicy, t)} />
          <EvidenceItem label={t('accountOps.evidence.requested')} value={date(verification?.emailVerificationRequestedAt)} />
        </div>
      )}
    </div>
  )
}

function EvidenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

// The dates were drawn with a hard-coded 'en' formatter, so a German page read
// "Oct 9, 09:12" beside German labels.
function formatDate(value: string | null | undefined, locale: string | undefined, t: TFunction) {
  if (!value) return t('accountOps.evidence.noDate')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
