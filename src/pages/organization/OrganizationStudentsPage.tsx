import { useState } from 'react'
import { OrganizationSelector } from '@/components/organization/OrganizationSelector'
import { OrganizationStudentTable } from '@/components/organization/OrganizationStudentTable'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useOrganizationsQuery } from '@/hooks/organization/useOrganizationsQuery'
import { useOrganizationStudentsQuery } from '@/hooks/organization/useOrganizationStudentsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function OrganizationStudentsPage() {
  const organizationsQuery = useOrganizationsQuery()
  const organizations = organizationsQuery.data?.items ?? []
  const [organizationId, setOrganizationId] = useState('')
  const studentsQuery = useOrganizationStudentsQuery(organizationId)

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Organization"
          title="Students"
          description="Student list with learning intelligence entry points for platform demos."
        />
        <OrganizationSelector
          organizations={organizations}
          selectedOrganizationId={organizationId}
          onSelect={setOrganizationId}
        />
        {studentsQuery.data && <OrganizationStudentTable students={studentsQuery.data.items} />}
      </PageContainer>
    </DashboardLayout>
  )
}
