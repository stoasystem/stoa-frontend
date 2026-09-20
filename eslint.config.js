import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // '.claude' holds agent worktrees: whole copies of this repository, whose
    // scripts lint as if they were ours and fail the gate on somebody else's file.
    ignores: ['dist', 'node_modules', 'backend', '.claude'],
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
)
