/**
 * The `stoa/api-path-template` lint rule keeps service paths on `apiPath`
 * (#251): a plain template that inserts a value after a `/` is refused, so a
 * new service call cannot quietly send an unencoded id again.
 */
import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import stoaApiPath from '../../scripts/eslint/api-path-template.mjs'

function problems(code: string) {
  const linter = new Linter({ configType: 'flat' })
  return linter
    .verify(
      code,
      [
        {
          files: ['**/*.ts'],
          languageOptions: { parser: tseslint.parser },
          plugins: { stoa: stoaApiPath },
          rules: { 'stoa/api-path-template': 'error' },
        },
      ],
      { filename: 'src/services/example.ts' },
    )
    .map((message) => message.ruleId)
}

describe('stoa/api-path-template', () => {
  it.each([
    'httpClient.get(`/conversations/${id}`)',
    'httpClient.get(`/conversations/${encodeURIComponent(id)}/messages`)',
    'fetch(`${apiBaseUrl}/conversations/${id}/messages/stream`)',
    'const path = `/practice/${subject}/${topic}/path`',
    'httpClient.get(other`/conversations/${id}`)',
    "httpClient.get('/conversations/' + id)",
    'httpClient.get(`/lessons/` + id)',
    'httpClient.get(apiPath`/conversations/${encodeURIComponent(id)}`)',
  ])('refuses %s', (code) => {
    expect(problems(code)).toContain('stoa/api-path-template')
  })

  it.each([
    'httpClient.get(apiPath`/conversations/${id}`)',
    'fetch(`${apiBaseUrl}${apiPath`/conversations/${id}/messages/stream`}`)',
    'fetch(`${apiBaseUrl}/auth/refresh`)',
    "httpClient.get('/admin/moderation/cases' + (query ? `?${query}` : ''))",
    'const header = `Bearer ${token}`',
    'const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}`',
  ])('allows %s', (code) => {
    expect(problems(code)).toEqual([])
  })
})
