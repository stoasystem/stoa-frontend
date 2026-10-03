/*
 * The design preview's comparison page (#115): one surface at desktop
 * 1440×900, phone 390×844 and 375×812 side by side. Dev server only; see
 * docs/agents/design-preview.md.
 *
 *   /src/dev/preview-compare.html?surface=map&points=1000            live
 *   /src/dev/preview-compare.html?mode=shots&before=a&after=b         screenshots
 *
 * `live` shows the preview itself in three frames at their real sizes,
 * scaled down to fit. `shots` shows two sets taken by
 * `scripts/capture-design-preview.mjs`, one row each, for before / after.
 *
 * Not a product screen, so its words are not translated.
 */
import { StrictMode, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { STAR_COUNTS, starCountFrom, surfaceById, SURFACES, type StarCount } from '@/dev/preview/surfaces'

const VIEWPORTS = [
  { id: 'desktop', label: 'Desktop 1440×900', width: 1440, height: 900 },
  { id: 'phone', label: 'Phone 390×844', width: 390, height: 844 },
  { id: 'narrow', label: 'Phone 375×812', width: 375, height: 812 },
] as const

const LANGUAGES = ['', 'de', 'en', 'fr', 'it'] as const
const SHOTS = '/.codex-screenshots/design-preview'
const GAP = 16

type Shot = { surface: string; viewport: string; points: number; file: string }
type ShotSet = { createdAt: string; shots: Shot[]; leaks: string[]; unanswered: string[] }
type Index = Record<string, ShotSet>

/** The height every frame is drawn at, so the three fill the window's width. */
function rowHeight(width: number) {
  const ratio = VIEWPORTS.reduce((sum, viewport) => sum + viewport.width / viewport.height, 0)
  return Math.max(240, Math.floor((width - 48 - GAP * (VIEWPORTS.length - 1)) / ratio))
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const update = () => setWidth(window.innerWidth)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return width
}

function useQueryState() {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search))
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(query)
    if (value) next.set(key, value)
    else next.delete(key)
    window.history.replaceState(null, '', `?${next.toString()}`)
    setQuery(next)
  }
  return [query, set] as const
}

const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }

function Select({ name, value, options, onChange, disabled }: {
  name: string
  value: string
  options: ReadonlyArray<readonly [string, string]>
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <label style={label}>
      {name}
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  )
}

function Frame({ viewport, height, children }: { viewport: (typeof VIEWPORTS)[number]; height: number; children: ReactNode }) {
  const scale = height / viewport.height
  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ fontSize: 12, marginBottom: 4, color: '#555' }}>{viewport.label}</figcaption>
      <div style={{ width: Math.round(viewport.width * scale), height, overflow: 'hidden', border: '1px solid #ccc', background: '#fff' }}>
        <div style={{ width: viewport.width, height: viewport.height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>{children}</div>
      </div>
    </figure>
  )
}

