/*
 * The stars of the real knowledge base, four subjects, for the design
 * preview's star clusters (#747). Dev only: nothing under src/dev reaches the
 * production bundle (#131, docs/agents/design-preview.md).
 *
 * Copied from stoasystem/stoa-backend, src/stoa/services/knowledge_base_stars.json
 * (the stars: 98 mathematics, 35 physics, 52 german, 83 english;
 * descriptions left out) and knowledge_base_catalog.topics() (the nebula names
 * of physics, German and English; mathematics' nebulae are older than the
 * knowledge base, named in `demoClusterMap.ts`).
 *
 * Provenance and licence, as the backend records them (docs/knowledge-base-import.md):
 *   - mathematics, physics and English are derived from
 *     https://github.com/xiaoyang111222/cn-math-taxonomy, licensed CC BY-NC 4.0
 *     (https://creativecommons.org/licenses/by-nc/4.0/): attribution required,
 *     no commercial use without the author's permission (given to the operator
 *     in words on 2026-11-09, recorded in the backend);
 *   - German (as a first language, stoa-backend#498) has no upstream: its stars
 *     are written for STOA.
 *
 * Generated; to refresh, copy again rather than editing by hand.
 */

export type KnowledgeBaseSubject = 'mathematics' | 'physics' | 'german' | 'english'

export type KnowledgeBaseStar = {
  unitId: string
  subjectId: KnowledgeBaseSubject
  topicId: string
  order: number
  titles: { de: string; en: string; fr: string; it: string }
  prerequisites: string[]
}

export type KnowledgeBaseTopic = {
  topicId: string
  subjectId: KnowledgeBaseSubject
  order: number
  titles: { de: string; en: string; fr: string; it: string }
}

export const KNOWLEDGE_BASE_SOURCE = {
  repository: 'https://github.com/xiaoyang111222/cn-math-taxonomy',
  licence: 'CC BY-NC 4.0',
  /** Written for STOA, no upstream. */
  authored: ['german'],
} as const

/** The nebulae of physics, German and English, in the backend's order within each subject. */
export const KNOWLEDGE_BASE_TOPICS: readonly KnowledgeBaseTopic[] = [
  {
    "topicId": "englisch-ich",
    "subjectId": "english",
    "order": 1,
    "titles": {
      "de": "Ich und die anderen",
      "en": "Me and other people",
      "fr": "Moi et les autres",
      "it": "Io e gli altri"
    }
  },
  {
    "topicId": "englisch-alltag",
    "subjectId": "english",
    "order": 2,
    "titles": {
      "de": "Alltag und Zuhause",
      "en": "Daily life and home",
      "fr": "Quotidien et maison",
      "it": "Vita quotidiana e casa"
    }
  },
  {
    "topicId": "englisch-schule",
    "subjectId": "english",
    "order": 3,
    "titles": {
      "de": "Schule und Arbeit",
      "en": "School and work",
      "fr": "École et travail",
      "it": "Scuola e lavoro"
    }
  },
  {
    "topicId": "englisch-essen",
    "subjectId": "english",
    "order": 4,
    "titles": {
      "de": "Essen und Einkaufen",
      "en": "Food and shopping",
      "fr": "Repas et achats",
      "it": "Cibo e acquisti"
    }
  },
  {
    "topicId": "englisch-freizeit",
    "subjectId": "english",
    "order": 5,
    "titles": {
      "de": "Freizeit und Feste",
      "en": "Free time and celebrations",
      "fr": "Loisirs et fêtes",
      "it": "Tempo libero e feste"
    }
  },
  {
    "topicId": "englisch-unterwegs",
    "subjectId": "english",
    "order": 6,
    "titles": {
      "de": "Unterwegs",
      "en": "Out and about",
      "fr": "En route",
      "it": "In giro"
    }
  },
  {
    "topicId": "englisch-natur",
    "subjectId": "english",
    "order": 7,
    "titles": {
      "de": "Natur und Umwelt",
      "en": "Nature and the environment",
      "fr": "Nature et environnement",
      "it": "Natura e ambiente"
    }
  },
  {
    "topicId": "englisch-gesundheit",
    "subjectId": "english",
    "order": 8,
    "titles": {
      "de": "Körper und Gesundheit",
      "en": "Body and health",
      "fr": "Corps et santé",
      "it": "Corpo e salute"
    }
  },
  {
    "topicId": "englisch-gesellschaft",
    "subjectId": "english",
    "order": 9,
    "titles": {
      "de": "Gesellschaft und Wissen",
      "en": "Society and knowledge",
      "fr": "Société et savoir",
      "it": "Società e sapere"
    }
  },
  {
    "topicId": "englisch-kommunizieren",
    "subjectId": "english",
    "order": 10,
    "titles": {
      "de": "Sich verständigen",
      "en": "Communicating",
      "fr": "Communiquer",
      "it": "Comunicare"
    }
  },
  {
    "topicId": "englisch-laute",
    "subjectId": "english",
    "order": 11,
    "titles": {
      "de": "Buchstaben und Aussprache",
      "en": "Letters and pronunciation",
      "fr": "Lettres et prononciation",
      "it": "Lettere e pronuncia"
    }
  },
  {
    "topicId": "englisch-woerter",
    "subjectId": "english",
    "order": 12,
    "titles": {
      "de": "Wortarten",
      "en": "Parts of speech",
      "fr": "Classes de mots",
      "it": "Parti del discorso"
    }
  },
  {
    "topicId": "englisch-verben",
    "subjectId": "english",
    "order": 13,
    "titles": {
      "de": "Verben und Zeitformen",
      "en": "Verbs and tenses",
      "fr": "Verbes et temps",
      "it": "Verbi e tempi"
    }
  },
  {
    "topicId": "englisch-saetze",
    "subjectId": "english",
    "order": 14,
    "titles": {
      "de": "Sätze bauen",
      "en": "Building sentences",
      "fr": "Construire des phrases",
      "it": "Costruire le frasi"
    }
  },
  {
    "topicId": "physik-mechanik",
    "subjectId": "physics",
    "order": 1,
    "titles": {
      "de": "Mechanik",
      "en": "Mechanics",
      "fr": "Mécanique",
      "it": "Meccanica"
    }
  },
  {
    "topicId": "physik-elektrizitaet",
    "subjectId": "physics",
    "order": 2,
    "titles": {
      "de": "Elektrizität und Magnetismus",
      "en": "Electricity and magnetism",
      "fr": "Électricité et magnétisme",
      "it": "Elettricità e magnetismo"
    }
  },
  {
    "topicId": "physik-waerme",
    "subjectId": "physics",
    "order": 3,
    "titles": {
      "de": "Wärme und Materie",
      "en": "Heat and matter",
      "fr": "Chaleur et matière",
      "it": "Calore e materia"
    }
  },
  {
    "topicId": "physik-optik-akustik",
    "subjectId": "physics",
    "order": 4,
    "titles": {
      "de": "Schall und Licht",
      "en": "Sound and light",
      "fr": "Son et lumière",
      "it": "Suono e luce"
    }
  },
  {
    "topicId": "physik-modern",
    "subjectId": "physics",
    "order": 5,
    "titles": {
      "de": "Moderne Physik",
      "en": "Modern physics",
      "fr": "Physique moderne",
      "it": "Fisica moderna"
    }
  },
  {
    "topicId": "physik-praxis",
    "subjectId": "physics",
    "order": 6,
    "titles": {
      "de": "Messen und Experimentieren",
      "en": "Measuring and experimenting",
      "fr": "Mesurer et expérimenter",
      "it": "Misurare e sperimentare"
    }
  },
  {
    "topicId": "deutsch-woerter",
    "subjectId": "german",
    "order": 1,
    "titles": {
      "de": "Wörter und Wortarten",
      "en": "Words and word classes",
      "fr": "Les mots et leurs classes",
      "it": "Parole e classi di parole"
    }
  },
  {
    "topicId": "deutsch-formen",
    "subjectId": "german",
    "order": 2,
    "titles": {
      "de": "Formen von Verb und Nomen",
      "en": "Forms of verbs and nouns",
      "fr": "Formes du verbe et du nom",
      "it": "Forme del verbo e del nome"
    }
  },
  {
    "topicId": "deutsch-saetze",
    "subjectId": "german",
    "order": 3,
    "titles": {
      "de": "Sätze untersuchen",
      "en": "Analysing sentences",
      "fr": "Analyser les phrases",
      "it": "Analizzare le frasi"
    }
  },
  {
    "topicId": "deutsch-rechtschreibung",
    "subjectId": "german",
    "order": 4,
    "titles": {
      "de": "Rechtschreibung",
      "en": "Spelling",
      "fr": "Orthographe",
      "it": "Ortografia"
    }
  },
  {
    "topicId": "deutsch-wortschatz",
    "subjectId": "german",
    "order": 5,
    "titles": {
      "de": "Wortschatz",
      "en": "Vocabulary",
      "fr": "Vocabulaire",
      "it": "Lessico"
    }
  },
  {
    "topicId": "deutsch-texte",
    "subjectId": "german",
    "order": 6,
    "titles": {
      "de": "Texte verstehen",
      "en": "Understanding texts",
      "fr": "Comprendre des textes",
      "it": "Capire i testi"
    }
  },
  {
    "topicId": "deutsch-literatur",
    "subjectId": "german",
    "order": 7,
    "titles": {
      "de": "Literatur und Stil",
      "en": "Literature and style",
      "fr": "Littérature et style",
      "it": "Letteratura e stile"
    }
  },
  {
    "topicId": "deutsch-sprache",
    "subjectId": "german",
    "order": 8,
    "titles": {
      "de": "Sprache und Kommunikation",
      "en": "Language and communication",
      "fr": "Langue et communication",
      "it": "Lingua e comunicazione"
    }
  }
]

