/*
 * The phone bench's arithmetic (#44): what a run of frame intervals says
 * about the budget #11 set -- a steady 60 fps on a mid-range phone -- and the
 * table that goes back into the ticket. Dev only, like the page that uses it.
 *
 * "Steady 60 fps" is read as: the median frame fits one 60 Hz vsync, and no
 * more than one frame in twenty is slow (over 25 ms, a missed vsync or more).
 * An occasional hitch passes; a run that stutters throughout does not, even
 * if its average is high.
 */

/** A frame slower than this missed at least one 60 Hz vsync. */
export const SLOW_FRAME_MS = 25
/** The median frame must fit one 60 Hz vsync, with a little slack for timer jitter. */
export const MEDIAN_BUDGET_MS = 17.5
/** At most this share of frames may be slow. */
export const SLOW_SHARE_BUDGET = 0.05

export type FrameSummary = {
  frames: number
  fps: number
  p50: number
  p95: number
  worst: number
  /** Share of frames slower than `SLOW_FRAME_MS`, 0..1. */
  longShare: number
  withinBudget: boolean
}

/** Nearest-rank percentile of an ascending list. */
function percentile(sorted: number[], p: number): number {
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)]
}

export function summarizeFrames(intervals: number[]): FrameSummary {
  if (intervals.length === 0) return { frames: 0, fps: 0, p50: 0, p95: 0, worst: 0, longShare: 0, withinBudget: false }
  const sorted = [...intervals].sort((a, b) => a - b)
  const total = intervals.reduce((sum, ms) => sum + ms, 0)
  const p50 = percentile(sorted, 0.5)
  const longShare = intervals.filter((ms) => ms > SLOW_FRAME_MS).length / intervals.length
  return {
    frames: intervals.length,
    fps: (intervals.length * 1000) / total,
    p50,
    p95: percentile(sorted, 0.95),
    worst: sorted[sorted.length - 1],
    longShare,
    withinBudget: p50 <= MEDIAN_BUDGET_MS && longShare <= SLOW_SHARE_BUDGET,
  }
}

export type BenchResult = { device: string; points: number; foveate: boolean; summary: FrameSummary }

export const BENCH_SIZES = [500, 1000, 2000] as const

export function formatSummary(summary: FrameSummary): string {
  const verdict = summary.withinBudget ? '✅' : '❌'
  return `${Math.round(summary.fps)} fps · p95 ${summary.p95.toFixed(1)} ms · 慢帧 ${Math.round(summary.longShare * 100)}% ${verdict}`
}

/** The ticket's table: a row per device and foveation setting, a column per size; a later reading replaces an earlier one. */
export function benchTable(results: BenchResult[]): string {
  const rows = new Map<string, { device: string; foveate: boolean; cells: Map<number, FrameSummary> }>()
  for (const result of results) {
    const key = `${result.device}\u0000${result.foveate}`
    const row = rows.get(key) ?? { device: result.device, foveate: result.foveate, cells: new Map() }
    row.cells.set(result.points, result.summary)
    rows.set(key, row)
  }
  const lines = ['| 设备 / 浏览器 | 焦点虚化 | 500 | 1000 | 2000 |', '| --- | --- | --- | --- | --- |']
  for (const row of rows.values()) {
    const cells = BENCH_SIZES.map((size) => {
      const summary = row.cells.get(size)
      return summary ? formatSummary(summary) : '—'
    })
    lines.push(`| ${row.device} | ${row.foveate ? '开' : '关'} | ${cells.join(' | ')} |`)
  }
  return lines.join('\n')
}
