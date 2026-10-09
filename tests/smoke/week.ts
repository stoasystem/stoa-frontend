/**
 * The week the most recent Monday report run wrote (#8, item 7).
 *
 * The job runs Mondays at 06:00 Europe/Zurich and reports the previous Zurich
 * calendar week (`previous_zurich_week_start` in the backend's
 * jobs/weekly_reports.py). Before 06:00 on a Monday the latest run is the one
 * a week earlier. `settling` is set for the two hours after a run, when the
 * reports may still be being written.
 */
export function expectedReportWeek(now: Date): { weekStart: string; runDate: string; settling: boolean } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Zurich',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday)
  const hour = Number(parts.hour)
  const localDay = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
  const DAY = 86_400_000
  const thisMonday = localDay - weekday * DAY
  const beforeRun = weekday === 0 && hour < 6
  const runDay = beforeRun ? thisMonday - 7 * DAY : thisMonday
  const iso = (value: number) => new Date(value).toISOString().slice(0, 10)
  return {
    weekStart: iso(runDay - 7 * DAY),
    runDate: iso(runDay),
    settling: weekday === 0 && hour >= 6 && hour < 8,
  }
}
