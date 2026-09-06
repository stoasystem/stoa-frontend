import { useTranslation } from 'react-i18next'
import { BookOpenCheck, CircleAlert, Gauge, HelpCircle } from 'lucide-react'
import i18n from '@/i18n'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { LearningProfile } from '@/types/learningProfile'

type LearningProfileSignalsProps = {
  title: string
  description: string
  profile?: LearningProfile
  isLoading: boolean
  isError: boolean
}

export function LearningProfileSignals({
  title,
  description,
  profile,
  isLoading,
  isError,
}: LearningProfileSignalsProps) {
  const { t: tPractice } = useTranslation('practice')
  const { t: tChat } = useTranslation('chat')
  const activity = profile?.subjectActivity ?? []
  const weakTopics = profile?.weakTopics ?? []

  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      {isLoading && (
        <div className="rounded-lg border border-dashed border-border/80 p-5 text-sm text-muted-foreground">
          Loading learning signals...
        </div>
      )}
      {isError && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-5 text-sm text-destructive">
          Learning signals are unavailable right now.
        </div>
      )}
      {!isLoading && !isError && profile && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {profile.subjects.map((subject) => {
              const subjectActivity = activity.find((item) => item.subject === subject.id)
              return (
                <Card key={subject.id} className="border-border/70">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{tChat(subject.labelKey)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRolloutState(subject.rolloutState)}
                        </p>
                      </div>
                      <Badge variant={subject.rolloutState === 'active' ? 'default' : 'secondary'}>
                        {subject.rolloutState === 'active' ? tPractice('progress.subjectActive') : tPractice('progress.subjectFoundation')}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <SignalMetric
                        icon={BookOpenCheck}
                        label="Questions"
                        value={String(subjectActivity?.questionCount ?? 0)}
                      />
                      <SignalMetric
                        icon={HelpCircle}
                        label={tPractice('ui.tutorHelp')}
                        value={String(subjectActivity?.teacherEscalationCount ?? 0)}
                      />
                    </div>
                    <div className="mt-3">
                      <SignalMetric
                        icon={Gauge}
                        label="Feedback"
                        value={formatFeedback(subjectActivity?.feedbackAverage)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <Card className="border-border/70">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CircleAlert className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-sm font-semibold">Weak topic evidence</h3>
                </div>
                {weakTopics.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No weak topics have enough evidence yet.
                  </p>
                ) : (
                  <div className="mt-3 divide-y divide-border/70">
                    {weakTopics.slice(0, 6).map((topic) => (
                      <div key={`${topic.subject}-${topic.topicId}`} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">{topic.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatSubjectLabel(profile, topic.subject)}
                              {topic.latestEvidenceAt ? ` · ${formatDate(topic.latestEvidenceAt)}` : ''}
                            </p>
                          </div>
                          <Badge variant="outline">{topic.count} signals</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="p-4">
                <p className="text-sm font-semibold">Profile freshness</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Updated {formatDate(profile.updatedAt)} from questions, tutor escalation, and practice evidence.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </section>
  )
}

function SignalMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpenCheck
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  )
}

function formatRolloutState(state: string) {
  return state === 'active' ? 'Core subject support' : 'Foundation profile support'
}

function formatFeedback(value: number | null | undefined) {
  return typeof value === 'number' ? `${value.toFixed(1)}/5` : 'No score'
}

function formatSubjectLabel(profile: LearningProfile, subjectId: string) {
  const subject = profile.subjects.find((item) => item.id === subjectId)
  return subject ? i18n.t(subject.labelKey, { ns: 'chat' }) : subjectId
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value))
}
