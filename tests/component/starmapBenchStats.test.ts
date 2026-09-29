/**
 * The phone bench's arithmetic (#44): what a run of frame intervals says
 * about the 60 fps budget (#11), and the table that goes back into the
 * ticket. The page that collects the intervals is dev-only and driven by
 * hand; this is the part that decides pass or fail, so it is pinned here.
 */
import { describe, expect, it } from 'vitest'
import { benchTable, summarizeFrames, type BenchResult } from '@/dev/benchStats'

const steady = (ms: number, n: number) => Array.from({ length: n }, () => ms)

describe('a run of frame intervals', () => {
  it('reads a steady 60 Hz run as 60 fps, within budget', () => {
    const summary = summarizeFrames(steady(1000 / 60, 600))
    expect(summary.frames).toBe(600)
    expect(summary.fps).toBeCloseTo(60, 5)
    expect(summary.p50).toBeCloseTo(16.67, 1)
    expect(summary.longShare).toBe(0)
    expect(summary.withinBudget).toBe(true)
  })

  it('fails a run whose median frame is 30 fps', () => {
    const summary = summarizeFrames(steady(1000 / 30, 300))
    expect(summary.fps).toBeCloseTo(30, 5)
    expect(summary.longShare).toBe(1)
    expect(summary.withinBudget).toBe(false)
  })

  it('fails a run that is fast on average but drops more than one frame in twenty', () => {
    // 90% smooth, 10% of frames a missed vsync (33 ms).
    const intervals = [...steady(1000 / 60, 540), ...steady(1000 / 30, 60)]
    const summary = summarizeFrames(intervals)
    expect(summary.p50).toBeCloseTo(16.67, 1)
    expect(summary.longShare).toBeCloseTo(0.1, 5)
    expect(summary.withinBudget).toBe(false)
  })

  it('passes a run with an occasional hitch', () => {
    const intervals = [...steady(1000 / 60, 590), ...steady(40, 10)]
    const summary = summarizeFrames(intervals)
    expect(summary.worst).toBe(40)
    expect(summary.withinBudget).toBe(true)
  })

  it('takes the 95th percentile by nearest rank', () => {
    const intervals = Array.from({ length: 100 }, (_, i) => i + 1)
    expect(summarizeFrames(intervals).p95).toBe(95)
  })

  it('says nothing is within budget when no frame was measured', () => {
    const summary = summarizeFrames([])
    expect(summary.frames).toBe(0)
    expect(summary.withinBudget).toBe(false)
  })
})

describe('the table for the ticket', () => {
  const result = (device: string, points: number, foveate: boolean, ms: number): BenchResult => ({
    device,
    points,
    foveate,
    summary: summarizeFrames(steady(ms, 300)),
  })

  it('puts one row per device and foveation setting, one column per size', () => {
    const table = benchTable([
      result('iPhone 12 · Safari', 500, true, 1000 / 60),
      result('iPhone 12 · Safari', 2000, true, 1000 / 30),
      result('iPhone 12 · Safari', 500, false, 1000 / 60),
    ])
    const lines = table.split('\n')
    expect(lines[0]).toBe('| 设备 / 浏览器 | 焦点虚化 | 500 | 1000 | 2000 |')
    expect(lines[1]).toBe('| --- | --- | --- | --- | --- |')
    expect(lines[2]).toBe('| iPhone 12 · Safari | 开 | 60 fps · p95 16.7 ms · 慢帧 0% ✅ | — | 30 fps · p95 33.3 ms · 慢帧 100% ❌ |')
    expect(lines[3]).toBe('| iPhone 12 · Safari | 关 | 60 fps · p95 16.7 ms · 慢帧 0% ✅ | — | — |')
    expect(lines).toHaveLength(4)
  })

  it('keeps the latest reading when a cell was measured twice', () => {
    const table = benchTable([result('Pixel 6a · Chrome', 1000, true, 1000 / 30), result('Pixel 6a · Chrome', 1000, true, 1000 / 60)])
    expect(table.split('\n')[2]).toContain('| 60 fps')
  })
})
