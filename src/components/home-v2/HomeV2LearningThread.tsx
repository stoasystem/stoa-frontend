import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HomeV2Reveal } from '@/components/home-v2/HomeV2Reveal'
import { HomeV2VisualFrame } from '@/components/home-v2/HomeV2VisualFrame'
import { cn } from '@/lib/utils'

type LearningBeat = {
  title: string
  body: string
}

function getBeatLayoutClass(index: number) {
  if (index === 0) return 'md:col-span-4'
  if (index === 3) return 'md:col-span-4 md:col-start-3'
  return 'md:col-span-3'
}

export function HomeV2LearningThread() {
  const { t } = useTranslation('homeV2')
  const beats = t('learningThread.beats', { returnObjects: true }) as LearningBeat[]
  const beatRefs = useRef<Array<HTMLElement | null>>([])
  const [activeBeatIndex, setActiveBeatIndex] = useState(0)
  const threadProgress = beats.length > 1 ? activeBeatIndex / (beats.length - 1) : 1
  const threadStyle = { '--home-v2-thread-progress': threadProgress } as CSSProperties

  useEffect(() => {
    const nodes = beatRefs.current.slice(0, beats.length).filter(Boolean) as HTMLElement[]
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return undefined

    let frameId = 0

    const updateActiveBeat = () => {
      const viewportAnchor = window.innerHeight * 0.46
      let nextIndex: number | null = null
      let closestDistance = Number.POSITIVE_INFINITY

      nodes.forEach((node) => {
        const rect = node.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > window.innerHeight) return

        const index = Number(node.dataset.threadIndex ?? 0)
        const cardAnchor = rect.top + rect.height * 0.38
        const distance = Math.abs(cardAnchor - viewportAnchor)

        if (distance < closestDistance) {
          closestDistance = distance
          nextIndex = index
        }
      })

      if (nextIndex !== null) {
        setActiveBeatIndex(nextIndex)
      }
    }

    const scheduleActiveBeatUpdate = () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(updateActiveBeat)
    }

    const observer = new IntersectionObserver(scheduleActiveBeatUpdate, {
      rootMargin: '-18% 0px -32% 0px',
      threshold: [0.18, 0.35, 0.52],
    })

    nodes.forEach((node) => observer.observe(node))
    scheduleActiveBeatUpdate()

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [beats.length])

  return (
    <section
      id="home-v2-learning-thread"
      data-testid="home-v2-learning-thread"
      className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 md:px-8 md:py-32 lg:grid-cols-[0.72fr_1.28fr] lg:items-start"
    >
      <HomeV2Reveal className="max-w-xl lg:sticky lg:top-32">
        <p className="inline-flex rounded-full bg-[hsl(var(--home-v2-sage)/0.09)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--home-v2-sage))] ring-1 ring-[hsl(var(--home-v2-sage)/0.16)]">
          {t('learningThread.eyebrow')}
        </p>
        <h2 className="home-v2-display mt-7 text-5xl font-medium leading-[0.9] text-[hsl(var(--home-v2-ink))] sm:text-7xl">
          {t('learningThread.title')}
        </h2>
        <p className="mt-7 text-lg leading-8 text-[hsl(var(--home-v2-ink)/0.62)]">{t('learningThread.subtitle')}</p>
      </HomeV2Reveal>

      <div className="home-v2-thread-stage" style={threadStyle}>
        <div className="home-v2-thread-rail" aria-hidden="true">
          <span className="home-v2-thread-fill" />
        </div>
        <div className="grid gap-8 md:grid-cols-6">
          {beats.map((beat, index) => (
            <HomeV2Reveal
              key={beat.title}
              delay={index * 120}
              className={cn(
                'home-v2-thread-item',
                index <= activeBeatIndex && 'is-complete',
                index === activeBeatIndex && 'is-active',
                getBeatLayoutClass(index),
              )}
            >
              <article
                ref={(node) => {
                  beatRefs.current[index] = node
                }}
                aria-current={index === activeBeatIndex ? 'step' : undefined}
                data-thread-index={index}
              >
                <span className="home-v2-thread-node" aria-hidden="true" />
                <HomeV2VisualFrame
                  label={`0${index + 1}`}
                  className={cn('home-v2-thread-card', index === 1 ? 'md:mt-24' : index === 2 ? 'md:-mt-8' : '')}
                  contentClassName="min-h-72"
                >
                  <div className="grid min-h-72 content-between p-7">
                    <div className="flex items-start justify-between gap-6">
                      <p className="home-v2-thread-index home-v2-display text-7xl leading-none">
                        0{index + 1}
                      </p>
                      <span className="home-v2-thread-spark mt-2 h-2 w-2 rounded-full" />
                    </div>
                    <div>
                      <h3 className="home-v2-display max-w-md text-3xl font-medium leading-none text-[hsl(var(--home-v2-ink))]">{beat.title}</h3>
                      <p className="mt-5 max-w-md text-sm leading-7 text-[hsl(var(--home-v2-ink)/0.6)]">{beat.body}</p>
                    </div>
                  </div>
                </HomeV2VisualFrame>
              </article>
            </HomeV2Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
