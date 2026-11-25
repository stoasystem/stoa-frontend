/*
 * The mathematics stars of the real knowledge base, for the star cluster
 * prototype (`src/dev/clusters.html`). Dev only: nothing under src/dev reaches
 * the production bundle (#131, docs/agents/design-preview.md).
 *
 * Copied from stoasystem/stoa-backend, src/stoa/services/knowledge_base_stars.json:
 * the 98 stars with subject_id "mathematics", descriptions left out.
 * That file is derived from https://github.com/xiaoyang111222/cn-math-taxonomy, licensed
 * CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/):
 * attribution required, no commercial use.
 *
 * Generated; to refresh, copy again rather than editing by hand.
 */

export type KnowledgeBaseStar = {
  unitId: string
  topicId: string
  order: number
  titles: { de: string; en: string; fr: string; it: string }
  prerequisites: string[]
}

export const MATH_KNOWLEDGE_BASE_SOURCE = { repository: 'https://github.com/xiaoyang111222/cn-math-taxonomy', licence: 'CC BY-NC 4.0' } as const

export const MATH_KNOWLEDGE_BASE: readonly KnowledgeBaseStar[] = [
  {
    "unitId": "brueche-brueche-kuerzen-addieren-und-subtrahieren",
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
  }
]
