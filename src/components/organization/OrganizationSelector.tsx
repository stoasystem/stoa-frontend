import { useEffect, useMemo } from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { Organization } from '@/types/organization'

type OrganizationSelectorProps = {
  organizations: Organization[]
  selectedOrganizationId?: string
  onSelect: (organizationId: string) => void
}

export function OrganizationSelector({
  organizations,
  selectedOrganizationId,
  onSelect,
}: OrganizationSelectorProps) {
  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId) ?? organizations[0],
    [organizations, selectedOrganizationId],
  )

  useEffect(() => {
    if (!selectedOrganizationId && selectedOrganization) {
      onSelect(selectedOrganization.id)
    }
  }, [onSelect, selectedOrganization, selectedOrganizationId])

  if (!selectedOrganization) return null

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Workspace</p>
            <h2 className="truncate text-lg font-semibold">{selectedOrganization.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedOrganization.location} · {selectedOrganization.studentCount} students · {selectedOrganization.tutorCount} tutors
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {organizations.map((organization) => (
            <Button
              key={organization.id}
              type="button"
              size="sm"
              variant={organization.id === selectedOrganization.id ? 'default' : 'outline'}
              onClick={() => {
                onSelect(organization.id)
                trackEvent('organization_switched', {
                  organizationId: organization.id,
                  organizationType: organization.type,
                })
              }}
            >
              {organization.type === 'school' ? 'School' : 'Center'}
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
