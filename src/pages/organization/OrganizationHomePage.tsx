import { BarChart3, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Group, Row } from '@/components/base'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'

/*
 * The organisation roles' home (#52). Their logo and their sign-in used to
 * land on /organization, which had no page. This is the smallest home that
 * is a real one: the two organisation pages, as chevron rows; the account
 * itself is behind the avatar.
 */
export function OrganizationHomePage() {
  const { t } = useTranslation('common')

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6">
        <PageHeader title={t('organizationHome.title')} description={t('organizationHome.description')} />
        <Group title={t('organizationHome.pages')}>
          <Row
            to="/organization/learning-operations"
            leading={{ kind: 'icon', icon: BarChart3 }}
            title={t('organizationHome.learningOperations')}
            subtitle={t('organizationHome.learningOperationsDescription')}
          />
          <Row
            to="/organization/learning-automation"
            leading={{ kind: 'icon', icon: Sparkles }}
            title={t('organizationHome.learningAutomation')}
            subtitle={t('organizationHome.learningAutomationDescription')}
          />
        </Group>
      </div>
    </DashboardLayout>
  )
}

