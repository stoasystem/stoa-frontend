/*
 * Which Murmi stands on each answer style's card (stoa-backend#314, the
 * selector is #597). The style's name and description come from the backend;
 * this knows only the codes it has a picture for. A code it has never heard of
 * (the backend may add styles before the frontend catches up) gets the quiet
 * default rather than nothing.
 */
import type { MurmiMood } from '@/components/brand/Murmi'

const MOOD_BY_STYLE: ReadonlyMap<string, MurmiMood> = new Map([
  ['standard', 'calm'],
  ['concise', 'steps'],
  ['encouraging', 'offering'],
  ['vivid', 'storytelling'],
])

export function answerStyleMurmiMood(code: string | null | undefined): MurmiMood {
  return (code && MOOD_BY_STYLE.get(code)) || 'calm'
}
