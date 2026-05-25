import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
import { Button } from '@/components/ui/button'
import { CurriculumGraphView } from '@/components/learning/CurriculumGraphView'
import { TopicDetailPanel } from '@/components/learning/TopicDetailPanel'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useCurriculumGraphQuery } from '@/hooks/learning/useCurriculumGraphQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function CurriculumGraphPage() {
  const { studentId = 'student-anna' } = useParams()
  const graphQuery = useCurriculumGraphQuery(studentId)
  const [selectedTopicId, setSelectedTopicId] = useState<string>()
  const selectedTopic = useMemo(
    () => graphQuery.data?.nodes.find((node) => node.id === selectedTopicId) ?? graphQuery.data?.nodes[0],
    [graphQuery.data, selectedTopicId],
  )

  useEffect(() => {
    trackEvent('curriculum_graph_viewed', { studentId })
  }, [studentId])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Learning intelligence"
          title="Curriculum graph"
          description="Static mock topic graph. The frontend renders status and selection; it does not compute graph relationships."
          actions={
            <PageActions
              primary={<Button asChild><Link to={`/students/${studentId}/diagnosis`}>Diagnosis</Link></Button>}
              secondary={<BackButton label="Learning profile" to={`/students/${studentId}/learning-profile`} />}
            />
          }
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Organization', to: '/organization' },
            { label: 'Students', to: '/organization/students' },
            { label: 'Learning profile', to: `/students/${studentId}/learning-profile` },
            { label: 'Curriculum graph' },
          ]}
        />
        {graphQuery.data && (
          <div className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
            <CurriculumGraphView
              graph={graphQuery.data}
              selectedTopicId={selectedTopic?.id}
              onSelectTopic={(topic) => {
                setSelectedTopicId(topic.id)
                trackEvent('curriculum_topic_selected', {
                  studentId,
                  topicId: topic.id,
                  subject: topic.subject,
                })
              }}
            />
            <TopicDetailPanel topic={selectedTopic} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
