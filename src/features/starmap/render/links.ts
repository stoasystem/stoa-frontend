/*
 * The connection lines on the canvas (#121): every line the star map draws
 * between nebulae and between stars, in one place. `model/linkTiers.ts`
 * decides how strongly each is drawn; this module only turns that into
 * strokes, and is the one call the Canvas 2D renderer makes for them.
 *
 *   far out   soft bridges between related nebulae of one galaxy, and a
 *             faint glow at the edges of the dark between two galaxies that
 *             share prerequisites; a focused nebula's bridges brighten, its
 *             bridges to other galaxies appear.
 *   closer    star-to-star lines of every star on screen, each tier fading
 *             in at its own zoom (#134); a line to another nebula fades out
 *             near its own star (direction only), and from the chosen
 *             nebula the nebula it leads to is named at the screen's edge
 *             when it is off screen -- with its subject when that is another one.
 *   a star    chosen: its own lines, all four tiers, drawn to the other star.
 *
 * Seam (#120): x wraps, `x mod 1`, galaxies on a ring. A line between two
 * points always takes the shorter way round (`shortestDx`), anchored on one
 * end's screen position, so it is right whichever copy of that end is
 * drawn. With `wrap`, every shape is also drawn one band to the left and
 * right, where the other copies are.
 */
import { LEARNING_STATES } from '@/features/starmap/model/starMap'
import { linkWeight } from '@/features/starmap/model/links'
import {
  bridgeLook,
  galaxyHintLook,
  linkTier,
  starLineLook,
  TIER_LOCKED,
  TIER_RECOMMENDED,
  type LinkTier,
  type LinkView,
  type NebulaBridge,
  type StarLine,
} from '@/features/starmap/model/linkTiers'
import { boxHitsCircle, placeLabel, type Box, type Circle, type Segment } from '@/features/starmap/render/labels'
import type { LinkInk, SceneData, SceneFrame, StarMapTheme } from '@/features/starmap/render/types'

/**
 * The inks, as the `--starmap-link-*` / `--starmap-bridge` sky tokens define
 * them (`src/styles/brand-tokens.css`); used until the theme is read.
 */
export const LINK_INK: LinkInk = {
  recommended: 'rgba(242, 197, 114, 0.9)',
  inProgress: 'rgba(255, 255, 255, 0.5)',
  walked: 'rgba(255, 255, 255, 0.16)',
  locked: 'rgba(255, 255, 255, 0.3)',
  bridge: 'rgba(170, 190, 255, 0.07)',
}

/** Stroke shapes, CSS px. */
export const LINE = {
  width: { 1: 2, 2: 1.5, 3: 1, 4: 1 } as Record<LinkTier, number>,
  /** Tier 1's warm halo under the line. */
  glow: { width: 7, alpha: 0.16 },
  /** Tier 4: dashed. */
  dash: [3, 4] as readonly number[],
  /** A line leaving the chosen nebula fades out over this share of its radius on screen, at least `fadeMin` px. */
  fade: 0.4,
  fadeMin: 48,
} as const

/** A bridge between nebulae: trimmed this far into each cloud (share of radius), its width, and its soft passes. */
export const BRIDGE = {
  trim: 0.55,
  /** Share of the smaller radius, clamped. */
  width: 0.45,
  minWidth: 10,
  maxWidth: 56,
  /** Beads of light along it: spaced this share of its width apart, at most this many, each this share of the ink. */
  spacing: 0.35,
  maxBeads: 48,
  beadAlpha: 0.6,
  /** Where it runs through a third nebula's core. */
  inside: 0.25,
  /** Clouds closer than this (px, rim to rim after the trim) need no bridge: they touch. */
  minLength: 28,
} as const

/** The glow between two galaxies: how far into the gap it reaches (share of the gap) and how tall (share of the galaxy). */
export const HINT = { offset: 0.16, rx: 0.3, ry: 0.32, alpha: 1.6 } as const

/** A dragged star's lines, lit (#136): this wide, in the in-progress ink at this strength (gold into the recommended star). */
const DRAG_LINE_WIDTH = 1.6
const DRAG_LINE_INK = 1.4

/** What the lines took in the last frame (tests, and the acceptance count of #121). */
export type LinkStats = { bridges: number; hints: number; lines: number; labels: number; dragLabels: number }

