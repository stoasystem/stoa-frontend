import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { ContactTopic } from '@/services/contact/contactApi'

type ContactTopicSelectProps = {
  id: string
  value: ContactTopic
  onChange: (value: ContactTopic) => void
  disabled?: boolean
  describedBy?: string
}

const topicOptions: ContactTopic[] = [
  'learning_platform',
  'teacher_support',
  'parent_reports',
  'pricing',
  'tutor_application',
  'school_partnership',
  'technical_support',
  'other',
]

export function ContactTopicSelect({
  id,
  value,
  onChange,
  disabled,
  describedBy,
}: ContactTopicSelectProps) {
  const { t } = useTranslation('contact')

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value as ContactTopic)
  }

  return (
    <select
      id={id}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      aria-describedby={describedBy}
      className={cn(
        'flex h-10 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm ring-offset-background',
        'focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {topicOptions.map((topic) => (
        <option key={topic} value={topic}>
          {t(`topics.${topic}`)}
        </option>
      ))}
    </select>
  )
}