export const KNOWLEDGE_BASE: readonly KnowledgeBaseStar[] = [
  {
    "unitId": "brueche-brueche-kuerzen-addieren-und-subtrahieren",
    "subjectId": "mathematics",
    "topicId": "brueche",
    "order": 3,
    "titles": {
      "de": "Brüche kürzen, addieren und subtrahieren",
      "en": "Simplifying, adding and subtracting fractions",
      "fr": "Simplifier, additionner et soustraire des fractions",
      "it": "Semplificare, addizionare e sottrarre frazioni"
    },
    "prerequisites": [
      "brueche-brueche-und-dezimalzahlen-verstehen",
      "zahlen-rechengesetze-und-rechenreihenfolge",
      "zahlen-teilbarkeit-primzahlen-ggt-kgv"
    ]
  },
  {
    "unitId": "brueche-brueche-und-dezimalzahlen-verstehen",
    "subjectId": "mathematics",
    "topicId": "brueche",
    "order": 4,
    "titles": {
      "de": "Brüche und Dezimalzahlen verstehen",
      "en": "Understanding fractions and decimals",
      "fr": "Comprendre les fractions et les nombres décimaux",
      "it": "Capire le frazioni e i numeri decimali"
    },
    "prerequisites": [
      "groessen-gewicht-hohlmasse-und-geld",
      "zahlen-einmaleins-und-teilen"
    ]
  },
  {
    "unitId": "brueche-brueche-multiplizieren-und-dividieren",
    "subjectId": "mathematics",
    "topicId": "brueche",
    "order": 5,
    "titles": {
      "de": "Brüche multiplizieren und dividieren",
      "en": "Multiplying and dividing fractions",
      "fr": "Multiplier et diviser des fractions",
      "it": "Moltiplicare e dividere frazioni"
    },
    "prerequisites": [
      "brueche-brueche-kuerzen-addieren-und-subtrahieren",
      "gleichungen-ersetzen-und-groessenbeziehungen",
      "zahlen-rechnen-mit-dezimalzahlen"
    ]
  },
  {
    "unitId": "daten-daten-ordnen-und-darstellen",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 3,
    "titles": {
      "de": "Daten ordnen und in Diagrammen darstellen",
      "en": "Organising data and showing it in charts",
      "fr": "Organiser des données et les représenter en diagrammes",
      "it": "Ordinare dati e rappresentarli in grafici"
    },
    "prerequisites": [
      "zahlen-plus-und-minus-bis-100",
      "zahlen-stellenwerte-und-zahlensysteme",
      "zahlen-zahlenraum-bis-20"
    ]
  },
  {
    "unitId": "daten-zaehlprinzipien-und-variationen",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 4,
    "titles": {
      "de": "Zählprinzipien und Variationen",
      "en": "Counting principles and permutations",
      "fr": "Principes de dénombrement et arrangements",
      "it": "Principi di conteggio e disposizioni"
    },
    "prerequisites": [
      "zahlen-einmaleins-und-teilen"
    ]
  },
  {
    "unitId": "daten-mittelwert-median-und-modalwert",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 5,
    "titles": {
      "de": "Mittelwert, Median und Modalwert",
      "en": "Mean, median and mode",
      "fr": "Moyenne, médiane et mode",
      "it": "Media, mediana e moda"
    },
    "prerequisites": [
      "zahlen-mehrstellig-multiplizieren-und-dividieren"
    ]
  },
  {
    "unitId": "daten-diagramme-und-histogramme-lesen",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 6,
    "titles": {
      "de": "Diagramme und Histogramme lesen",
      "en": "Reading charts and histograms",
      "fr": "Lire des diagrammes et des histogrammes",
      "it": "Leggere grafici e istogrammi"
    },
    "prerequisites": [
      "daten-daten-ordnen-und-darstellen",
      "daten-mittelwert-median-und-modalwert"
    ]
  },
  {
    "unitId": "daten-zufall-und-wahrscheinlichkeit-einschaetzen",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 7,
    "titles": {
      "de": "Zufall und Wahrscheinlichkeit einschätzen",
      "en": "Judging chance and probability",
      "fr": "Évaluer le hasard et la probabilité",
      "it": "Valutare il caso e la probabilità"
    },
    "prerequisites": [
      "daten-daten-ordnen-und-darstellen"
    ]
  },
  {
    "unitId": "daten-statistische-untersuchungen-durchfuehren",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 8,
    "titles": {
      "de": "Statistische Untersuchungen durchführen",
      "en": "Carrying out statistical investigations",
      "fr": "Mener une enquête statistique",
      "it": "Svolgere un'indagine statistica"
    },
    "prerequisites": [
      "daten-daten-ordnen-und-darstellen",
      "daten-mittelwert-median-und-modalwert",
      "daten-stichproben-und-stichprobenverfahren"
    ]
  },
  {
    "unitId": "daten-stichproben-und-stichprobenverfahren",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 9,
    "titles": {
      "de": "Stichproben und Stichprobenverfahren",
      "en": "Samples and sampling methods",
      "fr": "Échantillons et méthodes d'échantillonnage",
      "it": "Campioni e metodi di campionamento"
    },
    "prerequisites": []
  },
  {
    "unitId": "daten-streuung-quartile-und-boxplots",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 10,
    "titles": {
      "de": "Streuung, Quartile und Boxplots",
      "en": "Spread, quartiles and box plots",
      "fr": "Dispersion, quartiles et boîtes à moustaches",
      "it": "Dispersione, quartili e box plot"
    },
    "prerequisites": [
      "daten-mittelwert-median-und-modalwert",
      "daten-stichproben-und-stichprobenverfahren"
    ]
  },
  {
    "unitId": "daten-ereignisse-und-mehrstufige-zufallsexperimente",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 11,
    "titles": {
      "de": "Ereignisse und mehrstufige Zufallsexperimente",
      "en": "Events and multi-stage random experiments",
      "fr": "Événements et expériences aléatoires à plusieurs étapes",
      "it": "Eventi ed esperimenti casuali a più stadi"
    },
    "prerequisites": [
      "daten-wahrscheinlichkeiten-berechnen",
      "daten-zufall-und-wahrscheinlichkeit-einschaetzen",
      "zahlen-mengenoperationen-und-logik"
    ]
  },
  {
    "unitId": "daten-wahrscheinlichkeiten-berechnen",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 12,
    "titles": {
      "de": "Wahrscheinlichkeiten berechnen",
      "en": "Calculating probabilities",
      "fr": "Calculer des probabilités",
      "it": "Calcolare probabilità"
    },
    "prerequisites": [
      "brueche-brueche-und-dezimalzahlen-verstehen",
      "daten-daten-ordnen-und-darstellen",
      "daten-zufall-und-wahrscheinlichkeit-einschaetzen"
    ]
  },
  {
    "unitId": "daten-bedingte-wahrscheinlichkeit-und-bayes",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 13,
    "titles": {
      "de": "Bedingte Wahrscheinlichkeit und Satz von Bayes",
      "en": "Conditional probability and Bayes' theorem",
      "fr": "Probabilité conditionnelle et théorème de Bayes",
      "it": "Probabilità condizionata e teorema di Bayes"
    },
    "prerequisites": [
      "daten-ereignisse-und-mehrstufige-zufallsexperimente",
      "daten-wahrscheinlichkeiten-berechnen",
      "daten-zufall-und-wahrscheinlichkeit-einschaetzen"
    ]
  },
  {
    "unitId": "daten-kombinationen-und-binomischer-lehrsatz",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 14,
    "titles": {
      "de": "Kombinationen und binomischer Lehrsatz",
      "en": "Combinations and the binomial theorem",
      "fr": "Combinaisons et formule du binôme",
      "it": "Combinazioni e teorema binomiale"
    },
    "prerequisites": [
      "daten-zaehlprinzipien-und-variationen"
    ]
  },
  {
    "unitId": "daten-korrelation-und-lineare-regression",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 15,
    "titles": {
      "de": "Korrelation und lineare Regression",
      "en": "Correlation and linear regression",
      "fr": "Corrélation et régression linéaire",
      "it": "Correlazione e regressione lineare"
    },
    "prerequisites": [
      "daten-statistische-untersuchungen-durchfuehren",
      "gleichungen-lineare-funktionen"
    ]
  },
  {
    "unitId": "daten-zufallsvariablen-und-verteilungen",
    "subjectId": "mathematics",
    "topicId": "daten",
    "order": 16,
    "titles": {
      "de": "Zufallsvariablen und Verteilungen",
      "en": "Random variables and distributions",
      "fr": "Variables aléatoires et lois de probabilité",
      "it": "Variabili casuali e distribuzioni"
    },
    "prerequisites": [
      "daten-diagramme-und-histogramme-lesen",
      "daten-ereignisse-und-mehrstufige-zufallsexperimente",
      "daten-kombinationen-und-binomischer-lehrsatz",
      "daten-mittelwert-median-und-modalwert",
      "daten-streuung-quartile-und-boxplots"
    ]
  },
  {
    "unitId": "geometrie-lage-richtung-und-koordinaten",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 5,
    "titles": {
      "de": "Lage, Richtung und Koordinaten",
      "en": "Position, direction and coordinates",
      "fr": "Position, direction et coordonnées",
      "it": "Posizione, direzione e coordinate"
    },
    "prerequisites": [
      "zahlen-zahlenraum-bis-20"
    ]
  },
  {
    "unitId": "geometrie-ebene-figuren-und-vielecke",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 6,
    "titles": {
      "de": "Ebene Figuren und Vielecke",
      "en": "Plane shapes and polygons",
      "fr": "Figures planes et polygones",
      "it": "Figure piane e poligoni"
    },
    "prerequisites": []
  },
  {
    "unitId": "geometrie-koerper-ansichten-und-netze",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 7,
    "titles": {
      "de": "Körper, Ansichten und Netze",
      "en": "Solids, views and nets",
      "fr": "Solides, vues et patrons",
      "it": "Solidi, viste e sviluppi"
    },
    "prerequisites": [
      "geometrie-ebene-figuren-und-vielecke",
      "zahlen-zahlenraum-bis-20"
    ]
  },
  {
    "unitId": "geometrie-umfang-und-flaeche-ebener-figuren",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 8,
    "titles": {
      "de": "Umfang und Fläche ebener Figuren",
      "en": "Perimeter and area of plane shapes",
      "fr": "Périmètre et aire des figures planes",
      "it": "Perimetro e area delle figure piane"
    },
    "prerequisites": [
      "geometrie-ebene-figuren-und-vielecke",
      "geometrie-strecken-geraden-senkrechte-und-parallelen",
      "zahlen-mehrstellig-multiplizieren-und-dividieren",
      "zahlen-plus-und-minus-bis-100"
    ]
  },
  {
    "unitId": "geometrie-strecken-geraden-senkrechte-und-parallelen",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 9,
    "titles": {
      "de": "Strecken, Geraden, Senkrechte und Parallelen",
      "en": "Segments, lines, perpendiculars and parallels",
      "fr": "Segments, droites, perpendiculaires et parallèles",
      "it": "Segmenti, rette, perpendicolari e parallele"
    },
    "prerequisites": [
      "geometrie-ebene-figuren-und-vielecke",
      "groessen-laengen-und-flaechen"
    ]
  },
  {
    "unitId": "geometrie-winkel-messen-und-berechnen",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 10,
    "titles": {
      "de": "Winkel messen und berechnen",
      "en": "Measuring and calculating angles",
      "fr": "Mesurer et calculer des angles",
      "it": "Misurare e calcolare angoli"
    },
    "prerequisites": [
      "geometrie-strecken-geraden-senkrechte-und-parallelen",
      "gleichungen-lineare-gleichungen-loesen"
    ]
  },
  {
    "unitId": "geometrie-verschiebung-und-drehung",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 11,
    "titles": {
      "de": "Verschiebung und Drehung",
      "en": "Translation and rotation",
      "fr": "Translation et rotation",
      "it": "Traslazione e rotazione"
    },
    "prerequisites": [
      "geometrie-ebene-figuren-und-vielecke",
      "geometrie-lage-richtung-und-koordinaten"
    ]
  },
  {
    "unitId": "geometrie-dreiecke-und-winkelsummen",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 12,
    "titles": {
      "de": "Dreiecke und Winkelsummen",
      "en": "Triangles and angle sums",
      "fr": "Triangles et sommes des angles",
      "it": "Triangoli e somme degli angoli"
    },
    "prerequisites": [
      "geometrie-ebene-figuren-und-vielecke",
      "geometrie-strecken-geraden-senkrechte-und-parallelen"
    ]
  },
  {
    "unitId": "geometrie-achsen-und-punktsymmetrie",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 13,
    "titles": {
      "de": "Achsen- und Punktsymmetrie",
      "en": "Line and point symmetry",
      "fr": "Symétrie axiale et centrale",
      "it": "Simmetria assiale e centrale"
    },
    "prerequisites": [
      "geometrie-lage-richtung-und-koordinaten",
      "geometrie-strecken-geraden-senkrechte-und-parallelen"
    ]
  },
  {
    "unitId": "geometrie-volumen-und-oberflaeche-von-koerpern",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 14,
    "titles": {
      "de": "Volumen und Oberfläche von Körpern",
      "en": "Volume and surface area of solids",
      "fr": "Volume et aire des solides",
      "it": "Volume e superficie dei solidi"
    },
    "prerequisites": [
      "geometrie-koerper-ansichten-und-netze",
      "geometrie-umfang-und-flaeche-ebener-figuren",
      "groessen-laengen-und-flaechen"
    ]
  },
  {
    "unitId": "geometrie-kreis-umfang-flaeche-und-sektor",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 15,
    "titles": {
      "de": "Kreis: Umfang, Fläche und Sektor",
      "en": "Circle: circumference, area and sector",
      "fr": "Cercle : circonférence, aire et secteur",
      "it": "Cerchio: circonferenza, area e settore"
    },
    "prerequisites": [
      "geometrie-strecken-geraden-senkrechte-und-parallelen",
      "geometrie-umfang-und-flaeche-ebener-figuren",
      "geometrie-winkel-messen-und-berechnen",
      "gleichungen-ersetzen-und-groessenbeziehungen",
      "zahlen-rechnen-mit-dezimalzahlen"
    ]
  },
  {
    "unitId": "geometrie-winkel-an-parallelen-und-beweise",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 16,
    "titles": {
      "de": "Winkel an Parallelen und geometrische Beweise",
      "en": "Angles at parallel lines and geometric proofs",
      "fr": "Angles et parallèles, démonstrations géométriques",
      "it": "Angoli e parallele, dimostrazioni geometriche"
    },
    "prerequisites": [
      "geometrie-strecken-geraden-senkrechte-und-parallelen",
      "geometrie-winkel-messen-und-berechnen"
    ]
  },
  {
    "unitId": "geometrie-kongruenz-und-gleichschenklige-dreiecke",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 17,
    "titles": {
      "de": "Kongruenz und gleichschenklige Dreiecke",
      "en": "Congruence and isosceles triangles",
      "fr": "Isométrie et triangles isocèles",
      "it": "Congruenza e triangoli isosceli"
    },
    "prerequisites": [
      "geometrie-dreiecke-und-winkelsummen",
      "geometrie-verschiebung-und-drehung",
      "geometrie-winkel-an-parallelen-und-beweise"
    ]
  },
  {
    "unitId": "geometrie-parallelogramme-und-besondere-vierecke",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 18,
    "titles": {
      "de": "Parallelogramme und besondere Vierecke",
      "en": "Parallelograms and special quadrilaterals",
      "fr": "Parallélogrammes et quadrilatères particuliers",
      "it": "Parallelogrammi e quadrilateri particolari"
    },
    "prerequisites": [
      "geometrie-ebene-figuren-und-vielecke",
      "geometrie-kongruenz-und-gleichschenklige-dreiecke",
      "geometrie-rechtwinklige-dreiecke-und-pythagoras",
      "geometrie-strecken-geraden-senkrechte-und-parallelen",
      "geometrie-winkel-an-parallelen-und-beweise"
    ]
  },
  {
    "unitId": "geometrie-rechtwinklige-dreiecke-und-pythagoras",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 19,
    "titles": {
      "de": "Rechtwinklige Dreiecke und Satz des Pythagoras",
      "en": "Right triangles and the Pythagorean theorem",
      "fr": "Triangles rectangles et théorème de Pythagore",
      "it": "Triangoli rettangoli e teorema di Pitagora"
    },
    "prerequisites": [
      "geometrie-dreiecke-und-winkelsummen",
      "geometrie-kongruenz-und-gleichschenklige-dreiecke",
      "gleichungen-binomische-formeln-und-faktorisieren",
      "zahlen-rechnen-mit-quadratwurzeln",
      "zahlen-wurzeln-und-reelle-zahlen"
    ]
  },
  {
    "unitId": "geometrie-besondere-linien-inkreis-und-umkreis",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 20,
    "titles": {
      "de": "Besondere Linien im Dreieck, Inkreis und Umkreis",
      "en": "Special lines in a triangle, incircle and circumcircle",
      "fr": "Droites remarquables du triangle, cercles inscrit et circonscrit",
      "it": "Linee notevoli del triangolo, cerchio inscritto e circoscritto"
    },
    "prerequisites": [
      "geometrie-achsen-und-punktsymmetrie",
      "geometrie-dreiecke-und-winkelsummen",
      "geometrie-kongruenz-und-gleichschenklige-dreiecke",
      "geometrie-strecken-geraden-senkrechte-und-parallelen",
      "geometrie-winkel-messen-und-berechnen"
    ]
  },
  {
    "unitId": "geometrie-aehnlichkeit-und-zentrische-streckung",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 21,
    "titles": {
      "de": "Ähnlichkeit und zentrische Streckung",
      "en": "Similarity and dilation",
      "fr": "Similitude et homothétie",
      "it": "Similitudine e omotetia"
    },
    "prerequisites": [
      "geometrie-ebene-figuren-und-vielecke",
      "geometrie-lage-richtung-und-koordinaten",
      "geometrie-winkel-an-parallelen-und-beweise",
      "gleichungen-bruchterme-und-bruchgleichungen",
      "prozentrechnung-verhaeltnisse-und-proportionalitaet"
    ]
  },
  {
    "unitId": "geometrie-kreissaetze-sehnen-tangenten-umfangswinkel",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 22,
    "titles": {
      "de": "Kreissätze: Sehnen, Tangenten und Umfangswinkel",
      "en": "Circle theorems: chords, tangents and inscribed angles",
      "fr": "Théorèmes du cercle : cordes, tangentes et angles inscrits",
      "it": "Teoremi del cerchio: corde, tangenti e angoli alla circonferenza"
    },
    "prerequisites": [
      "geometrie-achsen-und-punktsymmetrie",
      "geometrie-besondere-linien-inkreis-und-umkreis",
      "geometrie-dreiecke-und-winkelsummen",
      "geometrie-kongruenz-und-gleichschenklige-dreiecke",
      "geometrie-kreis-umfang-flaeche-und-sektor",
      "geometrie-rechtwinklige-dreiecke-und-pythagoras",
      "geometrie-strecken-geraden-senkrechte-und-parallelen",
      "geometrie-verschiebung-und-drehung"
    ]
  },
  {
    "unitId": "geometrie-koerper-darstellen-projektionen-schraegbilder",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 23,
    "titles": {
      "de": "Körper darstellen: Projektionen und Schrägbilder",
      "en": "Representing solids: projections and oblique drawings",
      "fr": "Représenter des solides : projections et perspectives",
      "it": "Rappresentare solidi: proiezioni e assonometrie"
    },
    "prerequisites": [
      "geometrie-koerper-ansichten-und-netze"
    ]
  },
  {
    "unitId": "geometrie-trigonometrie",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 24,
    "titles": {
      "de": "Trigonometrie",
      "en": "Trigonometry",
      "fr": "Trigonométrie",
      "it": "Trigonometria"
    },
    "prerequisites": [
      "geometrie-aehnlichkeit-und-zentrische-streckung",
      "geometrie-rechtwinklige-dreiecke-und-pythagoras"
    ]
  },
  {
    "unitId": "geometrie-geraden-und-ebenen-im-raum",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 25,
    "titles": {
      "de": "Geraden und Ebenen im Raum",
      "en": "Lines and planes in space",
      "fr": "Droites et plans dans l'espace",
      "it": "Rette e piani nello spazio"
    },
    "prerequisites": [
      "geometrie-koerper-ansichten-und-netze",
      "geometrie-koerper-darstellen-projektionen-schraegbilder",
      "geometrie-strecken-geraden-senkrechte-und-parallelen"
    ]
  },
  {
    "unitId": "geometrie-vektoren-in-der-ebene",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 26,
    "titles": {
      "de": "Vektoren in der Ebene",
      "en": "Vectors in the plane",
      "fr": "Vecteurs dans le plan",
      "it": "Vettori nel piano"
    },
    "prerequisites": [
      "geometrie-lage-richtung-und-koordinaten"
    ]
  },
  {
    "unitId": "geometrie-skalarprodukt-und-geometrie-mit-vektoren",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 27,
    "titles": {
      "de": "Skalarprodukt und Geometrie mit Vektoren",
      "en": "Dot product and geometry with vectors",
      "fr": "Produit scalaire et géométrie vectorielle",
      "it": "Prodotto scalare e geometria con i vettori"
    },
    "prerequisites": [
      "geometrie-rechtwinklige-dreiecke-und-pythagoras",
      "geometrie-trigonometrie",
      "geometrie-vektoren-in-der-ebene",
      "geometrie-vektoren-und-koordinaten-im-raum"
    ]
  },
  {
    "unitId": "geometrie-ellipse",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 28,
    "titles": {
      "de": "Ellipse",
      "en": "Ellipse",
      "fr": "Ellipse",
      "it": "Ellisse"
    },
    "prerequisites": [
      "geometrie-geraden-in-der-koordinatenebene"
    ]
  },
  {
    "unitId": "geometrie-geraden-in-der-koordinatenebene",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 29,
    "titles": {
      "de": "Geraden in der Koordinatenebene",
      "en": "Lines in the coordinate plane",
      "fr": "Droites dans le plan repéré",
      "it": "Rette nel piano cartesiano"
    },
    "prerequisites": [
      "geometrie-lage-richtung-und-koordinaten",
      "geometrie-rechtwinklige-dreiecke-und-pythagoras",
      "geometrie-strecken-geraden-senkrechte-und-parallelen"
    ]
  },
  {
    "unitId": "geometrie-hyperbel-und-parabel",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 30,
    "titles": {
      "de": "Hyperbel und Parabel",
      "en": "Hyperbola and parabola",
      "fr": "Hyperbole et parabole",
      "it": "Iperbole e parabola"
    },
    "prerequisites": [
      "geometrie-ellipse"
    ]
  },
  {
    "unitId": "geometrie-kreisgleichungen-und-lage-zum-kreis",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 31,
    "titles": {
      "de": "Kreisgleichungen und Lage zum Kreis",
      "en": "Circle equations and positions relative to a circle",
      "fr": "Équations de cercle et positions relatives",
      "it": "Equazioni della circonferenza e posizioni relative"
    },
    "prerequisites": [
      "geometrie-geraden-in-der-koordinatenebene",
      "geometrie-kreis-umfang-flaeche-und-sektor"
    ]
  },
  {
    "unitId": "geometrie-lage-winkel-und-abstaende-mit-vektoren",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 32,
    "titles": {
      "de": "Lage, Winkel und Abstände mit Vektoren",
      "en": "Position, angles and distances with vectors",
      "fr": "Positions, angles et distances avec des vecteurs",
      "it": "Posizioni, angoli e distanze con i vettori"
    },
    "prerequisites": [
      "geometrie-geraden-und-ebenen-im-raum",
      "geometrie-skalarprodukt-und-geometrie-mit-vektoren",
      "geometrie-vektoren-und-koordinaten-im-raum"
    ]
  },
  {
    "unitId": "geometrie-vektoren-und-koordinaten-im-raum",
    "subjectId": "mathematics",
    "topicId": "geometrie",
    "order": 33,
    "titles": {
      "de": "Vektoren und Koordinaten im Raum",
      "en": "Vectors and coordinates in space",
      "fr": "Vecteurs et coordonnées dans l'espace",
      "it": "Vettori e coordinate nello spazio"
    },
    "prerequisites": [
      "geometrie-geraden-und-ebenen-im-raum",
      "geometrie-lage-richtung-und-koordinaten",
      "geometrie-rechtwinklige-dreiecke-und-pythagoras",
      "geometrie-vektoren-in-der-ebene"
    ]
  },
  {
    "unitId": "gleichungen-ersetzen-und-groessenbeziehungen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 3,
    "titles": {
      "de": "Sachaufgaben mit Ersetzen und Grössenbeziehungen",
      "en": "Word problems with substitution and quantity relations",
      "fr": "Problèmes par substitution et relations entre grandeurs",
      "it": "Problemi con sostituzione e relazioni tra grandezze"
    },
    "prerequisites": [
      "zahlen-einmaleins-und-teilen",
      "zahlen-mehrstellig-multiplizieren-und-dividieren",
      "zahlen-plus-und-minus-bis-1000"
    ]
  },
  {
    "unitId": "gleichungen-lineare-gleichungen-loesen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 4,
    "titles": {
      "de": "Lineare Gleichungen lösen",
      "en": "Solving linear equations",
      "fr": "Résoudre des équations linéaires",
      "it": "Risolvere equazioni lineari"
    },
    "prerequisites": [
      "gleichungen-terme-aufstellen-und-berechnen",
      "zahlen-rechnen-mit-dezimalzahlen"
    ]
  },
  {
    "unitId": "gleichungen-terme-aufstellen-und-berechnen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 5,
    "titles": {
      "de": "Terme aufstellen und berechnen",
      "en": "Writing and evaluating expressions",
      "fr": "Écrire et calculer des expressions",
      "it": "Scrivere e calcolare espressioni"
    },
    "prerequisites": [
      "gleichungen-ersetzen-und-groessenbeziehungen",
      "zahlen-muster-und-knobelaufgaben",
      "zahlen-rechengesetze-und-rechenreihenfolge"
    ]
  },
  {
    "unitId": "gleichungen-sachaufgaben-mit-gleichungen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 6,
    "titles": {
      "de": "Sachaufgaben mit Gleichungen",
      "en": "Word problems with equations",
      "fr": "Problèmes résolus par des équations",
      "it": "Problemi risolti con equazioni"
    },
    "prerequisites": [
      "gleichungen-ersetzen-und-groessenbeziehungen",
      "gleichungen-lineare-gleichungen-loesen",
      "gleichungen-terme-aufstellen-und-berechnen",
      "groessen-gewicht-hohlmasse-und-geld"
    ]
  },
  {
    "unitId": "gleichungen-lineare-gleichungssysteme",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 7,
    "titles": {
      "de": "Lineare Gleichungssysteme",
      "en": "Systems of linear equations",
      "fr": "Systèmes d’équations linéaires",
      "it": "Sistemi di equazioni lineari"
    },
    "prerequisites": [
      "gleichungen-lineare-gleichungen-loesen",
      "gleichungen-sachaufgaben-mit-gleichungen"
    ]
  },
  {
    "unitId": "gleichungen-rechnen-mit-polynomen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 8,
    "titles": {
      "de": "Rechnen mit Polynomen",
      "en": "Calculating with polynomials",
      "fr": "Calculer avec des polynômes",
      "it": "Calcolare con i polinomi"
    },
    "prerequisites": [
      "gleichungen-terme-aufstellen-und-berechnen",
      "zahlen-potenzen-und-potenzgesetze",
      "zahlen-rechnen-mit-rationalen-zahlen"
    ]
  },
  {
    "unitId": "gleichungen-lineare-ungleichungen-loesen-und-anwenden",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 9,
    "titles": {
      "de": "Lineare Ungleichungen lösen und anwenden",
      "en": "Solving and applying linear inequalities",
      "fr": "Résoudre et appliquer des inéquations linéaires",
      "it": "Risolvere e applicare disequazioni lineari"
    },
    "prerequisites": [
      "gleichungen-lineare-gleichungen-loesen",
      "gleichungen-sachaufgaben-mit-gleichungen",
      "gleichungen-ungleichungen-und-ihre-eigenschaften"
    ]
  },
  {
    "unitId": "gleichungen-ungleichungen-und-ihre-eigenschaften",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 10,
    "titles": {
      "de": "Ungleichungen und ihre Eigenschaften",
      "en": "Inequalities and their properties",
      "fr": "Inéquations et leurs propriétés",
      "it": "Disequazioni e loro proprietà"
    },
    "prerequisites": [
      "gleichungen-lineare-gleichungen-loesen",
      "zahlen-negative-und-rationale-zahlen",
      "zahlen-rechnen-mit-rationalen-zahlen"
    ]
  },
  {
    "unitId": "gleichungen-binomische-formeln-und-faktorisieren",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 11,
    "titles": {
      "de": "Binomische Formeln und Faktorisieren",
      "en": "Binomial formulas and factorising",
      "fr": "Identités remarquables et factorisation",
      "it": "Prodotti notevoli e scomposizione"
    },
    "prerequisites": [
      "gleichungen-rechnen-mit-polynomen"
    ]
  },
  {
    "unitId": "gleichungen-bruchterme-und-bruchgleichungen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 12,
    "titles": {
      "de": "Bruchterme und Bruchgleichungen",
      "en": "Algebraic fractions and fractional equations",
      "fr": "Fractions rationnelles et équations rationnelles",
      "it": "Frazioni algebriche ed equazioni fratte"
    },
    "prerequisites": [
      "gleichungen-binomische-formeln-und-faktorisieren",
      "gleichungen-lineare-gleichungen-loesen",
      "gleichungen-rechnen-mit-polynomen"
    ]
  },
  {
    "unitId": "gleichungen-funktionsbegriff-und-darstellungen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 13,
    "titles": {
      "de": "Funktionsbegriff und Darstellungen",
      "en": "The function concept and representations",
      "fr": "Notion de fonction et représentations",
      "it": "Concetto di funzione e rappresentazioni"
    },
    "prerequisites": [
      "geometrie-lage-richtung-und-koordinaten",
      "gleichungen-bruchterme-und-bruchgleichungen",
      "gleichungen-terme-aufstellen-und-berechnen",
      "zahlen-rechnen-mit-quadratwurzeln"
    ]
  },
  {
    "unitId": "gleichungen-lineare-funktionen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 14,
    "titles": {
      "de": "Lineare Funktionen",
      "en": "Linear functions",
      "fr": "Fonctions linéaires",
      "it": "Funzioni lineari"
    },
    "prerequisites": [
      "geometrie-verschiebung-und-drehung",
      "gleichungen-funktionsbegriff-und-darstellungen",
      "gleichungen-lineare-gleichungen-loesen",
      "gleichungen-lineare-gleichungssysteme",
      "gleichungen-lineare-ungleichungen-loesen-und-anwenden",
      "prozentrechnung-verhaeltnisse-und-proportionalitaet"
    ]
  },
  {
    "unitId": "gleichungen-umgekehrt-proportionale-funktionen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 15,
    "titles": {
      "de": "Umgekehrt proportionale Funktionen",
      "en": "Inverse proportional functions",
      "fr": "Fonctions inversement proportionnelles",
      "it": "Funzioni di proporzionalità inversa"
    },
    "prerequisites": [
      "geometrie-lage-richtung-und-koordinaten",
      "gleichungen-funktionsbegriff-und-darstellungen",
      "gleichungen-lineare-funktionen",
      "gleichungen-lineare-gleichungen-loesen",
      "prozentrechnung-verhaeltnisse-und-proportionalitaet"
    ]
  },
  {
    "unitId": "gleichungen-quadratische-funktionen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 16,
    "titles": {
      "de": "Quadratische Funktionen",
      "en": "Quadratic functions",
      "fr": "Fonctions quadratiques",
      "it": "Funzioni quadratiche"
    },
    "prerequisites": [
      "gleichungen-lineare-funktionen",
      "gleichungen-lineare-gleichungssysteme",
      "gleichungen-quadratische-gleichungen"
    ]
  },
  {
    "unitId": "gleichungen-quadratische-gleichungen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 17,
    "titles": {
      "de": "Quadratische Gleichungen",
      "en": "Quadratic equations",
      "fr": "Équations du second degré",
      "it": "Equazioni di secondo grado"
    },
    "prerequisites": [
      "gleichungen-binomische-formeln-und-faktorisieren",
      "gleichungen-lineare-gleichungen-loesen",
      "gleichungen-sachaufgaben-mit-gleichungen",
      "gleichungen-ungleichungen-und-ihre-eigenschaften",
      "zahlen-rechnen-mit-quadratwurzeln",
      "zahlen-wurzeln-und-reelle-zahlen"
    ]
  },
  {
    "unitId": "gleichungen-bogenmass-und-einheitskreis",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 18,
    "titles": {
      "de": "Bogenmass und Einheitskreis",
      "en": "Radians and the unit circle",
      "fr": "Radian et cercle trigonométrique",
      "it": "Radianti e circonferenza goniometrica"
    },
    "prerequisites": [
      "geometrie-trigonometrie",
      "geometrie-winkel-messen-und-berechnen",
      "gleichungen-funktionen-und-funktionsmodelle"
    ]
  },
  {
    "unitId": "gleichungen-eigenschaften-von-funktionen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 19,
    "titles": {
      "de": "Eigenschaften von Funktionen",
      "en": "Properties of functions",
      "fr": "Propriétés des fonctions",
      "it": "Proprietà delle funzioni"
    },
    "prerequisites": [
      "gleichungen-funktionen-und-funktionsmodelle",
      "gleichungen-quadratische-funktionen",
      "gleichungen-ungleichungen-und-ihre-eigenschaften"
    ]
  },
  {
    "unitId": "gleichungen-exponential-und-logarithmusfunktionen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 20,
    "titles": {
      "de": "Exponential- und Logarithmusfunktionen",
      "en": "Exponential and logarithmic functions",
      "fr": "Fonctions exponentielles et logarithmes",
      "it": "Funzioni esponenziali e logaritmiche"
    },
    "prerequisites": [
      "gleichungen-eigenschaften-von-funktionen",
      "zahlen-potenzen-und-potenzgesetze",
      "zahlen-rechnen-mit-quadratwurzeln"
    ]
  },
  {
    "unitId": "gleichungen-funktionen-und-funktionsmodelle",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 21,
    "titles": {
      "de": "Funktionen und Funktionsmodelle",
      "en": "Functions and function models",
      "fr": "Fonctions et modèles fonctionnels",
      "it": "Funzioni e modelli funzionali"
    },
    "prerequisites": [
      "gleichungen-funktionsbegriff-und-darstellungen",
      "gleichungen-quadratische-funktionen",
      "zahlen-mengen-und-teilmengen"
    ]
  },
  {
    "unitId": "gleichungen-trigonometrische-formeln",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 22,
    "titles": {
      "de": "Trigonometrische Formeln",
      "en": "Trigonometric identities",
      "fr": "Formules trigonométriques",
      "it": "Formule trigonometriche"
    },
    "prerequisites": [
      "gleichungen-bogenmass-und-einheitskreis"
    ]
  },
  {
    "unitId": "gleichungen-trigonometrische-funktionen",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 23,
    "titles": {
      "de": "Trigonometrische Funktionen",
      "en": "Trigonometric functions",
      "fr": "Fonctions trigonométriques",
      "it": "Funzioni trigonometriche"
    },
    "prerequisites": [
      "gleichungen-trigonometrische-formeln"
    ]
  },
  {
    "unitId": "gleichungen-ableitung-und-ableitungsregeln",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 24,
    "titles": {
      "de": "Ableitung und Ableitungsregeln",
      "en": "The derivative and differentiation rules",
      "fr": "Dérivée et règles de dérivation",
      "it": "Derivata e regole di derivazione"
    },
    "prerequisites": [
      "geometrie-geraden-in-der-koordinatenebene",
      "gleichungen-eigenschaften-von-funktionen"
    ]
  },
  {
    "unitId": "gleichungen-monotonie-und-extremwerte",
    "subjectId": "mathematics",
    "topicId": "gleichungen",
    "order": 25,
    "titles": {
      "de": "Monotonie und Extremwerte",
      "en": "Monotonicity and extrema",
      "fr": "Monotonie et extremums",
      "it": "Monotonia ed estremi"
    },
    "prerequisites": [
      "gleichungen-ableitung-und-ableitungsregeln"
    ]
  },
  {
    "unitId": "groessen-gewicht-hohlmasse-und-geld",
    "subjectId": "mathematics",
    "topicId": "groessen",
    "order": 4,
    "titles": {
      "de": "Gewicht, Hohlmasse und Geld",
      "en": "Weight, capacity and money",
      "fr": "Masse, contenance et argent",
      "it": "Peso, capacità e denaro"
    },
    "prerequisites": [
      "zahlen-addition-und-subtraktion-bis-20",
      "zahlen-stellenwerte-und-zahlensysteme"
    ]
  },
  {
    "unitId": "groessen-zeit-uhrzeit-und-zeitdauer",
    "subjectId": "mathematics",
    "topicId": "groessen",
    "order": 5,
    "titles": {
      "de": "Zeit: Uhrzeit, Zeiteinheiten und Zeitdauer",
      "en": "Time: clock, units of time and duration",
      "fr": "Le temps : heure, unités de temps et durée",
      "it": "Il tempo: ora, unità di tempo e durata"
    },
    "prerequisites": [
      "zahlen-plus-und-minus-bis-100",
      "zahlen-stellenwerte-und-zahlensysteme"
    ]
  },
  {
    "unitId": "groessen-laengen-und-flaechen",
    "subjectId": "mathematics",
    "topicId": "groessen",
    "order": 6,
    "titles": {
      "de": "Längen und Flächen",
      "en": "Length and area",
      "fr": "Longueurs et aires",
      "it": "Lunghezze e superfici"
    },
    "prerequisites": [
      "zahlen-zahlenraum-bis-20"
    ]
  },
  {
    "unitId": "prozentrechnung-prozente-und-prozentrechnung",
    "subjectId": "mathematics",
    "topicId": "prozentrechnung",
    "order": 3,
    "titles": {
      "de": "Prozente und Prozentrechnung",
      "en": "Percentages and percentage calculation",
      "fr": "Pourcentages et calcul de pourcentages",
      "it": "Percentuali e calcolo percentuale"
    },
    "prerequisites": [
      "brueche-brueche-multiplizieren-und-dividieren",
      "brueche-brueche-und-dezimalzahlen-verstehen",
      "groessen-gewicht-hohlmasse-und-geld"
    ]
  },
  {
    "unitId": "prozentrechnung-verhaeltnisse-und-proportionalitaet",
    "subjectId": "mathematics",
    "topicId": "prozentrechnung",
    "order": 4,
    "titles": {
      "de": "Verhältnisse und Proportionalität",
      "en": "Ratios and proportionality",
      "fr": "Rapports et proportionnalité",
      "it": "Rapporti e proporzionalità"
    },
    "prerequisites": [
      "brueche-brueche-multiplizieren-und-dividieren",
      "geometrie-lage-richtung-und-koordinaten",
      "gleichungen-ersetzen-und-groessenbeziehungen",
      "gleichungen-lineare-gleichungen-loesen"
    ]
  },
  {
    "unitId": "zahlen-addition-und-subtraktion-bis-20",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 5,
    "titles": {
      "de": "Addition und Subtraktion bis 20",
      "en": "Addition and subtraction up to 20",
      "fr": "Addition et soustraction jusqu'à 20",
      "it": "Addizione e sottrazione fino a 20"
    },
    "prerequisites": [
      "zahlen-plus-und-minus-bis-10",
      "zahlen-stellenwerte-und-zahlensysteme"
    ]
  },
  {
    "unitId": "zahlen-plus-und-minus-bis-10",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 6,
    "titles": {
      "de": "Plus und Minus bis 10",
      "en": "Addition and subtraction up to 10",
      "fr": "Addition et soustraction jusqu'à 10",
      "it": "Addizione e sottrazione fino a 10"
    },
    "prerequisites": [
      "zahlen-zahlenraum-bis-20"
    ]
  },
  {
    "unitId": "zahlen-plus-und-minus-bis-100",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 7,
    "titles": {
      "de": "Plus und Minus bis 100",
      "en": "Addition and subtraction up to 100",
      "fr": "Addition et soustraction jusqu'à 100",
      "it": "Addizione e sottrazione fino a 100"
    },
    "prerequisites": [
      "zahlen-addition-und-subtraktion-bis-20",
      "zahlen-plus-und-minus-bis-10",
      "zahlen-stellenwerte-und-zahlensysteme"
    ]
  },
  {
    "unitId": "zahlen-zahlenraum-bis-20",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 8,
    "titles": {
      "de": "Zahlen bis 20",
      "en": "Numbers up to 20",
      "fr": "Les nombres jusqu'à 20",
      "it": "I numeri fino a 20"
    },
    "prerequisites": []
  },
  {
    "unitId": "zahlen-stellenwerte-und-zahlensysteme",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 9,
    "titles": {
      "de": "Stellenwerte und Zahlensysteme",
      "en": "Place value and number systems",
      "fr": "Valeur positionnelle et systèmes de numération",
      "it": "Valore posizionale e sistemi di numerazione"
    },
    "prerequisites": [
      "zahlen-zahlenraum-bis-20"
    ]
  },
  {
    "unitId": "zahlen-plus-und-minus-bis-1000",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 10,
    "titles": {
      "de": "Plus und Minus bis 1000",
      "en": "Addition and subtraction up to 1000",
      "fr": "Addition et soustraction jusqu'à 1000",
      "it": "Addizione e sottrazione fino a 1000"
    },
    "prerequisites": [
      "zahlen-plus-und-minus-bis-100",
      "zahlen-stellenwerte-und-zahlensysteme"
    ]
  },
  {
    "unitId": "zahlen-einmaleins-und-teilen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 11,
    "titles": {
      "de": "Einmaleins und Teilen",
      "en": "Times tables and division",
      "fr": "Livrets et division",
      "it": "Tabelline e divisione"
    },
    "prerequisites": [
      "zahlen-plus-und-minus-bis-10"
    ]
  },
  {
    "unitId": "zahlen-mehrstellig-multiplizieren-und-dividieren",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 12,
    "titles": {
      "de": "Mehrstellig multiplizieren und dividieren",
      "en": "Multiplying and dividing larger numbers",
      "fr": "Multiplier et diviser de grands nombres",
      "it": "Moltiplicare e dividere numeri a più cifre"
    },
    "prerequisites": [
      "zahlen-einmaleins-und-teilen",
      "zahlen-plus-und-minus-bis-1000",
      "zahlen-rechengesetze-und-rechenreihenfolge"
    ]
  },
  {
    "unitId": "zahlen-rechengesetze-und-rechenreihenfolge",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 13,
    "titles": {
      "de": "Rechengesetze und Rechenreihenfolge",
      "en": "Laws of arithmetic and order of operations",
      "fr": "Lois de calcul et priorité des opérations",
      "it": "Proprietà delle operazioni e ordine di calcolo"
    },
    "prerequisites": [
      "zahlen-einmaleins-und-teilen",
      "zahlen-plus-und-minus-bis-100"
    ]
  },
  {
    "unitId": "zahlen-muster-und-knobelaufgaben",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 14,
    "titles": {
      "de": "Muster und Knobelaufgaben",
      "en": "Patterns and puzzles",
      "fr": "Suites et problèmes de logique",
      "it": "Successioni e rompicapi"
    },
    "prerequisites": [
      "zahlen-plus-und-minus-bis-10",
      "zahlen-rechengesetze-und-rechenreihenfolge",
      "zahlen-stellenwerte-und-zahlensysteme"
    ]
  },
  {
    "unitId": "zahlen-rechnen-mit-dezimalzahlen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 15,
    "titles": {
      "de": "Rechnen mit Dezimalzahlen",
      "en": "Calculating with decimals",
      "fr": "Calculer avec les nombres décimaux",
      "it": "Calcolare con i numeri decimali"
    },
    "prerequisites": [
      "brueche-brueche-und-dezimalzahlen-verstehen",
      "gleichungen-ersetzen-und-groessenbeziehungen",
      "zahlen-mehrstellig-multiplizieren-und-dividieren",
      "zahlen-plus-und-minus-bis-100",
      "zahlen-rechengesetze-und-rechenreihenfolge"
    ]
  },
  {
    "unitId": "zahlen-mengenoperationen-und-logik",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 16,
    "titles": {
      "de": "Mengenoperationen und Logik",
      "en": "Set operations and logic",
      "fr": "Opérations sur les ensembles et logique",
      "it": "Operazioni tra insiemi e logica"
    },
    "prerequisites": [
      "zahlen-plus-und-minus-bis-100"
    ]
  },
  {
    "unitId": "zahlen-dezimalstellen-runden-und-ueberschlagen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 17,
    "titles": {
      "de": "Dezimalstellen, Runden und Überschlagen",
      "en": "Decimal places, rounding and estimating",
      "fr": "Décimales, arrondis et estimations",
      "it": "Cifre decimali, arrotondamento e stime"
    },
    "prerequisites": [
      "brueche-brueche-und-dezimalzahlen-verstehen",
      "zahlen-mehrstellig-multiplizieren-und-dividieren",
      "zahlen-stellenwerte-und-zahlensysteme"
    ]
  },
  {
    "unitId": "zahlen-teilbarkeit-primzahlen-ggt-kgv",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 18,
    "titles": {
      "de": "Teilbarkeit, Primzahlen, ggT und kgV",
      "en": "Divisibility, primes, GCD and LCM",
      "fr": "Divisibilité, nombres premiers, PGCD et PPCM",
      "it": "Divisibilità, numeri primi, MCD e mcm"
    },
    "prerequisites": [
      "zahlen-mehrstellig-multiplizieren-und-dividieren"
    ]
  },
  {
    "unitId": "zahlen-negative-und-rationale-zahlen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 19,
    "titles": {
      "de": "Negative und rationale Zahlen",
      "en": "Negative and rational numbers",
      "fr": "Nombres négatifs et rationnels",
      "it": "Numeri negativi e razionali"
    },
    "prerequisites": [
      "brueche-brueche-und-dezimalzahlen-verstehen",
      "zahlen-dezimalstellen-runden-und-ueberschlagen",
      "zahlen-stellenwerte-und-zahlensysteme"
    ]
  },
  {
    "unitId": "zahlen-rechnen-mit-rationalen-zahlen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 20,
    "titles": {
      "de": "Rechnen mit rationalen Zahlen",
      "en": "Calculating with rational numbers",
      "fr": "Calculer avec les nombres rationnels",
      "it": "Calcolare con i numeri razionali"
    },
    "prerequisites": [
      "zahlen-negative-und-rationale-zahlen"
    ]
  },
  {
    "unitId": "zahlen-wurzeln-und-reelle-zahlen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 21,
    "titles": {
      "de": "Wurzeln und reelle Zahlen",
      "en": "Roots and real numbers",
      "fr": "Racines et nombres réels",
      "it": "Radici e numeri reali"
    },
    "prerequisites": [
      "zahlen-negative-und-rationale-zahlen",
      "zahlen-potenzen-und-potenzgesetze",
      "zahlen-rechnen-mit-rationalen-zahlen"
    ]
  },
  {
    "unitId": "zahlen-potenzen-und-potenzgesetze",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 22,
    "titles": {
      "de": "Potenzen und Potenzgesetze",
      "en": "Powers and laws of exponents",
      "fr": "Puissances et règles de calcul",
      "it": "Potenze e proprietà delle potenze"
    },
    "prerequisites": [
      "zahlen-rechnen-mit-rationalen-zahlen"
    ]
  },
  {
    "unitId": "zahlen-rechnen-mit-quadratwurzeln",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 23,
    "titles": {
      "de": "Rechnen mit Quadratwurzeln",
      "en": "Calculating with square roots",
      "fr": "Calculer avec les racines carrées",
      "it": "Calcolare con le radici quadrate"
    },
    "prerequisites": [
      "gleichungen-lineare-ungleichungen-loesen-und-anwenden",
      "gleichungen-rechnen-mit-polynomen",
      "zahlen-wurzeln-und-reelle-zahlen"
    ]
  },
  {
    "unitId": "zahlen-mengen-und-teilmengen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 24,
    "titles": {
      "de": "Mengen und Teilmengen",
      "en": "Sets and subsets",
      "fr": "Ensembles et sous-ensembles",
      "it": "Insiemi e sottoinsiemi"
    },
    "prerequisites": [
      "zahlen-wurzeln-und-reelle-zahlen"
    ]
  },
  {
    "unitId": "zahlen-komplexe-zahlen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 25,
    "titles": {
      "de": "Komplexe Zahlen",
      "en": "Complex numbers",
      "fr": "Nombres complexes",
      "it": "Numeri complessi"
    },
    "prerequisites": [
      "geometrie-lage-richtung-und-koordinaten",
      "zahlen-mengen-und-teilmengen"
    ]
  },
  {
    "unitId": "zahlen-arithmetische-folgen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 26,
    "titles": {
      "de": "Arithmetische Folgen",
      "en": "Arithmetic sequences",
      "fr": "Suites arithmétiques",
      "it": "Successioni aritmetiche"
    },
    "prerequisites": [
      "zahlen-folgen-rekursion-und-induktion"
    ]
  },
  {
    "unitId": "zahlen-folgen-rekursion-und-induktion",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 27,
    "titles": {
      "de": "Folgen, Rekursion und Induktion",
      "en": "Sequences, recursion and induction",
      "fr": "Suites, récurrence et induction",
      "it": "Successioni, ricorsione e induzione"
    },
    "prerequisites": [
      "gleichungen-funktionen-und-funktionsmodelle"
    ]
  },
  {
    "unitId": "zahlen-geometrische-folgen",
    "subjectId": "mathematics",
    "topicId": "zahlen",
    "order": 28,
    "titles": {
      "de": "Geometrische Folgen",
      "en": "Geometric sequences",
      "fr": "Suites géométriques",
      "it": "Successioni geometriche"
    },
    "prerequisites": [
      "gleichungen-exponential-und-logarithmusfunktionen",
      "zahlen-folgen-rekursion-und-induktion"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-elektrische-energie-leistung-und-haushalt",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 1,
    "titles": {
      "de": "Elektrische Energie, Leistung und Haushalt",
      "en": "Electrical energy, power and the household",
      "fr": "Énergie électrique, puissance et ménage",
      "it": "Energia elettrica, potenza e casa"
    },
    "prerequisites": [
      "physik-elektrizitaet-ladung-strom-und-stromkreise",
      "physik-elektrizitaet-widerstand-und-ohmsches-gesetz"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-ladung-strom-und-stromkreise",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 2,
    "titles": {
      "de": "Ladung, Strom und Stromkreise",
      "en": "Charge, current and circuits",
      "fr": "Charge, courant et circuits",
      "it": "Carica, corrente e circuiti"
    },
    "prerequisites": []
  },
  {
    "unitId": "physik-elektrizitaet-magnetfeld-und-elektromagnet",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 3,
    "titles": {
      "de": "Magnetfeld und Elektromagnet",
      "en": "Magnetic field and electromagnet",
      "fr": "Champ magnétique et électroaimant",
      "it": "Campo magnetico ed elettromagnete"
    },
    "prerequisites": [
      "physik-elektrizitaet-ladung-strom-und-stromkreise"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-schaltungen-und-innenwiderstand-berechnen",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 4,
    "titles": {
      "de": "Schaltungen und Innenwiderstand berechnen",
      "en": "Calculating circuits and internal resistance",
      "fr": "Calculer des circuits et la résistance interne",
      "it": "Calcolare circuiti e resistenza interna"
    },
    "prerequisites": [
      "physik-elektrizitaet-elektrische-energie-leistung-und-haushalt",
      "physik-elektrizitaet-ladung-strom-und-stromkreise",
      "physik-elektrizitaet-widerstand-und-ohmsches-gesetz"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-widerstand-und-ohmsches-gesetz",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 5,
    "titles": {
      "de": "Widerstand und ohmsches Gesetz",
      "en": "Resistance and Ohm's law",
      "fr": "Résistance et loi d'Ohm",
      "it": "Resistenza e legge di Ohm"
    },
    "prerequisites": [
      "physik-elektrizitaet-ladung-strom-und-stromkreise",
      "physik-praxis-messen-energiesparen-steuern"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-elektromagnetische-induktion",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 6,
    "titles": {
      "de": "Elektromagnetische Induktion",
      "en": "Electromagnetic induction",
      "fr": "Induction électromagnétique",
      "it": "Induzione elettromagnetica"
    },
    "prerequisites": [
      "physik-elektrizitaet-kraefte-im-magnetfeld-und-elektromotor",
      "physik-elektrizitaet-magnetfeld-und-elektromagnet",
      "physik-elektrizitaet-schaltungen-und-innenwiderstand-berechnen"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-elektromagnetische-wellen-und-nachrichtentechnik",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 7,
    "titles": {
      "de": "Elektromagnetische Wellen und Nachrichtentechnik",
      "en": "Electromagnetic waves and communication technology",
      "fr": "Ondes électromagnétiques et télécommunications",
      "it": "Onde elettromagnetiche e telecomunicazioni"
    },
    "prerequisites": [
      "physik-elektrizitaet-elektromagnetische-induktion",
      "physik-elektrizitaet-kraefte-im-magnetfeld-und-elektromotor",
      "physik-elektrizitaet-widerstand-und-ohmsches-gesetz",
      "physik-optik-akustik-ausbreitung-reflexion-und-brechung-des-lichts"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-kraefte-im-magnetfeld-und-elektromotor",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 8,
    "titles": {
      "de": "Kräfte im Magnetfeld und Elektromotor",
      "en": "Forces in a magnetic field and the electric motor",
      "fr": "Forces dans un champ magnétique et moteur électrique",
      "it": "Forze nel campo magnetico e motore elettrico"
    },
    "prerequisites": [
      "physik-elektrizitaet-magnetfeld-und-elektromagnet"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-coulombsches-gesetz-und-elektrisches-feld",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 9,
    "titles": {
      "de": "Coulombsches Gesetz und elektrisches Feld",
      "en": "Coulomb's law and the electric field",
      "fr": "Loi de Coulomb et champ électrique",
      "it": "Legge di Coulomb e campo elettrico"
    },
    "prerequisites": [
      "physik-elektrizitaet-ladung-strom-und-stromkreise",
      "physik-mechanik-freier-fall-und-wurfbewegungen",
      "physik-mechanik-kraefte-zusammensetzen-und-gleichgewicht",
      "physik-mechanik-mechanische-energie-und-energieerhaltung"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-potential-spannung-und-kondensator",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 10,
    "titles": {
      "de": "Potential, Spannung und Kondensator",
      "en": "Potential, voltage and capacitor",
      "fr": "Potentiel, tension et condensateur",
      "it": "Potenziale, tensione e condensatore"
    },
    "prerequisites": [
      "physik-elektrizitaet-coulombsches-gesetz-und-elektrisches-feld",
      "physik-mechanik-arbeit-leistung-und-einfache-maschinen"
    ]
  },
  {
    "unitId": "physik-elektrizitaet-wechselstrom-transformator-und-selbstinduktion",
    "subjectId": "physics",
    "topicId": "physik-elektrizitaet",
    "order": 11,
    "titles": {
      "de": "Wechselstrom, Transformator und Selbstinduktion",
      "en": "Alternating current, transformer and self-induction",
      "fr": "Courant alternatif, transformateur et auto-induction",
      "it": "Corrente alternata, trasformatore e autoinduzione"
    },
    "prerequisites": [
      "physik-elektrizitaet-elektrische-energie-leistung-und-haushalt",
      "physik-elektrizitaet-elektromagnetische-induktion",
      "physik-elektrizitaet-magnetfeld-und-elektromagnet"
    ]
  },
  {
    "unitId": "physik-mechanik-druck-und-auftrieb",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 1,
    "titles": {
      "de": "Druck und Auftrieb",
      "en": "Pressure and buoyancy",
      "fr": "Pression et poussée d'Archimède",
      "it": "Pressione e spinta di Archimede"
    },
    "prerequisites": [
      "physik-mechanik-kraefte-zusammensetzen-und-gleichgewicht",
      "physik-mechanik-masse-dichte-und-gewichtskraft"
    ]
  },
  {
    "unitId": "physik-mechanik-bewegung-geschwindigkeit-und-beschleunigung",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 2,
    "titles": {
      "de": "Bewegung, Geschwindigkeit und Beschleunigung",
      "en": "Motion, velocity and acceleration",
      "fr": "Mouvement, vitesse et accélération",
      "it": "Moto, velocità e accelerazione"
    },
    "prerequisites": [
      "physik-praxis-messen-energiesparen-steuern"
    ]
  },
  {
    "unitId": "physik-mechanik-kraefte-elastische-kraft-und-reibung",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 3,
    "titles": {
      "de": "Kräfte, elastische Kraft und Reibung",
      "en": "Forces, elastic force and friction",
      "fr": "Forces, force élastique et frottement",
      "it": "Forze, forza elastica e attrito"
    },
    "prerequisites": [
      "physik-mechanik-kraefte-zusammensetzen-und-gleichgewicht"
    ]
  },
  {
    "unitId": "physik-mechanik-kraefte-zusammensetzen-und-gleichgewicht",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 4,
    "titles": {
      "de": "Kräfte zusammensetzen und Kräftegleichgewicht",
      "en": "Combining forces and equilibrium",
      "fr": "Composition des forces et équilibre",
      "it": "Composizione delle forze ed equilibrio"
    },
    "prerequisites": [
      "physik-mechanik-masse-dichte-und-gewichtskraft"
    ]
  },
  {
    "unitId": "physik-mechanik-masse-dichte-und-gewichtskraft",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 5,
    "titles": {
      "de": "Masse, Dichte und Gewichtskraft",
      "en": "Mass, density and weight",
      "fr": "Masse, masse volumique et poids",
      "it": "Massa, densità e forza peso"
    },
    "prerequisites": []
  },
  {
    "unitId": "physik-mechanik-newtonsche-gesetze",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 6,
    "titles": {
      "de": "Newtonsche Gesetze",
      "en": "Newton's laws",
      "fr": "Lois de Newton",
      "it": "Leggi di Newton"
    },
    "prerequisites": [
      "physik-mechanik-bewegung-geschwindigkeit-und-beschleunigung",
      "physik-mechanik-kraefte-elastische-kraft-und-reibung",
      "physik-mechanik-kraefte-zusammensetzen-und-gleichgewicht"
    ]
  },
  {
    "unitId": "physik-mechanik-arbeit-leistung-und-einfache-maschinen",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 7,
    "titles": {
      "de": "Arbeit, Leistung und einfache Maschinen",
      "en": "Work, power and simple machines",
      "fr": "Travail, puissance et machines simples",
      "it": "Lavoro, potenza e macchine semplici"
    },
    "prerequisites": [
      "physik-mechanik-bewegung-geschwindigkeit-und-beschleunigung",
      "physik-mechanik-kraefte-elastische-kraft-und-reibung",
      "physik-mechanik-kraefte-zusammensetzen-und-gleichgewicht",
      "physik-mechanik-masse-dichte-und-gewichtskraft"
    ]
  },
  {
    "unitId": "physik-mechanik-mechanische-energie-und-energieerhaltung",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 8,
    "titles": {
      "de": "Mechanische Energie und Energieerhaltung",
      "en": "Mechanical energy and conservation of energy",
      "fr": "Énergie mécanique et conservation de l'énergie",
      "it": "Energia meccanica e conservazione dell'energia"
    },
    "prerequisites": [
      "physik-mechanik-arbeit-leistung-und-einfache-maschinen",
      "physik-mechanik-bewegung-geschwindigkeit-und-beschleunigung",
      "physik-mechanik-kraefte-elastische-kraft-und-reibung",
      "physik-mechanik-masse-dichte-und-gewichtskraft",
      "physik-waerme-teilchenmodell-temperatur-und-waerme"
    ]
  },
  {
    "unitId": "physik-mechanik-freier-fall-und-wurfbewegungen",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 9,
    "titles": {
      "de": "Freier Fall und Wurfbewegungen",
      "en": "Free fall and projectile motion",
      "fr": "Chute libre et mouvements de projectiles",
      "it": "Caduta libera e moto dei proiettili"
    },
    "prerequisites": [
      "physik-mechanik-bewegung-geschwindigkeit-und-beschleunigung",
      "physik-mechanik-newtonsche-gesetze"
    ]
  },
  {
    "unitId": "physik-mechanik-kreisbewegung-und-gravitation",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 10,
    "titles": {
      "de": "Kreisbewegung und Gravitation",
      "en": "Circular motion and gravitation",
      "fr": "Mouvement circulaire et gravitation",
      "it": "Moto circolare e gravitazione"
    },
    "prerequisites": [
      "physik-mechanik-bewegung-geschwindigkeit-und-beschleunigung",
      "physik-mechanik-freier-fall-und-wurfbewegungen",
      "physik-mechanik-newtonsche-gesetze"
    ]
  },
  {
    "unitId": "physik-mechanik-impuls-und-stoesse",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 11,
    "titles": {
      "de": "Impuls und Stösse",
      "en": "Momentum and collisions",
      "fr": "Quantité de mouvement et chocs",
      "it": "Quantità di moto e urti"
    },
    "prerequisites": [
      "physik-mechanik-bewegung-geschwindigkeit-und-beschleunigung",
      "physik-mechanik-kraefte-elastische-kraft-und-reibung",
      "physik-mechanik-mechanische-energie-und-energieerhaltung",
      "physik-mechanik-newtonsche-gesetze"
    ]
  },
  {
    "unitId": "physik-mechanik-mechanische-schwingungen",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 12,
    "titles": {
      "de": "Mechanische Schwingungen",
      "en": "Mechanical oscillations",
      "fr": "Oscillations mécaniques",
      "it": "Oscillazioni meccaniche"
    },
    "prerequisites": [
      "physik-mechanik-kraefte-elastische-kraft-und-reibung",
      "physik-mechanik-kraefte-zusammensetzen-und-gleichgewicht",
      "physik-mechanik-newtonsche-gesetze"
    ]
  },
  {
    "unitId": "physik-mechanik-mechanische-wellen",
    "subjectId": "physics",
    "topicId": "physik-mechanik",
    "order": 13,
    "titles": {
      "de": "Mechanische Wellen",
      "en": "Mechanical waves",
      "fr": "Ondes mécaniques",
      "it": "Onde meccaniche"
    },
    "prerequisites": [
      "physik-mechanik-mechanische-schwingungen"
    ]
  },
  {
    "unitId": "physik-modern-kernphysik-und-energieversorgung",
    "subjectId": "physics",
    "topicId": "physik-modern",
    "order": 1,
    "titles": {
      "de": "Kernphysik und Energieversorgung",
      "en": "Nuclear physics and energy supply",
      "fr": "Physique nucléaire et approvisionnement en énergie",
      "it": "Fisica nucleare e approvvigionamento energetico"
    },
    "prerequisites": [
      "physik-mechanik-mechanische-energie-und-energieerhaltung"
    ]
  },
  {
    "unitId": "physik-modern-relativitaet-und-quantenphysik",
    "subjectId": "physics",
    "topicId": "physik-modern",
    "order": 2,
    "titles": {
      "de": "Relativität und Quantenphysik",
      "en": "Relativity and quantum physics",
      "fr": "Relativité et physique quantique",
      "it": "Relatività e fisica quantistica"
    },
    "prerequisites": [
      "physik-elektrizitaet-coulombsches-gesetz-und-elektrisches-feld",
      "physik-elektrizitaet-elektromagnetische-wellen-und-nachrichtentechnik",
      "physik-mechanik-impuls-und-stoesse",
      "physik-mechanik-mechanische-energie-und-energieerhaltung"
    ]
  },
  {
    "unitId": "physik-optik-akustik-linsen-und-optische-geraete",
    "subjectId": "physics",
    "topicId": "physik-optik-akustik",
    "order": 1,
    "titles": {
      "de": "Linsen und optische Geräte",
      "en": "Lenses and optical instruments",
      "fr": "Lentilles et instruments d'optique",
      "it": "Lenti e strumenti ottici"
    },
    "prerequisites": [
      "physik-optik-akustik-ausbreitung-reflexion-und-brechung-des-lichts"
    ]
  },
  {
    "unitId": "physik-optik-akustik-schall-und-laerm",
    "subjectId": "physics",
    "topicId": "physik-optik-akustik",
    "order": 2,
    "titles": {
      "de": "Schall und Lärm",
      "en": "Sound and noise",
      "fr": "Son et bruit",
      "it": "Suono e rumore"
    },
    "prerequisites": []
  },
  {
    "unitId": "physik-optik-akustik-ausbreitung-reflexion-und-brechung-des-lichts",
    "subjectId": "physics",
    "topicId": "physik-optik-akustik",
    "order": 3,
    "titles": {
      "de": "Ausbreitung, Reflexion und Brechung des Lichts",
      "en": "Propagation, reflection and refraction of light",
      "fr": "Propagation, réflexion et réfraction de la lumière",
      "it": "Propagazione, riflessione e rifrazione della luce"
    },
    "prerequisites": []
  },
  {
    "unitId": "physik-optik-akustik-wellenoptik",
    "subjectId": "physics",
    "topicId": "physik-optik-akustik",
    "order": 4,
    "titles": {
      "de": "Wellenoptik",
      "en": "Wave optics",
      "fr": "Optique ondulatoire",
      "it": "Ottica ondulatoria"
    },
    "prerequisites": [
      "physik-mechanik-mechanische-wellen"
    ]
  },
  {
    "unitId": "physik-praxis-messen-energiesparen-steuern",
    "subjectId": "physics",
    "topicId": "physik-praxis",
    "order": 1,
    "titles": {
      "de": "Messen, Energie sparen und Steuern in der Praxis",
      "en": "Measuring, saving energy and control in practice",
      "fr": "Mesurer, économiser l'énergie et commander en pratique",
      "it": "Misurare, risparmiare energia e controllare nella pratica"
    },
    "prerequisites": []
  },
  {
    "unitId": "physik-waerme-aggregatzustaende-und-zustandsaenderungen",
    "subjectId": "physics",
    "topicId": "physik-waerme",
    "order": 1,
    "titles": {
      "de": "Aggregatzustände und Zustandsänderungen",
      "en": "States of matter and changes of state",
      "fr": "États de la matière et changements d'état",
      "it": "Stati di aggregazione e passaggi di stato"
    },
    "prerequisites": [
      "physik-waerme-teilchenmodell-temperatur-und-waerme"
    ]
  },
  {
    "unitId": "physik-waerme-teilchenmodell-temperatur-und-waerme",
    "subjectId": "physics",
    "topicId": "physik-waerme",
    "order": 2,
    "titles": {
      "de": "Teilchenmodell, Temperatur und Wärme",
      "en": "Particle model, temperature and heat",
      "fr": "Modèle particulaire, température et chaleur",
      "it": "Modello particellare, temperatura e calore"
    },
    "prerequisites": [
      "physik-mechanik-masse-dichte-und-gewichtskraft"
    ]
  },
  {
    "unitId": "physik-waerme-thermodynamik-und-waermekraftmaschinen",
    "subjectId": "physics",
    "topicId": "physik-waerme",
    "order": 3,
    "titles": {
      "de": "Hauptsätze der Thermodynamik und Wärmekraftmaschinen",
      "en": "Laws of thermodynamics and heat engines",
      "fr": "Principes de la thermodynamique et moteurs thermiques",
      "it": "Principi della termodinamica e macchine termiche"
    },
    "prerequisites": [
      "physik-mechanik-mechanische-energie-und-energieerhaltung",
      "physik-waerme-teilchenmodell-temperatur-und-waerme"
    ]
  },
  {
    "unitId": "physik-waerme-ideales-gas-und-kinetische-gastheorie",
    "subjectId": "physics",
    "topicId": "physik-waerme",
    "order": 4,
    "titles": {
      "de": "Ideales Gas und kinetische Gastheorie",
      "en": "Ideal gas and kinetic theory of gases",
      "fr": "Gaz parfait et théorie cinétique des gaz",
      "it": "Gas ideale e teoria cinetica dei gas"
    },
    "prerequisites": [
      "physik-mechanik-druck-und-auftrieb",
      "physik-mechanik-mechanische-energie-und-energieerhaltung",
      "physik-waerme-teilchenmodell-temperatur-und-waerme"
    ]
  },
  {
    "unitId": "deutsch-woerter-nomen",
    "subjectId": "german",
    "topicId": "deutsch-woerter",
    "order": 1,
    "titles": {
      "de": "Nomen: Geschlecht und Zahl",
      "en": "Nouns: gender and number",
      "fr": "Le nom : genre et nombre",
      "it": "Il nome: genere e numero"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-woerter-verb",
    "subjectId": "german",
    "topicId": "deutsch-woerter",
    "order": 2,
    "titles": {
      "de": "Verb: Grundform und Personalform",
      "en": "Verbs: infinitive and finite form",
      "fr": "Le verbe : infinitif et forme conjuguée",
      "it": "Il verbo: infinito e forma personale"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-woerter-adjektiv",
    "subjectId": "german",
    "topicId": "deutsch-woerter",
    "order": 3,
    "titles": {
      "de": "Adjektiv und Vergleichsformen",
      "en": "Adjectives and comparison",
      "fr": "L'adjectif et ses degrés",
      "it": "L'aggettivo e i gradi di comparazione"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-woerter-pronomen",
    "subjectId": "german",
    "topicId": "deutsch-woerter",
    "order": 4,
    "titles": {
      "de": "Pronomen und Artikel",
      "en": "Pronouns and articles",
      "fr": "Pronoms et articles",
      "it": "Pronomi e articoli"
    },
    "prerequisites": [
      "deutsch-woerter-nomen"
    ]
  },
  {
    "unitId": "deutsch-woerter-partikel",
    "subjectId": "german",
    "topicId": "deutsch-woerter",
    "order": 5,
    "titles": {
      "de": "Partikeln: Präposition, Konjunktion und weitere",
      "en": "Particles: prepositions, conjunctions and others",
      "fr": "Mots invariables : prépositions, conjonctions et autres",
      "it": "Parole invariabili: preposizioni, congiunzioni e altre"
    },
    "prerequisites": [
      "deutsch-woerter-adjektiv",
      "deutsch-woerter-nomen",
      "deutsch-woerter-verb"
    ]
  },
  {
    "unitId": "deutsch-woerter-wortbausteine",
    "subjectId": "german",
    "topicId": "deutsch-woerter",
    "order": 6,
    "titles": {
      "de": "Wortstamm, Vor- und Nachsilben",
      "en": "Word stems, prefixes and suffixes",
      "fr": "Radical, préfixes et suffixes",
      "it": "Radice, prefissi e suffissi"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-formen-praesens-praeteritum-perfekt",
    "subjectId": "german",
    "topicId": "deutsch-formen",
    "order": 1,
    "titles": {
      "de": "Präsens, Präteritum und Perfekt",
      "en": "Present, simple past and present perfect",
      "fr": "Présent, prétérit et passé composé",
      "it": "Presente, preterito e passato prossimo"
    },
    "prerequisites": [
      "deutsch-woerter-verb"
    ]
  },
  {
    "unitId": "deutsch-formen-plusquamperfekt-futur",
    "subjectId": "german",
    "topicId": "deutsch-formen",
    "order": 2,
    "titles": {
      "de": "Plusquamperfekt und Futur",
      "en": "Past perfect and future",
      "fr": "Plus-que-parfait et futur",
      "it": "Trapassato prossimo e futuro"
    },
    "prerequisites": [
      "deutsch-formen-praesens-praeteritum-perfekt"
    ]
  },
  {
    "unitId": "deutsch-formen-faelle",
    "subjectId": "german",
    "topicId": "deutsch-formen",
    "order": 3,
    "titles": {
      "de": "Die vier Fälle",
      "en": "The four cases",
      "fr": "Les quatre cas",
      "it": "I quattro casi"
    },
    "prerequisites": [
      "deutsch-woerter-nomen",
      "deutsch-woerter-pronomen"
    ]
  },
  {
    "unitId": "deutsch-formen-modus",
    "subjectId": "german",
    "topicId": "deutsch-formen",
    "order": 4,
    "titles": {
      "de": "Indikativ, Imperativ und Konjunktiv",
      "en": "Indicative, imperative and subjunctive",
      "fr": "Indicatif, impératif et subjonctif",
      "it": "Indicativo, imperativo e congiuntivo"
    },
    "prerequisites": [
      "deutsch-formen-praesens-praeteritum-perfekt"
    ]
  },
  {
    "unitId": "deutsch-formen-aktiv-passiv",
    "subjectId": "german",
    "topicId": "deutsch-formen",
    "order": 5,
    "titles": {
      "de": "Aktiv und Passiv",
      "en": "Active and passive",
      "fr": "Actif et passif",
      "it": "Attivo e passivo"
    },
    "prerequisites": [
      "deutsch-formen-plusquamperfekt-futur"
    ]
  },
  {
    "unitId": "deutsch-saetze-satzarten",
    "subjectId": "german",
    "topicId": "deutsch-saetze",
    "order": 1,
    "titles": {
      "de": "Satzarten und Satzschlusszeichen",
      "en": "Sentence types and end punctuation",
      "fr": "Types de phrases et ponctuation finale",
      "it": "Tipi di frase e punteggiatura finale"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-saetze-verbale-teile",
    "subjectId": "german",
    "topicId": "deutsch-saetze",
    "order": 2,
    "titles": {
      "de": "Verbale Teile im Satz",
      "en": "Verb parts in a sentence",
      "fr": "Les parties verbales de la phrase",
      "it": "Le parti verbali della frase"
    },
    "prerequisites": [
      "deutsch-formen-praesens-praeteritum-perfekt",
      "deutsch-woerter-verb"
    ]
  },
  {
    "unitId": "deutsch-saetze-satzglieder-proben",
    "subjectId": "german",
    "topicId": "deutsch-saetze",
    "order": 3,
    "titles": {
      "de": "Satzglieder und Proben",
      "en": "Sentence parts and tests",
      "fr": "Groupes de la phrase et manipulations",
      "it": "Componenti della frase e prove"
    },
    "prerequisites": [
      "deutsch-woerter-verb"
    ]
  },
  {
    "unitId": "deutsch-saetze-subjekt-objekte",
    "subjectId": "german",
    "topicId": "deutsch-saetze",
    "order": 4,
    "titles": {
      "de": "Subjekt und Objekte",
      "en": "Subject and objects",
      "fr": "Sujet et compléments d'objet",
      "it": "Soggetto e complementi oggetto"
    },
    "prerequisites": [
      "deutsch-formen-faelle",
      "deutsch-saetze-satzglieder-proben"
    ]
  },
  {
    "unitId": "deutsch-saetze-praepositionalgruppen",
    "subjectId": "german",
    "topicId": "deutsch-saetze",
    "order": 5,
    "titles": {
      "de": "Präpositionalgruppen",
      "en": "Prepositional phrases",
      "fr": "Groupes prépositionnels",
      "it": "Gruppi preposizionali"
    },
    "prerequisites": [
      "deutsch-saetze-subjekt-objekte",
      "deutsch-woerter-partikel"
    ]
  },
  {
    "unitId": "deutsch-saetze-haupt-nebensatz",
    "subjectId": "german",
    "topicId": "deutsch-saetze",
    "order": 6,
    "titles": {
      "de": "Hauptsatz und Nebensatz",
      "en": "Main and subordinate clauses",
      "fr": "Proposition principale et subordonnée",
      "it": "Proposizione principale e subordinata"
    },
    "prerequisites": [
      "deutsch-saetze-verbale-teile",
      "deutsch-woerter-partikel",
      "deutsch-woerter-pronomen"
    ]
  },
  {
    "unitId": "deutsch-saetze-komma",
    "subjectId": "german",
    "topicId": "deutsch-saetze",
    "order": 7,
    "titles": {
      "de": "Kommaregeln",
      "en": "Comma rules",
      "fr": "Règles de la virgule",
      "it": "Regole della virgola"
    },
    "prerequisites": [
      "deutsch-saetze-satzarten",
      "deutsch-woerter-verb"
    ]
  },
  {
    "unitId": "deutsch-saetze-direkte-rede",
    "subjectId": "german",
    "topicId": "deutsch-saetze",
    "order": 8,
    "titles": {
      "de": "Direkte und indirekte Rede",
      "en": "Direct and reported speech",
      "fr": "Discours direct et indirect",
      "it": "Discorso diretto e indiretto"
    },
    "prerequisites": [
      "deutsch-saetze-satzarten"
    ]
  },
  {
    "unitId": "deutsch-rechtschreibung-buchstaben-abc",
    "subjectId": "german",
    "topicId": "deutsch-rechtschreibung",
    "order": 1,
    "titles": {
      "de": "Buchstaben und Alphabet",
      "en": "Letters and the alphabet",
      "fr": "Les lettres et l'alphabet",
      "it": "Le lettere e l'alfabeto"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-rechtschreibung-silben",
    "subjectId": "german",
    "topicId": "deutsch-rechtschreibung",
    "order": 2,
    "titles": {
      "de": "Silben, Reime und Worttrennung",
      "en": "Syllables, rhymes and hyphenation",
      "fr": "Syllabes, rimes et coupure des mots",
      "it": "Sillabe, rime e divisione delle parole"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-rechtschreibung-gross-klein",
    "subjectId": "german",
    "topicId": "deutsch-rechtschreibung",
    "order": 3,
    "titles": {
      "de": "Gross- und Kleinschreibung",
      "en": "Capital and small letters",
      "fr": "Majuscules et minuscules",
      "it": "Maiuscole e minuscole"
    },
    "prerequisites": [
      "deutsch-woerter-nomen"
    ]
  },
  {
    "unitId": "deutsch-rechtschreibung-lange-kurze-vokale",
    "subjectId": "german",
    "topicId": "deutsch-rechtschreibung",
    "order": 4,
    "titles": {
      "de": "Lange und kurze Vokale",
      "en": "Long and short vowels",
      "fr": "Voyelles longues et brèves",
      "it": "Vocali lunghe e brevi"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-rechtschreibung-s-ss",
    "subjectId": "german",
    "topicId": "deutsch-rechtschreibung",
    "order": 5,
    "titles": {
      "de": "s oder ss",
      "en": "s or ss",
      "fr": "s ou ss",
      "it": "s o ss"
    },
    "prerequisites": [
      "deutsch-rechtschreibung-lange-kurze-vokale"
    ]
  },
  {
    "unitId": "deutsch-rechtschreibung-aehnliche-laute",
    "subjectId": "german",
    "topicId": "deutsch-rechtschreibung",
    "order": 6,
    "titles": {
      "de": "Ähnlich klingende Laute",
      "en": "Similar-sounding letters",
      "fr": "Sons qui se ressemblent",
      "it": "Suoni simili"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-rechtschreibung-das-dass",
    "subjectId": "german",
    "topicId": "deutsch-rechtschreibung",
    "order": 7,
    "titles": {
      "de": "das oder dass",
      "en": "das or dass",
      "fr": "das ou dass",
      "it": "das o dass"
    },
    "prerequisites": [
      "deutsch-woerter-pronomen"
    ]
  },
  {
    "unitId": "deutsch-rechtschreibung-getrennt-zusammen",
    "subjectId": "german",
    "topicId": "deutsch-rechtschreibung",
    "order": 8,
    "titles": {
      "de": "Getrennt- und Zusammenschreibung",
      "en": "Writing words separately or together",
      "fr": "Mots soudés ou séparés",
      "it": "Parole unite o separate"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-wortschatz-wortfelder",
    "subjectId": "german",
    "topicId": "deutsch-wortschatz",
    "order": 1,
    "titles": {
      "de": "Wortfelder und treffende Wörter",
      "en": "Word fields and the right word",
      "fr": "Champs lexicaux et mot juste",
      "it": "Campi semantici e parola giusta"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-wortschatz-ober-unterbegriffe",
    "subjectId": "german",
    "topicId": "deutsch-wortschatz",
    "order": 2,
    "titles": {
      "de": "Ober- und Unterbegriffe",
      "en": "General and specific terms",
      "fr": "Termes génériques et spécifiques",
      "it": "Iperonimi e iponimi"
    },
    "prerequisites": [
      "deutsch-wortschatz-wortfelder"
    ]
  },
  {
    "unitId": "deutsch-wortschatz-redewendungen",
    "subjectId": "german",
    "topicId": "deutsch-wortschatz",
    "order": 3,
    "titles": {
      "de": "Redewendungen und bildhafte Ausdrücke",
      "en": "Idioms and figurative expressions",
      "fr": "Expressions idiomatiques et imagées",
      "it": "Modi di dire ed espressioni figurate"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-wortschatz-fremdwoerter",
    "subjectId": "german",
    "topicId": "deutsch-wortschatz",
    "order": 4,
    "titles": {
      "de": "Fremdwörter und Fachbegriffe",
      "en": "Loanwords and technical terms",
      "fr": "Mots étrangers et termes techniques",
      "it": "Parole straniere e termini tecnici"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-texte-woerter-saetze-lesen",
    "subjectId": "german",
    "topicId": "deutsch-texte",
    "order": 1,
    "titles": {
      "de": "Wörter und Sätze lesen",
      "en": "Reading words and sentences",
      "fr": "Lire des mots et des phrases",
      "it": "Leggere parole e frasi"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-texte-informationen",
    "subjectId": "german",
    "topicId": "deutsch-texte",
    "order": 2,
    "titles": {
      "de": "Informationen entnehmen",
      "en": "Finding information",
      "fr": "Trouver des informations",
      "it": "Trovare informazioni"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-texte-kernaussage",
    "subjectId": "german",
    "topicId": "deutsch-texte",
    "order": 3,
    "titles": {
      "de": "Absicht, Pointe und Kernaussage",
      "en": "Purpose, punchline and main message",
      "fr": "Intention, chute et message principal",
      "it": "Intenzione, battuta finale e messaggio centrale"
    },
    "prerequisites": [
      "deutsch-texte-informationen"
    ]
  },
  {
    "unitId": "deutsch-texte-textsorten",
    "subjectId": "german",
    "topicId": "deutsch-texte",
    "order": 4,
    "titles": {
      "de": "Textsorten, Realität und Fiktion",
      "en": "Text types, fact and fiction",
      "fr": "Types de textes, réalité et fiction",
      "it": "Tipi di testo, realtà e finzione"
    },
    "prerequisites": [
      "deutsch-texte-informationen"
    ]
  },
  {
    "unitId": "deutsch-texte-deuten",
    "subjectId": "german",
    "topicId": "deutsch-texte",
    "order": 5,
    "titles": {
      "de": "Zwischen den Zeilen lesen",
      "en": "Reading between the lines",
      "fr": "Lire entre les lignes",
      "it": "Leggere tra le righe"
    },
    "prerequisites": [
      "deutsch-texte-kernaussage"
    ]
  },
  {
    "unitId": "deutsch-texte-argumentation",
    "subjectId": "german",
    "topicId": "deutsch-texte",
    "order": 6,
    "titles": {
      "de": "Argumentation untersuchen",
      "en": "Analysing arguments",
      "fr": "Analyser une argumentation",
      "it": "Analizzare un'argomentazione"
    },
    "prerequisites": [
      "deutsch-texte-kernaussage"
    ]
  },
  {
    "unitId": "deutsch-literatur-erzaehlende-texte",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 1,
    "titles": {
      "de": "Märchen, Fabel, Sage und Kurzgeschichte",
      "en": "Fairy tales, fables, legends and short stories",
      "fr": "Conte, fable, légende et nouvelle",
      "it": "Fiaba, favola, leggenda e racconto breve"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-literatur-erzaehler",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 2,
    "titles": {
      "de": "Erzähler und Erzählperspektive",
      "en": "Narrator and point of view",
      "fr": "Narrateur et point de vue",
      "it": "Narratore e punto di vista"
    },
    "prerequisites": [
      "deutsch-literatur-erzaehlende-texte"
    ]
  },
  {
    "unitId": "deutsch-literatur-erzaehltechnik",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 3,
    "titles": {
      "de": "Erzähltechnik",
      "en": "Narrative technique",
      "fr": "Techniques narratives",
      "it": "Tecniche narrative"
    },
    "prerequisites": [
      "deutsch-literatur-erzaehler"
    ]
  },
  {
    "unitId": "deutsch-literatur-stilmittel",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 4,
    "titles": {
      "de": "Bildhafte Sprache und Stilmittel",
      "en": "Figurative language and stylistic devices",
      "fr": "Langage imagé et figures de style",
      "it": "Linguaggio figurato e mezzi stilistici"
    },
    "prerequisites": [
      "deutsch-wortschatz-redewendungen"
    ]
  },
  {
    "unitId": "deutsch-literatur-rhetorik",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 5,
    "titles": {
      "de": "Rhetorische Figuren",
      "en": "Rhetorical figures",
      "fr": "Figures de rhétorique",
      "it": "Figure retoriche"
    },
    "prerequisites": [
      "deutsch-literatur-stilmittel"
    ]
  },
  {
    "unitId": "deutsch-literatur-gedichte",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 6,
    "titles": {
      "de": "Gedichte: Vers, Strophe und Reim",
      "en": "Poems: line, stanza and rhyme",
      "fr": "Poèmes : vers, strophe et rime",
      "it": "Poesie: verso, strofa e rima"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-literatur-lyrik-formen",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 7,
    "titles": {
      "de": "Metrum und Gedichtformen",
      "en": "Metre and verse forms",
      "fr": "Mètre et formes poétiques",
      "it": "Metrica e forme poetiche"
    },
    "prerequisites": [
      "deutsch-literatur-gedichte"
    ]
  },
  {
    "unitId": "deutsch-literatur-drama",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 8,
    "titles": {
      "de": "Drama: Aufbau und Formen",
      "en": "Drama: structure and forms",
      "fr": "Le théâtre : structure et formes",
      "it": "Il dramma: struttura e forme"
    },
    "prerequisites": [
      "deutsch-literatur-erzaehlende-texte"
    ]
  },
  {
    "unitId": "deutsch-literatur-epochen-barock-klassik",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 9,
    "titles": {
      "de": "Literatur des 17. und 18. Jahrhunderts",
      "en": "Literature of the 17th and 18th centuries",
      "fr": "La littérature des XVIIe et XVIIIe siècles",
      "it": "La letteratura del Seicento e del Settecento"
    },
    "prerequisites": [
      "deutsch-literatur-erzaehlende-texte",
      "deutsch-literatur-gedichte"
    ]
  },
  {
    "unitId": "deutsch-literatur-epochen-romantik-gegenwart",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 10,
    "titles": {
      "de": "Literatur vom 19. Jahrhundert bis heute",
      "en": "Literature from the 19th century to today",
      "fr": "La littérature du XIXe siècle à nos jours",
      "it": "La letteratura dall'Ottocento a oggi"
    },
    "prerequisites": [
      "deutsch-literatur-epochen-barock-klassik"
    ]
  },
  {
    "unitId": "deutsch-literatur-antike-mythen",
    "subjectId": "german",
    "topicId": "deutsch-literatur",
    "order": 11,
    "titles": {
      "de": "Antike Mythen und ihre Nachwirkung",
      "en": "Ancient myths and their legacy",
      "fr": "Les mythes antiques et leur héritage",
      "it": "I miti antichi e la loro eredità"
    },
    "prerequisites": [
      "deutsch-literatur-erzaehlende-texte"
    ]
  },
  {
    "unitId": "deutsch-sprache-sprachvarietaeten",
    "subjectId": "german",
    "topicId": "deutsch-sprache",
    "order": 1,
    "titles": {
      "de": "Standardsprache, Mundart und Sprachvarietäten",
      "en": "Standard German, dialect and language varieties",
      "fr": "Allemand standard, dialecte et variétés",
      "it": "Tedesco standard, dialetto e varietà linguistiche"
    },
    "prerequisites": []
  },
  {
    "unitId": "deutsch-sprache-kommunikation",
    "subjectId": "german",
    "topicId": "deutsch-sprache",
    "order": 2,
    "titles": {
      "de": "Kommunikation untersuchen",
      "en": "Analysing communication",
      "fr": "Analyser la communication",
      "it": "Analizzare la comunicazione"
    },
    "prerequisites": [
      "deutsch-sprache-sprachvarietaeten"
    ]
  },
  {
    "unitId": "deutsch-sprache-sprachwandel",
    "subjectId": "german",
    "topicId": "deutsch-sprache",
    "order": 3,
    "titles": {
      "de": "Sprachgeschichte und Sprachwandel",
      "en": "Language history and change",
      "fr": "Histoire et évolution de la langue",
      "it": "Storia ed evoluzione della lingua"
    },
    "prerequisites": [
      "deutsch-sprache-sprachvarietaeten"
    ]
  },
  {
    "unitId": "deutsch-sprache-sprachsystem",
    "subjectId": "german",
    "topicId": "deutsch-sprache",
    "order": 4,
    "titles": {
      "de": "Sprache als System",
      "en": "Language as a system",
      "fr": "La langue comme système",
      "it": "La lingua come sistema"
    },
    "prerequisites": [
      "deutsch-saetze-haupt-nebensatz",
      "deutsch-woerter-wortbausteine"
    ]
  },
  {
    "unitId": "englisch-alltag-zahlen-und-ordnungszahlen",
    "subjectId": "english",
    "topicId": "englisch-alltag",
    "order": 1,
    "titles": {
      "de": "Zahlen und Ordnungszahlen",
      "en": "Numbers and ordinal numbers",
      "fr": "Nombres et nombres ordinaux",
      "it": "Numeri e numeri ordinali"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-alltag-haus-zimmer-und-ortsangaben",
    "subjectId": "english",
    "topicId": "englisch-alltag",
    "order": 2,
    "titles": {
      "de": "Haus, Zimmer und Ortsangaben",
      "en": "House, rooms and places",
      "fr": "Maison, pièces et indications de lieu",
      "it": "Casa, stanze e indicazioni di luogo"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-alltag-farben-kleidung-und-besitz",
    "subjectId": "english",
    "topicId": "englisch-alltag",
    "order": 3,
    "titles": {
      "de": "Farben, Kleidung und Besitz",
      "en": "Colours, clothes and belongings",
      "fr": "Couleurs, vêtements et possession",
      "it": "Colori, vestiti e appartenenza"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-alltag-uhrzeit-und-tagesablauf",
    "subjectId": "english",
    "topicId": "englisch-alltag",
    "order": 4,
    "titles": {
      "de": "Uhrzeit und Tagesablauf",
      "en": "Time and daily routine",
      "fr": "L'heure et la journée",
      "it": "L'ora e la giornata"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-alltag-monate-und-datum",
    "subjectId": "english",
    "topicId": "englisch-alltag",
    "order": 5,
    "titles": {
      "de": "Monate und Datum",
      "en": "Months and dates",
      "fr": "Mois et dates",
      "it": "Mesi e date"
    },
    "prerequisites": [
      "englisch-alltag-zahlen-und-ordnungszahlen"
    ]
  },
  {
    "unitId": "englisch-alltag-wochentage-und-alltagstaetigkeiten",
    "subjectId": "english",
    "topicId": "englisch-alltag",
    "order": 6,
    "titles": {
      "de": "Wochentage und Alltagstätigkeiten",
      "en": "Days of the week and everyday activities",
      "fr": "Jours de la semaine et activités quotidiennes",
      "it": "Giorni della settimana e attività quotidiane"
    },
    "prerequisites": [
      "englisch-verben-present-progressive-und-zukunft"
    ]
  },
  {
    "unitId": "englisch-alltag-von-frueher-erzaehlen",
    "subjectId": "english",
    "topicId": "englisch-alltag",
    "order": 7,
    "titles": {
      "de": "Von früher erzählen",
      "en": "Talking about the past",
      "fr": "Raconter le passé",
      "it": "Raccontare il passato"
    },
    "prerequisites": [
      "englisch-verben-perfekt-und-zeitformen-unterscheiden"
    ]
  },
  {
    "unitId": "englisch-essen-essen-anbieten-und-bestellen",
    "subjectId": "english",
    "topicId": "englisch-essen",
    "order": 1,
    "titles": {
      "de": "Essen anbieten und bestellen",
      "en": "Offering and ordering food",
      "fr": "Proposer et commander à manger",
      "it": "Offrire e ordinare da mangiare"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-essen-lebensmittel-und-lieblingsessen",
    "subjectId": "english",
    "topicId": "englisch-essen",
    "order": 2,
    "titles": {
      "de": "Lebensmittel und Lieblingsessen",
      "en": "Food and favourite meals",
      "fr": "Aliments et plats préférés",
      "it": "Alimenti e cibi preferiti"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-essen-einkaufen-und-taschengeld",
    "subjectId": "english",
    "topicId": "englisch-essen",
    "order": 3,
    "titles": {
      "de": "Einkaufen und Taschengeld",
      "en": "Shopping and pocket money",
      "fr": "Faire des achats et argent de poche",
      "it": "Fare acquisti e paghetta"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-essen-kochen-und-esskultur",
    "subjectId": "english",
    "topicId": "englisch-essen",
    "order": 4,
    "titles": {
      "de": "Kochen und Esskultur",
      "en": "Cooking and food culture",
      "fr": "Cuisine et culture culinaire",
      "it": "Cucina e cultura del cibo"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-essen-produkte-wert-und-konsum",
    "subjectId": "english",
    "topicId": "englisch-essen",
    "order": 5,
    "titles": {
      "de": "Produkte, Wert und Konsum",
      "en": "Products, value and consumption",
      "fr": "Produits, valeur et consommation",
      "it": "Prodotti, valore e consumo"
    },
    "prerequisites": [
      "englisch-verben-das-passiv"
    ]
  },
  {
    "unitId": "englisch-freizeit-spielsachen-hobbys-und-faehigkeiten",
    "subjectId": "english",
    "topicId": "englisch-freizeit",
    "order": 1,
    "titles": {
      "de": "Spielsachen, Hobbys und Fähigkeiten",
      "en": "Toys, hobbies and abilities",
      "fr": "Jouets, loisirs et capacités",
      "it": "Giocattoli, hobby e capacità"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-freizeit-das-wochenende",
    "subjectId": "english",
    "topicId": "englisch-freizeit",
    "order": 2,
    "titles": {
      "de": "Das Wochenende",
      "en": "The weekend",
      "fr": "Le week-end",
      "it": "Il fine settimana"
    },
    "prerequisites": [
      "englisch-saetze-ja-nein-fragen-und-question-tags",
      "englisch-verben-simple-past-und-past-progressive"
    ]
  },
  {
    "unitId": "englisch-freizeit-sport-und-wettkaempfe",
    "subjectId": "english",
    "topicId": "englisch-freizeit",
    "order": 3,
    "titles": {
      "de": "Sport und Wettkämpfe",
      "en": "Sport and competitions",
      "fr": "Sport et compétitions",
      "it": "Sport e gare"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-freizeit-fernsehen-und-internet",
    "subjectId": "english",
    "topicId": "englisch-freizeit",
    "order": 4,
    "titles": {
      "de": "Fernsehen und Internet",
      "en": "Television and the internet",
      "fr": "Télévision et internet",
      "it": "Televisione e internet"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-freizeit-partys-und-feste",
    "subjectId": "english",
    "topicId": "englisch-freizeit",
    "order": 5,
    "titles": {
      "de": "Partys und Feste",
      "en": "Parties and celebrations",
      "fr": "Fêtes et célébrations",
      "it": "Feste e celebrazioni"
    },
    "prerequisites": [
      "englisch-verben-present-progressive-und-zukunft"
    ]
  },
  {
    "unitId": "englisch-freizeit-buecher-filme-und-science-fiction",
    "subjectId": "english",
    "topicId": "englisch-freizeit",
    "order": 6,
    "titles": {
      "de": "Bücher, Filme und Science-Fiction",
      "en": "Books, films and science fiction",
      "fr": "Livres, films et science-fiction",
      "it": "Libri, film e fantascienza"
    },
    "prerequisites": [
      "englisch-verben-perfekt-und-zeitformen-unterscheiden"
    ]
  },
  {
    "unitId": "englisch-freizeit-musik-und-auffuehrungen",
    "subjectId": "english",
    "topicId": "englisch-freizeit",
    "order": 7,
    "titles": {
      "de": "Musik und Aufführungen",
      "en": "Music and performances",
      "fr": "Musique et spectacles",
      "it": "Musica e spettacoli"
    },
    "prerequisites": [
      "englisch-freizeit-spielsachen-hobbys-und-faehigkeiten"
    ]
  },
  {
    "unitId": "englisch-freizeit-feste-und-traditionen",
    "subjectId": "english",
    "topicId": "englisch-freizeit",
    "order": 8,
    "titles": {
      "de": "Feste und Traditionen",
      "en": "Festivals and traditions",
      "fr": "Festivals et traditions",
      "it": "Festività e tradizioni"
    },
    "prerequisites": [
      "englisch-freizeit-partys-und-feste"
    ]
  },
  {
    "unitId": "englisch-gesellschaft-regeln-in-schule-und-alltag",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 1,
    "titles": {
      "de": "Regeln in Schule und Alltag",
      "en": "Rules at school and in everyday life",
      "fr": "Règles à l'école et au quotidien",
      "it": "Regole a scuola e nella vita quotidiana"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-gesellschaft-weltraum-und-raumfahrt",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 2,
    "titles": {
      "de": "Weltraum und Raumfahrt",
      "en": "Space and space travel",
      "fr": "L'espace et les voyages spatiaux",
      "it": "Lo spazio e i viaggi spaziali"
    },
    "prerequisites": [
      "englisch-natur-tiere"
    ]
  },
  {
    "unitId": "englisch-gesellschaft-geschichten-mythen-und-gedichte",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 3,
    "titles": {
      "de": "Geschichten, Mythen und Gedichte",
      "en": "Stories, myths and poems",
      "fr": "Histoires, mythes et poèmes",
      "it": "Storie, miti e poesie"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-gesellschaft-leben-und-technik-der-zukunft",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 4,
    "titles": {
      "de": "Leben und Technik der Zukunft",
      "en": "Life and technology in the future",
      "fr": "La vie et la technologie du futur",
      "it": "Vita e tecnologia del futuro"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-gesellschaft-kunst-und-ausstellungen",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 5,
    "titles": {
      "de": "Kunst und Ausstellungen",
      "en": "Art and exhibitions",
      "fr": "L'art et les expositions",
      "it": "Arte e mostre"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-gesellschaft-helfen-und-sich-engagieren",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 6,
    "titles": {
      "de": "Helfen und sich engagieren",
      "en": "Helping and getting involved",
      "fr": "Aider et s'engager",
      "it": "Aiutare e impegnarsi"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-gesellschaft-erfindungen-und-leistungen",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 7,
    "titles": {
      "de": "Erfindungen und Leistungen",
      "en": "Inventions and achievements",
      "fr": "Inventions et réalisations",
      "it": "Invenzioni e conquiste"
    },
    "prerequisites": [
      "englisch-verben-das-passiv"
    ]
  },
  {
    "unitId": "englisch-gesellschaft-kulturerbe-schuetzen",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 8,
    "titles": {
      "de": "Kulturerbe schützen",
      "en": "Protecting cultural heritage",
      "fr": "Protéger le patrimoine culturel",
      "it": "Proteggere il patrimonio culturale"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-gesellschaft-wissenschaftliche-forschung",
    "subjectId": "english",
    "topicId": "englisch-gesellschaft",
    "order": 9,
    "titles": {
      "de": "Wissenschaftliche Forschung",
      "en": "Scientific research",
      "fr": "La recherche scientifique",
      "it": "La ricerca scientifica"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-gesundheit-gesicht-beschwerden-und-erste-hilfe",
    "subjectId": "english",
    "topicId": "englisch-gesundheit",
    "order": 1,
    "titles": {
      "de": "Gesicht, Beschwerden und Erste Hilfe",
      "en": "Face, ailments and first aid",
      "fr": "Visage, maux et premiers secours",
      "it": "Viso, disturbi e primo soccorso"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-gesundheit-sport-und-gesunde-gewohnheiten",
    "subjectId": "english",
    "topicId": "englisch-gesundheit",
    "order": 2,
    "titles": {
      "de": "Sport und gesunde Gewohnheiten",
      "en": "Sport and healthy habits",
      "fr": "Sport et habitudes saines",
      "it": "Sport e abitudini sane"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-ich-familie",
    "subjectId": "english",
    "topicId": "englisch-ich",
    "order": 1,
    "titles": {
      "de": "Die Familie",
      "en": "The family",
      "fr": "La famille",
      "it": "La famiglia"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-ich-begruessen-und-sich-vorstellen",
    "subjectId": "english",
    "topicId": "englisch-ich",
    "order": 2,
    "titles": {
      "de": "Begrüssen und sich vorstellen",
      "en": "Greetings and introducing yourself",
      "fr": "Saluer et se présenter",
      "it": "Salutare e presentarsi"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-ich-aussehen-und-koerpersprache",
    "subjectId": "english",
    "topicId": "englisch-ich",
    "order": 3,
    "titles": {
      "de": "Aussehen und Körpersprache",
      "en": "Appearance and body language",
      "fr": "Apparence et langage corporel",
      "it": "Aspetto e linguaggio del corpo"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-ich-personen-und-charakter-beschreiben",
    "subjectId": "english",
    "topicId": "englisch-ich",
    "order": 4,
    "titles": {
      "de": "Personen und Charakter beschreiben",
      "en": "Describing people and character",
      "fr": "Décrire des personnes et leur caractère",
      "it": "Descrivere persone e carattere"
    },
    "prerequisites": [
      "englisch-woerter-adjektive-steigerung-und-wortbildung"
    ]
  },
  {
    "unitId": "englisch-ich-gefuehle-ratschlaege-und-durchhalten",
    "subjectId": "english",
    "topicId": "englisch-ich",
    "order": 5,
    "titles": {
      "de": "Gefühle, Ratschläge und Durchhalten",
      "en": "Feelings, advice and perseverance",
      "fr": "Sentiments, conseils et persévérance",
      "it": "Sentimenti, consigli e perseveranza"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-ich-frueher-und-heute",
    "subjectId": "english",
    "topicId": "englisch-ich",
    "order": 6,
    "titles": {
      "de": "Früher und heute",
      "en": "Then and now",
      "fr": "Autrefois et aujourd'hui",
      "it": "Prima e oggi"
    },
    "prerequisites": [
      "englisch-verben-simple-past-und-past-progressive"
    ]
  },
  {
    "unitId": "englisch-kommunizieren-texte-verstehen-und-im-alltag-kommunizieren",
    "subjectId": "english",
    "topicId": "englisch-kommunizieren",
    "order": 1,
    "titles": {
      "de": "Texte verstehen und im Alltag kommunizieren",
      "en": "Understanding texts and everyday communication",
      "fr": "Comprendre des textes et communiquer au quotidien",
      "it": "Capire testi e comunicare nella vita quotidiana"
    },
    "prerequisites": [
      "englisch-saetze-ja-nein-fragen-und-question-tags",
      "englisch-verben-present-progressive-und-zukunft",
      "englisch-woerter-adjektive-steigerung-und-wortbildung"
    ]
  },
  {
    "unitId": "englisch-laute-alphabet-und-anlaute",
    "subjectId": "english",
    "topicId": "englisch-laute",
    "order": 1,
    "titles": {
      "de": "Alphabet und Anlaute",
      "en": "Alphabet and initial sounds",
      "fr": "Alphabet et sons initiaux",
      "it": "Alfabeto e suoni iniziali"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-laute-kurze-und-lange-vokale",
    "subjectId": "english",
    "topicId": "englisch-laute",
    "order": 2,
    "titles": {
      "de": "Kurze und lange Vokale",
      "en": "Short and long vowels",
      "fr": "Voyelles courtes et longues",
      "it": "Vocali brevi e lunghe"
    },
    "prerequisites": [
      "englisch-laute-alphabet-und-anlaute"
    ]
  },
  {
    "unitId": "englisch-laute-aussprache-im-wort-und-im-redefluss",
    "subjectId": "english",
    "topicId": "englisch-laute",
    "order": 3,
    "titles": {
      "de": "Aussprache im Wort und im Redefluss",
      "en": "Pronunciation in words and connected speech",
      "fr": "Prononciation des mots et de la parole enchaînée",
      "it": "Pronuncia delle parole e del parlato continuo"
    },
    "prerequisites": [
      "englisch-laute-alphabet-und-anlaute",
      "englisch-laute-betonung-satzmelodie-und-pausen",
      "englisch-verben-simple-past-und-past-progressive",
      "englisch-woerter-this-these-und-plural-von-nomen"
    ]
  },
  {
    "unitId": "englisch-laute-betonung-satzmelodie-und-pausen",
    "subjectId": "english",
    "topicId": "englisch-laute",
    "order": 4,
    "titles": {
      "de": "Betonung, Satzmelodie und Pausen",
      "en": "Stress, intonation and pauses",
      "fr": "Accent, intonation et pauses",
      "it": "Accento, intonazione e pause"
    },
    "prerequisites": [
      "englisch-laute-alphabet-und-anlaute"
    ]
  },
  {
    "unitId": "englisch-natur-tiere",
    "subjectId": "english",
    "topicId": "englisch-natur",
    "order": 1,
    "titles": {
      "de": "Tiere",
      "en": "Animals",
      "fr": "Les animaux",
      "it": "Gli animali"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-natur-wetter-und-jahreszeiten",
    "subjectId": "english",
    "topicId": "englisch-natur",
    "order": 2,
    "titles": {
      "de": "Wetter und Jahreszeiten",
      "en": "Weather and seasons",
      "fr": "La météo et les saisons",
      "it": "Il tempo e le stagioni"
    },
    "prerequisites": [
      "englisch-saetze-aussagen-aufforderungen-und-ausrufe"
    ]
  },
  {
    "unitId": "englisch-natur-bauernhof-und-landwirtschaft",
    "subjectId": "english",
    "topicId": "englisch-natur",
    "order": 3,
    "titles": {
      "de": "Bauernhof und Landwirtschaft",
      "en": "Farm and agriculture",
      "fr": "La ferme et l'agriculture",
      "it": "La fattoria e l'agricoltura"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-natur-naturparks-und-naturschutz",
    "subjectId": "english",
    "topicId": "englisch-natur",
    "order": 4,
    "titles": {
      "de": "Naturparks und Naturschutz",
      "en": "Nature parks and conservation",
      "fr": "Parcs naturels et protection de la nature",
      "it": "Parchi naturali e tutela della natura"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-natur-umweltschutz-und-klima",
    "subjectId": "english",
    "topicId": "englisch-natur",
    "order": 5,
    "titles": {
      "de": "Umweltschutz und Klima",
      "en": "Environmental protection and climate",
      "fr": "Protection de l'environnement et climat",
      "it": "Tutela dell'ambiente e clima"
    },
    "prerequisites": [
      "englisch-natur-wetter-und-jahreszeiten"
    ]
  },
  {
    "unitId": "englisch-natur-unwetter-und-naturkatastrophen",
    "subjectId": "english",
    "topicId": "englisch-natur",
    "order": 6,
    "titles": {
      "de": "Unwetter und Naturkatastrophen",
      "en": "Storms and natural disasters",
      "fr": "Intempéries et catastrophes naturelles",
      "it": "Maltempo e catastrofi naturali"
    },
    "prerequisites": [
      "englisch-verben-simple-past-und-past-progressive"
    ]
  },
  {
    "unitId": "englisch-saetze-fragen-mit-fragewoertern",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 1,
    "titles": {
      "de": "Fragen mit Fragewörtern",
      "en": "Questions with question words",
      "fr": "Questions avec des mots interrogatifs",
      "it": "Domande con parole interrogative"
    },
    "prerequisites": [
      "englisch-alltag-zahlen-und-ordnungszahlen",
      "englisch-verben-be-have-und-simple-present",
      "englisch-woerter-praepositionen-adverbien-und-verbindungswoerter",
      "englisch-woerter-this-these-und-plural-von-nomen"
    ]
  },
  {
    "unitId": "englisch-saetze-aussagen-aufforderungen-und-ausrufe",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 2,
    "titles": {
      "de": "Aussagen, Aufforderungen und Ausrufe",
      "en": "Statements, commands and exclamations",
      "fr": "Affirmations, ordres et exclamations",
      "it": "Affermazioni, ordini ed esclamazioni"
    },
    "prerequisites": [
      "englisch-saetze-fragen-mit-fragewoertern",
      "englisch-saetze-ja-nein-fragen-und-question-tags",
      "englisch-verben-be-have-und-simple-present"
    ]
  },
  {
    "unitId": "englisch-saetze-ja-nein-fragen-und-question-tags",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 3,
    "titles": {
      "de": "Ja/Nein-Fragen und Question Tags",
      "en": "Yes/no questions and question tags",
      "fr": "Questions fermées et question tags",
      "it": "Domande sì/no e question tag"
    },
    "prerequisites": [
      "englisch-verben-be-have-und-simple-present"
    ]
  },
  {
    "unitId": "englisch-saetze-bedingung-gegensatz-und-zweck",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 4,
    "titles": {
      "de": "Bedingung, Gegensatz und Zweck",
      "en": "Condition, contrast and purpose",
      "fr": "Condition, opposition et but",
      "it": "Condizione, contrasto e scopo"
    },
    "prerequisites": [
      "englisch-verben-infinitiv-und-gerundium",
      "englisch-verben-present-progressive-und-zukunft",
      "englisch-woerter-praepositionen-adverbien-und-verbindungswoerter"
    ]
  },
  {
    "unitId": "englisch-saetze-satzglieder-und-satzbau",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 5,
    "titles": {
      "de": "Satzglieder und Satzbau",
      "en": "Sentence elements and structure",
      "fr": "Éléments et structure de la phrase",
      "it": "Elementi e struttura della frase"
    },
    "prerequisites": [
      "englisch-saetze-ja-nein-fragen-und-question-tags",
      "englisch-verben-be-have-und-simple-present"
    ]
  },
  {
    "unitId": "englisch-saetze-nominalsaetze-und-indirekte-rede",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 6,
    "titles": {
      "de": "Nominalsätze und indirekte Rede",
      "en": "Noun clauses and reported speech",
      "fr": "Complétives et discours indirect",
      "it": "Proposizioni nominali e discorso indiretto"
    },
    "prerequisites": [
      "englisch-verben-be-have-und-simple-present"
    ]
  },
  {
    "unitId": "englisch-saetze-relativsaetze-und-appositionssaetze",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 7,
    "titles": {
      "de": "Relativsätze und Appositionssätze",
      "en": "Relative and appositive clauses",
      "fr": "Relatives et propositions appositives",
      "it": "Relative e proposizioni appositive"
    },
    "prerequisites": [
      "englisch-saetze-nominalsaetze-und-indirekte-rede"
    ]
  },
  {
    "unitId": "englisch-saetze-irreale-bedingungen-und-konjunktiv",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 8,
    "titles": {
      "de": "Irreale Bedingungen und Konjunktiv",
      "en": "Unreal conditionals and the subjunctive",
      "fr": "Conditions irréelles et subjonctif",
      "it": "Condizionali irreali e congiuntivo"
    },
    "prerequisites": [
      "englisch-saetze-bedingung-gegensatz-und-zweck",
      "englisch-verben-perfekt-und-zeitformen-unterscheiden"
    ]
  },
  {
    "unitId": "englisch-saetze-hervorhebung-inversion-und-ellipse",
    "subjectId": "english",
    "topicId": "englisch-saetze",
    "order": 9,
    "titles": {
      "de": "Hervorhebung, Inversion und Ellipse",
      "en": "Emphasis, inversion and ellipsis",
      "fr": "Mise en relief, inversion et ellipse",
      "it": "Enfasi, inversione ed ellissi"
    },
    "prerequisites": [
      "englisch-saetze-irreale-bedingungen-und-konjunktiv",
      "englisch-saetze-relativsaetze-und-appositionssaetze",
      "englisch-verben-infinitiv-und-gerundium"
    ]
  },
  {
    "unitId": "englisch-schule-schulzimmer-und-schulsachen",
    "subjectId": "english",
    "topicId": "englisch-schule",
    "order": 1,
    "titles": {
      "de": "Schulzimmer und Schulsachen",
      "en": "Classroom and school things",
      "fr": "La salle de classe et le matériel scolaire",
      "it": "L'aula e il materiale scolastico"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-schule-berufe-und-arbeitsorte",
    "subjectId": "english",
    "topicId": "englisch-schule",
    "order": 2,
    "titles": {
      "de": "Berufe und Arbeitsorte",
      "en": "Jobs and workplaces",
      "fr": "Métiers et lieux de travail",
      "it": "Professioni e luoghi di lavoro"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-schule-orte-faecher-und-regeln-in-der-schule",
    "subjectId": "english",
    "topicId": "englisch-schule",
    "order": 3,
    "titles": {
      "de": "Orte, Fächer und Regeln in der Schule",
      "en": "Places, subjects and rules at school",
      "fr": "Lieux, matières et règles à l'école",
      "it": "Luoghi, materie e regole a scuola"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-schule-berufsplaene-und-bewerbung",
    "subjectId": "english",
    "topicId": "englisch-schule",
    "order": 4,
    "titles": {
      "de": "Berufspläne und Bewerbung",
      "en": "Career plans and job applications",
      "fr": "Projets professionnels et candidatures",
      "it": "Progetti professionali e candidature"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-schule-lernmethoden-und-schulabschluss",
    "subjectId": "english",
    "topicId": "englisch-schule",
    "order": 5,
    "titles": {
      "de": "Lernmethoden und Schulabschluss",
      "en": "Learning methods and leaving school",
      "fr": "Méthodes d'apprentissage et fin de la scolarité",
      "it": "Metodi di studio e fine della scuola"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-schule-schulalltag-kurse-und-clubs",
    "subjectId": "english",
    "topicId": "englisch-schule",
    "order": 6,
    "titles": {
      "de": "Schulalltag, Kurse und Clubs",
      "en": "School life, courses and clubs",
      "fr": "Vie scolaire, cours et clubs",
      "it": "Vita scolastica, corsi e club"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-unterwegs-laender-sprachen-und-umgangsformen",
    "subjectId": "english",
    "topicId": "englisch-unterwegs",
    "order": 1,
    "titles": {
      "de": "Länder, Sprachen und Umgangsformen",
      "en": "Countries, languages and manners",
      "fr": "Pays, langues et bonnes manières",
      "it": "Paesi, lingue e buone maniere"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-unterwegs-verkehrsmittel-und-schulweg",
    "subjectId": "english",
    "topicId": "englisch-unterwegs",
    "order": 2,
    "titles": {
      "de": "Verkehrsmittel und Schulweg",
      "en": "Means of transport and the way to school",
      "fr": "Moyens de transport et chemin de l'école",
      "it": "Mezzi di trasporto e tragitto per la scuola"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-unterwegs-von-ausfluegen-und-ferien-erzaehlen",
    "subjectId": "english",
    "topicId": "englisch-unterwegs",
    "order": 3,
    "titles": {
      "de": "Von Ausflügen und Ferien erzählen",
      "en": "Talking about trips and holidays",
      "fr": "Raconter des excursions et des vacances",
      "it": "Raccontare gite e vacanze"
    },
    "prerequisites": [
      "englisch-verben-simple-past-und-past-progressive"
    ]
  },
  {
    "unitId": "englisch-unterwegs-orte-in-der-stadt-und-wege",
    "subjectId": "english",
    "topicId": "englisch-unterwegs",
    "order": 4,
    "titles": {
      "de": "Orte in der Stadt und Wegbeschreibungen",
      "en": "Places in town and directions",
      "fr": "Lieux en ville et itinéraires",
      "it": "Luoghi in città e indicazioni stradali"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-unterwegs-reisen-planen-und-sehenswuerdigkeiten",
    "subjectId": "english",
    "topicId": "englisch-unterwegs",
    "order": 5,
    "titles": {
      "de": "Reisen planen und Sehenswürdigkeiten",
      "en": "Planning trips and sights",
      "fr": "Planifier un voyage et curiosités",
      "it": "Pianificare viaggi e attrazioni"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-unterwegs-kulturelle-vielfalt-und-austausch",
    "subjectId": "english",
    "topicId": "englisch-unterwegs",
    "order": 6,
    "titles": {
      "de": "Kulturelle Vielfalt und Austausch",
      "en": "Cultural diversity and exchange",
      "fr": "Diversité culturelle et échange",
      "it": "Diversità culturale e scambio"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-unterwegs-bahnreisen-und-seereisen",
    "subjectId": "english",
    "topicId": "englisch-unterwegs",
    "order": 7,
    "titles": {
      "de": "Bahnreisen und Seereisen",
      "en": "Train journeys and sea voyages",
      "fr": "Voyages en train et en mer",
      "it": "Viaggi in treno e per mare"
    },
    "prerequisites": []
  },
  {
    "unitId": "englisch-verben-be-have-und-simple-present",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 1,
    "titles": {
      "de": "be, have und das Simple Present",
      "en": "be, have and the simple present",
      "fr": "be, have et le simple present",
      "it": "be, have e il simple present"
    },
    "prerequisites": [
      "englisch-alltag-farben-kleidung-und-besitz",
      "englisch-essen-lebensmittel-und-lieblingsessen"
    ]
  },
  {
    "unitId": "englisch-verben-pflicht-erlaubnis-und-vermutung",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 2,
    "titles": {
      "de": "Pflicht, Erlaubnis und Vermutung mit Modalverben",
      "en": "Obligation, permission and deduction with modal verbs",
      "fr": "Obligation, permission et supposition avec les verbes modaux",
      "it": "Obbligo, permesso e supposizione con i verbi modali"
    },
    "prerequisites": [
      "englisch-saetze-aussagen-aufforderungen-und-ausrufe"
    ]
  },
  {
    "unitId": "englisch-verben-faehigkeiten-bitten-und-ratschlaege",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 3,
    "titles": {
      "de": "Fähigkeiten, Bitten und Ratschläge mit Modalverben",
      "en": "Ability, requests and advice with modal verbs",
      "fr": "Capacité, demandes et conseils avec les verbes modaux",
      "it": "Capacità, richieste e consigli con i verbi modali"
    },
    "prerequisites": [
      "englisch-essen-essen-anbieten-und-bestellen"
    ]
  },
  {
    "unitId": "englisch-verben-present-progressive-und-zukunft",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 4,
    "titles": {
      "de": "Present Progressive und die Zukunft",
      "en": "Present progressive and the future",
      "fr": "Present progressive et le futur",
      "it": "Present progressive e il futuro"
    },
    "prerequisites": [
      "englisch-saetze-fragen-mit-fragewoertern"
    ]
  },
  {
    "unitId": "englisch-verben-simple-past-und-past-progressive",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 5,
    "titles": {
      "de": "Simple Past, Past Progressive und used to",
      "en": "Simple past, past progressive and used to",
      "fr": "Simple past, past progressive et used to",
      "it": "Simple past, past progressive e used to"
    },
    "prerequisites": [
      "englisch-saetze-ja-nein-fragen-und-question-tags",
      "englisch-verben-present-progressive-und-zukunft"
    ]
  },
  {
    "unitId": "englisch-verben-infinitiv-und-gerundium",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 6,
    "titles": {
      "de": "Infinitiv und Gerundium",
      "en": "Infinitive and gerund",
      "fr": "Infinitif et gérondif",
      "it": "Infinito e gerundio"
    },
    "prerequisites": [
      "englisch-verben-be-have-und-simple-present",
      "englisch-verben-pflicht-erlaubnis-und-vermutung"
    ]
  },
  {
    "unitId": "englisch-verben-perfekt-und-zeitformen-unterscheiden",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 7,
    "titles": {
      "de": "Present Perfect, Past Perfect und die Wahl der Zeitform",
      "en": "Present perfect, past perfect and choosing the tense",
      "fr": "Present perfect, past perfect et le choix du temps",
      "it": "Present perfect, past perfect e la scelta del tempo"
    },
    "prerequisites": [
      "englisch-verben-present-progressive-und-zukunft",
      "englisch-verben-simple-past-und-past-progressive"
    ]
  },
  {
    "unitId": "englisch-verben-das-passiv",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 8,
    "titles": {
      "de": "Das Passiv",
      "en": "The passive",
      "fr": "Le passif",
      "it": "Il passivo"
    },
    "prerequisites": [
      "englisch-verben-be-have-und-simple-present",
      "englisch-verben-infinitiv-und-gerundium",
      "englisch-verben-perfekt-und-zeitformen-unterscheiden",
      "englisch-verben-pflicht-erlaubnis-und-vermutung",
      "englisch-verben-present-progressive-und-zukunft",
      "englisch-verben-simple-past-und-past-progressive"
    ]
  },
  {
    "unitId": "englisch-verben-partizipien-und-partizipialkonstruktionen",
    "subjectId": "english",
    "topicId": "englisch-verben",
    "order": 9,
    "titles": {
      "de": "Partizipien und Partizipialkonstruktionen",
      "en": "Participles and participle clauses",
      "fr": "Participes et propositions participiales",
      "it": "Participi e costruzioni participiali"
    },
    "prerequisites": [
      "englisch-verben-infinitiv-und-gerundium"
    ]
  },
  {
    "unitId": "englisch-woerter-this-these-und-plural-von-nomen",
    "subjectId": "english",
    "topicId": "englisch-woerter",
    "order": 1,
    "titles": {
      "de": "this, these und Plural von Nomen",
      "en": "this, these and plural nouns",
      "fr": "this, these et pluriel des noms",
      "it": "this, these e plurale dei nomi"
    },
    "prerequisites": [
      "englisch-natur-tiere",
      "englisch-verben-be-have-und-simple-present"
    ]
  },
  {
    "unitId": "englisch-woerter-adjektive-steigerung-und-wortbildung",
    "subjectId": "english",
    "topicId": "englisch-woerter",
    "order": 2,
    "titles": {
      "de": "Adjektive, Steigerung und Wortbildung",
      "en": "Adjectives, comparison and word formation",
      "fr": "Adjectifs, comparaison et formation des mots",
      "it": "Aggettivi, comparazione e formazione delle parole"
    },
    "prerequisites": [
      "englisch-ich-aussehen-und-koerpersprache"
    ]
  },
  {
    "unitId": "englisch-woerter-praepositionen-adverbien-und-verbindungswoerter",
    "subjectId": "english",
    "topicId": "englisch-woerter",
    "order": 3,
    "titles": {
      "de": "Präpositionen, Adverbien und Verbindungswörter",
      "en": "Prepositions, adverbs and linking words",
      "fr": "Prépositions, adverbes et mots de liaison",
      "it": "Preposizioni, avverbi e connettivi"
    },
    "prerequisites": [
      "englisch-alltag-haus-zimmer-und-ortsangaben",
      "englisch-verben-be-have-und-simple-present"
    ]
  },
  {
    "unitId": "englisch-woerter-besitz-und-pronomen",
    "subjectId": "english",
    "topicId": "englisch-woerter",
    "order": 4,
    "titles": {
      "de": "Besitz und Pronomen",
      "en": "Possession and pronouns",
      "fr": "Possession et pronoms",
      "it": "Possesso e pronomi"
    },
    "prerequisites": []
  }
]