/** The obstacles names must keep clear of: the renderer's own lists, added to. */
export type LinkObstacles = { segments: Segment[]; boxes: Box[] }

export type LinkOptions = {
  /** x wraps (#120): also draw each shape one band to either side. */
  wrap?: boolean
}

/** `xb - xa` the shorter way round a band of width 1: in [-0.5, 0.5). */
export function shortestDx(xa: number, xb: number): number {
  return ((((xb - xa + 0.5) % 1) + 1) % 1) - 0.5
}

/** A soft bridge's axis between two nebula discs on screen, trimmed into each cloud; null if they are too close. */
export function bridgeAxis(a: Circle, b: Circle): Segment | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.hypot(dx, dy)
  const ra = a.r * BRIDGE.trim
  const rb = b.r * BRIDGE.trim
  if (d <= ra + rb + BRIDGE.minLength) return null
  return { x0: a.x + (dx / d) * ra, y0: a.y + (dy / d) * ra, x1: b.x - (dx / d) * rb, y1: b.y - (dy / d) * rb }
}

type Hint = { a: number; b: number; nebulae: [number[], number[]] }

type Prepared = {
  lines: StarLine[]
  /** Galaxy of each nebula, or -1 (not one sky). */
  galaxyOf: Int16Array
  bridges: NebulaBridge[]
  hints: Hint[]
}

const prepared = new WeakMap<SceneData, Prepared>()

function prepare(scene: SceneData): Prepared {
  const hit = prepared.get(scene)
  if (hit) return hit
  const galaxyOf = new Int16Array(scene.nebulae.length).fill(-1)
  scene.galaxies?.forEach((galaxy, g) => galaxy.nebulae.forEach((n) => (galaxyOf[n] = g)))
  const recommended = new Set(scene.recommendations ?? (scene.recommended >= 0 ? [scene.recommended] : []))
  const lines: StarLine[] = []
  for (const { from, to } of scene.starLinks) {
    if (from === to || from < 0 || to < 0 || from >= scene.count || to >= scene.count) continue
    const line: StarLine = {
      from,
      to,
      fromNebula: scene.nebula[from],
      toNebula: scene.nebula[to],
      tier: linkTier(LEARNING_STATES[scene.state[from]], LEARNING_STATES[scene.state[to]], recommended.has(to)),
    }
    lines.push(line)
  }
  const bridges: NebulaBridge[] = scene.links.map((link) => ({
    ...link,
    crossGalaxy: galaxyOf[link.a] >= 0 && galaxyOf[link.b] >= 0 && galaxyOf[link.a] !== galaxyOf[link.b],
  }))
  const hints = new Map<string, Hint>()
  for (const bridge of bridges) {
    if (!bridge.crossGalaxy) continue
    const [a, b] = [galaxyOf[bridge.a], galaxyOf[bridge.b]]
    const [ga, na, gb, nb] = a < b ? [a, bridge.a, b, bridge.b] : [b, bridge.b, a, bridge.a]
    const key = `${ga}:${gb}`
    const hint = hints.get(key) ?? { a: ga, b: gb, nebulae: [[], []] as [number[], number[]] }
    if (!hint.nebulae[0].includes(na)) hint.nebulae[0].push(na)
    if (!hint.nebulae[1].includes(nb)) hint.nebulae[1].push(nb)
    hints.set(key, hint)
  }
  const made = { lines, galaxyOf, bridges, hints: [...hints.values()] }
  prepared.set(scene, made)
  return made
}

