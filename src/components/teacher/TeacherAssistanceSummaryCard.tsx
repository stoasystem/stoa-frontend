import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TeacherHelpRequestDetail } from '@/types/teacher'

type Props = {
  request: TeacherHelpRequestDetail
}

/*
 * Two fixed facts, both from the request already on the page: who asked, and
 * what they first asked. No model and no request of its own any more (#704):
 * the generated summary (student context, focus, assistant answer, weak
 * topics) is gone. The question is the student's own words, shown as they are.
 */
export function TeacherAssistanceSummaryCard({ request }: Props) {
  const { t } = useTranslation('teacher')
  const question = initialStudentQuestion(request)

  return (
    <Card data-preparation-summary>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('assistance.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SummaryBlock title={t('assistance.student')} value={request.student.name} />
        <SummaryBlock title={t('assistance.question')} value={question || t('assistance.noQuestion')} />
      </CardContent>
    </Card>
  )
}

/** The first student message; failing that, the text the request was opened with. */
function initialStudentQuestion(request: TeacherHelpRequestDetail): string {
  const first = request.messages.find((message) => message.role === 'student' && message.content.trim())
  return (first?.content ?? request.requestMessage ?? '').trim()
}

function SummaryBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{title}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{value}</p>
    </div>
  )
}
