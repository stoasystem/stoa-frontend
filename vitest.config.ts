import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Kept separate from vite.config.ts so test tooling can never influence the
// production bundle or the release verification that inspects it.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/component/**/*.test.{ts,tsx}'],
    // Vitest's 5 s default is too tight for a full run on a busy machine (#133).
    // The longest user flows (mePage, passwordChange, askHost, adminAccounts,
    // the star map's nebula focus walk) take 0.5-2 s alone and 2-5 s in an
    // idle full run, which already puts a worker on every core; with other
    // work on the machine they reached 5-9 s and timed out with nothing wrong.
    // Three times the default still fails a real hang in 15 s. A test that
    // needs longer says so itself (designPreviewExcluded, demoData).
    testTimeout: 15_000,
  },
})
