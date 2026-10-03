/*
 * The star map's demo-only words (#131): the Demo notice over the map, the
 * placeholder star's note in the star card, and the long nebula names the
 * `longNames` switch checks labels with. They used to sit in the `starmap`
 * locale files, which are bundled into the application; now only the
 * preview, the bench and the tests that inject the demo sky add them, under
 * the same keys (`starmap:demo.*`) the view already asks for.
 */
import i18n from '@/i18n'
import type { SupportedLanguage } from '@/i18n/languages'

export const DEMO_SKY_STRINGS: Record<SupportedLanguage, { notice: string; emptyStar: string; longNebula: string }> = {
  en: {
    notice: 'Demo · Sample content and progress',
    emptyStar: 'Placeholder star · demo content, no chapter.',
    longNebula: 'Fractions, equations and proportional reasoning {{index}}',
  },
  de: {
    notice: 'Demo · Beispieldaten und Lernfortschritt',
    emptyStar: 'Platzhalterstern · Demo-Inhalt, kein Kapitel.',
    longNebula: 'Bruchrechnung, Gleichungen und proportionales Denken {{index}}',
  },
  fr: {
    notice: 'Démo · Contenu et progression fictifs',
    emptyStar: 'Étoile fictive · contenu de démonstration, sans chapitre.',
    longNebula: 'Fractions, équations et raisonnement proportionnel {{index}}',
  },
  it: {
    notice: 'Demo · Contenuti e progressi di esempio',
    emptyStar: 'Stella segnaposto · contenuto dimostrativo, nessun capitolo.',
    longNebula: 'Frazioni, equazioni e ragionamento proporzionale {{index}}',
  },
}

/** Adds the demo words to the app's `starmap` namespace. Idempotent. */
export function addDemoSkyStrings(): void {
  for (const [language, demo] of Object.entries(DEMO_SKY_STRINGS)) {
    i18n.addResourceBundle(language, 'starmap', { demo }, true, true)
  }
}
