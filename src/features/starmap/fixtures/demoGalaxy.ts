/** Demo sky: a broad, irregular density field, with knowledge stars across the whole view. */
import { seededRandom } from '@/features/starmap/layout/layout'
import type { Star } from '@/features/starmap/model/starMap'

export function demoGalaxyPositions(stars: readonly Star[]): { x: number; y: number }[] {
  const random = seededRandom(10976 + stars.length)
  const groups = new Map<string, number[]>()
  stars.forEach((star, i) => {
    const members = groups.get(star.nebulaId) ?? []
    members.push(i)
    groups.set(star.nebulaId, members)
  })
  const sky: { x: number; y: number }[] = []
  while (sky.length < stars.length) {
    const x = random(), y = random()
    const distance = y - (0.72 - x * 0.42)
    const cloud = Math.exp(-distance * distance / 0.085)
    const dust = 0.65 + 0.35 * Math.sin(x * 23 + Math.sin(y * 19) * 2) ** 2
    // The diffuse component fills the sky; the wide cloud only changes density.
    if (random() < 0.35 + 0.65 * cloud * dust) sky.push({ x: 0.03 + x * 0.94, y: 0.28 + y * 0.44 })
  }
  // Spatial topic ownership, without gaps or circular silhouettes between topics.
  sky.sort((a, b) => a.y - b.y)
  const topics = [...groups.values()]
  const columns = Math.ceil(topics.length / 3)
  const positions: { x: number; y: number }[] = Array(stars.length)
  let offset = 0
  for (let row = 0; row < topics.length; row += columns) {
    const members = topics.slice(row, row + columns)
    const count = members.reduce((sum, topic) => sum + topic.length, 0)
    const points = sky.slice(offset, offset + count).sort((a, b) => a.x - b.x)
    let at = 0
    for (const topic of members) {
      for (let i = topic.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1))
        ;[topic[i], topic[j]] = [topic[j], topic[i]]
      }
      for (const index of topic) positions[index] = points[at++]
    }
    offset += count
  }
  return positions
}
