import type { TFunction } from 'i18next'

/*
 * A child's activity arrives with a type code (`practice_mistake`,
 * `teacher_help`, ...). The child page and the history list used to print the
 * code with its underscores turned into spaces, so a German parent read
 * "PRACTICE MISTAKE". Every type the backend sends (report_service,
 * routers/parents) is named in `parent:activityTypes`; a new one reads as a
 * generic "Activity" in the parent's language rather than as the raw code.
 */
export function getActivityTypeLabel(type: string | null | undefined, t: TFunction) {
  const translated = type ? t(`parent:activityTypes.${type}`, { defaultValue: '' }) : ''
  return translated || t('parent:activityTypes.unknown')
}
