import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          const normalizedId = id.replaceAll('\\', '/')

          // Naming a chunk here overrides where a dynamic import would place a
          // dependency. KaTeX is loaded on demand, so it is left unnamed and
          // travels with the screen that needs it.
          if (normalizedId.includes('/katex/')) return undefined

          if (
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/scheduler/') ||
            normalizedId.includes('/@floating-ui/')
          ) {
            return 'vendor-react'
          }

          if (
            normalizedId.includes('/react-router/') ||
            normalizedId.includes('/react-router-dom/') ||
            normalizedId.includes('/@tanstack/react-query/') ||
            normalizedId.includes('/zustand/')
          ) {
            return 'vendor-router-state'
          }

          if (
            normalizedId.includes('/i18next/') ||
            normalizedId.includes('/react-i18next/')
          ) {
            return 'vendor-i18n'
          }

          if (
            normalizedId.includes('/aws-amplify/') ||
            normalizedId.includes('/@aws-amplify/')
          ) {
            return 'vendor-aws'
          }

          if (
            normalizedId.includes('/@radix-ui/') ||
            normalizedId.includes('/lucide-react/') ||
            normalizedId.includes('/sonner/') ||
            normalizedId.includes('/class-variance-authority/') ||
            normalizedId.includes('/tailwind-merge/')
          ) {
            return 'vendor-ui'
          }

          if (normalizedId.includes('/axios/')) {
            return 'vendor-http'
          }

          return 'vendor'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
