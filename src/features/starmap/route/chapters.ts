/*
 * Chapters of a star cluster's route (#747), like the units of a language
 * course: each cluster's route cut into a few stretches, so a student sees
 * where they are and what comes next in it. A chapter is a range of columns,
 * from the main-line star it starts at up to the next chapter's start; every
 * star in those columns, main line or side path, belongs to it. Chapters do
 * not move a star: the route is laid out first (`routeLayout.ts`), then cut.
 *
 * The table below names the chapters of the clusters in `clusters.ts`. A
 * cluster without an entry (a topic the cluster table does not name) is cut automatically:
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

/** The knowledge base's subjects, cut by their routes. */
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

  // Physics.
  'physics-mechanics': [
    {
      chapterId: 'physics-mechanics-forces',
      start: 'physik-mechanik-masse-dichte-und-gewichtskraft',
      names: { de: 'Masse, Kräfte und Bewegung', en: 'Mass, forces and motion', fr: 'Masse, forces et mouvement', it: 'Massa, forze e moto' },
    },
    {
      chapterId: 'physics-mechanics-newton',
      start: 'physik-mechanik-kraefte-elastische-kraft-und-reibung',
      names: { de: 'Newtonsche Gesetze und Arbeit', en: 'Newton’s laws and work', fr: 'Lois de Newton et travail', it: 'Leggi di Newton e lavoro' },
    },
    {
      chapterId: 'physics-mechanics-energy',
      start: 'physik-mechanik-freier-fall-und-wurfbewegungen',
      names: { de: 'Energie und Schwingungen', en: 'Energy and oscillations', fr: 'Énergie et oscillations', it: 'Energia e oscillazioni' },
    },
    {
      chapterId: 'physics-mechanics-gravitation',
      start: 'physik-mechanik-kreisbewegung-und-gravitation',
      names: { de: 'Gravitation, Wärme und Impuls', en: 'Gravitation, heat and momentum', fr: 'Gravitation, chaleur et quantité de mouvement', it: 'Gravitazione, calore e quantità di moto' },
    },
  ],
  'physics-electricity': [
    {
      chapterId: 'physics-electricity-charge',
      start: 'physik-elektrizitaet-ladung-strom-und-stromkreise',
      names: { de: 'Ladung, Strom und Felder', en: 'Charge, current and fields', fr: 'Charge, courant et champs', it: 'Carica, corrente e campi' },
    },
    {
      chapterId: 'physics-electricity-circuits',
      start: 'physik-elektrizitaet-elektrische-energie-leistung-und-haushalt',
      names: { de: 'Energie und Schaltungen', en: 'Energy and circuits', fr: 'Énergie et circuits', it: 'Energia e circuiti' },
    },
    {
      chapterId: 'physics-electricity-induction',
      start: 'physik-elektrizitaet-elektromagnetische-induktion',
      names: { de: 'Induktion und Wellen', en: 'Induction and waves', fr: 'Induction et ondes', it: 'Induzione e onde' },
    },
  ],
  'physics-waves': [
    {
      chapterId: 'physics-waves-all',
      start: 'physik-optik-akustik-ausbreitung-reflexion-und-brechung-des-lichts',
      names: { de: 'Wellen und moderne Physik', en: 'Waves and modern physics', fr: 'Ondes et physique moderne', it: 'Onde e fisica moderna' },
    },
  ],

  // German.
  'german-words': [
    {
      chapterId: 'german-words-classes',
      start: 'deutsch-woerter-verb',
      names: { de: 'Wortarten', en: 'Word classes', fr: 'Classes de mots', it: 'Classi di parole' },
    },
    {
      chapterId: 'german-words-tenses',
      start: 'deutsch-formen-praesens-praeteritum-perfekt',
      names: { de: 'Zeiten, Pronomen und Partikeln', en: 'Tenses, pronouns and particles', fr: 'Temps, pronoms et particules', it: 'Tempi, pronomi e particelle' },
    },
    {
      chapterId: 'german-words-forms',
      start: 'deutsch-formen-plusquamperfekt-futur',
      names: { de: 'Modus, Passiv und Fälle', en: 'Mood, passive and cases', fr: 'Mode, passif et cas', it: 'Modo, passivo e casi' },
    },
  ],
  'german-sentences': [
    {
      chapterId: 'german-sentences-parts',
      start: 'deutsch-saetze-satzarten',
      names: { de: 'Satzarten und Satzglieder', en: 'Sentence types and parts', fr: 'Types et éléments de phrase', it: 'Tipi ed elementi della frase' },
    },
    {
      chapterId: 'german-sentences-clauses',
      start: 'deutsch-saetze-praepositionalgruppen',
      names: { de: 'Satzbau und Zeichensetzung', en: 'Clauses and punctuation', fr: 'Propositions et ponctuation', it: 'Proposizioni e punteggiatura' },
    },
    {
      chapterId: 'german-sentences-letters',
      start: 'deutsch-rechtschreibung-buchstaben-abc',
      names: { de: 'Buchstaben und Laute', en: 'Letters and sounds', fr: 'Lettres et sons', it: 'Lettere e suoni' },
    },
    {
      chapterId: 'german-sentences-spelling',
      start: 'deutsch-rechtschreibung-s-ss',
      names: { de: 'Knifflige Schreibungen', en: 'Tricky spellings', fr: 'Orthographe délicate', it: 'Grafie difficili' },
    },
  ],
  'german-reading': [
    {
      chapterId: 'german-reading-texts',
      start: 'deutsch-texte-woerter-saetze-lesen',
      names: { de: 'Texte verstehen', en: 'Understanding texts', fr: 'Comprendre des textes', it: 'Capire i testi' },
    },
    {
      chapterId: 'german-reading-stories',
      start: 'deutsch-literatur-erzaehlende-texte',
      names: { de: 'Erzählen', en: 'Stories and narrators', fr: 'Récits et narrateurs', it: 'Racconti e narratori' },
    },
    {
      chapterId: 'german-reading-poems',
      start: 'deutsch-literatur-stilmittel',
      names: { de: 'Stil und Gedichte', en: 'Style and poems', fr: 'Style et poèmes', it: 'Stile e poesie' },
    },
    {
      chapterId: 'german-reading-periods',
      start: 'deutsch-literatur-drama',
      names: { de: 'Drama und Epochen', en: 'Drama and literary periods', fr: 'Théâtre et époques littéraires', it: 'Teatro ed epoche letterarie' },
    },
  ],
  'german-language': [
    {
      chapterId: 'german-language-vocabulary',
      start: 'deutsch-wortschatz-wortfelder',
      names: { de: 'Wortschatz', en: 'Vocabulary', fr: 'Vocabulaire', it: 'Lessico' },
    },
    {
      chapterId: 'german-language-language',
      start: 'deutsch-sprache-sprachvarietaeten',
      names: { de: 'Sprache untersuchen', en: 'Looking at language', fr: 'Observer la langue', it: 'Osservare la lingua' },
    },
  ],

  // English: grammar cut along its route; the theme clusters one chapter a topic, named as the topic.
  'english-grammar': [
    {
      chapterId: 'english-grammar-basics',
      start: 'englisch-verben-be-have-und-simple-present',
      names: { de: 'Buchstaben, be und have', en: 'Letters, be and have', fr: 'Lettres, be et have', it: 'Lettere, be e have' },
    },
    {
      chapterId: 'english-grammar-words',
      start: 'englisch-woerter-this-these-und-plural-von-nomen',
      names: { de: 'Wörter und Laute', en: 'Words and sounds', fr: 'Mots et sons', it: 'Parole e suoni' },
    },
    {
      chapterId: 'english-grammar-questions',
      start: 'englisch-saetze-fragen-mit-fragewoertern',
      names: { de: 'Fragen und Sätze', en: 'Questions and sentences', fr: 'Questions et phrases', it: 'Domande e frasi' },
    },
    {
      chapterId: 'english-grammar-tenses',
      start: 'englisch-verben-pflicht-erlaubnis-und-vermutung',
      names: { de: 'Vergangenheit und Modalverben', en: 'Past tense and modal verbs', fr: 'Passé et verbes modaux', it: 'Passato e verbi modali' },
    },
    {
      chapterId: 'english-grammar-conditionals',
      start: 'englisch-saetze-bedingung-gegensatz-und-zweck',
      names: { de: 'Bedingungssätze und Passiv', en: 'Conditionals and the passive', fr: 'Conditionnel et passif', it: 'Periodo ipotetico e passivo' },
    },
  ],
  'english-me': [
    {
      chapterId: 'english-me-people',
      start: 'englisch-ich-familie',
      names: { de: 'Ich und die anderen', en: 'Me and other people', fr: 'Moi et les autres', it: 'Io e gli altri' },
    },
    {
      chapterId: 'english-me-home',
      start: 'englisch-alltag-zahlen-und-ordnungszahlen',
      names: { de: 'Alltag und Zuhause', en: 'Daily life and home', fr: 'Quotidien et maison', it: 'Vita quotidiana e casa' },
    },
    {
      chapterId: 'english-me-food',
      start: 'englisch-essen-essen-anbieten-und-bestellen',
      names: { de: 'Essen und Einkaufen', en: 'Food and shopping', fr: 'Repas et achats', it: 'Cibo e acquisti' },
    },
    {
      chapterId: 'english-me-health',
      start: 'englisch-gesundheit-gesicht-beschwerden-und-erste-hilfe',
      names: { de: 'Körper und Gesundheit', en: 'Body and health', fr: 'Corps et santé', it: 'Corpo e salute' },
    },
  ],
  'english-out': [
    {
      chapterId: 'english-out-school',
      start: 'englisch-schule-schulzimmer-und-schulsachen',
      names: { de: 'Schule und Arbeit', en: 'School and work', fr: 'École et travail', it: 'Scuola e lavoro' },
    },
    {
      chapterId: 'english-out-free-time',
      start: 'englisch-freizeit-spielsachen-hobbys-und-faehigkeiten',
      names: { de: 'Freizeit und Feste', en: 'Free time and celebrations', fr: 'Loisirs et fêtes', it: 'Tempo libero e feste' },
    },
    {
      chapterId: 'english-out-about',
      start: 'englisch-unterwegs-laender-sprachen-und-umgangsformen',
      names: { de: 'Unterwegs', en: 'Out and about', fr: 'En route', it: 'In giro' },
    },
  ],
  'english-world': [
    {
      chapterId: 'english-world-nature',
      start: 'englisch-natur-tiere',
      names: { de: 'Natur und Umwelt', en: 'Nature and the environment', fr: 'Nature et environnement', it: 'Natura e ambiente' },
    },
    {
      // Communicating, one star, comes last in this chapter.
      chapterId: 'english-world-society',
      start: 'englisch-gesellschaft-regeln-in-schule-und-alltag',
      names: { de: 'Gesellschaft und Wissen', en: 'Society and knowledge', fr: 'Société et savoir', it: 'Società e sapere' },
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
