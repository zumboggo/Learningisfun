// @ts-expect-error build-only output policy
import privateEpisodeOutput from './scripts/private-output-policy.mjs';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/Learningisfun/',
  plugins: [
    react(),
    tailwindcss(),
    privateEpisodeOutput(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Learning is Fun',
        short_name: 'Learning',
        description: 'Offline-first educational flashcard and reading app',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/Learningisfun/',
        scope: '/Learningisfun/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['stories/**'],
        navigateFallbackDenylist: [/\/stories\//],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/pdf\.worker\.min-[^/]+\.mjs$/,
            handler: 'CacheFirst',
            options: { cacheName: 'pdf-import-worker', expiration: { maxEntries: 2 } },
          },

        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
