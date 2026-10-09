import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const LANGUAGES = ['de', 'en', 'fr', 'it'] as const

function lookup(namespace: string, language: string, key: string): string {
  const file = fileURLToPath(new URL(`../../src/i18n/locales/${language}/${namespace}.json`, import.meta.url))
  let value: unknown = JSON.parse(readFileSync(file, 'utf8'))
  for (const part of key.split('.')) {
    value = (value as Record<string, unknown> | undefined)?.[part]
  }
  if (typeof value !== 'string') throw new Error(`${language}/${namespace}.json has no string at ${key}`)
  return value
}

/**
 * A screen string in any of the four languages, read from the app's own
 * locale files, so a smoke never breaks on a reworded label and never passes
 * on a string the app does not show.
 */
export function anyLanguage(namespace: string, key: string, { exact = true } = {}): RegExp {
  const escaped = LANGUAGES.map((language) => lookup(namespace, language, key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return exact ? new RegExp(`^(${escaped.join('|')})$`) : new RegExp(`(${escaped.join('|')})`)
}
