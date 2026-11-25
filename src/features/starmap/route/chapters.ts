/*
 * Chapters of a star cluster's route (#747), like the units of a language
 * course: each cluster's route cut into a few stretches, so a student sees
 * where they are and what comes next in it. A chapter is a range of columns,
 * from the main-line star it starts at up to the next chapter's start; every
 * star in those columns, main line or side path, belongs to it. Chapters do
 * not move a star: the route is laid out first (`routeLayout.ts`), then cut.
 *
 * The table below names the chapters of the clusters in `clusters.ts`. A
 * cluster without an entry (other subjects for now) is cut automatically:
 * about `AUTO_CHAPTER_MAIN_STARS` main-line stars a chapter, named "Chapter n"
 * by the caller. So is a cluster whose entry does not fit its route (a start
 * that is not on the main line, or starts out of order); in development that
 * is said in the console.
 */
import type { RouteLayout, RouteStarNode } from '@/features/starmap/route/routeLayout'
import type { SupportedLanguage } from '@/i18n/languages'

export type ChapterDefinition = {
  chapterId: string
  names: Record<SupportedLanguage, string>
  /** The main-line star it starts at. */
  start: string
}

/** Mathematics, cut by its real knowledge base's routes. */
export const CHAPTER_TABLE: Readonly<Record<string, readonly ChapterDefinition[]>> = {
  numbers: [
    {
      chapterId: 'numbers-counting',
      start: 'zahlen-zahlenraum-bis-20',
      names: { de: 'Zählen und Rechnen bis 20', en: 'Counting and sums to 20', fr: 'Compter et calculer jusqu’à 20', it: 'Contare e calcolare fino a 20' },
    },
    {
      chapterId: 'numbers-larger',
      start: 'zahlen-plus-und-minus-bis-100',
      names: { de: 'Grössere Zahlen', en: 'Larger numbers', fr: 'Grands nombres', it: 'Numeri più grandi' },
    },
    {
      chapterId: 'numbers-fractions',
      start: 'zahlen-dezimalstellen-runden-und-ueberschlagen',
      names: { de: 'Dezimalzahlen und Brüche', en: 'Decimals and fractions', fr: 'Décimaux et fractions', it: 'Decimali e frazioni' },
    },
    {
      chapterId: 'numbers-powers',
      start: 'zahlen-potenzen-und-potenzgesetze',
      names: { de: 'Potenzen und Wurzeln', en: 'Powers and roots', fr: 'Puissances et racines', it: 'Potenze e radici' },
    },
  ],
  geometry: [
    {
      chapterId: 'geometry-shapes',
      start: 'geometrie-ebene-figuren-und-vielecke',
      names: { de: 'Formen und Grössen', en: 'Shapes and measures', fr: 'Formes et grandeurs', it: 'Forme e grandezze' },
    },
    {
      chapterId: 'geometry-angles',
      start: 'geometrie-strecken-geraden-senkrechte-und-parallelen',
      names: { de: 'Linien und Winkel', en: 'Lines and angles', fr: 'Droites et angles', it: 'Rette e angoli' },
    },
    {
      chapterId: 'geometry-triangles',
      start: 'geometrie-winkel-an-parallelen-und-beweise',
      names: { de: 'Dreiecke', en: 'Triangles', fr: 'Triangles', it: 'Triangoli' },
    },
    {
      chapterId: 'geometry-circles',
      start: 'geometrie-trigonometrie',
      names: { de: 'Trigonometrie und Kreise', en: 'Trigonometry and circles', fr: 'Trigonométrie et cercles', it: 'Trigonometria e cerchi' },
    },
    {
      chapterId: 'geometry-vectors',
      start: 'geometrie-skalarprodukt-und-geometrie-mit-vektoren',
      names: { de: 'Vektoren', en: 'Vectors', fr: 'Vecteurs', it: 'Vettori' },
    },
  ],
  algebra: [
    {
      chapterId: 'algebra-equations',
      start: 'gleichungen-ersetzen-und-groessenbeziehungen',
      names: { de: 'Terme und Gleichungen', en: 'Expressions and equations', fr: 'Expressions et équations', it: 'Espressioni ed equazioni' },
    },
    {
      chapterId: 'algebra-functions',
      start: 'gleichungen-funktionsbegriff-und-darstellungen',
      names: { de: 'Funktionen', en: 'Functions', fr: 'Fonctions', it: 'Funzioni' },
    },
    {
      chapterId: 'algebra-calculus',
      start: 'gleichungen-bogenmass-und-einheitskreis',
      names: { de: 'Trigonometrie und Ableitungen', en: 'Trigonometry and derivatives', fr: 'Trigonométrie et dérivées', it: 'Trigonometria e derivate' },
    },
  ],
  data: [
    {
      chapterId: 'data-charts',
      start: 'daten-daten-ordnen-und-darstellen',
      names: { de: 'Daten darstellen', en: 'Showing data', fr: 'Représenter des données', it: 'Rappresentare i dati' },
    },
    {
      chapterId: 'data-chance',
      start: 'daten-zufall-und-wahrscheinlichkeit-einschaetzen',
      names: { de: 'Zufall und Statistik', en: 'Chance and statistics', fr: 'Hasard et statistique', it: 'Caso e statistica' },
    },
    {
      chapterId: 'data-probability',
      start: 'daten-wahrscheinlichkeiten-berechnen',
      names: { de: 'Wahrscheinlichkeit', en: 'Probability', fr: 'Probabilités', it: 'Probabilità' },
    },
  ],
}

