import { type ReactNode, useMemo, useState } from 'react'
import { CalendarCheck, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { AttachmentPreviewList } from '@/features/uploads/components/AttachmentPreviewList'
import { PhotoCaptureButton } from '@/features/uploads/components/PhotoCaptureButton'
import { UploadButton } from '@/features/uploads/components/UploadButton'
import { UploadErrorMessage } from '@/features/uploads/components/UploadErrorMessage'
import { useUploadAttachments } from '@/features/uploads/hooks/useUploadAttachments'
import { uploadAttachmentToClassroomMaterial } from '@/features/live-classroom/utils/uploadAttachmentToClassroomMaterial'
import { useScheduleClassroom } from '@/features/live-classroom/hooks/useScheduleClassroom'
import type {
  ClassroomLanguage,
  ClassroomSessionType,
} from '@/features/live-classroom/types/liveClassroom'
import { formatClassroomTimeRange } from '@/features/live-classroom/utils/formatClassroom'

const subjects = [
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology' },
]

const topics = [
  { id: 'algebra', label: 'Algebra' },
  { id: 'linear-equations', label: 'Linear Equations' },
  { id: 'fractions', label: 'Fractions' },
  { id: 'exam-prep', label: 'Exam Prep' },
]

const levels = ['Lower Secondary', 'Upper Secondary', 'Matura Prep']
const languages: Array<{ id: ClassroomLanguage; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'German' },
  { id: 'fr', label: 'French' },
  { id: 'it', label: 'Italian' },
]
const sessionTypes: Array<{ id: ClassroomSessionType; label: string; description: string }> = [
  { id: 'quick_help', label: 'Quick Help', description: '15 minutes for one focused question.' },
  { id: 'standard_session', label: 'Standard Session', description: '30 minutes for homework or a topic.' },
  { id: 'deep_review', label: 'Deep Review', description: '60 minutes for exam preparation.' },
]
const timeSlots = [
  { id: 'today-1630', label: 'Today 16:30' },
  { id: 'today-1730', label: 'Today 17:30' },
  { id: 'tomorrow-1000', label: 'Tomorrow 10:00' },
  { id: 'tomorrow-1800', label: 'Tomorrow 18:00' },
]

export function ScheduleClassroomPage() {
  const [subjectId, setSubjectId] = useState('mathematics')
  const [topicId, setTopicId] = useState('linear-equations')
  const [level, setLevel] = useState(levels[0])
  const [language, setLanguage] = useState<ClassroomLanguage>('en')
  const [type, setType] = useState<ClassroomSessionType>('standard_session')
  const [timeSlotId, setTimeSlotId] = useState(timeSlots[1].id)
  const [contextMessage, setContextMessage] = useState('')
  const scheduleMutation = useScheduleClassroom()
  const {
    attachments,
    errors,
    isUploading,
    addFiles,
    removeAttachment,
    retryAttachment,
  } = useUploadAttachments({
    context: 'support',
    sourceOptions: {
      sourcePage: '/classroom/schedule',
    },
  })

  const subject = useMemo(() => subjects.find((item) => item.id === subjectId) ?? subjects[0], [subjectId])
  const topic = useMemo(() => topics.find((item) => item.id === topicId) ?? topics[0], [topicId])
  const uploadedAttachments = attachments.filter((attachment) => attachment.status === 'uploaded')
  const scheduledSession = scheduleMutation.data

  function handleSchedule() {
    scheduleMutation.mutate({
      subjectId: subject.id,
      subjectLabel: subject.label,
      topicId: topic.id,
      topicLabel: topic.label,
      level,
      language,
      type,
      timeSlotId,
      contextMessage,
      materials: uploadedAttachments.map(uploadAttachmentToClassroomMaterial),
    })
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-7 p-0">
        <PageHeader
          eyebrow="Online Classroom"
          title="Schedule a Classroom Session"
          description="Choose a subject, topic, and time for live tutor support."
        />

        {scheduledSession ? (
          <section className="rounded-lg border bg-card p-6 shadow-[var(--platform-shadow-card)]">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="brand-section-kicker">Session scheduled</p>
                <h2 className="mt-2 text-2xl font-semibold">{scheduledSession.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{formatClassroomTimeRange(scheduledSession)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can join the lobby before the session starts.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link to={`/classroom/sessions/${scheduledSession.id}/lobby`}>Open Lobby</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/classroom">Go to Classroom Home</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="space-y-5 rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
              <Step title="1. What do you need help with?">
                <Segmented label="Subject" value={subjectId} options={subjects} onChange={setSubjectId} />
                <Segmented label="Topic" value={topicId} options={topics} onChange={setTopicId} />
                <Segmented
                  label="Level"
                  value={level}
                  options={levels.map((item) => ({ id: item, label: item }))}
                  onChange={setLevel}
                />
                <Segmented label="Language" value={language} options={languages} onChange={(value) => setLanguage(value as ClassroomLanguage)} />
              </Step>

              <Step title="2. Choose session type">
                <div className="grid gap-3 md:grid-cols-3">
                  {sessionTypes.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setType(option.id)}
                      className={`rounded-lg border p-4 text-left transition ${
                        type === option.id ? 'border-primary bg-primary/5' : 'bg-[hsl(var(--platform-surface-app))]'
                      }`}
                    >
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              </Step>

              <Step title="3. Choose a time">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setTimeSlotId(slot.id)}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                        timeSlotId === slot.id ? 'border-primary bg-primary/5 text-primary' : 'bg-background'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </Step>

              <Step title="4. Add context">
                <Textarea
                  value={contextMessage}
                  onChange={(event) => setContextMessage(event.target.value)}
                  placeholder="What should the tutor know?"
                  className="min-h-28"
                  aria-label="What should the tutor know?"
                />
                <div className="rounded-lg border bg-[hsl(var(--platform-surface-app))] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Attach materials</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Add a photo or PDF so the tutor can prepare. This uses the same learning-material upload flow.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PhotoCaptureButton onPhotoSelected={(file) => void addFiles([file])} disabled={isUploading} />
                      <UploadButton onFilesSelected={(files) => void addFiles(files)} disabled={isUploading} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    <UploadErrorMessage errors={errors} />
                    <AttachmentPreviewList
                      attachments={attachments}
                      onRemove={removeAttachment}
                      onRetry={(attachmentId) => void retryAttachment(attachmentId)}
                      compact
                    />
                  </div>
                </div>
              </Step>

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button asChild variant="outline">
                  <Link to="/classroom">Cancel</Link>
                </Button>
                <Button type="button" onClick={handleSchedule} disabled={scheduleMutation.isPending || isUploading}>
                  {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Session'}
                </Button>
              </div>
            </section>

            <aside className="space-y-4 rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-card)]">
              <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-3 text-primary">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="brand-section-kicker">Session Preview</p>
                <h2 className="mt-2 text-xl font-semibold">{subject.label} Support</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <PreviewRow label="Topic" value={topic.label} />
                  <PreviewRow label="Level" value={level} />
                  <PreviewRow label="Language" value={languages.find((item) => item.id === language)?.label ?? 'English'} />
                  <PreviewRow label="Materials" value={`${uploadedAttachments.length} uploaded`} />
                </dl>
              </div>
              <EmptyState message="The tutor sees your topic, context, and uploaded learning materials before joining." />
            </aside>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ id: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              value === option.id ? 'border-primary bg-primary/5 text-primary' : 'bg-background'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
