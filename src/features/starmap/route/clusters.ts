/*
 * Star clusters (#747, ADR 0007): a subject drawn as a few large clusters
 * instead of many nebulae. A cluster is a group of topics, defined by the
 * table below; a topic the table does not name is a cluster of its own under
 * its own id, so every subject works without an entry. On the map each
 * cluster is one nebula (`clusteredSky.ts`, laid out by the read model's
 * `placed()`), and a cluster chosen on the whole view opens its learning
 * route (`ClusterScene.tsx`).
 *
 * The names are the table's own, in four languages, until the backend names
 * clusters itself. So is a cluster's `mainline` where it has one: a cluster of
 * topics whose stars hardly build on each other is laid out topic by topic.
 */
import { layoutRoute, type RouteLayout } from '@/features/starmap/route/routeLayout'
import { orderedNebulae, subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'

export type ClusterDefinition = {
  clusterId: string
  topicIds: readonly string[]
  names: Record<SupportedLanguage, string>
  /** A hand-made main line for this cluster's route, overriding the computed one. */
  mainline?: readonly string[]
}

/**
 * The knowledge base's subjects in clusters (decided with the product owner):
 * mathematics, physics, German and English. Cluster ids are unique across
 * subjects and never a topic id.
 */
export const CLUSTER_TABLE: readonly ClusterDefinition[] = [
  {
    clusterId: 'numbers',
    topicIds: ['zahlen', 'brueche', 'prozentrechnung'],
    names: { de: 'Zahlen und Rechnen', en: 'Numbers and operations', fr: 'Nombres et opérations', it: 'Numeri e operazioni' },
  },
  {
    clusterId: 'geometry',
    topicIds: ['geometrie', 'groessen'],
    names: { de: 'Geometrie', en: 'Geometry', fr: 'Géométrie', it: 'Geometria' },
  },
  {
    clusterId: 'algebra',
    topicIds: ['gleichungen'],
    names: { de: 'Gleichungen und Algebra', en: 'Equations and algebra', fr: 'Équations et algèbre', it: 'Equazioni e algebra' },
  },
  {
    clusterId: 'data',
    topicIds: ['daten'],
    names: { de: 'Daten und Wahrscheinlichkeit', en: 'Data and probability', fr: 'Données et probabilités', it: 'Dati e probabilità' },
  },
  // Physics in three.
  {
    clusterId: 'physics-mechanics',
    topicIds: ['physik-praxis', 'physik-mechanik', 'physik-waerme'],
    names: { de: 'Mechanik und Wärme', en: 'Mechanics and heat', fr: 'Mécanique et chaleur', it: 'Meccanica e calore' },
  },
  {
    clusterId: 'physics-electricity',
    topicIds: ['physik-elektrizitaet'],
    names: { de: 'Elektrizität und Magnetismus', en: 'Electricity and magnetism', fr: 'Électricité et magnétisme', it: 'Elettricità e magnetismo' },
  },
  {
    clusterId: 'physics-waves',
    topicIds: ['physik-optik-akustik', 'physik-modern'],
    names: { de: 'Licht, Schall und moderne Physik', en: 'Light, sound and modern physics', fr: 'Lumière, son et physique moderne', it: 'Luce, suono e fisica moderna' },
  },
  // German in four. Words and forms by its prerequisites; the other three join two
  // topics that hardly build on each other, so their computed main line is two or
  // three stars with the rest stacked four to a column, half of them with no line
  // at all: their main line runs topic by topic instead, each in its stars' order.
  {
    clusterId: 'german-words',
    topicIds: ['deutsch-woerter', 'deutsch-formen'],
    names: { de: 'Wörter und Formen', en: 'Words and forms', fr: 'Mots et formes', it: 'Parole e forme' },
  },
  {
    clusterId: 'german-sentences',
    topicIds: ['deutsch-saetze', 'deutsch-rechtschreibung'],
    names: { de: 'Sätze und Rechtschreibung', en: 'Sentences and spelling', fr: 'Phrases et orthographe', it: 'Frasi e ortografia' },
    mainline: [
      'deutsch-saetze-satzarten',
      'deutsch-saetze-verbale-teile',
      'deutsch-saetze-satzglieder-proben',
      'deutsch-saetze-subjekt-objekte',
      'deutsch-saetze-praepositionalgruppen',
      'deutsch-saetze-haupt-nebensatz',
      'deutsch-saetze-komma',
      'deutsch-saetze-direkte-rede',
      'deutsch-rechtschreibung-buchstaben-abc',
      'deutsch-rechtschreibung-silben',
      'deutsch-rechtschreibung-gross-klein',
      'deutsch-rechtschreibung-lange-kurze-vokale',
      'deutsch-rechtschreibung-s-ss',
      'deutsch-rechtschreibung-aehnliche-laute',
      'deutsch-rechtschreibung-das-dass',
      'deutsch-rechtschreibung-getrennt-zusammen',
    ],
  },
  {
    clusterId: 'german-reading',
    topicIds: ['deutsch-texte', 'deutsch-literatur'],
    names: { de: 'Lesen und Literatur', en: 'Reading and literature', fr: 'Lecture et littérature', it: 'Lettura e letteratura' },
    mainline: [
      'deutsch-texte-woerter-saetze-lesen',
      'deutsch-texte-informationen',
      'deutsch-texte-kernaussage',
      'deutsch-texte-textsorten',
      'deutsch-texte-deuten',
      'deutsch-texte-argumentation',
      'deutsch-literatur-erzaehlende-texte',
      'deutsch-literatur-erzaehler',
      'deutsch-literatur-erzaehltechnik',
      'deutsch-literatur-stilmittel',
      'deutsch-literatur-rhetorik',
      'deutsch-literatur-gedichte',
      'deutsch-literatur-lyrik-formen',
      'deutsch-literatur-drama',
      'deutsch-literatur-epochen-barock-klassik',
      'deutsch-literatur-epochen-romantik-gegenwart',
      'deutsch-literatur-antike-mythen',
    ],
  },
  {
    clusterId: 'german-language',
    topicIds: ['deutsch-wortschatz', 'deutsch-sprache'],
    names: { de: 'Wortschatz und Sprache', en: 'Vocabulary and language', fr: 'Vocabulaire et langue', it: 'Lessico e lingua' },
    mainline: [
      'deutsch-wortschatz-wortfelder',
      'deutsch-wortschatz-ober-unterbegriffe',
      'deutsch-wortschatz-redewendungen',
      'deutsch-wortschatz-fremdwoerter',
      'deutsch-sprache-sprachvarietaeten',
      'deutsch-sprache-kommunikation',
      'deutsch-sprache-sprachwandel',
      'deutsch-sprache-sprachsystem',
    ],
  },
  // English in four: grammar, laid out by its prerequisites, and three clusters of
  // themes, whose stars barely build on each other -- their main line runs topic by topic.
  {
    clusterId: 'english-grammar',
    topicIds: ['englisch-laute', 'englisch-woerter', 'englisch-verben', 'englisch-saetze'],
    names: { de: 'Aussprache und Grammatik', en: 'Sounds and grammar', fr: 'Prononciation et grammaire', it: 'Pronuncia e grammatica' },
  },
  {
    clusterId: 'english-me',
    topicIds: ['englisch-ich', 'englisch-alltag', 'englisch-essen', 'englisch-gesundheit'],
    names: { de: 'Ich und mein Alltag', en: 'Me and my day', fr: 'Moi et mon quotidien', it: 'Io e la mia giornata' },
    mainline: [
      'englisch-ich-familie',
      'englisch-ich-begruessen-und-sich-vorstellen',
      'englisch-ich-aussehen-und-koerpersprache',
      'englisch-ich-personen-und-charakter-beschreiben',
      'englisch-ich-gefuehle-ratschlaege-und-durchhalten',
      'englisch-ich-frueher-und-heute',
      'englisch-alltag-zahlen-und-ordnungszahlen',
      'englisch-alltag-haus-zimmer-und-ortsangaben',
      'englisch-alltag-farben-kleidung-und-besitz',
      'englisch-alltag-uhrzeit-und-tagesablauf',
      'englisch-alltag-monate-und-datum',
      'englisch-alltag-wochentage-und-alltagstaetigkeiten',
      'englisch-alltag-von-frueher-erzaehlen',
      'englisch-essen-essen-anbieten-und-bestellen',
      'englisch-essen-lebensmittel-und-lieblingsessen',
      'englisch-essen-einkaufen-und-taschengeld',
      'englisch-essen-kochen-und-esskultur',
      'englisch-essen-produkte-wert-und-konsum',
      'englisch-gesundheit-gesicht-beschwerden-und-erste-hilfe',
      'englisch-gesundheit-sport-und-gesunde-gewohnheiten',
    ],
  },
  {
    clusterId: 'english-out',
    topicIds: ['englisch-schule', 'englisch-freizeit', 'englisch-unterwegs'],
    names: { de: 'Schule, Freizeit und Reisen', en: 'School, free time and travel', fr: 'École, loisirs et voyages', it: 'Scuola, tempo libero e viaggi' },
    mainline: [
      'englisch-schule-schulzimmer-und-schulsachen',
      'englisch-schule-berufe-und-arbeitsorte',
      'englisch-schule-orte-faecher-und-regeln-in-der-schule',
      'englisch-schule-berufsplaene-und-bewerbung',
      'englisch-schule-lernmethoden-und-schulabschluss',
      'englisch-schule-schulalltag-kurse-und-clubs',
      'englisch-freizeit-spielsachen-hobbys-und-faehigkeiten',
      'englisch-freizeit-das-wochenende',
      'englisch-freizeit-sport-und-wettkaempfe',
      'englisch-freizeit-fernsehen-und-internet',
      'englisch-freizeit-partys-und-feste',
      'englisch-freizeit-buecher-filme-und-science-fiction',
      'englisch-freizeit-musik-und-auffuehrungen',
      'englisch-freizeit-feste-und-traditionen',
      'englisch-unterwegs-laender-sprachen-und-umgangsformen',
      'englisch-unterwegs-verkehrsmittel-und-schulweg',
      'englisch-unterwegs-von-ausfluegen-und-ferien-erzaehlen',
      'englisch-unterwegs-orte-in-der-stadt-und-wege',
      'englisch-unterwegs-reisen-planen-und-sehenswuerdigkeiten',
      'englisch-unterwegs-kulturelle-vielfalt-und-austausch',
      'englisch-unterwegs-bahnreisen-und-seereisen',
    ],
  },
  {
    clusterId: 'english-world',
    topicIds: ['englisch-natur', 'englisch-gesellschaft', 'englisch-kommunizieren'],
    names: { de: 'Natur und Welt', en: 'Nature and the world', fr: 'La nature et le monde', it: 'La natura e il mondo' },
    mainline: [
      'englisch-natur-tiere',
      'englisch-natur-wetter-und-jahreszeiten',
      'englisch-natur-bauernhof-und-landwirtschaft',
      'englisch-natur-naturparks-und-naturschutz',
      'englisch-natur-umweltschutz-und-klima',
      'englisch-natur-unwetter-und-naturkatastrophen',
      'englisch-gesellschaft-regeln-in-schule-und-alltag',
      'englisch-gesellschaft-weltraum-und-raumfahrt',
      'englisch-gesellschaft-geschichten-mythen-und-gedichte',
      'englisch-gesellschaft-leben-und-technik-der-zukunft',
      'englisch-gesellschaft-kunst-und-ausstellungen',
      'englisch-gesellschaft-helfen-und-sich-engagieren',
      'englisch-gesellschaft-erfindungen-und-leistungen',
      'englisch-gesellschaft-kulturerbe-schuetzen',
      'englisch-gesellschaft-wissenschaftliche-forschung',
      'englisch-kommunizieren-texte-verstehen-und-im-alltag-kommunizieren',
    ],
  },
]

export type StarCluster = {
  clusterId: string
  name: string
  topicIds: string[]
  /** The cluster's stars, in route order (column, then lane). */
  stars: Star[]
  lit: number
  total: number
  /** Where to go on: the recommended star, else the one in progress, else the first ready one with nothing unlit before it. */
  next: Star | null
  route: RouteLayout
}

/** The cluster a topic belongs to: its table entry's, else the topic's own id. */
export function clusterIdOf(topicId: string, table: readonly ClusterDefinition[] = CLUSTER_TABLE): string {
  return table.find((d) => d.topicIds.includes(topicId))?.clusterId ?? topicId
}

/** The clusters of the subject in focus: the table's in its order, any other in the order of its first nebula. */
export function clustersOf(
  map: Pick<StarMap, 'subject' | 'nebulae' | 'stars' | 'prerequisites'>,
  language: SupportedLanguage,
  table: readonly ClusterDefinition[] = CLUSTER_TABLE,
): StarCluster[] {
  const subjectId = map.subject.subjectId
  const nebulae = orderedNebulae(map).filter((n) => subjectOfNebula(map, n.topicId) === subjectId)
  const groups: { definition: ClusterDefinition | null; clusterId: string; name: string; topicIds: string[] }[] = []
  for (const nebula of nebulae) {
    // A sky already gathered into clusters names each nebula by its cluster's id.
    const definition = table.find((d) => d.topicIds.includes(nebula.topicId)) ?? table.find((d) => d.clusterId === nebula.topicId) ?? null
    const clusterId = clusterIdOf(nebula.topicId, table)
    const group = groups.find((g) => g.clusterId === clusterId)
    if (group) group.topicIds.push(nebula.topicId)
    else groups.push({ definition, clusterId, name: definition?.names[language] ?? nebula.name, topicIds: [nebula.topicId] })
  }
  // The table's clusters come in the table's order, whatever order the backend gives their topics;
  // a cluster the table does not name keeps the place of its first topic.
  const slots = groups.flatMap((g, i) => (g.definition ? [i] : []))
  const inTableOrder = slots.map((i) => groups[i]).sort((a, b) => table.indexOf(a.definition!) - table.indexOf(b.definition!))
  slots.forEach((slot, i) => (groups[slot] = inTableOrder[i]))

  const clusterOfTopic = new Map(groups.flatMap((g) => g.topicIds.map((t) => [t, g.clusterId] as const)))
  const clusterOf = new Map<string, string>()
  for (const star of map.stars) {
    const clusterId = clusterOfTopic.get(star.nebulaId)
    if (clusterId) clusterOf.set(star.unitId, clusterId)
  }

  return groups.map(({ definition, clusterId, name, topicIds }) => {
    const members = map.stars.filter((s) => clusterOf.get(s.unitId) === clusterId)
    const route = layoutRoute({ stars: members, prerequisites: map.prerequisites, clusterOf, mainline: definition?.mainline })
    const place = new Map(route.nodes.map((n, i) => [n.id, i]))
    const stars = [...members].sort((a, b) => place.get(a.unitId)! - place.get(b.unitId)!)
    return {
      clusterId,
      name,
      topicIds,
      stars,
      lit: stars.filter((s) => s.state === 'lit').length,
      total: stars.length,
      next: nextStar(stars),
      route,
    }
  })
}

/** The star to go on with, among stars in route order. */
export function nextStar(stars: readonly Star[]): Star | null {
  return (
    stars.find((s) => s.recommendation !== null && s.state !== 'lit')
    ?? stars.find((s) => s.state === 'in_progress')
    ?? stars.find((s) => s.state === 'ready' && s.unlitPrerequisiteIds.length === 0)
    ?? stars.find((s) => s.state !== 'lit')
    ?? null
  )
}

/** The cluster a star is in. */
export function clusterOfStar(clusters: readonly StarCluster[], unitId: string): StarCluster | undefined {
  return clusters.find((c) => c.stars.some((s) => s.unitId === unitId))
}
