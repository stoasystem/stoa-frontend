import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import importX from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import stoaApiPath from './scripts/eslint/api-path-template.mjs'
import stoaRegexpSafari from './scripts/eslint/regexp-safari.mjs'

// One `stoa` plugin for the repository's own rules: flat config refuses two
// different plugins under the same name.
const stoa = { rules: { ...stoaApiPath.rules, ...stoaRegexpSafari.rules } }

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // '.claude' holds agent worktrees: whole copies of this repository, whose
    // scripts lint as if they were ours and fail the gate on somebody else's file.
    // `tests/e2e` holds no suite any more (card 024). The one file left is a
    // source the Phase 476 sandbox evidence chain digests, kept because deleting
    // it breaks that chain - not something to run, type-check or lint.
    // `.e2e-dist` is the dist e2e's published copy of dist (#29): built code, not ours to lint.
    ignores: ['dist', 'dist-bench', 'node_modules', 'backend', '.claude', 'tests/e2e', '.e2e-dist'],
  },
  {
    files: [
      '*.config.{js,ts}',
      'eslint.config.js',
      'scripts/**/*.mjs',
    ],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    // Without this, an import of a file that does not exist lints clean: tsc -b
    // only sees the files its projects include, and nothing else looks (card 041).
    // The resolver reads the same tsconfigs as tsc, so '@/...' resolves exactly
    // as it does for the compiler and for Vite's alias.
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: 'tsconfig.json',
        }),
      ],
    },
    rules: {
      // 'virtual:' ids exist only inside a Vite plugin; no resolver can see them.
      'import-x/no-unresolved': ['error', { ignore: ['^virtual:'] }],
    },
  },
  {
    // Every value in a service path goes through apiPath, so an id decoded from
    // the address cannot leave its own segment (#251).
    files: ['src/services/**/*.{ts,tsx}'],
    plugins: { stoa },
    rules: {
      'stoa/api-path-template': 'error',
    },
  },
  {
    // What src holds must parse on iPadOS 15: no regex lookbehind or `v` flag (#398).
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: { stoa },
    rules: {
      'stoa/regexp-safari': 'error',
    },
  },
)
