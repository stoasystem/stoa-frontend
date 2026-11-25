import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { SegmentedFilter } from '@/components/base'
import { readWindow } from '@/components/admin/systemHealth/format'
import { DEFAULT_SYSTEM_WINDOW, SYSTEM_WINDOWS, type SystemWindow } from '@/services/admin/systemHealthApi'

/** The window lives in `?window=`, so a card link and a reload keep it. */
export function useWindowParam() {
  const [params, setParams] = useSearchParams()
  const window = readWindow(params.get('window')) ?? DEFAULT_SYSTEM_WINDOW
  const setWindow = useCallback(
    (next: SystemWindow) =>
      setParams(
        (current) => {
          const updated = new URLSearchParams(current)
          updated.set('window', next)
          return updated
        },
        { replace: true },
      ),
    [setParams],
  )
  return [window, setWindow] as const
}

export function WindowSwitch({ value, onChange }: { value: SystemWindow; onChange: (value: SystemWindow) => void }) {
  const { t } = useTranslation('admin')
  return (
    <SegmentedFilter
      label={t('systemHealth.windowLabel')}
      value={value}
      onChange={onChange}
      options={SYSTEM_WINDOWS.map((window) => ({ value: window, label: t(`systemHealth.window.${window}`) }))}
    />
  )
}