/** `#RRGGBB` or `rgb[a]()` as rgba, its alpha multiplied by `alpha`. */
function fade(color: string, alpha: number): string {
  const value = color.trim()
  let [r, g, b, a] = [255, 255, 255, 1]
  if (value.startsWith('#')) {
    const hex = value.length === 4 ? value.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') : value
    ;[r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16))
  } else {
    const parts = value.match(/[\d.]+/g)?.map(Number) ?? []
    if (parts.length >= 3) [r, g, b] = parts
    if (parts.length >= 4) a = parts[3]
  }
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a * alpha))})`
}

const inkOf = (ink: LinkInk, tier: LinkTier) =>
  tier === TIER_RECOMMENDED ? ink.recommended : tier === 2 ? ink.inProgress : tier === 3 ? ink.walked : ink.locked

/**
 * Draw every connection line of this frame. Shapes names must avoid go into
 * `obstacles` (the bridges, the tier 1-2 lines and the focused star's lines,
 * and the boxes of the names this draws). Returns what it drew.
 */
export function drawLinks(
  ctx: CanvasRenderingContext2D,
  scene: SceneData,
  frame: SceneFrame,
  theme: StarMapTheme,
  obstacles: LinkObstacles,
  options: LinkOptions = {},
): LinkStats {
  const stats: LinkStats = { bridges: 0, hints: 0, lines: 0, labels: 0, dragLabels: 0 }
  const ink = theme.links ?? LINK_INK
  const data = prepare(scene)
  const { width, height } = frame.viewport
  const view: LinkView = {
    bridges: frame.lineReveal.bridges,
    tiers: frame.lineReveal.tiers,
    star: frame.starFocus ?? 0,
    chosen: frame.chosenNebula,
    focusStar: frame.focusStar,
    dragStar: frame.drag?.star ?? -1,
    drag: frame.drag?.amount ?? 0,
  }
  const dragStar = view.dragStar ?? -1
  const drag = dragStar >= 0 ? (view.drag ?? 0) : 0
  // How far a star is from its place (#136): a line between moved stars runs between where they are drawn.
  const offX = frame.drag?.offsetX
  const periods = options.wrap ? [0, -1, 1] : [0]
  const band = frame.scale
  const onScreen = (x0: number, y0: number, x1: number, y1: number, pad: number) =>
    Math.max(x0, x1) + pad > 0 && Math.min(x0, x1) - pad < width && Math.max(y0, y1) + pad > 0 && Math.min(y0, y1) - pad < height

  ctx.save()
  ctx.lineCap = 'round'
  ctx.setLineDash([])

  // ---- The panorama: bridges between nebulae, glows between galaxies ----
  if (view.bridges > 0) {
    const focus = frame.highlightNebula >= 0 ? frame.highlightNebula : frame.chosenNebula >= 0 ? frame.chosenNebula : (frame.hoveredNebula ?? -1)
    const cores: Circle[] = scene.nebulae.map((_, n) => ({ x: frame.nebulaX[n], y: frame.nebulaY[n], r: frame.nebulaR[n] * 0.6 }))

    for (const hint of data.hints) {
      const bridged = focus >= 0 && data.bridges.some((b) => b.crossGalaxy && (b.a === focus || b.b === focus) &&
        [data.galaxyOf[b.a], data.galaxyOf[b.b]].includes(hint.a) && [data.galaxyOf[b.a], data.galaxyOf[b.b]].includes(hint.b))
      const strength = galaxyHintLook(bridged, view)
      if (strength <= 0.001 || !scene.galaxies) continue
      let drawn = false
      for (const side of [0, 1] as const) {
        const own = scene.galaxies[side === 0 ? hint.a : hint.b]
        const other = scene.galaxies[side === 0 ? hint.b : hint.a]
        const dir = Math.sign(shortestDx((own.x0 + own.x1) / 2, (other.x0 + other.x1) / 2)) || 1
        const edge = dir > 0 ? own.x1 : own.x0
        const gap = Math.abs(shortestDx(edge, dir > 0 ? other.x0 : other.x1))
        const ys = hint.nebulae[side].map((n) => scene.nebulae[n].y)
        const cy = ys.reduce((sum, y) => sum + y, 0) / Math.max(1, ys.length)
        const rx = gap * HINT.rx * band
        const ry = Math.max(rx * 0.6, (own.y1 - own.y0) * HINT.ry * band)
        for (const k of periods) {
          const x = frame.ox + (edge + dir * gap * HINT.offset + k) * band
          const y = frame.oy + cy * band
          if (!onScreen(x - rx, y - ry, x + rx, y + ry, 0)) continue
          ctx.save()
          ctx.translate(x, y)
          ctx.scale(rx, ry)
          const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
          glow.addColorStop(0, fade(ink.bridge, 1))
          glow.addColorStop(1, fade(ink.bridge, 0))
          ctx.globalAlpha = Math.min(1, strength * HINT.alpha) * (own.dim ?? 1)
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(0, 0, 1, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
          drawn = true
        }
      }
      if (drawn) stats.hints += 1
    }

    for (const bridge of data.bridges) {
      const strength = bridgeLook(bridge, focus, view)
      if (strength <= 0.001) continue
      const { a, b } = bridge
      const dx = shortestDx(scene.nebulae[a].x, scene.nebulae[b].x) * band
      const dim = Math.min(scene.nebulae[a].dim ?? 1, scene.nebulae[b].dim ?? 1)
      const others = cores.filter((_, n) => n !== a && n !== b)
      let drawn = false
      // One unit disc of light, scaled to each bead: a single gradient for the whole bridge.
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
      glow.addColorStop(0, fade(ink.bridge, 1))
      glow.addColorStop(0.5, fade(ink.bridge, 0.5))
      glow.addColorStop(1, fade(ink.bridge, 0))
      for (const k of periods) {
        const axis = bridgeAxis(
          { x: frame.nebulaX[a] + k * band, y: frame.nebulaY[a], r: frame.nebulaR[a] },
          { x: frame.nebulaX[a] + dx + k * band, y: frame.nebulaY[b], r: frame.nebulaR[b] },
        )
        const w = Math.max(BRIDGE.minWidth, Math.min(BRIDGE.maxWidth, Math.min(frame.nebulaR[a], frame.nebulaR[b]) * BRIDGE.width)) *
          (linkWeight(bridge.count).width / linkWeight(1).width)
        if (!axis || !onScreen(axis.x0, axis.y0, axis.x1, axis.y1, w)) continue
        // A row of soft beads of light: soft at the sides, fading in out of one
        // cloud and out into the next, so it melts into the star dust.
        const length = Math.hypot(axis.x1 - axis.x0, axis.y1 - axis.y0)
        const beads = Math.max(3, Math.min(BRIDGE.maxBeads, Math.ceil(length / (w * BRIDGE.spacing))))
        const shifted = k === 0 ? others : others.map((c) => ({ ...c, x: c.x + k * band }))
        ctx.fillStyle = glow
        for (let i = 0; i <= beads; i += 1) {
          const t = i / beads
          const envelope = Math.sin(Math.PI * t) ** 1.5
          if (envelope <= 0.01) continue
          const bx = axis.x0 + (axis.x1 - axis.x0) * t
          const by = axis.y0 + (axis.y1 - axis.y0) * t
          const r = (w / 2) * (0.6 + 0.4 * envelope)
          if (!onScreen(bx, by, bx, by, r)) continue
          const crossing = shifted.some((c) => Math.hypot(bx - c.x, by - c.y) < c.r) ? BRIDGE.inside : 1
          ctx.globalAlpha = Math.min(1, strength * envelope * crossing * dim * BRIDGE.beadAlpha)
          ctx.save()
          ctx.translate(bx, by)
          ctx.scale(r, r)
          ctx.beginPath()
          ctx.arc(0, 0, 1, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        obstacles.segments.push(axis)
        drawn = true
      }
      if (drawn) stats.bridges += 1
    }
  }

  // ---- Closer in: lines between stars, each tier by zoom ----
  const anyLines = view.tiers.some((tier) => tier > 0.001) || (view.star > 0.001 && view.focusStar >= 0) || drag > 0.001
  if (anyLines) {
    const trim = Math.max(frame.glyphSize * 0.5, frame.dotRadius * 2) + 2
    const fadeOf = (n: number) => Math.max(LINE.fadeMin, (frame.nebulaR[n] ?? 0) * LINE.fade)
    /** Other nebulae a drawn line from the chosen one leads to: the strongest line to each, and (focused) where it runs. */
    const leadsTo = new Map<number, { strength: number; along: { x: number; y: number; ux: number; uy: number; d: number } | null }>()
    const ends: [number, number][] = []
    for (const line of data.lines) {
      const { strength, reach, lit } = starLineLook(line, view)
      if (strength <= 0.001) continue
      // Anchored on the dragged star, else the focused star, else on the end in the chosen nebula;
      // a line between two other nebulae is drawn from both ends, each fading out.
      ends.length = 0
      if (lit > 0) {
        ends.push(line.to === dragStar ? [line.to, line.from] : [line.from, line.to])
      } else if (view.focusStar >= 0 && (line.from === view.focusStar || line.to === view.focusStar)) {
        ends.push(line.to === view.focusStar ? [line.to, line.from] : [line.from, line.to])
      } else if (view.chosen >= 0 && (line.fromNebula === view.chosen || line.toNebula === view.chosen)) {
        ends.push(line.fromNebula === view.chosen ? [line.from, line.to] : [line.to, line.from])
      } else {
        ends.push([line.from, line.to])
        if (line.fromNebula !== line.toNebula) ends.push([line.to, line.from])
      }
      let drawn = false
      for (const [p, q] of ends) {
        const pNebula = scene.nebula[p]
        const qNebula = scene.nebula[q]
        const leaves = qNebula !== pNebula
        const px = frame.x[p]
        const py = frame.y[p]
        const qx = px + shortestDx(scene.mapX[p], scene.mapX[q]) * band + (offX ? offX[q] - offX[p] : 0)
        const qy = frame.y[q]
        const d = Math.hypot(qx - px, qy - py)
        if (d <= trim * 2) continue
        const ux = (qx - px) / d
        const uy = (qy - py) / d
        const full = d - trim * 2
        const fadeLength = fadeOf(pNebula)
        const length = leaves ? Math.min(full, fadeLength + reach * Math.max(0, full - fadeLength)) : full
        const color = inkOf(ink, line.tier)
        const lineWidth = LINE.width[line.tier]
        let seen = false
        for (const k of periods) {
          const x0 = px + ux * trim + k * band
          const y0 = py + uy * trim
          const x1 = x0 + ux * length
          const y1 = y0 + uy * length
          if (!onScreen(x0, y0, x1, y1, 8)) continue
          const faded = leaves && reach < 0.999
          let stroke: string | CanvasGradient = color
          if (faded) {
            const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
            gradient.addColorStop(0, fade(color, 1))
            gradient.addColorStop(1, fade(color, reach))
            stroke = gradient
          }
          if (line.tier === TIER_RECOMMENDED) {
            ctx.setLineDash([])
            ctx.strokeStyle = faded ? stroke : fade(color, 1)
            ctx.globalAlpha = strength * LINE.glow.alpha
            ctx.lineWidth = LINE.glow.width
            ctx.beginPath()
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y1)
            ctx.stroke()
          }
          ctx.setLineDash(line.tier === TIER_LOCKED ? [...LINE.dash] : [])
          ctx.strokeStyle = stroke
          ctx.globalAlpha = Math.min(1, strength)
          ctx.lineWidth = lineWidth
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
          ctx.stroke()
          if (lit > 0.001) {
            // A dragged star's line lights up whatever its tier: a bright solid
            // stroke over it (gold into the recommended star), eased in and out.
            ctx.setLineDash([])
            ctx.strokeStyle = line.tier === TIER_RECOMMENDED ? fade(ink.recommended, 1) : fade(ink.inProgress, DRAG_LINE_INK)
            ctx.globalAlpha = Math.min(1, lit)
            ctx.lineWidth = DRAG_LINE_WIDTH
            ctx.beginPath()
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y1)
            ctx.stroke()
          }
          seen = true
          // Names keep clear of what carries the message now; the faint path walked may run under them.
          if (strength >= 0.5 && (line.tier <= 2 || reach > 0)) obstacles.segments.push({ x0, y0, x1, y1 })
        }
        if (!seen) continue
        drawn = true
        if (!leaves || view.chosen < 0 || (pNebula !== view.chosen && p !== view.focusStar)) continue
        const known = leadsTo.get(qNebula)
        if (strength >= 0.5 && (!known || strength > known.strength || (reach > 0 && !known.along))) {
          leadsTo.set(qNebula, { strength, along: reach > 0 ? { x: px, y: py, ux, uy, d } : known?.along ?? null })
        }
      }
      if (drawn) stats.lines += 1
    }
    ctx.setLineDash([])

    // Where those lines lead: a nebula off screen is named at the edge, in
    // its direction; one in another galaxy also says which subject it is in.
    // While a star is dragged, its own destinations (below) take over.
    // One set of names at a time: the nebulae's in the first half of the
    // emphasis, the dragged star's destinations in the second, never both.
    const labelAlpha = Math.max(view.tiers[1] ?? 0, view.star) * Math.max(0, Math.min(1, 1 - 2 * drag))
    if (leadsTo.size > 0 && labelAlpha > 0.01 && view.chosen >= 0) {
      const top = frame.viewport.top ?? 0
      const bottom = height - (frame.viewport.bottom ?? 0)
      const area: Box = { x0: 0, y0: top, x1: width, y1: bottom }
      const cx = frame.nebulaX[view.chosen]
      const cy = frame.nebulaY[view.chosen]
      ctx.font = `500 12px ${theme.fontFamily}`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      for (const n of [...leadsTo.keys()].sort((m, o) => leadsTo.get(o)!.strength - leadsTo.get(m)!.strength || m - o)) {
        const g = data.galaxyOf[n]
        const crosses = g >= 0 && g !== data.galaxyOf[view.chosen]
        const subject = crosses ? scene.galaxies?.[g]?.name : undefined
        const nx = cx + shortestDx(scene.nebulae[view.chosen].x, scene.nebulae[n].x) * band
        const ny = frame.nebulaY[n]
        const visible = nx >= 0 && nx <= width && ny >= top && ny <= bottom
        let text: string
        let at: { x: number; y: number }
        const along = leadsTo.get(n)!.along
        if (along && view.star >= 0.5) {
          // The star layer: the name rides on the star's own line, near the star -- the
          // screen's edge may be under the star's card.
          const t = Math.min(along.d * 0.5, 200)
          const arrow = along.uy < 0 ? (along.ux < 0 ? '↖' : '↗') : (along.ux < 0 ? '↙' : '↘')
          text = `${arrow} ${scene.nebulae[n].name}${subject ? ` · ${subject}` : ''}`
          const side = along.ux < 0 ? 1 : -1
          at = { x: along.x + along.ux * t - along.uy * 16 * side, y: along.y + along.uy * t + along.ux * 16 * side }
        } else if (visible) {
          // On screen, its own name is drawn by it; another subject is said beside it.
          if (!subject) continue
          text = subject
          at = { x: nx, y: ny + Math.min(frame.nebulaR[n] * 0.6, 60) }
        } else {
          const dx = nx - cx
          const dy = ny - cy
          const hit = Math.min(dx > 0 ? (width - 16 - cx) / dx : dx < 0 ? (16 - cx) / dx : Infinity,
            dy > 0 ? (bottom - 24 - cy) / dy : dy < 0 ? (top + 16 - cy) / dy : Infinity)
          if (!(hit > 0) || !Number.isFinite(hit)) continue
          const arrow = dy < 0 ? (dx < 0 ? '↖' : '↗') : (dx < 0 ? '↙' : '↘')
          text = `${arrow} ${scene.nebulae[n].name}${subject ? ` · ${subject}` : ''}`
          at = { x: cx + dx * hit, y: cy + dy * hit }
        }
        while (ctx.measureText(text).width > Math.min(220, width - 40) && text.length > 5) text = `${text.slice(0, -2)}…`
        const half = ctx.measureText(text).width / 2 + 8
        const x = Math.max(half + 12, Math.min(width - half - 12, at.x))
        const y = Math.max(area.y0 + 14, Math.min(area.y1 - 14, at.y))
        const box = placeLabel([{ x0: x - half, y0: y - 12, x1: x + half, y1: y + 12 }], { boxes: obstacles.boxes, circles: [], segments: [] }, area)
        if (!box) continue
        obstacles.boxes.push(box)
        ctx.globalAlpha = labelAlpha
        ctx.fillStyle = theme.sky
        ctx.fillRect(box.x0, box.y0, half * 2, 24)
        ctx.lineJoin = 'round'
        ctx.lineWidth = 3
        ctx.strokeStyle = theme.sky
        ctx.strokeText(text, x, y)
        ctx.fillStyle = theme.textBody
        ctx.fillText(text, x, y)
        stats.labels += 1
      }
    }

    // A dragged star's linked stars off screen (#136 D6): they move too, their
    // lines run to the edge, and the edge names where they lead -- the
    // nebula, and its subject when that is another one ("↗ Waves · Physics").
    if (drag > 0.5 && frame.drag) {
      stats.dragLabels = drawDragDestinations(ctx, scene, frame, theme, data.galaxyOf, obstacles, Math.min(1, 2 * drag - 1))
    }
  }

  ctx.restore()
  return stats
}

/**
 * Name, at the screen's edge, where a dragged star's off-screen linked stars
 * are (#136 D6): one name per nebula they are in, in the direction of the
 * nearest of them from the dragged star, the shorter way round the ring.
 */
function drawDragDestinations(
  ctx: CanvasRenderingContext2D,
  scene: SceneData,
  frame: SceneFrame,
  theme: StarMapTheme,
  galaxyOf: Int16Array,
  obstacles: LinkObstacles,
  alpha: number,
): number {
  const drag = frame.drag!
  const g = drag.star
  const { width, height } = frame.viewport
  const top = frame.viewport.top ?? 0
  const bottom = height - (frame.viewport.bottom ?? 0)
  const gx = frame.x[g]
  const gy = frame.y[g]
  const own = scene.nebula[g]
  // The nearest off-screen linked star of each nebula.
  const nearest = new Map<number, { dx: number; dy: number; d: number }>()
  for (let i = 0; i < scene.count; i += 1) {
    if (drag.related[i] !== 1 || i === g) continue
    const dx = shortestDx(scene.mapX[g], scene.mapX[i]) * frame.scale + drag.offsetX[i] - drag.offsetX[g]
    const dy = frame.y[i] - gy
    const x = gx + dx
    const y = gy + dy
    // On screen (under the page's own controls too): its line shows where it is.
    if (x >= 0 && x <= width && y >= 0 && y <= height) continue
    const n = scene.nebula[i]
    const d = Math.hypot(dx, dy)
    const known = nearest.get(n)
    if (!known || d < known.d) nearest.set(n, { dx, dy, d })
  }
  if (nearest.size === 0) return 0
  const area: Box = { x0: 0, y0: top, x1: width, y1: bottom }
  ctx.font = `500 12px ${theme.fontFamily}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  let drawn = 0
  for (const [n, { dx, dy }] of [...nearest].sort((a, b) => a[1].d - b[1].d || a[0] - b[0])) {
    const hit = Math.min(dx > 0 ? (width - 16 - gx) / dx : dx < 0 ? (16 - gx) / dx : Infinity,
      dy > 0 ? (bottom - 24 - gy) / dy : dy < 0 ? (top + 16 - gy) / dy : Infinity)
    if (!(hit > 0) || !Number.isFinite(hit)) continue
    const ga = galaxyOf[n]
    const subject = ga >= 0 && ga !== galaxyOf[own] ? scene.galaxies?.[ga]?.name : undefined
    const arrow = dy < 0 ? (dx < 0 ? '↖' : '↗') : (dx < 0 ? '↙' : '↘')
    let text = `${arrow} ${scene.nebulae[n].name}${subject ? ` · ${subject}` : ''}`
    while (ctx.measureText(text).width > Math.min(220, width - 40) && text.length > 5) text = `${text.slice(0, -2)}…`
    const half = ctx.measureText(text).width / 2 + 8
    const x = Math.max(half + 12, Math.min(width - half - 12, gx + dx * hit))
    const y = Math.max(area.y0 + 14, Math.min(area.y1 - 14, gy + dy * hit))
    // Never over the dragged star itself: the hand is there.
    const held = { x: gx, y: gy, r: frame.glyphSize * 0.8 + 6 }
    // At the edge where the line leaves, else slid along the edge to clear the star.
    const spots: Box[] = []
    for (const shift of [0, 1, -1, 2, -2, 3, -3]) {
      const sx = Math.max(half + 12, Math.min(width - half - 12, x + shift * (half * 2 + 8) * Math.abs(dy) / (Math.abs(dx) + Math.abs(dy) || 1)))
      const sy = Math.max(area.y0 + 14, Math.min(area.y1 - 14, y + shift * 32 * Math.abs(dx) / (Math.abs(dx) + Math.abs(dy) || 1)))
      spots.push({ x0: sx - half, y0: sy - 12, x1: sx + half, y1: sy + 12 })
    }
    const box = placeLabel(spots, { boxes: obstacles.boxes, circles: [], segments: [] }, area, (b) => (boxHitsCircle(b, held) ? Infinity : 0))
    if (!box) continue
    obstacles.boxes.push(box)
    ctx.globalAlpha = alpha
    ctx.fillStyle = theme.sky
    ctx.fillRect(box.x0, box.y0, half * 2, 24)
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3
    ctx.strokeStyle = theme.sky
    const lx = (box.x0 + box.x1) / 2
    const ly = (box.y0 + box.y1) / 2
    ctx.strokeText(text, lx, ly)
    ctx.fillStyle = theme.textBody
    ctx.fillText(text, lx, ly)
    drawn += 1
  }
  return drawn
}
