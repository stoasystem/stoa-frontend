/*
 * PROTOTYPE #476 -- throwaway, lives only on branch claude/find-star-prototype-476.
 *
 * Question: a student types "I want to keep practising derivatives" into the
 * box under the star map. How should the map answer, how is that told apart
 * from an ordinary question for Ask, and what happens when nothing matches?
 *
 * Three variants on the real map and the real Ask, `?variant=A|B|C` (switch
 * with the bar bottom-left or Alt+← →; bare arrows belong to the map):
 *
 *   A  Enter decides. Typing opens Ask as on main; on send, a recognised
 *      "practise <star>" is taken out of Ask: Ask closes, the camera flies to
 *      the star, the way there lights, Murmi beside the star. Anything else
 *      is sent as a question.
 *   B  Suggest while typing. The box stays docked while typing; a star name
 *      in it puts a chip above it ("find on the map"). Enter always asks;
 *      the chip finds. The way is told in a strip above the box, not beside
 *      the star.
 *   C  Ask answers. Every message goes to Ask; when the answer comes with a
 *      target star (#472's `target_unit_id`), a card in the thread offers to
 *      show the way on the map.
 *
 * `?recognizer=local|backend` picks the stub (`recognize.ts`). `?flight=<ms>`
 * slows the camera's flights (the product's is 600 ms; here 2000 by default,
 * so the way can be followed on a recording). Assumes a
 * desktop viewport; the bar covers the map's corner on a phone.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import { recognize, wayTo, type Recognition, type Recognizer, type Way } from '@/dev/preview/findStar/recognize'
import type { StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { placeBesideStar, type Rect } from '@/features/starmap/lighting/labelPlace'
import { FindStarSeamContext, type FindStarSeam } from '@/features/starmap/findStarPrototypeSeam'
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { pathForTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { ZOOM } from '@/features/starmap/view/semanticZoom'
import { useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'

type Variant = 'A' | 'B' | 'C'
const VARIANTS: Variant[] = ['A', 'B', 'C']
const VARIANT_NAMES: Record<Variant, string> = { A: '回车分流', B: '边打边提示', C: 'Ask 来答' }
const PHRASES = [
  'I want to keep practising derivatives',
  '我想继续练导数',
  'What is a derivative?',
  'Ich will Ableitungen üben',
  'I want to practise something harder',
]

function param<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = new URLSearchParams(window.location.search).get(name)
  return (allowed as readonly string[]).includes(value ?? '') ? (value as T) : fallback
}

function writeParam(name: string, value: string) {
  const url = new URL(window.location.href)
  url.searchParams.set(name, value)
  window.history.replaceState(null, '', url)
}

// Every flight on this page, the prototype's included: slower, to be followed by eye.
;(ZOOM as { flightMs: number }).flightMs = Number(new URLSearchParams(window.location.search).get('flight')) || 2000

type Found = { way: Way; text: string; show: 'bubble' | 'strip' | 'path' }

export function FindStarPrototype({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const ownerId = useAuthStore((state) => state.user?.id) ?? null
  const [variant, setVariant] = useState<Variant>(() => param('variant', VARIANTS, 'A'))
  const [recognizer, setRecognizer] = useState<Recognizer>(() => param('recognizer', ['local', 'backend'] as const, 'local'))
  const mapRef = useRef<StarMap | null>(null)
  const [last, setLast] = useState<Recognition | null>(null)
  const [outcome, setOutcome] = useState('—')
  const [found, setFound] = useState<Found | null>(null)
  const [target, setTarget] = useState<LayerTarget | null>(null)
  const [suggest, setSuggest] = useState<Recognition | null>(null)
  const [card, setCard] = useState<{ way: Way; text: string } | null>(null)
  const [quiz, setQuiz] = useState(false)
  /** "I meant to ask": the next send of this text goes to Ask untouched. */
  const bypass = useRef<string | null>(null)

  const reset = useCallback(() => {
    setLast(null)
    setOutcome('—')
    setFound(null)
    setTarget(null)
    setSuggest(null)
    setCard(null)
    setQuiz(false)
  }, [])

  const switchTo = useCallback(
    (next: Variant) => {
      writeParam('variant', next)
      setVariant(next)
      reset()
    },
    [reset],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const at = event.target as HTMLElement | null
      if (at?.closest('input, textarea, [contenteditable="true"]')) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' || !event.altKey) return
      const step = event.key === 'ArrowRight' ? 1 : -1
      switchTo(VARIANTS[(VARIANTS.indexOf(variant) + step + VARIANTS.length) % VARIANTS.length])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [variant, switchTo])

  const run = useCallback(
    (text: string) => {
      const map = mapRef.current
      if (!map) return null
      const rec = recognize(map, text, recognizer)
      setLast(rec)
      return rec
    },
    [recognizer],
  )

  const show = useCallback((way: Way, text: string, display: Found['show']) => {
    setFound({ way, text, show: display })
    setQuiz(false)
    setTarget({ layer: 'nebula', nebulaId: way.target.nebulaId, whole: { star: way.target.unitId } })
  }, [])

  const goTo = useCallback(
    (star: Star) => {
      const map = mapRef.current
      if (!map) return
      setTarget(null)
      setFound((now) => (now ? { ...now, show: 'path' } : now))
      void navigate({ pathname: pathForTarget(subjectOfNebula(map, star.nebulaId), { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }), search })
    },
    [navigate, search],
  )

  const askInstead = useCallback(
    (text: string) => {
      bypass.current = text
      setFound(null)
      setTarget(null)
      setOutcome('改走 Ask：学生说「不是这个意思」')
      if (ownerId) useAskStore.getState().openWithDraft(ownerId, text)
    },
    [ownerId],
  )

  const close = useCallback(() => {
    setFound(null)
    setTarget(null)
  }, [])

  const actions: WayActions = { goTo, askInstead, close, quiz, toggleQuiz: () => setQuiz((on) => !on) }

  const seam = useMemo<FindStarSeam>(
    () => ({
      onMap: (map) => {
        mapRef.current = map
      },
      target,
      release: () => {
        setTarget(null)
        setFound(null)
      },
      dockedChange:
        variant === 'B'
          ? (value) => {
              const rec = value.trim() ? run(value) : null
              setSuggest(rec?.star ? rec : null)
              return true
            }
          : undefined,
      dockedSubmit:
        variant === 'B'
          ? () => {
              setSuggest(null)
              setOutcome('B：回车 = 进 Ask（草稿带过去）')
              return false
            }
          : undefined,
      askSubmit: (content) => {
        if (bypass.current === content) {
          bypass.current = null
          setOutcome('照常发给 Ask（学生选了「其实是想问」）')
          return false
        }
        if (variant === 'B') {
          setOutcome('B：Ask 里发出 = 普通提问')
          return false
        }
        const rec = run(content)
        const map = mapRef.current
        if (!rec || !map || !rec.intent || !rec.star) {
          setOutcome(`${variant}：普通提问，进 Ask 对话`)
          return false
        }
        const way = wayTo(map, rec.star)
        if (variant === 'A') {
          if (ownerId) useAskStore.getState().close()
          show(way, content, 'bubble')
          setOutcome('A：拦下，不发给 Ask；Ask 收起，镜头飞向目标星')
          return true
        }
        setCard({ way, text: content })
        setOutcome('C：问题照常发出；回答带回目标星，对话里附路径卡片')
        return false
      },
      aboveDocked:
        variant === 'B' ? (
          found?.show === 'strip' ? (
            <WayStrip found={found} actions={actions} />
          ) : suggest?.star ? (
            <SuggestChip
              rec={suggest}
              onFind={() => {
                const map = mapRef.current
                if (!map || !suggest.star) return
                if (ownerId) useAskStore.getState().setDraft(ownerId, '')
                show(wayTo(map, suggest.star), suggest.text, 'strip')
                setSuggest(null)
                setOutcome('B：点了提示条 → 找星')
              }}
            />
          ) : null
        ) : null,
      threadEnd:
        variant === 'C' && card ? (
          <PathCard
            way={card.way}
            onShow={() => {
              if (ownerId) useAskStore.getState().close()
              show(card.way, card.text, 'bubble')
              setOutcome('C：点了卡片 → Ask 收起，镜头飞向目标星')
            }}
          />
        ) : null,
      overlay: (locate, watch) =>
        found ? (
          <>
            <WayLines way={found.way} locate={locate} watch={watch} />
            {found.show === 'bubble' && <WayBubble found={found} locate={locate} actions={actions} />}
          </>
        ) : null,
    }),
    [target, variant, run, show, found, suggest, card, quiz, ownerId, goTo, askInstead, close],
  )

  return (
    <FindStarSeamContext.Provider value={seam}>
      {children}
      <PrototypeBar
        variant={variant}
        onVariant={switchTo}
        recognizer={recognizer}
        onRecognizer={(next) => {
          writeParam('recognizer', next)
          setRecognizer(next)
          reset()
        }}
        onPhrase={(phrase) => {
          if (!ownerId) return
          reset()
          if (variant === 'B') {
            useAskStore.getState().setDraft(ownerId, phrase)
            const rec = run(phrase)
            setSuggest(rec?.star ? rec : null)
          } else useAskStore.getState().openWithDraft(ownerId, phrase)
        }}
        last={last}
        outcome={outcome}
        found={found}
      />
    </FindStarSeamContext.Provider>
  )
}

