import { useTranslation } from 'react-i18next'
import { Group, Row } from '@/components/base/Group'
import { Toggle } from '@/components/base/Toggle'
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from '@/hooks/notifications/useNotificationPreferences'
import type { NotificationPreferenceCategory, NotificationPreferenceMatrix } from '@/types/notification'

/*
 * The categories a student's bell actually receives today. The backend sends
 * a student `teacher_takeover` and `teacher_reply`, both in
 * `teacher_responses`; nothing it sends a student falls in the other
 * categories yet, so a switch for them would switch nothing.
 */
const STUDENT_CATEGORIES: readonly NotificationPreferenceCategory[] = ['teacher_responses']

/*
 * One switch per category: whether it reaches the bell. It sets `in_app`
 * (off: the backend files the event as archived, so it never shows as new)
 * and `realtime` (the live push that makes the bell light up) together; a
 * live push for an event the bell hides would be noise. E-mail digests and
 * phone push have no delivery the app can offer yet, so they are not shown.
 */
function withCategory(
  matrix: NotificationPreferenceMatrix,
  category: NotificationPreferenceCategory,
  enabled: boolean,
): NotificationPreferenceMatrix {
  return { ...matrix, [category]: { ...matrix[category], in_app: enabled, realtime: enabled } }
}

export function NotificationPreferencesGroup() {
  const { t } = useTranslation('common')
  const query = useNotificationPreferencesQuery()
  const update = useUpdateNotificationPreferencesMutation()
  const categories = STUDENT_CATEGORIES.filter(
    (category) => !query.data || query.data.supportedCategories.includes(category),
  )

  return (
    <div className="flex flex-col gap-2">
      <Group title={t('me.notifications.heading')}>
        {query.isLoading && <Row compact title={t('me.notifications.loading')} />}
        {query.isError && <Row compact title={t('me.notifications.unavailable')} />}
        {query.data &&
          categories.map((category) => {
            const enabled = query.data.preferences[category]?.in_app !== false
            const titleId = `notification-preference-${category}`
            return (
              <Row
                key={category}
                title={<span id={titleId}>{t(`me.notifications.categories.${category}.title`)}</span>}
                subtitle={t(`me.notifications.categories.${category}.body`)}
                trailing={
                  <Toggle
                    checked={enabled}
                    aria-labelledby={titleId}
                    disabled={update.isPending}
                    onCheckedChange={(next) => update.mutate(withCategory(query.data.preferences, category, next))}
                  />
                }
              />
            )
          })}
      </Group>
      {update.isError && (
        <p className="m-0 px-4 text-[13px] leading-[1.35] text-red" role="alert">
          {t('me.notifications.saveFailed')}
        </p>
      )}
    </div>
  )
}