function Compare() {
  const [query, set] = useQueryState()
  const width = useWindowWidth()
  const [index, setIndex] = useState<Index>({})
  const mode = query.get('mode') === 'shots' ? 'shots' : 'live'
  const surface = surfaceById(query.get('surface')) ?? SURFACES[1]
  const points: StarCount = starCountFrom(query.get('points'))
  const lang = query.get('lang') ?? ''
  const height = rowHeight(width)
  const sets = Object.keys(index).sort((a, b) => index[b].createdAt.localeCompare(index[a].createdAt))

  useEffect(() => {
    fetch(`${SHOTS}/index.json`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : {}))
      .then((value: Index) => setIndex(value))
      .catch(() => setIndex({}))
  }, [])

  const previewSrc = (viewport: string) => {
    const url = new URLSearchParams({ surface: surface.id, points: String(points) })
    if (lang) url.set('lang', lang)
    // Each frame is its own page, so a frame reloads when its key changes.
    return `/src/dev/preview.html?${url.toString()}&frame=${viewport}`
  }

  /**
   * The screenshot of this surface at this size and, where the star map is on
   * screen, at exactly this star count: a missing tier is shown as missing,
   * never stood in for by another. A surface without the star map is taken
   * at one count only, which is the one it has.
   */
  const shotsFor = (set: string, viewport: string) =>
    index[set]?.shots.filter((shot) => shot.surface === surface.id && shot.viewport === viewport) ?? []
  const shotFor = (set: string, viewport: string) => {
    const shots = shotsFor(set, viewport)
    return surface.stars ? shots.find((shot) => shot.points === points) : shots[0]
  }
  const missing = (set: string, viewport: string) => {
    const taken = shotsFor(set, viewport).map((shot) => shot.points)
    if (!surface.stars || taken.length === 0) return `No screenshot of this surface at this size in “${set}”.`
    return `No ${points}-star screenshot of this surface at this size in “${set}” (taken: ${taken.join(', ')} stars).`
  }

  const row = (set: string) => (
    <section key={set} style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>
        {set} <span style={{ fontWeight: 400, color: '#666' }}>{index[set]?.createdAt ?? 'no such set'}</span>
      </h2>
      <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start' }}>
        {VIEWPORTS.map((viewport) => {
          const shot = shotFor(set, viewport.id)
          return (
            <Frame key={viewport.id} viewport={viewport} height={height}>
              {shot
                ? <img alt={`${surface.label}, ${viewport.label}`} src={`${SHOTS}/${set}/${shot.file}`} style={{ display: 'block', width: viewport.width, height: viewport.height }} />
                : <p data-missing-shot style={{ padding: 24, fontSize: 32, color: '#a33' }}>{missing(set, viewport.id)}</p>}
            </Frame>
          )
        })}
      </div>
    </section>
  )

  const setOptions = sets.map((name) => [name, name] as const)

  return (
    <main style={{ padding: 24, font: '14px/1.4 system-ui, sans-serif', color: '#1d1d1f' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <strong>Design preview</strong>
        <Select name="Mode" value={mode} options={[['live', 'Live'], ['shots', 'Screenshots']]} onChange={(value) => set('mode', value === 'live' ? '' : value)} />
        <Select name="Surface" value={surface.id} options={SURFACES.map((s) => [s.id, s.label] as const)} onChange={(value) => set('surface', value)} />
        <Select
          name="Stars"
          value={String(points)}
          options={STAR_COUNTS.map((count) => [String(count), String(count)] as const)}
          onChange={(value) => set('points', value)}
          disabled={!surface.stars}
        />
        {mode === 'live' && (
          <Select name="Language" value={lang} options={LANGUAGES.map((code) => [code, code || 'default'] as const)} onChange={(value) => set('lang', value)} />
        )}
        {mode === 'shots' && (
          <>
            <Select name="Before" value={query.get('before') ?? ''} options={[['', '—'], ...setOptions]} onChange={(value) => set('before', value)} />
            <Select name="After" value={query.get('after') ?? ''} options={[['', '—'], ...setOptions]} onChange={(value) => set('after', value)} />
          </>
        )}
        <a href={previewSrc('desktop')} target="_blank" rel="noreferrer">Open alone</a>
      </header>
      {surface.pending && <p style={{ color: '#a33' }}>{surface.pending}</p>}

      {mode === 'live' ? (
        <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start' }}>
          {VIEWPORTS.map((viewport) => (
            <Frame key={viewport.id} viewport={viewport} height={height}>
              <iframe
                key={previewSrc(viewport.id)}
                title={`${surface.label}, ${viewport.label}`}
                src={previewSrc(viewport.id)}
                width={viewport.width}
                height={viewport.height}
                style={{ border: 0, display: 'block' }}
              />
            </Frame>
          ))}
        </div>
      ) : sets.length === 0 ? (
        <p>No screenshots yet. Run <code>node scripts/capture-design-preview.mjs --label before</code> with the dev server up.</p>
      ) : (
        [query.get('before'), query.get('after')].filter((set): set is string => Boolean(set)).map(row)
      )}
    </main>
  )
}

const root = document.getElementById('root')
if (root) createRoot(root).render(<StrictMode><Compare /></StrictMode>)
