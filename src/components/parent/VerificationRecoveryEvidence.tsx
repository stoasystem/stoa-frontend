import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatStatus } from '@/components/parent/accountOperationsView'
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
  return (
    <Card className="brand-rule">
      <CardHeader>
        <CardTitle className="text-base">Verification recovery</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <VerificationRow
          label="Parent"
          name={parent.name || parent.email}
          email={parent.email}
          verification={parent.verification}
          admin={admin}
        />
        {children.map((child) => (
          <VerificationRow
            key={child.studentId}
            label="Child"
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
  return (
    <div className="rounded-md border border-border/70 bg-background/80 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <p className="mt-1 truncate font-semibold text-foreground">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <p className="text-sm font-medium text-foreground">
          {formatStatus(verification?.supportAction)}
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <EvidenceItem label="Status" value={formatStatus(verification?.emailVerificationStatus)} />
        <EvidenceItem label="Activation" value={formatStatus(verification?.accountActivationStatus)} />
        <EvidenceItem label="Recovery" value={formatStatus(verification?.supportRecoveryState)} />
        <EvidenceItem label="Resend" value={verification?.resendAllowed ? 'Allowed' : 'Not available'} />
        <EvidenceItem label="Resend count" value={String(verification?.emailVerificationResendCount ?? 0)} />
        <EvidenceItem label={admin ? 'Last resend' : 'Updated'} value={formatDate(verification?.emailVerificationLastResendAt ?? verification?.emailVerifiedAt)} />
      </div>
      {admin && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <EvidenceItem label="Policy" value={formatStatus(verification?.emailVerificationPolicy)} />
          <EvidenceItem label="Requested" value={formatDate(verification?.emailVerificationRequestedAt)} />
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

function formatDate(value?: string | null) {
  if (!value) return 'None'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
