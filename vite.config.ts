/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const isTest = Boolean(process.env.VITEST)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    !isTest &&
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Metas SMART',
          short_name: 'Metas',
          description: 'Convierte tus metas SMART en hábitos pequeños, medibles y constantes.',
          lang: 'es',
          dir: 'ltr',
          start_url: '/inicio',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#faf7f2',
          theme_color: '#faf7f2',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Solo archivos estáticos de la app. Los datos (Supabase) nunca se guardan en caché:
          // la app necesita conexión para leer y guardar información.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        },
      }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, host: true },
  build: {
    rolldownOptions: {
      output: {
        // Librerías en chunks propios: cambian poco y el navegador las conserva entre versiones.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'ui', test: /node_modules[\\/](@radix-ui|lucide-react|sonner|@tanstack)[\\/]/ },
            { name: 'forms', test: /node_modules[\\/](zod|react-hook-form|@hookform)[\\/]/ },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|es-toolkit|immer|reselect|@reduxjs|react-redux|decimal\.js-light|eventemitter3)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'supabase/tests/**/*.test.ts'],
    css: false,
    // Zona con horario de verano, para que las pruebas de fechas lo cubran.
    env: { TZ: 'America/New_York' },
  },
})
