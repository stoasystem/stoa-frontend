import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import type { BreadcrumbItem } from '@/components/common/Breadcrumbs'

/*
 * A child's pages opened from Reports carry `?from=reports` (#411): the bar
 * keeps Reports lit (its manifest entry's `from`), the breadcrumb starts at
 * Reports, and Back leads there, not to Overview or the child's summary. A
 * page opened from Overview, or with no marker, is Overview's, as before.
 */
export const FROM_REPORTS = 'reports'
const REPORTS_PATH = '/parent/reports'

/** `path`, marked as opened from Reports. */
export function fromReports(path: string) {
  return `${path}?from=${FROM_REPORTS}`
}

export function useReportsTrail() {
  const { t } = useTranslation('parent')
  const [params] = useSearchParams()
  const onTrail = params.get('from') === FROM_REPORTS
  const reports = { label: t('reports.title'), to: REPORTS_PATH }
  return {
    /** The breadcrumb's first item: Reports, or the page's own. */
    root: (own: BreadcrumbItem): BreadcrumbItem => (onTrail ? reports : own),
    /** Where Back leads: Reports, or the page's own way. */
    back: (own: { label: string; to: string }) => (onTrail ? reports : own),
    /** A link to another of the child's pages, kept on the trail. */
    keep: (path: string) => (onTrail ? fromReports(path) : path),
  }
}
