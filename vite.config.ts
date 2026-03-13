/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

function i18nLocalesPlugin(): import('vite').Plugin {
  const localesDir = path.resolve(__dirname, 'src/locales')

  return {
    name: 'i18n-locales',

    configureServer(server) {
      server.middlewares.use('/locales', (req, res, next) => {
        const requested = path.resolve(localesDir, (req.url ?? '').replace(/^\//, ''))
        const relative = path.relative(localesDir, requested)
        if (relative.startsWith('..') || path.isAbsolute(relative) || !requested.endsWith('.json')) {
          return void next()
        }
        const stream = fs.createReadStream(requested)
        stream.on('error', () => {
          res.statusCode = 404
          res.end()
        })
        res.setHeader('Content-Type', 'application/json')
        stream.pipe(res)
      })

      server.watcher.add(path.join(localesDir, '*.json'))
      server.watcher.on('change', (changedPath) => {
        if (changedPath.startsWith(localesDir) && changedPath.endsWith('.json')) {
          server.hot.send({ type: 'full-reload' })
        }
      })
    },

    generateBundle() {
      const entries = fs.readdirSync(localesDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          this.emitFile({
            type: 'asset',
            fileName: `locales/${entry.name}`,
            source: fs.readFileSync(path.join(localesDir, entry.name), 'utf8'),
          })
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    i18nLocalesPlugin(),
    compression({ algorithm: 'brotliCompress' }),
    compression({ algorithm: 'gzip' }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/')) {
            return 'react'
          }
          if (
            id.includes('node_modules/i18next') ||
            id.includes('node_modules/react-i18next') ||
            id.includes('node_modules/i18next-browser-languagedetector') ||
            id.includes('node_modules/i18next-http-backend') ||
            id.includes('node_modules/cross-fetch')
          ) {
            return 'i18n'
          }
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'leaflet'
          }
          if (id.includes('node_modules/@stripe')) {
            return 'stripe'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
