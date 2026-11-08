/*
 * Every Murmi mood at every size it is used at (22, 28, 56, 72) and one large
 * (160), on a light page and on the sky, still and animated side by side: for
 * judging the figure and choosing where each pose goes. Dev server only: open
 * /src/dev/murmi.html. `?surface=light` or `?surface=sky` shows one background.
 *
 * Not a product screen, so its words are not translated.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { Murmi, MURMI_MOODS, type MurmiMood } from '@/components/brand/Murmi'

const SIZES = [22, 28, 56, 72, 160] as const

const NOTES: Record<MurmiMood, string> = {
  calm: 'Empty states, greetings, the quiet moments.',
  watching: 'At the telescope: a lesson is waiting.',
  delighted: 'A knowledge point has just lit.',
  thinking: 'A wrong answer: looking again, paw at the chin.',
  waving: 'Greeting: one paw raised.',
  pointing: 'Toward the star it suggests.',
  cheering: 'A whole set finished.',
  clapping: 'A star quiz passed with a slip: well done, not the big one.',
  reading: 'Loading, a lesson in progress.',
  sleeping: 'Nothing is due right now.',
  curious: 'Thinking’s lighter cousin.',
  calling: 'The alarm whistle: something needs attention.',
}

const surface = new URLSearchParams(window.location.search).get('surface')

function Row({ mood, animated }: { mood: MurmiMood; animated: boolean }) {
  return (
    <div className="flex items-end gap-4">
      <span className="w-16 shrink-0 text-[12px] opacity-70">{animated ? 'animated' : 'still'}</span>
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-1">
          <Murmi mood={mood} size={size} animated={animated} />
          <span className="text-[11px] opacity-60">{size}</span>
        </div>
      ))}
    </div>
  )
}

function Board({ sky }: { sky: boolean }) {
  return (
    <section
      data-surface={sky ? 'sky' : undefined}
      data-gallery={sky ? 'sky' : 'light'}
      className="flex flex-col gap-4 p-6"
      style={sky ? { background: 'var(--sky)', color: 'var(--on-sky-text)' } : { background: 'var(--ground)', color: 'var(--ink)' }}
    >
      <h2 className="m-0 text-[20px] font-semibold">{sky ? 'On the sky' : 'On a light page'}</h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(560px, 1fr))' }}>
        {MURMI_MOODS.map((mood) => (
          <div
            key={mood}
            className="flex flex-col gap-3 rounded-[12px] p-4"
            style={{ border: `1px solid ${sky ? 'var(--sky-glass-border)' : 'var(--separator)'}` }}
          >
            <div className="flex items-baseline gap-2">
              <strong className="text-[15px]">{mood}</strong>
              <span className="text-[13px] opacity-70">{NOTES[mood]}</span>
            </div>
            <Row mood={mood} animated={false} />
            <Row mood={mood} animated />
          </div>
        ))}
      </div>
    </section>
  )
}

function Gallery() {
  return (
    <main className="min-h-screen" style={{ fontFamily: 'var(--font-system)' }}>
      {surface !== 'sky' && <Board sky={false} />}
      {surface !== 'light' && <Board sky />}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
)