type WayActions = {
  goTo: (star: Star) => void
  askInstead: (text: string) => void
  close: () => void
  quiz: boolean
  toggleQuiz: () => void
}

function wayWords(way: Way) {
  const { target, missing, from, first } = way
  const names = (stars: Star[]) => stars.map((star) => star.name).join(' → ')
  if (target.state === 'lit') return { title: `${target.name} is already lit`, body: 'Practise it again, or pick the next star after it.' }
  if (missing.length === 0) return { title: `${target.name} is ready to start`, body: 'Everything it builds on is lit.' }
  const plural = missing.length === 1 ? 'star' : 'stars'
  return {
    title: `${target.name}: ${missing.length} ${plural} to light first`,
    body: `It builds on ${names(missing)}.${from.length ? ` You have lit ${from.map((star) => star.name).join(' and ')}, so` : ' So'} begin with ${first?.name ?? missing[0].name}.`,
  }
}

function WayButtons({ found, actions }: { found: Found; actions: WayActions }) {
  const { way } = found
  const first = way.first
  return (
    <>
      {actions.quiz && (
        <p className="m-0 rounded-[8px] bg-white/10 px-2 py-1.5 text-[12px] leading-4 text-[color:var(--on-sky-text-body)]">
          A short quiz on {way.missing.map((star) => star.name).join(', ')}: pass it and they count as known, so {way.target.name} can start.
          <br />
          <span className="opacity-70">（原型：还没有测验，这里只说明会发生什么）</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
        {first && (
          <Button lift variant="onSky" size="small" onClick={() => actions.goTo(first)}>
            Start {first.name}
          </Button>
        )}
        {way.missing.length > 0 && (
          <Button variant="onSkyPlain" size="small" onClick={actions.toggleQuiz}>
            Skip with a quiz
          </Button>
        )}
        <Button variant="onSkyPlain" size="small" onClick={() => actions.goTo(way.target)}>
          Look at {way.target.name} first
        </Button>
      </div>
      <button type="button" onClick={() => actions.askInstead(found.text)} className="cursor-pointer border-0 bg-transparent p-0 text-left text-[12px] text-[color:var(--on-sky-plain)] underline underline-offset-2">
        I meant to ask Murmi something
      </button>
    </>
  )
}

const GLASS = { background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }

/** Follows `unitId` on screen every frame (prototype: no resting, no clever scheduling). */
function useSpots(ids: string[], locate: (unitId: string) => StarOnScreen | null) {
  const [spots, setSpots] = useState<Record<string, StarOnScreen | null>>({})
  const key = ids.join(',')
  useEffect(() => {
    let handle = 0
    let before = ''
    const frame = () => {
      const next: Record<string, StarOnScreen | null> = {}
      for (const id of key.split(',')) next[id] = locate(id)
      const now = JSON.stringify(Object.values(next).map((spot) => spot && [Math.round(spot.x), Math.round(spot.y), Math.round(spot.size)]))
      if (now !== before) {
        before = now
        setSpots(next)
      }
      handle = requestAnimationFrame(frame)
    }
    handle = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(handle)
  }, [key, locate])
  return spots
}

/** The way lit: gold lines along the prerequisites, numbered rings on the stars to light, a star ring on the target. */
function WayLines({ way, locate }: { way: Way; locate: (unitId: string) => StarOnScreen | null; watch: (listener: () => void) => () => void }) {
  const ids = [...way.from, ...way.missing, way.target].map((star) => star.unitId)
  const spots = useSpots(ids, locate)
  const step = new Map(way.missing.map((star, index) => [star.unitId, index + 1]))
  const lit = new Set(way.from.map((star) => star.unitId))
  return (
    <svg data-find-star-way className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="find-star-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {way.edges.map(([from, to]) => {
        const a = spots[from]
        const b = spots[to]
        if (!a || !b) return null
        return (
          <line
            key={`${from}>${to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#ffd36b"
            strokeWidth={lit.has(from) ? 2 : 3}
            strokeDasharray={lit.has(from) ? '4 5' : undefined}
            strokeLinecap="round"
            opacity={0.9}
            filter="url(#find-star-glow)"
          />
        )
      })}
      {ids.map((id) => {
        const spot = spots[id]
        if (!spot) return null
        const r = Math.max(10, spot.size / 2 + 6)
        const n = step.get(id)
        if (id === way.target.unitId)
          return <circle key={id} cx={spot.x} cy={spot.y} r={r + 4} fill="none" stroke="#ffd36b" strokeWidth={2.5} filter="url(#find-star-glow)" />
        if (lit.has(id)) return <circle key={id} cx={spot.x} cy={spot.y} r={r} fill="none" stroke="#ffd36b" strokeWidth={1.2} opacity={0.6} />
        return (
          <g key={id}>
            <circle cx={spot.x} cy={spot.y} r={r} fill="none" stroke="#ffd36b" strokeWidth={2} strokeDasharray="3 3" />
            <circle cx={spot.x + r * 0.8} cy={spot.y - r * 0.8} r={8} fill="#ffd36b" />
            <text x={spot.x + r * 0.8} y={spot.y - r * 0.8 + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1a1440">
              {n}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Variants A and C: Murmi beside the target star, as #467's first landing, kept off the way's stars and names. */
function WayBubble({ found, locate, actions }: { found: Found; locate: (unitId: string) => StarOnScreen | null; actions: WayActions }) {
  const { way } = found
  const ids = [way.target, ...way.missing, ...way.from].map((star) => star.unitId)
  const spots = useSpots(ids, locate)
  const spot = spots[way.target.unitId]
  const root = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLElement>(null)
  const words = wayWords(way)
  let at = { x: 0, y: 0 }
  if (spot && root.current && box.current) {
    // A star's name is drawn to its right: keep clear of the star and about 130 px of name.
    const clear: Rect[] = ids.flatMap((id) => {
      const s = spots[id]
      return s ? [{ x0: s.x - 18, y0: s.y - 18, x1: s.x + 140, y1: s.y + 18 }] : []
    })
    // And of the map's controls, Ask's button and the prototype's own bar.
    const origin = root.current.getBoundingClientRect()
    const own = box.current
    for (const control of document.querySelectorAll<HTMLElement>('[data-find-star-bar], [data-ask-reopen], [data-starmap-overlay]')) {
      if (control === own || own.contains(control) || control.contains(own)) continue
      const r = control.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) clear.push({ x0: r.left - origin.left, y0: r.top - origin.top, x1: r.right - origin.left, y1: r.bottom - origin.top })
    }
    const layer = { width: root.current.clientWidth, height: root.current.clientHeight }
    at = placeBesideStar(spot, { width: box.current.offsetWidth, height: box.current.offsetHeight }, spot.size / 2 + 30, layer, [...(spot.keepClear ?? []), ...clear])
  }
  return (
    <div ref={root} className="pointer-events-none absolute inset-0">
      <aside
        ref={box}
        data-starmap-overlay
        data-find-star-bubble
        className="pointer-events-auto absolute left-0 top-0 w-[320px]"
        style={{ transform: `translate(${at.x}px, ${at.y}px)`, visibility: spot ? 'visible' : 'hidden' }}
      >
        <div className="space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky" style={GLASS}>
          <div className="flex items-center gap-2">
            <Murmi mood="watching" size={32} />
            <h2 className="m-0 min-w-0 flex-1 text-[15px] font-semibold text-[color:var(--on-sky-text)]">{words.title}</h2>
            <button type="button" aria-label="Close" onClick={actions.close} className="cursor-pointer border-0 bg-transparent p-1 text-[16px] text-[color:var(--on-sky-plain)]">
              ×
            </button>
          </div>
          <p className="m-0 text-[13px] leading-5 text-[color:var(--on-sky-text-body)]">{words.body}</p>
          <WayButtons found={found} actions={actions} />
        </div>
      </aside>
    </div>
  )
}

/** Variant B: while typing, a star name puts this above the box. */
function SuggestChip({ rec, onFind }: { rec: Recognition; onFind: () => void }) {
  return (
    <div data-find-star-suggest className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-[color:var(--on-sky-text-body)]">
      <button
        type="button"
        onClick={onFind}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-solid border-[#ffd36b] bg-[rgba(255,211,107,0.14)] px-3 py-1.5 text-[13px] font-semibold text-[#ffe7a8]"
      >
        ✦ Find “{rec.star?.name}” on the map
      </button>
      <span>Enter asks Murmi</span>
    </div>
  )
}

/** Variant B: the way told in a strip above the box. */
function WayStrip({ found, actions }: { found: Found; actions: WayActions }) {
  const { way } = found
  const words = wayWords(way)
  return (
    <div data-find-star-strip className="mb-2 space-y-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] px-4 py-3 text-on-sky" style={GLASS}>
      <div className="flex items-center gap-2">
        <Murmi mood="watching" size={28} />
        <h2 className="m-0 min-w-0 flex-1 text-[14px] font-semibold text-[color:var(--on-sky-text)]">{words.title}</h2>
        <button type="button" aria-label="Close" onClick={actions.close} className="cursor-pointer border-0 bg-transparent p-1 text-[16px] text-[color:var(--on-sky-plain)]">
          ×
        </button>
      </div>
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-[12px]">
        {way.from.map((star) => (
          <li key={star.unitId} className="rounded-full bg-white/10 px-2 py-0.5 text-[color:var(--on-sky-text-body)]">
            ✓ {star.name}
          </li>
        ))}
        {way.missing.map((star, index) => (
          <li key={star.unitId} className="flex items-center gap-1.5">
            <span className="opacity-60">→</span>
            <button type="button" onClick={() => actions.goTo(star)} className="cursor-pointer rounded-full border border-dashed border-[#ffd36b] bg-transparent px-2 py-0.5 text-[#ffe7a8]">
              {index + 1} {star.name}
            </button>
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="opacity-60">→</span>
          <button type="button" onClick={() => actions.goTo(way.target)} className="cursor-pointer rounded-full border border-solid border-[#ffd36b] bg-[rgba(255,211,107,0.18)] px-2 py-0.5 font-semibold text-[#ffe7a8]">
            ★ {way.target.name}
          </button>
        </li>
      </ol>
      <WayButtons found={found} actions={actions} />
    </div>
  )
}

/** Variant C: the card under Ask's answer, from the answer's target star. */
function PathCard({ way, onShow }: { way: Way; onShow: () => void }) {
  const words = wayWords(way)
  return (
    <div data-find-star-card className="space-y-2 rounded-[12px] border border-solid border-[#ffd36b]/60 bg-[rgba(255,211,107,0.08)] px-3 py-2.5 text-[13px]">
      <p className="m-0 font-semibold text-[#ffe7a8]">★ {words.title}</p>
      <p className="m-0 text-[12px] leading-4 opacity-80">{words.body}</p>
      <Button variant="onSky" size="small" onClick={onShow}>
        Show the way on the map
      </Button>
    </div>
  )
}

/** Not part of the design: the switcher and what the prototype decided, bottom-left. */
function PrototypeBar({
  variant,
  onVariant,
  recognizer,
  onRecognizer,
  onPhrase,
  last,
  outcome,
  found,
}: {
  variant: Variant
  onVariant: (next: Variant) => void
  recognizer: Recognizer
  onRecognizer: (next: Recognizer) => void
  onPhrase: (phrase: string) => void
  last: Recognition | null
  outcome: string
  found: Found | null
}) {
  const step = (by: number) => onVariant(VARIANTS[(VARIANTS.indexOf(variant) + by + VARIANTS.length) % VARIANTS.length])
  const pill = 'cursor-pointer rounded-full border border-solid border-black/20 bg-white px-2 py-0.5 text-[11px] text-black'
  return (
    <div
      data-find-star-bar
      className="fixed bottom-3 left-3 z-[2147483000] w-[300px] space-y-2 rounded-[12px] bg-white/95 p-3 text-[12px] leading-4 text-black shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={pill} onClick={() => step(-1)} aria-label="上一个变体">
          ←
        </button>
        <strong className="text-[13px]">
          原型 #476 · {variant} {VARIANT_NAMES[variant]}
        </strong>
        <button type="button" className={pill} onClick={() => step(1)} aria-label="下一个变体">
          →
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <span>识别桩：</span>
        {(['local', 'backend'] as const).map((key) => (
          <button key={key} type="button" className={pill} style={recognizer === key ? { background: '#1a1440', color: '#fff' } : undefined} onClick={() => onRecognizer(key)}>
            {key === 'local' ? '本地星名' : '模拟后端'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {PHRASES.map((phrase) => (
          <button key={phrase} type="button" className={pill} onClick={() => onPhrase(phrase)}>
            {phrase}
          </button>
        ))}
      </div>
      <dl data-find-star-state className="m-0 grid grid-cols-[44px_1fr] gap-x-2 gap-y-1 border-t border-solid border-black/10 pt-2">
        <dt className="opacity-60">输入</dt>
        <dd className="m-0">{last?.text ?? '—'}</dd>
        <dt className="opacity-60">判断</dt>
        <dd className="m-0">{last?.why ?? '—'}</dd>
        <dt className="opacity-60">结果</dt>
        <dd className="m-0">{outcome}</dd>
        <dt className="opacity-60">路径</dt>
        <dd className="m-0">
          {found
            ? `${found.way.from.map((star) => star.name).join(' + ') || '（无）'} ⇒ ${found.way.missing.map((star) => star.name).join(' → ') || '（无缺）'} ⇒ ★${found.way.target.name}`
            : '—'}
        </dd>
      </dl>
    </div>
  )
}