/** How many main-line stars an automatic chapter takes. */
export const AUTO_CHAPTER_MAIN_STARS = 4

export type RouteChapter = {
  chapterId: string
  /** 1-based, along the route. */
  number: number
  /** The table's name in the language asked for; null for an automatic chapter (the caller says "Chapter n"). */
  name: string | null
  /** The columns it spans, both included. */
  fromCol: number
  toCol: number
  /** Its stars in route order (column, then lane). */
  stars: string[]
}

/**
 * The chapters of one cluster's route: contiguous, covering every column,
 * every star in exactly one.
 */
export function chaptersOf(
  route: Pick<RouteLayout, 'nodes' | 'mainline' | 'columns'>,
  clusterId: string,
  language: SupportedLanguage,
  table: Readonly<Record<string, readonly ChapterDefinition[]>> = CHAPTER_TABLE,
): RouteChapter[] {
  const stars = route.nodes.filter((n): n is RouteStarNode => n.kind === 'star').sort((a, b) => a.col - b.col || a.lane - b.lane)
  if (stars.length === 0) return []
  const colOf = new Map(stars.map((n) => [n.unitId, n.col]))
  const defined = table[clusterId]
  let starts: { chapterId: string; name: string | null; col: number }[] | null = null
  if (defined && defined.length > 0) {
    const cols = defined.map((d) => (route.mainline.includes(d.start) ? colOf.get(d.start)! : -1))
    const fits = cols.every((c, i) => c >= 0 && (i === 0 || c > cols[i - 1]))
    if (fits) starts = defined.map((d, i) => ({ chapterId: d.chapterId, name: d.names[language] ?? d.names.en, col: i === 0 ? 0 : cols[i] }))
    else if (import.meta.env.DEV) console.warn(`Chapters of ${clusterId}: a start is not on the main line, or out of order; cut automatically instead.`)
  }
  starts ??= autoStarts(route.mainline, colOf, clusterId)
  return starts.map((start, i) => {
    const toCol = i + 1 < starts.length ? starts[i + 1].col - 1 : Math.max(route.columns - 1, start.col)
    return {
      chapterId: start.chapterId,
      number: i + 1,
      name: start.name,
      fromCol: start.col,
      toCol,
      stars: stars.filter((n) => n.col >= start.col && n.col <= toCol).map((n) => n.unitId),
    }
  })
}

function autoStarts(mainline: readonly string[], colOf: ReadonlyMap<string, number>, clusterId: string) {
  const starts: { chapterId: string; name: null; col: number }[] = []
  for (let i = 0; i < mainline.length; i += AUTO_CHAPTER_MAIN_STARS) {
    // A last chapter of one main-line star joins the one before it.
    if (i > 0 && mainline.length - i < 2) break
    starts.push({ chapterId: `${clusterId}-${starts.length + 1}`, name: null, col: starts.length === 0 ? 0 : colOf.get(mainline[i])! })
  }
  if (starts.length === 0) starts.push({ chapterId: `${clusterId}-1`, name: null, col: 0 })
  return starts
}

/** The chapter a column is in. */
export function chapterAt(chapters: readonly RouteChapter[], col: number): RouteChapter | undefined {
  return chapters.find((c) => col >= c.fromCol && col <= c.toCol)
}
