import { useState } from 'react'
import { OrganizationSelector } from '@/components/organization/OrganizationSelector'
import { OrganizationTutorTable } from '@/components/organization/OrganizationTutorTable'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useOrganizationsQuery } from '@/hooks/organization/useOrganizationsQuery'
import { useOrganizationTutorsQuery } from '@/hooks/organization/useOrganizationTutorsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function OrganizationTutorsPage() {
  const organizationsQuery = useOrganizationsQuery()
  const organizations = organizationsQuery.data?.items ?? []
  const [organizationId, setOrganizationId] = useState('')
  const tutorsQuery = useOrganizationTutorsQuery(organizationId)

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Organization"
          title="Tutors"
          description="Teacher coverage, availability, load, and response-time overview."
        />
        <OrganizationSelector
          organizations={organizations}
          selectedOrganizationId={organizationId}
          onSelect={setOrganizationId}
        />
        {tutorsQuery.data && <OrganizationTutorTable tutors={tutorsQuery.data.items} />}
      </PageContainer>
    </DashboardLayout>
  )
}
